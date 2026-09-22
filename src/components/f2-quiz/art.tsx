/**
 * Hình minh hoạ cho các câu hỏi có nhắc tới "hình vẽ".
 *
 * Một số câu chỉ cần nhận dạng thiết bị nên dùng luôn hình linh kiện của phần
 * mô phỏng. Số còn lại cần đọc đúng vạch chia hoặc vòng màu nên được vẽ riêng
 * theo đúng số liệu mà đáp án nêu, tránh hình một đằng đáp án một nẻo.
 */
import React from 'react';
import { PartThumb } from '../f5-circuit';
import type { PartKind, PartLive } from '../f5-circuit';

/* ------------------------------------------------------------------ */
/* Đồng hồ kim vẽ theo thông số của từng câu                           */
/* ------------------------------------------------------------------ */

interface MeterProps {
  max: number;          // giới hạn đo
  majorStep: number;    // khoảng cách giữa hai vạch số
  minorPerMajor: number;// số vạch nhỏ giữa hai vạch số
  value: number;        // vị trí kim
  unit: string;
  symbol: string;
  color: string;
  decimals?: number;
}

const AnalogMeter: React.FC<MeterProps> = ({
  max, majorStep, minorPerMajor, value, unit, symbol, color, decimals = 0,
}) => {
  const CX = 110, CY = 122, R_OUT = 92, R_MAJ = 78, R_MIN = 84, R_LABEL = 62;
  const START = -60, END = 60;
  const majors = Math.round(max / majorStep);
  const ticks = majors * minorPerMajor;

  const pos = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
  };
  const angle = START + Math.max(0, Math.min(1, value / max)) * (END - START);
  const a0 = pos(START, R_OUT), a1 = pos(END, R_OUT);

  return (
    <svg viewBox="0 0 220 150" className="w-full h-auto">
      <rect x={2} y={2} width={216} height={146} rx={8} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={2} />

      {/* cung chia độ */}
      <path d={`M ${a0.x} ${a0.y} A ${R_OUT} ${R_OUT} 0 0 1 ${a1.x} ${a1.y}`}
        fill="none" stroke="#334155" strokeWidth={2} />

      {/* vạch chia */}
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const deg = START + (i * (END - START)) / ticks;
        const major = i % minorPerMajor === 0;
        const p = pos(deg, R_OUT), q = pos(deg, major ? R_MAJ : R_MIN);
        return (
          <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y}
            stroke={major ? '#0F172A' : '#64748B'} strokeWidth={major ? 2.4 : 1} strokeLinecap="round" />
        );
      })}

      {/* con số ở vạch chính */}
      {Array.from({ length: majors + 1 }, (_, i) => {
        const deg = START + (i * (END - START)) / majors;
        const q = pos(deg, R_LABEL);
        const label = (i * majorStep).toFixed(decimals).replace('.', ',');
        return (
          <text key={i} x={q.x} y={q.y + 5} textAnchor="middle"
            fontSize={13} fontWeight={800} fill="#0F172A">
            {i === majors ? `${label} ${unit}` : label}
          </text>
        );
      })}

      {/* kim và trục quay */}
      <line x1={CX} y1={CY} x2={pos(angle, R_OUT - 4).x} y2={pos(angle, R_OUT - 4).y}
        stroke="#DC2626" strokeWidth={2.6} strokeLinecap="round" />
      <line x1={CX} y1={CY} x2={pos(angle + 180, 10).x} y2={pos(angle + 180, 10).y}
        stroke="#DC2626" strokeWidth={3.4} strokeLinecap="round" />
      <circle cx={CX} cy={CY} r={7} fill="#94A3B8" stroke="#475569" strokeWidth={1.2} />

      <text x={34} y={130} fontSize={24} fontWeight={700} fill={color} fontFamily="serif">{symbol}</text>
      <text x={190} y={130} textAnchor="end" fontSize={12} fontWeight={800} fill="#64748B">DC</text>
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Điện trở có vòng màu                                                */
/* ------------------------------------------------------------------ */

const BAND_COLORS: Record<string, string> = {
  'nâu': '#7B4B2A', 'đen': '#111827', 'đỏ': '#DC2626', 'cam': '#EA580C',
  'vàng': '#EAB308', 'lục': '#16A34A', 'lam': '#2563EB', 'tím': '#7C3AED',
  'xám': '#6B7280', 'trắng': '#F8FAFC', 'nhũ vàng': '#C9A227', 'nhũ bạc': '#C0C0C0',
};

