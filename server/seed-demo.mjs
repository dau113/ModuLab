/**
 * Dữ liệu TRÌNH DIỄN: một lớp mẫu có sẵn học sinh, điểm, báo cáo và thống kê lỗi.
 *
 *   npm run db:demo            — thêm lớp trình diễn vào
 *   npm run db:demo -- --clear — xoá đúng lớp đó đi, không đụng lớp thật
 *
 * Tách khỏi `seed.mjs` từ V1.79. Trước đây hai thứ nạp chung một lượt nên cơ
 * sở dữ liệu nào vừa dựng lên cũng có sẵn lớp "11A2 - Chuyên Lý THPT" với tám
 * học sinh và các con số "8/8 HS", "12 HS sai"… Trông như số liệu thật mà chẳng
 * của ai: thầy cô mới dùng không biết đâu là lớp mình, còn đem đi báo cáo thì
 * thành số liệu khống. Nay phải gọi tay mới có, và gọi được thì xoá được.
 *
 * Dùng khi cần quay video hay chụp ảnh màn hình cho bài báo cáo. Lớp dạy thật
 * thì ĐỪNG nạp: mọi tài khoản ở đây dùng chung một mật khẩu.
 */
import { db, run, tx, DB_PATH } from './db.mjs';
import { hashPassword } from './auth.mjs';
import { doanMaTuTen } from './classes.mjs';
import {
  INITIAL_USERS, LAB_MODULES, QUIZ_QUESTIONS,
  INITIAL_REPORT_ROWS, TEACHER_CLASS_STATS,
} from '../src/data/mockData.ts';

const XOA = process.argv.includes('--clear');
const stats = TEACHER_CLASS_STATS;

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const classId = `class-${slug(stats.classCode)}`;

/* ------------------------------------------------------------------ */
/* Xoá                                                                 */
/* ------------------------------------------------------------------ */

if (XOA) {
  const co = db.prepare('SELECT id, name FROM classes WHERE id = ?').get(classId);
  if (!co) {
    console.log(`• Không thấy lớp trình diễn trong ${DB_PATH} — không có gì để xoá.`);
    process.exit(0);
  }
  /* Chỉ xoá đúng những người của lớp này. Xoá theo lớp chứ không xoá cả bảng
     users: cơ sở dữ liệu đang chạy có thể đã có giáo viên và học sinh thật. */
  const nguoi = db.prepare("SELECT id FROM users WHERE class_id = ?").all(classId).map((r) => r.id);
  tx(() => {
    db.exec('PRAGMA foreign_keys = OFF');
    nguoi.forEach((id) => {
      ['quiz_answers', 'quiz_attempts', 'report_rows', 'lab_reports', 'circuit_designs',
        'activity_logs', 'sessions', 'submissions', 'lesson_submissions'].forEach((b) => {
        try {
          if (b === 'report_rows') {
            run('DELETE FROM report_rows WHERE report_id IN (SELECT id FROM lab_reports WHERE user_id = ?)', id);
          } else if (b === 'quiz_answers') {
            run('DELETE FROM quiz_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE user_id = ?)', id);
          } else {
            run(`DELETE FROM ${b} WHERE user_id = ?`, id);
          }
        } catch { /* bảng chưa có ở bản cũ thì thôi */ }
      });
      run('DELETE FROM users WHERE id = ?', id);
    });
    run('DELETE FROM error_stats WHERE class_id = ?', classId);
    run('DELETE FROM teams WHERE class_id = ?', classId);
    run('DELETE FROM classes WHERE id = ?', classId);
    db.exec('PRAGMA foreign_keys = ON');
  });
  console.log(`✓ Đã xoá lớp trình diễn "${co.name}" và ${nguoi.length} tài khoản của lớp đó`);
  console.log(`  ${DB_PATH}`);
  process.exit(0);
}

/* ------------------------------------------------------------------ */
/* Nạp                                                                 */
/* ------------------------------------------------------------------ */

if (db.prepare('SELECT 1 AS co FROM classes WHERE id = ?').get(classId)) {
  console.log('• Lớp trình diễn đã có sẵn. Muốn nạp lại: npm run db:demo -- --clear rồi chạy lại.');
  process.exit(0);
}
if (db.prepare('SELECT COUNT(*) AS n FROM lab_modules').get().n === 0) {
  console.log('✗ Cơ sở dữ liệu chưa có nội dung. Chạy "npm run db:seed" trước đã.');
  process.exit(1);
}

