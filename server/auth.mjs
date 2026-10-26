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
         COALESCE(t.name, '') AS teamCode,
         u.class_id AS classId,
         u.team_id  AS teamId,
         u.seat_no  AS seatNo,
         t.group_no AS groupNo
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
/* Đăng kí và đăng nhập                                                */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Đăng kí chỉ cần tên, email, mật khẩu và vai trò.
 *
 * Phần lớp đã chuyển hẳn vào trong ứng dụng: học sinh vào lớp bằng mã giáo viên
 * phát, giáo viên tự tạo lớp. Trước đây bắt nhập mã lớp ngay lúc đăng kí, mà
 * lúc đó em chưa chắc đã có mã trong tay, nên nhiều em gõ bừa rồi vào nhầm lớp.
 */
export const register = ({ name, email, password, role }, userAgent) => {
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
  run('INSERT INTO users (id, name, email, role, password_hash) VALUES (?, ?, ?, ?, ?)',
    id, ten, mail, role, hashPassword(matKhau));

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

/**
 * Đổi họ tên.
 *
 * Lớp và nhóm KHÔNG đổi ở đây nữa: học sinh đổi bằng cách nhập mã lớp khác,
 * giáo viên đổi bằng cách chọn lớp khác trong phần quản lí lớp. Để hai đường
 * cùng sửa một thứ thì sớm muộn cũng lệch nhau.
 */
export const updateProfile = (userId, { name }) => {
  const user = publicUser(userId);
  if (!user) fail('Không tìm thấy tài khoản.', 404);

  const ten = name === undefined ? user.name : String(name).trim();
  if (ten.length < 2) fail('Họ tên phải có ít nhất 2 kí tự.');

  run('UPDATE users SET name = ? WHERE id = ?', ten, userId);
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

  const found = get('SELECT id, password_hash, role FROM users WHERE email = ?', mail);
  if (found) {
    /* Mật khẩu không đổi thì đừng băm lại và đừng xoá phiên. Hàm này còn được
       gọi mỗi lần máy chủ khởi động (xem bootstrapDeveloper), mà cứ khởi động
       lại là đăng xuất thì mỗi lần triển khai lại phải đăng nhập lại. */
    const giongCu = verifyPassword(password, found.password_hash) && found.role === 'dev';
    if (giongCu) return { ...publicUser(found.id), created: false, changed: false };

    run("UPDATE users SET password_hash = ?, role = 'dev', status = 'hoat_dong', name = ? WHERE id = ?",
      hashPassword(password), name || 'ModuLab Developer', found.id);
    run('DELETE FROM sessions WHERE user_id = ?', found.id);
    return { ...publicUser(found.id), created: false, changed: true };
  }

  const id = `dev-${randomUUID().slice(0, 8)}`;
  run(`INSERT INTO users (id, name, email, role, password_hash)
       VALUES (?, ?, ?, 'dev', ?)`,
    id, name || 'ModuLab Developer', mail, hashPassword(password));
  return { ...publicUser(id), created: true, changed: true };
};

/**
 * Tạo tài khoản dev lúc máy chủ khởi động, lấy từ biến môi trường.
 *
 * Trên Render gói rẻ không có cửa sổ dòng lệnh để chạy `npm run dev:account`,
 * nên phải có đường này: đặt hai biến môi trường rồi triển khai lại là xong.
 *
 * Chỉ chạy khi CẢ HAI biến đều có. Thiếu một cái thì bỏ qua lặng lẽ — như vậy
 * máy của người phát triển không tự dưng mọc ra tài khoản dev ngoài ý muốn.
 */
export const bootstrapDeveloper = () => {
  const email = process.env.MODULAB_DEV_EMAIL;
  const password = process.env.MODULAB_DEV_PASSWORD;
  if (!email || !password) return null;

  try {
    const kq = upsertDeveloper({ email, password, name: process.env.MODULAB_DEV_NAME });
    return { email: kq.email, created: kq.created, changed: kq.changed };
  } catch (err) {
    /* Sai định dạng email hay mật khẩu quá ngắn thì báo rồi chạy tiếp, chứ
       không để máy chủ chết chỉ vì một biến môi trường gõ nhầm. */
    console.error('✗ Không tạo được tài khoản developer từ biến môi trường:', err.message);
    return null;
  }
};
