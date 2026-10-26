/**
 * Máy chủ API của ModuLab — dùng http và sqlite có sẵn trong Node, không cần gói ngoài.
 *
 *   npm run server        (node --experimental-sqlite server/index.mjs)
 *   Mặc định nghe ở cổng 8787, đổi bằng biến môi trường PORT.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listUsers, listModules, listTools, listQuestions, createQuestion, saveAttempt,
  getReport, saveReportRows, submitReport, reopenReport, saveCircuit, listCircuits, getCircuit,
  teacherStats, isEmpty,
} from './db.mjs';
import {
  register, login, destroySession, userFromToken, changePassword, updateProfile, listSessions,
  bootstrapDeveloper,
} from './auth.mjs';
import {
  listAssignments, getAssignment, assignmentBoard, myAssignments,
  createAssignment, updateAssignment, deleteAssignment,
  startAssignment, submitAssignment, gradeSubmission, reopenSubmission,
} from './assignments.mjs';
import {
  listTables, readTable, runQuery, listAccounts, setAccountStatus, recentLogs, overview,
  resetAccountPassword,
} from './devtools.mjs';
import {
  lopCuaGiaoVien, chiTietLop, taoLop, suaLop, xoaLop, chonLop,
  themNhom, xoaNhom, hocSinhCuaLop, vaoLop, lopCuaToi, roiLop,
} from './classes.mjs';

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';

/* Thư mục giao diện đã dựng — có thì phục vụ luôn, không có thì chỉ chạy API */
const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = process.env.MODULAB_DIST || join(HERE, '..', 'dist');
const HAS_UI = existsSync(join(DIST, 'index.html'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

/** Gửi một tệp tĩnh; trả về false nếu không có tệp đó */
const sendFile = (res, filePath, { immutable = false } = {}) => {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return false;
  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Content-Length': statSync(filePath).size,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(filePath).pipe(res);
  return true;
};

/** Phục vụ giao diện: tệp tĩnh trước, không khớp thì trả index.html cho ứng dụng một trang */
const serveUi = (res, pathname) => {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const target = join(DIST, clean);
  if (target.startsWith(DIST) && sendFile(res, target, { immutable: clean.startsWith('/assets/') })) return true;
  return sendFile(res, join(DIST, 'index.html'));
};

/* Trình duyệt gửi mã phiên trong tiêu đề Authorization nên phải cho phép tiêu
   đề đó đi qua kiểm tra nguồn chéo, nếu không trình duyệt chặn ngay từ đầu. */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const json = (res, status, body) => {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    ...CORS,
    'Cache-Control': 'no-store',
  });
  res.end(data);
};

/** Mã phiên nằm ở "Authorization: Bearer <mã>" */
const tokenOf = (req) => {
  const h = req.headers.authorization ?? '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
};

const deny = (message, status) => { throw Object.assign(new Error(message), { status }); };

const readBody = (req) => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', (c) => {
    raw += c;
    if (raw.length > 2e6) reject(new Error('Nội dung gửi lên quá lớn'));
  });
  req.on('end', () => {
    if (!raw) return resolve({});
    try { resolve(JSON.parse(raw)); } catch { reject(new Error('Dữ liệu gửi lên không phải JSON hợp lệ')); }
  });
  req.on('error', reject);
});

/* ------------------------------------------------------------------ */
/* Bảng định tuyến                                                     */
/* ------------------------------------------------------------------ */

/*
 * Mỗi dòng: [phương thức, mẫu đường dẫn, hàm xử lý, vai trò được phép].
 *
 * Cột vai trò là chỗ quyết định ai gọi được điểm cuối nào. Bỏ trống nghĩa là
 * không cần đăng nhập. Để quyền nằm ngay cạnh đường dẫn như thế này thì đọc cả
 * bảng là thấy ngay ai vào được đâu, thay vì phải lần trong từng hàm xử lý.
 *
 * Hàm xử lý nhận một đối tượng gồm: m (các nhóm bắt được của mẫu), body, url,
 * user (người đang đăng nhập, null nếu không) và req.
 */
