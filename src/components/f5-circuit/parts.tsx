/**
 * Bộ linh kiện 2D vẽ lại theo ảnh chụp bộ dụng cụ thí nghiệm Vật lí THPT.
 * Toàn bộ module dùng chung kiểu dáng: đế nhựa xanh ngọc, chốt cắm đỏ (+) / đen (−).
 */
import React from 'react';

export type PartKind =
  | 'battery'
  | 'battery9v'
  | 'powersupply'
  | 'switch'
  | 'switch2'
  | 'rheostat'
  | 'resistor'
  | 'lamp'
  | 'coil'
  | 'ammeter'
  | 'voltmeter'
  | 'galvanometer'
  | 'multimeter';

/** Vai trò điện học dùng cho bộ giải mạch */
export type ElecKind =
  | 'source'
  | 'resistor'
  | 'rheostat'
  | 'switch'
  | 'lamp'
  | 'ammeter'
  | 'voltmeter'
  | 'galvanometer'
  | 'coil'
  | 'inert';

export type PartGroup = 'Nguồn điện' | 'Đo lường' | 'Điều khiển' | 'Tải & Điện trở' | 'Từ – Điện' | 'Phụ kiện';

export interface Terminal {
  id: string;
  x: number;
  y: number;
  pol: 'pos' | 'neg' | 'none';
  label: string;
}

export interface PartSpec {
  kind: PartKind;
  name: string;
  short: string;
  group: PartGroup;
  w: number;
  h: number;
  terminals: Terminal[];
  elec: ElecKind;
  /** Giá trị danh định: điện trở (Ω) hoặc suất điện động (V) */
  value?: number;
  unit?: string;
  desc: string;
  /** Có đặt được lên bảng lắp ráp hay không */
  onBoard: boolean;
}

const T = (id: string, x: number, y: number, pol: Terminal['pol'], label: string): Terminal => ({ id, x, y, pol, label });

export const PART_CATALOG: Record<PartKind, PartSpec> = {
  battery: {
    kind: 'battery', name: 'Đế pin (Nguồn điện)', short: 'Đế pin', group: 'Nguồn điện',
    w: 132, h: 68, elec: 'source', value: 12, unit: 'V',
    terminals: [T('neg', 24, 50, 'neg', 'Cực âm (−)'), T('pos', 108, 50, 'pos', 'Cực dương (+)')],
    desc: 'Nguồn một chiều 12V, điện trở trong r ≈ 0,5Ω. Luôn nối qua khóa K trước khi cấp điện.',
    onBoard: true,
  },
  battery9v: {
    kind: 'battery9v', name: 'Pin vuông 9V', short: 'Pin 9V', group: 'Nguồn điện',
    w: 88, h: 74, elec: 'source', value: 9, unit: 'V',
    terminals: [T('neg', 26, 58, 'neg', 'Cực âm (−)'), T('pos', 62, 58, 'pos', 'Cực dương (+)')],
    desc: 'Pin vuông 9V dùng cho các mạch nhỏ, điện trở trong khoảng 1Ω. Nhớ tháo pin khi lắp xong mạch.',
    onBoard: true,
  },
  powersupply: {
    kind: 'powersupply', name: 'Biến áp nguồn một chiều 0 – 12V', short: 'Biến áp nguồn', group: 'Nguồn điện',
    w: 210, h: 138, elec: 'source', value: 12, unit: 'V',
    terminals: [T('neg', 98, 116, 'neg', 'Cổng DC (−)'), T('pos', 140, 116, 'pos', 'Cổng DC (+)')],
    desc: 'Bộ nguồn ổn áp 0 – 12V / 5A. Bấm công tắc để bật, xoay núm để chọn điện áp; hai màn hình đỏ hiện dòng và áp lối ra.',
    onBoard: false,
  },
  switch: {
    kind: 'switch', name: 'Công tắc đơn (Khóa K)', short: 'Công tắc đơn', group: 'Điều khiển',
    w: 104, h: 58, elec: 'switch',
    terminals: [T('a', 22, 44, 'none', 'Chốt A'), T('b', 82, 44, 'none', 'Chốt B')],
    desc: 'Đóng / mở mạch. Quy tắc an toàn: luôn để khóa K mở khi đang đấu nối dây.',
    onBoard: true,
  },
  switch2: {
    kind: 'switch2', name: 'Công tắc 2 chiều', short: 'Công tắc 2 chiều', group: 'Điều khiển',
    w: 118, h: 58, elec: 'switch',
    terminals: [T('a', 20, 44, 'none', 'Chốt A'), T('c', 59, 44, 'none', 'Chốt chung'), T('b', 98, 44, 'none', 'Chốt B')],
    desc: 'Chuyển dòng điện sang một trong hai nhánh — dùng cho mạch đèn cầu thang.',
    onBoard: true,
  },
  rheostat: {
    kind: 'rheostat', name: 'Biến trở con chạy', short: 'Biến trở', group: 'Điều khiển',
    w: 142, h: 68, elec: 'rheostat', value: 120, unit: 'Ω',
    terminals: [T('a', 22, 54, 'neg', 'Chốt cố định'), T('b', 118, 54, 'pos', 'Chốt con chạy')],
    desc: 'Biến trở 0 – 120Ω. Xoay núm để thay đổi cường độ dòng điện qua mạch chính.',
    onBoard: true,
  },
  resistor: {
    kind: 'resistor', name: 'Điện trở mẫu Rx (100Ω – 5W)', short: 'Điện trở Rx', group: 'Tải & Điện trở',
    w: 118, h: 60, elec: 'resistor', value: 100, unit: 'Ω',
    terminals: [T('a', 20, 46, 'neg', 'Đầu A'), T('b', 98, 46, 'pos', 'Đầu B')],
    desc: 'Điện trở cần xác định. Giá trị ghi trên vỏ là 100Ω, sai số chế tạo ±5%.',
    onBoard: true,
  },
  lamp: {
    kind: 'lamp', name: 'Đui đèn & bóng 6V', short: 'Đui đèn', group: 'Tải & Điện trở',
    w: 100, h: 66, elec: 'lamp', value: 30, unit: 'Ω',
    terminals: [T('a', 22, 52, 'neg', 'Chốt A'), T('b', 78, 52, 'pos', 'Chốt B')],
    desc: 'Bóng đèn 6V – 3W, điện trở nóng ≈ 30Ω. Sáng khi có dòng điện chạy qua.',
    onBoard: true,
  },
  coil: {
    kind: 'coil', name: 'Cuộn dây', short: 'Cuộn dây', group: 'Từ – Điện',
    w: 96, h: 58, elec: 'coil', value: 6, unit: 'Ω',
    terminals: [T('a', 24, 46, 'neg', 'Chốt A'), T('b', 72, 46, 'pos', 'Chốt B')],
    desc: 'Cuộn dây đồng — tạo từ trường khi có dòng điện, dùng cho thí nghiệm cảm ứng.',
    onBoard: true,
  },
  ammeter: {
    kind: 'ammeter', name: 'Ampe kế (0 – 3A)', short: 'Ampe kế', group: 'Đo lường',
    w: 104, h: 106, elec: 'ammeter', value: 0.05, unit: 'Ω',
    terminals: [T('neg', 30, 92, 'neg', 'Chốt (−)'), T('pos', 74, 92, 'pos', 'Chốt (+)')],
    desc: 'Đo cường độ dòng điện. BẮT BUỘC mắc NỐI TIẾP, dòng vào chốt (+).',
    onBoard: true,
  },
  voltmeter: {
    kind: 'voltmeter', name: 'Vôn kế (0 – 15V)', short: 'Vôn kế', group: 'Đo lường',
    w: 104, h: 106, elec: 'voltmeter', value: 2_000_000, unit: 'Ω',
    terminals: [T('neg', 30, 92, 'neg', 'Chốt (−)'), T('pos', 74, 92, 'pos', 'Chốt (+)')],
    desc: 'Đo hiệu điện thế. BẮT BUỘC mắc SONG SONG với đoạn mạch cần đo.',
    onBoard: true,
  },
  galvanometer: {
    kind: 'galvanometer', name: 'Gavanô kế', short: 'Gavanô kế', group: 'Đo lường',
    w: 104, h: 106, elec: 'galvanometer', value: 5, unit: 'Ω',
    terminals: [T('neg', 30, 92, 'neg', 'Chốt (−)'), T('pos', 74, 92, 'pos', 'Chốt (+)')],
    desc: 'Điện kế số 0 ở giữa — phát hiện dòng điện rất nhỏ và xác định chiều dòng.',
    onBoard: true,
  },
  multimeter: {
    kind: 'multimeter', name: 'Đồng hồ vạn năng số', short: 'Đồng hồ vạn năng', group: 'Đo lường',
    w: 158, h: 268, elec: 'voltmeter',
    terminals: [T('com', 79, 241, 'neg', 'Cổng COM (đen)'), T('in', 128, 241, 'pos', 'Cổng VΩmA (đỏ)')],
    desc: 'Đo được V, mV, A, mA, điện trở và thông mạch. Có HOLD, REL, MAX/MIN, chọn thang tự động hoặc thủ công, đèn nền và chế độ một chiều / xoay chiều.',
    onBoard: false,
  },
};

