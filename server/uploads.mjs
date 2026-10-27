/**
 * Nhận và phục vụ tệp giáo viên tải lên.
 *
 * CÁCH NHẬN: trình duyệt gửi thẳng nội dung tệp làm phần thân của lời gọi, còn
 * tên tệp và kiểu tệp đi kèm trong chuỗi truy vấn. Không dùng multipart —
 * multipart phải tự viết bộ tách, mà bộ tách viết sai với dữ liệu nhị phân thì
 * tệp hỏng âm thầm, rất khó phát hiện. Gửi thẳng thì không có gì để tách.
 *
 * NHỮNG CHỖ PHẢI CHẶN:
 *
 *   · Tên tệp do người dùng đặt nên có thể chứa `../` hay kí tự lạ. Tệp trên
 *     đĩa vì vậy đặt theo mã sinh ra, tên gốc chỉ lưu trong cơ sở dữ liệu để
 *     hiện lại cho đẹp.
 *
 *   · Tệp HTML hay SVG tải lên rồi phục vụ dạng nội tuyến là một đường chạy mã
 *     lạ ngay trong trang. Vì vậy chỉ ảnh, video, âm thanh và PDF mới được xem
 *     ngay; mọi thứ khác buộc phải tải về.
 *
 *   · Dung lượng phải chặn ngay trong lúc nhận, không đợi nhận xong mới xem.
 *     Đợi nhận xong thì ổ đĩa đã đầy rồi.
 */
