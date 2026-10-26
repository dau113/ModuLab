/**
 * Lớp học, nhóm thực hành và mã vào lớp.
 *
 * MÃ VÀO LỚP có dạng `<4 chữ số lớp>N<số nhóm>`, ví dụ `1204N2` là lớp mã 1204,
 * nhóm 2. Nhóm 0 nghĩa là làm riêng lẻ, nên `1204N0` dành cho học sinh không
 * thuộc nhóm nào. Số thứ tự của học sinh KHÔNG nằm trong mã — em tự nhập vào
 * một ô riêng khi vào lớp. Nhờ vậy giáo viên chỉ phải phát một mã cho cả nhóm
 * thay vì bốn mươi mã khác nhau.
 */
import { randomUUID } from 'node:crypto';
import { all, get, run, tx, logActivity } from './db.mjs';

const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

/** Nhóm 0 luôn tồn tại trong mọi lớp và mang nghĩa "làm riêng lẻ" */
export const NHOM_RIENG_LE = 0;

/* ------------------------------------------------------------------ */
/* Mã vào lớp                                                          */
/* ------------------------------------------------------------------ */

const MA_RE = /^(\d{4})N(\d{1,2})$/i;

/** Ghép mã vào lớp từ mã lớp và số nhóm */
export const ghepMa = (joinCode, groupNo) => `${joinCode}N${groupNo}`;

/**
 * Tách mã học sinh gõ vào. Bỏ khoảng trắng và không phân biệt hoa thường, vì
 * mã thường được chép tay từ bảng hoặc đọc miệng trong lớp.
 */
export const tachMa = (raw) => {
  const s = String(raw ?? '').replace(/[\s-]/g, '').toUpperCase();
  const m = s.match(MA_RE);
  if (!m) return null;
  return { joinCode: m[1], groupNo: Number(m[2]) };
};

/** Mã lớp bốn chữ số nhỏ nhất còn trống, dùng khi giáo viên không tự đặt */
const maLopTrong = (goiY) => {
  const daDung = new Set(all('SELECT join_code FROM classes WHERE join_code IS NOT NULL')
    .map((r) => r.join_code));
  if (goiY && /^\d{4}$/.test(goiY) && !daDung.has(goiY)) return goiY;
  for (let i = 1001; i <= 9999; i++) {
    const thu = String(i);
    if (!daDung.has(thu)) return thu;
  }
  fail('Hết mã lớp để cấp.', 500);
  return null;
};

/** Đoán mã bốn chữ số từ tên lớp: "12A4" cho ra "1204" */
export const doanMaTuTen = (ten) => {
  const m = String(ten ?? '').match(/(\d{1,2})\s*[A-Za-zÀ-ỹ]*\s*(\d{1,2})/);
  if (!m) return null;
  return `${String(Number(m[1])).padStart(2, '0')}${String(Number(m[2])).padStart(2, '0')}`;
};

/* ------------------------------------------------------------------ */
/* Đọc                                                                 */
/* ------------------------------------------------------------------ */

const nhomCuaLop = (classId) => all(`
  SELECT t.id, t.group_no AS groupNo, t.name,
         (SELECT COUNT(*) FROM users u WHERE u.team_id = t.id AND u.role = 'hs') AS memberCount
  FROM teams t WHERE t.class_id = ? ORDER BY t.group_no`, classId);

/** Một lớp kèm danh sách nhóm và mã vào lớp của từng nhóm */
export const chiTietLop = (classId) => {
  const c = get(`SELECT id, code, name, join_code AS joinCode, teacher_id AS teacherId,
                        created_at AS createdAt FROM classes WHERE id = ?`, classId);
  if (!c) return null;
  return {
    ...c,
    studentCount: get("SELECT COUNT(*) AS n FROM users WHERE class_id = ? AND role = 'hs'", classId).n,
    groups: nhomCuaLop(classId).map((g) => ({ ...g, joinCode: ghepMa(c.joinCode, g.groupNo) })),
  };
};

/** Các lớp một giáo viên đang dạy */
export const lopCuaGiaoVien = (teacherId) =>
  all('SELECT id FROM classes WHERE teacher_id = ? ORDER BY created_at', teacherId)
    .map((r) => chiTietLop(r.id));

