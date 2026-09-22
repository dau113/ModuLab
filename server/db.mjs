/**
 * Kết nối SQLite và các hàm truy vấn dùng chung.
 * Dùng module `node:sqlite` có sẵn trong Node 22 nên không cần cài thêm gói nào.
 * Chạy kèm cờ: node --experimental-sqlite
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = process.env.MODULAB_DB || join(HERE, 'data', 'modulab.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec(readFileSync(join(HERE, 'schema.sql'), 'utf8'));

/* ------------------------------------------------------------------ */
/* Hàm truy vấn ngắn gọn                                               */
/* ------------------------------------------------------------------ */

export const all = (sql, ...params) => db.prepare(sql).all(...params);
export const get = (sql, ...params) => db.prepare(sql).get(...params) ?? null;
export const run = (sql, ...params) => db.prepare(sql).run(...params);

/** Chạy nhiều lệnh trong một giao dịch, tự hoàn tác khi có lỗi */
export const tx = (fn) => {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
};

export const isEmpty = () => get('SELECT COUNT(*) AS n FROM users').n === 0;

export const logActivity = (userId, action, detail) =>
  run('INSERT INTO activity_logs (user_id, action, detail) VALUES (?, ?, ?)',
    userId ?? null, action, detail ?? null);

/* ------------------------------------------------------------------ */
/* Truy vấn theo nghiệp vụ                                             */
/* ------------------------------------------------------------------ */

export const listUsers = () => all(`
  SELECT u.id, u.name, u.email, u.role,
         COALESCE(c.code, '') AS classCode,
         COALESCE(t.code, '') AS teamCode
  FROM users u
  LEFT JOIN classes c ON c.id = u.class_id
  LEFT JOIN teams   t ON t.id = u.team_id
  ORDER BY u.role DESC, u.name
`);

export const listModules = () => all(`
  SELECT id, title, description, theory_content AS theoryContent, status
  FROM lab_modules ORDER BY sort_order, title
`);

export const listTools = () => {
  const tools = all(`
    SELECT id, name, category, short_desc AS shortDesc, detailed_desc AS detailedDesc,
           icon_name AS iconName, error_reading AS errorReading, safety_warning AS safetyWarning
    FROM tools ORDER BY sort_order, name
  `);
  const modes = all(`
    SELECT id, tool_id AS toolId, name, label, description AS desc,
           safe_usage AS safeUsage, warning
    FROM tool_modes ORDER BY sort_order
  `);
  return tools.map((t) => {
    const own = modes.filter((m) => m.toolId === t.id)
      .map(({ toolId, ...rest }) => ({ ...rest, warning: rest.warning ?? undefined }));
    return {
      ...t,
      safetyWarning: t.safetyWarning ?? undefined,
      ...(own.length ? { modes: own } : {}),
    };
  });
};

export const listQuestions = (moduleId) => {
  const qs = moduleId
    ? all(`SELECT id, question, explanation, time_limit AS timeLimit FROM quiz_questions
           WHERE module_id = ? AND status = 'da_duyet' ORDER BY sort_order, created_at`, moduleId)
    : all(`SELECT id, question, explanation, time_limit AS timeLimit FROM quiz_questions
           WHERE status = 'da_duyet' ORDER BY sort_order, created_at`);
  const opts = all('SELECT question_id AS qid, id, content AS text, is_correct FROM quiz_options ORDER BY sort_order');
  return qs.map((q) => ({
    ...q,
    options: opts.filter((o) => o.qid === q.id)
      .map((o) => ({ id: o.id, text: o.text, isCorrect: !!o.is_correct })),
  }));
};