tx(() => {
  const maVaoLop = doanMaTuTen(stats.classCode) ?? '1102';
  run('INSERT INTO classes (id, code, name, join_code) VALUES (?, ?, ?, ?)',
    classId, stats.classCode, stats.className, maVaoLop);

  /* Nhóm 0 — làm riêng lẻ. Lớp nào cũng phải có. */
  run(`INSERT INTO teams (id, class_id, code, group_no, name)
       VALUES (?, ?, 'N0', 0, 'Làm riêng lẻ')`, `team-${slug(stats.classCode)}-n0`, classId);

  const teamCodes = new Set();
  INITIAL_USERS.forEach((u) => u.teamCode && teamCodes.add(u.teamCode));
  stats.studentList.forEach((s) => s.team && teamCodes.add(s.team));
  const teamId = {};
  [...teamCodes].forEach((code, i) => {
    const id = `team-${slug(code)}`;
    teamId[code] = id;
    /* Số nhóm rút từ tên nếu có ("Nhóm 3 - Bàn 5" → 3), không thì đánh số tiếp */
    const m = String(code).match(/(\d+)/);
    const so = m && Number(m[1]) > 0 ? Number(m[1]) : i + 1;
    run('INSERT INTO teams (id, class_id, code, group_no, name) VALUES (?, ?, ?, ?, ?)',
      id, classId, `N${so}`, so, code);
  });

  const MK_MAU = process.env.MODULAB_SEED_PASSWORD || 'modulab123';
  const bam = hashPassword(MK_MAU);

  INITIAL_USERS.forEach((u) => {
    run(`INSERT INTO users (id, name, email, role, class_id, team_id, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      u.id, u.name, u.email, u.role, classId, u.teamCode ? teamId[u.teamCode] : null, bam);
  });
  const teacher = INITIAL_USERS.find((u) => u.role === 'gv');
  if (teacher) run('UPDATE classes SET teacher_id = ? WHERE id = ?', teacher.id, classId);

  const existingNames = new Set(INITIAL_USERS.map((u) => u.name));
  stats.studentList.forEach((s) => {
    if (existingNames.has(s.name)) return;
    run(`INSERT INTO users (id, name, email, role, class_id, team_id, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      s.id, s.name, `${slug(s.name)}@thpt.edu.vn`, 'hs', classId,
      s.team ? teamId[s.team] : null, bam);
  });

  const mainModule = LAB_MODULES[0]?.id ?? null;
  const total = QUIZ_QUESTIONS.length;

  stats.studentList.forEach((s) => {
    const uid = existingNames.has(s.name)
      ? INITIAL_USERS.find((u) => u.name === s.name).id
      : s.id;
    /* quizScore trong dữ liệu mẫu là điểm thang 10, đổi ra số câu đúng rồi mới
       suy ra điểm trò chơi (mỗi câu đúng 10 điểm, bỏ qua phần thưởng). */
    const dung = Math.round(((s.quizScore ?? 0) / 10) * total);
    run(`INSERT INTO quiz_attempts (user_id, module_id, score, correct, total, finished_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      uid, mainModule, dung * 10, dung, total);
    if (s.reportStatus === 'Đạt') {
      run(`INSERT INTO lab_reports (user_id, module_id, status, submitted_at)
           VALUES (?, ?, 'da_nop', datetime('now'))`, uid, mainModule);
    }
  });

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

  stats.errorStats.forEach((e) => {
    run('INSERT INTO error_stats (class_id, label, wrong_count) VALUES (?, ?, ?)',
      classId, e.question, e.wrongCount);
  });
});

const dem = db.prepare('SELECT COUNT(*) AS n FROM users WHERE class_id = ?').get(classId).n;
console.log(`✓ Đã nạp lớp trình diễn "${stats.className}" — ${dem} tài khoản`);
console.log(`  mật khẩu chung: ${process.env.MODULAB_SEED_PASSWORD || 'modulab123'}`);
console.log(`  xoá đi: npm run db:demo -- --clear`);