/* ------------------------------------------------------------------ */
/* Giáo viên: tạo và sửa lớp                                           */
/* ------------------------------------------------------------------ */

export const taoLop = (teacher, { name, code, joinCode, groupCount }) => tx(() => {
  const ten = String(name ?? '').trim();
  if (ten.length < 2) fail('Tên lớp phải có ít nhất 2 kí tự.');

  const maHienThi = String(code ?? '').trim() || ten;
  if (get('SELECT 1 AS ok FROM classes WHERE code = ?', maHienThi)) {
    fail(`Đã có lớp tên "${maHienThi}". Hãy đặt tên khác.`, 409);
  }

  const xin = String(joinCode ?? '').trim();
  if (xin && !/^\d{4}$/.test(xin)) fail('Mã lớp phải đúng 4 chữ số, ví dụ 1204.');
  if (xin && get('SELECT 1 AS ok FROM classes WHERE join_code = ?', xin)) {
    fail(`Mã lớp ${xin} đã có lớp khác dùng. Hãy chọn mã khác.`, 409);
  }
  const ma = xin || maLopTrong(doanMaTuTen(maHienThi));

  const id = `class-${randomUUID().slice(0, 8)}`;
  run('INSERT INTO classes (id, code, name, join_code, teacher_id) VALUES (?, ?, ?, ?, ?)',
    id, maHienThi, ten, ma, teacher.id);

  /* Nhóm 0 sinh ngay cùng lớp: lớp nào cũng phải vào được kể cả khi chưa chia nhóm */
  run(`INSERT INTO teams (id, class_id, code, group_no, name)
       VALUES (?, ?, 'N0', 0, 'Làm riêng lẻ')`, `team-${randomUUID().slice(0, 8)}`, id);

  const n = Math.min(Math.max(Number(groupCount) || 0, 0), 20);
  for (let i = 1; i <= n; i++) {
    run(`INSERT INTO teams (id, class_id, code, group_no, name) VALUES (?, ?, ?, ?, ?)`,
      `team-${randomUUID().slice(0, 8)}`, id, `N${i}`, i, `Nhóm ${i}`);
  }

  /* Giáo viên chưa có lớp nào đang mở thì lấy luôn lớp vừa tạo làm lớp hiện tại */
  if (!teacher.classId) run('UPDATE users SET class_id = ? WHERE id = ?', id, teacher.id);

  logActivity(teacher.id, 'tao_lop', `${maHienThi} · mã ${ma}`);
  return chiTietLop(id);
});

/** Kiểm tra lớp có phải của giáo viên này không, trả về lớp nếu đúng */
const lopCuaMinh = (teacher, classId) => {
  const c = get('SELECT id, teacher_id AS teacherId, code FROM classes WHERE id = ?', classId);
  if (!c) fail('Không tìm thấy lớp này.', 404);
  /* Tài khoản dev được xem mọi lớp để hỗ trợ, giáo viên thì chỉ lớp mình dạy */
  if (teacher.role !== 'dev' && c.teacherId !== teacher.id) {
    fail('Lớp này không phải lớp bạn dạy.', 403);
  }
  return c;
};

export const suaLop = (teacher, classId, { name, code }) => {
  lopCuaMinh(teacher, classId);
  const dat = [];
  const gt = [];
  if (name !== undefined) {
    const ten = String(name).trim();
    if (ten.length < 2) fail('Tên lớp phải có ít nhất 2 kí tự.');
    dat.push('name = ?'); gt.push(ten);
  }
  if (code !== undefined) {
    const c = String(code).trim();
    if (!c) fail('Tên hiển thị của lớp không được để trống.');
    const trung = get('SELECT id FROM classes WHERE code = ? AND id <> ?', c, classId);
    if (trung) fail(`Đã có lớp tên "${c}".`, 409);
    dat.push('code = ?'); gt.push(c);
  }
  if (!dat.length) return chiTietLop(classId);
  run(`UPDATE classes SET ${dat.join(', ')} WHERE id = ?`, ...gt, classId);
  return chiTietLop(classId);
};

