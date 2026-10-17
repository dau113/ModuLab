/**
 * Đăng kí, đăng nhập và phân quyền.
 *
 * Mật khẩu không bao giờ được lưu nguyên văn. Mỗi tài khoản có một chuỗi muối
 * ngẫu nhiên riêng, mật khẩu được băm bằng scrypt rồi cất dưới dạng
 * `scrypt$<muối>$<chuỗi băm>`. Muối riêng từng người khiến hai người đặt trùng
 * mật khẩu vẫn ra hai chuỗi khác nhau, còn scrypt thì cố tình chạy chậm và ngốn
 * bộ nhớ nên dò mật khẩu bằng cách thử hàng loạt là không kinh tế.
 *
 * Toàn bộ dùng `node:crypto` có sẵn, không cài thêm gói ngoài nào.
 */
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import { all, get, run, logActivity } from './db.mjs';

/* Tham số scrypt: N = 2^15 đủ chậm để chặn dò mật khẩu mà vẫn kịp cho một lần
   đăng nhập. maxmem phải khai báo rộng hơn mức N cần, nếu không Node từ chối. */
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };
const KEY_LEN = 32;

/** Số ngày một phiên đăng nhập còn hiệu lực */
const SESSION_DAYS = 30;

export const hashPassword = (plain) => {
  const salt = randomBytes(16).toString('hex');
  const key = scryptSync(plain, salt, KEY_LEN, SCRYPT).toString('hex');
  return `scrypt$${salt}$${key}`;
};

/**
 * So mật khẩu người dùng gõ với chuỗi băm đã lưu.
 *
 * Dùng timingSafeEqual chứ không dùng dấu bằng thường: phép so sánh chuỗi bình
 * thường dừng ngay ở kí tự đầu tiên khác nhau, nên thời gian chạy hé lộ đoán
 * được bao nhiêu kí tự đầu. timingSafeEqual luôn chạy hết, không rò rỉ gì.
 */
export const verifyPassword = (plain, stored) => {
  if (typeof stored !== 'string') return false;
  const [scheme, salt, key] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !key) return false;
  const a = Buffer.from(key, 'hex');
  const b = scryptSync(plain, salt, a.length, SCRYPT);
  return a.length === b.length && timingSafeEqual(a, b);
};

const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

/* ------------------------------------------------------------------ */
/* Phiên đăng nhập                                                     */
/* ------------------------------------------------------------------ */

const newToken = () => randomBytes(32).toString('base64url');

export const createSession = (userId, userAgent) => {
  const token = newToken();
  run(`INSERT INTO sessions (token, user_id, user_agent, expires_at)
       VALUES (?, ?, ?, datetime('now', ?))`,
    token, userId, (userAgent ?? '').slice(0, 200), `+${SESSION_DAYS} days`);
  run("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", userId);
  return token;
};

export const destroySession = (token) => {
  if (token) run('DELETE FROM sessions WHERE token = ?', token);
  return { ok: true };
};

/** Hồ sơ người dùng gửi ra cho trình duyệt — không bao giờ kèm chuỗi băm */
export const publicUser = (id) => get(`
  SELECT u.id, u.name, u.email, u.role, u.status,
         COALESCE(c.code, '') AS classCode,
         COALESCE(t.code, '') AS teamCode,
         u.class_id AS classId,
         u.team_id  AS teamId
  FROM users u
  LEFT JOIN classes c ON c.id = u.class_id
  LEFT JOIN teams   t ON t.id = u.team_id
  WHERE u.id = ?`, id);

/** Đổi mã phiên lấy người dùng; trả null nếu mã sai, hết hạn hoặc tài khoản bị khoá */
export const userFromToken = (token) => {
  if (!token) return null;
  const row = get(`SELECT user_id FROM sessions
                   WHERE token = ? AND expires_at > datetime('now')`, token);
  if (!row) return null;
  const user = publicUser(row.user_id);
  if (!user || user.status === 'khoa') return null;
  return user;
};

/* ------------------------------------------------------------------ */
/* Lớp học                                                             */
/* ------------------------------------------------------------------ */

const normCode = (s) => String(s ?? '').trim().toUpperCase();

/** Tìm lớp theo mã; chưa có thì tạo, để giáo viên mở lớp mới ngay lúc đăng kí */
const ensureClass = (code, name, teacherId) => {
  const c = normCode(code);
  if (!c) return null;
  const found = get('SELECT id FROM classes WHERE code = ?', c);
  if (found) return found.id;
  const id = `class-${randomUUID().slice(0, 8)}`;
  run('INSERT INTO classes (id, code, name, teacher_id) VALUES (?, ?, ?, ?)',
    id, c, name || `Lớp ${c}`, teacherId ?? null);
  return id;
};

const ensureTeam = (classId, code) => {
  const c = String(code ?? '').trim();
  if (!classId || !c) return null;
  const found = get('SELECT id FROM teams WHERE class_id = ? AND code = ?', classId, c);
  if (found) return found.id;
  const id = `team-${randomUUID().slice(0, 8)}`;
  run('INSERT INTO teams (id, class_id, code) VALUES (?, ?, ?)', id, classId, c);
  return id;
};