const BandedResistor: React.FC<{ bands: string[] }> = ({ bands }) => (
  <svg viewBox="0 0 220 110" className="w-full h-auto">
    <rect x={2} y={2} width={216} height={106} rx={8} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={2} />
    {/* chân kim loại */}
    <line x1={18} y1={55} x2={54} y2={55} stroke="#94A3B8" strokeWidth={4} strokeLinecap="round" />
    <line x1={166} y1={55} x2={202} y2={55} stroke="#94A3B8" strokeWidth={4} strokeLinecap="round" />
    {/* thân gốm */}
    <rect x={50} y={35} width={120} height={40} rx={16} fill="#D8C39A" stroke="#A8946E" strokeWidth={1.5} />
    <rect x={54} y={39} width={112} height={11} rx={5} fill="#FFFFFF" opacity={0.35} />
    {/* vòng màu */}
    {bands.map((b, i) => (
      <rect key={i}
        x={i < 3 ? 66 + i * 22 : 150} y={35}
        width={i < 3 ? 11 : 9} height={40}
        fill={BAND_COLORS[b] ?? '#111827'}
        stroke={b === 'trắng' ? '#CBD5E1' : 'none'} strokeWidth={0.8} />
    ))}
    <text x={110} y={96} textAnchor="middle" fontSize={12} fontWeight={700} fill="#64748B">
      {bands.join(' – ')}
    </text>
  </svg>
);

/* ------------------------------------------------------------------ */
/* Sơ đồ mạch mắc sai: ampe kế song song với bóng đèn                  */
/* ------------------------------------------------------------------ */

const WrongCircuit: React.FC = () => (
  <svg viewBox="0 0 260 150" className="w-full h-auto">
    <rect x={2} y={2} width={256} height={146} rx={8} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={2} />
    {/* khung mạch chính */}
    <path d="M40 110 L40 40 L110 40 L200 40 L200 110 L40 110"
      fill="none" stroke="#334155" strokeWidth={2.4} strokeLinejoin="round" />
    {/* nguồn điện */}
    <line x1={28} y1={68} x2={52} y2={68} stroke="#334155" strokeWidth={3.4} />
    <line x1={34} y1={80} x2={46} y2={80} stroke="#334155" strokeWidth={2} />
    <text x={20} y={66} textAnchor="end" fontSize={12} fontWeight={700} fill="#334155">+</text>
    <text x={20} y={86} textAnchor="end" fontSize={13} fontWeight={700} fill="#334155">−</text>
    {/* khoá K */}
    <circle cx={72} cy={40} r={3} fill="#475569" />
    <circle cx={98} cy={40} r={3} fill="#475569" />
    <line x1={72} y1={40} x2={98} y2={26} stroke="#334155" strokeWidth={2.6} strokeLinecap="round" />
    <text x={85} y={18} textAnchor="middle" fontSize={11} fontWeight={800} fill="#334155">K</text>
    {/* bóng đèn */}
    <circle cx={155} cy={40} r={14} fill="#FFFFFF" stroke="#B45309" strokeWidth={2.4} />
    <path d="M146 31 L164 49 M164 31 L146 49" stroke="#B45309" strokeWidth={1.8} />
    {/* ampe kế mắc song song với đèn — chỗ sai */}
    <line x1={141} y1={40} x2={141} y2={92} stroke="#DC2626" strokeWidth={2.4} />
    <line x1={169} y1={40} x2={169} y2={92} stroke="#DC2626" strokeWidth={2.4} />
    <line x1={141} y1={92} x2={148} y2={92} stroke="#DC2626" strokeWidth={2.4} />
    <line x1={162} y1={92} x2={169} y2={92} stroke="#DC2626" strokeWidth={2.4} />
    <circle cx={155} cy={92} r={13} fill="#FFFFFF" stroke="#DC2626" strokeWidth={2.4} />
    <text x={155} y={97} textAnchor="middle" fontSize={13} fontWeight={800} fill="#DC2626">A</text>
  </svg>
);

/* ------------------------------------------------------------------ */
/* Bảng tra: câu hỏi nào dùng hình nào                                 */
/* ------------------------------------------------------------------ */

type ArtSpec =
  | { kind: 'part'; part: PartKind; live?: Partial<PartLive>; caption: string }
  | { kind: 'node'; node: React.ReactNode; caption: string };

const dmm = (live: Partial<PartLive>, caption: string): ArtSpec =>
  ({ kind: 'part', part: 'multimeter', live, caption });

