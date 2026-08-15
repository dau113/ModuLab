/**
 * Bộ giải mạch một chiều (phân tích nút) + bộ luật kiểm tra cách đấu nối.
 * Mọi kết quả đo đều tính ra từ tô-pô thật của mạch, không phụ thuộc vị trí đặt linh kiện.
 */
import { PART_CATALOG } from './parts';
import type { PartKind, ElecKind, DmmFunc } from './parts';

export interface TermRef { c: string; t: string }

export interface PlacedPart {
  id: string;
  kind: PartKind;
  x: number;
  y: number;
  closed?: boolean;   // công tắc
  knob?: number;      // biến trở 0..1
  /* Đồng hồ vạn năng */
  func?: DmmFunc;     // vị trí núm xoay
  ac?: boolean;       // thang xoay chiều
  hold?: boolean;     // giữ số đọc
  held?: string;      // số đọc đã giữ
  rel?: number | null;// giá trị mốc của phím REL
  peak?: 'max' | 'min' | null;
  rangeIdx?: number | null; // null = tự động chọn thang
  light?: boolean;
  /* Bộ nguồn điều chỉnh */
  volt?: number;      // điện áp đặt (V)
  powerOn?: boolean;  // công tắc nguồn
}

export interface Wire {
  id: string;
  from: TermRef;
  to: TermRef;
  /** Mã màu dây (hex) */
  color: string;
  /** Các điểm bẻ cong do người dùng kéo ra, theo thứ tự từ đầu from đến đầu to */
  points?: { x: number; y: number }[];
}

export interface Branch {
  compId: string;
  kind: PartKind;
  elec: ElecKind;
  na: number;
  nb: number;
  R: number;
  E: number;
  I: number;  // dòng từ a → b (A)
  V: number;  // hiệu điện thế Va − Vb (V)
}

export interface SimResult {
  branches: Branch[];
  node: Record<string, number>;
  voltages: number[];
  nodeCount: number;
}

export const termKey = (c: string, t: string) => `${c}|${t}`;

/** Suất điện động thực tế của một nguồn (bộ nguồn có núm chỉnh riêng) */
export function sourceEmf(p: PlacedPart): number {
  if (p.kind === 'powersupply') return p.powerOn === false ? 0 : (p.volt ?? 12);
  return PART_CATALOG[p.kind].value ?? 0;
}

/** Điện trở tương đương của từng linh kiện */
export function branchResistance(p: PlacedPart, rxTrue: number): number {
  const spec = PART_CATALOG[p.kind];
  switch (effectiveElec(p)) {
    case 'source':
      if (p.kind === 'powersupply') return p.powerOn === false ? 1e11 : 0.2;
      if (p.kind === 'battery9v') return 1;
      return 0.5;
    case 'resistor': return p.kind === 'resistor' ? rxTrue : (spec.value ?? 100);
    case 'rheostat': return 0.4 + (p.knob ?? 0.5) * (spec.value ?? 120);
    case 'switch': return p.closed ? 2e-3 : 1e11;
    case 'lamp': return spec.value ?? 30;
    case 'coil': return spec.value ?? 6;
    case 'galvanometer': return spec.value ?? 5;
    case 'ammeter': return p.kind === 'multimeter' ? (p.func === 'mA' ? 1.8 : 0.02) : 0.05;
    case 'voltmeter': return 2e6;
    case 'inert': return 1e11;
    default: return 1e11;
  }
}

/** Vai trò điện học thực tế (đồng hồ vạn năng đổi vai theo núm xoay) */
export function effectiveElec(p: PlacedPart): ElecKind {
  if (p.kind !== 'multimeter') return PART_CATALOG[p.kind].elec;
  switch (p.func ?? 'V') {
    case 'A': case 'mA': return 'ammeter';
    case 'V': case 'mV': return 'voltmeter';
    case 'ohm': return 'voltmeter'; // trở kháng vào rất lớn khi cắm vào mạch
    default: return 'inert';                     // núm ở OFF: coi như hở mạch
  }
}

