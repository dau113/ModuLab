/**
 * Lớp truy cập dữ liệu phía trình duyệt.
 * Mọi màn hình đều lấy dữ liệu qua đây thay vì đọc tệp dữ liệu mẫu.
 */
import type { LabModule, ToolItem, QuizQuestion, TeacherClassStats, LabReportRow } from '../types';
import { offline } from './offline';

/**
 * Địa chỉ máy chủ dữ liệu.
 *
 * Ứng dụng chạy ở ba nơi khác nhau nên không có một địa chỉ nào đúng cho cả ba:
 *   · máy của người phát triển — máy chủ Node phục vụ luôn giao diện, API nằm
 *     cùng nguồn ở /api;
 *   · Render — cũng một máy chủ phục vụ cả hai, lại là cùng nguồn;
 *   · Vercel — chỉ có tệp tĩnh, không có API, phải gọi sang Render.
 *
 * Vì vậy thử cùng nguồn trước, không có mới quay sang địa chỉ dự phòng. Trước
 * đây mã nguồn ghi cứng địa chỉ Render nên chạy máy chủ ở máy mình thì trình
 * duyệt vẫn gọi sang Render, đăng nhập ở đây mà dữ liệu lại nằm ở nơi khác.
 */
const ENV_BASE = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL;
const FALLBACK_BASE = 'https://modulab-q2by.onrender.com/api';

let basePromise: Promise<string> | null = null;

const resolveBase = (): Promise<string> => {
  if (ENV_BASE) return Promise.resolve(ENV_BASE);
  if (basePromise) return basePromise;

  basePromise = (async () => {
    if (typeof location === 'undefined') return FALLBACK_BASE;
    const same = `${location.origin}/api`;
    try {
      const res = await fetch(`${same}/health`, { method: 'GET' });
      /* Web tĩnh trả index.html cho mọi đường dẫn, nên phải xem nội dung chứ
         không chỉ xem mã trạng thái 200. */
      if (res.ok && (res.headers.get('content-type') ?? '').includes('json')) return same;
    } catch { /* không có API cùng nguồn */ }
    return FALLBACK_BASE;
  })();
  return basePromise;
};

export type Role = 'hs' | 'gv' | 'dev';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status?: 'hoat_dong' | 'khoa';
  classCode: string;
  teamCode: string;
  classId?: string | null;
  teamId?: string | null;
  /** Số thứ tự của học sinh trong lớp; null khi em chưa vào lớp nào */
  seatNo?: number | null;
  /** Số nhóm thực hành; 0 nghĩa là làm riêng lẻ */
  groupNo?: number | null;
}

export interface ClassGroup {
  id: string;
  groupNo: number;
  name: string;
  memberCount: number;
  /** Mã học sinh gõ để vào nhóm này, ví dụ 1204N2 */
  joinCode: string;
}

export interface ClassInfo {
  id: string;
  code: string;
  name: string;
  joinCode: string;
  teacherId: string | null;
  createdAt: string;
  studentCount: number;
  groups: ClassGroup[];
}

export interface MyClass {
  classId: string;
  classCode: string;
  className: string;
  groupNo: number;
  groupName: string;
  seatNo: number | null;
  members: { id: string; name: string; seatNo: number | null }[];
}

export interface ClassStudent {
  id: string;
  name: string;
  email: string;
  seatNo: number | null;
  groupNo: number;
  groupName: string;
  lastLoginAt: string | null;
}

export interface Bootstrap {
  modules: LabModule[];
  tools: ToolItem[];
  questions: QuizQuestion[];
}

/* ------------------------------------------------------------------ */
/* Phiên đăng nhập                                                     */
/* ------------------------------------------------------------------ */

const TOKEN_KEY = 'modulab.token';

/**
 * Mã phiên giữ trong localStorage để mở lại trang là vẫn còn đăng nhập.
 *
 * Đọc và ghi đều bọc try/catch: ở cửa sổ ẩn danh hoặc khi người dùng chặn lưu
 * trữ của trang thì chính việc chạm vào localStorage đã ném lỗi, không bọc là
 * cả ứng dụng trắng màn hình.
 */
let token: string | null = (() => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
})();

export const getToken = () => token;
export const setToken = (value: string | null) => {
  token = value;
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* không lưu được thì vẫn chạy tiếp trong phiên này */ }
};

/** Gọi khi máy chủ báo mã phiên không còn hiệu lực, để giao diện quay về màn đăng nhập */
let onSignedOut: (() => void) | null = null;
export const setSignedOutHandler = (fn: (() => void) | null) => { onSignedOut = fn; };

