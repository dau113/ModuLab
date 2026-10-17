/**
 * Khu giao bài tập của giáo viên.
 *
 * Bản trước chỉ là một cái form bấm xong hiện chữ "đã gửi thông báo" rồi thôi —
 * không có gì được lưu lại và học sinh chẳng nhận được gì. Giờ mỗi bài giao là
 * một dòng thật trong cơ sở dữ liệu, học sinh mở ứng dụng lên là thấy, nộp vào
 * thì giáo viên thấy ngay ở bảng theo dõi bên dưới.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Send, Loader2, AlertCircle, Trash2, Lock, LockOpen, ClipboardList,
  CheckCircle2, Clock, CircleDashed, RotateCcw,
} from 'lucide-react';
import { api } from '../../api/client';
import type { Assignment, BoardRow, AssignmentKind } from '../../api/client';
import type { LabModule } from '../../types';

const card = 'rounded-xl border border-slate-200 bg-white';
const field = `w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-900
  text-[clamp(13px,0.9vw,15.5px)] outline-none transition-colors
  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60`;
const label = 'block text-[clamp(12.5px,0.86vw,15px)] font-semibold text-slate-600 mb-1';

/** Hạn nộp từ ô input kiểu datetime-local sang chuỗi giờ địa phương máy chủ hiểu được */
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