export const PART_ORDER: PartKind[] = [
  'battery', 'battery9v', 'powersupply',
  'switch', 'switch2', 'rheostat',
  'resistor', 'lamp', 'coil',
  'multimeter', 'ammeter', 'voltmeter', 'galvanometer',
];

export interface PartLive {
  /* Bộ nguồn */
  volt?: number;
  powerOn?: boolean;
  ampReading?: string;
  voltReading?: string;
  closed?: boolean;
  knob?: number;      // 0..1 vị trí con chạy biến trở
  needle?: number;    // 0..1 độ lệch kim
  energized?: boolean;
  reading?: string;
  mode?: 'A' | 'V';
  unit?: string;
  /* Đồng hồ vạn năng */
  func?: DmmFunc;
  ac?: boolean;
  hold?: boolean;
  rel?: boolean;
  peak?: 'max' | 'min' | null;
  auto?: boolean;
  light?: boolean;
  bar?: number;       // 0..1 mức thanh vạch
}

export type DmmFunc = 'off' | 'V' | 'mV' | 'A' | 'mA' | 'ohm';

export interface DmmFuncSpec {
  id: DmmFunc;
  label: string;
  name: string;
  angle: number;
  unit: string;
  ranges: number[];
  color: string;
}

/** Bảy vị trí núm xoay, theo chiều kim đồng hồ từ OFF */
export const DMM_FUNCS: DmmFuncSpec[] = [
  { id: 'off', label: 'OFF', name: 'Tắt', angle: -135, unit: '', ranges: [], color: '#E5E7EB' },
  { id: 'V', label: 'V', name: 'Đo hiệu điện thế (V)', angle: -95, unit: 'V', ranges: [0.6, 6, 60, 600], color: '#F59E0B' },
  { id: 'mV', label: 'mV', name: 'Đo hiệu điện thế nhỏ (mV)', angle: -60, unit: 'mV', ranges: [60, 600], color: '#F59E0B' },
  { id: 'ohm', label: 'Ω', name: 'Đo điện trở (Ω)', angle: -15, unit: 'Ω', ranges: [600, 6000, 60000, 600000], color: '#22D3EE' },
  { id: 'mA', label: 'mA', name: 'Đo dòng điện nhỏ (mA)', angle: 45, unit: 'mA', ranges: [60, 600], color: '#F59E0B' },
  { id: 'A', label: 'A', name: 'Đo cường độ dòng điện (A)', angle: 95, unit: 'A', ranges: [0.6, 6, 10], color: '#F59E0B' },
];

/** Vùng bấm trên bộ nguồn điều chỉnh */
export const PS_HOTSPOTS: { id: 'power' | 'knob'; shape: 'rect' | 'circle'; x: number; y: number; w?: number; h?: number; r?: number; title: string }[] = [
  { id: 'power', shape: 'rect', x: 18, y: 90, w: 20, h: 28, title: 'Công tắc nguồn — bật / tắt bộ nguồn' },
  { id: 'knob', shape: 'circle', x: 158, y: 100, r: 15, title: 'Núm chỉnh điện áp — bấm để tăng 2V, hết thang quay về 0V' },
];

/** Hệ số phóng to thân đồng hồ vạn năng so với bản vẽ gốc */
export const DMM_SCALE = 1.34;