export interface LabReport {
  id: number;
  userId: string;
  moduleId: string;
  status: 'dang_lam' | 'da_nop' | 'da_cham';
  rAvg: number | null;
  deltaR: number | null;
  relErr: number | null;
  grade: number | null;
  teacherComment: string | null;
  submittedAt: string | null;
  rows: LabReportRow[];
}

export interface SavedCircuit {
  id: number;
  name: string;
  isValid: number;
  updatedAt: string;
}

/**
 * Khi không có máy chủ (triển khai web tĩnh), ứng dụng tự chuyển sang dữ liệu
 * đóng gói sẵn thay vì hỏng. Cờ này cho giao diện biết để hiện nhãn báo.
 */
let offlineMode = false;
export const isOffline = () => offlineMode;
const goOffline = (reason: string) => {
  if (!offlineMode) {
    offlineMode = true;
    console.warn('[ModuLab] Không kết nối được máy chủ dữ liệu, chuyển sang chế độ ngoại tuyến:', reason);
  }
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> ?? {}) };
  if (init?.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${await resolveBase()}${path}`, { ...init, headers });
  const text = await res.text();

  /* Mã phiên hết hạn hoặc bị thu hồi: bỏ mã đang giữ và báo cho giao diện biết
     để đưa người dùng về màn đăng nhập, thay vì để họ bấm mãi không ra gì. */
  if (res.status === 401 && token) {
    setToken(null);
    onSignedOut?.();
  }

  // Web tĩnh trả về trang HTML cho mọi đường dẫn — coi như không có máy chủ
  const looksLikeHtml = /^\s*<(!doctype|html)/i.test(text);
  if (looksLikeHtml) throw new Error('Máy chủ dữ liệu không phản hồi bằng JSON');

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Máy chủ dữ liệu trả về nội dung không hợp lệ');
    }
  }
  if (!res.ok) {
    throw new Error((data as { error?: string } | null)?.error || `Máy chủ trả về lỗi ${res.status}`);
  }
  return data as T;
}

/** Gọi máy chủ; nếu hỏng thì dùng bản dự phòng chạy ngay trong trình duyệt */
async function callOr<T>(fallback: () => T, path: string, init?: RequestInit): Promise<T> {
  if (offlineMode) return fallback();
  try {
    return await call<T>(path, init);
  } catch (err) {
    goOffline(err instanceof Error ? err.message : String(err));
    return fallback();
  }
}

const body = (payload: unknown) => JSON.stringify(payload);

/* ------------------------------------------------------------------ */
/* Bài tập                                                             */
/* ------------------------------------------------------------------ */

export type AssignmentKind = 'khoi_dong' | 'thuc_hanh';
export type AssignmentState = 'nhap' | 'mo' | 'dong';
export type SubmissionStatus = 'chua_lam' | 'dang_lam' | 'da_nop' | 'da_cham';

export interface Assignment {
  id: string;
  classId: string;
  classCode: string;
  kind: AssignmentKind;
  moduleId: string | null;
  moduleTitle: string;
  title: string;
  instructions: string;
  dueAt: string | null;
  passScore: number;
  state: AssignmentState;
  createdAt: string;
  classSize: number;
  submittedCount: number;
  gradedCount: number;
}

/** Một bài tập nhìn từ phía học sinh, kèm trạng thái làm bài của chính em đó */
export interface MyAssignment {
  id: string;
  kind: AssignmentKind;
  moduleId: string | null;
  moduleTitle: string;
  title: string;
  instructions: string;
  dueAt: string | null;
  passScore: number;
  state: AssignmentState;
  status: Exclude<SubmissionStatus, 'chua_lam'> | null;
  score: number | null;
  late: number | null;
  teacherComment: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
}

export interface BoardGroup {
  groupNo: number;
  name: string;
  members: BoardRow[];
  submitted: number;
  graded: number;
}

export interface BoardRow {
  userId: string;
  name: string;
  seatNo: number | null;
  groupNo: number;
  team: string;
  status: SubmissionStatus;
  score: number | null;
  late: number | null;
  teacherComment: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
}

export interface DevTable {
  name: string;
  rowCount: number;
  columns: { name: string; type: string; notNull: boolean; pk: boolean }[];
}

export interface DevQueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
  ms: number;
}

export interface DevAccount {
  id: string; name: string; email: string; role: Role;
  status: 'hoat_dong' | 'khoa';
  classCode: string; teamCode: string;
  lastLoginAt: string | null; createdAt: string;
  hasPassword: number; activeSessions: number;
}

const post = (payload?: unknown): RequestInit => ({ method: 'POST', body: body(payload ?? {}) });

export const api = {
  health: () => call<{ ok: boolean; seeded: boolean }>('/health'),

  /* ---------------- Tài khoản ---------------- */

  register: async (payload: {
    name: string; email: string; password: string; role: 'hs' | 'gv';
  }) => {
    const r = await call<{ token: string; user: ApiUser }>('/auth/register', post(payload));
    setToken(r.token);
    return r.user;
  },

  login: async (email: string, password: string) => {
    const r = await call<{ token: string; user: ApiUser }>('/auth/login', post({ email, password }));
    setToken(r.token);
    return r.user;
  },

  logout: async () => {
    try { await call('/auth/logout', post()); } finally { setToken(null); }
  },

  /** Lấy lại người dùng từ mã phiên đang giữ; null nghĩa là phải đăng nhập lại */
  me: async (): Promise<ApiUser | null> => {
    if (!token) return null;
    try { return await call<ApiUser>('/auth/me'); } catch { return null; }
  },

  changePassword: (oldPassword: string, newPassword: string) =>
    call<{ ok: boolean }>('/auth/password', post({ oldPassword, newPassword })),

  updateProfile: (payload: { name?: string }) =>
    call<ApiUser>('/auth/profile', { method: 'PATCH', body: body(payload) }),

  /* ---------------- Lớp học và nhóm ---------------- */

  myClass: () => call<MyClass | null>('/my/class'),
  joinClass: (code: string, seatNo: number) =>
    call<MyClass & { joinCode: string }>('/my/class/join', post({ code, seatNo })),
  leaveClass: () => call<{ ok: boolean }>('/my/class/leave', post()),

  classes: () => call<ClassInfo[]>('/classes'),
  createClass: (payload: { name: string; code?: string; joinCode?: string; groupCount?: number }) =>
    call<ClassInfo>('/classes', post(payload)),
  updateClass: (id: string, payload: { name?: string; code?: string }) =>
    call<ClassInfo>(`/classes/${encodeURIComponent(id)}`, { method: 'PATCH', body: body(payload) }),
  deleteClass: (id: string) =>
    call<{ ok: boolean }>(`/classes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  selectClass: (id: string) =>
    call<ClassInfo>(`/classes/${encodeURIComponent(id)}/select`, post()),
  classStudents: (id: string) =>
    call<ClassStudent[]>(`/classes/${encodeURIComponent(id)}/students`),
  addGroup: (id: string, payload: { groupNo?: number; name?: string }) =>
    call<ClassInfo>(`/classes/${encodeURIComponent(id)}/groups`, post(payload)),
  deleteGroup: (id: string, groupNo: number) =>
    call<ClassInfo>(`/classes/${encodeURIComponent(id)}/groups/${groupNo}`, { method: 'DELETE' }),

  /* ---------------- Dữ liệu dùng chung ---------------- */

  bootstrap: () => callOr(() => offline.bootstrap(), '/bootstrap'),
  modules: () => call<LabModule[]>('/modules'),
  tools: () => call<ToolItem[]>('/tools'),

  questions: (moduleId?: string) =>
    call<QuizQuestion[]>(`/questions${moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : ''}`),

  addQuestion: (payload: QuizQuestion & { moduleId?: string }) =>
    call<QuizQuestion>('/questions', post(payload)),

  /* ---------------- Bài làm của chính mình ----------------
     Không truyền userId nữa: máy chủ lấy người dùng từ mã phiên, nên không ai
     đọc hay ghi được bài của người khác bằng cách đổi mã trong lời gọi. */

  saveAttempt: (payload: {
    userId: string; moduleId?: string; score: number; total: number;
    answers?: { questionId: string; optionId?: string; isCorrect: boolean }[];
  }) => callOr(() => offline.saveAttempt(payload), '/attempts', post(payload)),

  getReport: (userId: string, moduleId: string) =>
    callOr(() => offline.getReport(userId, moduleId), `/reports/${encodeURIComponent(moduleId)}`),

  saveReportRows: (userId: string, moduleId: string, rows: LabReportRow[]) =>
    callOr(() => offline.saveReportRows(userId, moduleId, rows),
      `/reports/${encodeURIComponent(moduleId)}`, { method: 'PUT', body: body({ rows }) }),

  submitReport: (userId: string, moduleId: string, summary: { rAvg?: number; deltaR?: number; relErr?: number }) =>
    callOr(() => offline.submitReport(userId, moduleId, summary),
      `/reports/${encodeURIComponent(moduleId)}/submit`, post(summary)),

  reopenReport: (userId: string, moduleId: string) =>
    callOr(() => offline.reopenReport(userId, moduleId),
      `/reports/${encodeURIComponent(moduleId)}/reopen`, post()),

  saveCircuit: (payload: { userId: string; moduleId?: string; name?: string; data: unknown; isValid?: boolean }) =>
    callOr(() => offline.saveCircuit(payload), '/circuits', post(payload)),

  listCircuits: (userId: string) => callOr(() => offline.listCircuits(userId), '/circuits'),

  /* ---------------- Bài tập: học sinh ---------------- */

  myAssignments: () => call<MyAssignment[]>('/my/assignments'),
  startAssignment: (id: string) => call<{ ok: boolean }>(`/assignments/${encodeURIComponent(id)}/start`, post()),
  submitAssignment: (id: string) =>
    call<{ assignmentId: string; status: string; score: number | null; late: number; submittedAt: string }>(
      `/assignments/${encodeURIComponent(id)}/submit`, post()),

  /* ---------------- Bài tập: giáo viên ---------------- */

  assignments: () => call<Assignment[]>('/assignments'),
  createAssignment: (payload: {
    kind: AssignmentKind; moduleId?: string | null; title: string;
    instructions?: string; dueAt?: string | null; passScore?: number; state?: AssignmentState;
  }) => call<Assignment>('/assignments', post(payload)),
  updateAssignment: (id: string, payload: Partial<{
    kind: AssignmentKind; moduleId: string | null; title: string;
    instructions: string; dueAt: string | null; passScore: number; state: AssignmentState;
  }>) => call<Assignment>(`/assignments/${encodeURIComponent(id)}`, { method: 'PATCH', body: body(payload) }),
  deleteAssignment: (id: string) =>
    call<{ ok: boolean }>(`/assignments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  assignmentBoard: (id: string) =>
    call<{ assignment: Assignment; rows: BoardRow[]; groups: BoardGroup[] }>(
      `/assignments/${encodeURIComponent(id)}/board`),
  gradeSubmission: (id: string, userId: string, payload: { score?: number | null; comment?: string }) =>
    call<BoardRow>(`/assignments/${encodeURIComponent(id)}/grade/${encodeURIComponent(userId)}`, post(payload)),
  reopenSubmission: (id: string, userId: string) =>
    call<{ ok: boolean }>(`/assignments/${encodeURIComponent(id)}/reopen/${encodeURIComponent(userId)}`, post()),

  teacherStats: (classCode?: string) =>
    callOr(() => offline.teacherStats(),
      `/teacher/stats${classCode ? `?classCode=${encodeURIComponent(classCode)}` : ''}`),
  classStudents: () => call<ApiUser[]>('/teacher/students'),

  /* ---------------- Dành riêng cho tài khoản developer ---------------- */

  dev: {
    overview: () => call<Record<string, string | number>>('/dev/overview'),
    tables: () => call<DevTable[]>('/dev/tables'),
    table: (name: string, limit = 50, offset = 0) =>
      call<{ name: string; total: number; limit: number; offset: number; rows: Record<string, unknown>[] }>(
        `/dev/table/${encodeURIComponent(name)}?limit=${limit}&offset=${offset}`),
    query: (sql: string) => call<DevQueryResult>('/dev/query', post({ sql })),
    accounts: () => call<DevAccount[]>('/dev/accounts'),
    setStatus: (userId: string, status: 'hoat_dong' | 'khoa') =>
      call<{ ok: boolean }>(`/dev/accounts/${encodeURIComponent(userId)}/status`, post({ status })),
    /* Mật khẩu mới chỉ trả về đúng một lần ở đây; hỏi lại máy chủ sẽ không ra nữa */
    resetPassword: (userId: string, password?: string) =>
      call<{ userId: string; email: string; name: string; password: string }>(
        `/dev/accounts/${encodeURIComponent(userId)}/password`, post({ password })),
    logs: (limit = 100) => call<{
      id: number; action: string; detail: string | null; createdAt: string;
      userName: string; userId: string | null;
    }[]>(`/dev/logs?limit=${limit}`),
  },
};
