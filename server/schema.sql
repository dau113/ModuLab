-- =====================================================================
-- ModuLab — Lược đồ cơ sở dữ liệu (SQLite)
-- Sinh bởi server/db.mjs khi khởi động lần đầu.
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- 1. Lớp học, nhóm thực hành và người dùng
-- ---------------------------------------------------------------------
-- `code` là tên lớp người ta vẫn gọi, ví dụ 12A4.
-- `join_code` là bốn chữ số học sinh gõ để vào lớp, ví dụ 1204. Tách riêng vì
-- tên lớp có thể đổi hoặc trùng cách viết, còn mã vào lớp thì phải duy nhất và
-- gõ được nhanh trên điện thoại.
CREATE TABLE IF NOT EXISTS classes (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  join_code   TEXT UNIQUE,
  teacher_id  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Mỗi lớp luôn có một nhóm số 0 nghĩa là "làm riêng lẻ", để học sinh không có
-- nhóm vẫn vào lớp được bằng mã kết thúc bằng N0. Nhờ vậy mọi học sinh đều
-- thuộc về một hàng trong bảng này, không phải xử lí riêng trường hợp rỗng.
CREATE TABLE IF NOT EXISTS teams (
  id        TEXT PRIMARY KEY,
  class_id  TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  code      TEXT NOT NULL,
  group_no  INTEGER,
  name      TEXT,
  UNIQUE (class_id, code)
);

-- Chỉ mục trên group_no KHÔNG đặt ở đây. Tệp này chạy trước bước di trú, mà
-- cơ sở dữ liệu cũ thì bảng teams chưa có cột group_no — tạo chỉ mục trên một
-- cột chưa tồn tại là lỗi, và lỗi đó làm hỏng cả lượt khởi động. Chỉ mục được
-- dựng trong server/migrate.mjs, sau khi cột đã chắc chắn có.

-- Mật khẩu KHÔNG bao giờ lưu nguyên văn. Cột password_hash giữ chuỗi băm scrypt
-- kèm muối riêng cho từng tài khoản, xem server/auth.mjs.
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,
  role          TEXT NOT NULL CHECK (role IN ('hs', 'gv', 'dev')),
  class_id      TEXT REFERENCES classes(id) ON DELETE SET NULL,
  team_id       TEXT REFERENCES teams(id)   ON DELETE SET NULL,
  password_hash TEXT,
  -- Số thứ tự của học sinh trong lớp, do chính em nhập khi vào lớp
  seat_no       INTEGER,
  status        TEXT NOT NULL DEFAULT 'hoat_dong' CHECK (status IN ('hoat_dong', 'khoa')),
  last_login_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_class ON users(class_id, role);

-- ---------------------------------------------------------------------
-- 1b. Phiên đăng nhập
--
-- Mỗi lần đăng nhập sinh một mã phiên ngẫu nhiên; trình duyệt giữ mã này và
-- gửi kèm mọi lời gọi về sau. Lưu trong bảng nên thu hồi được từng phiên một,
-- và đăng xuất là xoá thật chứ không chỉ quên ở phía trình duyệt.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, expires_at);

-- ---------------------------------------------------------------------
-- 2. Bài thực hành và nội dung lý thuyết
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_modules (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  theory_content TEXT NOT NULL DEFAULT '',
  -- Ngưỡng sai số tương đối để bài được tính là đạt, ví dụ 0.10 là 10%
  max_error      REAL NOT NULL DEFAULT 0.10,
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
-- `score` là ĐIỂM TRÒ CHƠI: mỗi câu đúng 10 điểm, cộng thêm thưởng trả lời
-- nhanh và thưởng chuỗi đúng liên tiếp, nên nó lớn hơn số câu rất nhiều.
-- `correct` là SỐ CÂU ĐÚNG. Chấm bài phải dùng cột này chứ không dùng `score`:
-- lấy điểm trò chơi chia số câu thì ra những con số như 36/10.
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id   TEXT REFERENCES lab_modules(id) ON DELETE SET NULL,
  score       INTEGER NOT NULL DEFAULT 0,
  correct     INTEGER,
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
-- 9. Giao bài tập và bài nộp
--
-- Một bài tập thuộc về một lớp. Mọi học sinh của lớp đó đều nhận được, nên
-- không cần bảng trung gian ghi từng người được giao. Dòng trong `submissions`
-- chỉ sinh ra khi học sinh bắt đầu làm hoặc nộp; học sinh chưa động tới thì
-- không có dòng nào, và bảng theo dõi của giáo viên hiểu đó là "chưa làm".
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id           TEXT PRIMARY KEY,
  class_id     TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('khoi_dong', 'thuc_hanh')),
  module_id    TEXT REFERENCES lab_modules(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  due_at       TEXT,
  -- Điểm tối thiểu để tính là đạt, thang 10
  pass_score   REAL NOT NULL DEFAULT 5,
  state        TEXT NOT NULL DEFAULT 'mo' CHECK (state IN ('nhap', 'mo', 'dong')),
  created_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id, state, due_at);