export type DmmButton = 'dial' | 'range' | 'rel' | 'peak' | 'light' | 'hold' | 'select';

/** Vùng bấm trên mặt máy, toạ độ cục bộ của linh kiện */
export const DMM_HOTSPOTS: { id: DmmButton; shape: 'rect' | 'circle'; x: number; y: number; w?: number; h?: number; r?: number; title: string }[] = [
  { id: 'dial', shape: 'circle', x: 59, y: 131, r: 30, title: 'Xoay núm sang chức năng kế tiếp' },
  { id: 'range', shape: 'rect', x: 11, y: 75, w: 21, h: 10, title: 'RANGE — đổi thang tự động / thủ công' },
  { id: 'rel', shape: 'rect', x: 35.5, y: 75, w: 21, h: 10, title: 'REL — lấy giá trị hiện tại làm mốc 0' },
  { id: 'peak', shape: 'rect', x: 60, y: 75, w: 21, h: 10, title: 'MAX/MIN — ghi giá trị lớn nhất, nhỏ nhất' },
  { id: 'light', shape: 'rect', x: 84.5, y: 75, w: 21, h: 10, title: 'LIGHT — bật đèn nền màn hình' },
  { id: 'hold', shape: 'circle', x: 14, y: 93, r: 7, title: 'HOLD — giữ nguyên số đọc' },
  { id: 'select', shape: 'circle', x: 104, y: 93, r: 7, title: 'SELECT — chuyển giữa một chiều và xoay chiều' },
];

/* ------------------------------------------------------------------ */
/* Các khối vẽ dùng chung                                              */
/* ------------------------------------------------------------------ */

export const PartDefs: React.FC = () => (
  <defs>
    {/* Đế nhựa: sáng ở mép trên, tối dần xuống đáy để tạo khối */}
    <linearGradient id="mlPlate" x1="0.1" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stopColor="#DAF6FD" />
      <stop offset="22%" stopColor="#A9E6F6" />
      <stop offset="60%" stopColor="#7ACFE6" />
      <stop offset="100%" stopColor="#4FA9C4" />
    </linearGradient>
    <linearGradient id="mlPlateSide" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3E9CBA" />
      <stop offset="100%" stopColor="#2A7891" />
    </linearGradient>
    <linearGradient id="mlMetal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="28%" stopColor="#E2E8F0" />
      <stop offset="62%" stopColor="#B4C0CE" />
      <stop offset="100%" stopColor="#77869A" />
    </linearGradient>
    <linearGradient id="mlFace" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="55%" stopColor="#F4F8FC" />
      <stop offset="100%" stopColor="#DFE7F0" />
    </linearGradient>
    <linearGradient id="mlLcd" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#E6EFE2" />
      <stop offset="55%" stopColor="#D2DECE" />
      <stop offset="100%" stopColor="#B4C3B0" />
    </linearGradient>
    <linearGradient id="mlBody" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stopColor="#6C7783" />
      <stop offset="35%" stopColor="#4A535D" />
      <stop offset="100%" stopColor="#2A3038" />
    </linearGradient>
    <radialGradient id="mlGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.95" />
      <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="mlBoard" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stopColor="#31589F" />
      <stop offset="55%" stopColor="#254690" />
      <stop offset="100%" stopColor="#16295C" />
    </linearGradient>

    {/* Vệt sáng lướt trên mặt nhựa bóng */}
    <linearGradient id="mlGloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.06" />
    </linearGradient>

    {/* Chốt cắm: nguồn sáng chếch trên trái */}
    <radialGradient id="mlPostRed" cx="34%" cy="28%" r="76%">
      <stop offset="0%" stopColor="#FF8F7E" />
      <stop offset="42%" stopColor="#E8402F" />
      <stop offset="100%" stopColor="#8E1508" />
    </radialGradient>
    <radialGradient id="mlPostBlack" cx="34%" cy="28%" r="76%">
      <stop offset="0%" stopColor="#7A7A7A" />
      <stop offset="42%" stopColor="#3A3A3A" />
      <stop offset="100%" stopColor="#0D0D0D" />
    </radialGradient>

    {/* Bóng đổ mềm dưới linh kiện */}
    <filter id="mlShadow" x="-30%" y="-30%" width="170%" height="180%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.28" />
    </filter>
    <filter id="mlShadowSoft" x="-30%" y="-30%" width="170%" height="180%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#0F172A" floodOpacity="0.22" />
    </filter>
    {/* Lõm vào trong: dùng cho lỗ cắm và mặt số */}
    <filter id="mlInset" x="-25%" y="-25%" width="150%" height="150%">
      <feOffset dx="0" dy="1.4" />
      <feGaussianBlur stdDeviation="1.2" result="off" />
      <feComposite in="SourceGraphic" in2="off" operator="out" result="inner" />
      <feColorMatrix in="inner" type="matrix"
        values="0 0 0 0 0.05  0 0 0 0 0.09  0 0 0 0 0.16  0 0 0 0.55 0" />
    </filter>
  </defs>
);

const Plate: React.FC<{ w: number; h: number; r?: number }> = ({ w, h, r = 9 }) => (
  <g>
    {/* bóng đổ trên bàn */}
    <ellipse cx={w / 2} cy={h - 1} rx={w / 2 - 2} ry={3.4} fill="#0F172A" opacity={0.2} />
    {/* thành bên tạo độ dày */}
    <rect x={1} y={7} width={w - 2} height={h - 8} rx={r} fill="url(#mlPlateSide)" />
    {/* mặt trên */}
    <rect x={0} y={0} width={w} height={h - 8} rx={r} fill="url(#mlPlate)" stroke="#63B8D2" strokeWidth={0.8} />
    {/* viền sáng mép trên và vệt bóng nhựa */}
    <rect x={1.6} y={1.4} width={w - 3.2} height={h - 11} rx={r - 1.4}
      fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1} />
    <rect x={5} y={2.6} width={w - 10} height={(h - 8) * 0.34} rx={4} fill="url(#mlGloss)" />
    {/* bóng nội thất ở đáy mặt trên */}
    <rect x={4} y={h - 14} width={w - 8} height={4} rx={2} fill="#1E5B72" opacity={0.16} />
  </g>
);

