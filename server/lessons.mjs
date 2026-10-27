/**
 * Bài giảng tự do: giáo viên tự soạn nội dung và câu hỏi.
 *
 * Một bài giảng là một dãy KHỐI xếp theo thứ tự. Sáu loại khối:
 *
 *   text   — đoạn giảng bằng chữ
 *   image  — hình ảnh tải lên
 *   video  — video tải lên, hoặc dán liên kết YouTube
 *   file   — tệp đính kèm để học sinh tải về
 *   mcq    — câu trắc nghiệm, máy tự chấm
 *   short  — câu trả lời ngắn, máy so đáp án rồi giáo viên duyệt lại
 *
 * Nội dung và câu hỏi chung một bảng vì giáo viên soạn xen kẽ: giảng một đoạn,
 * cho xem hình, rồi hỏi ngay một câu về hình đó.
 */
import { randomUUID } from 'node:crypto';
import { all, get, run, tx, logActivity } from './db.mjs';

const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

const LOAI_KHOI = ['text', 'image', 'video', 'file', 'mcq', 'short'];
const LOAI_CAU_HOI = ['mcq', 'short'];
const TRANG_THAI = ['nhap', 'mo', 'dong'];

export const laCauHoi = (kind) => LOAI_CAU_HOI.includes(kind);

/* ------------------------------------------------------------------ */
/* Đọc                                                                 */
/* ------------------------------------------------------------------ */

const doiKhoi = (r) => ({
  id: r.id,
  kind: r.kind,
  sortOrder: r.sort_order,
  title: r.title,
  body: r.body,
  uploadId: r.upload_id,
  linkUrl: r.link_url,
  options: r.options ? safeJson(r.options) : null,
  answerKey: r.answer_key,
  points: r.points,
});

const safeJson = (s) => {
  try { return JSON.parse(s); } catch { return null; }
};

const khoiCuaBai = (lessonId) =>
  all('SELECT * FROM lesson_blocks WHERE lesson_id = ? ORDER BY sort_order, rowid', lessonId)
    .map(doiKhoi);

const SELECT_LESSON = `
  SELECT l.id, l.class_id AS classId, l.title, l.description,
         l.due_at AS dueAt, l.state, l.created_by AS createdBy,
         l.created_at AS createdAt,
         (SELECT COUNT(*) FROM lesson_blocks b WHERE b.lesson_id = l.id)        AS blockCount,
         (SELECT COUNT(*) FROM users u
           WHERE u.class_id = l.class_id AND u.role = 'hs')                     AS classSize,
         (SELECT COUNT(*) FROM lesson_submissions s
           WHERE s.lesson_id = l.id AND s.status <> 'dang_lam')                 AS submittedCount,
         (SELECT COUNT(*) FROM lesson_submissions s
           WHERE s.lesson_id = l.id AND s.status = 'da_cham')                   AS gradedCount
  FROM lessons l`;

export const chiTietBai = (id, { kemDapAn = false } = {}) => {
  const l = get(`${SELECT_LESSON} WHERE l.id = ?`, id);
  if (!l) return null;
  const blocks = khoiCuaBai(id);
  return { ...l, blocks: kemDapAn ? blocks : blocks.map(boDapAn), maxScore: tongDiem(blocks) };
};

/**
 * Bỏ đáp án trước khi gửi cho học sinh.
 *
 * Nếu gửi cả đáp án rồi trông cậy giao diện giấu đi thì mở công cụ nhà phát
 * triển là thấy hết. Đáp án phải không bao giờ rời khỏi máy chủ khi bài chưa chấm.
 */
const boDapAn = (b) => ({
  ...b,
  answerKey: null,
  options: Array.isArray(b.options)
    ? b.options.map((o) => ({ id: o.id, text: o.text }))
    : b.options,
});

export const tongDiem = (blocks) =>
  blocks.filter((b) => laCauHoi(b.kind)).reduce((s, b) => s + (Number(b.points) || 0), 0);

export const baiCuaLop = (classId) =>
  all(`${SELECT_LESSON} WHERE l.class_id = ? ORDER BY l.created_at DESC`, classId);

