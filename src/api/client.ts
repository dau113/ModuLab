/**
 * Lớp truy cập dữ liệu phía trình duyệt.
 * Mọi màn hình đều lấy dữ liệu qua đây thay vì đọc tệp dữ liệu mẫu.
 */
import type { LabModule, ToolItem, QuizQuestion, TeacherClassStats, LabReportRow } from '../types';
import { offline } from './offline';

const BASE = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL || 'https://modulab-q2by.onrender.com/api';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'hs' | 'gv';
  classCode: string;
  teamCode: string;
}

export interface Bootstrap {
  users: ApiUser[];
  modules: LabModule[];
  tools: ToolItem[];
  questions: QuizQuestion[];
}

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
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } : init?.headers,
  });
  const text = await res.text();

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

export const api = {
  health: () => call<{ ok: boolean; seeded: boolean }>('/health'),

  /** Nạp một lượt toàn bộ dữ liệu tĩnh khi mở ứng dụng */
  bootstrap: () => callOr(() => offline.bootstrap(), '/bootstrap'),

  users: () => call<ApiUser[]>('/users'),
  modules: () => call<LabModule[]>('/modules'),
  tools: () => call<ToolItem[]>('/tools'),

  questions: (moduleId?: string) =>
    call<QuizQuestion[]>(`/questions${moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : ''}`),

  addQuestion: (payload: QuizQuestion & { moduleId?: string; createdBy?: string }) =>
    call<QuizQuestion>('/questions', { method: 'POST', body: body(payload) }),

  saveAttempt: (payload: {
    userId: string; moduleId?: string; score: number; total: number;
    answers?: { questionId: string; optionId?: string; isCorrect: boolean }[];
  }) => callOr(() => offline.saveAttempt(payload), '/attempts', { method: 'POST', body: body(payload) }),

  getReport: (userId: string, moduleId: string) =>
    callOr(() => offline.getReport(userId, moduleId),`/reports/${encodeURIComponent(userId)}/${encodeURIComponent(moduleId)}`),

  saveReportRows: (userId: string, moduleId: string, rows: LabReportRow[]) =>
    callOr(() => offline.saveReportRows(userId, moduleId, rows),`/reports/${encodeURIComponent(userId)}/${encodeURIComponent(moduleId)}`,
      { method: 'PUT', body: body({ rows }) }),

  submitReport: (userId: string, moduleId: string, summary: { rAvg?: number; deltaR?: number; relErr?: number }) =>
    callOr(() => offline.submitReport(userId, moduleId, summary),`/reports/${encodeURIComponent(userId)}/${encodeURIComponent(moduleId)}/submit`,
      { method: 'POST', body: body(summary) }),

  reopenReport: (userId: string, moduleId: string) =>
    callOr(() => offline.reopenReport(userId, moduleId),`/reports/${encodeURIComponent(userId)}/${encodeURIComponent(moduleId)}/reopen`,
      { method: 'POST', body: body({}) }),

  saveCircuit: (payload: { userId: string; moduleId?: string; name?: string; data: unknown; isValid?: boolean }) =>
    callOr(() => offline.saveCircuit(payload),'/circuits', { method: 'POST', body: body(payload) }),

  listCircuits: (userId: string) => callOr(() => offline.listCircuits(userId), `/circuits/${encodeURIComponent(userId)}`),

  teacherStats: (classCode?: string) =>
    callOr(() => offline.teacherStats(),`/teacher/stats${classCode ? `?classCode=${encodeURIComponent(classCode)}` : ''}`),
};