/* ------------------------------------------------------------------ */
/* Đăng kí và đăng nhập                                                */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const register = ({ name, email, password, role, classCode, className, teamCode }, userAgent) => {
  const ten = String(name ?? '').trim();
  const mail = String(email ?? '').trim().toLowerCase();
  const matKhau = String(password ?? '');

  if (ten.length < 2) fail('Họ tên phải có ít nhất 2 kí tự.');
  if (!EMAIL_RE.test(mail)) fail('Địa chỉ email không hợp lệ.');
  if (matKhau.length < 6) fail('Mật khẩu phải dài ít nhất 6 kí tự.');
  /* Vai trò dev không mở cho người ngoài đăng kí, chỉ tạo bằng lệnh trên máy chủ */
  if (!['hs', 'gv'].includes(role)) fail('Vai trò chỉ được là học sinh hoặc giáo viên.');
  if (get('SELECT 1 AS ok FROM users WHERE email = ?', mail)) {
    fail('Email này đã có người dùng. Hãy đăng nhập hoặc dùng email khác.', 409);
  }

  const id = `${role}-${randomUUID().slice(0, 8)}`;
  const classId = ensureClass(classCode, className, role === 'gv' ? id : null);
  if (role === 'hs' && !classId) fail('Học sinh phải nhập mã lớp để vào đúng lớp của mình.');
  const teamId = role === 'hs' ? ensureTeam(classId, teamCode) : null;

  run(`INSERT INTO users (id, name, email, role, class_id, team_id, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, ten, mail, role, classId, teamId, hashPassword(matKhau));

  logActivity(id, 'dang_ki', `${role} · ${mail}`);
  return { token: createSession(id, userAgent), user: publicUser(id) };
};

export const login = ({ email, password }, userAgent) => {
  const mail = String(email ?? '').trim().toLowerCase();
  const row = get('SELECT id, password_hash, status FROM users WHERE email = ?', mail);

  /* Báo lỗi chung cho cả hai trường hợp sai email và sai mật khẩu. Nếu tách ra
     thì người lạ thử lần lượt từng email là biết được email nào có thật. */
  if (!row || !verifyPassword(String(password ?? ''), row.password_hash)) {
    fail('Email hoặc mật khẩu không đúng.', 401);
  }
  if (row.status === 'khoa') fail('Tài khoản này đang bị khoá. Hãy liên hệ giáo viên.', 403);

  logActivity(row.id, 'dang_nhap', null);
  return { token: createSession(row.id, userAgent), user: publicUser(row.id) };
};

export const changePassword = (userId, { oldPassword, newPassword }) => {
  const row = get('SELECT password_hash FROM users WHERE id = ?', userId);
  if (!row) fail('Không tìm thấy tài khoản.', 404);
  if (!verifyPassword(String(oldPassword ?? ''), row.password_hash)) {
    fail('Mật khẩu hiện tại không đúng.', 401);
  }
  if (String(newPassword ?? '').length < 6) fail('Mật khẩu mới phải dài ít nhất 6 kí tự.');

  run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(newPassword), userId);
  /* Đổi mật khẩu thì mọi phiên cũ phải mất hiệu lực, kể cả phiên trên máy khác */
  run('DELETE FROM sessions WHERE user_id = ?', userId);
  logActivity(userId, 'doi_mat_khau', null);
  return { ok: true };
};

/** Học sinh tự đổi lớp hoặc nhóm thực hành của mình */
export const updateProfile = (userId, { name, classCode, teamCode }) => {
  const user = publicUser(userId);
  if (!user) fail('Không tìm thấy tài khoản.', 404);

  const ten = name === undefined ? user.name : String(name).trim();
  if (ten.length < 2) fail('Họ tên phải có ít nhất 2 kí tự.');

  let classId = user.classId;
  if (classCode !== undefined && normCode(classCode) !== normCode(user.classCode)) {
    classId = ensureClass(classCode, '', null);
  }
  const teamId = teamCode !== undefined ? ensureTeam(classId, teamCode) : user.teamId;

  run('UPDATE users SET name = ?, class_id = ?, team_id = ? WHERE id = ?',
    ten, classId, teamId, userId);
  return publicUser(userId);
};

export const listSessions = (userId) =>
  all(`SELECT token, user_agent AS userAgent, created_at AS createdAt, expires_at AS expiresAt
       FROM sessions WHERE user_id = ? ORDER BY created_at DESC`, userId);

/* ------------------------------------------------------------------ */
/* Tạo tài khoản developer từ dòng lệnh                                */
/* ------------------------------------------------------------------ */

/**
 * Tạo hoặc đặt lại tài khoản vai trò dev. Chỉ gọi được từ máy chủ (npm run
 * dev:account) chứ không có điểm cuối HTTP nào làm việc này, nên người dùng web
 * không thể tự nâng mình lên quyền dev.
 */
export const upsertDeveloper = ({ email, password, name }) => {
  const mail = String(email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(mail)) fail('Địa chỉ email không hợp lệ.');
  if (String(password ?? '').length < 8) fail('Mật khẩu tài khoản dev phải dài ít nhất 8 kí tự.');

  const found = get('SELECT id FROM users WHERE email = ?', mail);
  if (found) {
    run("UPDATE users SET password_hash = ?, role = 'dev', status = 'hoat_dong', name = ? WHERE id = ?",
      hashPassword(password), name || 'ModuLab Developer', found.id);
    run('DELETE FROM sessions WHERE user_id = ?', found.id);
    return { ...publicUser(found.id), created: false };
  }

  const id = `dev-${randomUUID().slice(0, 8)}`;
  run(`INSERT INTO users (id, name, email, role, password_hash)
       VALUES (?, ?, ?, 'dev', ?)`,
    id, name || 'ModuLab Developer', mail, hashPassword(password));
  return { ...publicUser(id), created: true };
};
