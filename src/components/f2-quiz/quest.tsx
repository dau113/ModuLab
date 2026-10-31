/**
 * F8 — Trò chơi: "Physics Quest — Electric City", bản nhập vai cho học sinh
 * muốn ôn tập theo kiểu chơi game.
 *
 * Trò chơi được viết bằng HTML/CSS/JS thuần nên chạy trong khung nhúng riêng.
 * Ứng dụng truyền ngân hàng 75 câu hỏi vào trước khi trò chơi khởi động, và
 * nhận lại kết quả qua postMessage để ghi vào sổ điểm.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Rocket, Trophy, Shuffle, Info, ZoomIn, ZoomOut, Maximize2, Expand, Minimize2,
} from 'lucide-react';
import { QUIZ_BANK, QUIZ_TOPICS } from '../../data/quizBank';
import { NEEDS_ART } from './art';
import type { QuizQuestion, UserRole } from '../../types';
import gameHtml from './game.html?raw';

interface PhysicsQuestProps {
  userRole: UserRole;
  /** `score` là điểm trò chơi, `correct` là số câu đúng dùng để chấm bài */
  onFinishQuiz?: (score: number, total: number, correct: number) => void;
  /** Câu hỏi giáo viên bổ sung, ghép thêm vào ngân hàng */
  extraQuestions?: QuizQuestion[];
}

/** Dạng câu hỏi mà trò chơi cần */
interface QuestQuestion {
  zone: string;
  enemy: string;
  boss: boolean;
  type: 'mcq';
  q: string;
  options: string[];
  answer: number;
  hint: string[];
  explain: string;
}

const LABELS = ['A. ', 'B. ', 'C. ', 'D. '];

/** Chuyển một câu hỏi của ModuLab sang dạng trò chơi dùng */
const toQuest = (q: QuizQuestion & { topic?: string }): QuestQuestion => {
  const topic = QUIZ_TOPICS.find((t) => t.id === q.topic);
  const answer = Math.max(0, q.options.findIndex((o) => o.isCorrect));
  return {
    zone: topic?.name ?? 'Điện học',
    enemy: 'Volt Slime',
    boss: false,
    type: 'mcq',
    q: q.question,
    options: q.options.slice(0, 4).map((o, i) => LABELS[i] + o.text),
    answer,
    hint: [
      `Câu này thuộc chủ đề ${topic?.name ?? 'điện học'} — xem lại phần Tài liệu nếu cần.`,
      'Loại trừ dần những phương án sai đơn vị hoặc sai bậc độ lớn trước.',
    ],
    explain: q.explanation,
  };
};

/* Mỗi lượt chia cho ba chương, mỗi chương ít nhất 2 câu */
const ROUND_SIZES = [6, 9, 12];

/**
 * Khổ gốc của trò chơi — kích thước mà nó được vẽ cho.
 *
 * Trò chơi co giãn theo bề ngang nhưng hình vẽ bên trong thì cố định: sân khấu
 * cao tối thiểu 430px, nhân vật 150×180, chưa kể thanh trạng thái và khay đáp
 * án. Cộng lại cần khoảng chừng này. Màn hình laptop 1280×800 chỉ chừa cho
 * khung trò chơi 1007×439, tức là thiếu gần 300px chiều cao — học sinh phải
 * cuộn trong khung mới thấy hết, mà đang chơi thì không ai nghĩ tới việc cuộn.
 *
 * Nên trò chơi luôn được vẽ ở đúng khổ này rồi PHÓNG TO THU NHỎ cả khối cho
 * vừa chỗ trống, thay vì để nó tự co giãn rồi vỡ bố cục.
 */
const KHO_GOC = { w: 1150, h: 790 };
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;
const ZOOM_BUOC = 0.1;
const KHOA_LUU = 'modulab.quest.zoom';

const kep = (v: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v));

/** Mức phóng đã lưu lần trước; `null` nghĩa là để tự vừa khung */
const docMucLuu = (): number | null => {
  try {
    const v = window.localStorage.getItem(KHOA_LUU);
    if (!v || v === 'auto') return null;
    const n = Number(v);
    return Number.isFinite(n) ? kep(n) : null;
  } catch {
    /* Trình duyệt chặn lưu trữ (cửa sổ ẩn danh…) thì coi như chưa chọn gì */
    return null;
  }
};