const routes = [
  ['GET', /^\/api\/health$/, () => ({
    ok: true, seeded: !isEmpty(), time: new Date().toISOString(),
  })],

  /* ---------------- Tài khoản ---------------- */

  ['POST', /^\/api\/auth\/register$/, ({ body, req }) => register(body, req.headers['user-agent'])],
  ['POST', /^\/api\/auth\/login$/, ({ body, req }) => login(body, req.headers['user-agent'])],
  ['POST', /^\/api\/auth\/logout$/, ({ req }) => destroySession(tokenOf(req)), ['hs', 'gv', 'dev']],
  ['GET', /^\/api\/auth\/me$/, ({ user }) => user, ['hs', 'gv', 'dev']],
  ['POST', /^\/api\/auth\/password$/, ({ user, body }) => changePassword(user.id, body), ['hs', 'gv', 'dev']],
  ['PATCH', /^\/api\/auth\/profile$/, ({ user, body }) => updateProfile(user.id, body), ['hs', 'gv', 'dev']],
  ['GET', /^\/api\/auth\/sessions$/, ({ user }) => listSessions(user.id), ['hs', 'gv', 'dev']],

  /* ---------------- Dữ liệu dùng chung ---------------- */

  /* Nạp một lượt toàn bộ dữ liệu tĩnh cho lần mở ứng dụng. Không kèm danh sách
     tài khoản nữa: trước đây ai mở trang cũng tải được email của cả lớp. */
  ['GET', /^\/api\/bootstrap$/, () => ({
    modules: listModules(), tools: listTools(), questions: listQuestions(),
  })],

  ['GET', /^\/api\/modules$/, () => listModules()],
  ['GET', /^\/api\/tools$/, () => listTools()],
  ['GET', /^\/api\/questions$/, ({ url }) => listQuestions(url.searchParams.get('moduleId') ?? undefined)],
  ['POST', /^\/api\/questions$/, ({ user, body }) => createQuestion(body, user.id), ['gv', 'dev']],

  /* ---------------- Bài làm của chính mình ---------------- */

  ['POST', /^\/api\/attempts$/, ({ user, body }) =>
    saveAttempt({ ...body, userId: user.id }), ['hs', 'gv', 'dev']],

  ['GET', /^\/api\/reports\/([^/]+)$/, ({ user, m }) =>
    getReport(user.id, decodeURIComponent(m[1])), ['hs', 'gv', 'dev']],
  ['PUT', /^\/api\/reports\/([^/]+)$/, ({ user, m, body }) =>
    saveReportRows(user.id, decodeURIComponent(m[1]), body.rows ?? []), ['hs', 'gv', 'dev']],
  ['POST', /^\/api\/reports\/([^/]+)\/submit$/, ({ user, m, body }) =>
    submitReport(user.id, decodeURIComponent(m[1]), body), ['hs', 'gv', 'dev']],
  ['POST', /^\/api\/reports\/([^/]+)\/reopen$/, ({ user, m }) =>
    reopenReport(user.id, decodeURIComponent(m[1])), ['hs', 'gv', 'dev']],

  ['GET', /^\/api\/circuits$/, ({ user }) => listCircuits(user.id), ['hs', 'gv', 'dev']],
  ['GET', /^\/api\/circuit\/(\d+)$/, ({ m }) => getCircuit(Number(m[1])), ['hs', 'gv', 'dev']],
  ['POST', /^\/api\/circuits$/, ({ user, body }) =>
    saveCircuit({ ...body, userId: user.id }), ['hs', 'gv', 'dev']],

  /* ---------------- Lớp học và nhóm ---------------- */

  /* Học sinh */
  ['GET', /^\/api\/my\/class$/, ({ user }) => lopCuaToi(user), ['hs', 'gv', 'dev']],
  ['POST', /^\/api\/my\/class\/join$/, ({ user, body }) => vaoLop(user, body), ['hs']],
  ['POST', /^\/api\/my\/class\/leave$/, ({ user }) => roiLop(user), ['hs']],

  /* Giáo viên */
  ['GET', /^\/api\/classes$/, ({ user }) => lopCuaGiaoVien(user.id), ['gv', 'dev']],
  ['POST', /^\/api\/classes$/, ({ user, body }) => taoLop(user, body), ['gv', 'dev']],
  ['GET', /^\/api\/classes\/([^/]+)$/, ({ m }) => chiTietLop(decodeURIComponent(m[1])), ['gv', 'dev']],
  ['PATCH', /^\/api\/classes\/([^/]+)$/, ({ user, m, body }) =>
    suaLop(user, decodeURIComponent(m[1]), body), ['gv', 'dev']],
  ['DELETE', /^\/api\/classes\/([^/]+)$/, ({ user, m }) =>
    xoaLop(user, decodeURIComponent(m[1])), ['gv', 'dev']],
  ['POST', /^\/api\/classes\/([^/]+)\/select$/, ({ user, m }) =>
    chonLop(user, decodeURIComponent(m[1])), ['gv', 'dev']],
  ['GET', /^\/api\/classes\/([^/]+)\/students$/, ({ user, m }) =>
    hocSinhCuaLop(user, decodeURIComponent(m[1])), ['gv', 'dev']],
  ['POST', /^\/api\/classes\/([^/]+)\/groups$/, ({ user, m, body }) =>
    themNhom(user, decodeURIComponent(m[1]), body), ['gv', 'dev']],
  ['DELETE', /^\/api\/classes\/([^/]+)\/groups\/(\d+)$/, ({ user, m }) =>
    xoaNhom(user, decodeURIComponent(m[1]), Number(m[2])), ['gv', 'dev']],

  /* ---------------- Bài tập: phía học sinh ---------------- */

  ['GET', /^\/api\/my\/assignments$/, ({ user }) =>
    myAssignments(user.id, user.classId), ['hs', 'gv', 'dev']],
  ['POST', /^\/api\/assignments\/([^/]+)\/start$/, ({ user, m }) =>
    startAssignment(user, decodeURIComponent(m[1])), ['hs']],
  ['POST', /^\/api\/assignments\/([^/]+)\/submit$/, ({ user, m, body }) =>
    submitAssignment(user, decodeURIComponent(m[1]), body), ['hs']],

  /* ---------------- Bài tập: phía giáo viên ---------------- */

  ['GET', /^\/api\/assignments$/, ({ user }) => listAssignments(user.classId), ['gv', 'dev']],
  ['POST', /^\/api\/assignments$/, ({ user, body }) => createAssignment(user, body), ['gv', 'dev']],
  ['GET', /^\/api\/assignments\/([^/]+)$/, ({ m }) =>
    getAssignment(decodeURIComponent(m[1])), ['gv', 'dev']],
  ['PATCH', /^\/api\/assignments\/([^/]+)$/, ({ user, m, body }) =>
    updateAssignment(user, decodeURIComponent(m[1]), body), ['gv', 'dev']],
  ['DELETE', /^\/api\/assignments\/([^/]+)$/, ({ user, m }) =>
    deleteAssignment(user, decodeURIComponent(m[1])), ['gv', 'dev']],
  ['GET', /^\/api\/assignments\/([^/]+)\/board$/, ({ m }) =>
    assignmentBoard(decodeURIComponent(m[1])), ['gv', 'dev']],
  ['POST', /^\/api\/assignments\/([^/]+)\/grade\/([^/]+)$/, ({ user, m, body }) =>
    gradeSubmission(user, decodeURIComponent(m[1]), decodeURIComponent(m[2]), body), ['gv', 'dev']],
  ['POST', /^\/api\/assignments\/([^/]+)\/reopen\/([^/]+)$/, ({ user, m }) =>
    reopenSubmission(user, decodeURIComponent(m[1]), decodeURIComponent(m[2])), ['gv', 'dev']],

  ['GET', /^\/api\/teacher\/stats$/, ({ user, url }) =>
    teacherStats(url.searchParams.get('classCode') ?? user.classCode), ['gv', 'dev']],
  ['GET', /^\/api\/teacher\/students$/, ({ user }) =>
    listUsers(user.classId), ['gv', 'dev']],

  /* ---------------- Dành riêng cho tài khoản developer ---------------- */

  ['GET', /^\/api\/dev\/overview$/, () => overview(), ['dev']],
  ['GET', /^\/api\/dev\/tables$/, () => listTables(), ['dev']],
  ['GET', /^\/api\/dev\/table\/([A-Za-z0-9_]+)$/, ({ m, url }) => readTable(m[1], {
    limit: url.searchParams.get('limit'), offset: url.searchParams.get('offset'),
  }), ['dev']],
  ['POST', /^\/api\/dev\/query$/, ({ user, body }) => runQuery(user, body.sql), ['dev']],
  ['GET', /^\/api\/dev\/accounts$/, () => listAccounts(), ['dev']],
  ['POST', /^\/api\/dev\/accounts\/([^/]+)\/status$/, ({ user, m, body }) =>
    setAccountStatus(user, decodeURIComponent(m[1]), body.status), ['dev']],
  ['POST', /^\/api\/dev\/accounts\/([^/]+)\/password$/, ({ user, m, body }) =>
    resetAccountPassword(user, decodeURIComponent(m[1]), body.password), ['dev']],
  ['GET', /^\/api\/dev\/logs$/, ({ url }) => recentLogs(url.searchParams.get('limit')), ['dev']],
];

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const route = routes.find(([method, pattern]) => method === req.method && pattern.test(url.pathname));

  if (!route) {
    if (!url.pathname.startsWith('/api/') && HAS_UI && req.method === 'GET' && serveUi(res, url.pathname)) return;
    return json(res, 404, { error: 'Không có điểm cuối này', path: url.pathname });
  }

  try {
    const [, pattern, handler, roles] = route;

    /*
     * Chốt kiểm quyền duy nhất của máy chủ. Mọi điểm cuối có khai báo vai trò
     * đều đi qua đây, nên không có đường nào lọt được vì người viết hàm xử lý
     * quên kiểm tra.
     */
    const user = userFromToken(tokenOf(req));
    if (roles) {
      if (!user) deny('Bạn cần đăng nhập để dùng chức năng này.', 401);
      if (!roles.includes(user.role)) deny('Tài khoản của bạn không có quyền này.', 403);
    }

    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await readBody(req) : {};
    const result = handler({ m: url.pathname.match(pattern), body, url, user, req });
    return json(res, 200, result ?? null);
  } catch (err) {
    const status = err.status ?? 400;
    console.error(`✗ ${req.method} ${url.pathname}:`, err.message);
    return json(res, status, { error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`ModuLab đang chạy tại http://localhost:${PORT}`);
  console.log(HAS_UI
    ? `  giao diện: phục vụ từ ${DIST}`
    : '  giao diện: chưa dựng (chạy "npm run build") — hiện chỉ có API');
  if (isEmpty()) console.log('⚠ Cơ sở dữ liệu còn trống — chạy "npm run db:seed" để nạp dữ liệu.');

  /* Có đủ hai biến MODULAB_DEV_EMAIL và MODULAB_DEV_PASSWORD thì tạo sẵn tài
     khoản developer, để triển khai trên máy chủ không có dòng lệnh vẫn có. */
  const dev = bootstrapDeveloper();
  if (dev) {
    console.log(dev.created
      ? `✓ Đã tạo tài khoản developer: ${dev.email}`
      : dev.changed
        ? `✓ Đã đặt lại mật khẩu tài khoản developer: ${dev.email}`
        : `  tài khoản developer: ${dev.email} (không đổi)`);
  }
});
