/**
 * Nạp dữ liệu khởi tạo vào cơ sở dữ liệu.
 * Nguồn dữ liệu lấy thẳng từ src/data/mockData.ts nên không phải chép tay lần hai.
 *
 *   npm run db:seed          — chỉ nạp khi cơ sở dữ liệu còn trống
 *   npm run db:reset         — xoá sạch rồi nạp lại
 */
import { db, run, tx, isEmpty, DB_PATH } from './db.mjs';
import {
  INITIAL_USERS, LAB_MODULES, EXPLORE_TOOLS, QUIZ_QUESTIONS,
  INITIAL_REPORT_ROWS, TEACHER_CLASS_STATS,
} from '../src/data/mockData.ts';

const RESET = process.argv.includes('--reset');

const TABLES = [
  'quiz_answers', 'quiz_attempts', 'report_rows', 'lab_reports', 'circuit_designs',
  'activity_logs', 'error_stats', 'quiz_options', 'quiz_questions',
  'tool_modes', 'tools', 'lab_modules', 'users', 'teams', 'classes',
];

if (RESET) {
  db.exec('PRAGMA foreign_keys = OFF;');
  TABLES.forEach((t) => db.exec(`DELETE FROM ${t};`));
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('quiz_attempts','quiz_answers','lab_reports','report_rows','circuit_designs','activity_logs','error_stats');");
  db.exec('PRAGMA foreign_keys = ON;');
  console.log('• Đã xoá sạch dữ liệu cũ');
} else if (!isEmpty()) {
  console.log(`• Cơ sở dữ liệu đã có dữ liệu, bỏ qua bước nạp (${DB_PATH})`);
  console.log('  Muốn nạp lại từ đầu: npm run db:reset');
  process.exit(0);
}

const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

