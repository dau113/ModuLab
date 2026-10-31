/**
 * Nạp NỘI DUNG khởi tạo vào cơ sở dữ liệu: bài thực hành, thư viện dụng cụ và
 * ngân hàng câu hỏi. Nguồn lấy thẳng từ src/data/mockData.ts nên không phải
 * chép tay lần hai.
 *
 *   npm run db:seed          — chỉ nạp khi cơ sở dữ liệu còn trống
 *   npm run db:reset         — xoá sạch rồi nạp lại
 *
 * TỪ V1.79 BƯỚC NÀY KHÔNG DỰNG DỮ LIỆU TRÌNH DIỄN NỮA. Trước đây nó tạo sẵn
 * lớp "11A2 - Chuyên Lý THPT" với tám học sinh, kèm lượt chơi, báo cáo và
 * thống kê lỗi bịa ra, nên vừa mở bảng quản lý đã thấy "8/8 HS", "12 HS sai"…
 * Số liệu ấy trông như thật mà chẳng của ai cả: thầy cô mới dùng không phân
 * biệt được đâu là lớp mình, còn đem đi báo cáo thì thành số liệu khống.
 *
 * Nay mọi thống kê bắt đầu từ 0. Lớp và học sinh do chính giáo viên tạo và học
 * sinh tự đăng kí. Muốn có lại dữ liệu trình diễn để quay video hay chụp ảnh
 * thì chạy `npm run db:demo`.
 */
import { db, run, tx, isEmpty, DB_PATH } from './db.mjs';
import { LAB_MODULES, EXPLORE_TOOLS, QUIZ_QUESTIONS } from '../src/data/mockData.ts';

const RESET = process.argv.includes('--reset');

const TABLES = [
  'quiz_answers', 'quiz_attempts', 'report_rows', 'lab_reports', 'circuit_designs',
  'activity_logs', 'error_stats', 'quiz_options', 'quiz_questions',
  'submissions', 'assignments', 'sessions',
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

tx(() => {
  /* ---------- Bài thực hành ---------- */
  LAB_MODULES.forEach((m, i) => {
    run(`INSERT INTO lab_modules (id, title, description, theory_content, max_error, status, owner_id, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      m.id, m.title, m.description ?? '', m.theoryContent ?? '',
      m.maxErrorThreshold ?? 0.10,
      m.status ?? 'da_duyet', null, i);
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
      q.id, mainModule, q.question, q.explanation ?? '', q.timeLimit ?? 30, null, i);
    q.options.forEach((o, j) => {
      run('INSERT INTO quiz_options (id, question_id, content, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)',
        o.id, q.id, o.text, o.isCorrect ? 1 : 0, j);
    });
  });
});

const count = (t) => db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
console.log(`✓ Đã nạp nội dung vào ${DB_PATH}`);
console.log(`  bài thực hành ${count('lab_modules')} · dụng cụ ${count('tools')} (chế độ đo ${count('tool_modes')})`);
console.log(`  câu hỏi ${count('quiz_questions')} · phương án ${count('quiz_options')}`);
console.log(`  lớp ${count('classes')} · người dùng ${count('users')} — bắt đầu từ 0, giáo viên tự tạo lớp`);
