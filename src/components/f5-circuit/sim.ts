/**
 * Bộ giải mạch một chiều (phân tích nút) + bộ luật kiểm tra cách đấu nối.
 * Mọi kết quả đo đều tính ra từ tô-pô thật của mạch, không phụ thuộc vị trí đặt linh kiện.
 */
import { isBoardId, trackOf } from './board';
import { PART_CATALOG } from './parts';
import type { PartKind, ElecKind, DmmFunc } from './parts';

export interface TermRef { c: string; t: string }

/** Một chốt của linh kiện đang cắm thẳng vào lỗ trên bảng lắp ráp */
export interface Plug {
  /** Mã chốt của linh kiện */
  t: string;
  /** Mã tấm bảng và mã lỗ mà chốt này cắm vào */
  board: string;
  hole: string;
}

export interface PlacedPart {
  id: string;
  kind: PartKind;
  x: number;
  y: number;
  /** Các chốt đang cắm thẳng xuống bảng, không cần dây nối */
  plugs?: Plug[];
  /** Màu của đèn LED */
  ledColor?: string;
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
  /** Hai chốt bị nối tắt vào nhau; với nguồn thì đây là đoản mạch trực tiếp */
  shorted?: boolean;
  /** Đèn đang mắc ngược cực nên không cho dòng qua */
  reversed?: boolean;
  /** LED mắc đúng cực nhưng điện áp đặt vào chưa vượt điện áp thuận nên chưa sáng */
  lowVolt?: boolean;
}

export interface SimResult {
  branches: Branch[];
  node: Record<string, number>;
  voltages: number[];
  nodeCount: number;
}

/**
 * Mã điểm nối. Riêng bảng lắp ráp: hai lỗ nằm chung một vạch trắng có thanh
 * kim loại nối thông bên trong nên quy về cùng một mã.
 */
export const termKey = (c: string, t: string) =>
  (isBoardId(c) ? `${c}|${trackOf(t)}` : `${c}|${t}`);

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
    case 'lamp': {
      /* Bóng sợi đốt: điện trở nóng = điện áp định mức chia dòng định mức */
      const r = bulbRating(p);
      return r.volt / r.amp;
    }
    /* Điện trở hạn dòng gắn sẵn trong mô-đun LED của bộ dụng cụ, không phải
       điện trở của bản thân con LED. Trị số chọn sao cho ở 12V dòng qua đèn
       xấp xỉ 20mA đúng bằng dòng định mức. */
    case 'led': return spec.value ?? 500;
    case 'coil': return spec.value ?? 6;
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

/** Đèn LED mắc ngược cực thì chặn dòng như một điốt */
const LAMP_BLOCK_R = 1e11;

/**
 * Các loại bóng sợi đốt thay được: mức điện áp định mức và dòng định mức.
 * Điện trở nóng của bóng bằng thương của hai số này.
 */
export const BULB_RATINGS: { volt: number; amp: number; label: string }[] = [
  { volt: 1.5, amp: 0.30, label: '1,5V – 0,45W' },
  { volt: 2.5, amp: 0.30, label: '2,5V – 0,75W' },
  { volt: 3.5, amp: 0.25, label: '3,5V – 0,88W' },
  { volt: 6, amp: 0.20, label: '6V – 1,2W' },
  { volt: 9, amp: 0.15, label: '9V – 1,35W' },
  { volt: 12, amp: 0.10, label: '12V – 1,2W' },
  { volt: 24, amp: 0.08, label: '24V – 1,92W' },
];

/** Bóng mặc định là loại 12V cho hợp với đế pin 12V có sẵn trong bộ dụng cụ */
export const DEFAULT_BULB_V = 12;

export const bulbRating = (p: PlacedPart) =>
  BULB_RATINGS.find((r) => r.volt === (p.volt ?? DEFAULT_BULB_V))
  ?? BULB_RATINGS.find((r) => r.volt === DEFAULT_BULB_V)!;

/** Màu đèn LED chọn được, kèm dòng định mức chung 20mA */
export const LED_COLORS = [
  { id: 'red', hex: '#EF4444', name: 'đỏ' },
  { id: 'green', hex: '#22C55E', name: 'lục' },
  { id: 'blue', hex: '#3B82F6', name: 'lam' },
  { id: 'amber', hex: '#F59E0B', name: 'hổ phách' },
];
export const LED_RATED_A = 0.02;

