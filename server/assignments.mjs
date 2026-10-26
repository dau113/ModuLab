/**
 * Giao bài, làm bài, nộp bài và chấm bài.
 *
 * Một bài tập thuộc về một lớp, nên mọi học sinh trong lớp đều nhận được mà
 * không cần bảng trung gian ghi từng người. Dòng trong `submissions` chỉ sinh
 * ra khi học sinh thật sự bắt tay vào làm; ai chưa động tới thì không có dòng
 * nào và bảng theo dõi hiểu đó là "chưa làm". Cách này giữ cho bảng không phình
 * theo sĩ số, và thêm học sinh vào lớp giữa chừng vẫn nhận đủ bài đã giao.
 */
import { randomUUID } from 'node:crypto';
import { all, get, run, tx, logActivity } from './db.mjs';

const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

const KINDS = ['khoi_dong', 'thuc_hanh'];
const STATES = ['nhap', 'mo', 'dong'];

/* ------------------------------------------------------------------ */
/* Đọc                                                                 */
/* ------------------------------------------------------------------ */

const SELECT_ASSIGNMENT = `
  SELECT a.id, a.class_id AS classId, a.kind, a.module_id AS moduleId,
         a.title, a.instructions, a.due_at AS dueAt, a.pass_score AS passScore,
         a.state, a.created_by AS createdBy, a.created_at AS createdAt,
         COALESCE(c.code, '')  AS classCode,
         COALESCE(m.title, '') AS moduleTitle,
         (SELECT COUNT(*) FROM users u
           WHERE u.class_id = a.class_id AND u.role = 'hs')          AS classSize,
         (SELECT COUNT(*) FROM submissions s
           WHERE s.assignment_id = a.id AND s.status <> 'dang_lam')  AS submittedCount,
         (SELECT COUNT(*) FROM submissions s
           WHERE s.assignment_id = a.id AND s.status = 'da_cham')    AS gradedCount
  FROM assignments a
  LEFT JOIN classes     c ON c.id = a.class_id
  LEFT JOIN lab_modules m ON m.id = a.module_id`;

export const getAssignment = (id) => get(`${SELECT_ASSIGNMENT} WHERE a.id = ?`, id);

/** Danh sách bài tập của một lớp, bài mới giao nằm trên */
export const listAssignments = (classId) =>
  all(`${SELECT_ASSIGNMENT} WHERE a.class_id = ? ORDER BY a.created_at DESC`, classId);

/**
 * Bài tập mà một học sinh đang có, kèm trạng thái làm bài của chính em đó.
 * Bài còn ở trạng thái nháp thì học sinh chưa nhìn thấy.
 */
export const myAssignments = (userId, classId) => all(`
  SELECT a.id, a.kind, a.module_id AS moduleId, a.title, a.instructions,
         a.due_at AS dueAt, a.pass_score AS passScore, a.state,
         COALESCE(m.title, '') AS moduleTitle,
         s.status, s.score, s.late, s.teacher_comment AS teacherComment,
         s.submitted_at AS submittedAt, s.graded_at AS gradedAt
  FROM assignments a
  LEFT JOIN lab_modules m ON m.id = a.module_id
  LEFT JOIN submissions s ON s.assignment_id = a.id AND s.user_id = ?
  WHERE a.class_id = ? AND a.state <> 'nhap'
  ORDER BY (a.due_at IS NULL), a.due_at, a.created_at DESC`, userId, classId);

/**
 * Bảng theo dõi một bài tập: mỗi học sinh trong lớp một dòng, kể cả em chưa làm.
 * LEFT JOIN từ bảng users chứ không từ bảng submissions, nên em chưa nộp vẫn
 * hiện ra — đây mới là thứ giáo viên cần nhìn.
 */
