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

/**
 * Sinh mã vào lớp bốn chữ số cho những lớp có từ trước.
 *
 * Thử đoán từ tên lớp trước — "12A4" cho ra "1204", vừa dễ nhớ vừa khớp với mã
 * giáo viên sẽ đọc cho học sinh. Đoán không ra hoặc đã có lớp khác dùng mã đó
 * thì lấy số nhỏ nhất còn trống, vì mã bắt buộc phải duy nhất.
 */
const doanMaLop = (ten) => {
  const m = String(ten ?? '').match(/(\d{1,2})\s*[A-Za-zÀ-ỹ]*\s*(\d{1,2})/);
  if (!m) return null;
  const khoi = Number(m[1]);
  const so = Number(m[2]);
  if (!Number.isFinite(khoi) || !Number.isFinite(so)) return null;
  return `${String(khoi).padStart(2, '0')}${String(so).padStart(2, '0')}`;
};

const capMaLop = (db) => {
  const thieu = db.prepare(
    "SELECT id, code, name FROM classes WHERE join_code IS NULL OR join_code = ''").all();
  if (!thieu.length) return 0;

  const daDung = new Set(db.prepare(
    'SELECT join_code FROM classes WHERE join_code IS NOT NULL').all().map((r) => r.join_code));

  thieu.forEach((c) => {
    let ma = doanMaLop(c.code) ?? doanMaLop(c.name);
    if (!ma || daDung.has(ma)) {
      ma = null;
      for (let i = 1001; i <= 9999 && !ma; i++) {
        const thu = String(i);
        if (!daDung.has(thu)) ma = thu;
      }
    }
    if (!ma) return;
    daDung.add(ma);
    db.prepare('UPDATE classes SET join_code = ? WHERE id = ?').run(ma, c.id);
  });
  return thieu.length;
};

/**
 * Đánh số nhóm cho các nhóm cũ, và bảo đảm lớp nào cũng có nhóm số 0.
 *
 * Nhóm cũ chỉ có tên tự do như "Nhóm 3 - Bàn 5", nên rút số đầu tiên trong tên
 * ra làm số nhóm; không có số thì xếp tiếp vào sau số lớn nhất đang dùng.
 */
const capSoNhom = (db) => {
  let n = 0;
  const lops = db.prepare('SELECT id FROM classes').all();

  lops.forEach(({ id }) => {
    const nhom = db.prepare(
      'SELECT id, code, group_no FROM teams WHERE class_id = ? ORDER BY code').all(id);
    const daDung = new Set(nhom.filter((t) => t.group_no !== null).map((t) => t.group_no));
    let ke = Math.max(0, ...[...daDung]) + 1;

    nhom.forEach((t) => {
      if (t.group_no !== null) return;
      const m = String(t.code ?? '').match(/(\d+)/);
      let so = m ? Number(m[1]) : null;
      if (so === null || so === 0 || daDung.has(so)) so = ke++;
      daDung.add(so);
      db.prepare('UPDATE teams SET group_no = ?, name = COALESCE(name, code) WHERE id = ?')
        .run(so, t.id);
      n++;
    });

    /* Nhóm 0 = làm riêng lẻ. Lớp nào cũng phải có, kể cả lớp không chia nhóm. */
    if (!daDung.has(0)) {
      db.prepare(`INSERT INTO teams (id, class_id, code, group_no, name)
                  VALUES (?, ?, 'N0', 0, 'Làm riêng lẻ')`)
        .run(`team-${id}-n0`, id);
      n++;
    }
  });
  return n;
};

export function migrate(db) {
  const done = [];

  if (rebuildUsers(db)) done.push('users: thêm mật khẩu, trạng thái và vai trò dev');

  /* Ngưỡng sai số của bài thực hành, thêm từ bản trước */
  if (tableExists(db, 'lab_modules')
    && addColumn(db, 'lab_modules', 'max_error', 'REAL NOT NULL DEFAULT 0.10')) {
    done.push('lab_modules: thêm ngưỡng sai số');
  }

  /* Mã vào lớp, số nhóm và số thứ tự học sinh */
  if (tableExists(db, 'classes')) {
    addColumn(db, 'classes', 'join_code', 'TEXT');
    /* UNIQUE không thêm được bằng ALTER TABLE nên dựng bằng chỉ mục riêng */
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_join ON classes(join_code)');
    const n = capMaLop(db);
    if (n) done.push(`classes: sinh mã vào lớp cho ${n} lớp`);
  }

  if (tableExists(db, 'teams')) {
    addColumn(db, 'teams', 'group_no', 'INTEGER');
    addColumn(db, 'teams', 'name', 'TEXT');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_group ON teams(class_id, group_no)');
    const n = capSoNhom(db);
    if (n) done.push(`teams: đánh số cho ${n} nhóm`);
  }

  if (tableExists(db, 'users') && addColumn(db, 'users', 'seat_no', 'INTEGER')) {
    done.push('users: thêm số thứ tự trong lớp');
  }

  /*
   * Khung nhìn v_student_progress phải dựng lại mỗi lần nâng cấp.
   * `CREATE VIEW IF NOT EXISTS` trong schema.sql không đụng được vào khung nhìn
   * đã tồn tại, nên sửa câu lệnh trong schema.sql thôi thì cơ sở dữ liệu cũ vẫn
   * chạy bản cũ. Xoá rồi tạo lại là cách duy nhất cho chắc.
   */
  if (tableExists(db, 'teams')) {
    const cu = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'view' AND name = 'v_student_progress'").get()?.sql ?? '';
    if (cu && !cu.includes('t.name')) {
      db.exec('DROP VIEW IF EXISTS v_student_progress');
      db.exec(`
        CREATE VIEW v_student_progress AS
        SELECT u.id AS user_id, u.name AS name, u.class_id AS class_id,
               COALESCE(t.name, t.code, '') AS team,
               (SELECT MAX(score) FROM quiz_attempts a WHERE a.user_id = u.id) AS quiz_score,
               (SELECT r.status FROM lab_reports r WHERE r.user_id = u.id
                  ORDER BY r.updated_at DESC LIMIT 1) AS report_status,
               (SELECT r.grade FROM lab_reports r WHERE r.user_id = u.id
                  ORDER BY r.updated_at DESC LIMIT 1) AS grade
        FROM users u
        LEFT JOIN teams t ON t.id = u.team_id
        WHERE u.role = 'hs'`);
      done.push('v_student_progress: hiện tên nhóm thay cho mã nhóm');
    }
  }

  /* Dọn phiên đã hết hạn để bảng không phình mãi */
  if (tableExists(db, 'sessions')) {
    const n = db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run().changes;
    if (n) done.push(`sessions: xoá ${n} phiên hết hạn`);
  }

  return done;
}