/**
 * Điện áp thuận của LED, đổi theo màu.
 *
 * LED không phải điện trở: nó gần như không dẫn cho tới khi điện áp đặt vào
 * vượt một ngưỡng gọi là điện áp thuận, sau đó sụt áp trên nó gần như giữ
 * nguyên còn dòng thì do phần mạch bên ngoài quyết định. Ngưỡng này phụ thuộc
 * vật liệu bán dẫn nên mỗi màu một khác — LED lam cần điện áp cao hơn LED đỏ.
 */
export const LED_VF: Record<string, number> = {
  '#EF4444': 1.9,  // đỏ
  '#F59E0B': 2.1,  // hổ phách
  '#22C55E': 2.2,  // lục
  '#3B82F6': 3.0,  // lam
};
export const DEFAULT_LED_VF = 2.0;

export const ledForwardVolt = (p: PlacedPart): number =>
  LED_VF[p.ledColor ?? LED_COLORS[0].hex] ?? DEFAULT_LED_VF;

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

/**
 * Giải mạch một lượt. Hàm này chưa xét chiều của đèn; phần đó do simulate lo.
 */
function solveOnce(
  parts: PlacedPart[],
  wires: Wire[],
  rxTrue: number,
  opts: SimOptions,
  blocked: Set<string>,
): SimResult {
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
    if (na === undefined || nb === undefined) return;
    if (opts.exclude?.includes(p.id)) return;

    if (na === nb) {
      /* Hai chốt chập vào nhau. Với nguồn điện đây là đoản mạch trực tiếp:
         dòng chỉ bị hạn bởi điện trở trong, phải ghi lại để hệ thống soát mạch
         và hiệu ứng hỏng nhận ra. Linh kiện khác bị nối tắt thì không có dòng. */
      const emf = elec === 'source' && !opts.zeroSources ? sourceEmf(p) : 0;
      if (emf > 0) {
        const r = branchResistance(p, rxTrue);
        branches.push({
          compId: p.id, kind: p.kind, elec, na, nb,
          R: r, E: emf, I: emf / r, V: 0, shorted: true,
        });
      }
      return;
    }
    /*
     * Suất điện động của nhánh.
     *
     * Với LED, dùng một nguồn NGƯỢC chiều có độ lớn bằng điện áp thuận, mắc
     * nối tiếp điện trở hạn dòng. Khi đó dòng qua đèn là (U − Uf)/R, đúng kiểu
     * điốt: dưới ngưỡng Uf thì kết quả âm, vòng lặp ở `simulate` sẽ khoá đèn
     * lại. Trước đây LED bị coi là điện trở thuần nên dòng tỉ lệ thẳng với
     * điện áp — sai bản chất, và ở 12V dòng vọt lên gấp bốn lần định mức.
     */
    const blockedNow = blocked.has(p.id);
    let emfOf = 0;
    if (!opts.zeroSources) {
      if (elec === 'source') emfOf = sourceEmf(p);
      else if (elec === 'led' && !blockedNow) emfOf = -ledForwardVolt(p);
    }

    branches.push({
      compId: p.id, kind: p.kind, elec, na, nb,
      R: blockedNow ? LAMP_BLOCK_R : branchResistance(p, rxTrue),
      E: emfOf,
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
    if (b.shorted) return;   // nhánh chập không đưa vào ma trận được
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
    if (b.shorted) return;   // dòng đoản mạch đã tính sẵn ở trên
    b.V = voltages[b.na] - voltages[b.nb];
    b.I = b.E ? (b.E - (voltages[b.nb] - voltages[b.na])) / b.R : b.V / b.R;
    if (b.E) b.I = (b.E - (voltages[b.nb] - voltages[b.na])) / b.R;
  });

  return { branches, node, voltages, nodeCount };
}

/**
 * Giải mạch có xét chiều của bóng đèn.
 *
 * Đèn trong bộ dụng cụ có cực rõ ràng: dòng phải đi từ chốt đỏ (+) sang chốt
 * đen (−) thì đèn mới sáng. Cắm ngược cực thì đèn chặn dòng như một điốt.
 * Vì vậy phải giải vài lượt: lượt đầu coi mọi đèn đều dẫn, thấy đèn nào có
 * dòng chạy ngược thì khoá lại rồi giải tiếp, cho tới khi không còn đèn ngược.
 */