export const assignmentBoard = (assignmentId) => {
  const a = getAssignment(assignmentId);
  if (!a) fail('Không tìm thấy bài tập này.', 404);
  const rows = all(`
    SELECT u.id AS userId, u.name, u.seat_no AS seatNo,
           COALESCE(t.name, 'Làm riêng lẻ') AS team,
           COALESCE(t.group_no, 0) AS groupNo,
           COALESCE(s.status, 'chua_lam') AS status,
           s.score, s.late, s.teacher_comment AS teacherComment,
           s.submitted_at AS submittedAt, s.graded_at AS gradedAt
    FROM users u
    LEFT JOIN teams t ON t.id = u.team_id
    LEFT JOIN submissions s ON s.assignment_id = ? AND s.user_id = u.id
    WHERE u.class_id = ? AND u.role = 'hs'
    ORDER BY COALESCE(t.group_no, 0), COALESCE(u.seat_no, 999), u.name`, assignmentId, a.classId);

  /* Gom theo nhóm để giáo viên nhìn ra nhóm nào xong, nhóm nào còn người chưa nộp.
     Nhóm 0 là các em làm riêng lẻ, vẫn gom chung một khối cho dễ đọc. */
  const nhom = [];
  rows.forEach((r) => {
    let g = nhom.find((x) => x.groupNo === r.groupNo);
    if (!g) {
      g = { groupNo: r.groupNo, name: r.team, members: [], submitted: 0, graded: 0 };
      nhom.push(g);
    }
    g.members.push(r);
    if (r.status !== 'chua_lam' && r.status !== 'dang_lam') g.submitted++;
    if (r.status === 'da_cham') g.graded++;
  });

  return { assignment: a, rows, groups: nhom };
};

/* ------------------------------------------------------------------ */
/* Giáo viên: tạo, sửa, đóng bài                                       */
/* ------------------------------------------------------------------ */

const checkFields = ({ kind, state, dueAt, passScore }) => {
  if (kind !== undefined && !KINDS.includes(kind)) fail('Loại bài tập không hợp lệ.');
  if (state !== undefined && !STATES.includes(state)) fail('Trạng thái bài tập không hợp lệ.');
  if (dueAt !== undefined && dueAt !== null && Number.isNaN(Date.parse(dueAt))) {
    fail('Hạn nộp không phải là một mốc thời gian hợp lệ.');
  }
  if (passScore !== undefined && (Number(passScore) < 0 || Number(passScore) > 10)) {
    fail('Điểm đạt phải nằm trong khoảng 0 đến 10.');
  }
};