export const xoaLop = (teacher, classId) => {
  const c = lopCuaMinh(teacher, classId);
  const siSo = get("SELECT COUNT(*) AS n FROM users WHERE class_id = ? AND role = 'hs'", classId).n;
  if (siSo > 0) {
    fail(`Lớp còn ${siSo} học sinh. Hãy chuyển các em sang lớp khác trước khi xoá.`, 409);
  }
  run('DELETE FROM classes WHERE id = ?', classId);
  logActivity(teacher.id, 'xoa_lop', c.code);
  return { ok: true, id: classId };
};

/** Đổi lớp đang mở của giáo viên, khi thầy cô dạy nhiều lớp */
export const chonLop = (teacher, classId) => {
  lopCuaMinh(teacher, classId);
  run('UPDATE users SET class_id = ? WHERE id = ?', classId, teacher.id);
  return chiTietLop(classId);
};

/* ------------------------------------------------------------------ */
/* Giáo viên: nhóm                                                     */
/* ------------------------------------------------------------------ */

export const themNhom = (teacher, classId, { groupNo, name }) => {
  lopCuaMinh(teacher, classId);

  let so = groupNo === undefined || groupNo === null || groupNo === ''
    ? null : Number(groupNo);
  if (so === null) {
    /* Không nói số thì lấy số kế tiếp, bỏ qua nhóm 0 vì đó là nhóm riêng lẻ */
    so = (get('SELECT MAX(group_no) AS m FROM teams WHERE class_id = ?', classId).m ?? 0) + 1;
    if (so < 1) so = 1;
  }
  if (!Number.isInteger(so) || so < 1 || so > 99) fail('Số nhóm phải là số nguyên từ 1 đến 99.');
  if (get('SELECT 1 AS ok FROM teams WHERE class_id = ? AND group_no = ?', classId, so)) {
    fail(`Lớp đã có nhóm ${so}.`, 409);
  }

  run('INSERT INTO teams (id, class_id, code, group_no, name) VALUES (?, ?, ?, ?, ?)',
    `team-${randomUUID().slice(0, 8)}`, classId, `N${so}`, so,
    String(name ?? '').trim() || `Nhóm ${so}`);
  logActivity(teacher.id, 'tao_nhom', `${classId} · nhóm ${so}`);
  return chiTietLop(classId);
};

export const xoaNhom = (teacher, classId, groupNo) => {
  lopCuaMinh(teacher, classId);
  const so = Number(groupNo);
  if (so === NHOM_RIENG_LE) fail('Không xoá được nhóm "làm riêng lẻ" — mọi lớp đều cần nhóm này.');

  const t = get('SELECT id FROM teams WHERE class_id = ? AND group_no = ?', classId, so);
  if (!t) fail('Lớp không có nhóm này.', 404);

  /* Học sinh trong nhóm bị xoá chuyển về nhóm riêng lẻ, không để các em rơi ra
     ngoài lớp rồi mất hết bài đã nộp. */
  const n0 = get('SELECT id FROM teams WHERE class_id = ? AND group_no = 0', classId);
  run('UPDATE users SET team_id = ? WHERE team_id = ?', n0?.id ?? null, t.id);
  run('DELETE FROM teams WHERE id = ?', t.id);

  logActivity(teacher.id, 'xoa_nhom', `${classId} · nhóm ${so}`);
  return chiTietLop(classId);
};

/** Danh sách học sinh của lớp kèm số thứ tự và nhóm, để giáo viên theo dõi */
export const hocSinhCuaLop = (teacher, classId) => {
  lopCuaMinh(teacher, classId);
  return all(`
    SELECT u.id, u.name, u.email, u.seat_no AS seatNo,
           COALESCE(t.group_no, 0) AS groupNo,
           COALESCE(t.name, 'Làm riêng lẻ') AS groupName,
           u.last_login_at AS lastLoginAt
    FROM users u
    LEFT JOIN teams t ON t.id = u.team_id
    WHERE u.class_id = ? AND u.role = 'hs'
    ORDER BY COALESCE(t.group_no, 0), COALESCE(u.seat_no, 999), u.name`, classId);
};

/* ------------------------------------------------------------------ */
/* Học sinh: vào lớp bằng mã                                           */
/* ------------------------------------------------------------------ */