/** Cụm nút chỉnh cỡ hình. Dùng ở hai chỗ: thanh trên và lớp phủ toàn màn hình. */
const NutCoHinh: React.FC<{
  muc: number;
  tuDong: boolean;
  datMuc: (v: number | null) => void;
  toanManHinh: boolean;
  doiToanManHinh: () => void;
  toi?: boolean;
}> = ({ muc, tuDong, datMuc, toanManHinh, doiToanManHinh, toi = false }) => {
  /* Trên nền tối của lớp phủ thì dùng màu chữ sáng, vì lớp phủ nằm ngoài thẻ
     trắng nên không thừa hưởng màu nền của nó. */
  const vien = toi ? 'border-white/25' : 'border-slate-200';
  const chu = toi ? 'text-white/80 hover:bg-white/15' : 'text-slate-500 hover:bg-slate-50';

  return (
    <div className="flex items-center gap-2">
      {!toi && <span className="text-[12.5px] font-bold text-slate-500 uppercase">Cỡ hình</span>}
      <div className={`flex items-center rounded-lg border overflow-hidden ${vien}`}>
        <button type="button" aria-label="Thu nhỏ trò chơi"
          disabled={muc <= ZOOM_MIN + 1e-6}
          onClick={() => datMuc(kep(muc - ZOOM_BUOC))}
          className={`h-9 w-9 grid place-items-center disabled:opacity-30 transition-colors ${chu}`}>
          <ZoomOut className="w-4 h-4" />
        </button>
        <span aria-live="polite"
          className={`h-9 min-w-[3.6rem] px-1 grid place-items-center font-mono font-bold
            text-[clamp(12.5px,0.86vw,15px)] tabular-nums border-x ${vien}
            ${toi ? 'text-white' : 'text-indigo-700'}`}>
          {Math.round(muc * 100)}%
        </span>
        <button type="button" aria-label="Phóng to trò chơi"
          disabled={muc >= ZOOM_MAX - 1e-6}
          onClick={() => datMuc(kep(muc + ZOOM_BUOC))}
          className={`h-9 w-9 grid place-items-center disabled:opacity-30 transition-colors ${chu}`}>
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      <button type="button" onClick={() => datMuc(null)} aria-pressed={tuDong}
        title="Tự chọn cỡ cho vừa khung màn hình"
        className={`h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg border
          text-[clamp(12.5px,0.86vw,15px)] font-bold transition-colors ${
          tuDong
            ? 'border-indigo-600 bg-indigo-600 text-white'
            : `${vien} ${chu}`}`}>
        <Maximize2 className="w-3.5 h-3.5" /> Vừa khung
      </button>

      <button type="button" onClick={doiToanManHinh}
        aria-pressed={toanManHinh}
        aria-label={toanManHinh ? 'Thoát toàn màn hình' : 'Xem toàn màn hình'}
        title={toanManHinh ? 'Thoát toàn màn hình (Esc)' : 'Xem toàn màn hình'}
        className={`h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg border
          text-[clamp(12.5px,0.86vw,15px)] font-bold transition-colors ${vien} ${chu}`}>
        {toanManHinh
          ? <><Minimize2 className="w-3.5 h-3.5" /> Thu lại</>
          : <><Expand className="w-3.5 h-3.5" /> Toàn màn hình</>}
      </button>
    </div>
  );
};