export const createAssignment = (teacher, payload) => {
  if (!teacher.classId) {
    fail('Bạn chưa có lớp nào. Hãy tạo lớp ở mục Lớp học & nhóm thực hành trước, '
      + 'rồi mới giao bài được.', 409);
  }
  const title = String(payload.title ?? '').trim();
  if (title.length < 3) fail('Tên bài tập phải có ít nhất 3 kí tự.');
  checkFields(payload);

  const id = `bt-${randomUUID().slice(0, 8)}`;
  run(`INSERT INTO assignments
         (id, class_id, kind, module_id, title, instructions, due_at, pass_score, state, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, teacher.classId, payload.kind ?? 'khoi_dong', payload.moduleId ?? null,
    title, String(payload.instructions ?? '').trim(),
    payload.dueAt ?? null, Number(payload.passScore ?? 5),
    payload.state ?? 'mo', teacher.id);

  logActivity(teacher.id, 'giao_bai_tap', `${id} · ${title}`);
  return getAssignment(id);
};

export const updateAssignment = (teacher, id, payload) => {
  const a = getAssignment(id);
  if (!a) fail('Không tìm thấy bài tập này.', 404);
  if (a.classId !== teacher.classId) fail('Bài tập này không thuộc lớp của bạn.', 403);
  checkFields(payload);

  /* Chỉ ghi đè những trường được gửi lên, trường bỏ trống giữ nguyên giá trị cũ */
  const fields = {
    kind: payload.kind, module_id: payload.moduleId, title: payload.title?.trim(),
    instructions: payload.instructions, due_at: payload.dueAt,
    pass_score: payload.passScore, state: payload.state,
  };
  const set = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!set.length) return a;

  run(`UPDATE assignments SET ${set.map(([k]) => `${k} = ?`).join(', ')},
       updated_at = datetime('now') WHERE id = ?`, ...set.map(([, v]) => v), id);
  logActivity(teacher.id, 'sua_bai_tap', id);
  return getAssignment(id);
};

export const deleteAssignment = (teacher, id) => {
  const a = getAssignment(id);
  if (!a) fail('Không tìm thấy bài tập này.', 404);
  if (a.classId !== teacher.classId) fail('Bài tập này không thuộc lớp của bạn.', 403);
  run('DELETE FROM assignments WHERE id = ?', id);
  logActivity(teacher.id, 'xoa_bai_tap', `${id} · ${a.title}`);
  return { ok: true, id };
};

/* ------------------------------------------------------------------ */
/* Học sinh: bắt đầu làm và nộp bài                                    */
/* ------------------------------------------------------------------ */

/** Tìm dòng bài nộp của học sinh, chưa có thì mở một dòng mới ở trạng thái đang làm */
const ensureSubmission = (assignmentId, userId) => {
  const found = get('SELECT * FROM submissions WHERE assignment_id = ? AND user_id = ?',
    assignmentId, userId);
  if (found) return found;
  run('INSERT INTO submissions (assignment_id, user_id) VALUES (?, ?)', assignmentId, userId);
  return get('SELECT * FROM submissions WHERE assignment_id = ? AND user_id = ?',
    assignmentId, userId);
};

/** Kiểm tra học sinh có quyền làm bài này không, trả về bài tập nếu hợp lệ */
const openAssignmentFor = (student, assignmentId) => {
  const a = getAssignment(assignmentId);
  if (!a) fail('Không tìm thấy bài tập này.', 404);
  if (a.classId !== student.classId) fail('Bài tập này không giao cho lớp của em.', 403);
  if (a.state === 'nhap') fail('Bài tập này chưa được giao.', 403);
  return a;
};

export const startAssignment = (student, assignmentId) => {
  const a = openAssignmentFor(student, assignmentId);
  if (a.state === 'dong') fail('Bài tập này đã đóng, không nhận bài nữa.', 403);
  ensureSubmission(assignmentId, student.id);
  return { ok: true };
};

/**
 * Nộp bài và tự chấm.
 *
 * Điểm lấy từ chính dữ liệu học sinh đã làm trong ứng dụng chứ không nhận điểm
 * do trình duyệt gửi lên — trình duyệt chỉ nói "em nộp lượt chơi số mấy" hoặc
 * "em nộp bản báo cáo của bài nào", còn điểm thì máy chủ tự đọc từ cơ sở dữ liệu
 * rồi tính. Nếu tin điểm trình duyệt gửi thì ai cũng tự cho mình 10.
 */
export const submitAssignment = (student, assignmentId, payload) => tx(() => {
  const a = openAssignmentFor(student, assignmentId);
  if (a.state === 'dong') fail('Bài tập này đã đóng, không nhận bài nữa.', 403);

  const sub = ensureSubmission(assignmentId, student.id);
  if (sub.status === 'da_cham') fail('Bài này giáo viên đã chấm, không nộp lại được.', 409);

  let score = null;
  let attemptId = null;
  let reportId = null;

  if (a.kind === 'khoi_dong') {
    /* Lượt chơi tốt nhất, xếp theo TỈ LỆ CÂU ĐÚNG chứ không theo điểm trò chơi:
       điểm trò chơi có thưởng nhanh và thưởng chuỗi nên lượt trả lời vội mà sai
       nhiều vẫn có thể hơn điểm lượt làm cẩn thận. */
    const att = get(`SELECT id, score, correct, total FROM quiz_attempts
                     WHERE user_id = ? AND (? IS NULL OR module_id = ?)
                       AND finished_at IS NOT NULL
                     ORDER BY (CAST(COALESCE(correct, 0) AS REAL) / MAX(total, 1)) DESC,
                              finished_at DESC
                     LIMIT 1`, student.id, a.moduleId, a.moduleId);
    if (!att) fail('Em chưa chơi xong lượt Game ôn tập nào để nộp.', 400);
    attemptId = att.id;
    score = diemTuLuotChoi(att);
  } else {
    const rep = get(`SELECT id, status, rel_err FROM lab_reports
                     WHERE user_id = ? AND module_id = ?`, student.id, a.moduleId ?? '');
    if (!rep) fail('Em chưa có bản báo cáo thực hành nào cho bài này.', 400);
    if (rep.status === 'dang_lam') fail('Em cần bấm nộp trong phần Báo cáo thực hành trước đã.', 400);
    reportId = rep.id;
    score = gradeFromError(rep.rel_err, a.moduleId);
  }

  const late = a.dueAt && Date.now() > Date.parse(a.dueAt) ? 1 : 0;
  run(`UPDATE submissions
       SET status = 'da_nop', score = ?, attempt_id = ?, report_id = ?, late = ?,
           submitted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`, score, attemptId, reportId, late, sub.id);

  logActivity(student.id, 'nop_bai_tap', `${assignmentId} · ${score} điểm${late ? ' · trễ hạn' : ''}`);
  return get(`SELECT assignment_id AS assignmentId, status, score, late,
                     submitted_at AS submittedAt
              FROM submissions WHERE id = ?`, sub.id);
});

/**
 * Quy một lượt chơi ra điểm 10.
 *
 * Dùng SỐ CÂU ĐÚNG chia số câu, không dùng cột `score`. Cột `score` là điểm trò
 * chơi: mỗi câu đúng 10 điểm cộng thưởng trả lời nhanh và thưởng chuỗi, nên
 * tính theo nó thì mười câu có thể ra "36/10".
 *
 * Lượt chơi cũ từ trước khi có cột `correct` thì không suy ngược ra được, nên
 * chỉ chặn trong khoảng 0–10 để sổ điểm không hiện con số vô lí.
 */
export const diemTuLuotChoi = (att) => {
  if (!att || !(att.total > 0)) return 0;

  /* Phải so với null/undefined chứ không dùng Number.isFinite: Number(null) ra 0
     chứ không ra NaN, nên viết kiểu đó thì lượt chơi cũ bị chấm 0 oan. */
  if (att.correct !== null && att.correct !== undefined) {
    return Math.round((Number(att.correct) / att.total) * 100) / 10;
  }

  /* Lượt chơi cũ, trước khi có cột `correct`. Mỗi câu đúng đáng khoảng 10 điểm
     trò chơi, nên điểm chia số câu là ước lượng sát nhất còn lấy được: đúng hẳn
     với bản đồ phiêu lưu, hơi rộng tay với trắc nghiệm vì có thưởng. Chặn trong
     khoảng 0–10 để không bao giờ ra những con số như 36/10 nữa. */
  const uoc = (Number(att.score) || 0) / att.total;
  return Math.max(0, Math.min(10, Math.round(uoc * 10) / 10));
};

/**
 * Quy sai số tương đối ra điểm 10.
 *
 * Đạt đúng ngưỡng của bài thì được 7; sai số bằng 0 được 10; sai số gấp ba lần
 * ngưỡng trở lên thì về 0. Giữa các mốc thì nội suy thẳng. Cách tính này cho
 * điểm nhích dần theo độ chính xác thay vì chỉ đạt hoặc trượt.
 */
export const gradeFromError = (relErr, moduleId) => {
  if (relErr === null || relErr === undefined) return null;
  const row = moduleId ? get('SELECT max_error FROM lab_modules WHERE id = ?', moduleId) : null;
  const nguong = Number(row?.max_error) > 0 ? Number(row.max_error) : 0.1;
  const e = Math.abs(Number(relErr));
  if (!Number.isFinite(e)) return null;
  if (e <= nguong) return Math.round((10 - (e / nguong) * 3) * 10) / 10;
  const thua = Math.min((e - nguong) / (2 * nguong), 1);
  return Math.round((7 - thua * 7) * 10) / 10;
};

/* ------------------------------------------------------------------ */
/* Giáo viên: chấm bài                                                 */
/* ------------------------------------------------------------------ */

export const gradeSubmission = (teacher, assignmentId, userId, { score, comment }) => {
  const a = getAssignment(assignmentId);
  if (!a) fail('Không tìm thấy bài tập này.', 404);
  if (a.classId !== teacher.classId) fail('Bài tập này không thuộc lớp của bạn.', 403);

  const diem = score === null || score === undefined ? null : Number(score);
  if (diem !== null && (!Number.isFinite(diem) || diem < 0 || diem > 10)) {
    fail('Điểm phải nằm trong khoảng 0 đến 10.');
  }

  const sub = ensureSubmission(assignmentId, userId);
  run(`UPDATE submissions
       SET status = 'da_cham', score = COALESCE(?, score), teacher_comment = ?,
           graded_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`, diem, comment ?? null, sub.id);

  logActivity(teacher.id, 'cham_bai', `${assignmentId} · ${userId}`);
  return get(`SELECT user_id AS userId, status, score, teacher_comment AS teacherComment,
                     graded_at AS gradedAt
              FROM submissions WHERE id = ?`, sub.id);
};

/** Trả bài về trạng thái đã nộp để học sinh sửa rồi nộp lại */
export const reopenSubmission = (teacher, assignmentId, userId) => {
  const a = getAssignment(assignmentId);
  if (!a) fail('Không tìm thấy bài tập này.', 404);
  if (a.classId !== teacher.classId) fail('Bài tập này không thuộc lớp của bạn.', 403);
  run(`UPDATE submissions SET status = 'dang_lam', graded_at = NULL,
       updated_at = datetime('now')
       WHERE assignment_id = ? AND user_id = ?`, assignmentId, userId);
  logActivity(teacher.id, 'tra_bai_lam_lai', `${assignmentId} · ${userId}`);
  return { ok: true };
};
