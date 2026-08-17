import React, { useState } from 'react';
import { LabModule } from '../../types';
import { BentoCard } from '../common';
import {
  BookOpen, Zap, Activity, CircuitBoard, ArrowRight, AlertTriangle, Power,
} from 'lucide-react';

interface TheoryViewProps {
  module: LabModule;
  onSwitchModule: (modId: string) => void;
  availableModules: LabModule[];
}

/* ------------------------------------------------------------------ */
/* Công thức dạng phân số                                              */
/* ------------------------------------------------------------------ */

/**
 * Phân số thẳng đứng: tử số nằm trên, mẫu số nằm dưới, gạch ngang ở giữa.
 * Dùng cho mọi công thức U/I, U/R, ρL/S… thay cho dấu gạch chéo khó đọc.
 */
const Frac: React.FC<{ num: React.ReactNode; den: React.ReactNode; size?: 'sm' | 'md' | 'lg' }> = ({
  num, den, size = 'md',
}) => {
  const px = size === 'lg' ? 26 : size === 'sm' ? 15 : 20;
  return (
    <span className="inline-flex flex-col items-center align-middle leading-none mx-1">
      <span className="font-serif italic px-1.5" style={{ fontSize: px }}>{num}</span>
      <span className="w-full bg-current my-[3px]" style={{ height: 2 }} />
      <span className="font-serif italic px-1.5" style={{ fontSize: px }}>{den}</span>
    </span>
  );
};

/** Một dòng công thức đứng riêng: vế trái = phân số (hoặc biểu thức) */
const FormulaLine: React.FC<{ children: React.ReactNode; tone?: string }> = ({
  children, tone = 'text-indigo-700',
}) => (
  <div className={`bg-white rounded-xl border border-slate-200 py-4 px-4 flex items-center justify-center gap-3 flex-wrap ${tone}`}>
    {children}
  </div>
);

/** Ký hiệu đại lượng in nghiêng kiểu sách giáo khoa */
const V: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 24 }) => (
  <span className="font-serif italic leading-none" style={{ fontSize: size }}>{children}</span>
);

const Eq = ({ size = 22 }: { size?: number }) => (
  <span className="leading-none" style={{ fontSize: size }}>=</span>
);

/* ------------------------------------------------------------------ */
/* Các mảnh dùng lại                                                   */
/* ------------------------------------------------------------------ */

const SectionTitle: React.FC<{ n: number | string; children: React.ReactNode }> = ({ n, children }) => (
  <h4 className="text-[clamp(14px,0.98vw,16.5px)] font-bold text-indigo-900 mb-3 flex items-center gap-2">
    <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[clamp(13px,0.9vw,15.5px)] font-bold shrink-0">
      {n}
    </span>
    {children}
  </h4>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">{children}</div>
);

const Bullets: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="text-[clamp(13px,0.9vw,15.5px)] space-y-2 text-slate-600 list-disc pl-4 leading-relaxed">
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
);

/** Bảng chú thích các ký hiệu trong công thức */
const Where: React.FC<{ rows: [React.ReactNode, string][] }> = ({ rows }) => (
  <div className="mt-3">
    <p className="text-[12.5px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Trong đó</p>
    <ul className="space-y-1.5">
      {rows.map(([sym, desc], i) => (
        <li key={i} className="flex gap-2.5 text-[clamp(13px,0.9vw,15.5px)] text-slate-600 leading-snug">
          <span className="shrink-0 w-8 text-indigo-700 font-serif italic text-[17px] leading-tight">{sym}</span>
          <span>{desc}</span>
        </li>
      ))}
    </ul>
  </div>
);

const TONES: Record<string, { chip: string; text: string; ring: string }> = {
  amber: { chip: 'bg-amber-100 text-amber-700', text: 'text-amber-700', ring: 'border-amber-200' },
  sky: { chip: 'bg-sky-100 text-sky-700', text: 'text-sky-700', ring: 'border-sky-200' },
  violet: { chip: 'bg-violet-100 text-violet-700', text: 'text-violet-700', ring: 'border-violet-200' },
};

