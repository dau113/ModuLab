/**
 * Máy chủ API của ModuLab — dùng http và sqlite có sẵn trong Node, không cần gói ngoài.
 *
 *   npm run server        (node --experimental-sqlite server/index.mjs)
 *   Mặc định nghe ở cổng 8787, đổi bằng biến môi trường PORT.
 */
import { createServer } from 'node:http';
import {
  listUsers, listModules, listTools, listQuestions, createQuestion, saveAttempt,
  getReport, saveReportRows, submitReport, saveCircuit, listCircuits, getCircuit,
  teacherStats, isEmpty, get, logActivity,
} from './db.mjs';

const PORT = Number(process.env.PORT || 8787);

const json = (res, status, body) => {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(data);
};

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

const routes = [
  ['GET', /^\/api\/health$/, () => ({
    ok: true,
    seeded: !isEmpty(),
    time: new Date().toISOString(),
  })],

  /* Nạp một lượt toàn bộ dữ liệu tĩnh cho lần mở ứng dụng */
  ['GET', /^\/api\/bootstrap$/, () => ({
    users: listUsers(),
    modules: listModules(),
    tools: listTools(),
    questions: listQuestions(),
  })],

  ['GET', /^\/api\/users$/, () => listUsers()],

  ['POST', /^\/api\/auth\/login$/, (_m, body) => {
    const user = get('SELECT id FROM users WHERE email = ? OR id = ?', body.email ?? '', body.userId ?? '');
    if (!user) throw Object.assign(new Error('Không tìm thấy tài khoản'), { status: 404 });
    logActivity(user.id, 'dang_nhap', null);
    return listUsers().find((u) => u.id === user.id);
  }],

  ['GET', /^\/api\/modules$/, () => listModules()],
  ['GET', /^\/api\/tools$/, () => listTools()],

  ['GET', /^\/api\/questions$/, (_m, _b, url) => listQuestions(url.searchParams.get('moduleId') ?? undefined)],
  ['POST', /^\/api\/questions$/, (_m, body) => createQuestion(body, body.createdBy)],

  ['POST', /^\/api\/attempts$/, (_m, body) => saveAttempt(body)],

  ['GET', /^\/api\/reports\/([^/]+)\/([^/]+)$/, (m) => getReport(decodeURIComponent(m[1]), decodeURIComponent(m[2]))],
  ['PUT', /^\/api\/reports\/([^/]+)\/([^/]+)$/, (m, body) =>
    saveReportRows(decodeURIComponent(m[1]), decodeURIComponent(m[2]), body.rows ?? [])],
  ['POST', /^\/api\/reports\/([^/]+)\/([^/]+)\/submit$/, (m, body) =>
    submitReport(decodeURIComponent(m[1]), decodeURIComponent(m[2]), body)],

  ['GET', /^\/api\/circuits\/([^/]+)$/, (m) => listCircuits(decodeURIComponent(m[1]))],
  ['GET', /^\/api\/circuit\/(\d+)$/, (m) => getCircuit(Number(m[1]))],
  ['POST', /^\/api\/circuits$/, (_m, body) => saveCircuit(body)],

  ['GET', /^\/api\/teacher\/stats$/, (_m, _b, url) => teacherStats(url.searchParams.get('classCode') ?? undefined)],
];

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const route = routes.find(([method, pattern]) => method === req.method && pattern.test(url.pathname));

  if (!route) return json(res, 404, { error: 'Không có điểm cuối này', path: url.pathname });

  try {
    const body = ['POST', 'PUT'].includes(req.method) ? await readBody(req) : {};
    const result = route[2](url.pathname.match(route[1]), body, url);
    return json(res, 200, result ?? null);
  } catch (err) {
    const status = err.status ?? 400;
    console.error(`✗ ${req.method} ${url.pathname}:`, err.message);
    return json(res, status, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`ModuLab API đang chạy tại http://localhost:${PORT}`);
  if (isEmpty()) console.log('⚠ Cơ sở dữ liệu còn trống — chạy "npm run db:seed" để nạp dữ liệu.');
});