/** Bài giảng một học sinh nhìn thấy, kèm trạng thái làm bài của chính em đó */
export const baiCuaToi = (userId, classId) => {
  if (!classId) return [];
  return all(`
    SELECT l.id, l.title, l.description, l.due_at AS dueAt, l.state,
           (SELECT COUNT(*) FROM lesson_blocks b WHERE b.lesson_id = l.id) AS blockCount,
           s.status, s.score, s.max_score AS maxScore, s.late,
           s.teacher_comment AS teacherComment, s.submitted_at AS submittedAt,
           s.graded_at AS gradedAt
    FROM lessons l
    LEFT JOIN lesson_submissions s ON s.lesson_id = l.id AND s.user_id = ?
    WHERE l.class_id = ? AND l.state <> 'nhap'
    ORDER BY (l.due_at IS NULL), l.due_at, l.created_at DESC`, userId, classId);
};

/* ------------------------------------------------------------------ */
/* Giáo viên: soạn bài                                                 */
/* ------------------------------------------------------------------ */

const baiCuaMinh = (teacher, lessonId) => {
  const l = get('SELECT l.id, l.class_id AS classId, l.title, c.teacher_id AS teacherId '
    + 'FROM lessons l LEFT JOIN classes c ON c.id = l.class_id WHERE l.id = ?', lessonId);
  if (!l) fail('Không tìm thấy bài giảng này.', 404);
  if (teacher.role !== 'dev' && l.teacherId !== teacher.id) {
    fail('Bài giảng này không thuộc lớp bạn dạy.', 403);
  }
  return l;
};

export const taoBai = (teacher, { classId, title, description, dueAt }) => {
  const lop = classId || teacher.classId;
  if (!lop) {
    fail('Bạn chưa có lớp nào. Hãy tạo lớp ở mục Lớp học & nhóm thực hành trước.', 409);
  }
  const c = get('SELECT teacher_id AS t FROM classes WHERE id = ?', lop);
  if (!c) fail('Không tìm thấy lớp này.', 404);
  if (teacher.role !== 'dev' && c.t !== teacher.id) fail('Lớp này không phải lớp bạn dạy.', 403);

  const ten = String(title ?? '').trim();
  if (ten.length < 3) fail('Tên bài giảng phải có ít nhất 3 kí tự.');

  const id = `bg-${randomUUID().slice(0, 8)}`;
  run(`INSERT INTO lessons (id, class_id, title, description, due_at, state, created_by)
       VALUES (?, ?, ?, ?, ?, 'nhap', ?)`,
    id, lop, ten, String(description ?? '').trim(), dueAt ?? null, teacher.id);
  logActivity(teacher.id, 'tao_bai_giang', `${id} · ${ten}`);
  return chiTietBai(id, { kemDapAn: true });
};

export const suaBai = (teacher, lessonId, payload) => {
  baiCuaMinh(teacher, lessonId);
  if (payload.state !== undefined && !TRANG_THAI.includes(payload.state)) {
    fail('Trạng thái bài giảng không hợp lệ.');
  }
  if (payload.dueAt !== undefined && payload.dueAt !== null
    && Number.isNaN(Date.parse(payload.dueAt))) {
    fail('Hạn nộp không phải một mốc thời gian hợp lệ.');
  }

  /* Giao bài là lúc đòi mọi khối phải đủ; trước đó cứ soạn dở thoải mái */
  if (payload.state === 'mo') kiemDeGiao(lessonId);

  const dat = {
    title: payload.title?.trim(), description: payload.description,
    due_at: payload.dueAt, state: payload.state,
  };
  const set = Object.entries(dat).filter(([, v]) => v !== undefined);
  if (set.length) {
    run(`UPDATE lessons SET ${set.map(([k]) => `${k} = ?`).join(', ')},
         updated_at = datetime('now') WHERE id = ?`, ...set.map(([, v]) => v), lessonId);
  }
  if (payload.state === 'mo') logActivity(teacher.id, 'giao_bai_giang', lessonId);
  return chiTietBai(lessonId, { kemDapAn: true });
};

export const xoaBai = (teacher, lessonId) => {
  const l = baiCuaMinh(teacher, lessonId);
  run('DELETE FROM lessons WHERE id = ?', lessonId);
  logActivity(teacher.id, 'xoa_bai_giang', `${lessonId} · ${l.title}`);
  return { ok: true, id: lessonId };
};

/**
 * Kiểm khi LƯU một khối.
 *
 * Chỉ xét những thứ sai về cấu trúc, không đòi khối phải hoàn chỉnh. Soạn bài
 * là việc làm dần: thêm khối hình xong mới có chỗ bấm tải tệp lên, thêm câu
 * trắc nghiệm xong mới gõ được phương án. Đòi đủ ngay lúc tạo thì không bao giờ
 * tạo nổi khối nào — tệp phải có trước khối, mà chỗ chọn tệp lại nằm trong khối.
 *
 * Phần đòi đầy đủ nằm ở `kiemDeGiao`, chạy lúc bấm giao bài cho lớp.
 */