function branchTerminals(p: PlacedPart): [string, string] | null {
  const spec = PART_CATALOG[p.kind];
  if (spec.terminals.length < 2) return null;
  if (p.kind === 'switch2') return ['c', p.closed ? 'b' : 'a'];
  return [spec.terminals[0].id, spec.terminals[1].id];
}

/** Giải hệ G·v = i bằng khử Gauss có chọn trụ */
function solveLinear(G: number[][], I: number[]): number[] {
  const n = I.length;
  const A = G.map((row, r) => [...row, I[r]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    if (Math.abs(A[piv][col]) < 1e-18) continue;
    [A[col], A[piv]] = [A[piv], A[col]];
    const d = A[col][col];
    for (let c = col; c <= n; c++) A[col][c] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = A[r][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) A[r][c] -= f * A[col][c];
    }
  }
  return Array.from({ length: n }, (_, r) => (Number.isFinite(A[r][n]) ? A[r][n] : 0));
}

export interface SimOptions {
  /** Triệt tiêu suất điện động của mọi nguồn, chỉ giữ điện trở trong (dùng khi đo điện trở) */
  zeroSources?: boolean;
  /** Bỏ qua nhánh của các linh kiện này */
  exclude?: string[];
  /** Bơm dòng thử vào hai chốt: dòng đi vào nút a và ra khỏi nút b */
  inject?: { a: string; b: string; I: number };
  /** Chốt được chọn làm nút đất */
  groundKey?: string;
}

export function simulate(parts: PlacedPart[], wires: Wire[], rxTrue: number, opts: SimOptions = {}): SimResult {
  /* 1. Gộp các chốt được nối dây thành cùng một nút (union-find) */
  const parent: Record<string, string> = {};
  const find = (a: string): string => {
    if (parent[a] === undefined) parent[a] = a;
    return parent[a] === a ? a : (parent[a] = find(parent[a]));
  };
  const union = (a: string, b: string) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };

  parts.forEach((p) => PART_CATALOG[p.kind].terminals.forEach((t) => find(termKey(p.id, t.id))));
  wires.forEach((w) => union(termKey(w.from.c, w.from.t), termKey(w.to.c, w.to.t)));

  const node: Record<string, number> = {};
  let nodeCount = 0;
  Object.keys(parent).forEach((k) => {
    const r = find(k);
    if (node[r] === undefined) node[r] = nodeCount++;
    node[k] = node[r];
  });

  /* 2. Lập danh sách nhánh */
  const branches: Branch[] = [];
  parts.forEach((p) => {
    const elec = effectiveElec(p);
    if (elec === 'inert') return;
    const pair = branchTerminals(p);
    if (!pair) return;
    const na = node[termKey(p.id, pair[0])];
    const nb = node[termKey(p.id, pair[1])];
    if (na === undefined || nb === undefined || na === nb) return;
    if (opts.exclude?.includes(p.id)) return;
    branches.push({
      compId: p.id, kind: p.kind, elec, na, nb,
      R: branchResistance(p, rxTrue),
      E: elec === 'source' && !opts.zeroSources ? sourceEmf(p) : 0,
      I: 0, V: 0,
    });
  });

  /* 3. Chọn nút đất: cực âm của nguồn đầu tiên */
  const src = branches.find((b) => b.elec === 'source');
  const gk = opts.groundKey !== undefined ? node[opts.groundKey] : undefined;
  const ground = gk !== undefined ? gk : (src ? src.na : 0);

  /* 4. Ma trận dẫn nạp (nguồn quy đổi Norton: I = E/r song song r) */
  const n = nodeCount;
  const G: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const Iv: number[] = new Array(n).fill(0);
  for (let k = 0; k < n; k++) G[k][k] += 1e-11; // rò rất nhỏ chống suy biến

  branches.forEach((b) => {
    const g = 1 / b.R;
    G[b.na][b.na] += g; G[b.nb][b.nb] += g;
    G[b.na][b.nb] -= g; G[b.nb][b.na] -= g;
    if (b.E) { const isc = b.E / b.R; Iv[b.nb] += isc; Iv[b.na] -= isc; }
  });

  if (opts.inject) {
    const ia = node[opts.inject.a];
    const ib = node[opts.inject.b];
    if (ia !== undefined && ib !== undefined) { Iv[ia] += opts.inject.I; Iv[ib] -= opts.inject.I; }
  }

  /* 5. Bỏ hàng/cột nút đất rồi giải */
  const idx = Array.from({ length: n }, (_, i) => i).filter((i) => i !== ground);
  const Gr = idx.map((r) => idx.map((c) => G[r][c]));
  const Ir = idx.map((r) => Iv[r]);
  const vr = idx.length ? solveLinear(Gr, Ir) : [];
  const voltages = new Array(n).fill(0);
  idx.forEach((nd, i) => { voltages[nd] = vr[i] ?? 0; });

  branches.forEach((b) => {
    b.V = voltages[b.na] - voltages[b.nb];
    b.I = b.E ? (b.E - (voltages[b.nb] - voltages[b.na])) / b.R : b.V / b.R;
    if (b.E) b.I = (b.E - (voltages[b.nb] - voltages[b.na])) / b.R;
  });

  return { branches, node, voltages, nodeCount };
}