import { randomUUID } from 'node:crypto';
import { createWriteStream, createReadStream, existsSync, mkdirSync, unlinkSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { all, get, run, logActivity, DB_PATH } from './db.mjs';

const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

/** Thư mục chứa tệp. Mặc định nằm cạnh tệp cơ sở dữ liệu để cùng một ổ đĩa bền. */
export const UPLOAD_DIR = process.env.MODULAB_UPLOADS || join(dirname(DB_PATH), 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

/** Giới hạn mỗi tệp. Video dài nên dùng liên kết YouTube thay vì tải lên. */
export const MAX_BYTES = Number(process.env.MODULAB_MAX_UPLOAD || 25 * 1024 * 1024);

/* Kiểu tệp nhận vào. Danh sách cho phép chứ không phải danh sách cấm: cấm thì
   luôn sót, còn cho phép thì thứ lạ tự rơi ra ngoài. */
const KIEU_CHO_PHEP = new Map([
  ['image/png', 'png'], ['image/jpeg', 'jpg'], ['image/gif', 'gif'],
  ['image/webp', 'webp'], ['image/avif', 'avif'],
  ['video/mp4', 'mp4'], ['video/webm', 'webm'], ['video/quicktime', 'mov'],
  ['audio/mpeg', 'mp3'], ['audio/ogg', 'ogg'], ['audio/wav', 'wav'],
  ['application/pdf', 'pdf'],
  ['text/plain', 'txt'], ['text/csv', 'csv'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'pptx'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
  ['application/zip', 'zip'],
]);

/**
 * Kiểu tệp được phép mở ngay trong trang.
 *
 * KHÔNG có image/svg+xml trong danh sách này, dù SVG là ảnh: tệp SVG chứa được
 * mã kịch bản, mở nội tuyến là chạy mã đó dưới tên miền của mình.
 */
const XEM_NGAY = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/ogg', 'audio/wav',
  'application/pdf',
]);

const duongDan = (id) => join(UPLOAD_DIR, id);

/** Bỏ đường dẫn và kí tự lạ khỏi tên tệp, chỉ giữ lại phần tên để hiện cho đẹp */
const donTen = (ten) => String(ten ?? 'tep')
  .replace(/[\\/]/g, ' ')
  .replace(/[\u0000-\u001f\u007f]/g, '')
  .trim()
  .slice(0, 120) || 'tep';

/* ------------------------------------------------------------------ */
/* Nhận tệp                                                            */
/* ------------------------------------------------------------------ */

/**
 * Đọc phần thân lời gọi vào một tệp trên đĩa, dừng ngay khi vượt giới hạn.
 *
 * Ghi thẳng xuống đĩa theo dòng chứ không gom hết vào bộ nhớ: một tệp 25MB gom
 * vào bộ nhớ thì vài người tải cùng lúc là máy chủ hết bộ nhớ.
 */
const nhanVaoDia = (req, dich) => new Promise((resolve, reject) => {
  let daNhan = 0;
  let hong = false;
  const out = createWriteStream(dich);

  const bo = (err) => {
    if (hong) return;
    hong = true;
    req.unpipe?.(out);
    out.destroy();
    try { unlinkSync(dich); } catch { /* chưa kịp tạo tệp thì thôi */ }
    reject(err);
  };

  req.on('data', (c) => {
    daNhan += c.length;
    if (daNhan > MAX_BYTES) {
      bo(Object.assign(
        new Error(`Tệp quá lớn. Mỗi tệp tối đa ${Math.round(MAX_BYTES / 1048576)} MB. `
          + 'Video dài thì nên dán liên kết YouTube thay vì tải lên.'),
        { status: 413 }));
    }
  });
  req.on('error', bo);
  out.on('error', bo);
  out.on('finish', () => { if (!hong) resolve(daNhan); });
  req.pipe(out);
});

export const nhanTep = async (user, url, req) => {
  const mime = String(url.searchParams.get('type') ?? '').toLowerCase().split(';')[0].trim();
  if (!KIEU_CHO_PHEP.has(mime)) {
    fail(`Không nhận kiểu tệp "${mime || 'không rõ'}". `
      + 'Nhận ảnh, video, âm thanh, PDF, Word, PowerPoint, Excel, zip và tệp văn bản.', 415);
  }

  /* Xem trước Content-Length để từ chối sớm, khỏi nhận hết rồi mới báo lỗi */
  const bao = Number(req.headers['content-length'] ?? 0);
  if (bao > MAX_BYTES) {
    fail(`Tệp quá lớn (${(bao / 1048576).toFixed(1)} MB). `
      + `Mỗi tệp tối đa ${Math.round(MAX_BYTES / 1048576)} MB.`, 413);
  }

  const classId = url.searchParams.get('classId') || null;
  if (classId) {
    const c = get('SELECT teacher_id AS t FROM classes WHERE id = ?', classId);
    if (!c) fail('Không tìm thấy lớp này.', 404);
    if (user.role !== 'dev' && c.t !== user.id) fail('Lớp này không phải lớp bạn dạy.', 403);
  }

  const id = `up-${randomUUID().replace(/-/g, '')}`;
  const size = await nhanVaoDia(req, duongDan(id));
  if (size === 0) {
    try { unlinkSync(duongDan(id)); } catch { /* không sao */ }
    fail('Tệp rỗng.');
  }

  const ten = donTen(url.searchParams.get('name'));
  run(`INSERT INTO uploads (id, owner_id, class_id, filename, mime, size)
       VALUES (?, ?, ?, ?, ?, ?)`, id, user.id, classId, ten, mime, size);
  logActivity(user.id, 'tai_tep_len', `${ten} · ${(size / 1024).toFixed(0)} KB`);

  return { id, filename: ten, mime, size, url: `/api/uploads/${id}` };
};

/* ------------------------------------------------------------------ */
/* Phục vụ tệp                                                         */
/* ------------------------------------------------------------------ */

export const thongTinTep = (id) => get(
  `SELECT id, owner_id AS ownerId, class_id AS classId, filename, mime, size,
          created_at AS createdAt
   FROM uploads WHERE id = ?`, id);

/**
 * Ai được xem tệp này.
 *
 * Tệp bài giảng không công khai: lớp nào thì chỉ người của lớp ấy xem được.
 * Thiếu chốt này thì ai đoán được mã tệp là tải về được bài kiểm tra của lớp khác.
 */
export const duocXemTep = (user, tep) => {
  if (!tep) return false;
  if (!user) return false;
  if (user.role === 'dev') return true;
  if (tep.ownerId === user.id) return true;
  if (tep.classId && user.classId === tep.classId) return true;
  return false;
};

/** Trả về những gì cần để gửi tệp đi: đường dẫn, kiểu, và có cho xem ngay không */
export const moTep = (id) => {
  const tep = thongTinTep(id);
  if (!tep) return null;
  const p = duongDan(id);
  if (!existsSync(p)) return null;
  return {
    ...tep,
    path: p,
    size: statSync(p).size,
    inline: XEM_NGAY.has(tep.mime),
    stream: (opts) => createReadStream(p, opts),
  };
};

/** Danh sách tệp của một lớp, để giáo viên chọn lại tệp đã tải lên trước đó */
export const tepCuaLop = (classId) => all(
  `SELECT id, filename, mime, size, created_at AS createdAt
   FROM uploads WHERE class_id = ? ORDER BY created_at DESC LIMIT 200`, classId);

export const xoaTep = (user, id) => {
  const tep = thongTinTep(id);
  if (!tep) fail('Không tìm thấy tệp.', 404);
  if (user.role !== 'dev' && tep.ownerId !== user.id) fail('Tệp này không phải của bạn.', 403);
  try { unlinkSync(duongDan(id)); } catch { /* tệp đã mất thì vẫn xoá bản ghi */ }
  run('DELETE FROM uploads WHERE id = ?', id);
  return { ok: true, id };
};