const kiemKhoi = (kind, p) => {
  if (!LOAI_KHOI.includes(kind)) fail('Loại khối nội dung không hợp lệ.');

  if (Array.isArray(p.options) && p.options.length) {
    const ids = p.options.map((o) => String(o?.id ?? '').trim());
    if (ids.some((x) => !x)) fail('Phương án nào cũng phải có mã.');
    if (new Set(ids).size !== ids.length) fail('Các phương án bị trùng mã.');
    const dap = String(p.answerKey ?? '');
    if (dap && !ids.includes(dap)) fail('Đáp án đúng phải là một trong các phương án.');
  }
  if (laCauHoi(kind) && p.points !== undefined && p.points !== null && p.points !== '') {
    const d = Number(p.points);
    if (!Number.isFinite(d) || d <= 0 || d > 100) fail('Điểm của câu hỏi phải trong khoảng 0–100.');
  }
};

/**
 * Kiểm khi GIAO bài cho lớp.
 *
 * Đây mới là chỗ đòi mọi khối phải đủ. Nêu rõ khối thứ mấy thiếu gì, vì bài dài
 * mà chỉ báo "có khối chưa xong" thì giáo viên phải dò lại từ đầu.
 */
const kiemDeGiao = (lessonId) => {
  const blocks = khoiCuaBai(lessonId);
  if (!blocks.length) {
    fail('Bài giảng chưa có nội dung nào. Hãy thêm ít nhất một khối trước khi giao.');
  }

  const thieu = [];
  blocks.forEach((b, i) => {
    const o = `Khối ${i + 1}`;
    if (['image', 'video', 'file'].includes(b.kind)
      && !b.uploadId && !String(b.linkUrl ?? '').trim()) {
      thieu.push(`${o} chưa có tệp hoặc liên kết`);
    }
    if (b.kind === 'text' && !String(b.body ?? '').trim() && !String(b.title ?? '').trim()) {
      thieu.push(`${o} chưa có nội dung`);
    }
    if (laCauHoi(b.kind) && !String(b.title ?? '').trim()) {
      thieu.push(`${o} chưa có câu hỏi`);
    }
    if (b.kind === 'mcq') {
      const opts = Array.isArray(b.options) ? b.options : [];
      const co = opts.filter((x) => String(x?.text ?? '').trim());
      if (co.length < 2) thieu.push(`${o} cần ít nhất 2 phương án có nội dung`);
      else if (!co.some((x) => x.id === b.answerKey)) thieu.push(`${o} chưa chọn đáp án đúng`);
    }
    if (b.kind === 'short' && !String(b.answerKey ?? '').trim()) {
      thieu.push(`${o} chưa có đáp án mẫu`);
    }
  });

  if (thieu.length) fail(`Chưa giao được: ${thieu.join('; ')}.`);
};

