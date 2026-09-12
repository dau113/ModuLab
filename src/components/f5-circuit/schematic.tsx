/**
 * Chế độ xem sơ đồ mạch điện: vẽ lại bàn lắp bằng ký hiệu quy ước của sách
 * giáo khoa thay cho hình dạng thật của linh kiện.
 *
 * Vị trí ký hiệu giữ đúng vị trí linh kiện trên bàn lắp, còn dây nối vẽ thành
 * đoạn thẳng, nên học sinh dễ đối chiếu giữa mạch mình lắp và sơ đồ tương ứng.
 */
import React from 'react';
import { PART_CATALOG } from './parts';
import type { PartKind } from './parts';

export interface SymbolProps {
  kind: PartKind;
  /** Trạng thái cần vẽ: công tắc đóng hay mở, đèn sáng hay tắt */
  closed?: boolean;
  lit?: boolean;
  /** Độ sáng bóng đèn 0..1, dùng để tô đậm nhạt ký hiệu */
  bright?: number;
  /** Vai trò của đồng hồ vạn năng theo núm xoay */
  role?: 'ammeter' | 'voltmeter' | 'inert';
  faulty?: boolean;
}

/** Bề rộng chuẩn của một ký hiệu; hai chốt nằm ở hai đầu */
export const SYM_W = 92;
export const SYM_H = 56;

const STROKE = '#1E293B';

