/**
 * F8 — Trò chơi: "Physics Quest — Electric City", bản nhập vai cho học sinh
 * muốn ôn tập theo kiểu chơi game.
 *
 * Trò chơi được viết bằng HTML/CSS/JS thuần nên chạy trong khung nhúng riêng.
 * Ứng dụng truyền ngân hàng 75 câu hỏi vào trước khi trò chơi khởi động, và
 * nhận lại kết quả qua postMessage để ghi vào sổ điểm.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Rocket, Trophy, Shuffle, Info } from 'lucide-react';
import { QUIZ_BANK, QUIZ_TOPICS } from '../../data/quizBank';
import { NEEDS_ART } from './art';
import type { QuizQuestion, UserRole } from '../../types';
import gameHtml from './game.html?raw';

interface PhysicsQuestProps {
  userRole: UserRole;
  onFinishQuiz?: (score: number, total: number) => void;
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

export const PhysicsQuest: React.FC<PhysicsQuestProps> = ({ userRole, onFinishQuiz, extraQuestions }) => {
  const [roundSize, setRoundSize] = useState(6);
  const [topic, setTopic] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);
  const [lastResult, setLastResult] = useState<{ correct: number; total: number; won: boolean } | null>(null);
  const finishRef = useRef(onFinishQuiz);
  finishRef.current = onFinishQuiz;

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
      finishRef.current?.(correct * 10, total);
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

      {/* Khung trò chơi */}
      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 overflow-hidden bg-[#090b16]">
        <iframe
          key={`${runId}-${roundSize}-${topic ?? 'all'}`}
          title="Physics Quest — Electric City"
          srcDoc={srcDoc}
          className="w-full h-full block border-0"
          sandbox="allow-scripts"
        />
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
