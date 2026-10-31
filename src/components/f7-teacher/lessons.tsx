/**
 * Soạn và giao bài giảng tự do.
 *
 * Giáo viên ghép bài từ các KHỐI xếp theo thứ tự: đoạn giảng, hình, video, tệp
 * đính kèm, câu trắc nghiệm, câu trả lời ngắn. Soạn xong bấm giao cho lớp.
 *
 * Bài mới luôn ở trạng thái nháp và học sinh chưa thấy, để thầy cô soạn dở vài
 * hôm cũng không sao. Chỉ khi bấm "Giao cho lớp" thì bài mới hiện ra.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Plus, Trash2, Loader2, AlertCircle, Send, Lock, LockOpen, ChevronUp, ChevronDown,
  Type, Image as ImageIcon, Video, Paperclip, ListChecks, PenLine, Upload,
  BookOpen, Users, CheckCircle2, Clock, CircleDashed, RotateCcw, ScanText,
} from 'lucide-react';
import { api } from '../../api/client';
import type { Lesson, LessonBlock, BlockKind, LessonBoardRow } from '../../api/client';
import { UploadMedia, VideoLink } from '../common/upload-media';

const card = 'rounded-xl border border-slate-200 bg-white';
const field = `w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-900
  text-[clamp(13px,0.9vw,15.5px)] outline-none transition-colors
  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60`;
const area = `w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900
  text-[clamp(13px,0.9vw,15.5px)] outline-none resize-y transition-colors
  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200`;
const label = 'block text-[clamp(12.5px,0.86vw,15px)] font-semibold text-slate-600 mb-1';

const LOAI_KHOI: { kind: BlockKind; text: string; Icon: typeof Type }[] = [
  { kind: 'text', text: 'Đoạn giảng', Icon: Type },
  { kind: 'image', text: 'Hình ảnh', Icon: ImageIcon },
  { kind: 'video', text: 'Video', Icon: Video },
  { kind: 'file', text: 'Tệp đính kèm', Icon: Paperclip },
  { kind: 'mcq', text: 'Trắc nghiệm', Icon: ListChecks },
  { kind: 'mcqimg', text: 'Trắc nghiệm theo ảnh đề', Icon: ScanText },
  { kind: 'short', text: 'Trả lời ngắn', Icon: PenLine },
];

/** Khối ảnh đề: đề nằm trong ảnh nên không có chữ câu hỏi lẫn chữ phương án */
const LA_ANH_DE = (k: BlockKind) => k === 'mcqimg';

/**
 * Tách danh sách đáp án của khối ảnh đề: `"C,A,,D"` thành `['C','A','','D']`.
 * Ô trống là câu đã thêm nhưng chưa chọn đáp án. Phải khớp với `tachDapAn`
 * bên máy chủ — hai bên cùng đọc đúng một chuỗi.
 */
const tachDapAn = (s: string | null | undefined): string[] =>
  String(s ?? '').split(',').map((x) => x.trim().toUpperCase());

const TRANG_THAI: Record<string, { text: string; cls: string; Icon: typeof Clock }> = {
  chua_lam: { text: 'Chưa làm', cls: 'bg-slate-100 text-slate-500', Icon: CircleDashed },
  dang_lam: { text: 'Đang làm', cls: 'bg-amber-100 text-amber-800', Icon: Clock },
  da_nop: { text: 'Đã nộp', cls: 'bg-sky-100 text-sky-800', Icon: BookOpen },
  da_cham: { text: 'Đã chấm', cls: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 },
};

const fmt = (iso: string | null) => {
  if (!iso) return 'không đặt hạn';
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? iso
    : d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/* ------------------------------------------------------------------ */
/* Nút tải tệp lên                                                     */
/* ------------------------------------------------------------------ */

const UploadButton: React.FC<{
  accept: string; classId: string; onDone: (id: string) => void; onError: (s: string) => void;
}> = ({ accept, classId, onDone, onError }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <input ref={input} type="file" accept={accept} className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          /* Xoá giá trị ngay để chọn lại đúng tệp vừa rồi vẫn kích hoạt sự kiện */
          e.target.value = '';
          if (!f) return;
          setBusy(true);
          try { onDone((await api.uploadFile(f, classId)).id); } catch (err) {
            onError(err instanceof Error ? err.message : String(err));
          } finally { setBusy(false); }
        }} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()}
        className="h-10 px-3.5 inline-flex items-center gap-2 rounded-xl border border-slate-300
          bg-white text-slate-700 font-semibold text-[clamp(12.5px,0.86vw,15px)]
          hover:border-indigo-400 disabled:opacity-60 transition-colors">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {busy ? 'Đang tải lên…' : 'Chọn tệp'}
      </button>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Một khối nội dung                                                   */