/** Ký hiệu quy ước của từng loại linh kiện, vẽ trong khung SYM_W × SYM_H */
export const Symbol: React.FC<SymbolProps> = ({ kind, closed, lit, bright = 0, role, faulty }) => {
  const cx = SYM_W / 2;
  const cy = SYM_H / 2;
  const color = faulty ? '#DC2626' : STROKE;
  const lead = (x1: number, x2: number) => (
    <line x1={x1} y1={cy} x2={x2} y2={cy} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  );

  switch (kind) {
    /* Nguồn điện: vạch dài là cực dương, vạch ngắn là cực âm */
    case 'battery':
    case 'battery9v':
    case 'powersupply':
      return (
        <g>
          {lead(0, cx - 9)}{lead(cx + 9, SYM_W)}
          <line x1={cx - 9} y1={cy - 15} x2={cx - 9} y2={cy + 15} stroke={color} strokeWidth={3} />
          <line x1={cx + 9} y1={cy - 8} x2={cx + 9} y2={cy + 8} stroke={color} strokeWidth={5} />
          <text x={cx - 16} y={cy - 20} textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>−</text>
          <text x={cx + 16} y={cy - 20} textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>+</text>
        </g>
      );

    /* Điện trở: hình chữ nhật rỗng */
    case 'resistor':
      return (
        <g>
          {lead(0, cx - 22)}{lead(cx + 22, SYM_W)}
          <rect x={cx - 22} y={cy - 11} width={44} height={22} fill="#FFFFFF" stroke={color} strokeWidth={2.2} />
        </g>
      );

    /* Biến trở: điện trở có mũi tên chỉ vào */
    case 'rheostat':
      return (
        <g>
          {lead(0, cx - 22)}{lead(cx + 22, SYM_W)}
          <rect x={cx - 22} y={cy - 11} width={44} height={22} fill="#FFFFFF" stroke={color} strokeWidth={2.2} />
          <line x1={cx - 16} y1={cy + 20} x2={cx + 14} y2={cy - 17} stroke={color} strokeWidth={2.2} />
          <path d={`M ${cx + 14} ${cy - 17} l -8 1 l 4 6 z`} fill={color} />
        </g>
      );

    /* Công tắc: cần gạt hạ xuống khi đóng */
    case 'switch':
      return (
        <g>
          {lead(0, cx - 18)}{lead(cx + 18, SYM_W)}
          <circle cx={cx - 18} cy={cy} r={3.2} fill={color} />
          <circle cx={cx + 18} cy={cy} r={3.2} fill={color} />
          <line x1={cx - 18} y1={cy} x2={cx + 18} y2={closed ? cy : cy - 17}
            stroke={color} strokeWidth={2.6} strokeLinecap="round" />
          <text x={cx} y={cy + 24} textAnchor="middle" fontSize={12} fontWeight={700} fill={color}>K</text>
        </g>
      );

    /* Công tắc hai chiều: cực chung ở giữa, gạt về một trong hai bên */
    case 'switch2':
      return (
        <g>
          {lead(0, cx - 20)}
          <circle cx={cx - 20} cy={cy} r={3.2} fill={color} />
          <circle cx={cx + 20} cy={cy - 14} r={3.2} fill={color} />
          <circle cx={cx + 20} cy={cy + 14} r={3.2} fill={color} />
          <line x1={cx + 20} y1={cy - 14} x2={SYM_W} y2={cy - 14} stroke={color} strokeWidth={2.2} />
          <line x1={cx + 20} y1={cy + 14} x2={SYM_W} y2={cy + 14} stroke={color} strokeWidth={2.2} />
          <line x1={cx - 20} y1={cy} x2={cx + 20} y2={closed ? cy + 14 : cy - 14}
            stroke={color} strokeWidth={2.6} strokeLinecap="round" />
        </g>
      );

    /* Bóng đèn: vòng tròn có dấu nhân */
    case 'lamp':
      return (
        <g>
          {lead(0, cx - 15)}{lead(cx + 15, SYM_W)}
          <circle cx={cx} cy={cy} r={15}
            fill={lit || bright > 0.02 ? '#FEF3C7' : '#FFFFFF'}
            fillOpacity={lit || bright > 0.02 ? 0.25 + bright * 0.75 : 1}
            stroke={color} strokeWidth={2.2} />
          {bright > 0.05 && (
            <circle cx={cx} cy={cy} r={15 + bright * 9} fill="#FDE68A" opacity={bright * 0.45} />
          )}
          <path d={`M ${cx - 10.6} ${cy - 10.6} L ${cx + 10.6} ${cy + 10.6}
                    M ${cx + 10.6} ${cy - 10.6} L ${cx - 10.6} ${cy + 10.6}`}
            stroke={color} strokeWidth={2} />
        </g>
      );

    /* Đèn LED: điốt có hai mũi tên chỉ ra ngoài */
    case 'led':
      return (
        <g>
          {lead(0, cx - 12)}{lead(cx + 12, SYM_W)}
          <path d={`M ${cx - 12} ${cy - 11} L ${cx + 12} ${cy} L ${cx - 12} ${cy + 11} Z`}
            fill={bright > 0.02 ? '#FDE68A' : '#FFFFFF'} fillOpacity={0.3 + bright * 0.7}
            stroke={color} strokeWidth={2.2} />
          <line x1={cx + 12} y1={cy - 12} x2={cx + 12} y2={cy + 12} stroke={color} strokeWidth={2.4} />
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${i * 9}, 0)`}>
              <line x1={cx - 2} y1={cy - 15} x2={cx + 6} y2={cy - 24} stroke={color} strokeWidth={1.8} />
              <path d={`M ${cx + 6} ${cy - 24} l -5 1 l 2 4 z`} fill={color} />
            </g>
          ))}
        </g>
      );

    /* Cuộn dây: bốn nửa vòng tròn liền nhau */
    case 'coil':
      return (
        <g>
          {lead(0, cx - 24)}{lead(cx + 24, SYM_W)}
          <path d={`M ${cx - 24} ${cy} a 6 6 0 0 1 12 0 a 6 6 0 0 1 12 0 a 6 6 0 0 1 12 0 a 6 6 0 0 1 12 0`}
            fill="none" stroke={color} strokeWidth={2.2} />
        </g>
      );

    /* Dụng cụ đo: vòng tròn có chữ A hoặc V */
    case 'ammeter':
    case 'voltmeter':
    case 'multimeter': {
      const letter = kind === 'ammeter' ? 'A'
        : kind === 'voltmeter' ? 'V'
          : role === 'ammeter' ? 'A' : role === 'voltmeter' ? 'V' : '?';
      const tone = letter === 'A' ? '#0E7490' : letter === 'V' ? '#1D4ED8' : '#64748B';
      return (
        <g>
          {lead(0, cx - 17)}{lead(cx + 17, SYM_W)}
          <circle cx={cx} cy={cy} r={17} fill="#FFFFFF" stroke={faulty ? '#DC2626' : tone} strokeWidth={2.4} />
          <text x={cx} y={cy + 6} textAnchor="middle" fontSize={16} fontWeight={800}
            fill={faulty ? '#DC2626' : tone}>{letter}</text>
        </g>
      );
    }

    default:
      return (
        <g>
          {lead(0, SYM_W)}
          <rect x={cx - 18} y={cy - 10} width={36} height={20} fill="#FFFFFF" stroke={color} strokeWidth={2} />
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fill={color}>
            {PART_CATALOG[kind].short}
          </text>
        </g>
      );
  }
};

/** Vị trí hai chốt của ký hiệu, tính theo khung SYM_W × SYM_H */
export const symbolTerminal = (kind: PartKind, index: number) => {
  if (kind === 'switch2') {
    return index === 0
      ? { x: 0, y: SYM_H / 2 }
      : { x: SYM_W, y: SYM_H / 2 + (index === 1 ? -14 : 14) };
  }
  return { x: index === 0 ? 0 : SYM_W, y: SYM_H / 2 };
};

/* ------------------------------------------------------------------ */
/* Tự sắp xếp lại mạch thành sơ đồ hình chữ nhật như vẽ trên giấy      */
/* ------------------------------------------------------------------ */

/** Một nhánh lấy từ kết quả mô phỏng, chỉ cần các thông tin để sắp xếp */
export interface GraphBranch {
  compId: string;
  kind: PartKind;
  na: number;
  nb: number;
}

export interface PlacedSymbol {
  compId: string;
  kind: PartKind;
  /** Góc trên trái của khung ký hiệu */
  x: number;
  y: number;
  /** Xoay 90° cho các ký hiệu nằm trên cạnh dọc */
  vertical: boolean;
  /** Hai đầu dây của ký hiệu, đã tính sẵn theo toạ độ sơ đồ */
  a: { x: number; y: number };
  b: { x: number; y: number };
}

export interface SchematicLayout {
  symbols: PlacedSymbol[];
  /** Các đoạn dây nối, vẽ vuông góc như sơ đồ trên giấy */
  paths: { id: string; points: { x: number; y: number }[] }[];
  /** Linh kiện không nằm trong mạch kín nào */
  orphans: string[];
}

/* Khung sơ đồ */
const FRAME = { x: 150, y: 170, w: 560, h: 300 };
const SHUNT_DROP = 110;   // nhánh song song vẽ thấp hơn cạnh chính chừng này

/** Đặt một ký hiệu nằm ngang, tâm tại (cx, cy) */
const placeH = (b: GraphBranch, cx: number, cy: number, flip: boolean): PlacedSymbol => {
  const x = cx - SYM_W / 2;
  const y = cy - SYM_H / 2;
  const left = { x, y: cy };
  const right = { x: x + SYM_W, y: cy };
  return { compId: b.compId, kind: b.kind, x, y, vertical: false, a: flip ? right : left, b: flip ? left : right };
};

/** Đặt một ký hiệu nằm dọc, tâm tại (cx, cy) */
const placeV = (b: GraphBranch, cx: number, cy: number, flip: boolean): PlacedSymbol => {
  const x = cx - SYM_W / 2;
  const y = cy - SYM_H / 2;
  const top = { x: cx, y: cy - SYM_W / 2 };
  const bottom = { x: cx, y: cy + SYM_W / 2 };
  return { compId: b.compId, kind: b.kind, x, y, vertical: true, a: flip ? bottom : top, b: flip ? top : bottom };
};

/** Đường gấp khúc vuông góc nối hai điểm, đi ngang trước rồi mới đi dọc */
const elbow = (p: { x: number; y: number }, q: { x: number; y: number }) => {
  if (Math.abs(p.x - q.x) < 1 || Math.abs(p.y - q.y) < 1) return [p, q];
  return [p, { x: q.x, y: p.y }, q];
};

/**
 * Sắp xếp mạch thành sơ đồ: nguồn nằm ở cạnh trái, các linh kiện còn lại của
 * vòng mạch chính trải đều trên cạnh trên và cạnh dưới, dây nối vẽ vuông góc.
 * Nhánh mắc song song (thường là vôn kế) được vẽ tụt xuống dưới linh kiện mà
 * nó đo, đúng như cách vẽ trong sách.
 */
export function layoutSchematic(branches: GraphBranch[], sourceIds: string[]): SchematicLayout {
  const symbols: PlacedSymbol[] = [];
  const paths: { id: string; points: { x: number; y: number }[] }[] = [];

  const source = branches.find((b) => sourceIds.includes(b.compId));
  if (!source) {
    /* Chưa có nguồn: xếp tạm thành hàng ngang cho dễ nhìn */
    branches.forEach((b, i) => symbols.push(placeH(b, FRAME.x + 120 + i * 150, FRAME.y, false)));
    return { symbols, paths, orphans: [] };
  }

  /* Tìm vòng mạch chính: đi từ cực này của nguồn vòng về cực kia */
  const adj = new Map<number, GraphBranch[]>();
  branches.forEach((b) => {
    if (b.compId === source.compId) return;
    [b.na, b.nb].forEach((n) => {
      if (!adj.has(n)) adj.set(n, []);
      adj.get(n)!.push(b);
    });
  });

  const loop: { br: GraphBranch; flip: boolean }[] = [];
  const used = new Set<string>();
  const walk = (node: number): boolean => {
    if (node === source.na) return true;
    for (const b of adj.get(node) ?? []) {
      if (used.has(b.compId)) continue;
      used.add(b.compId);
      const next = b.na === node ? b.nb : b.na;
      loop.push({ br: b, flip: b.nb === node });
      if (walk(next)) return true;
      loop.pop();
      used.delete(b.compId);
    }
    return false;
  };
  walk(source.nb);

  const loopIds = new Set(loop.map((l) => l.br.compId));
  const inLoopNodes = new Set<number>([source.na, source.nb]);
  loop.forEach((l) => { inLoopNodes.add(l.br.na); inLoopNodes.add(l.br.nb); });

  /* Nguồn đặt dọc ở cạnh trái */
  const leftX = FRAME.x;
  const rightX = FRAME.x + FRAME.w;
  const topY = FRAME.y;
  const botY = FRAME.y + FRAME.h;
  const midY = (topY + botY) / 2;

  const srcSym = placeV(source, leftX, midY, true);   // dòng đi ra từ đầu trên
  symbols.push(srcSym);

  /* Chia linh kiện vòng chính cho cạnh trên và cạnh dưới */
  const half = Math.ceil(loop.length / 2);
  const top = loop.slice(0, half);
  const bottom = loop.slice(half);

  const spread = (n: number, i: number) => {
    const span = FRAME.w;
    return leftX + (span * (i + 1)) / (n + 1);
  };

  const topSyms = top.map((l, i) => placeH(l.br, spread(top.length, i), topY, l.flip));
  const botSyms = bottom.map((l, i) =>
    placeH(l.br, spread(bottom.length, bottom.length - 1 - i), botY, !l.flip));
  symbols.push(...topSyms, ...botSyms);

  /* Nối thành vòng: nguồn → cạnh trên → cạnh phải → cạnh dưới → về nguồn */
  const chain: { x: number; y: number }[][] = [];
  let cursor = srcSym.a;                       // đầu ra của nguồn (phía trên)
  chain.push(elbow(cursor, { x: leftX, y: topY }));
  cursor = { x: leftX, y: topY };

  topSyms.forEach((sym) => {
    chain.push([cursor, sym.a]);
    cursor = sym.b;
  });
  chain.push([cursor, { x: rightX, y: topY }]);
  chain.push([{ x: rightX, y: topY }, { x: rightX, y: botY }]);
  cursor = { x: rightX, y: botY };

  botSyms.forEach((sym) => {
    chain.push([cursor, sym.a]);
    cursor = sym.b;
  });
  chain.push([cursor, { x: leftX, y: botY }]);
  chain.push(elbow({ x: leftX, y: botY }, srcSym.b));

  chain.forEach((pts, i) => paths.push({ id: `ring-${i}`, points: pts }));

  /* Nhánh mắc song song: vẽ tụt xuống dưới linh kiện mà nó đo */
  const orphans: string[] = [];
  branches.forEach((b) => {
    if (b.compId === source.compId || loopIds.has(b.compId)) return;
    if (!inLoopNodes.has(b.na) || !inLoopNodes.has(b.nb)) { orphans.push(b.compId); return; }

    /* Tìm linh kiện trên vòng có cùng hai nút — đó là thứ đang được đo */
    const host = symbols.find((sy) => {
      const l = loop.find((x) => x.br.compId === sy.compId);
      if (!l) return false;
      return (l.br.na === b.na && l.br.nb === b.nb) || (l.br.na === b.nb && l.br.nb === b.na);
    });
    const cx = host ? host.x + SYM_W / 2 : (leftX + rightX) / 2;
    const cy = (host ? host.y + SYM_H / 2 : topY) + SHUNT_DROP;
    const sym = placeH(b, cx, cy, false);
    symbols.push(sym);

    const hostA = host ? host.a : { x: cx - SYM_W, y: topY };
    const hostB = host ? host.b : { x: cx + SYM_W, y: topY };
    paths.push({ id: `shunt-a-${b.compId}`, points: [hostA, { x: hostA.x, y: cy }, sym.a] });
    paths.push({ id: `shunt-b-${b.compId}`, points: [hostB, { x: hostB.x, y: cy }, sym.b] });
  });

  return { symbols, paths, orphans };
}
