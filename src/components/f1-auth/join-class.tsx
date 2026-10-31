/**
 * Khối vào lớp của học sinh.
 *
 * Giáo viên phát cho mỗi nhóm một mã dạng `1204N2` — bốn chữ số của lớp, chữ N,
 * rồi số nhóm. Em nào không có nhóm thì dùng mã kết thúc bằng N0 để nộp bài
 * riêng lẻ. Số thứ tự trong lớp nhập ở ô riêng, vì cả nhóm dùng chung một mã
 * nhưng mỗi em một số.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, LogIn, Loader2, AlertCircle, CheckCircle2, School, Hash, UserRound,
} from 'lucide-react';
import { api } from '../../api/client';
import type { MyClass } from '../../api/client';

const field = `w-full h-11 px-3 rounded-xl border border-slate-300 bg-white text-slate-900
  text-[clamp(13px,0.9vw,15.5px)] outline-none transition-colors
  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60`;
const label = 'block text-[clamp(12.5px,0.86vw,15px)] font-semibold text-slate-600 mb-1';

interface Props {
  /** Gọi khi vào lớp xong, để màn hình cha nạp lại bài tập của lớp mới */
  onJoined?: (c: MyClass) => void;
  /** Gọn lại cho vừa chỗ hẹp, dùng ở màn hình bài tập */
  compact?: boolean;
}

export const JoinClass: React.FC<Props> = ({ onJoined, compact }) => {
  const [mine, setMine] = useState<MyClass | null | undefined>(undefined);
  const [code, setCode] = useState('');
  const [seat, setSeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doiLop, setDoiLop] = useState(false);

  const load = useCallback(async () => {
    try { setMine(await api.myClass()); } catch { setMine(null); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const c = await api.joinClass(code.trim(), Number(seat));
      setMine(c);
      setCode(''); setSeat(''); setDoiLop(false);
      onJoined?.(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  };

  if (mine === undefined) {
    return <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500">Đang kiểm tra lớp của em…</p>;
  }

  /* ---------- Đã vào lớp ---------- */
  if (mine && !doiLop) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3.5">
        <div className="flex flex-wrap items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[clamp(13.5px,0.94vw,16px)] text-slate-900">
              {mine.className}
            </p>
            <p className="mt-0.5 text-[clamp(12.5px,0.86vw,15px)] text-slate-600">
              {mine.groupNo === 0 ? 'Làm bài riêng lẻ' : `${mine.groupName}`}
              {mine.seatNo !== null && ` · số thứ tự ${mine.seatNo}`}
            </p>
          </div>
          <button onClick={() => { setDoiLop(true); setError(null); }}
            className="shrink-0 h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600
              text-[clamp(12px,0.82vw,14px)] font-semibold hover:border-indigo-300 transition-colors">
            Đổi lớp
          </button>
        </div>

        {mine.groupNo !== 0 && (mine.members?.length ?? 0) > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100">
            <p className="text-[clamp(12px,0.82vw,14px)] text-slate-500 mb-1.5">
              Cùng nhóm với em ({mine.members?.length ?? 0} bạn)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(mine.members ?? []).map((m) => (
                <span key={m.id} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg
                  border border-slate-200 bg-slate-50 text-slate-700 text-[clamp(12px,0.82vw,14px)]">
                  <UserRound className="w-3 h-3 text-slate-400" />
                  {m.seatNo !== null && <span className="font-mono text-slate-400">{m.seatNo}</span>}
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- Chưa vào lớp, hoặc đang đổi lớp ---------- */
  return (
    <div className={`rounded-xl border bg-white ${compact ? 'border-slate-200 p-3.5' : 'border-indigo-200 p-4'}`}>
      <div className="flex items-start gap-2">
        <School className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
        <div className="min-w-0">
          <h4 className="font-bold text-[clamp(13.5px,0.94vw,16px)] text-slate-900">
            {doiLop ? 'Đổi sang lớp hoặc nhóm khác' : 'Em chưa vào lớp nào'}
          </h4>
          <p className="mt-0.5 text-[clamp(12.5px,0.86vw,15px)] text-slate-600">
            Nhập mã giáo viên cho, kèm số thứ tự của em trong lớp. Vào lớp xong mới
            nhận được bài tập và nộp bài.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_7rem_auto] gap-2.5">
        <div>
          <label className={label} htmlFor="vl-code">Mã lớp</label>
          <div className="relative">
            <Hash className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
            <input id="vl-code" className={`${field} pl-9 font-mono uppercase tracking-wide`}
              value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={busy} placeholder="1204N2" required autoComplete="off" />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="vl-seat">STT của em</label>
          <input id="vl-seat" type="number" min="1" max="99" className={`${field} font-mono`}
            value={seat} onChange={(e) => setSeat(e.target.value)}
            disabled={busy} placeholder="4" required />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={busy}
            className="h-11 px-4 inline-flex items-center justify-center gap-2 rounded-xl
              bg-indigo-600 text-white font-bold text-[clamp(13px,0.9vw,15.5px)]
              hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Vào lớp
          </button>
          {doiLop && (
            <button type="button" onClick={() => { setDoiLop(false); setError(null); }}
              className="h-11 px-3 rounded-xl text-slate-500 text-[clamp(12.5px,0.86vw,15px)]
                hover:text-slate-800 transition-colors">
              Thôi
            </button>
          )}
        </div>
      </form>

      {error && (
        <div role="alert" className="mt-2.5 flex items-start gap-2 rounded-xl border border-rose-200
          bg-rose-50 px-3 py-2.5 text-[clamp(12.5px,0.86vw,15px)] text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="min-w-0">{error}</span>
        </div>
      )}
    </div>
  );
};