export function simulate(
  parts: PlacedPart[],
  wires: Wire[],
  rxTrue: number,
  opts: SimOptions = {},
): SimResult {
  const blocked = new Set<string>();
  /* Đèn bị khoá vì cắm ngược cực, tách khỏi đèn bị khoá vì thiếu điện áp */
  const wrongWay = new Set<string>();

  /** Gắn lý do vào từng đèn đang khoá để giao diện báo đúng việc cần sửa */
  const label = (res: SimResult) => {
    res.branches.forEach((b) => {
      if (b.elec !== 'led' || !blocked.has(b.compId)) return;
      if (wrongWay.has(b.compId)) b.reversed = true;
      else b.lowVolt = true;
    });
    return res;
  };

  for (let pass = 0; pass < 6; pass++) {
    const res = solveOnce(parts, wires, rxTrue, opts, blocked);

    /* Chốt đầu tiên của đèn là cực dương. Dòng âm nghĩa là hoặc cắm ngược,
       hoặc điện áp đặt vào chưa vượt điện áp thuận — cả hai đều phải khoá lại.
       Bóng sợi đốt thì không: cắm chiều nào cũng sáng. */
    const off = res.branches.filter((b) =>
      b.elec === 'led' && !blocked.has(b.compId) && b.I < -1e-9);

    if (!off.length) return label(res);

    off.forEach((b) => {
      blocked.add(b.compId);
      /* Hiệu điện thế đặt lên đèn âm rõ rệt thì đúng là cắm ngược hai đầu dây;
         còn dương mà vẫn không dẫn thì chỉ là nguồn chưa đủ mạnh. */
      if (b.V < -0.05) wrongWay.add(b.compId);
    });
  }

  return label(solveOnce(parts, wires, rxTrue, opts, blocked));
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
  /** Kết luận về cách mắc của từng dụng cụ đo, để mặt đồng hồ biết có được hiện số hay không */
  meters: MeterVerdict[];
}

/** Một chỗ hỏng cụ thể trên bàn lắp: hỏng ở đâu, vì sao, hậu quả thế nào */
export interface Damage {
  /** Mã linh kiện bị hỏng */
  compId: string;
  /** Kiểu hỏng để chọn hiệu ứng: cháy, nổ, hay chỉ cảnh báo */
  kind: 'burn' | 'blast' | 'warn';
  reason: string;
}

/* Ngưỡng chịu đựng của từng loại linh kiện, vượt qua là hỏng */
const CURRENT_LIMIT: Partial<Record<ElecKind, number>> = {
  source: 2.5,
  ammeter: 3,
  resistor: 0.35,
  rheostat: 1,
  coil: 1.5,
};

/** Ngưỡng chịu dòng của bóng đèn phụ thuộc loại bóng đang lắp */
const lampLimit = (p: PlacedPart | undefined): number => {
  if (!p) return 0.5;
  if (p.kind === 'led') return LED_RATED_A * 1.8;
  return bulbRating(p).amp * 1.7;
};

/**
 * Tìm những linh kiện đang phải chịu dòng vượt ngưỡng.
 * Trả về danh sách chỗ hỏng kèm lý do, để giao diện vẽ hiệu ứng và ghi rõ
 * hỏng ở đâu chứ không chỉ báo chung chung.
 */
export function findDamage(parts: PlacedPart[], wires: Wire[], rxTrue: number): Damage[] {
  const sim = simulate(parts, wires, rxTrue);
  const out: Damage[] = [];

  sim.branches.forEach((b) => {
    const owner = parts.find((x) => x.id === b.compId);
    const limit = (b.elec === 'lamp' || b.elec === 'led')
      ? lampLimit(owner)
      : CURRENT_LIMIT[b.elec];
    if (limit === undefined) return;
    const i = Math.abs(b.I);
    if (i <= limit) return;

    const p = parts.find((x) => x.id === b.compId);
    const name = p ? PART_CATALOG[p.kind].short : b.compId;
    const amp = i >= 10 ? i.toFixed(0) : i.toFixed(2);

    if (b.elec === 'lamp' || b.elec === 'led') {
      out.push({
        compId: b.compId,
        kind: 'burn',
        reason: b.elec === 'led'
          ? `${name} chịu dòng ${amp}A, vượt mức cho phép ${limit.toFixed(3)}A — LED cháy. Cần mắc thêm điện trở hạn dòng.`
          : `${name} chịu dòng ${amp}A, vượt mức cho phép ${limit.toFixed(2)}A — dây tóc đứt, bóng cháy.`,
      });
    } else if (b.elec === 'source') {
      out.push({
        compId: b.compId,
        kind: 'blast',
        reason: `${name} đang bị đoản mạch, dòng qua nguồn lên tới ${amp}A — nguồn quá tải, có thể nổ.`,
      });
    } else {
      out.push({
        compId: b.compId,
        kind: b.elec === 'ammeter' ? 'blast' : 'burn',
        reason: `${name} chịu dòng ${amp}A, vượt mức cho phép ${limit}A — linh kiện hỏng.`,
      });
    }
  });

  return out;
}

