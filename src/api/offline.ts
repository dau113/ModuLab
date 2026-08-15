/**
 * Nguồn dữ liệu dự phòng khi không có máy chủ.
 *
 * Khi triển khai lên nơi chỉ chạy web tĩnh (Vercel, GitHub Pages…), các lời gọi
 * /api không tới được máy chủ Node. Thay vì báo lỗi, ứng dụng chuyển sang dùng
 * dữ liệu đóng gói sẵn và lưu bài làm vào bộ nhớ trình duyệt.
 */
import { INITIAL_USERS, LAB_MODULES, EXPLORE_TOOLS, QUIZ_QUESTIONS, TEACHER_CLASS_STATS } from '../data/mockData';
import type { LabReportRow, TeacherClassStats } from '../types';
import type { ApiUser, Bootstrap, LabReport, SavedCircuit } from './client';

const KEY = 'modulab-offline';

interface Store {
  reports: Record<string, LabReport>;
  attempts: { userId: string; score: number; total: number; at: string }[];
  circuits: (SavedCircuit & { userId: string; data: unknown })[];
}

const emptyStore = (): Store => ({ reports: {}, attempts: [], circuits: [] });

const read = (): Store => {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...emptyStore(), ...JSON.parse(raw) } : emptyStore();
  } catch {
    return emptyStore();
  }
};

const write = (s: Store) => {
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* bỏ qua */ }
};

const users: ApiUser[] = INITIAL_USERS.map((u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  classCode: u.classCode ?? TEACHER_CLASS_STATS.classCode,
  teamCode: u.teamCode ?? '',
}));

const key = (userId: string, moduleId: string) => `${userId}|${moduleId}`;

const blankReport = (userId: string, moduleId: string): LabReport => ({
  id: 0,
  userId,
  moduleId,
  status: 'dang_lam',
  rAvg: null,
  deltaR: null,
  relErr: null,
  grade: null,
  teacherComment: null,
  submittedAt: null,
  rows: [],
});

export const offline = {
  bootstrap(): Bootstrap {
    return {
      users,
      modules: LAB_MODULES,
      tools: EXPLORE_TOOLS,
      questions: QUIZ_QUESTIONS,
    };
  },

  getReport(userId: string, moduleId: string): LabReport {
    const store = read();
    return store.reports[key(userId, moduleId)] ?? blankReport(userId, moduleId);
  },

  saveReportRows(userId: string, moduleId: string, rows: LabReportRow[]): LabReport {
    const store = read();
    const cur = store.reports[key(userId, moduleId)] ?? blankReport(userId, moduleId);
    const next: LabReport = { ...cur, rows };
    store.reports[key(userId, moduleId)] = next;
    write(store);
    return next;
  },

  submitReport(userId: string, moduleId: string, summary: { rAvg?: number; deltaR?: number; relErr?: number }): LabReport {
    const store = read();
    const cur = store.reports[key(userId, moduleId)] ?? blankReport(userId, moduleId);
    const next: LabReport = {
      ...cur,
      status: 'da_nop',
      rAvg: summary.rAvg ?? null,
      deltaR: summary.deltaR ?? null,
      relErr: summary.relErr ?? null,
      submittedAt: new Date().toISOString(),
    };
    store.reports[key(userId, moduleId)] = next;
    write(store);
    return next;
  },

  reopenReport(userId: string, moduleId: string): LabReport {
    const store = read();
    const next = blankReport(userId, moduleId);
    store.reports[key(userId, moduleId)] = next;
    write(store);
    return next;
  },

  saveAttempt(payload: { userId: string; score: number; total: number }) {
    const store = read();
    store.attempts.push({ ...payload, at: new Date().toISOString() });
    write(store);
    return { id: store.attempts.length };
  },

  saveCircuit(payload: { userId: string; name?: string; data: unknown; isValid?: boolean }) {
    const store = read();
    const id = store.circuits.length + 1;
    store.circuits.push({
      id,
      userId: payload.userId,
      name: payload.name ?? `Bản lắp ${id}`,
      isValid: payload.isValid ? 1 : 0,
      updatedAt: new Date().toISOString(),
      data: payload.data,
    });
    write(store);
    return { id };
  },

  listCircuits(userId: string): SavedCircuit[] {
    return read().circuits.filter((c) => c.userId === userId)
      .map(({ id, name, isValid, updatedAt }) => ({ id, name, isValid, updatedAt }));
  },

  /** Số liệu lớp: ghép danh sách mẫu với kết quả người dùng vừa làm trên máy này */
  teacherStats(): TeacherClassStats {
    const store = read();
    const base = TEACHER_CLASS_STATS;
    const studentList = base.studentList.map((s) => {
      const best = store.attempts.filter((a) => a.userId === s.id)
        .reduce((m, a) => Math.max(m, Math.round((a.score / Math.max(1, a.total * 17)) * 10)), -1);
      const submitted = Object.values(store.reports)
        .some((r) => r.userId === s.id && r.status !== 'dang_lam');
      return {
        ...s,
        quizScore: best >= 0 ? best : s.quizScore,
        reportStatus: submitted ? 'Đạt' : s.reportStatus,
      };
    });
    return { ...base, studentList };
  },
};
