/**
 * F2 — Khởi động: trò chơi trắc nghiệm lấy câu hỏi từ ngân hàng 75 câu,
 * chia ba chủ đề, có đồng hồ đếm ngược, chuỗi trả lời đúng và hiệu ứng ăn mừng.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, Trophy, RotateCcw, Rocket, Flame,
  Sigma, Zap, Gauge, ArrowRight, Lightbulb, Target, Award, Medal,
} from 'lucide-react';
import { BentoCard } from '../common';
import { useSettings } from '../../settings';
import { QUIZ_BANK, QUIZ_TOPICS, pickQuestions } from '../../data/quizBank';
import { sfx } from '../../audio';
import type { QuizQuestion, UserRole } from '../../types';

interface QuizGameProps {
  userRole: UserRole;
  onFinishQuiz?: (score: number, total: number) => void;
  /** Câu hỏi giáo viên bổ sung, ghép thêm vào ngân hàng */
  extraQuestions?: QuizQuestion[];
}

type Phase = 'setup' | 'playing' | 'result';

const TOPIC_ICON: Record<string, React.ElementType> = { A: Sigma, B: Zap, C: Gauge };
const TOPIC_STYLE: Record<string, { chip: string; bar: string }> = {
  A: { chip: 'bg-violet-600', bar: 'bg-violet-500' },
  B: { chip: 'bg-amber-600', bar: 'bg-amber-500' },
  C: { chip: 'bg-emerald-600', bar: 'bg-emerald-500' },
};
const LETTERS = ['A', 'B', 'C', 'D'];
const ROUND_SIZES = [5, 10, 15, 20];

