/**
 * Nâng cấp cơ sở dữ liệu đang có sẵn lên lược đồ mới.
 *
 * `schema.sql` chỉ chạy `CREATE TABLE IF NOT EXISTS`, nên với một tệp dữ liệu đã
 * tồn tại thì mọi lệnh ở đó đều bị bỏ qua và bảng cũ giữ nguyên hình dạng cũ.
 * Tệp này lo phần còn lại: thêm cột mới, và dựng lại bảng khi phải đổi ràng buộc
 * CHECK — SQLite không cho sửa CHECK bằng ALTER TABLE, cách duy nhất là tạo bảng
 * mới rồi chép dữ liệu sang.
 *
 * Mọi bước đều viết sao cho chạy lại nhiều lần vẫn không sao, vì hàm này được
 * gọi mỗi lần máy chủ khởi động.
 */

/** Tên các cột đang có thật của một bảng */
const columnsOf = (db, table) => {
  try {
    return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  } catch {
    return [];
  }
};

const tableExists = (db, table) =>
  db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?").get(table) !== undefined;

/** Câu lệnh CREATE gốc của một bảng, để dò xem ràng buộc cũ tới đâu */
const sqlOf = (db, table) =>
  db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)?.sql ?? '';

const addColumn = (db, table, column, definition) => {
  if (columnsOf(db, table).includes(column)) return false;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  return true;
};

/**
 * Dựng lại bảng users khi ràng buộc vai trò còn là bản cũ chỉ chấp nhận hs và gv.
 *
 * Phải tắt kiểm tra khoá ngoại trong lúc thay bảng, nếu không thì lệnh DROP sẽ
 * kéo theo xoá dây chuyền toàn bộ bài làm của học sinh. Tắt xong nhớ bật lại.
 */
const rebuildUsers = (db) => {
  if (!tableExists(db, 'users')) return false;
  const sql = sqlOf(db, 'users');
  const needsRole = !sql.includes("'dev'");
  const missing = ['password_hash', 'status', 'last_login_at']
    .filter((c) => !columnsOf(db, 'users').includes(c));
  if (!needsRole && !missing.length) return false;

  /* Chỉ thiếu cột thì thêm cột là xong, không cần đụng tới cả bảng */
  if (!needsRole) {
    addColumn(db, 'users', 'password_hash', 'TEXT');
    addColumn(db, 'users', 'status', "TEXT NOT NULL DEFAULT 'hoat_dong'");
    addColumn(db, 'users', 'last_login_at', 'TEXT');
    return true;
  }

  db.exec('PRAGMA foreign_keys = OFF');
  try {
    db.exec('BEGIN');
    db.exec(`
      CREATE TABLE users_moi (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        email         TEXT UNIQUE,
        role          TEXT NOT NULL CHECK (role IN ('hs', 'gv', 'dev')),
        class_id      TEXT REFERENCES classes(id) ON DELETE SET NULL,
        team_id       TEXT REFERENCES teams(id)   ON DELETE SET NULL,
        password_hash TEXT,
        status        TEXT NOT NULL DEFAULT 'hoat_dong' CHECK (status IN ('hoat_dong', 'khoa')),
        last_login_at TEXT,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      )`);

    /* Chép sang bằng đúng những cột bảng cũ đang có, cột mới để trống */
    const old = columnsOf(db, 'users');
    const carry = ['id', 'name', 'email', 'role', 'class_id', 'team_id',
      'password_hash', 'status', 'last_login_at', 'created_at'].filter((c) => old.includes(c));
    db.exec(`INSERT INTO users_moi (${carry.join(', ')}) SELECT ${carry.join(', ')} FROM users`);
    db.exec('DROP TABLE users');
    db.exec('ALTER TABLE users_moi RENAME TO users');
    db.exec('CREATE INDEX IF NOT EXISTS idx_users_class ON users(class_id, role)');
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    db.exec('PRAGMA foreign_keys = ON');
  }
  return true;
};

export function migrate(db) {
  const done = [];

  if (rebuildUsers(db)) done.push('users: thêm mật khẩu, trạng thái và vai trò dev');

  /* Ngưỡng sai số của bài thực hành, thêm từ bản trước */
  if (tableExists(db, 'lab_modules')
    && addColumn(db, 'lab_modules', 'max_error', 'REAL NOT NULL DEFAULT 0.10')) {
    done.push('lab_modules: thêm ngưỡng sai số');
  }

  /* Dọn phiên đã hết hạn để bảng không phình mãi */
  if (tableExists(db, 'sessions')) {
    const n = db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run().changes;
    if (n) done.push(`sessions: xoá ${n} phiên hết hạn`);
  }

  return done;
}