/** Chốt cắm kiểu vặn (binding post) */
const Post: React.FC<{ x: number; y: number; tone: 'red' | 'black' }> = ({ x, y, tone }) => {
  const grad = tone === 'red' ? 'url(#mlPostRed)' : 'url(#mlPostBlack)';
  const ring = tone === 'red' ? '#7E1206' : '#0A0A0A';
  return (
    <g transform={`translate(${x},${y})`}>
      {/* bóng đổ và chân đế kim loại */}
      <ellipse cx={0.6} cy={4.6} rx={9.8} ry={3.8} fill="#0F172A" opacity={0.3} />
      <ellipse cx={0} cy={2.2} rx={9.2} ry={4.4} fill="url(#mlMetal)" />
      <ellipse cx={0} cy={1.4} rx={9.2} ry={4.2} fill={ring} opacity={0.55} />
      {/* thân núm vặn */}
      <circle cx={0} cy={-1.2} r={8.4} fill={grad} stroke={ring} strokeWidth={0.6} />
      {/* khía nhám quanh núm */}
      <g opacity={0.28}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return (
            <line key={i}
              x1={Math.sin(a) * 5.6} y1={-1.2 - Math.cos(a) * 5.6}
              x2={Math.sin(a) * 8.1} y2={-1.2 - Math.cos(a) * 8.1}
              stroke="#000000" strokeWidth={0.8} />
          );
        })}
      </g>
      {/* lỗ cắm ở giữa và điểm sáng cao */}
      <circle cx={0} cy={-1.2} r={3.1} fill="#120C0A" />
      <circle cx={0} cy={-1.9} r={3.1} fill="#000000" opacity={0.55} />
      <ellipse cx={-2.8} cy={-4.6} rx={2.9} ry={2} fill="#FFFFFF" opacity={0.5}
        transform="rotate(-28 -2.8 -4.6)" />
    </g>
  );
};

const Screw: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <circle cy={0.6} r={3.3} fill="#0F172A" opacity={0.22} />
    <circle r={3.2} fill="url(#mlMetal)" stroke="#8496A8" strokeWidth={0.5} />
    <path d="M-2 0 H2" stroke="#5A6B7C" strokeWidth={1} strokeLinecap="round" />
    <circle cx={-1} cy={-1.1} r={1} fill="#FFFFFF" opacity={0.6} />
  </g>
);