export const QuizGame: React.FC<QuizGameProps> = ({ userRole, onFinishQuiz, extraQuestions }) => {
  const { t, lang } = useSettings();
  const bi = (vi: string, en: string) => (lang === 'en' ? en : vi);

  const [phase, setPhase] = useState<Phase>('setup');
  const [topic, setTopic] = useState<string | null>(null);
  const [roundSize, setRoundSize] = useState<number>(10);
  const [deck, setDeck] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [burst, setBurst] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [shake, setShake] = useState(false);

  const timer = useRef<number | null>(null);
  const answered = picked !== null;
  const current = deck[idx];

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: QUIZ_BANK.length };
    QUIZ_TOPICS.forEach((tp) => { map[tp.id] = QUIZ_BANK.filter((q) => q.topic === tp.id).length; });
    return map;
  }, []);

  /* Đồng hồ đếm ngược */
  useEffect(() => {
    if (phase !== 'playing' || answered) return;
    if (timeLeft <= 0) { setPicked('__timeout__'); setStreak(0); sfx.timeout(); return; }
    timer.current = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [phase, timeLeft, answered]);

  const start = useCallback(() => {
    const base = pickQuestions(roundSize, topic ?? undefined);
    const extra = (extraQuestions ?? []).filter(() => !topic);
    const deckNow = [...base, ...extra].slice(0, roundSize);
    setDeck(deckNow);
    setIdx(0); setPicked(null); setScore(0); setCorrectCount(0); setStreak(0); setBestStreak(0);
    setTimeLeft(deckNow[0]?.timeLimit ?? 30);
    setPhase('playing');
  }, [roundSize, topic, extraQuestions]);

  const choose = (optId: string) => {
    if (answered) return;
    const correct = current.options.find((o) => o.id === optId)?.isCorrect;
    setPicked(optId);
    if (correct) {
      sfx.correct();
      setBurst((b) => b + 1);
      const bonus = timeLeft > 20 ? 2 : timeLeft > 10 ? 1 : 0;
      setScore((s) => s + 10 + bonus + Math.min(streak, 5));
      setCorrectCount((c) => c + 1);
      setStreak((s) => { const n = s + 1; setBestStreak((b) => Math.max(b, n)); return n; });
    } else {
      sfx.wrong();
      setStreak(0);
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
    }
  };

  const next = () => {
    if (idx + 1 >= deck.length) {
      setPhase('result');
      sfx.finish(correctCount / Math.max(1, deck.length) >= 0.6);
      onFinishQuiz?.(score, deck.length);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
    setTimeLeft(deck[idx + 1]?.timeLimit ?? 30);
  };

  const correctOpt = current?.options.find((o) => o.isCorrect);
  const isRight = answered && picked === correctOpt?.id;

  /* ---------------- Màn hình chọn chủ đề ---------------- */
  if (phase === 'setup') {
    return (
      <div className="ml-scroll grid grid-cols-1 lg:grid-cols-6 gap-4 h-full overflow-y-auto pr-1 pb-4">
        <section className="lg:col-span-6 rounded-2xl bg-indigo-600 text-white px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 rounded-xl bg-white/15 grid place-items-center shrink-0">
              <Rocket className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[clamp(17px,1.2vw,20px)] font-extrabold leading-tight">{t('quiz.title')}</h2>
              <p className="text-[clamp(13px,0.9vw,15.5px)] text-white/85 leading-snug">{t('quiz.pickTopic')}</p>
            </div>
          </div>

          <div className="flex items-center gap-5 ml-auto">
            {[
              [String(QUIZ_BANK.length), bi('câu hỏi', 'questions')],
              ['3', bi('chủ đề', 'topics')],
              ['30s', bi('mỗi câu', 'per question')],
            ].map(([n, label]) => (
              <div key={label} className="text-center">
                <div className="text-[clamp(17px,1.2vw,20px)] font-extrabold leading-none">{n}</div>
                <div className="text-[12.5px] text-white/75 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <p className="w-full text-[clamp(13px,0.9vw,15.5px)] text-white/85 leading-relaxed border-t border-white/15 pt-3">
            {bi('Trả lời nhanh và đúng liên tiếp để cộng thêm điểm thưởng.',
                'Answer fast and keep your streak for bonus points.')}
          </p>
        </section>

        <BentoCard className="lg:col-span-4" title={bi('Chủ đề', 'Topic')}
          subtitle={bi('Chọn một chủ đề hoặc chơi tổng hợp', 'Pick one topic or mix them all')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TopicButton
              active={topic === null} onClick={() => setTopic(null)}
              icon={Target} title={t('quiz.allTopics')} count={counts.all} />
            {QUIZ_TOPICS.map((tp) => (
              <TopicButton key={tp.id}
                active={topic === tp.id} onClick={() => setTopic(tp.id)}
                icon={TOPIC_ICON[tp.id]}
                title={lang === 'en' ? tp.nameEn : tp.name} count={counts[tp.id]} />
            ))}
          </div>
        </BentoCard>

        <BentoCard className="lg:col-span-2" title={t('quiz.questionCount')}
          subtitle={bi('Càng nhiều câu, điểm tối đa càng cao', 'More questions, higher ceiling')}>
          <div className="grid grid-cols-2 gap-2">
            {ROUND_SIZES.map((n) => (
              <button key={n} onClick={() => setRoundSize(n)}
                className={`h-14 rounded-xl border font-bold text-lg transition-colors ${
                  roundSize === n
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-500 hover:border-indigo-300'
                }`}>{n}</button>
            ))}
          </div>
          <button onClick={start}
            className="mt-4 w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[clamp(14px,0.98vw,16.5px)] flex items-center justify-center gap-2 ">
            <Rocket className="w-5 h-5" /> {t('quiz.begin')}
          </button>
          {userRole === 'gv' && (
            <p className="mt-2 text-[13px] text-slate-400 text-center">
              {bi('Giáo viên có thể bổ sung câu hỏi ở Bảng quản lý.', 'Teachers can add questions from the dashboard.')}
            </p>
          )}
        </BentoCard>
      </div>
    );
  }

  /* ---------------- Màn hình kết quả ---------------- */
  if (phase === 'result') {
    const ratio = deck.length ? correctCount / deck.length : 0;
    const medal = ratio >= 0.85 ? 'vàng' : ratio >= 0.6 ? 'bạc' : ratio >= 0.4 ? 'đồng' : null;
    const medalEn = ratio >= 0.85 ? 'gold' : ratio >= 0.6 ? 'silver' : ratio >= 0.4 ? 'bronze' : null;
    return (
      <div className="h-full grid place-items-center p-4">
        <div className="ml-pop relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center overflow-hidden">
          {ratio >= 0.6 && <Fireworks seed={correctCount} bursts={3} />}
          <div className={`mx-auto w-16 h-16 rounded-2xl grid place-items-center mb-4 ${
            ratio >= 0.85 ? 'bg-amber-100 text-amber-700'
              : ratio >= 0.6 ? 'bg-slate-100 text-slate-600'
                : 'bg-indigo-50 text-indigo-600'
          }`}>
            {medal ? <Medal className="w-8 h-8" /> : <Award className="w-8 h-8" />}
          </div>

          <h2 className="text-2xl font-extrabold mb-1">
            {ratio >= 0.85 ? bi('Xuất sắc!', 'Outstanding!')
              : ratio >= 0.6 ? bi('Làm tốt lắm!', 'Well done!')
                : bi('Cố lên nhé!', 'Keep going!')}
          </h2>
          {medal && (
            <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 mb-4">
              {bi(`Bạn đạt huy chương ${medal} của lượt này.`, `You earned a ${medalEn} medal this round.`)}
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 my-6">
            <Stat label={t('quiz.score')} value={String(score)} tone="text-indigo-600" />
            <Stat label={bi('Câu đúng', 'Correct')} value={`${correctCount}/${deck.length}`} tone="text-emerald-600" />
            <Stat label={t('quiz.streak')} value={String(bestStreak)} tone="text-amber-600" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setPhase('setup')}
              className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-600 font-bold text-[clamp(13px,0.9vw,15.5px)] hover:bg-slate-50">
              {bi('Đổi chủ đề', 'Change topic')}
            </button>
            <button onClick={start}
              className="flex-1 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[clamp(13px,0.9vw,15.5px)] flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> {t('quiz.again')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Màn hình chơi ---------------- */
  const tp = (current as QuizQuestion & { topic?: string }).topic ?? 'A';
  const style = TOPIC_STYLE[tp] ?? TOPIC_STYLE.A;
  const timePct = (timeLeft / (current?.timeLimit ?? 30)) * 100;

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* Thanh trạng thái */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={`px-3 h-9 rounded-lg ${style.chip} text-white text-[13px] font-bold flex items-center gap-1.5`}>
          {React.createElement(TOPIC_ICON[tp] ?? Sigma, { className: 'w-3.5 h-3.5' })}
          {lang === 'en'
            ? QUIZ_TOPICS.find((x) => x.id === tp)?.nameEn
            : QUIZ_TOPICS.find((x) => x.id === tp)?.name}
        </div>

        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full ${style.bar} transition-all duration-500 rounded-full`}
            style={{ width: `${((idx + (answered ? 1 : 0)) / deck.length) * 100}%` }} />
        </div>

        <span className="text-[clamp(12.5px,0.86vw,15px)] font-bold text-slate-500 tabular-nums">
          {t('quiz.question')} {idx + 1}/{deck.length}
        </span>

        {streak >= 2 && (
          <span className="ml-pop px-2.5 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 text-[clamp(12.5px,0.86vw,15px)] font-extrabold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> ×{streak}
          </span>
        )}

        <span className="px-3 h-9 rounded-xl bg-indigo-600 text-white text-[clamp(13px,0.9vw,15.5px)] font-extrabold flex items-center gap-1.5 tabular-nums shadow-md">
          <Trophy className="w-3.5 h-3.5" /> {score}
        </span>
      </div>

      {/* Thẻ câu hỏi */}
      <div className={`bento-card relative flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col overflow-hidden ${
        shake ? 'ml-shake' : ''
      }`}>
        {isRight && <Fireworks seed={burst} />}

        {/* Đồng hồ đếm ngược */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <Clock className={`w-4 h-4 ${timeLeft <= 5 && !answered ? 'text-rose-500' : 'text-slate-400'}`} />
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
              timeLeft <= 5 ? 'bg-rose-500' : timeLeft <= 12 ? 'bg-amber-500' : 'bg-emerald-500'
            }`} style={{ width: `${Math.max(0, timePct)}%` }} />
          </div>
          <span className={`text-[clamp(13px,0.9vw,15.5px)] font-extrabold tabular-nums w-8 text-right ${
            timeLeft <= 5 && !answered ? 'text-rose-600' : 'text-slate-500'
          }`}>{Math.max(0, timeLeft)}s</span>
        </div>

        <h2 key={current?.id} className="ml-rise text-[clamp(17px,1.2vw,20px)] md:text-xl font-extrabold leading-snug mb-5 shrink-0">
          {current?.question}
        </h2>

        <div className="ml-scroll grid grid-cols-1 md:grid-cols-2 gap-2.5 overflow-y-auto pr-1">
          {current?.options.map((o, i) => {
            const isPicked = picked === o.id;
            const reveal = answered && o.isCorrect;
            const wrong = answered && isPicked && !o.isCorrect;
            return (
              <button key={o.id} disabled={answered} onClick={() => choose(o.id)}
                className={`ml-rise text-left rounded-2xl border px-4 py-3 flex gap-3 items-start transition-colors ${
                  reveal ? 'border-emerald-500 bg-emerald-50'
                    : wrong ? 'border-rose-500 bg-rose-50'
                      : answered ? 'border-slate-200 bg-slate-50 opacity-60'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60'
                }`}
                style={{ animationDelay: `${i * 55}ms` }}>
                <span className={`w-7 h-7 shrink-0 rounded-xl grid place-items-center text-[clamp(13px,0.9vw,15.5px)] font-extrabold ${
                  reveal ? 'bg-emerald-500 text-white'
                    : wrong ? 'bg-rose-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                }`}>
                  {reveal ? <CheckCircle2 className="w-4 h-4" /> : wrong ? <XCircle className="w-4 h-4" /> : LETTERS[i]}
                </span>
                <span className="text-[clamp(13.5px,0.94vw,16px)] leading-snug pt-0.5">{o.text}</span>
              </button>
            );
          })}
        </div>

        {/* Phản hồi */}
        {answered && (
          <div className={`ml-rise mt-4 rounded-2xl border p-4 shrink-0 ${
            isRight ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              {isRight
                ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                : <Lightbulb className="w-5 h-5 text-amber-600" />}
              <span className={`text-[clamp(14px,0.98vw,16.5px)] font-extrabold ${isRight ? 'text-emerald-800' : 'text-amber-800'}`}>
                {picked === '__timeout__' ? t('quiz.timeUp') : isRight ? t('quiz.correct') : t('quiz.wrong')}
              </span>
              <span className="ml-auto text-[13px] font-bold text-slate-500">{t('quiz.explain')}</span>
            </div>
            <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-700 leading-relaxed">{current?.explanation}</p>
            <button onClick={next}
              className="mt-3 w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[clamp(13.5px,0.94vw,16px)] flex items-center justify-center gap-2">
              {idx + 1 >= deck.length ? t('quiz.finish') : t('quiz.next')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */

const TopicButton: React.FC<{
  active: boolean; onClick: () => void; icon: React.ElementType; title: string; count: number;
}> = ({ active, onClick, icon: Icon, title, count }) => (
  <button onClick={onClick}
    className={`rounded-xl border p-4 text-left transition-colors ${
      active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'
    }`}>
    <Icon className={`w-5 h-5 mb-2.5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
    <div className="text-[clamp(14px,0.98vw,16.5px)] font-bold leading-tight">{title}</div>
    <div className="text-[13px] text-slate-500 mt-0.5">{count} câu</div>
  </button>
);

const Stat: React.FC<{ label: string; value: string; tone: string }> = ({ label, value, tone }) => (
  <div className="rounded-2xl bg-slate-50 border border-slate-200 py-3">
    <div className={`text-2xl font-extrabold ${tone}`}>{value}</div>
    <div className="text-[12.5px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">{label}</div>
  </div>
);

/**
 * Pháo hoa chúc mừng — mỗi chùm là các tia bay toả ra từ một điểm rồi tắt dần.
 * Vẽ bằng CSS nên không tốn tài nguyên và tự dọn khi thẻ bị gỡ.
 */
const Fireworks: React.FC<{ seed: number; bursts?: number }> = ({ seed, bursts = 2 }) => {
  const shows = useMemo(() => {
    const COLORS = ['#f59e0b', '#ec4899', '#22c55e', '#3b82f6', '#a855f7', '#ef4444'];
    return Array.from({ length: bursts }, (_, b) => {
      const cx = 18 + ((seed * 37 + b * 53) % 64);
      const cy = 16 + ((seed * 19 + b * 29) % 44);
      const sparks = Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2 + (seed % 7) * 0.2;
        const dist = 46 + ((i * 13 + seed) % 34);
        return {
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist}px`,
          color: COLORS[(i + b + seed) % COLORS.length],
          size: 4 + (i % 3) * 2,
        };
      });
      return { cx, cy, sparks, delay: b * 220 };
    });
  }, [seed, bursts]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {shows.map((show, b) => (
        <div key={`${seed}-${b}`} className="absolute" style={{ left: `${show.cx}%`, top: `${show.cy}%` }}>
          {show.sparks.map((sp, i) => (
            <span key={i} className="ml-spark"
              style={{
                width: sp.size, height: sp.size, background: sp.color,
                animationDelay: `${show.delay}ms`,
                ['--dx' as string]: sp.dx, ['--dy' as string]: sp.dy,
              }} />
          ))}
        </div>
      ))}
    </div>
  );
};