/**
 * Đo điện trở giữa hai que đo của một đồng hồ: ngắt nguồn (chỉ còn điện trở trong),
 * bỏ nhánh của chính đồng hồ, bơm dòng thử 1mA rồi lấy R = U/I.
 * Trả về null nếu hai que đo hở mạch (màn hình báo OL).
 */
export function measureResistance(
  parts: PlacedPart[], wires: Wire[], rxTrue: number, meterId: string,
): number | null {
  const meter = parts.find((p) => p.id === meterId);
  if (!meter) return null;
  const ts = PART_CATALOG[meter.kind].terminals;
  if (ts.length < 2) return null;
  const ka = termKey(meterId, ts[1].id); // que đỏ
  const kb = termKey(meterId, ts[0].id); // que đen (COM)
  const I = 1e-3;
  const r = simulate(parts, wires, rxTrue, {
    zeroSources: true, exclude: [meterId], inject: { a: ka, b: kb, I }, groundKey: kb,
  });
  const na = r.node[ka], nb = r.node[kb];
  if (na === undefined || nb === undefined) return null;
  if (na === nb) return 0;
  const R = (r.voltages[na] - r.voltages[nb]) / I;
  if (!Number.isFinite(R) || R > 5e7) return null;
  return Math.max(0, R);
}

/* ------------------------------------------------------------------ */
/* Kiểm tra quy tắc đấu nối                                            */
/* ------------------------------------------------------------------ */

export type CheckLevel = 'ok' | 'warn' | 'err';
export interface CheckMessage { level: CheckLevel; text: string }
export interface CheckReport {
  level: CheckLevel;
  title: string;
  messages: CheckMessage[];
  faultyIds: string[];
  safeToPower: boolean;
  ammeterReading: number | null;
  voltmeterReading: number | null;
}