/** Mặt đồng hồ kim: vạch chia đều, con số lớn đặt ngay dưới từng vạch chính */
const DialFace: React.FC<{
  symbol: string;
  color: string;
  needle: number;
  centerZero?: boolean;
  marks: string[];
  unit: string;
}> = ({ symbol, color, needle, centerZero, marks, unit }) => {
  const frac = Math.max(0, Math.min(1, needle));
  const start = centerZero ? -52 : -62;
  const end = centerZero ? 52 : 62;
  const angle = start + frac * (end - start);

  const CX = 52, CY = 59;
  const R_OUT = 43, R_MAJ = 36, R_MIN = 39, R_LABEL = 26;
  const majors = marks.length - 1;
  const minorPer = majors <= 3 ? 5 : 2;
  const totalTicks = majors * minorPer;

  const pos = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
  };

  return (
    <g>
      {/* khung kính lõm vào thân máy */}
      <rect x={7} y={3} width={90} height={64} rx={6} fill="#6E7F8F" />
      <rect x={8} y={4} width={88} height={62} rx={5} fill="#AFBECC" />
      <rect x={10} y={6} width={84} height={58} rx={4} fill="url(#mlFace)" stroke="#93A3B3" strokeWidth={0.6} />
      {/* bóng nội thất phía trên mặt số */}
      <path d="M12 8 H92 A3 3 0 0 1 94 11 V16 Q52 8 10 16 V11 A3 3 0 0 1 12 8 Z"
        fill="#5B6B7B" opacity={0.16} />

      {/* cung chia độ */}
      <path
        d={`M ${pos(start, R_OUT).x} ${pos(start, R_OUT).y} A ${R_OUT} ${R_OUT} 0 0 1 ${pos(end, R_OUT).x} ${pos(end, R_OUT).y}`}
        fill="none" stroke="#334155" strokeWidth={1.2} />

      {/* vạch chia */}
      {Array.from({ length: totalTicks + 1 }, (_, i) => {
        const deg = start + (i * (end - start)) / totalTicks;
        const major = i % minorPer === 0;
        const a = pos(deg, R_OUT), b = pos(deg, major ? R_MAJ : R_MIN);
        return (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={major ? '#111827' : '#475569'} strokeWidth={major ? 1.9 : 0.9} strokeLinecap="round" />
        );
      })}

      {/* con số ngay dưới vạch chính */}
      {marks.map((mk, i) => {
        const deg = start + (i * (end - start)) / majors;
        const q = pos(deg, R_LABEL);
        return (
          <text key={mk + i} x={q.x} y={q.y + 3} textAnchor="middle"
            fontSize={8.4} fontWeight={800} fill="#0F172A">
            {i === marks.length - 1 ? `${mk} ${unit}` : mk}
          </text>
        );
      })}

      <text x={19} y={62} textAnchor="middle" fontSize={15} fontWeight={700} fill={color} fontFamily="serif">{symbol}</text>
      <text x={84} y={62} textAnchor="middle" fontSize={7} fontWeight={800} fill="#64748B">DC</text>

      {/* kim có bóng đổ nhẹ trên mặt số */}
      <g className="ml-needle" style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${angle}deg)` }}>
        <line x1={CX + 0.8} y1={CY + 1} x2={CX + 0.8} y2={CY - R_OUT + 3}
          stroke="#0F172A" strokeOpacity={0.22} strokeWidth={2.2} strokeLinecap="round" />
        <line x1={CX} y1={CY} x2={CX} y2={CY - R_OUT + 2} stroke="#C81E1E" strokeWidth={1.8} strokeLinecap="round" />
        <line x1={CX} y1={CY} x2={CX} y2={CY + 3.4} stroke="#C81E1E" strokeWidth={2.8} strokeLinecap="round" />
      </g>
      <circle cx={CX} cy={CY} r={4.6} fill="url(#mlMetal)" stroke="#5A6B7C" strokeWidth={0.6} />
      <circle cx={CX - 1.2} cy={CY - 1.4} r={1.5} fill="#FFFFFF" opacity={0.75} />

      {/* phản chiếu trên mặt kính */}
      <path d="M12 8 H50 L22 40 H12 Z" fill="#FFFFFF" opacity={0.16} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Hình vẽ từng linh kiện                                              */
/* ------------------------------------------------------------------ */

const Art: Record<PartKind, (live: PartLive) => React.ReactNode> = {
  battery: () => (
    <g>
      <Plate w={132} h={68} />
      <rect x={16} y={14} width={100} height={20} rx={6} fill="#7FCFE4" stroke="#4FA9C4" />
      <rect x={20} y={17} width={92} height={14} rx={5} fill="#8C3B2E" />
      <rect x={20} y={17} width={92} height={5} rx={2.5} fill="#B45341" opacity={0.8} />
      <rect x={104} y={19} width={7} height={10} rx={2} fill="#D6B25A" />
      <text x={62} y={28} textAnchor="middle" fontSize={7} fontWeight={700} fill="#FBD8B0" letterSpacing={1}>12V DC</text>
      <Screw x={12} y={12} /><Screw x={120} y={12} />
      <Post x={24} y={50} tone="black" />
      <Post x={108} y={50} tone="red" />
    </g>
  ),

  battery9v: () => (
    <g>
      <rect x={4} y={12} width={80} height={50} rx={5} fill="#2B3A55" />
      <rect x={4} y={12} width={80} height={16} rx={5} fill="#3D5273" />
      <rect x={10} y={18} width={68} height={30} rx={3} fill="#152238" opacity={0.55} />
      <text x={44} y={34} textAnchor="middle" fontSize={11} fontWeight={800} fill="#F8FAFC">9V</text>
      <text x={44} y={44} textAnchor="middle" fontSize={5} fontWeight={700} fill="#93C5FD" letterSpacing={0.8}>ALKALINE</text>
      <rect x={22} y={6} width={10} height={8} rx={3} fill="url(#mlMetal)" />
      <rect x={56} y={6} width={12} height={8} rx={4} fill="url(#mlMetal)" />
      <rect x={0} y={56} width={88} height={16} rx={5} fill="url(#mlPlate)" />
      <Post x={26} y={58} tone="black" />
      <Post x={62} y={58} tone="red" />
    </g>
  ),

  powersupply: (live) => {
    const on = live.powerOn !== false;
    const v = live.volt ?? 12;
    return (
      <g>
        {/* thân máy */}
        <ellipse cx={95} cy={134} rx={90} ry={6} fill="#0F172A" opacity={0.22} />
        <path d="M6 26 H180 V132 H6 Z" fill="#DC2626" />
        <path d="M180 26 L204 6 V112 L180 132 Z" fill="#8E1512" />
        <path d="M34 6 H204 L180 26 H6 Z" fill="#F26761" />
        <path d="M34 6 H204 L196 12 H26 Z" fill="#FF9A94" opacity={0.6} />
        <path d="M6 26 H180 V34 H6 Z" fill="#FFFFFF" opacity={0.12} />
        <path d="M6 122 H180 V132 H6 Z" fill="#000000" opacity={0.16} />
        {/* mặt trước */}
        <rect x={14} y={35} width={158} height={90} rx={4} fill="#94A3B8" opacity={0.5} />
        <rect x={14} y={34} width={158} height={90} rx={4} fill="url(#mlFace)" stroke="#B7C3D0" strokeWidth={0.8} />

        {/* hai màn hình đỏ */}
        <rect x={39} y={39} width={56} height={26} rx={4} fill="#5B6672" opacity={0.5} />
        <rect x={40} y={40} width={54} height={24} rx={3} fill="#180808" stroke="#6B1614" strokeWidth={0.8} />
        <path d="M42 42 H92 V47 Q67 42 42 49 Z" fill="#FFFFFF" opacity={0.08} />
        <text x={88} y={58} textAnchor="end" fontSize={15} fontWeight={700}
          fill={on ? '#FF3B30' : '#4B1113'} fontFamily="ui-monospace, monospace">{on ? (live.ampReading ?? '0.00') : '---'}</text>
        <text x={99} y={58} fontSize={7} fontWeight={800} fill="#334155">A</text>

        <rect x={107} y={39} width={56} height={26} rx={4} fill="#5B6672" opacity={0.5} />
        <rect x={108} y={40} width={54} height={24} rx={3} fill="#180808" stroke="#6B1614" strokeWidth={0.8} />
        <path d="M110 42 H160 V47 Q135 42 110 49 Z" fill="#FFFFFF" opacity={0.08} />
        <text x={156} y={58} textAnchor="end" fontSize={15} fontWeight={700}
          fill={on ? '#FF3B30' : '#4B1113'} fontFamily="ui-monospace, monospace">{on ? (live.voltReading ?? v.toFixed(1)) : '---'}</text>
        <text x={166} y={58} fontSize={7} fontWeight={800} fill="#334155">V</text>

        <circle cx={101} cy={36} r={3} fill={on ? '#FBBF24' : '#94A3B8'} />
        <text x={101} y={31} textAnchor="middle" fontSize={4.2} fill="#64748B" fontWeight={700}>Overload</text>

        <text x={93} y={78} textAnchor="middle" fontSize={7.4} fontWeight={800} fill="#B91C1C" fontStyle="italic">Regulated</text>
        <text x={93} y={86} textAnchor="middle" fontSize={4.6} fontWeight={700} fill="#475569">BIẾN ÁP NGUỒN AC/DC</text>

        {/* công tắc nguồn */}
        <rect x={20} y={93} width={16} height={24} rx={3} fill="#0B1116" opacity={0.5} />
        <rect x={20} y={92} width={16} height={24} rx={3} fill="url(#mlBody)" stroke="#4B5563" strokeWidth={0.6} />
        <rect x={22} y={on ? 94 : 104} width={12} height={11} rx={2} fill={on ? '#EF4444' : '#9CA3AF'} />
        <rect x={23} y={on ? 95 : 105} width={10} height={3.4} rx={1.7} fill="#FFFFFF" opacity={0.35} />
        <text x={17} y={99} fontSize={5} fontWeight={800} fill="#334155">I</text>
        <text x={17} y={116} fontSize={5} fontWeight={800} fill="#334155">O</text>

        {/* cổng AC */}
        {[52, 72].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={105} r={6.6} fill="#0F172A" opacity={0.4} />
            <circle cx={cx} cy={104} r={6} fill="#1D4ED8" stroke="#16307A" strokeWidth={1.5} />
            <circle cx={cx} cy={104} r={2.4} fill="#0A1330" />
            <ellipse cx={cx - 1.8} cy={101.4} rx={2} ry={1.3} fill="#FFFFFF" opacity={0.4}
              transform={`rotate(-30 ${cx - 1.8} 101.4)`} />
          </g>
        ))}
        <text x={62} y={120} textAnchor="middle" fontSize={4.6} fontWeight={700} fill="#475569">AC 12V</text>

        {/* núm chỉnh điện áp */}
        <circle cx={158} cy={102} r={13.5} fill="#0F172A" opacity={0.4} />
        <circle cx={158} cy={100} r={13} fill="url(#mlBody)" stroke="#5A6673" strokeWidth={0.8} />
        <ellipse cx={154} cy={95.4} rx={5.4} ry={3.2} fill="#FFFFFF" opacity={0.18} transform="rotate(-30 154 95.4)" />
        <g className="ml-knob" style={{ transformOrigin: '158px 100px', transform: `rotate(${-140 + (v / 12) * 280}deg)` }}>
          <rect x={156.5} y={89} width={3} height={9} rx={1.5} fill="#F8FAFC" />
        </g>
        <text x={158} y={120} textAnchor="middle" fontSize={4.6} fontWeight={700} fill="#475569">0 – 12V DC</text>

        {/* cổng DC nối ra mạch */}
        <text x={119} y={98} textAnchor="middle" fontSize={5} fontWeight={800} fill="#475569">DC OUT</text>
        <Post x={98} y={116} tone="black" />
        <Post x={140} y={116} tone="red" />
      </g>
    );
  },



  switch: (live) => {
    const closed = !!live.closed;
    return (
      <g>
        <Plate w={104} h={58} />
        <rect x={16} y={12} width={72} height={18} rx={4} fill="#EAF6FA" stroke="#9FC9D6" />
        <text x={52} y={25} textAnchor="middle" fontSize={7.5} fontWeight={800} fill={closed ? '#047857' : '#B91C1C'} letterSpacing={0.6}>
          {closed ? 'ĐÓNG' : 'MỞ'}
        </text>
        <circle cx={22} cy={38} r={4} fill="url(#mlMetal)" stroke="#7B8896" />
        <circle cx={82} cy={38} r={4} fill="url(#mlMetal)" stroke="#7B8896" />
        <g className="ml-lever" style={{ transformOrigin: '22px 38px', transform: `rotate(${closed ? 0 : -32}deg)` }}>
          <rect x={20} y={34.5} width={62} height={6} rx={3} fill="url(#mlMetal)" stroke="#788696" />
          <circle cx={80} cy={37.5} r={4.5} fill="#E8402F" />
        </g>
        <Post x={22} y={44} tone="black" />
        <Post x={82} y={44} tone="red" />
      </g>
    );
  },

  switch2: (live) => {
    const closed = !!live.closed;
    return (
      <g>
        <Plate w={118} h={58} />
        <rect x={14} y={12} width={90} height={16} rx={4} fill="#EAF6FA" stroke="#9FC9D6" />
        <text x={59} y={24} textAnchor="middle" fontSize={7} fontWeight={700} fill="#0F766E">2 CHIỀU</text>
        <circle cx={59} cy={38} r={4} fill="url(#mlMetal)" stroke="#7B8896" />
        <g className="ml-lever" style={{ transformOrigin: '59px 38px', transform: `rotate(${closed ? -22 : 22}deg)` }}>
          <rect x={57} y={35} width={44} height={6} rx={3} fill="url(#mlMetal)" stroke="#788696" />
          <circle cx={99} cy={38} r={4.5} fill="#E8402F" />
        </g>
        <Post x={20} y={44} tone="black" />
        <Post x={59} y={44} tone="black" />
        <Post x={98} y={44} tone="red" />
      </g>
    );
  },

  rheostat: (live) => {
    const k = Math.max(0, Math.min(1, live.knob ?? 0.5));
    const sx = 30 + k * 78;
    return (
      <g>
        <Plate w={142} h={68} />
        <rect x={22} y={30} width={98} height={12} rx={6} fill="#C9A227" opacity={0.55} />
        {Array.from({ length: 26 }, (_, i) => (
          <line key={i} x1={24 + i * 3.8} y1={30} x2={24 + i * 3.8} y2={42} stroke="#B08A1E" strokeWidth={1.6} />
        ))}
        <rect x={20} y={20} width={102} height={5} rx={2.5} fill="url(#mlMetal)" />
        <g className="ml-slider" style={{ transform: `translate(${sx}px, 0px)` }}>
          <rect x={-8} y={12} width={16} height={26} rx={4} fill="#EAF6FA" stroke="#7FB6C8" />
          <rect x={-3} y={6} width={6} height={12} rx={3} fill="url(#mlMetal)" />
          <circle cx={0} cy={5} r={5} fill="#334155" />
        </g>
        <text x={71} y={52} textAnchor="middle" fontSize={6.5} fontWeight={700} fill="#0E7490">0 – 120Ω</text>
        <Post x={22} y={54} tone="black" />
        <Post x={118} y={54} tone="red" />
      </g>
    );
  },

  resistor: (live) => (
    <g>
      <Plate w={118} h={60} />
      <rect x={20} y={12} width={78} height={22} rx={4} fill="#DFF3E6" stroke="#7FB893" />
      <rect x={24} y={15} width={70} height={16} rx={3} fill="#8FCB9B" />
      <text x={59} y={26} textAnchor="middle" fontSize={8} fontWeight={800} fill="#14532D">100Ω 5W</text>
      <line x1={12} y1={23} x2={20} y2={23} stroke="url(#mlMetal)" strokeWidth={2.6} />
      <line x1={98} y1={23} x2={106} y2={23} stroke="url(#mlMetal)" strokeWidth={2.6} />
      {live.energized && <circle cx={59} cy={23} r={26} fill="url(#mlGlow)" opacity={0.5} />}
      <Post x={20} y={46} tone="black" />
      <Post x={98} y={46} tone="red" />
    </g>
  ),

  lamp: (live) => {
    const on = !!live.energized;
    return (
      <g>
        <Plate w={100} h={66} />
        {on && <circle cx={50} cy={20} r={30} fill="url(#mlGlow)" />}
        <path d="M42 26 Q50 4 58 26 Z" fill={on ? '#FDE68A' : '#E2E8F0'} stroke="#94A3B8" />
        <circle cx={50} cy={18} r={11} fill={on ? '#FCD34D' : '#EEF2F6'} stroke="#94A3B8" opacity={0.95} />
        <path d="M46 20 l4 -5 l4 5" fill="none" stroke={on ? '#B45309' : '#94A3B8'} strokeWidth={1.4} />
        <rect x={42} y={28} width={16} height={10} rx={2} fill="url(#mlMetal)" />
        <rect x={40} y={36} width={20} height={8} rx={2} fill="#EAF6FA" stroke="#8FC3D3" />
        <Post x={22} y={52} tone="black" />
        <Post x={78} y={52} tone="red" />
      </g>
    );
  },



  coil: (live) => (
    <g>
      <Plate w={96} h={58} />
      <rect x={20} y={12} width={56} height={22} rx={4} fill="none" stroke="url(#mlMetal)" strokeWidth={3} />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <line x1={24 + i * 6} y1={12} x2={24 + i * 6} y2={34} stroke="#8A5420" strokeWidth={3} />
          <line x1={23.2 + i * 6} y1={12} x2={23.2 + i * 6} y2={34} stroke="#D89552" strokeWidth={1.4} />
        </g>
      ))}
      {live.energized && <ellipse cx={48} cy={23} rx={34} ry={16} fill="none" stroke="#38BDF8" strokeWidth={1.6} opacity={0.8} />}
      <Post x={24} y={46} tone="black" />
      <Post x={72} y={46} tone="red" />
    </g>
  ),

  ammeter: (live) => (
    <g>
      <Plate w={104} h={106} r={10} />
      <DialFace symbol="A" color="#047857" needle={live.needle ?? 0} marks={['0', '1', '2', '3']} unit="A" />
      <text x={52} y={80} textAnchor="middle" fontSize={7.6} fontWeight={800} fill="#0E7490">AMPE KẾ · DC</text>
      <Post x={30} y={92} tone="black" />
      <Post x={74} y={92} tone="red" />
    </g>
  ),

  voltmeter: (live) => (
    <g>
      <Plate w={104} h={106} r={10} />
      <DialFace symbol="V" color="#1D4ED8" needle={live.needle ?? 0} marks={['0', '5', '10', '15']} unit="V" />
      <text x={52} y={80} textAnchor="middle" fontSize={7.6} fontWeight={800} fill="#0E7490">VÔN KẾ · DC</text>
      <Post x={30} y={92} tone="black" />
      <Post x={74} y={92} tone="red" />
    </g>
  ),

  galvanometer: (live) => (
    <g>
      <Plate w={104} h={106} r={10} />
      <DialFace symbol="G" color="#7C3AED" needle={live.needle ?? 0.5} centerZero marks={['−30', '0', '30']} unit="µA" />
      <text x={52} y={80} textAnchor="middle" fontSize={7.6} fontWeight={800} fill="#0E7490">GAVANÔ KẾ</text>
      <Post x={30} y={92} tone="black" />
      <Post x={74} y={92} tone="red" />
    </g>
  ),

  multimeter: (live) => {
    const f = live.func ?? 'V';
    const spec = DMM_FUNCS.find((x) => x.id === f) ?? DMM_FUNCS[1];
    const on = f !== 'off';
    const reading = live.reading ?? '';
    const unit = live.unit ?? spec.unit;
    const bar = Math.max(0, Math.min(1, live.bar ?? 0));
    const lcdFill = live.light ? '#E4F7A8' : 'url(#mlLcd)';
    const ind = (x: number, text: string, active: boolean) => (
      <text x={x} y={32} fontSize={4.8} fontWeight={800} fill={active ? '#1F2937' : '#AFC0A8'}>{text}</text>
    );
    return (
      <g transform={`scale(${DMM_SCALE})`}>
        <ellipse cx={59} cy={199} rx={54} ry={5} fill="#0F172A" opacity={0.24} />
        <rect x={0} y={2} width={118} height={198} rx={12} fill="#1E6D78" />
        <rect x={0} y={0} width={118} height={198} rx={12} fill="#2F9AA8" />
        <rect x={3} y={2} width={112} height={30} rx={11} fill="#4FBECC" opacity={0.5} />
        <rect x={4} y={3} width={110} height={194} rx={10} fill="url(#mlBody)" />
        <rect x={6} y={5} width={106} height={16} rx={8} fill="#FFFFFF" opacity={0.09} />
        <text x={9} y={17} fontSize={7.2} fontWeight={800} fill="#E5E7EB" letterSpacing={0.2}>ĐỒNG HỒ VẠN NĂNG</text>
        <text x={110} y={17} fontSize={4.4} fill="#9CA3AF" textAnchor="end">600V CAT II</text>

        {/* Màn hình */}
        <rect x={11} y={21} width={96} height={50} rx={5} fill="#1B222B" />
        <rect x={12} y={22} width={94} height={48} rx={4} fill={lcdFill} stroke="#3C4650" strokeWidth={0.8} />
        <path d="M14 24 H104 V30 Q59 24 14 32 Z" fill="#FFFFFF" opacity={0.28} />
        {on && (
          <>
            {ind(15, live.ac ? 'AC' : 'DC', true)}
            {ind(28, live.auto ? 'AUTO' : 'MAN', true)}
            {ind(48, 'HOLD', !!live.hold)}
            {ind(65, 'REL', !!live.rel)}
            {ind(76, live.peak === 'min' ? 'MIN' : 'MAX', !!live.peak)}
            <text x={84} y={57} textAnchor="end" fontSize={22} fontWeight={700} fill="#111827"
              fontFamily="ui-monospace, monospace" letterSpacing={-0.5}>{reading}</text>
            <text x={102} y={57} textAnchor="end" fontSize={10.5} fontWeight={800} fill="#1F2937">{unit}</text>
            <rect x={17} y={62} width={72} height={3.5} rx={1.75} fill="#00000018" />
            <rect x={17} y={62} width={72 * bar} height={3.5} rx={1.75} fill="#1F2937" />
          </>
        )}

        {/* Phím chức năng */}
        {(['RANGE', 'REL', 'MAX', 'LIGHT'] as const).map((b, i) => (
          <g key={b}>
            <rect x={11 + i * 24.5} y={76.4} width={21} height={10} rx={3} fill="#12161B" opacity={0.55} />
            <rect x={11 + i * 24.5} y={75} width={21} height={10} rx={3}
              fill={(b === 'RANGE' && !live.auto) || (b === 'REL' && live.rel) || (b === 'MAX' && live.peak) || (b === 'LIGHT' && live.light) ? '#0E7490' : '#4B5563'}
              stroke="#7A8592" strokeWidth={0.7} />
            <rect x={12.5 + i * 24.5} y={76} width={18} height={3.4} rx={1.7} fill="#FFFFFF" opacity={0.16} />
            <text x={21.5 + i * 24.5} y={82.5} textAnchor="middle" fontSize={5.4} fill="#E5E7EB" fontWeight={800}>{b}</text>
          </g>
        ))}
        <circle cx={14} cy={94.4} r={6} fill="#0B1116" opacity={0.5} />
        <circle cx={14} cy={93} r={6} fill={live.hold ? '#0EA5E9' : '#22B8CF'} stroke="#0B6C80" strokeWidth={0.6} />
        <circle cx={12.2} cy={91.2} r={2} fill="#FFFFFF" opacity={0.45} />
        <text x={23} y={95} fontSize={4.6} fontWeight={800} fill="#CBD5E1">HOLD</text>
        <circle cx={104} cy={94.4} r={6} fill="#0B1116" opacity={0.5} />
        <circle cx={104} cy={93} r={6} fill="#F59E0B" stroke="#9A6205" strokeWidth={0.6} />
        <circle cx={102.2} cy={91.2} r={2} fill="#FFFFFF" opacity={0.45} />
        <text x={95} y={95} textAnchor="end" fontSize={4.6} fontWeight={800} fill="#CBD5E1">SELECT</text>

        {/* Núm xoay */}
        <circle cx={59} cy={133.5} r={30} fill="#0B1116" opacity={0.5} />
        <circle cx={59} cy={131} r={30} fill="url(#mlMetal)" opacity={0.35} />
        <circle cx={59} cy={131} r={29} fill="#1F2937" stroke="#5A6673" strokeWidth={0.8} />
        <circle cx={59} cy={131} r={26} fill="url(#mlBody)" />
        <ellipse cx={50} cy={120} rx={13} ry={7} fill="#FFFFFF" opacity={0.14} transform="rotate(-30 50 120)" />
        <g className="ml-knob" style={{ transformOrigin: '59px 131px', transform: `rotate(${spec.angle}deg)` }}>
          <rect x={56} y={107} width={6} height={26} rx={3} fill="#111827" />
          <circle cx={59} cy={110} r={2.6} fill="#F59E0B" />
        </g>
        <circle cx={59} cy={131} r={7} fill="#4B5563" stroke="#6B7684" strokeWidth={0.6} />
        <circle cx={57.4} cy={129.4} r={2.2} fill="#FFFFFF" opacity={0.25} />
        {DMM_FUNCS.map((fn) => {
          const a = (fn.angle * Math.PI) / 180;
          const lx = 59 + 38 * Math.sin(a);
          const ly = 131 - 38 * Math.cos(a) + 2.4;
          const active = fn.id === f;
          return (
            <text key={fn.id} x={lx} y={ly} textAnchor="middle"
              fontSize={7.4} fontWeight={800}
              fill={active ? fn.color : '#94A3B8'}>{fn.label}</text>
          );
        })}
        <text x={59} y={169} textAnchor="middle" fontSize={6.2} fontWeight={800} fill="#F97316">TRUE RMS</text>

        {/* Ba cổng cắm que đo như đồng hồ thông dụng */}
        {([[30, '#B91C1C'], [59, '#9CA3AF'], [96, '#DC2626']] as [number, string][]).map(([cx, ring]) => (
          <g key={cx}>
            <circle cx={cx} cy={180.6} r={8.6} fill="#0B1116" opacity={0.55} />
            <circle cx={cx} cy={179.4} r={8} fill="url(#mlMetal)" opacity={0.4} />
            <circle cx={cx} cy={180} r={7.5} fill="#0C1017" stroke={ring} strokeWidth={2.5} />
            <circle cx={cx} cy={180} r={3.4} fill="#000000" />
            <ellipse cx={cx - 2.4} cy={176.6} rx={2.4} ry={1.5} fill="#FFFFFF" opacity={0.3}
              transform={`rotate(-30 ${cx - 2.4} 176.6)`} />
          </g>
        ))}
        <text x={30} y={192} textAnchor="middle" fontSize={5.2} fill="#E5E7EB" fontWeight={800}>10A</text>
        <text x={59} y={192} textAnchor="middle" fontSize={5.2} fill="#E5E7EB" fontWeight={800}>COM</text>
        <text x={96} y={192} textAnchor="middle" fontSize={5.2} fill="#E5E7EB" fontWeight={800}>VΩmA</text>
      </g>
    );
  },





};

export const PartArt: React.FC<{ kind: PartKind; live?: PartLive }> = ({ kind, live }) => (
  <>{Art[kind](live ?? {})}</>
);

/** Ảnh thu nhỏ dùng cho khay linh kiện & danh mục dụng cụ */
export const PartThumb: React.FC<{ kind: PartKind; size?: number; live?: PartLive }> = ({ kind, size = 56, live }) => {
  const spec = PART_CATALOG[kind];
  const pad = 4;
  return (
    <svg viewBox={`${-pad} ${-pad} ${spec.w + pad * 2} ${spec.h + pad * 2}`} width={size} height={(size * (spec.h + pad * 2)) / (spec.w + pad * 2)}>
      <PartDefs />
      <PartArt kind={kind} live={live ?? { closed: true, knob: 0.5, needle: 0.55, func: 'V', unit: 'V', auto: true, reading: '12.00' }} />
    </svg>
  );
};