/* ------------------------------------------------------------------ */
/* Tô-pô dụng cụ đo: vôn kế phải song song, ampe kế phải nối tiếp      */
/* ------------------------------------------------------------------ */

/** Dụng cụ đo đang mắc sai kiểu nào */
export type MeterFault = 'noi-tiep' | 'song-song' | null;

export interface MeterVerdict {
  compId: string;
  role: 'ammeter' | 'voltmeter';
  fault: MeterFault;
  /** Câu giải thích cho học sinh, rỗng khi mắc đúng */
  reason: string;
}

/**
 * Ngưỡng điện trở để coi một nhánh là có dẫn dòng.
 *
 * Vôn kế 2MΩ nằm TRÊN ngưỡng nên không được tính là một đường dẫn. Đó không
 * phải cách làm cho tiện: xét về dòng thì một nhánh 2MΩ mắc vòng qua ampe kế
 * chỉ chia đi khoảng một phần triệu dòng mạch, ampe kế vẫn đo gần đủ dòng nên
 * vẫn là mắc nối tiếp. Nếu tính vôn kế là đường dẫn thì cứ mắc vôn kế vòng qua
 * cả đoạn mạch là ampe kế lại bị kết luận oan là mắc song song.
 * Khóa K mở và đèn LED bị khoá (1e11Ω) cũng nằm trên ngưỡng — đúng, vì hở mạch
 * thì không có đường nào đi qua đó cả.
 */
const NGUONG_DAN = 1e5;
const dongQuaDuoc = (b: Branch) => !b.shorted && b.R < NGUONG_DAN;

/**
 * Nới ngưỡng để tính cả vôn kế vào, dùng khi chỉ cần biết mạch có kín hay không.
 *
 * Hai câu hỏi khác nhau cần hai cách đếm khác nhau. "Có đường vòng qua ampe kế
 * không" thì vôn kế không đáng kể. Nhưng "mạch có kín không" thì vôn kế mắc nối
 * tiếp CÓ làm mạch kín — dòng 6µA vẫn là dòng. Lẫn hai câu này vào nhau thì
 * chính cái lỗi vôn kế nối tiếp lại tự che được mình: nó bóp dòng xuống quá nhỏ,
 * mạch bị coi là hở, và phần soát mạch bỏ qua không xét nữa.
 */
const noiVaoMach = (b: Branch) => !b.shorted && b.R < 1e8;

/** Hai nhánh cùng một cặp nút, tức là mắc song song trực tiếp với nhau */
const cungCapNut = (a: Branch, b: Branch) =>
  (a.na === b.na && a.nb === b.nb) || (a.na === b.nb && a.nb === b.na);

/**
 * Bỏ nhánh `bo` ra khỏi mạch thì hai cực nguồn còn đường nào thông nhau không?
 *
 * Đây là phép thử phân biệt nối tiếp với song song, và nó đúng với mọi cách
 * đấu chứ không chỉ mạch một vòng. Một linh kiện mắc NỐI TIẾP trên mạch chính
 * thì mọi dòng đều buộc phải đi qua nó: bỏ nó ra là hai cực nguồn mất liên
 * lạc. Còn nếu bỏ nó ra mà hai cực vẫn thông nhau thì có đường vòng, nghĩa là
 * dòng chia nhau đi — đó mới là mắc song song.
 *
 * Nguồn cũng phải bỏ ra, vì nếu giữ lại thì chính nhánh nguồn là một đường nối
 * hai cực của nó, mạch nào cũng hoá ra "có đường vòng".
 */
