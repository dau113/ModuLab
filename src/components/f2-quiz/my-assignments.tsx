/**
 * Danh sách bài tập của học sinh.
 *
 * Mỗi bài hiện hạn nộp, trạng thái làm bài và điểm giáo viên đã chấm. Nút nộp
 * chỉ gửi mã bài tập lên máy chủ; điểm thì máy chủ tự đọc từ lượt chơi hoặc bản
 * báo cáo của chính em rồi tính, nên không có cách nào tự khai điểm cho mình.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ClipboardList, CheckCircle2, Clock, CircleDashed, AlertCircle, Loader2, Send, Lock,
} from 'lucide-react';
import { api } from '../../api/client';
import type { MyAssignment } from '../../api/client';

const card = 'rounded-xl border border-slate-200 bg-white';

const fmt = (iso: string | null) => {
  if (!iso) return 'không đặt hạn';
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const qua = (iso: string | null) => !!iso && Date.now() > Date.parse(iso);

const BADGE: Record<string, { text: string; cls: string; Icon: typeof Clock }> = {
  chua_lam: { text: 'Chưa làm', cls: 'bg-slate-100 text-slate-500', Icon: CircleDashed },
  dang_lam: { text: 'Đang làm', cls: 'bg-amber-100 text-amber-800', Icon: Clock },
  da_nop: { text: 'Đã nộp', cls: 'bg-sky-100 text-sky-800', Icon: ClipboardList },
  da_cham: { text: 'Đã chấm', cls: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 },
};

interface Props {
  /** Chuyển sang màn hình làm bài tương ứng */
  onOpen?: (a: MyAssignment) => void;
}

export const MyAssignments: React.FC<Props> = ({ onOpen }) => {
  const [list, setList] = useState<MyAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setList(await api.myAssignments()); setError(null); } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setList([]);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (a: MyAssignment) => {
    setBusyId(a.id); setError(null); setNote(null);
    try {
      const r = await api.submitAssignment(a.id);
      setNote(`Đã nộp "${a.title}" — ${r.score ?? '—'} điểm${r.late ? ' (trễ hạn)' : ''}.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusyId(null); }
  };

  if (!list) return <p className="text-slate-500">Đang tải bài tập…</p>;

  return (
    <div className="space-y-3">
      {note && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50
          px-3 py-2.5 text-[clamp(12.5px,0.86vw,15px)] text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /><span>{note}</span>
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50
          px-3 py-2.5 text-[clamp(12.5px,0.86vw,15px)] text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {!list.length && (
        <div className={`${card} p-4`}>
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500">
            Lớp em chưa có bài tập nào được giao. Khi giáo viên giao bài, bài sẽ hiện ở đây kèm hạn nộp.
          </p>
        </div>
      )}

      {list.map((a) => {
        const st = BADGE[a.status ?? 'chua_lam'] ?? BADGE.chua_lam;
        const dong = a.state === 'dong';
        const choNop = a.status !== 'da_cham' && !dong;
        return (
          <div key={a.id} className={`${card} p-3.5`}>
            <div className="flex flex-wrap items-start gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-[clamp(14px,0.98vw,16.5px)] text-slate-900">{a.title}</h4>
                <p className="mt-0.5 text-[clamp(12.5px,0.86vw,15px)] text-slate-500">
                  {a.kind === 'khoi_dong' ? 'Game ôn tập lý thuyết' : 'Thực hành mô phỏng & báo cáo'}
                  {a.moduleTitle ? ` · ${a.moduleTitle}` : ''}
                </p>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded
                font-semibold text-[clamp(11.5px,0.78vw,13.5px)] ${st.cls}`}>
                <st.Icon className="w-3 h-3" /> {st.text}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1
              text-[clamp(12.5px,0.86vw,15px)]">
              <span className={qua(a.dueAt) && a.status !== 'da_cham' ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                Hạn nộp: {fmt(a.dueAt)}
                {qua(a.dueAt) && a.status !== 'da_cham' && ' · đã quá hạn'}
              </span>
              {a.score !== null && a.score !== undefined && (
                <span className="font-mono font-bold text-indigo-700">
                  Điểm: {a.score}/10
                  {a.score >= a.passScore
                    ? <span className="ml-1 text-emerald-700 font-sans">· đạt</span>
                    : <span className="ml-1 text-amber-700 font-sans">· chưa đạt</span>}
                </span>
              )}
            </div>

            {a.teacherComment && (
              <p className="mt-2 rounded-lg border-l-[3px] border-l-indigo-500 border border-slate-200
                bg-slate-50 px-3 py-2 text-[clamp(12.5px,0.86vw,15px)] text-slate-700">
                <span className="font-semibold text-indigo-900">Nhận xét: </span>{a.teacherComment}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap gap-2">
              {onOpen && choNop && (
                <button onClick={() => onOpen(a)}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700
                    font-semibold text-[clamp(12.5px,0.86vw,15px)] hover:border-indigo-300 transition-colors">
                  {a.kind === 'khoi_dong' ? 'Vào làm bài' : 'Mở phần thực hành'}
                </button>
              )}
              {choNop && (
                <button onClick={() => void submit(a)} disabled={busyId === a.id}
                  className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white
                    font-semibold text-[clamp(12.5px,0.86vw,15px)] hover:bg-indigo-700
                    disabled:opacity-60 transition-colors">
                  {busyId === a.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Send className="w-3.5 h-3.5" />}
                  {a.status === 'da_nop' ? 'Nộp lại' : 'Nộp bài'}
                </button>
              )}
              {dong && (
                <span className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-100
                  text-slate-500 text-[clamp(12.5px,0.86vw,15px)]">
                  <Lock className="w-3.5 h-3.5" /> Bài đã đóng
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