/* ------------------------------------------------------------------ */

const BlockEditor: React.FC<{
  block: LessonBlock; classId: string; first: boolean; last: boolean;
  onSave: (p: Partial<LessonBlock>) => void;
  onDelete: () => void;
  onMove: (huong: -1 | 1) => void;
  onError: (s: string) => void;
}> = ({ block, classId, first, last, onSave, onDelete, onMove, onError }) => {
  const [b, setB] = useState(block);
  useEffect(() => setB(block), [block]);
  const doi = (p: Partial<LessonBlock>) => setB((v) => ({ ...v, ...p }));

  const meta = LOAI_KHOI.find((l) => l.kind === b.kind)!;
  const laHoi = b.kind === 'mcq' || b.kind === 'mcqimg' || b.kind === 'short';

  return (
    <div className={`${card} p-3.5`}>
      <div className="flex flex-wrap items-center gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100
          text-slate-700 font-semibold text-[clamp(11.5px,0.78vw,13.5px)]">
          <meta.Icon className="w-3.5 h-3.5" /> {meta.text}
        </span>
        {laHoi && (
          <span className="text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500">
            {b.points} điểm
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={first} aria-label="Chuyển lên trên"
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg border
              border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMove(1)} disabled={last} aria-label="Chuyển xuống dưới"
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg border
              border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} aria-label="Xoá khối này"
            className="h-7 w-7 inline-flex items-center justify-center rounded-lg border
              border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <div>
          <label className={label} htmlFor={`t-${b.id}`}>
            {LA_ANH_DE(b.kind) ? 'Nhãn câu (không bắt buộc)' : laHoi ? 'Câu hỏi' : 'Tiêu đề'}
          </label>
          <input id={`t-${b.id}`} className={field} value={b.title}
            onChange={(e) => doi({ title: e.target.value })}
            onBlur={() => onSave({ title: b.title })}
            placeholder={LA_ANH_DE(b.kind) ? 'Câu 3'
              : laHoi ? 'Đơn vị của điện trở là gì?' : 'Mở đầu'} />
        </div>

        {(b.kind === 'text' || b.kind === 'image' || b.kind === 'video' || b.kind === 'file') && (
          <div>
            <label className={label} htmlFor={`b-${b.id}`}>
              {b.kind === 'text' ? 'Nội dung' : 'Lời dẫn (không bắt buộc)'}
            </label>
            <textarea id={`b-${b.id}`} className={area} rows={b.kind === 'text' ? 4 : 2}
              value={b.body} onChange={(e) => doi({ body: e.target.value })}
              onBlur={() => onSave({ body: b.body })} />
          </div>
        )}

        {(b.kind === 'image' || b.kind === 'file' || b.kind === 'video' || b.kind === 'mcqimg') && (
          <div className="space-y-2">
            {LA_ANH_DE(b.kind) && <span className={label}>Ảnh đề — chụp hoặc quét câu hỏi trong sách</span>}
            {b.uploadId
              ? (
                <div className="flex flex-wrap items-start gap-2">
                  <div className="max-w-sm"><UploadMedia uploadId={b.uploadId} /></div>
                  <button onClick={() => { doi({ uploadId: null }); onSave({ uploadId: null }); }}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-600
                      text-[clamp(12px,0.82vw,14px)] hover:border-rose-300 hover:text-rose-700 transition-colors">
                    {LA_ANH_DE(b.kind) ? 'Đổi ảnh' : 'Bỏ tệp'}
                  </button>
                </div>
              )
              : (
                <UploadButton classId={classId} onError={onError}
                  accept={b.kind === 'image' || b.kind === 'mcqimg' ? 'image/*'
                    : b.kind === 'video' ? 'video/*' : undefined as never}
                  onDone={(id) => { doi({ uploadId: id }); onSave({ uploadId: id }); }} />
              )}

            {b.kind === 'video' && !b.uploadId && (
              <div>
                <label className={label} htmlFor={`l-${b.id}`}>Hoặc dán liên kết YouTube</label>
                <input id={`l-${b.id}`} className={field} value={b.linkUrl ?? ''}
                  onChange={(e) => doi({ linkUrl: e.target.value })}
                  onBlur={() => onSave({ linkUrl: b.linkUrl ?? '' })}
                  placeholder="https://www.youtube.com/watch?v=..." />
                <p className="mt-1 text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500">
                  Video dài nên dán liên kết thay vì tải lên — tệp tải lên tối đa 25 MB.
                </p>
              </div>
            )}
          </div>
        )}

        {b.kind === 'mcq' && (
          <div>
            <span className={label}>Phương án — bấm vòng tròn để chọn đáp án đúng</span>
            <div className="space-y-1.5">
              {(b.options ?? []).map((o, i) => (
                <div key={o.id} className="flex items-center gap-2">
                  <button type="button" aria-label={`Chọn phương án ${o.id} là đáp án đúng`}
                    aria-pressed={b.answerKey === o.id}
                    onClick={() => { doi({ answerKey: o.id }); onSave({ answerKey: o.id }); }}
                    className={`w-5 h-5 shrink-0 rounded-full border-2 grid place-items-center
                      transition-colors ${b.answerKey === o.id ? 'border-emerald-600' : 'border-slate-300'}`}>
                    {b.answerKey === o.id && <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                  </button>
                  <input className={field} value={o.text}
                    onChange={(e) => {
                      const ds = [...(b.options ?? [])];
                      ds[i] = { ...o, text: e.target.value };
                      doi({ options: ds });
                    }}
                    onBlur={() => onSave({ options: b.options })}
                    placeholder={`Phương án ${o.id.toUpperCase()}`} />
                  {(b.options?.length ?? 0) > 2 && (
                    <button aria-label={`Xoá phương án ${o.id}`}
                      onClick={() => {
                        const ds = (b.options ?? []).filter((x) => x.id !== o.id);
                        doi({ options: ds });
                        onSave({ options: ds, answerKey: b.answerKey === o.id ? ds[0]?.id : b.answerKey });
                      }}
                      className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg
                        border border-slate-200 text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button"
              onClick={() => {
                const ds = [...(b.options ?? [])];
                /* Mã phương án đi theo chữ cái: a, b, c… cho khớp cách gọi trong lớp */
                const ma = String.fromCharCode(97 + ds.length);
                ds.push({ id: ma, text: '' });
                doi({ options: ds });
              }}
              className="mt-2 h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border
                border-dashed border-slate-300 text-slate-600 text-[clamp(12px,0.82vw,14px)]
                hover:border-indigo-400 hover:text-indigo-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Thêm phương án
            </button>
          </div>
        )}

        {b.kind === 'mcqimg' && (() => {
          const dap = tachDapAn(b.answerKey);
          const nhieu = dap.length > 1;
          const luu = (ds: string[]) => {
            const s = ds.join(',');
            doi({ answerKey: s });
            onSave({ answerKey: s, subCount: ds.length });
          };
          return (
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-1.5">
                <span className={`${label} mb-0`}>
                  {nhieu ? 'Đáp án từng câu trong ảnh' : 'Đáp án đúng — bấm đúng chữ cái ghi trong đề'}
                </span>
                <label className="flex items-center gap-2 text-[clamp(12px,0.82vw,14px)] text-slate-600">
                  Số phương án mỗi câu
                  <select className={`${field} w-16 px-2`} value={(b.options ?? []).length || 4}
                    onChange={(e) => onSave({ choiceCount: Number(e.target.value) })}>
                    {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              </div>

              <div className="space-y-1.5">
                {dap.map((chon, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    {nhieu && (
                      <span className="w-14 shrink-0 font-semibold text-slate-500
                        text-[clamp(12px,0.82vw,14px)]">Câu {i + 1}</span>
                    )}
                    {(b.options ?? []).map((o) => {
                      const dangChon = chon === o.id;
                      return (
                        <button key={o.id} type="button" aria-pressed={dangChon}
                          aria-label={nhieu
                            ? `Câu ${i + 1}: đáp án đúng là ${o.id}`
                            : `Đáp án đúng là ${o.id}`}
                          onClick={() => {
                            const ds = [...dap];
                            /* Bấm lại đúng chữ đang chọn thì bỏ chọn — chọn nhầm
                               mà không gỡ ra được thì chỉ còn cách xoá cả câu. */
                            ds[i] = dangChon ? '' : o.id;
                            luu(ds);
                          }}
                          className={`w-11 h-11 rounded-xl border-2 font-extrabold
                            text-[clamp(15px,1vw,18px)] transition-colors ${dangChon
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                              : 'border-slate-300 bg-white text-slate-600 hover:border-indigo-400'}`}>
                          {o.id}
                        </button>
                      );
                    })}
                    {nhieu && (
                      <button type="button" aria-label={`Xoá câu ${i + 1}`}
                        onClick={() => luu(dap.filter((_, k) => k !== i))}
                        className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg
                          border border-slate-200 text-slate-400 hover:text-rose-600
                          hover:border-rose-300 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => luu([...dap, ''])}
                disabled={dap.length >= 30}
                className="mt-2 h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border
                  border-dashed border-slate-300 text-slate-600 text-[clamp(12px,0.82vw,14px)]
                  hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-40 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Thêm câu trong ảnh này
              </button>

              <p className="mt-1.5 text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500">
                Thầy cô không phải gõ lại đề hay các phương án — học sinh đọc đề trong ảnh rồi
                bấm chọn chữ cái. Máy chấm hẳn đúng sai theo chữ cái này.
                {nhieu
                  ? ` Ảnh này có ${dap.length} câu; điểm ghi bên dưới là điểm của cả khối,
                      chia đều cho từng câu.`
                  : ' Một ảnh chứa nhiều câu thì bấm "Thêm câu trong ảnh này".'}
              </p>
            </div>
          );
        })()}

        {b.kind === 'short' && (
          <div>
            <label className={label} htmlFor={`a-${b.id}`}>Đáp án mẫu</label>
            <input id={`a-${b.id}`} className={field} value={b.answerKey ?? ''}
              onChange={(e) => doi({ answerKey: e.target.value })}
              onBlur={() => onSave({ answerKey: b.answerKey })}
              placeholder="I = U/R | U/R" />
            <p className="mt-1 text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500">
              Nhiều cách viết đúng thì ngăn bằng dấu <span className="font-mono">|</span>.
              Máy bỏ qua hoa thường và khoảng trắng thừa. Em nào trả lời khác hẳn thì máy
              để ngỏ cho thầy cô chấm tay chứ không tự cho sai.
            </p>
          </div>
        )}

        {laHoi && (
          <div className="w-28">
            <label className={label} htmlFor={`p-${b.id}`}>
              {b.kind === 'mcqimg' && tachDapAn(b.answerKey).length > 1 ? 'Điểm cả khối' : 'Điểm'}
            </label>
            <input id={`p-${b.id}`} type="number" min="0.5" max="100" step="0.5" className={field}
              value={b.points} onChange={(e) => doi({ points: Number(e.target.value) })}
              onBlur={() => onSave({ points: b.points })} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Màn hình chính                                                      */
/* ------------------------------------------------------------------ */

export const LessonManager: React.FC<{ classId?: string | null; onChanged?: () => void }> = ({
  classId, onChanged,
}) => {
  const [list, setList] = useState<Lesson[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [board, setBoard] = useState<{ lesson: Lesson; rows: LessonBoardRow[] } | null>(null);
  const [tab, setTab] = useState<'soan' | 'theodoi'>('soan');
  const [error, setError] = useState<string | null>(null);
  const [tieuDe, setTieuDe] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setList(await api.lessons(classId ?? undefined)); } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [classId]);
  useEffect(() => { void load(); }, [load]);

  const moBai = useCallback(async (id: string) => {
    setOpenId(id); setLesson(null); setBoard(null);
    try { setLesson(await api.lesson(id)); } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    if (tab !== 'theodoi' || !openId) return;
    api.lessonBoard(openId).then(setBoard).catch((e) => setError(e.message));
  }, [tab, openId, lesson]);

  const chay = async (fn: () => Promise<Lesson | unknown>) => {
    setError(null);
    try {
      const kq = await fn();
      if (kq && typeof kq === 'object' && 'blocks' in (kq as Lesson)) setLesson(kq as Lesson);
      await load();
      onChanged?.();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const taoBai = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tieuDe.trim()) return;
    setBusy(true); setError(null);
    try {
      const l = await api.createLesson({ classId: classId ?? undefined, title: tieuDe.trim() });
      setTieuDe('');
      await load();
      await moBai(l.id);
      setTab('soan');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  };

  const themKhoi = (kind: BlockKind) => {
    if (!lesson) return;
    const mau: Record<string, Partial<LessonBlock>> = {
      mcq: { title: '', points: 1, options: [{ id: 'a', text: '' }, { id: 'b', text: '' }], answerKey: 'a' },
      /* Ảnh đề thì để trống đáp án: thầy cô phải nhìn ảnh mới biết đáp án nào
         đúng, điền sẵn một chữ cái là mời chọn nhầm. Máy chủ chỉ đòi đủ lúc giao bài. */
      mcqimg: { title: '', points: 1, choiceCount: 4 },
      short: { title: '', points: 1, answerKey: '' },
    };
    /* Khối trắc nghiệm và trả lời ngắn phải có sẵn phương án và đáp án tạm, vì
       máy chủ từ chối câu hỏi chưa đủ — tạo rỗng là báo lỗi ngay khi vừa bấm. */
    void chay(() => api.addBlock(lesson.id, { kind, ...(mau[kind] ?? {}) } as never));
  };

  const doiCho = (i: number, huong: -1 | 1) => {
    if (!lesson?.blocks) return;
    const ds = [...lesson.blocks];
    const j = i + huong;
    if (j < 0 || j >= ds.length) return;
    [ds[i], ds[j]] = [ds[j], ds[i]];
    setLesson({ ...lesson, blocks: ds });
    void chay(() => api.reorderBlocks(lesson.id, ds.map((b) => b.id)));
  };

  const cham = async (userId: string, diem: number | null) => {
    if (!openId) return;
    await chay(() => api.gradeLesson(openId, userId, { score: diem }));
    setBoard(await api.lessonBoard(openId));
  };

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200
          bg-rose-50 px-3 py-2.5 text-[clamp(12.5px,0.86vw,15px)] text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span className="min-w-0">{error}</span>
        </div>
      )}

      <form onSubmit={taoBai} className={`${card} p-3.5 flex flex-wrap items-end gap-2.5`}>
        <div className="min-w-0 flex-1">
          <label className={label} htmlFor="bg-title">Tên bài giảng mới</label>
          <input id="bg-title" className={field} value={tieuDe} disabled={busy} required
            onChange={(e) => setTieuDe(e.target.value)}
            placeholder="Bài giảng về định luật Ohm" />
        </div>
        <button type="submit" disabled={busy}
          className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white
            font-bold text-[clamp(13px,0.9vw,15.5px)] hover:bg-indigo-700
            disabled:opacity-60 transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Soạn bài mới
        </button>
      </form>

      {list && !list.length && (
        <div className={`${card} p-4`}>
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500">
            Chưa có bài giảng nào. Soạn bài đầu tiên ở khung trên — ghép đoạn giảng,
            hình, video và câu hỏi theo ý mình.
          </p>
        </div>
      )}

      {list && list.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-3">
          <div className={`${card} p-2 max-h-[34rem] overflow-y-auto ml-scroll`}>
            {list.map((l) => (
              <button key={l.id} onClick={() => void moBai(l.id)} aria-pressed={openId === l.id}
                className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors ${
                  openId === l.id ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                <span className="block font-semibold text-[clamp(12.5px,0.86vw,15px)] truncate">
                  {l.title}
                </span>
                <span className="block text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500">
                  {l.state === 'nhap' ? 'Nháp' : l.state === 'dong' ? 'Đã đóng' : 'Đang giao'}
                  {' · '}{l.blockCount} khối
                  {l.state !== 'nhap' && ` · ${l.submittedCount}/${l.classSize} nộp`}
                </span>
              </button>
            ))}
          </div>

          <div className="min-w-0 space-y-3">
            {!lesson && openId && <p className="text-slate-500">Đang mở bài giảng…</p>}

            {lesson && (
              <>
                <div className={`${card} p-3.5`}>
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <input className={`${field} font-bold`} value={lesson.title}
                        onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                        onBlur={() => void chay(() => api.updateLesson(lesson.id, { title: lesson.title }))}
                        aria-label="Tên bài giảng" />
                    </div>
                    <button
                      onClick={() => void chay(() => api.updateLesson(lesson.id,
                        { state: lesson.state === 'mo' ? 'dong' : 'mo' }))}
                      className={`h-10 px-3.5 inline-flex items-center gap-1.5 rounded-xl border
                        font-semibold text-[clamp(12.5px,0.86vw,15px)] transition-colors ${
                        lesson.state === 'mo'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                      {lesson.state === 'mo'
                        ? <><LockOpen className="w-4 h-4" /> Đang giao</>
                        : <><Send className="w-4 h-4" /> Giao cho lớp</>}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Xoá bài giảng "${lesson.title}"? Bài học sinh đã nộp cũng mất theo.`)) {
                          void chay(() => api.deleteLesson(lesson.id)).then(() => {
                            setLesson(null); setOpenId(null);
                          });
                        }
                      }}
                      aria-label="Xoá bài giảng"
                      className="h-10 w-10 inline-flex items-center justify-center rounded-xl border
                        border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className={label} htmlFor="bg-desc">Lời dẫn</label>
                      <input id="bg-desc" className={field} value={lesson.description}
                        onChange={(e) => setLesson({ ...lesson, description: e.target.value })}
                        onBlur={() => void chay(() => api.updateLesson(lesson.id, { description: lesson.description }))}
                        placeholder="Xem video rồi trả lời các câu hỏi bên dưới" />
                    </div>
                    <div>
                      <label className={label} htmlFor="bg-due">Hạn nộp</label>
                      <input id="bg-due" type="datetime-local" className={field}
                        value={lesson.dueAt ? String(lesson.dueAt).slice(0, 16).replace(' ', 'T') : ''}
                        onChange={(e) => setLesson({ ...lesson, dueAt: e.target.value })}
                        onBlur={() => void chay(() => api.updateLesson(lesson.id,
                          { dueAt: lesson.dueAt ? new Date(lesson.dueAt).toISOString() : null }))} />
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {([['soan', 'Soạn nội dung'], ['theodoi', 'Bài học sinh nộp']] as const).map(([id, text]) => (
                      <button key={id} onClick={() => setTab(id)} aria-pressed={tab === id}
                        className={`h-8 px-3 rounded-lg border font-medium
                          text-[clamp(12.5px,0.86vw,15px)] transition-colors ${
                          tab === id ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'}`}>
                        {text}
                      </button>
                    ))}
                    <span className="ml-auto self-center text-[clamp(12px,0.82vw,14px)] text-slate-500">
                      {lesson.maxScore ? `Tổng ${lesson.maxScore} điểm · ` : ''}hạn {fmt(lesson.dueAt)}
                    </span>
                  </div>
                </div>

                {tab === 'soan' && (
                  <>
                    {(lesson.blocks ?? []).map((b, i) => (
                      <BlockEditor key={b.id} block={b} classId={lesson.classId}
                        first={i === 0} last={i === (lesson.blocks?.length ?? 0) - 1}
                        onError={setError}
                        onSave={(p) => void chay(() => api.updateBlock(lesson.id, b.id, p))}
                        onDelete={() => void chay(() => api.deleteBlock(lesson.id, b.id))}
                        onMove={(h) => doiCho(i, h)} />
                    ))}

                    <div className={`${card} p-3`}>
                      <p className="mb-2 text-[clamp(12.5px,0.86vw,15px)] font-semibold text-slate-600">
                        Thêm khối nội dung
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {LOAI_KHOI.map(({ kind, text, Icon }) => (
                          <button key={kind} onClick={() => themKhoi(kind)}
                            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border
                              border-slate-200 bg-white text-slate-700 font-medium
                              text-[clamp(12.5px,0.86vw,15px)] hover:border-indigo-400
                              hover:text-indigo-700 transition-colors">
                            <Icon className="w-4 h-4" /> {text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {tab === 'theodoi' && (
                  <div className={card}>
                    {!board && <p className="p-3.5 text-slate-500">Đang tải…</p>}
                    {board && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[clamp(12.5px,0.86vw,15px)]">
                          <thead className="bg-slate-100 text-slate-600 font-bold
                            text-[clamp(11.5px,0.78vw,13.5px)] uppercase">
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
                                  <td className="px-2.5 py-2 font-semibold text-slate-800">
                                    {r.seatNo !== null && (
                                      <span className="mr-1.5 font-mono font-normal text-slate-400">{r.seatNo}</span>
                                    )}{r.name}
                                  </td>
                                  <td className="px-2.5 py-2 text-slate-500">{r.team}</td>
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
                                    {r.score ?? '—'}{r.maxScore ? `/${r.maxScore}` : ''}
                                  </td>
                                  <td className="px-2.5 py-2 text-right whitespace-nowrap">
                                    <input type="number" min="0" step="0.5" defaultValue={r.score ?? ''}
                                      aria-label={`Điểm của ${r.name}`}
                                      onBlur={(e) => {
                                        const v = e.target.value === '' ? null : Number(e.target.value);
                                        if (v !== r.score) void cham(r.userId, v);
                                      }}
                                      className="w-16 h-8 px-2 rounded-lg border border-slate-300 text-center
                                        font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                                    {r.status === 'da_cham' && (
                                      <button aria-label={`Trả bài cho ${r.name} làm lại`} title="Trả lại để làm lại"
                                        onClick={() => void chay(() => api.reopenLesson(openId!, r.userId))}
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
