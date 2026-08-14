/**
 * Lớp truy cập dữ liệu phía trình duyệt.
 * Mọi màn hình đều lấy dữ liệu qua đây thay vì đọc tệp dữ liệu mẫu.
 */
import type { LabModule, ToolItem, QuizQuestion, TeacherClassStats, LabReportRow } from '../types';

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

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } : init?.headers,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error || `Máy chủ trả về lỗi ${res.status}`);
  return data as T;
}

const body = (payload: unknown) => JSON.stringify(payload);

export const api = {
  health: () => call<{ ok: boolean; seeded: boolean }>('/health'),

  /** Nạp một lượt toàn bộ dữ liệu tĩnh khi mở ứng dụng */
  bootstrap: () => call<Bootstrap>('/bootstrap'),

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
  }) => call<{ id: number }>('/attempts', { method: 'POST', body: body(payload) }),

  getReport: (userId: string, moduleId: string) =>
    call<LabReport>(`/reports/${encodeURIComponent(userId)}/${encodeURIComponent(moduleId)}`),

  saveReportRows: (userId: string, moduleId: string, rows: LabReportRow[]) =>
    call<LabReport>(`/reports/${encodeURIComponent(userId)}/${encodeURIComponent(moduleId)}`,
      { method: 'PUT', body: body({ rows }) }),

  submitReport: (userId: string, moduleId: string, summary: { rAvg?: number; deltaR?: number; relErr?: number }) =>
    call<LabReport>(`/reports/${encodeURIComponent(userId)}/${encodeURIComponent(moduleId)}/submit`,
      { method: 'POST', body: body(summary) }),

  saveCircuit: (payload: { userId: string; moduleId?: string; name?: string; data: unknown; isValid?: boolean }) =>
    call<{ id: number }>('/circuits', { method: 'POST', body: body(payload) }),

  listCircuits: (userId: string) => call<SavedCircuit[]>(`/circuits/${encodeURIComponent(userId)}`),

  teacherStats: (classCode?: string) =>
    call<TeacherClassStats>(`/teacher/stats${classCode ? `?classCode=${encodeURIComponent(classCode)}` : ''}`),
};