function conDuongVong(
  branches: Branch[], bo: Branch, src: Branch, dan: (b: Branch) => boolean = dongQuaDuoc,
): boolean {
  const ke = new Map<number, number[]>();
  const noi = (a: number, b: number) => {
    if (!ke.has(a)) ke.set(a, []);
    ke.get(a)!.push(b);
  };
  branches.forEach((b) => {
    if (b.compId === bo.compId || b.compId === src.compId) return;
    if (!dan(b)) return;
    noi(b.na, b.nb);
    noi(b.nb, b.na);
  });

  const daToi = new Set<number>([src.na]);
  const hang = [src.na];
  while (hang.length) {
    const u = hang.shift()!;
    if (u === src.nb) return true;
    (ke.get(u) ?? []).forEach((v) => {
      if (!daToi.has(v)) { daToi.add(v); hang.push(v); }
    });
  }
  return false;
}

/**
 * Soát cách mắc của từng dụng cụ đo trên bàn lắp.
 *
 * Phần này KHÔNG dựa vào việc đoán đâu là điện trở Rx. Trước đây phép kiểm so
 * dòng qua ampe kế với dòng qua `resistors[0]`, mà danh sách đó lấy cả biến
 * trở — hễ trên bàn có biến trở đứng trước Rx là so vào biến trở, nên ampe kế
 * mắc song song Rx lọt lưới còn vôn kế mắc đúng thì bị kết luận là sai.
 */
export function meterFaults(
  parts: PlacedPart[], wires: Wire[], rxTrue: number, simIn?: SimResult,
): MeterVerdict[] {
  const sim = simIn ?? simulate(parts, wires, rxTrue);
  const src = sim.branches.find((b) => b.elec === 'source');
  const out: MeterVerdict[] = [];

  const dungCu = sim.branches.filter((b) => b.elec === 'ammeter' || b.elec === 'voltmeter');
  if (!dungCu.length) return out;

  /* Mạch hở thì chưa kết luận gì về cách mắc — khóa K còn mở, dây còn thiếu,
     chưa có gì để chê. Xét bằng tô-pô chứ không bằng độ lớn của dòng. */
  const machKin = !!src && conDuongVong(sim.branches, src, src, noiVaoMach);

  dungCu.forEach((b) => {
    const role = b.elec === 'ammeter' ? 'ammeter' : 'voltmeter';
    const sach: MeterVerdict = { compId: b.compId, role, fault: null, reason: '' };
    if (!machKin || !src || b.na === b.nb) { out.push(sach); return; }
    /* Dụng cụ chưa nối vào mạch (còn treo lơ lửng, hoặc mới nối một đầu) thì
       không có dòng qua: không phải nối tiếp cũng chẳng phải song song. */
    if (Math.abs(b.I) < 1e-9) { out.push(sach); return; }

    /* Mắc song song trực tiếp với một linh kiện khác: hai chốt rơi đúng vào
       hai nút của linh kiện đó. Dùng để nhận ra vôn kế đo hai cực nguồn —
       trường hợp hợp lệ mà phép thử đường vòng dưới đây lại tưởng là nối tiếp,
       bởi mạch chỉ có hai nhánh nên bỏ vôn kế ra là hai cực mất liên lạc. */
    const songSongVoi = sim.branches.find((x) =>
      x.compId !== b.compId && dongQuaDuoc(x) && cungCapNut(x, b));

    const nam_noi_tiep = !conDuongVong(sim.branches, b, src);

    if (role === 'voltmeter') {
      if (songSongVoi || !nam_noi_tiep) { out.push(sach); return; }
      out.push({
        ...sach,
        fault: 'noi-tiep',
        reason: 'Vôn kế đang mắc NỐI TIẾP trong mạch chính. Điện trở của vôn kế cỡ '
          + 'mêga-ôm nên nó chặn gần hết dòng điện: ampe kế tụt về 0 và số vôn kế hiện '
          + 'ra là điện áp của nguồn, không phải hiệu điện thế cần đo. Hãy tháo vôn kế '
          + 'ra khỏi mạch chính rồi mắc SONG SONG hai đầu đoạn mạch cần đo.',
      });
      return;
    }

    if (nam_noi_tiep) { out.push(sach); return; }
    out.push({
      ...sach,
      fault: 'song-song',
      reason: 'Ampe kế đang mắc SONG SONG, nối tắt đoạn mạch mà nó bắc qua. Điện trở '
        + 'ampe kế gần bằng 0 nên dòng dồn hết qua đồng hồ, phần mạch bị bắc qua gần như '
        + 'không còn dòng. Số chỉ này không phải cường độ dòng điện cần đo, và trên bộ '
        + 'dụng cụ thật thì cầu chì trong ampe kế đã đứt. Hãy mắc ampe kế NỐI TIẾP.',
    });
  });

  return out;
}