const QuantityCard: React.FC<{
  symbol: string; icon: React.ElementType; tone: keyof typeof TONES;
  name: string; unit: string; note: string;
}> = ({ symbol, icon: Icon, tone, name, unit, note }) => {
  const c = TONES[tone];
  return (
    <div className={`bg-white rounded-xl border ${c.ring} p-3`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-8 h-8 rounded-lg grid place-items-center ${c.chip}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className={`text-[26px] font-serif italic leading-none ${c.text}`}>{symbol}</span>
      </div>
      <div className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-800">{name}</div>
      <div className={`text-[12.5px] font-bold ${c.text}`}>{unit}</div>
      <p className="text-[12.5px] text-slate-500 leading-snug mt-1">{note}</p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Sơ đồ mạch có dòng điện chạy                                        */
/* ------------------------------------------------------------------ */

const LiveCircuitDiagram: React.FC = () => {
  const [closed, setClosed] = useState(false);
  const LOOP = 'M 60 150 L 60 60 L 150 60 L 235 60 L 320 60 L 320 150 L 230 150 L 60 150';

  return (
    <div>
      <svg viewBox="0 0 380 190" className="w-full max-w-xl mx-auto block">
        <path d={LOOP} fill="none" stroke="#94A3B8" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {closed && (
          <path d={LOOP} fill="none" stroke="#F59E0B" strokeWidth={3.5} strokeLinecap="round"
            strokeDasharray="6 26" className="ml-current" />
        )}

        <g>
          <line x1={44} y1={95} x2={76} y2={95} stroke="#334155" strokeWidth={4} />
          <line x1={52} y1={110} x2={68} y2={110} stroke="#334155" strokeWidth={2.5} />
          <text x={34} y={92} textAnchor="end" fontSize={13} fontWeight={700} fill="#334155">+</text>
          <text x={34} y={116} textAnchor="end" fontSize={15} fontWeight={700} fill="#334155">−</text>
          <text x={60} y={140} textAnchor="middle" fontSize={11} fontWeight={700} fill="#64748B">Nguồn</text>
        </g>

        <g>
          <circle cx={132} cy={60} r={4} fill="#475569" />
          <circle cx={168} cy={60} r={4} fill="#475569" />
          <line x1={132} y1={60} x2={168} y2={60} stroke="#E2E8F0" strokeWidth={3} />
          <line x1={132} y1={60} x2={168} y2={closed ? 60 : 40}
            stroke="#334155" strokeWidth={3.5} strokeLinecap="round"
            style={{ transition: 'all 0.25s cubic-bezier(0.3,1.3,0.6,1)' }} />
          <text x={150} y={26} textAnchor="middle" fontSize={12} fontWeight={800}
            fill={closed ? '#059669' : '#DC2626'}>K</text>
        </g>

        <g>
          <circle cx={235} cy={60} r={15} fill="#FFFFFF" stroke="#0E7490" strokeWidth={2.5} />
          <text x={235} y={65} textAnchor="middle" fontSize={13} fontWeight={800} fill="#0E7490">A</text>
        </g>

        <g>
          <rect x={175} y={138} width={56} height={24} rx={4} fill="#FFFFFF" stroke="#7C3AED" strokeWidth={2.5} />
          <text x={203} y={155} textAnchor="middle" fontSize={13} fontWeight={800} fill="#7C3AED">Rx</text>
        </g>

        <g>
          <line x1={175} y1={150} x2={175} y2={178} stroke="#94A3B8" strokeWidth={2.5} />
          <line x1={231} y1={150} x2={231} y2={178} stroke="#94A3B8" strokeWidth={2.5} />
          <line x1={175} y1={178} x2={188} y2={178} stroke="#94A3B8" strokeWidth={2.5} />
          <line x1={218} y1={178} x2={231} y2={178} stroke="#94A3B8" strokeWidth={2.5} />
          <circle cx={203} cy={178} r={14} fill="#FFFFFF" stroke="#1D4ED8" strokeWidth={2.5} />
          <text x={203} y={183} textAnchor="middle" fontSize={13} fontWeight={800} fill="#1D4ED8">V</text>
        </g>
      </svg>

      <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
        <button
          onClick={() => setClosed((v) => !v)}
          className={`h-10 px-4 rounded-xl text-[clamp(13px,0.9vw,15.5px)] font-bold flex items-center gap-2 transition-colors ${
            closed ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-700 hover:bg-slate-800 text-white'
          }`}
        >
          <Power className="w-4 h-4" />
          {closed ? 'Khoá K đang đóng — bấm để ngắt' : 'Bấm để đóng khoá K'}
        </button>
        <span className="text-[12.5px] text-slate-500">
          {closed
            ? 'Dòng điện chạy từ cực dương qua khoá K, ampe kế rồi qua Rx về cực âm.'
            : 'Mạch đang hở nên chưa có dòng điện.'}
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Bốn bài lý thuyết                                                   */
/* ------------------------------------------------------------------ */

const LESSONS = [
  { id: 'ohm', label: 'Điện trở & Định luật Ohm', sub: 'KHTN 9 — Bài 11' },
  { id: 'mach', label: 'Đoạn mạch nối tiếp, song song', sub: 'KHTN 9 — Bài 12' },
  { id: 'cddd', label: 'Cường độ dòng điện', sub: 'Vật lí 11 — Bài 22' },
  { id: 'nguon', label: 'Mạch điện & nguồn điện', sub: 'Vật lí 11' },
] as const;

type LessonId = typeof LESSONS[number]['id'];

const LessonOhm: React.FC = () => (
  <>
    <Card>
      <SectionTitle n="I">Điện trở</SectionTitle>
      <Bullets items={[
        'Điện trở có tác dụng cản trở dòng điện.',
        'Các điện trở khác nhau có tác dụng cản trở dòng điện khác nhau.',
      ]} />
    </Card>

    <Card>
      <SectionTitle n="II">Sự phụ thuộc của cường độ dòng điện vào hiệu điện thế</SectionTitle>
      <Bullets items={[
        'Khi thay đổi hiệu điện thế giữa hai đầu vật dẫn thì cường độ dòng điện cũng thay đổi theo.',
        'Cường độ dòng điện chạy qua vật dẫn tỉ lệ thuận với hiệu điện thế giữa hai đầu vật dẫn.',
      ]} />
    </Card>

    <Card>
      <SectionTitle n="III">Định luật Ohm</SectionTitle>

      <p className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-700 mb-2">1. Điện trở của đoạn dây dẫn</p>
      <Bullets items={[
        <>Giá trị thương số <Frac num="U" den="I" size="sm" /> không đổi đối với mỗi đoạn dây dẫn, gọi là điện trở của đoạn dây dẫn đó (kí hiệu <V size={17}>R</V>).</>,
        <>Với các đoạn dây dẫn khác nhau, giá trị <Frac num="U" den="I" size="sm" /> khác nhau. Cùng một hiệu điện thế, đoạn dây nào cho dòng điện nhỏ hơn thì <Frac num="U" den="I" size="sm" /> lớn hơn.</>,
        <>Giá trị <Frac num="U" den="I" size="sm" /> đặc trưng cho sự cản trở dòng điện đi qua đoạn dây dẫn.</>,
      ]} />

      <p className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-700 mt-4 mb-2">2. Đơn vị điện trở</p>
      <FormulaLine>
        <V>R</V><Eq /><Frac num="U" den="I" size="lg" />
      </FormulaLine>
      <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 mt-2">
        Đơn vị: 1 Ω = 1 V / 1 A.
      </p>

      <p className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-700 mt-4 mb-2">3. Định luật Ohm</p>
      <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 mb-2 leading-relaxed">
        Cường độ dòng điện chạy qua một đoạn dây dẫn tỉ lệ thuận với hiệu điện thế giữa hai đầu đoạn dây
        và tỉ lệ nghịch với điện trở của nó.
      </p>
      <FormulaLine>
        <V>I</V><Eq /><Frac num="U" den="R" size="lg" />
        <ArrowRight className="w-5 h-5 text-slate-300 mx-2" />
        <V>R</V><Eq /><Frac num="U" den="I" size="lg" />
      </FormulaLine>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <QuantityCard symbol="U" icon={Zap} tone="amber"
          name="Hiệu điện thế" unit="Vôn (V)"
          note="Chênh lệch điện thế giữa hai đầu vật dẫn" />
        <QuantityCard symbol="I" icon={Activity} tone="sky"
          name="Cường độ dòng điện" unit="Ampe (A)"
          note="Lượng điện tích qua tiết diện mỗi giây" />
        <QuantityCard symbol="R" icon={CircuitBoard} tone="violet"
          name="Điện trở" unit="Ôm (Ω)"
          note="Mức cản trở dòng điện của vật dẫn" />
      </div>
    </Card>

    <Card>
      <SectionTitle n="IV">Điện trở phụ thuộc kích thước và bản chất dây dẫn</SectionTitle>
      <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 mb-3 leading-relaxed">
        Điện trở của một đoạn dây dẫn tỉ lệ thuận với chiều dài của đoạn dây, tỉ lệ nghịch với tiết diện
        của dây và phụ thuộc vào bản chất của chất làm dây dẫn.
      </p>
      <FormulaLine>
        <V>R</V><Eq /><V>ρ</V><Frac num="L" den="S" size="lg" />
      </FormulaLine>
      <Where rows={[
        [<>R</>, 'Điện trở của đoạn dây dẫn, đơn vị ôm (Ω)'],
        [<>ρ</>, 'Điện trở suất của chất làm dây dẫn, đơn vị ôm mét (Ω·m)'],
        [<>L</>, 'Chiều dài của đoạn dây dẫn, đơn vị mét (m)'],
        [<>S</>, 'Tiết diện của dây dẫn, đơn vị mét vuông (m²)'],
      ]} />
    </Card>
  </>
);

const LessonMach: React.FC = () => (
  <>
    <Card>
      <SectionTitle n="I">Đoạn mạch nối tiếp</SectionTitle>
      <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 mb-3 leading-relaxed">
        Điện trở tương đương của đoạn mạch là điện trở có thể thay thế các điện trở của đoạn mạch, sao cho
        với cùng hiệu điện thế đặt vào hai đầu đoạn mạch thì cường độ dòng điện chạy qua vẫn có giá trị như trước.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Điện trở tương đương</p>
          <p className="font-serif italic text-[17px] text-indigo-700">R<sub>tđ</sub> = R₁ + R₂ + … + R<sub>n</sub></p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Cường độ dòng điện</p>
          <p className="font-serif italic text-[17px] text-indigo-700">I = I₁ = I₂ = … = I<sub>n</sub></p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Hiệu điện thế</p>
          <p className="font-serif italic text-[17px] text-indigo-700">U = U₁ + U₂ + … + U<sub>n</sub></p>
        </div>
      </div>
    </Card>

    <Card>
      <SectionTitle n="II">Đoạn mạch song song</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Điện trở tương đương</p>
          <div className="flex items-center flex-wrap text-indigo-700">
            <Frac num={<>1</>} den={<>R<sub>tđ</sub></>} size="sm" />
            <Eq size={17} />
            <Frac num="1" den="R₁" size="sm" />
            <span className="text-[17px]">+</span>
            <Frac num="1" den="R₂" size="sm" />
            <span className="text-[17px]">+ … +</span>
            <Frac num={<>1</>} den={<>R<sub>n</sub></>} size="sm" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Cường độ dòng điện</p>
          <p className="font-serif italic text-[17px] text-indigo-700">I = I₁ + I₂ + … + I<sub>n</sub></p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Hiệu điện thế</p>
          <p className="font-serif italic text-[17px] text-indigo-700">U = U₁ = U₂ = … = U<sub>n</sub></p>
        </div>
      </div>
      <p className="text-[12.5px] text-slate-500 mt-3">
        Riêng trường hợp hai điện trở mắc song song, có thể tính nhanh bằng tích chia tổng.
      </p>
      <FormulaLine>
        <span className="font-serif italic text-[22px]">R<sub>tđ</sub></span>
        <Eq />
        <Frac num={<>R₁ · R₂</>} den={<>R₁ + R₂</>} size="md" />
      </FormulaLine>
    </Card>
  </>
);

const LessonCddd: React.FC = () => (
  <>
    <Card>
      <SectionTitle n="I">Cường độ dòng điện</SectionTitle>
      <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 mb-3 leading-relaxed">
        Cường độ dòng điện là đại lượng đặc trưng cho tác dụng mạnh, yếu của dòng điện.
      </p>
      <FormulaLine>
        <V>i</V><Eq /><Frac num={<>Δq</>} den={<>Δt</>} size="lg" />
      </FormulaLine>
      <Where rows={[
        [<>Δq</>, 'Độ lớn điện lượng chuyển qua tiết diện thẳng của dây dẫn, đơn vị culông (C)'],
        [<>Δt</>, 'Thời gian điện lượng trên chuyển qua, đơn vị giây (s)'],
        [<>I</>, 'Cường độ dòng điện, đơn vị ampe (A)'],
      ]} />
    </Card>

    <Card>
      <SectionTitle n="II">Liên hệ với mật độ và tốc độ hạt mang điện</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Cường độ dòng điện</p>
          <p className="font-serif italic text-[20px] text-indigo-700">I = Snve</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Số electron qua tiết diện</p>
          <p className="font-serif italic text-[20px] text-indigo-700">N = nSv · Δt</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Điện lượng chuyển qua</p>
          <p className="font-serif italic text-[20px] text-indigo-700">Δq = Ne = Snve · Δt</p>
        </div>
      </div>
      <Where rows={[
        [<>S</>, 'Diện tích tiết diện thẳng của dây dẫn'],
        [<>n</>, 'Mật độ hạt mang điện'],
        [<>v</>, 'Tốc độ dịch chuyển có hướng của electron'],
        [<>e</>, 'Độ lớn điện tích của electron'],
      ]} />
    </Card>
  </>
);

const LessonNguon: React.FC = () => (
  <>
    <Card>
      <SectionTitle n="I">Điện trở và Định luật Ohm</SectionTitle>
      <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 mb-3 leading-relaxed">
        Điện trở <V size={17}>R</V> là đại lượng đặc trưng cho mức độ cản trở dòng điện của vật dẫn.
        Cường độ dòng điện qua vật dẫn tỉ lệ thuận với hiệu điện thế hai đầu vật dẫn và tỉ lệ nghịch với điện trở.
      </p>
      <FormulaLine>
        <V>R</V><Eq /><Frac num="U" den="I" size="lg" />
        <ArrowRight className="w-5 h-5 text-slate-300 mx-2" />
        <V>I</V><Eq /><Frac num="U" den="R" size="lg" />
      </FormulaLine>
      <Where rows={[
        [<>U</>, 'Hiệu điện thế giữa hai đầu vật dẫn, đơn vị vôn (V)'],
        [<>I</>, 'Cường độ dòng điện qua vật dẫn, đơn vị ampe (A)'],
        [<>R</>, 'Điện trở của vật dẫn, đơn vị ôm (Ω)'],
      ]} />
    </Card>

    <Card>
      <SectionTitle n="II">Suất điện động của nguồn điện</SectionTitle>
      <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 mb-3 leading-relaxed">
        Suất điện động <V size={17}>E</V> đặc trưng cho khả năng thực hiện công của nguồn điện, đo bằng thương số
        giữa công <V size={17}>A</V> của lực lạ khi dịch chuyển điện tích dương <V size={17}>q</V> bên trong nguồn
        từ cực âm sang cực dương và độ lớn điện tích đó.
      </p>
      <FormulaLine>
        <V>E</V><Eq /><Frac num="A" den="q" size="lg" />
      </FormulaLine>
      <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 mt-3 leading-relaxed">
        Số vôn ghi trên mỗi nguồn điện cho biết trị số suất điện động của nguồn. Đó cũng là hiệu điện thế
        giữa hai cực của nguồn khi mạch hở.
      </p>
    </Card>

    <Card>
      <SectionTitle n="III">Điện trở trong của nguồn điện</SectionTitle>
      <Bullets items={[
        'Trong mạch kín, dòng điện chạy qua cả mạch ngoài lẫn mạch trong. Nguồn điện cũng là một vật dẫn nên cũng có điện trở, gọi là điện trở trong r của nguồn.',
        <>Nguồn điện được đặc trưng bằng suất điện động <V size={17}>E</V> và điện trở trong <V size={17}>r</V>.</>,
        'Cường độ dòng điện trong mạch kín tỉ lệ thuận với suất điện động và tỉ lệ nghịch với điện trở toàn phần của mạch.',
      ]} />
      <div className="mt-3">
        <FormulaLine>
          <V>I</V><Eq /><Frac num={<>E</>} den={<>R + r</>} size="lg" />
        </FormulaLine>
      </div>
      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Công của nguồn điện</p>
          <p className="font-serif italic text-[19px] text-indigo-700">A = qE = EIt</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Hiệu điện thế mạch ngoài</p>
          <p className="font-serif italic text-[19px] text-indigo-700">U = E − Ir</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
          <p className="text-[12.5px] font-bold text-slate-400 uppercase mb-1.5">Hiệu điện thế mạch ngoài</p>
          <p className="font-serif italic text-[19px] text-indigo-700">U = IR</p>
        </div>
      </div>
    </Card>

    <Card>
      <SectionTitle n="IV">Sơ đồ mạch đo — bấm khoá K để xem dòng điện chạy</SectionTitle>
      <LiveCircuitDiagram />
    </Card>

    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex gap-3">
      <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
      <div>
        <h4 className="text-[clamp(14px,0.98vw,16.5px)] font-bold text-rose-800 mb-1">Cảnh báo nguy hiểm</h4>
        <p className="text-[clamp(13px,0.9vw,15.5px)] text-rose-900 leading-relaxed">
          Không mắc ampe kế song song với nguồn hoặc với điện trở. Điện trở trong của ampe kế gần bằng 0
          nên sẽ gây đoản mạch, làm cháy đồng hồ đo và hỏng nguồn.
        </p>
      </div>
    </div>
  </>
);

/* ------------------------------------------------------------------ */

export const TheoryView: React.FC<TheoryViewProps> = ({
  module,
  onSwitchModule,
  availableModules,
}) => {
  const [lesson, setLesson] = useState<LessonId>('ohm');

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 h-full overflow-y-auto pr-1 pb-4">
      {/* Thanh chọn bài thực hành */}
      <div className="md:col-span-6 bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-[clamp(15px,1.05vw,17.5px)] font-bold text-slate-800 truncate">{module.title}</span>
        </div>
        <select
          value={module.id}
          onChange={(e) => onSwitchModule(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[clamp(14px,0.98vw,16.5px)] font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {availableModules.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>

      {/* Chọn bài lý thuyết */}
      <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {LESSONS.map((l) => (
          <button key={l.id} onClick={() => setLesson(l.id)}
            className={`text-left rounded-xl border px-3.5 py-2.5 transition-colors ${
              lesson === l.id
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-indigo-300'
            }`}>
            <div className={`text-[clamp(13.5px,0.94vw,16px)] font-bold leading-tight ${
              lesson === l.id ? 'text-indigo-700' : 'text-slate-700'
            }`}>{l.label}</div>
            <div className="text-[12.5px] text-slate-400 mt-0.5">{l.sub}</div>
          </button>
        ))}
      </div>

      <BentoCard className="md:col-span-6"
        title="Lý thuyết ôn tập"
        subtitle={LESSONS.find((l) => l.id === lesson)?.label}>
        <div key={lesson} className="ml-rise space-y-4 text-slate-700 font-sans">
          {lesson === 'ohm' && <LessonOhm />}
          {lesson === 'mach' && <LessonMach />}
          {lesson === 'cddd' && <LessonCddd />}
          {lesson === 'nguon' && <LessonNguon />}
        </div>
      </BentoCard>
    </div>
  );
};
