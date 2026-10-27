/**
 * Bài giảng tự do, phía học sinh: xem nội dung rồi trả lời.
 *
 * Danh sách bài ở ngoài, bấm vào một bài thì mở ra đọc và làm. Trong lúc làm,
 * câu trả lời được lưu tạm lên máy chủ nên đóng trang rồi quay lại vẫn còn.
 *
 * Đáp án đúng chỉ hiện SAU KHI giáo viên chấm — máy chủ cũng không gửi đáp án
 * xuống trước lúc đó, nên không có cách nào mở công cụ nhà phát triển ra xem trộm.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen, ArrowLeft, Send, Loader2, AlertCircle, CheckCircle2, XCircle,
  Clock, CircleDashed, HelpCircle, Save,
} from 'lucide-react';
import { api } from '../../api/client';
import type { MyLesson, LessonView, LessonBlock } from '../../api/client';
import { UploadMedia, VideoLink } from '../common/upload-media';

const card = 'rounded-xl border border-slate-200 bg-white';

const fmt = (iso: string | null) => {
  if (!iso) return 'không đặt hạn';
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? iso
    : d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const quaHan = (iso: string | null) => !!iso && Date.now() > Date.parse(iso);

const BADGE: Record<string, { text: string; cls: string; Icon: typeof Clock }> = {
  chua_lam: { text: 'Chưa làm', cls: 'bg-slate-100 text-slate-500', Icon: CircleDashed },
  dang_lam: { text: 'Đang làm', cls: 'bg-amber-100 text-amber-800', Icon: Clock },
  da_nop: { text: 'Đã nộp', cls: 'bg-sky-100 text-sky-800', Icon: BookOpen },
  da_cham: { text: 'Đã chấm', cls: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 },
};

/* ------------------------------------------------------------------ */
/* Một khối nội dung khi học sinh xem                                  */
/* ------------------------------------------------------------------ */