export function checkCircuit(parts: PlacedPart[], wires: Wire[], rxTrue: number): CheckReport {
  const sim = simulate(parts, wires, rxTrue);
  const msgs: CheckMessage[] = [];
  const faulty: string[] = [];

  const meters = meterFaults(parts, wires, rxTrue, sim);
  const faultOf = (id: string) => meters.find((m) => m.compId === id)?.fault ?? null;

  const by = (e: ElecKind) => sim.branches.filter((b) => b.elec === e);
  const sources = by('source');
  /* Vật dẫn cần đo: điện trở mẫu, hoặc biến trở khi học sinh dùng biến trở làm Rx */
  const LOAD_KINDS: PartKind[] = ['resistor', 'rheostat'];
  const isLoad = (k: PartKind) => LOAD_KINDS.includes(k);
  /* Điện trở mẫu đứng trước biến trở: bài thực hành đo điện trở lấy Rx làm vật
     cần đo, còn biến trở chỉ để hạn dòng. Xếp bừa theo thứ tự đặt lên bàn thì
     hễ biến trở đứng trước là mọi phép so dòng và so áp đều so vào sai linh kiện. */
  const resistors = [
    ...sim.branches.filter((b) => b.kind === 'resistor'),
    ...sim.branches.filter((b) => isLoad(b.kind) && b.kind !== 'resistor'),
  ];
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
  const shortedRx = parts.find((p) => isLoad(p.kind) && shorted(p));

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
      meters,
    };
  }

  if (shortedRx) {
    msgs.push({ level: 'err', text: 'Điện trở Rx đang bị nối tắt: có dây (hoặc ampe kế) nối thẳng hai đầu Rx nên dòng không đi qua điện trở.' });
    faulty.push(shortedRx.id);
  }

  if (!sources.length) msgs.push({ level: 'err', text: 'Chưa có nguồn điện nào được nối vào mạch.' });
  if (!parts.some((p) => isLoad(p.kind))) {
    msgs.push({ level: 'err', text: 'Chưa đặt vật dẫn cần đo lên bảng lắp ráp (điện trở mẫu Rx hoặc biến trở con chạy).' });
  }
  if (!ammeterPresent) msgs.push({ level: 'err', text: 'Thiếu dụng cụ đo cường độ dòng điện (ampe kế hoặc đồng hồ vạn năng ở thang A).' });
  if (!voltmeterPresent) msgs.push({ level: 'err', text: 'Thiếu dụng cụ đo hiệu điện thế (vôn kế hoặc đồng hồ vạn năng ở thang V).' });

  /* LED đúng cực nhưng nguồn chưa vượt điện áp thuận: nhắc tăng điện áp */
  sim.branches.filter((b) => b.lowVolt).forEach((b) => {
    const p = parts.find((x) => x.id === b.compId);
    const vf = p ? ledForwardVolt(p) : DEFAULT_LED_VF;
    msgs.push({
      level: 'warn',
      text: `Đèn LED (${b.compId}) mắc đúng cực nhưng điện áp đặt vào chưa đủ. `
        + `Loại LED này cần ít nhất ${vf.toFixed(1).replace('.', ',')}V mới bắt đầu sáng — `
        + 'hãy tăng điện áp nguồn hoặc giảm bớt điện trở mắc nối tiếp.',
    });
    faulty.push(b.compId);
  });

  /* Đèn mắc ngược cực thì không sáng — nhắc học sinh đảo hai đầu dây */
  sim.branches.filter((b) => b.reversed).forEach((b) => {
    const p = parts.find((x) => x.id === b.compId);
    const name = p ? PART_CATALOG[p.kind].short : b.compId;
    msgs.push({
      level: 'warn',
      text: `${name} (${b.compId}) đang mắc ngược cực nên không sáng. Dòng phải đi vào chân dài (+) và ra ở chân ngắn (−) — đảo hai đầu dây là được.`,
    });
    faulty.push(b.compId);
  });

  const rx = resistors[0];
  /* Lấy dụng cụ mắc đúng để đọc số; mắc sai thì nêu ra ở phần báo lỗi bên dưới */
  const am = ammeters.find((b) => faultOf(b.compId) === null) ?? ammeters[0];
  const vm = voltmeters.find((b) => faultOf(b.compId) === null) ?? voltmeters[0];
  const sw = switches[0];
  const src = sources[0];

  /* Mắc sai kiểu: lỗi nặng, nêu trước mọi lời nhắc khác */
  meters.filter((m) => m.fault).forEach((m) => {
    msgs.push({ level: 'err', text: m.reason });
    faulty.push(m.compId);
  });

  const srcCurrent = src ? Math.abs(src.I) : 0;
  /*
   * Dụng cụ mắc sai kiểu thì KHÔNG trả về số đọc.
   *
   * Đây là chỗ hổng nặng nhất của bản trước: phần soát mạch có báo lỗi hẳn ra
   * màn hình, nhưng số đọc vẫn được trả về nên mặt đồng hồ vẫn hiện một con số
   * nhìn rất hợp lí — vôn kế mắc nối tiếp hiện ngay 12V, học sinh chép vào bảng
   * số liệu là xong. Báo lỗi mà vẫn đưa số liệu thì chẳng khác nào không báo.
   */
  const ammeterReading = am && faultOf(am.compId) === null ? Math.abs(am.I) : null;
  const voltmeterReading = vm && faultOf(vm.compId) === null ? Math.abs(vm.V) : null;

  /* Nguy hiểm: đoản mạch nguồn */
  if (src && srcCurrent > 2.5) {
    faulty.push(src.compId);
    if (am && Math.abs(am.I) > 2.5) faulty.push(am.compId);
    msgs.push({ level: 'err', text: `Đoản mạch! Dòng qua nguồn đạt ${srcCurrent.toFixed(1)}A — vượt xa mức an toàn 2,5A. Tháo ngay dây nối tắt hai cực nguồn.` });
    /* Câu nhắc "ampe kế mắc song song" trước đây đặt ở đây đã bỏ: giờ meterFaults
       kết luận việc đó bằng tô-pô và nêu ra ở trên, kể cả khi dòng chưa vượt ngưỡng. */
    return {
      level: 'err', title: 'CẤM ĐÓNG ĐIỆN — MẠCH NGUY HIỂM', messages: msgs, faultyIds: faulty,
      safeToPower: false, ammeterReading, voltmeterReading, meters,
    };
  }

  /* Khóa K đang mở / mạch hở */
  if (sw && !parts.find((p) => p.id === sw.compId)?.closed) {
    msgs.push({ level: 'warn', text: 'Khóa K đang mở nên chưa có dòng điện. Kiểm tra xong hãy đóng khóa để đo.' });
  }

  /*
   * Hai phép kiểm dưới đây chỉ xét ĐÚNG ĐOẠN MẠCH ĐANG ĐO, không xét kiểu mắc
   * nữa — kiểu mắc đã do meterFaults kết luận bằng tô-pô. Ở đây mắc đúng kiểu
   * rồi nhưng có thể vẫn chưa bắc vào Rx: ampe kế nằm trên một nhánh khác, hay
   * vôn kế đo hai cực nguồn thay vì hai đầu Rx. Số đọc lúc đó vẫn là một giá
   * trị thật của mạch, chỉ là không phải số liệu bài yêu cầu, nên chỉ nhắc chứ
   * không chặn.
   */
  if (rx && am && faultOf(am.compId) === null) {
    const ir = Math.abs(rx.I);
    const ia = Math.abs(am.I);
    if (ia > 1e-6 && ir > 1e-6 && Math.abs(ia - ir) / Math.max(ia, ir) > 0.05) {
      faulty.push(am.compId);
      msgs.push({ level: 'err', text: 'Ampe kế đang nằm trên một nhánh khác: dòng qua đồng hồ không bằng dòng qua Rx. Hãy mắc ampe kế nối tiếp ngay với Rx.' });
    } else if (ia > 1e-6) {
      msgs.push({ level: 'ok', text: 'Ampe kế mắc nối tiếp đúng quy tắc, dòng vào chốt (+).' });
    }
  }

  if (rx && vm && faultOf(vm.compId) === null) {
    const dv = Math.abs(Math.abs(vm.V) - Math.abs(rx.V));
    if (dv > 0.05) {
      faulty.push(vm.compId);
      msgs.push({ level: 'err', text: 'Vôn kế mắc song song đúng kiểu nhưng chưa bắc vào hai đầu điện trở Rx. Số chỉ hiện tại là hiệu điện thế của đoạn mạch khác, không phải U trên Rx.' });
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
      safeToPower: true, ammeterReading, voltmeterReading, meters,
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
    meters,
  };
}