export const themKhoi = (teacher, lessonId, p) => tx(() => {
  baiCuaMinh(teacher, lessonId);
  kiemKhoi(p.kind, p);

  const ke = (get('SELECT MAX(sort_order) AS m FROM lesson_blocks WHERE lesson_id = ?', lessonId).m ?? -1) + 1;
  const id = `kh-${randomUUID().slice(0, 8)}`;
  run(`INSERT INTO lesson_blocks
         (id, lesson_id, kind, sort_order, title, body, upload_id, link_url, options, answer_key, points)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, lessonId, p.kind, ke, String(p.title ?? '').trim(), String(p.body ?? '').trim(),
    p.uploadId ?? null, String(p.linkUrl ?? '').trim() || null,
    p.options ? JSON.stringify(p.options) : null,
    p.answerKey ?? null, laCauHoi(p.kind) ? Number(p.points) || 1 : 0);
  return chiTietBai(lessonId, { kemDapAn: true });
});

export const suaKhoi = (teacher, lessonId, blockId, p) => tx(() => {
  baiCuaMinh(teacher, lessonId);
  const cu = get('SELECT * FROM lesson_blocks WHERE id = ? AND lesson_id = ?', blockId, lessonId);
  if (!cu) fail('Không tìm thấy khối nội dung này.', 404);

  /* Ghép phần gửi lên với phần cũ rồi mới kiểm, vì người dùng có thể chỉ sửa
     một trường — kiểm riêng phần gửi lên thì câu hỏi cũ bỗng thành không hợp lệ. */
  const gop = {
    title: p.title ?? cu.title,
    body: p.body ?? cu.body,
    uploadId: p.uploadId !== undefined ? p.uploadId : cu.upload_id,
    linkUrl: p.linkUrl !== undefined ? p.linkUrl : cu.link_url,
    options: p.options !== undefined ? p.options : safeJson(cu.options),
    answerKey: p.answerKey !== undefined ? p.answerKey : cu.answer_key,
    points: p.points !== undefined ? p.points : cu.points,
  };
  kiemKhoi(cu.kind, gop);

  run(`UPDATE lesson_blocks
       SET title = ?, body = ?, upload_id = ?, link_url = ?, options = ?, answer_key = ?, points = ?
       WHERE id = ?`,
    String(gop.title ?? '').trim(), String(gop.body ?? '').trim(),
    gop.uploadId ?? null, String(gop.linkUrl ?? '').trim() || null,
    gop.options ? JSON.stringify(gop.options) : null,
    gop.answerKey ?? null, laCauHoi(cu.kind) ? Number(gop.points) || 1 : 0,
    blockId);
  return chiTietBai(lessonId, { kemDapAn: true });
});

export const xoaKhoi = (teacher, lessonId, blockId) => {
  baiCuaMinh(teacher, lessonId);
  run('DELETE FROM lesson_blocks WHERE id = ? AND lesson_id = ?', blockId, lessonId);
  return chiTietBai(lessonId, { kemDapAn: true });
};

/** Đổi thứ tự các khối. Nhận cả danh sách mã khối theo thứ tự mới. */
export const sapXepKhoi = (teacher, lessonId, order) => tx(() => {
  baiCuaMinh(teacher, lessonId);
  if (!Array.isArray(order)) fail('Thứ tự phải là một danh sách mã khối.');
  const co = new Set(all('SELECT id FROM lesson_blocks WHERE lesson_id = ?', lessonId)
    .map((r) => r.id));
  order.forEach((id, i) => {
    if (co.has(id)) run('UPDATE lesson_blocks SET sort_order = ? WHERE id = ?', i, id);
  });
  return chiTietBai(lessonId, { kemDapAn: true });
});

/* ------------------------------------------------------------------ */
/* Học sinh: làm bài                                                   */
/* ------------------------------------------------------------------ */

const baiMoChoHocSinh = (student, lessonId) => {
  const l = get('SELECT id, class_id AS classId, title, due_at AS dueAt, state FROM lessons WHERE id = ?',
    lessonId);
  if (!l) fail('Không tìm thấy bài giảng này.', 404);
  if (l.classId !== student.classId) fail('Bài giảng này không giao cho lớp của em.', 403);
  if (l.state === 'nhap') fail('Bài giảng này chưa được giao.', 403);
  return l;
};

/**
 * Bài giảng học sinh mở ra xem.
 *
 * Đáp án chỉ kèm theo SAU KHI giáo viên đã chấm, để em xem lại mình sai ở đâu.
 * Trước đó thì không, kể cả khi đã nộp — vì còn nộp lại được.
 */
export const xemBai = (student, lessonId) => {
  const l = baiMoChoHocSinh(student, lessonId);
  const sub = get('SELECT * FROM lesson_submissions WHERE lesson_id = ? AND user_id = ?',
    lessonId, student.id);
  const daCham = sub?.status === 'da_cham';
  const bai = chiTietBai(lessonId, { kemDapAn: daCham });

  const traLoi = sub
    ? all(`SELECT block_id AS blockId, answer, is_correct AS isCorrect, points
           FROM lesson_answers WHERE submission_id = ?`, sub.id)
    : [];

  return {
    ...bai,
    state: l.state,
    submission: sub ? {
      status: sub.status, score: sub.score, maxScore: sub.max_score, late: sub.late,
      teacherComment: sub.teacher_comment, submittedAt: sub.submitted_at, gradedAt: sub.graded_at,
    } : null,
    /* Chấm đúng/sai cũng chỉ hiện khi đã chấm, nếu không là lộ đáp án gián tiếp:
       nộp thử một phương án, xem đúng hay sai, rồi nộp lại cho tới khi trúng. */
    answers: traLoi.map((a) => (daCham ? a : { blockId: a.blockId, answer: a.answer })),
  };
};

const chuanHoa = (s) => String(s ?? '')
  .trim().toLowerCase()
  .normalize('NFC')
  .replace(/\s+/g, ' ')
  .replace(/[.,;:!?]+$/, '');

/**
 * Chấm một câu.
 *
 * Trắc nghiệm so mã phương án, chắc chắn đúng sai nên chấm hẳn.
 * Câu trả lời ngắn so chữ sau khi chuẩn hoá; khớp thì cho điểm, không khớp thì
 * để NGỎ (null) chứ không chấm sai — "hiệu điện thế" và "hiệu điện thế U" đều
 * đúng mà máy không biết, nên phải để giáo viên xem.
 */
export const chamMotCau = (block, answer) => {
  if (block.kind === 'mcq') {
    const dung = String(answer ?? '') === String(block.answerKey ?? '');
    return { isCorrect: dung ? 1 : 0, points: dung ? Number(block.points) || 0 : 0 };
  }
  if (block.kind === 'short') {
    const dapAn = String(block.answerKey ?? '').split('|').map(chuanHoa).filter(Boolean);
    const traLoi = chuanHoa(answer);
    if (!traLoi) return { isCorrect: 0, points: 0 };
    if (dapAn.includes(traLoi)) return { isCorrect: 1, points: Number(block.points) || 0 };
    return { isCorrect: null, points: 0 };
  }
  return { isCorrect: null, points: 0 };
};

/** Lưu tạm bài làm, chưa nộp — để học sinh làm dở rồi quay lại */
export const luuTam = (student, lessonId, answers) => tx(() => {
  baiMoChoHocSinh(student, lessonId);
  const sub = moBaiLam(lessonId, student.id);
  if (sub.status === 'da_cham') fail('Bài này đã chấm, không sửa được nữa.', 409);
  ghiTraLoi(sub.id, answers);
  run("UPDATE lesson_submissions SET updated_at = datetime('now') WHERE id = ?", sub.id);
  return { ok: true };
});

const moBaiLam = (lessonId, userId) => {
  const co = get('SELECT * FROM lesson_submissions WHERE lesson_id = ? AND user_id = ?',
    lessonId, userId);
  if (co) return co;
  run('INSERT INTO lesson_submissions (lesson_id, user_id) VALUES (?, ?)', lessonId, userId);
  return get('SELECT * FROM lesson_submissions WHERE lesson_id = ? AND user_id = ?',
    lessonId, userId);
};

const ghiTraLoi = (submissionId, answers) => {
  Object.entries(answers ?? {}).forEach(([blockId, answer]) => {
    run(`INSERT INTO lesson_answers (submission_id, block_id, answer)
         VALUES (?, ?, ?)
         ON CONFLICT (submission_id, block_id) DO UPDATE SET answer = excluded.answer`,
      submissionId, blockId, String(answer ?? ''));
  });
};

export const nopBai = (student, lessonId, answers) => tx(() => {
  const l = baiMoChoHocSinh(student, lessonId);
  if (l.state === 'dong') fail('Bài giảng này đã đóng, không nhận bài nữa.', 403);

  const sub = moBaiLam(lessonId, student.id);
  if (sub.status === 'da_cham') fail('Bài này giáo viên đã chấm, không nộp lại được.', 409);
  ghiTraLoi(sub.id, answers);

  /* Chấm trên bản đáp án lấy từ CSDL, không dùng gì do trình duyệt gửi lên */
  const blocks = khoiCuaBai(lessonId).filter((b) => laCauHoi(b.kind));
  const daTraLoi = new Map(all('SELECT block_id AS b, answer FROM lesson_answers WHERE submission_id = ?',
    sub.id).map((r) => [r.b, r.answer]));

  let diem = 0;
  let cheoNgo = false;
  blocks.forEach((b) => {
    const kq = chamMotCau(b, daTraLoi.get(b.id));
    if (kq.isCorrect === null) cheoNgo = true;
    diem += kq.points;
    run('UPDATE lesson_answers SET is_correct = ?, points = ? WHERE submission_id = ? AND block_id = ?',
      kq.isCorrect, kq.points, sub.id, b.id);
  });

  const toiDa = tongDiem(blocks);
  const tre = l.dueAt && Date.now() > Date.parse(l.dueAt) ? 1 : 0;
  run(`UPDATE lesson_submissions
       SET status = 'da_nop', score = ?, max_score = ?, late = ?,
           submitted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`, Math.round(diem * 100) / 100, toiDa, tre, sub.id);

  logActivity(student.id, 'nop_bai_giang', `${lessonId} · ${diem}/${toiDa}`);
  return {
    status: 'da_nop',
    score: Math.round(diem * 100) / 100,
    maxScore: toiDa,
    late: tre,
    /* Có câu máy không chắc thì nói trước, để em khỏi tưởng điểm đã là điểm cuối */
    needsReview: cheoNgo,
  };
});

/* ------------------------------------------------------------------ */
/* Giáo viên: xem và chấm                                              */
/* ------------------------------------------------------------------ */

export const bangTheoDoi = (teacher, lessonId) => {
  const l = baiCuaMinh(teacher, lessonId);
  const rows = all(`
    SELECT u.id AS userId, u.name, u.seat_no AS seatNo,
           COALESCE(t.name, 'Làm riêng lẻ') AS team,
           COALESCE(t.group_no, 0) AS groupNo,
           COALESCE(s.status, 'chua_lam') AS status,
           s.score, s.max_score AS maxScore, s.late,
           s.teacher_comment AS teacherComment,
           s.submitted_at AS submittedAt, s.graded_at AS gradedAt
    FROM users u
    LEFT JOIN teams t ON t.id = u.team_id
    LEFT JOIN lesson_submissions s ON s.lesson_id = ? AND s.user_id = u.id
    WHERE u.class_id = ? AND u.role = 'hs'
    ORDER BY COALESCE(t.group_no, 0), COALESCE(u.seat_no, 999), u.name`, lessonId, l.classId);
  return { lesson: chiTietBai(lessonId, { kemDapAn: true }), rows };
};

/** Bài làm chi tiết của một học sinh, để giáo viên đọc từng câu rồi chấm */
export const baiLamCuaHocSinh = (teacher, lessonId, userId) => {
  baiCuaMinh(teacher, lessonId);
  const sub = get('SELECT * FROM lesson_submissions WHERE lesson_id = ? AND user_id = ?',
    lessonId, userId);
  const blocks = khoiCuaBai(lessonId);
  const traLoi = sub
    ? all(`SELECT block_id AS blockId, answer, is_correct AS isCorrect, points
           FROM lesson_answers WHERE submission_id = ?`, sub.id)
    : [];
  return {
    student: get('SELECT id, name, seat_no AS seatNo FROM users WHERE id = ?', userId),
    blocks,
    answers: traLoi,
    submission: sub ? {
      status: sub.status, score: sub.score, maxScore: sub.max_score,
      late: sub.late, teacherComment: sub.teacher_comment,
      submittedAt: sub.submitted_at, gradedAt: sub.graded_at,
    } : null,
  };
};

export const chamBai = (teacher, lessonId, userId, { score, comment, perBlock }) => tx(() => {
  baiCuaMinh(teacher, lessonId);
  const sub = moBaiLam(lessonId, userId);

  /* Giáo viên sửa điểm từng câu — chủ yếu cho câu trả lời ngắn máy để ngỏ */
  if (perBlock && typeof perBlock === 'object') {
    Object.entries(perBlock).forEach(([blockId, d]) => {
      const diem = Number(d);
      if (!Number.isFinite(diem) || diem < 0) return;
      run(`UPDATE lesson_answers SET points = ?, is_correct = ?
           WHERE submission_id = ? AND block_id = ?`,
        diem, diem > 0 ? 1 : 0, sub.id, blockId);
    });
  }

  const tong = get('SELECT COALESCE(SUM(points), 0) AS s FROM lesson_answers WHERE submission_id = ?',
    sub.id).s;
  const cuoi = score === undefined || score === null || score === ''
    ? Math.round(Number(tong) * 100) / 100
    : Number(score);
  if (!Number.isFinite(cuoi) || cuoi < 0) fail('Điểm không hợp lệ.');

  run(`UPDATE lesson_submissions
       SET status = 'da_cham', score = ?, teacher_comment = ?,
           graded_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`, cuoi, comment ?? null, sub.id);
  logActivity(teacher.id, 'cham_bai_giang', `${lessonId} · ${userId} · ${cuoi}`);
  return { ok: true, userId, score: cuoi };
});

export const traBaiLamLai = (teacher, lessonId, userId) => {
  baiCuaMinh(teacher, lessonId);
  run(`UPDATE lesson_submissions SET status = 'dang_lam', graded_at = NULL,
       updated_at = datetime('now') WHERE lesson_id = ? AND user_id = ?`, lessonId, userId);
  return { ok: true };
};
