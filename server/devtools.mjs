/**
 * Cửa xem cơ sở dữ liệu dành cho tài khoản developer.
 *
 * Mục đích là để người phát triển soi thẳng vào dữ liệu thật mà không phải mở
 * tệp SQLite trên máy chủ. Vì vậy phải chặn chặt: đây là một đường HTTP công
 * khai, ai đoán được mật khẩu dev là chạy được mọi câu lệnh gửi lên.
 *
 * Ba lớp chặn, lớp nào cũng cần:
 *   1. Phải đăng nhập bằng tài khoản vai trò dev (kiểm ở bảng định tuyến).
 *   2. Câu truy vấn phải là một lệnh SELECT đơn, không có dấu chấm phẩy thứ hai.
 *   3. Chạy trên một kết nối MỞ Ở CHẾ ĐỘ CHỈ ĐỌC riêng, nên kể cả có lọt một
 *      lệnh ghi qua hai lớp trên thì SQLite vẫn từ chối ghi.
 *
 * Lớp thứ ba là lớp quan trọng nhất: hai lớp đầu đều là đọc chuỗi và đoán ý,
 * còn lớp này là ràng buộc thật của chính SQLite.
 */
import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { all, get, run, logActivity, DB_PATH } from './db.mjs';
import { hashPassword } from './auth.mjs';

const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

/* Kết nối chỉ đọc riêng cho khung truy vấn. Mở một lần rồi dùng lại. */
let readonlyDb = null;
const roDb = () => {
  if (!readonlyDb) readonlyDb = new DatabaseSync(DB_PATH, { readOnly: true });
  return readonlyDb;
};

/** Số dòng tối đa một câu truy vấn được trả về, tránh kéo cả bảng khổng lồ */
const MAX_ROWS = 500;

/* ------------------------------------------------------------------ */
/* Xem cấu trúc                                                        */
/* ------------------------------------------------------------------ */

/** Danh sách bảng kèm số dòng và các cột của từng bảng */
export const listTables = () => {
  const names = all(`SELECT name FROM sqlite_master
                     WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
                     ORDER BY name`).map((r) => r.name);
  return names.map((name) => ({
    name,
    rowCount: get(`SELECT COUNT(*) AS n FROM "${name}"`)?.n ?? 0,
    columns: all(`PRAGMA table_info("${name}")`).map((c) => ({
      name: c.name, type: c.type, notNull: !!c.notnull, pk: !!c.pk,
    })),
  }));
};

const isRealTable = (name) =>
  !!get(`SELECT 1 AS ok FROM sqlite_master
         WHERE type IN ('table', 'view') AND name = ? AND name NOT LIKE 'sqlite_%'`, name);

/**
 * Đọc dữ liệu một bảng theo trang.
 *
 * Tên bảng không thể truyền bằng tham số ? của SQLite nên phải ghép vào chuỗi.
 * Vì vậy tên bảng chỉ được nhận sau khi đã đối chiếu với danh sách bảng có thật
 * trong sqlite_master — người gọi không tự nghĩ ra được tên nào khác.
 */
export const readTable = (name, { limit = 50, offset = 0 } = {}) => {
  if (!isRealTable(name)) fail('Không có bảng nào tên như vậy.', 404);
  const n = Math.min(Math.max(Number(limit) || 50, 1), MAX_ROWS);
  const o = Math.max(Number(offset) || 0, 0);
  return {
    name,
    total: get(`SELECT COUNT(*) AS n FROM "${name}"`).n,
    limit: n,
    offset: o,
    rows: all(`SELECT * FROM "${name}" LIMIT ? OFFSET ?`, n, o),
  };
};

/* ------------------------------------------------------------------ */
/* Khung chạy truy vấn                                                 */
/* ------------------------------------------------------------------ */