const fmt = (iso: string | null) => {
  if (!iso) return 'không đặt hạn';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const TRANG_THAI: Record<string, { text: string; cls: string; Icon: typeof Clock }> = {
  chua_lam: { text: 'Chưa làm', cls: 'bg-slate-100 text-slate-500', Icon: CircleDashed },
  dang_lam: { text: 'Đang làm', cls: 'bg-amber-100 text-amber-800', Icon: Clock },
  da_nop: { text: 'Đã nộp', cls: 'bg-sky-100 text-sky-800', Icon: ClipboardList },
  da_cham: { text: 'Đã chấm', cls: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 },
};

interface Props {
  modules: LabModule[];
  /** Báo cho màn hình cha biết dữ liệu đã đổi, để các thẻ thống kê tải lại */
  onChanged?: () => void;
}

export const AssignmentManager: React.FC<Props> = ({ modules, onChanged }) => {
  const [list, setList] = useState<Assignment[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [board, setBoard] = useState<{ assignment: Assignment; rows: BoardRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState<{
    kind: AssignmentKind; moduleId: string; title: string; dueAt: string; passScore: string;
  }>({ kind: 'khoi_dong', moduleId: '', title: '', dueAt: '', passScore: '5' });

  const load = useCallback(async () => {
    try { setList(await api.assignments()); } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const loadBoard = useCallback(async (id: string) => {
    setOpenId(id);
    setBoard(null);
    try { setBoard(await api.assignmentBoard(id)); } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const a = await api.createAssignment({
        kind: form.kind,
        moduleId: form.moduleId || null,
        title: form.title.trim(),
        dueAt: toIso(form.dueAt),
        passScore: Number(form.passScore) || 5,
        state: 'mo',
      });
      setForm((f) => ({ ...f, title: '' }));
      await load();
      await loadBoard(a.id);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  };

  const toggleState = async (a: Assignment) => {
    try {
      await api.updateAssignment(a.id, { state: a.state === 'dong' ? 'mo' : 'dong' });
      await load();
      if (openId === a.id) await loadBoard(a.id);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const remove = async (a: Assignment) => {
    if (!window.confirm(`Xoá bài "${a.title}"? Mọi bài học sinh đã nộp cho bài này cũng mất theo.`)) return;
    try {
      await api.deleteAssignment(a.id);
      if (openId === a.id) { setOpenId(null); setBoard(null); }
      await load();
      onChanged?.();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const grade = async (userId: string, score: number | null, comment?: string) => {
    if (!openId) return;
    try {
      await api.gradeSubmission(openId, userId, { score, comment });
      await loadBoard(openId);
      await load();
      onChanged?.();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div className="space-y-3">
      {/* ---------- Form giao bài ---------- */}
      <form onSubmit={create} className={`${card} p-3.5 space-y-3`}>
        <h3 className="font-bold text-[clamp(14px,0.98vw,16.5px)] text-slate-900">Giao bài mới cho lớp</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="bt-title">Tên bài tập</label>
            <input id="bt-title" className={field} value={form.title} disabled={busy} required
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ôn tập định luật Ohm cho đoạn mạch" />
          </div>

          <div>
            <label className={label} htmlFor="bt-kind">Loại bài</label>
            <select id="bt-kind" className={field} value={form.kind} disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as AssignmentKind }))}>
              <option value="khoi_dong">Game ôn tập lý thuyết</option>
              <option value="thuc_hanh">Thực hành mô phỏng &amp; báo cáo</option>
            </select>
          </div>

          <div>
            <label className={label} htmlFor="bt-module">Bài thực hành</label>
            <select id="bt-module" className={field} value={form.moduleId} disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, moduleId: e.target.value }))}>
              <option value="">Tất cả chủ đề</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>

          <div>
            <label className={label} htmlFor="bt-due">Hạn nộp</label>
            <input id="bt-due" type="datetime-local" className={field} value={form.dueAt} disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))} />
          </div>

          <div>
            <label className={label} htmlFor="bt-pass">Điểm đạt tối thiểu</label>
            <input id="bt-pass" type="number" min="0" max="10" step="0.5" className={field}
              value={form.passScore} disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, passScore: e.target.value }))} />
          </div>
        </div>

        {form.kind === 'thuc_hanh' && !form.moduleId && (
          <p className="text-[clamp(12px,0.82vw,14px)] text-amber-700">
            Bài thực hành cần chọn một chủ đề cụ thể thì học sinh mới nộp báo cáo đúng bài được.
          </p>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50
            px-3 py-2.5 text-[clamp(12.5px,0.86vw,15px)] text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={busy}
          className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white
            font-bold text-[clamp(13px,0.9vw,15.5px)] hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Giao bài cho lớp
        </button>
      </form>

      {/* ---------- Danh sách bài đã giao ---------- */}
      <div className={card}>
        <div className="px-3.5 py-2.5 border-b border-slate-200">
          <h3 className="font-bold text-[clamp(14px,0.98vw,16.5px)] text-slate-900">
            Bài đã giao {list && <span className="font-normal text-slate-500">· {list.length}</span>}
          </h3>
        </div>

        {!list && <p className="p-4 text-slate-500">Đang tải…</p>}
        {list && !list.length && (
          <p className="p-4 text-[clamp(13px,0.9vw,15.5px)] text-slate-500">
            Lớp chưa có bài tập nào. Giao bài đầu tiên ở khung trên.
          </p>
        )}

        <div className="divide-y divide-slate-100">
          {list?.map((a) => (
            <div key={a.id}>
              <div className="px-3.5 py-2.5 flex flex-wrap items-center gap-2">
                <button onClick={() => (openId === a.id ? setOpenId(null) : void loadBoard(a.id))}
                  className="min-w-0 flex-1 text-left">
                  <div className="font-semibold text-[clamp(13px,0.9vw,15.5px)] text-slate-900 truncate">
                    {a.title}
                  </div>
                  <div className="text-[clamp(12px,0.82vw,14px)] text-slate-500">
                    {a.kind === 'khoi_dong' ? 'Game ôn tập' : 'Thực hành'}
                    {a.moduleTitle ? ` · ${a.moduleTitle}` : ''} · hạn {fmt(a.dueAt)}
                  </div>
                </button>

                <span className="shrink-0 text-[clamp(12px,0.82vw,14px)] font-mono text-slate-600">
                  {a.submittedCount}/{a.classSize} nộp
                </span>

                <button onClick={() => void toggleState(a)} title={a.state === 'dong' ? 'Mở lại' : 'Đóng bài'}
                  className={`h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border
                    text-[clamp(11.5px,0.78vw,13.5px)] font-semibold transition-colors ${
                    a.state === 'dong'
                      ? 'border-slate-300 bg-slate-100 text-slate-600'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>
                  {a.state === 'dong' ? <><Lock className="w-3 h-3" /> Đã đóng</> : <><LockOpen className="w-3 h-3" /> Đang mở</>}
                </button>

                <button onClick={() => void remove(a)} aria-label={`Xoá bài ${a.title}`}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200
                    text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {openId === a.id && (
                <div className="px-3.5 pb-3">
                  {!board ? <p className="text-slate-500 py-2">Đang tải bảng theo dõi…</p> : (
                    <div className="rounded-xl border border-slate-200 overflow-x-auto">
                      <table className="w-full text-left text-[clamp(12.5px,0.86vw,15px)]">
                        <thead className="bg-slate-100 text-slate-600 text-[clamp(11.5px,0.78vw,13.5px)] uppercase font-bold">
                          <tr>
                            <th className="px-2.5 py-2">Học sinh</th>
                            <th className="px-2.5 py-2">Nhóm</th>
                            <th className="px-2.5 py-2">Trạng thái</th>
                            <th className="px-2.5 py-2 text-center">Điểm</th>
                            <th className="px-2.5 py-2 text-right">Chấm</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {board.rows.map((r) => {
                            const st = TRANG_THAI[r.status] ?? TRANG_THAI.chua_lam;
                            return (
                              <tr key={r.userId} className="hover:bg-slate-50">
                                <td className="px-2.5 py-2 font-semibold text-slate-800">{r.name}</td>
                                <td className="px-2.5 py-2 text-slate-500">{r.team || '—'}</td>
                                <td className="px-2.5 py-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded
                                    font-semibold text-[clamp(11.5px,0.78vw,13.5px)] ${st.cls}`}>
                                    <st.Icon className="w-3 h-3" /> {st.text}
                                  </span>
                                  {r.late === 1 && (
                                    <span className="ml-1.5 text-[clamp(11px,0.76vw,13px)] text-rose-600 font-semibold">
                                      trễ hạn
                                    </span>
                                  )}
                                </td>
                                <td className="px-2.5 py-2 text-center font-mono font-bold text-slate-800">
                                  {r.score ?? '—'}
                                </td>
                                <td className="px-2.5 py-2 text-right whitespace-nowrap">
                                  <input type="number" min="0" max="10" step="0.5" defaultValue={r.score ?? ''}
                                    aria-label={`Điểm của ${r.name}`}
                                    onBlur={(e) => {
                                      const v = e.target.value === '' ? null : Number(e.target.value);
                                      if (v !== r.score) void grade(r.userId, v);
                                    }}
                                    className="w-16 h-8 px-2 rounded-lg border border-slate-300 text-center
                                      font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                                  {r.status === 'da_cham' && (
                                    <button onClick={() => void api.reopenSubmission(a.id, r.userId).then(() => loadBoard(a.id))}
                                      aria-label={`Trả bài cho ${r.name} làm lại`} title="Trả lại để làm lại"
                                      className="ml-1.5 h-8 w-8 inline-flex items-center justify-center rounded-lg
                                        border border-slate-200 text-slate-400 hover:text-indigo-600
                                        hover:border-indigo-300 transition-colors">
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