export const PhysicsQuest: React.FC<PhysicsQuestProps> = ({ userRole, onFinishQuiz, extraQuestions }) => {
  const [roundSize, setRoundSize] = useState(6);
  const [topic, setTopic] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [lastResult, setLastResult] = useState<{ correct: number; total: number; won: boolean } | null>(null);
  const finishRef = useRef(onFinishQuiz);
  finishRef.current = onFinishQuiz;

  /* `null` = tự vừa khung; một con số = học sinh tự chọn mức phóng */
  const [mucTuChon, setMucTuChon] = useState<number | null>(docMucLuu);
  const [toanManHinh, setToanManHinh] = useState(false);
  const khungRef = useRef<HTMLDivElement>(null);
  const [khung, setKhung] = useState({ w: 0, h: 0 });

  /*
   * Đo chỗ trống dành cho trò chơi, đo lại mỗi khi cửa sổ đổi kích thước.
   *
   * Phải đo Ô NỘI DUNG, đừng lấy clientWidth/clientHeight: hai số đó tính cả
   * phần đệm, nên ở chế độ toàn màn hình (có đệm 12px mỗi bên) mức phóng tính
   * ra lớn hơn chỗ thật 24px và trò chơi thò ra ngoài đúng bằng chừng ấy.
   */
  useEffect(() => {
    const el = khungRef.current;
    if (!el) return undefined;
    const doBangTay = () => {
      const cs = window.getComputedStyle(el);
      const ngang = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const doc = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      setKhung({ w: el.clientWidth - ngang, h: el.clientHeight - doc });
    };
    doBangTay();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', doBangTay);
      return () => window.removeEventListener('resize', doBangTay);
    }
    const ro = new ResizeObserver(([e]) => {
      /* contentRect đã là ô nội dung, không gồm phần đệm */
      const r = e.contentRect;
      setKhung({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Mức vừa khung: thu cả khối trò chơi cho lọt chỗ trống, không cắt mất gì */
  const mucVuaKhung = khung.w > 0 && khung.h > 0
    ? kep(Math.min(khung.w / KHO_GOC.w, khung.h / KHO_GOC.h))
    : 1;
  const muc = mucTuChon ?? mucVuaKhung;

  const datMuc = useCallback((v: number | null) => {
    setMucTuChon(v);
    try {
      window.localStorage.setItem(KHOA_LUU, v === null ? 'auto' : String(v));
    } catch { /* không lưu được thì thôi, lần sau chọn lại */ }
  }, []);

  /* Esc để thoát toàn màn hình — phản xạ quen thuộc, không cần dạy */
  useEffect(() => {
    if (!toanManHinh) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setToanManHinh(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toanManHinh]);

  /* Ngân hàng câu hỏi cho lượt chơi hiện tại */
  const bank = useMemo(() => {
    /* Câu cần xem hình linh kiện chỉ dùng ở phần Khởi động, nơi vẽ được hình */
    const pool = QUIZ_BANK.filter((q) => !NEEDS_ART.has(q.id));
    const base = topic ? pool.filter((q) => q.topic === topic) : pool;
    const extra = (extraQuestions ?? []).filter((q) => q.options.some((o) => o.isCorrect));
    return [...base, ...extra].map(toQuest);
  }, [topic, extraQuestions]);

  const counts = useMemo(() => {
    const pool = QUIZ_BANK.filter((q) => !NEEDS_ART.has(q.id));
    const map: Record<string, number> = { all: pool.length };
    QUIZ_TOPICS.forEach((t) => { map[t.id] = pool.filter((q) => q.topic === t.id).length; });
    return map;
  }, []);

  /* Nhúng dữ liệu vào trang trò chơi trước khi nó chạy */
  const srcDoc = useMemo(() => {
    const inject = `<script>
      window.__MODULAB_QUESTIONS__ = ${JSON.stringify(bank)};
      window.__MODULAB_ROUND__ = ${roundSize};
    </script>`;
    return gameHtml.replace('<script>', `${inject}\n<script>`);
  }, [bank, roundSize, runId]);

  /* Nhận kết quả trò chơi gửi ra */
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { source?: string; type?: string; correct?: number; total?: number; won?: boolean };
      if (d?.source !== 'modulab-quest' || d.type !== 'finish') return;
      const correct = d.correct ?? 0;
      const total = d.total ?? roundSize;
      setLastResult({ correct, total, won: !!d.won });
      finishRef.current?.(correct * 10, total, correct);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [roundSize]);

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* Thanh thiết lập lượt chơi */}
      <div className="shrink-0 bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2.5 mr-auto">
          <span className="w-9 h-9 rounded-xl bg-indigo-600 grid place-items-center shrink-0">
            <Rocket className="w-4 h-4 text-white" />
          </span>
          <div>
            <div className="text-[clamp(15px,1.05vw,17.5px)] font-extrabold leading-tight">
              Physics Quest — Electric City
            </div>
            <div className="text-[12.5px] text-slate-500">
              Trả lời đúng để đánh bại quái vật và giải cứu công chúa Ohmia
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2">
          <span className="text-[12.5px] font-bold text-slate-500 uppercase">Chủ đề</span>
          <select
            value={topic ?? 'all'}
            onChange={(e) => setTopic(e.target.value === 'all' ? null : e.target.value)}
            className="h-9 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[clamp(13px,0.9vw,15.5px)] font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tổng hợp ({counts.all} câu)</option>
            {QUIZ_TOPICS.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({counts[t.id]} câu)</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-[12.5px] font-bold text-slate-500 uppercase">Số câu</span>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {ROUND_SIZES.map((n) => (
              <button key={n} onClick={() => setRoundSize(n)}
                className={`h-9 w-10 text-[clamp(13px,0.9vw,15.5px)] font-bold transition-colors ${
                  roundSize === n ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}>{n}</button>
            ))}
          </div>
        </label>

        <NutCoHinh muc={muc} tuDong={mucTuChon === null} datMuc={datMuc}
          toanManHinh={toanManHinh} doiToanManHinh={() => setToanManHinh((v) => !v)} />

        <button
          onClick={() => { setLastResult(null); setRunId((n) => n + 1); }}
          className="h-9 px-3.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-[clamp(13px,0.9vw,15.5px)] font-bold flex items-center gap-2 transition-colors"
        >
          <Shuffle className="w-4 h-4" /> Vào màn mới
        </button>
      </div>

      {lastResult && (
        <div className={`ml-rise shrink-0 rounded-xl border px-4 py-2.5 flex items-center gap-2.5 text-[clamp(13px,0.9vw,15.5px)] ${
          lastResult.won ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <Trophy className="w-4 h-4 shrink-0" />
          <span className="font-bold">
            {lastResult.won ? 'Giải cứu thành công!' : 'Pháp sư đã gục ngã.'}
          </span>
          <span>Đúng {lastResult.correct}/{lastResult.total} câu — kết quả đã ghi vào sổ điểm.</span>
        </div>
      )}

      {/*
        Khung trò chơi.

        Thẻ nhúng luôn giữ đúng KHO_GOC rồi mới thu phóng cả khối, chứ không
        cho nó co giãn theo khung. Trò chơi vì thế lúc nào cũng thấy một khung
        nhìn đúng khổ nó được vẽ cho, bố cục không vỡ; chỉ có cả bức ảnh là to
        lên nhỏ đi. Lớp bọc giữa mang đúng kích thước SAU khi thu phóng, nhờ
        vậy canh giữa và cuộn đều tính đúng — đặt phép biến đổi thẳng lên thẻ
        nhúng thì bề rộng dùng để xếp chỗ vẫn là bề rộng gốc, phóng to lên là
        tràn ra ngoài mà không cuộn tới được.

        Mức phóng KHÔNG nằm trong `key`, nên chỉnh cỡ giữa chừng không làm trò
        chơi khởi động lại — đang đánh quái mà mất màn thì hỏng.
      */}
      {/*
        CÙNG MỘT THẺ cho cả hai chế độ, chỉ đổi lớp CSS. Nếu dựng hai nhánh JSX
        riêng cho thường và toàn màn hình thì React tháo thẻ nhúng ra lắp lại,
        trò chơi khởi động lại từ đầu — bật toàn màn hình giữa trận là mất sạch
        tiến độ.
      */}
      <div ref={khungRef}
        className={`overflow-auto ml-scroll bg-[#090b16] grid place-items-center ${
          toanManHinh
            ? 'fixed inset-0 z-50 p-3'
            : 'flex-1 min-h-0 rounded-2xl border border-slate-200'}`}>
        <div style={{ width: KHO_GOC.w * muc, height: KHO_GOC.h * muc }}>
          <iframe
            key={`${runId}-${roundSize}-${topic ?? 'all'}`}
            title="Physics Quest — Electric City"
            srcDoc={srcDoc}
            className="block border-0"
            style={{
              width: KHO_GOC.w,
              height: KHO_GOC.h,
              transform: `scale(${muc})`,
              transformOrigin: 'top left',
            }}
            sandbox="allow-scripts"
          />
        </div>

        {toanManHinh && (
          <div className="fixed top-4 right-4 z-10 rounded-xl px-2.5 py-2
            bg-slate-900/85 border border-white/20 backdrop-blur-sm">
            <NutCoHinh toi muc={muc} tuDong={mucTuChon === null} datMuc={datMuc}
              toanManHinh={toanManHinh} doiToanManHinh={() => setToanManHinh(false)} />
          </div>
        )}
      </div>

      {userRole === 'gv' && (
        <p className="shrink-0 text-[12.5px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          Trò chơi bốc ngẫu nhiên câu hỏi từ ngân hàng của ModuLab; các câu cần xem hình linh kiện nằm ở phần Khởi động.
        </p>
      )}
    </div>
  );
};