const BlockView: React.FC<{
  block: LessonBlock;
  answer: string;
  readOnly: boolean;
  /** Kết quả chấm; chỉ có sau khi giáo viên đã chấm */
  result?: { isCorrect?: number | null; points?: number } | null;
  onChange: (v: string) => void;
}> = ({ block: b, answer, readOnly, result, onChange }) => {
  if (b.kind === 'text') {
    return (
      <div className={`${card} p-3.5`}>
        {b.title && (
          <h4 className="font-bold text-[clamp(14px,0.98vw,16.5px)] text-slate-900 mb-1">{b.title}</h4>
        )}
        <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-700 leading-relaxed whitespace-pre-wrap">
          {b.body}
        </p>
      </div>
    );
  }

  if (b.kind === 'image' || b.kind === 'file' || b.kind === 'video') {
    return (
      <div className={`${card} p-3.5`}>
        {b.title && (
          <h4 className="font-bold text-[clamp(14px,0.98vw,16.5px)] text-slate-900 mb-1">{b.title}</h4>
        )}
        {b.body && (
          <p className="mb-2 text-[clamp(13px,0.9vw,15.5px)] text-slate-600 whitespace-pre-wrap">{b.body}</p>
        )}
        {b.uploadId
          ? <UploadMedia uploadId={b.uploadId} />
          : b.linkUrl ? <VideoLink url={b.linkUrl} title={b.title} /> : null}
      </div>
    );
  }

  /* ---- Câu hỏi ---- */
  const dung = result?.isCorrect === 1;
  const sai = result?.isCorrect === 0;
  const ngo = result && result.isCorrect === null;

  return (
    <div className={`${card} p-3.5 ${dung ? 'border-emerald-300' : sai ? 'border-rose-300' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-[clamp(14px,0.98vw,16.5px)] text-slate-900">{b.title}</h4>
          {b.body && (
            <p className="mt-0.5 text-[clamp(12.5px,0.86vw,15px)] text-slate-600 whitespace-pre-wrap">{b.body}</p>
          )}
        </div>
        <span className="shrink-0 text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500">
          {result?.points !== undefined && result.points !== null
            ? `${result.points}/${b.points} điểm`
            : `${b.points} điểm`}
        </span>
      </div>

      {b.kind === 'mcq' && (
        <div className="mt-2.5 space-y-1.5">
          {(b.options ?? []).map((o) => {
            const chon = answer === o.id;
            const laDapAn = b.answerKey !== null && b.answerKey === o.id;
            return (
              <label key={o.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer
                  transition-colors ${
                  laDapAn ? 'border-emerald-400 bg-emerald-50'
                    : chon && sai ? 'border-rose-400 bg-rose-50'
                      : chon ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300'}`}>
                <input type="radio" name={`q-${b.id}`} value={o.id} checked={chon}
                  disabled={readOnly} onChange={() => onChange(o.id)}
                  className="w-4 h-4 accent-indigo-600" />
                <span className="min-w-0 text-[clamp(13px,0.9vw,15.5px)] text-slate-800">{o.text}</span>
                {laDapAn && <CheckCircle2 className="ml-auto w-4 h-4 shrink-0 text-emerald-600" />}
                {chon && sai && !laDapAn && <XCircle className="ml-auto w-4 h-4 shrink-0 text-rose-600" />}
              </label>
            );
          })}
        </div>
      )}

      {b.kind === 'short' && (
        <div className="mt-2.5">
          <input value={answer} disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`Trả lời: ${b.title}`}
            placeholder="Nhập câu trả lời của em"
            className={`w-full h-10 px-3 rounded-xl border bg-white text-slate-900
              text-[clamp(13px,0.9vw,15.5px)] outline-none transition-colors
              focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-70 ${
              dung ? 'border-emerald-400' : sai ? 'border-rose-400' : 'border-slate-300'}`} />
          {b.answerKey && (
            <p className="mt-1.5 text-[clamp(12.5px,0.86vw,15px)] text-slate-600">
              <span className="font-semibold text-emerald-800">Đáp án: </span>
              {b.answerKey.split('|').map((x) => x.trim()).filter(Boolean).join('  ·  ')}
            </p>
          )}
        </div>
      )}

      {ngo && (
        <p className="mt-2 flex items-start gap-1.5 text-[clamp(12px,0.82vw,14px)] text-amber-800">
          <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Câu này máy chưa chấm được, thầy cô sẽ xem và cho điểm.
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Màn hình                                                            */
/* ------------------------------------------------------------------ */

export const MyLessons: React.FC = () => {
  const [list, setList] = useState<MyLesson[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<LessonView | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [luu, setLuu] = useState<'idle' | 'saving' | 'saved'>('idle');
  const hen = useRef<number | null>(null);

  const load = useCallback(async () => {
    try { setList(await api.myLessons()); setError(null); } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setList([]);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const mo = async (id: string) => {
    setOpenId(id); setView(null); setNote(null); setError(null);
    try {
      const v = await api.viewLesson(id);
      setView(v);
      setAnswers(Object.fromEntries(v.answers.map((a) => [a.blockId, a.answer])));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  /* Lưu tạm sau khi ngừng gõ một nhịp, chứ không lưu mỗi lần bấm phím */
  const doiTraLoi = (blockId: string, v: string) => {
    setAnswers((p) => ({ ...p, [blockId]: v }));
    if (!openId) return;
    if (hen.current !== null) window.clearTimeout(hen.current);
    setLuu('saving');
    hen.current = window.setTimeout(() => {
      void api.saveLessonDraft(openId, { ...answers, [blockId]: v })
        .then(() => setLuu('saved'))
        .catch(() => setLuu('idle'));
    }, 800);
  };

  useEffect(() => () => { if (hen.current !== null) window.clearTimeout(hen.current); }, []);

  const nop = async () => {
    if (!openId || !view) return;
    const soCau = (view.blocks ?? []).filter((b) => b.kind === 'mcq' || b.kind === 'short').length;
    const daLam = (view.blocks ?? [])
      .filter((b) => b.kind === 'mcq' || b.kind === 'short')
      .filter((b) => String(answers[b.id] ?? '').trim()).length;
    if (daLam < soCau
      && !window.confirm(`Em mới trả lời ${daLam}/${soCau} câu. Vẫn nộp chứ?`)) return;

    setBusy(true); setError(null);
    try {
      const r = await api.submitLesson(openId, answers);
      /* Mở lại bài TRƯỚC rồi mới đặt lời báo: `mo` xoá lời báo cũ, đặt trước thì
         lời "đã nộp" biến mất ngay trước mắt người dùng. */
      await mo(openId);
      await load();
      setNote(`Đã nộp — ${r.score}/${r.maxScore} điểm${r.late ? ' (trễ hạn)' : ''}.`
        + (r.needsReview ? ' Có câu thầy cô sẽ xem và chấm thêm.' : ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };

  if (!list) return <p className="text-slate-500">Đang tải bài giảng…</p>;

  /* ---------- Đang mở một bài ---------- */
  if (openId && view) {
    const daCham = view.submission?.status === 'da_cham';
    const daNop = view.submission?.status === 'da_nop';
    const khoaLai = daCham || view.state === 'dong';
    const kq = new Map(view.answers.map((a) => [a.blockId, a]));

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { setOpenId(null); setView(null); }}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200
              bg-white text-slate-600 font-semibold text-[clamp(12.5px,0.86vw,15px)]
              hover:border-indigo-300 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Danh sách bài
          </button>
          {luu !== 'idle' && !khoaLai && (
            <span className="inline-flex items-center gap-1.5 text-[clamp(12px,0.82vw,14px)] text-slate-500">
              {luu === 'saving'
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> đang lưu…</>
                : <><Save className="w-3.5 h-3.5" /> đã lưu tạm</>}
            </span>
          )}
          {view.submission?.score !== null && view.submission?.score !== undefined && (
            <span className="ml-auto font-mono font-bold text-indigo-700
              text-[clamp(13px,0.9vw,15.5px)]">
              {view.submission.score}/{view.submission.maxScore ?? view.maxScore} điểm
            </span>
          )}
        </div>

        <div className={`${card} p-3.5`}>
          <h3 className="font-bold text-[clamp(15px,1.05vw,18px)] text-slate-900">{view.title}</h3>
          {view.description && (
            <p className="mt-1 text-[clamp(13px,0.9vw,15.5px)] text-slate-600">{view.description}</p>
          )}
          <p className={`mt-1.5 text-[clamp(12.5px,0.86vw,15px)] ${
            quaHan(view.dueAt) && !daCham ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
            Hạn nộp: {fmt(view.dueAt)}{quaHan(view.dueAt) && !daCham && ' · đã quá hạn'}
          </p>
          {view.submission?.teacherComment && (
            <p className="mt-2 rounded-lg border-l-[3px] border-l-indigo-500 border border-slate-200
              bg-slate-50 px-3 py-2 text-[clamp(12.5px,0.86vw,15px)] text-slate-700">
              <span className="font-semibold text-indigo-900">Nhận xét: </span>
              {view.submission.teacherComment}
            </p>
          )}
        </div>

        {note && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50
            px-3 py-2.5 text-[clamp(12.5px,0.86vw,15px)] text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /><span>{note}</span>
          </div>
        )}
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200
            bg-rose-50 px-3 py-2.5 text-[clamp(12.5px,0.86vw,15px)] text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
          </div>
        )}

        {(view.blocks ?? []).map((b) => (
          <BlockView key={b.id} block={b} readOnly={khoaLai}
            answer={answers[b.id] ?? ''}
            result={daCham ? kq.get(b.id) ?? null : null}
            onChange={(v) => doiTraLoi(b.id, v)} />
        ))}

        {!khoaLai && (
          <button onClick={() => void nop()} disabled={busy}
            className="h-11 px-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white
              font-bold text-[clamp(13px,0.9vw,15.5px)] hover:bg-indigo-700
              disabled:opacity-60 transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {daNop ? 'Nộp lại' : 'Nộp bài'}
          </button>
        )}
        {daCham && (
          <p className="text-[clamp(12.5px,0.86vw,15px)] text-slate-500">
            Bài đã chấm nên không sửa được nữa. Đáp án đúng hiện ở trên để em xem lại.
          </p>
        )}
      </div>
    );
  }

  /* ---------- Danh sách bài ---------- */
  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200
          bg-rose-50 px-3 py-2.5 text-[clamp(12.5px,0.86vw,15px)] text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {!list.length && (
        <div className={`${card} p-4`}>
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500">
            Lớp em chưa có bài giảng nào. Khi thầy cô giao, bài sẽ hiện ở đây.
          </p>
        </div>
      )}

      {list.map((l) => {
        const st = BADGE[l.status ?? 'chua_lam'] ?? BADGE.chua_lam;
        return (
          <button key={l.id} onClick={() => void mo(l.id)}
            className={`${card} w-full text-left p-3.5 hover:border-indigo-300 transition-colors`}>
            <div className="flex flex-wrap items-start gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-[clamp(14px,0.98vw,16.5px)] text-slate-900">{l.title}</h4>
                {l.description && (
                  <p className="mt-0.5 text-[clamp(12.5px,0.86vw,15px)] text-slate-600">{l.description}</p>
                )}
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded
                font-semibold text-[clamp(11.5px,0.78vw,13.5px)] ${st.cls}`}>
                <st.Icon className="w-3 h-3" /> {st.text}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1
              text-[clamp(12.5px,0.86vw,15px)]">
              <span className={quaHan(l.dueAt) && l.status !== 'da_cham'
                ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                Hạn nộp: {fmt(l.dueAt)}
              </span>
              <span className="text-slate-500">{l.blockCount} phần</span>
              {l.score !== null && l.score !== undefined && (
                <span className="font-mono font-bold text-indigo-700">
                  {l.score}/{l.maxScore} điểm
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