/** Bỏ chú thích và khoảng trắng thừa để xét câu lệnh trên phần chữ thật */
const stripComments = (sql) => sql
  .replace(/--[^\n]*/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .trim();

export const runQuery = (devUser, rawSql) => {
  const sql = stripComments(String(rawSql ?? ''));
  if (!sql) fail('Chưa nhập câu truy vấn.');

  /* Chỉ một lệnh duy nhất: bỏ dấu chấm phẩy cuối rồi cấm mọi dấu còn lại */
  const body = sql.replace(/;\s*$/, '');
  if (body.includes(';')) fail('Mỗi lần chỉ chạy được một câu lệnh.');
  if (!/^(SELECT|WITH)\b/i.test(body)) fail('Khung này chỉ chạy câu SELECT để đọc dữ liệu.');
  if (/\b(ATTACH|DETACH|PRAGMA|VACUUM)\b/i.test(body)) fail('Câu lệnh chứa từ khoá không được phép.');

  const t0 = Date.now();
  let rows;
  try {
    /* Chạy trên kết nối chỉ đọc: mọi lệnh ghi đều bị SQLite chặn ở đây */
    rows = roDb().prepare(body).all();
  } catch (err) {
    fail(`Câu lệnh sai: ${err.message}`);
  }

  const cut = rows.length > MAX_ROWS;
  logActivity(devUser.id, 'dev_truy_van', body.slice(0, 300));
  return {
    columns: rows.length ? Object.keys(rows[0]) : [],
    rows: cut ? rows.slice(0, MAX_ROWS) : rows,
    rowCount: rows.length,
    truncated: cut,
    ms: Date.now() - t0,
  };
};

/* ------------------------------------------------------------------ */
/* Quản trị tài khoản                                                  */
/* ------------------------------------------------------------------ */

export const listAccounts = () => all(`
  SELECT u.id, u.name, u.email, u.role, u.status,
         COALESCE(c.code, '') AS classCode,
         COALESCE(t.code, '') AS teamCode,
         u.last_login_at AS lastLoginAt, u.created_at AS createdAt,
         (u.password_hash IS NOT NULL) AS hasPassword,
         (SELECT COUNT(*) FROM sessions s
           WHERE s.user_id = u.id AND s.expires_at > datetime('now')) AS activeSessions
  FROM users u
  LEFT JOIN classes c ON c.id = u.class_id
  LEFT JOIN teams   t ON t.id = u.team_id
  ORDER BY u.role, u.name`);

/** Khoá hoặc mở khoá một tài khoản; khoá thì thu hồi luôn mọi phiên đang mở */
export const setAccountStatus = (devUser, userId, status) => {
  if (!['hoat_dong', 'khoa'].includes(status)) fail('Trạng thái không hợp lệ.');
  if (userId === devUser.id) fail('Không tự khoá tài khoản đang đăng nhập được.');
  if (!get('SELECT 1 AS ok FROM users WHERE id = ?', userId)) fail('Không tìm thấy tài khoản.', 404);

  run('UPDATE users SET status = ? WHERE id = ?', status, userId);
  if (status === 'khoa') run('DELETE FROM sessions WHERE user_id = ?', userId);
  logActivity(devUser.id, 'dev_doi_trang_thai', `${userId} → ${status}`);
  return { ok: true, userId, status };
};

/**
 * Đặt lại mật khẩu cho một tài khoản.
 *
 * Mật khẩu cũ KHÔNG đọc lại được — cột password_hash chỉ giữ chuỗi băm một
 * chiều. Vì vậy khi học sinh quên mật khẩu thì cách duy nhất là đặt một mật
 * khẩu mới rồi báo lại cho em đó, chứ không có nút "xem mật khẩu" nào cả.
 *
 * Không truyền mật khẩu thì tự sinh một chuỗi ngẫu nhiên. Chuỗi này được trả
 * về đúng MỘT lần trong câu trả lời của lời gọi này; sau đó nó chỉ còn tồn tại
 * dưới dạng băm, hỏi lại máy chủ cũng không ra.
 */
export const resetAccountPassword = (devUser, userId, newPassword) => {
  if (userId === devUser.id) {
    fail('Mật khẩu của chính mình thì đổi ở trang Tài khoản, không đổi ở đây.');
  }
  const u = get('SELECT id, name, email FROM users WHERE id = ?', userId);
  if (!u) fail('Không tìm thấy tài khoản.', 404);

  const mk = newPassword ? String(newPassword) : randomBytes(6).toString('base64url');
  if (mk.length < 6) fail('Mật khẩu phải dài ít nhất 6 kí tự.');

  run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(mk), userId);
  /* Đặt lại mật khẩu thì mọi phiên đang mở của người đó phải mất hiệu lực,
     kể cả phiên trên máy khác — nếu không thì ai đang mượn máy vẫn dùng tiếp được. */
  run('DELETE FROM sessions WHERE user_id = ?', userId);

  logActivity(devUser.id, 'dev_dat_lai_mat_khau', `${u.email}`);
  return { userId, email: u.email, name: u.name, password: mk };
};

/** Nhật ký thao tác gần đây, để lần lại ai đã làm gì */
export const recentLogs = (limit = 100) => all(`
  SELECT l.id, l.action, l.detail, l.created_at AS createdAt,
         COALESCE(u.name, '—') AS userName, l.user_id AS userId
  FROM activity_logs l
  LEFT JOIN users u ON u.id = l.user_id
  ORDER BY l.id DESC LIMIT ?`, Math.min(Math.max(Number(limit) || 100, 1), MAX_ROWS));

/** Vài con số tổng quan hiện ngay đầu trang developer */
export const overview = () => ({
  dbPath: DB_PATH,
  users: get('SELECT COUNT(*) AS n FROM users').n,
  classes: get('SELECT COUNT(*) AS n FROM classes').n,
  assignments: get('SELECT COUNT(*) AS n FROM assignments').n,
  submissions: get('SELECT COUNT(*) AS n FROM submissions').n,
  reports: get('SELECT COUNT(*) AS n FROM lab_reports').n,
  attempts: get('SELECT COUNT(*) AS n FROM quiz_attempts').n,
  activeSessions: get("SELECT COUNT(*) AS n FROM sessions WHERE expires_at > datetime('now')").n,
});