tx(() => {
  /* ---------- Lớp học và nhóm ---------- */
  const stats = TEACHER_CLASS_STATS;
  const classId = `class-${slug(stats.classCode)}`;
  run('INSERT INTO classes (id, code, name) VALUES (?, ?, ?)', classId, stats.classCode, stats.className);

  const teamCodes = new Set();
  INITIAL_USERS.forEach((u) => u.teamCode && teamCodes.add(u.teamCode));
  stats.studentList.forEach((s) => s.team && teamCodes.add(s.team));
  const teamId = {};
  [...teamCodes].forEach((code) => {
    const id = `team-${slug(code)}`;
    teamId[code] = id;
    run('INSERT INTO teams (id, class_id, code) VALUES (?, ?, ?)', id, classId, code);
  });

  /* ---------- Người dùng ---------- */
  INITIAL_USERS.forEach((u) => {
    run('INSERT INTO users (id, name, email, role, class_id, team_id) VALUES (?, ?, ?, ?, ?, ?)',
      u.id, u.name, u.email, u.role, classId, u.teamCode ? teamId[u.teamCode] : null);
  });
  const teacher = INITIAL_USERS.find((u) => u.role === 'gv');
  if (teacher) run('UPDATE classes SET teacher_id = ? WHERE id = ?', teacher.id, classId);

  /* Danh sách học sinh trong bảng quản lý — bỏ qua người đã có ở trên */
  const existingNames = new Set(INITIAL_USERS.map((u) => u.name));
  stats.studentList.forEach((s) => {
    if (existingNames.has(s.name)) return;
    run('INSERT INTO users (id, name, email, role, class_id, team_id) VALUES (?, ?, ?, ?, ?, ?)',
      s.id, s.name, `${slug(s.name)}@thpt.edu.vn`, 'hs', classId, s.team ? teamId[s.team] : null);
  });

  /* ---------- Bài thực hành ---------- */
  LAB_MODULES.forEach((m, i) => {
    run(`INSERT INTO lab_modules (id, title, description, theory_content, status, owner_id, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      m.id, m.title, m.description ?? '', m.theoryContent ?? '',
      m.status ?? 'da_duyet', teacher?.id ?? null, i);
  });
  const mainModule = LAB_MODULES[0]?.id ?? null;

  /* ---------- Thư viện dụng cụ ---------- */
  EXPLORE_TOOLS.forEach((t, i) => {
    run(`INSERT INTO tools (id, name, category, short_desc, detailed_desc, icon_name, error_reading, safety_warning, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      t.id, t.name, t.category, t.shortDesc ?? '', t.detailedDesc ?? '',
      t.iconName ?? 'Wrench', t.errorReading ?? '', t.safetyWarning ?? null, i);
    (t.modes ?? []).forEach((m, j) => {
      run(`INSERT INTO tool_modes (id, tool_id, name, label, description, safe_usage, warning, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        m.id, t.id, m.name, m.label, m.desc ?? '', m.safeUsage ?? '', m.warning ?? null, j);
    });
  });

  /* ---------- Ngân hàng câu hỏi ---------- */
  QUIZ_QUESTIONS.forEach((q, i) => {
    run(`INSERT INTO quiz_questions (id, module_id, question, explanation, time_limit, created_by, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      q.id, mainModule, q.question, q.explanation ?? '', q.timeLimit ?? 30, teacher?.id ?? null, i);
    q.options.forEach((o, j) => {
      run('INSERT INTO quiz_options (id, question_id, content, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)',
        o.id, q.id, o.text, o.isCorrect ? 1 : 0, j);
    });
  });

  /* ---------- Lượt chơi mẫu để bảng quản lý có số liệu ---------- */
  const total = QUIZ_QUESTIONS.length;
  stats.studentList.forEach((s) => {
    const uid = existingNames.has(s.name)
      ? INITIAL_USERS.find((u) => u.name === s.name).id
      : s.id;
    const score = Math.round(((s.quizScore ?? 0) / 10) * total);
    run(`INSERT INTO quiz_attempts (user_id, module_id, score, total, finished_at)
         VALUES (?, ?, ?, ?, datetime('now'))`, uid, mainModule, score, total);
    if (s.reportStatus === 'Đạt') {
      run(`INSERT INTO lab_reports (user_id, module_id, status, submitted_at)
           VALUES (?, ?, 'da_nop', datetime('now'))`, uid, mainModule);
    }
  });

  /* ---------- Bảng số liệu mẫu cho học sinh đầu tiên ---------- */
  const firstStudent = INITIAL_USERS.find((u) => u.role === 'hs');
  if (firstStudent && mainModule) {
    let report = db.prepare('SELECT id FROM lab_reports WHERE user_id = ? AND module_id = ?')
      .get(firstStudent.id, mainModule);
    if (!report) {
      run('INSERT INTO lab_reports (user_id, module_id) VALUES (?, ?)', firstStudent.id, mainModule);
      report = db.prepare('SELECT id FROM lab_reports WHERE user_id = ? AND module_id = ?')
        .get(firstStudent.id, mainModule);
    }
    INITIAL_REPORT_ROWS.forEach((r) => {
      run(`INSERT INTO report_rows (report_id, idx, u_value, u_unit, i_value, i_unit, r_calc)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        report.id, r.id, r.u, r.uUnit, r.i, r.iUnit, r.rCalc);
    });
  }

  /* ---------- Thống kê lỗi thường gặp ---------- */
  stats.errorStats.forEach((e) => {
    run('INSERT INTO error_stats (class_id, label, wrong_count) VALUES (?, ?, ?)',
      classId, e.question, e.wrongCount);
  });
});

const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
console.log(`✓ Đã nạp dữ liệu vào ${DB_PATH}`);
console.log(`  lớp ${count('classes')} · nhóm ${count('teams')} · người dùng ${count('users')}`);
console.log(`  bài thực hành ${count('lab_modules')} · dụng cụ ${count('tools')} (chế độ đo ${count('tool_modes')})`);
console.log(`  câu hỏi ${count('quiz_questions')} (phương án ${count('quiz_options')}) · lượt chơi ${count('quiz_attempts')}`);
console.log(`  báo cáo ${count('lab_reports')} · dòng số liệu ${count('report_rows')} · thống kê lỗi ${count('error_stats')}`);
