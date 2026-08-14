-- =====================================================================
-- ModuLab — Lược đồ cơ sở dữ liệu (SQLite)
-- Sinh bởi server/db.mjs khi khởi động lần đầu.
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- 1. Lớp học, nhóm thực hành và người dùng
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  teacher_id  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teams (
  id        TEXT PRIMARY KEY,
  class_id  TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  code      TEXT NOT NULL,
  UNIQUE (class_id, code)
);

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE,
  role       TEXT NOT NULL CHECK (role IN ('hs', 'gv')),
  class_id   TEXT REFERENCES classes(id) ON DELETE SET NULL,
  team_id    TEXT REFERENCES teams(id)   ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_class ON users(class_id, role);

-- ---------------------------------------------------------------------
-- 2. Bài thực hành và nội dung lý thuyết
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_modules (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  theory_content TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'da_duyet'
                 CHECK (status IN ('nhap', 'cho_duyet', 'da_duyet')),
  owner_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------
-- 3. Thư viện dụng cụ và các chế độ đo của từng dụng cụ
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tools (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL CHECK (category IN ('meter', 'component', 'source')),
  short_desc     TEXT NOT NULL DEFAULT '',
  detailed_desc  TEXT NOT NULL DEFAULT '',
  icon_name      TEXT NOT NULL DEFAULT 'Wrench',
  error_reading  TEXT NOT NULL DEFAULT '',
  safety_warning TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tool_modes (
  id          TEXT PRIMARY KEY,
  tool_id     TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  label       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  safe_usage  TEXT NOT NULL DEFAULT '',
  warning     TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tool_modes_tool ON tool_modes(tool_id, sort_order);

-- ---------------------------------------------------------------------
-- 4. Ngân hàng câu hỏi Game ôn tập
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_questions (
  id          TEXT PRIMARY KEY,
  module_id   TEXT REFERENCES lab_modules(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  time_limit  INTEGER NOT NULL DEFAULT 30,
  status      TEXT NOT NULL DEFAULT 'da_duyet'
              CHECK (status IN ('nhap', 'cho_duyet', 'da_duyet')),
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quiz_options (
  id          TEXT NOT NULL,
  question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_correct  INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (question_id, id)
);

-- ---------------------------------------------------------------------
-- 5. Lượt chơi và câu trả lời
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id   TEXT REFERENCES lab_modules(id) ON DELETE SET NULL,
  score       INTEGER NOT NULL DEFAULT 0,
  total       INTEGER NOT NULL DEFAULT 0,
  started_at  TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id, module_id);

CREATE TABLE IF NOT EXISTS quiz_answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id  INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_id   TEXT,
  is_correct  INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  answered_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_answers_question ON quiz_answers(question_id, is_correct);

-- ---------------------------------------------------------------------
-- 6. Báo cáo thực hành và bảng số liệu đo
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_reports (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id       TEXT NOT NULL REFERENCES lab_modules(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'dang_lam'
                  CHECK (status IN ('dang_lam', 'da_nop', 'da_cham')),
  r_avg           REAL,
  delta_r         REAL,
  rel_err         REAL,
  grade           REAL,
  teacher_comment TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at    TEXT,
  UNIQUE (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS report_rows (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL REFERENCES lab_reports(id) ON DELETE CASCADE,
  idx       INTEGER NOT NULL,
  u_value   REAL NOT NULL DEFAULT 0,
  u_unit    TEXT NOT NULL DEFAULT 'V',
  i_value   REAL NOT NULL DEFAULT 0,
  i_unit    TEXT NOT NULL DEFAULT 'mA',
  r_calc    REAL NOT NULL DEFAULT 0,
  UNIQUE (report_id, idx)
);

-- ---------------------------------------------------------------------
-- 7. Bản lắp mạch học sinh lưu lại từ phần mô phỏng
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS circuit_designs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id  TEXT REFERENCES lab_modules(id) ON DELETE SET NULL,
  name       TEXT NOT NULL DEFAULT 'Bản lắp chưa đặt tên',
  payload    TEXT NOT NULL,           -- JSON: danh sách linh kiện và dây nối
  is_valid   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_circuits_user ON circuit_designs(user_id, updated_at DESC);

-- ---------------------------------------------------------------------
-- 8. Thống kê lỗi thường gặp và nhật ký thao tác
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS error_stats (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id    TEXT REFERENCES classes(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  wrong_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  detail     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_logs_time ON activity_logs(created_at DESC);

-- ---------------------------------------------------------------------
-- 9. Khung nhìn tổng hợp cho Bảng quản lý của giáo viên
-- ---------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_student_progress AS
SELECT
  u.id                AS user_id,
  u.name              AS name,
  u.class_id          AS class_id,
  COALESCE(t.code, '') AS team,
  (SELECT MAX(score) FROM quiz_attempts a WHERE a.user_id = u.id)      AS quiz_score,
  (SELECT r.status   FROM lab_reports  r WHERE r.user_id = u.id
     ORDER BY r.updated_at DESC LIMIT 1)                               AS report_status,
  (SELECT r.grade    FROM lab_reports  r WHERE r.user_id = u.id
     ORDER BY r.updated_at DESC LIMIT 1)                               AS grade
FROM users u
LEFT JOIN teams t ON t.id = u.team_id
WHERE u.role = 'hs';