export const createQuestion = (payload, createdBy) => tx(() => {
  const id = payload.id || `q-${Date.now()}`;
  const order = get('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM quiz_questions').n;
  run(`INSERT INTO quiz_questions (id, module_id, question, explanation, time_limit, created_by, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, payload.moduleId ?? null, payload.question, payload.explanation ?? '',
    payload.timeLimit ?? 30, createdBy ?? null, order);
  (payload.options ?? []).forEach((o, i) => {
    run('INSERT INTO quiz_options (id, question_id, content, is_correct, sort_order) VALUES (?, ?, ?, ?, ?)',
      o.id, id, o.text, o.isCorrect ? 1 : 0, i);
  });
  logActivity(createdBy, 'them_cau_hoi', id);
  return listQuestions(payload.moduleId).find((q) => q.id === id) ?? null;
});

export const saveAttempt = (payload) => tx(() => {
  const info = run(`INSERT INTO quiz_attempts (user_id, module_id, score, total, finished_at)
                    VALUES (?, ?, ?, ?, datetime('now'))`,
    payload.userId, payload.moduleId ?? null, payload.score ?? 0, payload.total ?? 0);
  const attemptId = Number(info.lastInsertRowid);
  (payload.answers ?? []).forEach((a) => {
    run(`INSERT INTO quiz_answers (attempt_id, question_id, option_id, is_correct)
         VALUES (?, ?, ?, ?)`, attemptId, a.questionId, a.optionId ?? null, a.isCorrect ? 1 : 0);
  });
  logActivity(payload.userId, 'nop_game_on_tap', `diem ${payload.score}/${payload.total}`);
  return { id: attemptId };
});

/** Lấy báo cáo của một học sinh, tự tạo mới nếu chưa có */
export const getReport = (userId, moduleId) => {
  let report = get('SELECT * FROM lab_reports WHERE user_id = ? AND module_id = ?', userId, moduleId);
  if (!report) {
    run('INSERT INTO lab_reports (user_id, module_id) VALUES (?, ?)', userId, moduleId);
    report = get('SELECT * FROM lab_reports WHERE user_id = ? AND module_id = ?', userId, moduleId);
  }
  const rows = all(`SELECT idx AS id, u_value AS u, u_unit AS uUnit, i_value AS i, i_unit AS iUnit,
                           r_calc AS rCalc
                    FROM report_rows WHERE report_id = ? ORDER BY idx`, report.id);
  return {
    id: report.id,
    userId: report.user_id,
    moduleId: report.module_id,
    status: report.status,
    rAvg: report.r_avg,
    deltaR: report.delta_r,
    relErr: report.rel_err,
    grade: report.grade,
    teacherComment: report.teacher_comment,
    submittedAt: report.submitted_at,
    rows,
  };
};

export const saveReportRows = (userId, moduleId, rows) => tx(() => {
  const report = getReport(userId, moduleId);
  run('DELETE FROM report_rows WHERE report_id = ?', report.id);
  rows.forEach((r) => {
    run(`INSERT INTO report_rows (report_id, idx, u_value, u_unit, i_value, i_unit, r_calc)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      report.id, r.id, Number(r.u) || 0, r.uUnit || 'V', Number(r.i) || 0, r.iUnit || 'mA',
      Number(r.rCalc) || 0);
  });
  run("UPDATE lab_reports SET updated_at = datetime('now') WHERE id = ?", report.id);
  return getReport(userId, moduleId);
});

export const submitReport = (userId, moduleId, summary) => tx(() => {
  const report = getReport(userId, moduleId);
  run(`UPDATE lab_reports
       SET status = 'da_nop', r_avg = ?, delta_r = ?, rel_err = ?,
           submitted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
    summary?.rAvg ?? null, summary?.deltaR ?? null, summary?.relErr ?? null, report.id);
  logActivity(userId, 'nop_bao_cao', moduleId);
  return getReport(userId, moduleId);
});

/** Mở lại báo cáo để học sinh làm một lượt đo mới; bản đã nộp vẫn giữ trong sổ điểm */
export const reopenReport = (userId, moduleId) => tx(() => {
  const report = getReport(userId, moduleId);
  run('DELETE FROM report_rows WHERE report_id = ?', report.id);
  run(`UPDATE lab_reports
       SET status = 'dang_lam', r_avg = NULL, delta_r = NULL, rel_err = NULL,
           submitted_at = NULL, updated_at = datetime('now')
       WHERE id = ?`, report.id);
  logActivity(userId, 'lam_bao_cao_moi', moduleId);
  return getReport(userId, moduleId);
});

export const saveCircuit = (payload) => tx(() => {
  const info = run(`INSERT INTO circuit_designs (user_id, module_id, name, payload, is_valid)
                    VALUES (?, ?, ?, ?, ?)`,
    payload.userId, payload.moduleId ?? null,
    payload.name ?? `Bản lắp ${new Date().toLocaleString('vi-VN')}`,
    JSON.stringify(payload.data ?? {}), payload.isValid ? 1 : 0);
  logActivity(payload.userId, 'luu_ban_lap', String(info.lastInsertRowid));
  return { id: Number(info.lastInsertRowid) };
});

export const listCircuits = (userId) =>
  all(`SELECT id, name, is_valid AS isValid, updated_at AS updatedAt
       FROM circuit_designs WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20`, userId);

export const getCircuit = (id) => {
  const row = get('SELECT * FROM circuit_designs WHERE id = ?', id);
  if (!row) return null;
  return { id: row.id, name: row.name, isValid: !!row.is_valid, data: JSON.parse(row.payload) };
};

/** Số liệu tổng hợp cho Bảng quản lý — tính trực tiếp từ dữ liệu thật */
export const teacherStats = (classCode) => {
  const cls = classCode
    ? get('SELECT * FROM classes WHERE code = ?', classCode)
    : get('SELECT * FROM classes ORDER BY created_at LIMIT 1');
  if (!cls) return null;

  const students = all(`SELECT user_id AS id, name, team, quiz_score, report_status
                        FROM v_student_progress WHERE class_id = ? ORDER BY team, name`, cls.id);
  const quizCompleted = students.filter((s) => s.quiz_score !== null).length;
  const reportsSubmitted = students.filter((s) => s.report_status === 'da_nop' || s.report_status === 'da_cham').length;
  const errorStats = all(
    'SELECT label AS question, wrong_count AS wrongCount FROM error_stats WHERE class_id = ? ORDER BY wrong_count DESC',
    cls.id);

  return {
    classCode: cls.code,
    className: cls.name,
    totalStudents: students.length,
    quizCompleted,
    reportsSubmitted,
    errorStats,
    studentList: students.map((s) => ({
      id: s.id,
      name: s.name,
      team: s.team,
      quizScore: s.quiz_score ?? 0,
      reportStatus: s.report_status === 'da_nop' || s.report_status === 'da_cham' ? 'Đạt' : 'Chưa đạt',
    })),
  };
};