/** Lớp và nhóm hiện tại của một học sinh, kèm các bạn cùng nhóm */
export const lopCuaToi = (student) => {
  if (!student.classId) return null;
  const lop = get('SELECT id, code, name FROM classes WHERE id = ?', student.classId);
  if (!lop) return null;
  const nhom = student.teamId
    ? get('SELECT group_no AS groupNo, name FROM teams WHERE id = ?', student.teamId)
    : null;
  return {
    classId: lop.id,
    classCode: lop.code,
    className: lop.name,
    groupNo: nhom?.groupNo ?? NHOM_RIENG_LE,
    groupName: nhom?.name ?? 'Làm riêng lẻ',
    seatNo: get('SELECT seat_no AS s FROM users WHERE id = ?', student.id)?.s ?? null,
    members: student.teamId
      ? all(`SELECT id, name, seat_no AS seatNo FROM users
             WHERE team_id = ? AND role = 'hs'
             ORDER BY COALESCE(seat_no, 999), name`, student.teamId)
      : [],
  };
};

/**
 * Học sinh nhập mã nhóm và số thứ tự của mình trong lớp.
 *
 * Số thứ tự phải duy nhất trong một lớp: hai em cùng mang số 7 thì giáo viên
 * không biết ai là ai khi xem sổ điểm. Vào lại lớp cũ bằng mã nhóm khác thì chỉ
 * đổi nhóm, bài đã nộp vẫn giữ nguyên.
 */
export const vaoLop = (student, { code, seatNo }) => tx(() => {
  const ma = tachMa(code);
  if (!ma) fail('Mã lớp không đúng dạng. Mã có dạng 1204N2 — bốn chữ số, chữ N, rồi số nhóm.');

  const lop = get('SELECT id, code, name, join_code AS joinCode FROM classes WHERE join_code = ?',
    ma.joinCode);
  if (!lop) fail(`Không có lớp nào mang mã ${ma.joinCode}. Hãy hỏi lại giáo viên.`, 404);

  const nhom = get('SELECT id, group_no AS groupNo, name FROM teams WHERE class_id = ? AND group_no = ?',
    lop.id, ma.groupNo);
  if (!nhom) {
    fail(`Lớp ${lop.code} không có nhóm ${ma.groupNo}. Hãy kiểm tra lại số nhóm ở cuối mã.`, 404);
  }

  const stt = seatNo === undefined || seatNo === null || seatNo === '' ? null : Number(seatNo);
  if (stt === null) fail('Hãy nhập số thứ tự của em trong lớp.');
  if (!Number.isInteger(stt) || stt < 1 || stt > 99) {
    fail('Số thứ tự phải là số nguyên từ 1 đến 99.');
  }
  const trung = get(`SELECT name FROM users
                     WHERE class_id = ? AND seat_no = ? AND id <> ? AND role = 'hs'`,
    lop.id, stt, student.id);
  if (trung) {
    fail(`Số thứ tự ${stt} đã có bạn ${trung.name} dùng. Hãy kiểm tra lại sổ điểm của lớp.`, 409);
  }

  run('UPDATE users SET class_id = ?, team_id = ?, seat_no = ? WHERE id = ?',
    lop.id, nhom.id, stt, student.id);

  logActivity(student.id, 'vao_lop', `${lop.code} · nhóm ${nhom.groupNo} · STT ${stt}`);
  /* Trả về đúng hình dạng mà /my/class trả về, không phải một hình dạng riêng.
     Hai điểm cuối cùng mô tả một thứ mà khác trường là giao diện dùng chung một
     chỗ hiển thị sẽ vỡ ở đúng cái trường bị thiếu. */
  return { ...lopCuaToi({ ...student, classId: lop.id, teamId: nhom.id }),
    joinCode: ghepMa(lop.joinCode, nhom.groupNo) };
});

/** Rời lớp: giữ nguyên bài đã làm, chỉ bỏ liên kết lớp và nhóm */
export const roiLop = (student) => {
  run('UPDATE users SET class_id = NULL, team_id = NULL, seat_no = NULL WHERE id = ?', student.id);
  logActivity(student.id, 'roi_lop', null);
  return { ok: true };
};