CREATE TABLE IF NOT EXISTS submissions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id   TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'dang_lam'
                  CHECK (status IN ('dang_lam', 'da_nop', 'da_cham')),
  score           REAL,
  -- Nguồn điểm: lượt chơi Game ôn tập, hoặc bản báo cáo thực hành
  attempt_id      INTEGER REFERENCES quiz_attempts(id) ON DELETE SET NULL,
  report_id       INTEGER REFERENCES lab_reports(id)   ON DELETE SET NULL,
  late            INTEGER NOT NULL DEFAULT 0 CHECK (late IN (0, 1)),
  teacher_comment TEXT,
  submitted_at    TEXT,
  graded_at       TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (assignment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id, status);

-- ---------------------------------------------------------------------
-- 10. Khung nhìn tổng hợp cho Bảng quản lý của giáo viên
-- ---------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_student_progress AS
SELECT
  u.id                AS user_id,
  u.name              AS name,
  u.class_id          AS class_id,
  COALESCE(t.name, t.code, '') AS team,
  -- Quy về thang 10 ngay trong khung nhìn, để sổ điểm không hiện điểm trò chơi
  (SELECT ROUND(MAX(
     CASE WHEN a.total > 0 AND a.correct IS NOT NULL THEN a.correct * 10.0 / a.total
          ELSE MIN(a.score, 10) END), 1)
     FROM quiz_attempts a WHERE a.user_id = u.id)                      AS quiz_score,
  (SELECT r.status   FROM lab_reports  r WHERE r.user_id = u.id
     ORDER BY r.updated_at DESC LIMIT 1)                               AS report_status,
  (SELECT r.grade    FROM lab_reports  r WHERE r.user_id = u.id
     ORDER BY r.updated_at DESC LIMIT 1)                               AS grade
FROM users u
LEFT JOIN teams t ON t.id = u.team_id
WHERE u.role = 'hs';

-- ---------------------------------------------------------------------
-- 11. Bài giảng tự do
--
-- Giáo viên tự soạn nội dung thay vì chỉ giao Game ôn tập hay bài thực hành
-- có sẵn. Một bài giảng gồm nhiều KHỐI xếp theo thứ tự: đoạn văn, hình, video,
-- tệp đính kèm, câu trắc nghiệm, câu trả lời ngắn.
--
-- Để nội dung và câu hỏi chung một bảng chứ không tách đôi, vì giáo viên soạn
-- xen kẽ: giảng một đoạn, cho xem hình, rồi hỏi ngay một câu về hình đó.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
  id           TEXT PRIMARY KEY,
  class_id     TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  due_at       TEXT,
  state        TEXT NOT NULL DEFAULT 'nhap' CHECK (state IN ('nhap', 'mo', 'dong')),
  created_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lessons_class ON lessons(class_id, state);

-- Tệp giáo viên tải lên. Lưu trên đĩa dưới tên sinh ra, KHÔNG dùng tên gốc:
-- tên gốc do người dùng đặt nên có thể chứa đường dẫn hay kí tự lạ.
CREATE TABLE IF NOT EXISTS uploads (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  class_id   TEXT REFERENCES classes(id) ON DELETE CASCADE,
  filename   TEXT NOT NULL,
  mime       TEXT NOT NULL,
  size       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lesson_blocks (
  id         TEXT PRIMARY KEY,
  lesson_id  TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('text', 'image', 'video', 'file', 'mcq', 'short')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  title      TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL DEFAULT '',
  upload_id  TEXT REFERENCES uploads(id) ON DELETE SET NULL,
  link_url   TEXT,
  -- Phương án trắc nghiệm, lưu dạng JSON: [{"id":"a","text":"..."}]
  options    TEXT,
  -- Đáp án đúng. Trắc nghiệm là mã phương án; câu ngắn là đáp án mẫu.
  answer_key TEXT,
  points     REAL NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_blocks_lesson ON lesson_blocks(lesson_id, sort_order);

CREATE TABLE IF NOT EXISTS lesson_submissions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id       TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'dang_lam'
                  CHECK (status IN ('dang_lam', 'da_nop', 'da_cham')),
  score           REAL,
  max_score       REAL,
  late            INTEGER NOT NULL DEFAULT 0 CHECK (late IN (0, 1)),
  teacher_comment TEXT,
  submitted_at    TEXT,
  graded_at       TEXT,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (lesson_id, user_id)
);

CREATE TABLE IF NOT EXISTS lesson_answers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL REFERENCES lesson_submissions(id) ON DELETE CASCADE,
  block_id      TEXT NOT NULL REFERENCES lesson_blocks(id) ON DELETE CASCADE,
  answer        TEXT NOT NULL DEFAULT '',
  -- NULL nghĩa là máy chưa chấm được, chờ giáo viên xem
  is_correct    INTEGER,
  points        REAL NOT NULL DEFAULT 0,
  UNIQUE (submission_id, block_id)
);