export const QUESTION_ART: Record<string, ArtSpec> = {
  /* Nhận dạng thiết bị */
  c1: { kind: 'part', part: 'ammeter', live: { needle: 0.45 }, caption: 'Thiết bị đo trong đề bài' },
  c22: dmm({ func: 'V', unit: 'V', reading: '12.00', auto: true }, 'Thiết bị đo trong đề bài'),
  c33: { kind: 'part', part: 'rheostat', live: { knob: 0.45 }, caption: 'Dụng cụ trong đề bài' },
  c31: { kind: 'node', node: null, caption: 'Bảng lắp ráp mạch điện' },

  /* Đồng hồ vạn năng ở các trạng thái khác nhau */
  c23: dmm({ func: 'V', unit: 'V', reading: '09.55', auto: false }, 'Núm xoay đang ở thang đo hiệu điện thế một chiều'),
  c24: dmm({ func: 'V', unit: 'V', reading: '9.55', auto: false }, 'Màn hình đồng hồ khi đang đo'),
  c25: dmm({ func: 'ohm', unit: 'Ω', reading: 'OL', auto: false }, 'Đồng hồ ở thang điện trở, màn hình hiện OL'),
  c26: dmm({ func: 'V', unit: 'V', reading: '0.00', auto: true }, 'Ba cổng cắm que đo ở mặt dưới đồng hồ'),
  c27: dmm({ func: 'A', unit: 'A', reading: '0.00', auto: true }, 'Ba cổng cắm que đo ở mặt dưới đồng hồ'),

  /* Đồng hồ kim vẽ đúng theo số liệu của đáp án */
  c2: {
    kind: 'node', caption: 'Thang đo của ampe kế trong đề bài',
    node: <AnalogMeter max={1} majorStep={0.2} minorPerMajor={10} value={0.46}
      unit="A" symbol="A" color="#047857" decimals={1} />,
  },
  c28: {
    kind: 'node', caption: 'Vôn kế trong đề bài',
    node: <AnalogMeter max={10} majorStep={2} minorPerMajor={10} value={6}
      unit="V" symbol="V" color="#1D4ED8" />,
  },
  c29: {
    kind: 'node', caption: 'Ampe kế trong đề bài',
    node: <AnalogMeter max={3} majorStep={1} minorPerMajor={10} value={1.4}
      unit="A" symbol="A" color="#047857" />,
  },

  /* Vòng màu điện trở và sơ đồ mắc sai */
  c30: {
    kind: 'node', caption: 'Điện trở với bốn vòng màu',
    node: <BandedResistor bands={['nâu', 'đen', 'đỏ', 'nhũ vàng']} />,
  },
  c34: { kind: 'node', node: <WrongCircuit />, caption: 'Sơ đồ mạch điện trong đề bài' },
};

/** Mã các câu cần xem hình — trò chơi nhập vai bỏ qua những câu này */
export const NEEDS_ART = new Set(Object.keys(QUESTION_ART));

/** Hình minh hoạ của một câu hỏi; trả về null nếu câu đó không cần hình */
export const QuestionArt: React.FC<{ questionId: string }> = ({ questionId }) => {
  const spec = QUESTION_ART[questionId];
  if (!spec) return null;

  return (
    <figure className="shrink-0 w-full sm:w-56 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="grid place-items-center">
        {spec.kind === 'part'
          ? <PartThumb kind={spec.part} size={spec.part === 'multimeter' ? 84 : 190}
              live={{ closed: true, knob: 0.45, needle: 0.5, func: 'V', unit: 'V',
                      auto: true, reading: '12.00', ...spec.live }} />
          : spec.node ?? <BoardArt />}
      </div>
      <figcaption className="text-meta text-slate-500 text-center mt-2 leading-snug">
        {spec.caption}
      </figcaption>
    </figure>
  );
};

/** Bảng lắp ráp mạch điện, có khoanh một cột lỗ cắm để minh hoạ câu hỏi */
const BoardArt: React.FC = () => {
  const holes: [number, number][] = [];
  for (let c = 0; c < 9; c++) for (let r = 0; r < 5; r++) holes.push([18 + c * 21, 24 + r * 20]);
  return (
    <svg viewBox="0 0 210 140" className="w-full h-auto">
      <rect x={2} y={2} width={206} height={136} rx={8} fill="#7C8B9C" />
      <rect x={8} y={8} width={194} height={124} rx={6} fill="#254690" />
      {holes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={6} fill="#16295C" stroke="#12224B" strokeWidth={1} />
          <circle cx={x} cy={y} r={2.6} fill="#070E22" />
        </g>
      ))}
      {/* cột được khoanh trong đề bài */}
      <rect x={140} y={10} width={22} height={110} rx={9}
        fill="none" stroke="#FACC15" strokeWidth={3} />
      <text x={151} y={134} textAnchor="middle" fontSize={11} fontWeight={800} fill="#FACC15">cột 7</text>
    </svg>
  );
};