export function checkCircuit(parts: PlacedPart[], wires: Wire[], rxTrue: number): CheckReport {
  const sim = simulate(parts, wires, rxTrue);
  const msgs: CheckMessage[] = [];
  const faulty: string[] = [];

  const by = (e: ElecKind) => sim.branches.filter((b) => b.elec === e);
  const sources = by('source');
  const resistors = sim.branches.filter((b) => b.kind === 'resistor');
  const isVoltMode = (id: string) => {
    const p = parts.find((x) => x.id === id);
    if (!p) return false;
    return p.kind === 'multimeter' ? (p.func ?? 'V') === 'V' || p.func === 'mV' : true;
  };
  const ammeters = by('ammeter');
  const voltmeters = by('voltmeter').filter((b) => isVoltMode(b.compId));
  const switches = by('switch');

  const hasPart = (k: PartKind) => parts.some((p) => p.kind === k);
  const ammeterPresent = parts.some((p) => effectiveElec(p) === 'ammeter');
  const voltmeterPresent = parts.some((p) => effectiveElec(p) === 'voltmeter' && isVoltMode(p.id));

  /* Linh kiện bị nối tắt: hai chốt rơi vào cùng một nút */
  const shorted = (p: PlacedPart) => {
    const ts = PART_CATALOG[p.kind].terminals;
    if (ts.length < 2) return false;
    const a = sim.node[termKey(p.id, ts[0].id)];
    const b = sim.node[termKey(p.id, ts[1].id)];
    return a !== undefined && a === b;
  };
  const shortedSource = parts.find((p) => PART_CATALOG[p.kind].elec === 'source' && shorted(p));
  const shortedRx = parts.find((p) => p.kind === 'resistor' && shorted(p));

  if (shortedSource) {
    return {
      level: 'err',
      title: 'CẤM ĐÓNG ĐIỆN — MẠCH NGUY HIỂM',
      messages: [
        { level: 'err', text: 'Hai cực của nguồn điện đang bị nối tắt bằng dây dẫn. Dòng điện cực lớn sẽ làm cháy nguồn và bỏng tay.' },
        { level: 'err', text: 'Tháo ngay dây nối giữa chốt (+) và chốt (−) của nguồn trước khi làm tiếp.' },
      ],
      faultyIds: [shortedSource.id],
      safeToPower: false,
      ammeterReading: null,
      voltmeterReading: null,
    };
  }

  if (shortedRx) {
    msgs.push({ level: 'err', text: 'Điện trở Rx đang bị nối tắt: có dây (hoặc ampe kế) nối thẳng hai đầu Rx nên dòng không đi qua điện trở.' });
    faulty.push(shortedRx.id);
  }

  if (!sources.length) msgs.push({ level: 'err', text: 'Chưa có nguồn điện nào được nối vào mạch.' });
  if (!hasPart('resistor')) msgs.push({ level: 'err', text: 'Chưa đặt điện trở Rx cần đo lên bảng lắp ráp.' });
  if (!ammeterPresent) msgs.push({ level: 'err', text: 'Thiếu dụng cụ đo cường độ dòng điện (ampe kế hoặc đồng hồ vạn năng ở thang A).' });
  if (!voltmeterPresent) msgs.push({ level: 'err', text: 'Thiếu dụng cụ đo hiệu điện thế (vôn kế hoặc đồng hồ vạn năng ở thang V).' });

  const rx = resistors[0];
  const am = ammeters[0];
  const vm = voltmeters[0];
  const sw = switches[0];
  const src = sources[0];

  const srcCurrent = src ? Math.abs(src.I) : 0;
  const ammeterReading = am ? Math.abs(am.I) : null;
  const voltmeterReading = vm ? Math.abs(vm.V) : null;

  /* Nguy hiểm: đoản mạch nguồn */
  if (src && srcCurrent > 2.5) {
    faulty.push(src.compId);
    if (am && Math.abs(am.I) > 2.5) faulty.push(am.compId);
    msgs.push({ level: 'err', text: `Đoản mạch! Dòng qua nguồn đạt ${srcCurrent.toFixed(1)}A — vượt xa mức an toàn 2,5A. Tháo ngay dây nối tắt hai cực nguồn.` });
    if (am && rx && Math.abs(am.I) > Math.abs(rx.I) * 5) {
      msgs.push({ level: 'err', text: 'Ampe kế đang mắc SONG SONG với điện trở. Điện trở trong của ampe kế ≈ 0 nên dòng dồn hết qua đồng hồ, sẽ nổ cầu chì.' });
    }
    return {
      level: 'err', title: 'CẤM ĐÓNG ĐIỆN — MẠCH NGUY HIỂM', messages: msgs, faultyIds: faulty,
      safeToPower: false, ammeterReading, voltmeterReading,
    };
  }

  /* Khóa K đang mở / mạch hở */
  if (sw && !parts.find((p) => p.id === sw.compId)?.closed) {
    msgs.push({ level: 'warn', text: 'Khóa K đang mở nên chưa có dòng điện. Kiểm tra xong hãy đóng khóa để đo.' });
  }

  if (rx && am) {
    const ir = Math.abs(rx.I);
    const ia = Math.abs(am.I);
    if (ia > 1e-6 && ir > 1e-6 && Math.abs(ia - ir) / Math.max(ia, ir) > 0.05) {
      faulty.push(am.compId);
      msgs.push({ level: 'err', text: 'Ampe kế không nằm nối tiếp trên mạch chính: dòng qua đồng hồ khác dòng qua Rx. Hãy mắc ampe kế nối tiếp với Rx.' });
    } else if (ia > 1e-6) {
      msgs.push({ level: 'ok', text: 'Ampe kế mắc nối tiếp đúng quy tắc, dòng vào chốt (+).' });
    }
  }

  if (rx && vm) {
    const dv = Math.abs(Math.abs(vm.V) - Math.abs(rx.V));
    const iv = Math.abs(vm.I);
    const ir = Math.abs(rx.I);
    if (ir > 1e-7 && iv / ir > 0.02) {
      faulty.push(vm.compId);
      msgs.push({ level: 'err', text: 'Vôn kế đang mắc NỐI TIẾP trong mạch chính. Điện trở vôn kế cỡ mêga-ôm sẽ chặn dòng qua Rx — hãy mắc song song hai đầu Rx.' });
    } else if (dv > 0.05) {
      faulty.push(vm.compId);
      msgs.push({ level: 'err', text: 'Vôn kế chưa mắc song song đúng hai đầu điện trở Rx. Số chỉ hiện tại không phải hiệu điện thế trên Rx.' });
    } else if (Math.abs(vm.V) > 1e-3) {
      msgs.push({ level: 'ok', text: 'Vôn kế mắc song song đúng hai đầu Rx.' });
    }
  }

  /* Nhắc riêng cho đồng hồ vạn năng */
  const wired = (id: string) => wires.some((w) => w.from.c === id || w.to.c === id);
  parts.filter((p) => p.kind === 'multimeter' && wired(p.id)).forEach((p) => {
    if ((p.func ?? 'V') === 'off') {
      msgs.push({ level: 'warn', text: 'Có đồng hồ đã nối vào mạch nhưng núm xoay đang ở vị trí OFF.' });
    } else if (p.func === 'ohm' && Math.abs(src?.I ?? 0) > 1e-4) {
      msgs.push({ level: 'warn', text: 'Đang đo điện trở trên mạch còn điện — số đọc không tin cậy. Hãy mở khóa K trước khi đo.' });
    } else if (p.ac && Math.abs(src?.I ?? 0) > 1e-4) {
      msgs.push({ level: 'warn', text: 'Có đồng hồ đang để thang xoay chiều (AC) trong mạch một chiều nên số đọc gần bằng 0. Bấm SELECT để về DC.' });
    }
  });

  const powered = srcCurrent > 1e-5;
  if (sources.length && !powered && !msgs.some((m) => m.level === 'err')) {
    msgs.push({ level: 'warn', text: 'Mạch đang hở — chưa có dòng điện chạy qua. Kiểm tra lại các dây nối và khóa K.' });
  }

  const hasErr = msgs.some((m) => m.level === 'err');
  if (!hasErr && powered && rx && am && vm) {
    msgs.unshift({ level: 'ok', text: 'Sơ đồ đấu nối khớp với mạch chuẩn đo điện trở bằng vôn kế – ampe kế.' });
    return {
      level: 'ok', title: 'Mạch đúng chuẩn và an toàn', messages: msgs, faultyIds: [],
      safeToPower: true, ammeterReading, voltmeterReading,
    };
  }

  return {
    level: hasErr ? 'err' : 'warn',
    title: hasErr ? 'Mạch đấu nối sai quy tắc' : 'Mạch chưa sẵn sàng để đo',
    messages: msgs.length ? msgs : [{ level: 'warn', text: 'Hãy nối dây từ nguồn qua khóa K, ampe kế và điện trở Rx.' }],
    faultyIds: faulty,
    safeToPower: false,
    ammeterReading,
    voltmeterReading,
  };
}
