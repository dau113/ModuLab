/**
 * F5 — Mô phỏng lắp mạch điện 2D trên bảng lắp ráp (breadboard).
 * Linh kiện vẽ theo bộ dụng cụ thật; số liệu đo tính từ bộ giải mạch một chiều.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MousePointer2, Cable, Eraser, RotateCcw, Wrench, CircuitBoard,
  CheckCircle2, AlertTriangle, AlertCircle, Plus, Power, Save, SearchCheck,
  ZoomIn, ZoomOut, Maximize2, Gauge, Spline, Search, X,
} from 'lucide-react';
import { PART_CATALOG, PART_ORDER, PartArt, PartDefs, PartThumb, DMM_FUNCS, DMM_HOTSPOTS, PS_HOTSPOTS, DMM_SCALE } from './parts';
import type { PartKind, PartLive, DmmFunc, DmmButton } from './parts';
import { simulate, checkCircuit, effectiveElec, measureResistance } from './sim';
import { useSettings } from '../../settings';
import { sfx } from '../../audio';
import type { PlacedPart, Wire, TermRef, CheckReport } from './sim';

interface CircuitSimulatorProps {
  onPassCircuit: () => void;
  isPassed: boolean;
  /** Lưu bản lắp hiện tại vào cơ sở dữ liệu */
  onSaveCircuit?: (payload: { name: string; data: unknown; isValid: boolean }) => Promise<void>;
}

/* Giá trị thật của điện trở cần đo — học sinh không nhìn thấy, chỉ suy ra từ phép đo */
const RX_TRUE = 105;

/** Mã quy ước cho bảng lắp ráp — mỗi lỗ cắm là một điểm nối độc lập */
const BOARD_ID = 'BOARD';

const CANVAS_W = 840;
const CANVAS_H = 560;
const BOARD = { x: 34, y: 206, w: 772, h: 338 };
const SNAP = 8;

/* Bàn lắp bắt đầu trống — học sinh tự chọn linh kiện từ khay */
const INITIAL_PARTS: PlacedPart[] = [];

/**
 * Giữ nguyên bàn lắp khi học sinh chuyển sang mục khác rồi quay lại.
 * Dữ liệu nằm ngoài thành phần nên không mất khi thành phần bị gỡ khỏi cây.
 */
const bench: {
  parts: PlacedPart[];
  wires: Wire[];
  view: { z: number; tx: number; ty: number };
  wireSide: 'hot' | 'cold';
  activeRheostat: string | null;
} = {
  parts: INITIAL_PARTS,
  wires: [],
  view: { z: 1, tx: 0, ty: 0 },
  wireSide: 'hot',
  activeRheostat: null,
};

/** Hai màu dây: đỏ cho nhánh dương, xanh cho nhánh âm */
export const WIRE_COLORS = { hot: '#DC2626', cold: '#2563EB' } as const;

const fmt = (n: number, d: number) => (Number.isFinite(n) ? n.toFixed(d) : '—');

/**
 * Nhiễu đo lường nhỏ, lặp lại được. Hạt giống lấy từ chính giá trị đo được
 * nên chỉ đổi khi mạch thật sự đổi — xoay núm biến trở chưa nối dây thì số đứng yên.
 */
const jitter = (value: number, offset: number, amp: number) => {
  const s = Math.sin((value * 1000 + offset) * 127.1) * 43758.5453;
  return 1 + (s - Math.floor(s) - 0.5) * 2 * amp;
};

export const CircuitSimulator: React.FC<CircuitSimulatorProps> = ({ onPassCircuit, isPassed, onSaveCircuit }) => {
  const { t } = useSettings();
  const [parts, setParts] = useState<PlacedPart[]>(bench.parts);
  const [wires, setWires] = useState<Wire[]>(bench.wires);
  const [tool, setTool] = useState<'select' | 'wire' | 'erase'>('wire');
  const [query, setQuery] = useState('');
  const [checked, setChecked] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hint, setHint] = useState<string>(
    'Bấm lần lượt vào hai chốt (hoặc lỗ cắm trên bảng) để tạo dây nối. Nhiều đầu dây cắm chung một lỗ thì được nối với nhau.',
  );
  const [wireSide, setWireSide] = useState<'hot' | 'cold'>(bench.wireSide);
  const wireColor = WIRE_COLORS[wireSide];
  const [pending, setPending] = useState<TermRef | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState(bench.view);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const pan = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const wireDrag = useRef<{ id: string; idx: number } | null>(null);

  /* ---------------- Mô phỏng & kiểm tra ---------------- */
  const sim = useMemo(() => simulate(parts, wires, RX_TRUE), [parts, wires]);
  const report: CheckReport = useMemo(() => checkCircuit(parts, wires, RX_TRUE), [parts, wires]);

  const branchOf = (id: string) => sim.branches.find((b) => b.compId === id);

  /* Bóng đèn kêu tách rồi ù nhẹ mỗi khi chuyển giữa sáng và tắt */
  const lampLit = parts.some((p) => p.kind === 'lamp'
    && Math.abs(sim.branches.find((b) => b.compId === p.id)?.I ?? 0) > 1e-4);
  const prevLamp = useRef(false);
  useEffect(() => {
    if (lampLit !== prevLamp.current) {
      prevLamp.current = lampLit;
      sfx.lamp(lampLit);
    }
  }, [lampLit]);

  /* Núm biến trở chỉ hiện khi bàn lắp có biến trở; nhiều cái thì chọn được từng cái */
  const rheostats = parts.filter((p) => p.kind === 'rheostat');
  const [activeRheostat, setActiveRheostat] = useState<string | null>(bench.activeRheostat);
  const currentRheostat = rheostats.find((p) => p.id === activeRheostat) ?? rheostats[0] ?? null;
  const knob = currentRheostat?.knob ?? 0.5;

  /* Ghi lại bàn lắp sau mỗi thay đổi để lần sau quay lại vẫn còn nguyên */
  useEffect(() => {
    bench.parts = parts;
    bench.wires = wires;
    bench.view = view;
    bench.wireSide = wireSide;
    bench.activeRheostat = activeRheostat;
  }, [parts, wires, view, wireSide, activeRheostat]);

  /* Điện trở đo được của từng đồng hồ đang ở thang Ω hoặc thang thông mạch */
  const ohmReadings = useMemo(() => {
    const out: Record<string, number | null> = {};
    parts.filter((p) => p.kind === 'multimeter' && p.func === 'ohm')
      .forEach((p) => { out[p.id] = measureResistance(parts, wires, RX_TRUE, p.id); });
    return out;
  }, [parts, wires]);

  const peaks = useRef<Record<string, { max: number; min: number }>>({});

  interface DmmView { value: number | null; text: string; unit: string; live: PartLive }

  /** Toàn bộ logic mặt số: thang đo, đơn vị, OL, REL, MAX/MIN, HOLD, AC/DC */
  const dmm = (p: PlacedPart): DmmView => {
    const f: DmmFunc = p.func ?? 'V';
    const spec = DMM_FUNCS.find((x) => x.id === f) ?? DMM_FUNCS[1];
    const base: PartLive = {
      func: f, ac: p.ac, hold: p.hold, rel: p.rel != null, peak: p.peak ?? null,
      auto: p.rangeIdx == null, light: p.light,
    };
    if (f === 'off') return { value: null, text: '', unit: '', live: base };

    const b = branchOf(p.id);
    let raw: number | null;
    if (f === 'A') { const i = Math.abs(b?.I ?? 0); raw = i * jitter(i, 0.71, 0.004); }
    else if (f === 'mA') { const i = Math.abs(b?.I ?? 0); raw = i * jitter(i, 0.71, 0.004) * 1000; }
    else if (f === 'V') { const v = Math.abs(b?.V ?? 0); raw = v * jitter(v, 0.13, 0.004); }
    else if (f === 'mV') { const v = Math.abs(b?.V ?? 0); raw = v * jitter(v, 0.13, 0.004) * 1000; }
    else raw = ohmReadings[p.id] ?? null;

    if (raw == null) return { value: null, text: 'OL', unit: spec.unit, live: { ...base, reading: 'OL', unit: spec.unit, bar: 1 } };
    if (p.ac && f !== 'ohm') raw *= 0.0015; // mạch một chiều: thang AC gần như bằng 0

    let value = raw - (p.rel ?? 0);

    const pk = peaks.current[p.id];
    if (p.peak) {
      if (!pk) peaks.current[p.id] = { max: value, min: value };
      else { pk.max = Math.max(pk.max, value); pk.min = Math.min(pk.min, value); }
      const q = peaks.current[p.id];
      value = p.peak === 'max' ? q.max : q.min;
    }

    const ranges = spec.ranges;
    const auto = p.rangeIdx == null;
    let range = auto
      ? ranges.find((r) => Math.abs(value) <= r) ?? ranges[ranges.length - 1]
      : ranges[Math.min(p.rangeIdx ?? 0, ranges.length - 1)];

    let shown = value;
    let unit = spec.unit;
    if (f === 'ohm' && range >= 6000) { shown /= 1000; range /= 1000; unit = 'kΩ'; }

    const ol = Math.abs(shown) > range;
    const dec = Math.max(0, 4 - Math.floor(Math.log10(range)) - 1);
    let text = ol ? 'OL' : shown.toFixed(dec);
    if (p.hold && p.held) text = p.held;

    return {
      value, text, unit,
      live: { ...base, reading: text, unit, bar: Math.min(1, Math.abs(shown) / range) },
    };
  };

  /** Số đo lấy từ chính mặt đồng hồ, đã tính cả thang mV/mA, REL và chế độ AC */
  const readerValue = (want: 'V' | 'A'): number | null => {
    const m = parts.find((p) => p.kind === 'multimeter'
      && (want === 'V' ? (p.func === 'V' || p.func === 'mV') : (p.func === 'A' || p.func === 'mA')));
    if (m) {
      const v = dmm(m);
      if (v.value == null || v.text === 'OL') return null;
      return m.func === 'mV' || m.func === 'mA' ? v.value / 1000 : v.value;
    }
    const raw = want === 'V' ? report.voltmeterReading : report.ammeterReading;
    if (raw == null) return null;
    return raw * jitter(raw, want === 'V' ? 0.13 : 0.71, 0.004);
  };

  const liveU = readerValue('V') ?? 0;
  const liveI = readerValue('A') ?? 0;

  const liveOf = (p: PlacedPart): PartLive => {
    const b = branchOf(p.id);
    const cur = b ? Math.abs(b.I) : 0;
    const elec = effectiveElec(p);
    if (p.kind === 'multimeter') return dmm(p).live;
    if (p.kind === 'powersupply') {
      const on = p.powerOn !== false;
      return {
        volt: p.volt ?? 12,
        powerOn: on,
        ampReading: on ? Math.abs(b?.I ?? 0).toFixed(2) : '---',
        voltReading: on ? Math.abs(b?.V ?? 0).toFixed(1) : '---',
      };
    }
    if (elec === 'ammeter') return { needle: Math.min(1, cur / 3) };
    if (elec === 'voltmeter') return { needle: Math.min(1, Math.abs(b?.V ?? 0) / 15) };
    return { closed: p.closed, knob: p.knob, energized: cur > 1e-4 };
  };

  /* ---------------- Toạ độ & thao tác ---------------- */
  /** Toạ độ trong hệ viewBox (chưa trừ zoom / dịch chuyển) */
  const toView = (e: React.PointerEvent | React.MouseEvent | React.WheelEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const r = pt.matrixTransform(m.inverse());
    return { x: r.x, y: r.y };
  };

  /** Toạ độ thật trên bàn lắp ráp (đã bù zoom / dịch chuyển) */
  const toSvg = (e: React.PointerEvent | React.MouseEvent) => {
    const v = toView(e);
    return { x: (v.x - view.tx) / view.z, y: (v.y - view.ty) / view.z };
  };

  const ZOOM_MIN = 0.45;
  const ZOOM_MAX = 2.6;

  /** Phóng to / thu nhỏ quanh một điểm neo trong hệ viewBox */
  const zoomAt = (nextZ: number, anchor?: { x: number; y: number }) => {
    setView((v) => {
      const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nextZ));
      const a = anchor ?? { x: CANVAS_W / 2, y: CANVAS_H / 2 };
      const wx = (a.x - v.tx) / v.z;
      const wy = (a.y - v.ty) / v.z;
      return { z, tx: a.x - wx * z, ty: a.y - wy * z };
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    zoomAt(view.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), toView(e));
  };

  const startPan = (e: React.PointerEvent) => {
    const v = toView(e);
    pan.current = { x: v.x, y: v.y, tx: view.tx, ty: view.ty };
  };

  const termPos = (ref: TermRef) => {
    if (ref.c === BOARD_ID) {
      const h = holes.find((x) => x.id === ref.t);
      return h ? { x: h.x, y: h.y } : null;
    }
    const p = parts.find((c) => c.id === ref.c);
    if (!p) return null;
    const t = PART_CATALOG[p.kind].terminals.find((x) => x.id === ref.t);
    if (!t) return null;
    return { x: p.x + t.x, y: p.y + t.y };
  };

  const sameRef = (a: TermRef, b: TermRef) => a.c === b.c && a.t === b.t;

  /** Chuỗi điểm của một dây: đầu nối → các nếp gấp → đầu nối */
  const wirePath = (w: Wire): { x: number; y: number }[] | null => {
    const a = termPos(w.from), b = termPos(w.to);
    if (!a || !b) return null;
    const bends = w.points ?? [];
    if (!bends.length) {
      // dây chưa bẻ: võng xuống tự nhiên như dây thật
      const sag = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + 22 + Math.abs(a.x - b.x) * 0.04 };
      return [a, sag, b];
    }
    return [a, ...bends, b];
  };

  /** Nối các điểm thành đường cong trơn (Catmull-Rom đổi sang Bézier) */
  const splinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? pts[i + 1];
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  /** Bấm giữ trên thân dây: chèn một nếp gấp mới ngay tại đó rồi kéo luôn */
  const startBend = (e: React.PointerEvent, w: Wire) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    const pos = toSvg(e);
    const bends = w.points ?? [];
    const chain = wirePath(w);
    if (!chain) return;
    const anchors = bends.length ? [chain[0], ...bends, chain[chain.length - 1]] : [chain[0], chain[chain.length - 1]];
    let best = 0, bestD = Infinity;
    for (let i = 0; i < anchors.length - 1; i++) {
      const p = anchors[i], q = anchors[i + 1];
      const vx = q.x - p.x, vy = q.y - p.y;
      const len2 = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((pos.x - p.x) * vx + (pos.y - p.y) * vy) / len2));
      const dx = p.x + t * vx - pos.x, dy = p.y + t * vy - pos.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestD) { bestD = dist; best = i; }
    }
    const next = [...bends];
    next.splice(best, 0, pos);
    wireDrag.current = { id: w.id, idx: best };
    setWires((prev) => prev.map((x) => (x.id === w.id ? { ...x, points: next } : x)));
    setHint('Kéo để tạo hình cho dây. Bấm đúp vào nếp gấp để bỏ nó đi.');
  };

  const labelOf = (r: TermRef) => {
    if (r.c === BOARD_ID) return `lỗ cắm ${r.t.replace('h', '').replace('-', '·')} trên bảng`;
    const p = parts.find((x) => x.id === r.c);
    if (!p) return r.c;
    const t = PART_CATALOG[p.kind].terminals.find((x) => x.id === r.t);
    return `${PART_CATALOG[p.kind].short} · ${t?.label ?? r.t}`;
  };

  const removePart = (id: string) => {
    sfx.unplug();
    setParts((prev) => prev.filter((p) => p.id !== id));
    setWires((prev) => prev.filter((w) => w.from.c !== id && w.to.c !== id));
      };

  const togglePart = (id: string) => {
    setParts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      if (p.kind === 'switch' || p.kind === 'switch2') {
        sfx.switchToggle(!p.closed);
        return { ...p, closed: !p.closed };
      }
      return p;
    }));
  };

  const dmmAction = (id: string, btn: DmmButton) => {
    const cur = parts.find((x) => x.id === id);
    if (!cur) return;
    const view = dmm(cur);
    const spec = DMM_FUNCS.find((x) => x.id === (cur.func ?? 'V')) ?? DMM_FUNCS[1];

    setParts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      switch (btn) {
        case 'dial': {
          sfx.knob();
          const i = DMM_FUNCS.findIndex((x) => x.id === (p.func ?? 'V'));
          const next = DMM_FUNCS[(i + 1) % DMM_FUNCS.length].id;
          delete peaks.current[id];
          setHint(`Đồng hồ vạn năng: núm xoay chuyển sang ${DMM_FUNCS.find((x) => x.id === next)?.name}.`);
          return { ...p, func: next, rangeIdx: null, rel: null, peak: null, hold: false, held: undefined };
        }
        case 'range': {
          if (!spec.ranges.length) return p;
          const next = p.rangeIdx == null ? 0 : p.rangeIdx + 1;
          return { ...p, rangeIdx: next >= spec.ranges.length ? null : next };
        }
        case 'rel':
          return { ...p, rel: p.rel != null ? null : (view.value ?? 0) + (p.rel ?? 0) };
        case 'peak': {
          const next = p.peak == null ? 'max' : p.peak === 'max' ? 'min' : null;
          if (next === 'max') peaks.current[id] = { max: view.value ?? 0, min: view.value ?? 0 };
          if (next == null) delete peaks.current[id];
          return { ...p, peak: next };
        }
        case 'light':
          return { ...p, light: !p.light };
        case 'hold':
          return { ...p, hold: !p.hold, held: p.hold ? undefined : view.text };
        case 'select':
          return { ...p, ac: !p.ac };
        default:
          return p;
      }
    }));
  };

  const psAction = (id: string, btn: 'power' | 'knob') => {
    setParts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      if (btn === 'power') {
        const on = !(p.powerOn !== false);
        sfx.power(on);
        setHint(on ? 'Đã bật bộ nguồn.' : 'Đã tắt bộ nguồn — mạch ngừng cấp điện.');
        return { ...p, powerOn: on };
      }
      sfx.knob();
      const next = ((p.volt ?? 12) + 2) % 14;
      setHint(`Bộ nguồn đặt ở ${next}V một chiều.`);
      return { ...p, volt: next };
    }));
  };

  const setDmmFunc = (id: string, f: DmmFunc) => {
    delete peaks.current[id];
    setParts((prev) => prev.map((p) => (p.id === id
      ? { ...p, func: f, rangeIdx: null, rel: null, peak: null, hold: false, held: undefined }
      : p)));
  };

  const handlePartDown = (e: React.PointerEvent, p: PlacedPart) => {
    if (tool === 'erase') {
      e.stopPropagation();
      removePart(p.id);
      return;
    }
    e.stopPropagation();
    (e.currentTarget as unknown as SVGGElement).ownerSVGElement?.setPointerCapture?.(e.pointerId);
    const { x, y } = toSvg(e);
    drag.current = { id: p.id, dx: x - p.x, dy: y - p.y, sx: x, sy: y, moved: false };
    setSelected(p.id);
  };

  const handleMove = (e: React.PointerEvent) => {
    if (pan.current) {
      const v = toView(e);
      const q = pan.current;
      setView((prev) => ({ ...prev, tx: q.tx + (v.x - q.x), ty: q.ty + (v.y - q.y) }));
      return;
    }
    if (wireDrag.current) {
      const q = wireDrag.current;
      const pos = toSvg(e);
      setWires((prev) => prev.map((w) => (w.id === q.id
        ? { ...w, points: (w.points ?? []).map((pt, i) => (i === q.idx ? pos : pt)) }
        : w)));
      return;
    }
    if (!drag.current) return;
    const { x, y } = toSvg(e);
    const d = drag.current;
    if (!d.moved && Math.hypot(x - d.sx, y - d.sy) < 3) return;
    d.moved = true;
    setParts((prev) => prev.map((p) => {
      if (p.id !== d.id) return p;
      return {
        ...p,
        x: Math.round((x - d.dx) / SNAP) * SNAP,
        y: Math.round((y - d.dy) / SNAP) * SNAP,
      };
    }));
  };

  const handleUp = () => {
    pan.current = null;
    wireDrag.current = null;
    const d = drag.current;
    if (d && !d.moved) togglePart(d.id);
    drag.current = null;
  };

  const handleTerminal = (e: React.PointerEvent, ref: TermRef) => {
    if (tool === 'select') return;
    e.stopPropagation();
    if (tool === 'erase') {
      setWires((prev) => prev.filter((w) => !(sameRef(w.from, ref) || sameRef(w.to, ref))));
            return;
    }
    if (tool !== 'wire') return;
    if (!pending) {
      setPending(ref);
      setHint(`Đang kéo dây từ chốt ${labelOf(ref)} — bấm tiếp vào chốt còn lại để hoàn tất.`);
      return;
    }
    if (sameRef(pending, ref)) { setPending(null); return; }
    sfx.plug();
    setWires((prev) => [...prev, { id: `w${Date.now()}`, from: pending, to: ref, color: wireColor }]);
    setPending(null);
        setHint('Đã nối thêm một dây. Hệ thống soát lại sơ đồ ngay sau mỗi thao tác.');
  };

  const addPart = (kind: PartKind) => {
    const spec = PART_CATALOG[kind];
    const seq = parts.filter((p) => p.kind === kind).length + 1;
    const id = `${kind.toUpperCase().slice(0, 4)}-${seq}`;
    const slot = parts.filter((p) => PART_CATALOG[p.kind].onBoard).length;
    sfx.plug();
    setParts((prev) => [...prev, {
      id, kind,
      x: BOARD.x + 40 + ((slot * 160) % Math.max(160, BOARD.w - 220)),
      y: spec.onBoard ? BOARD.y + 60 + (Math.floor((slot * 160) / Math.max(160, BOARD.w - 220)) % 2) * 130 : 8,
      closed: false, knob: 0.35, func: 'V', rangeIdx: null, rel: null, peak: null,
      volt: 12, powerOn: true,
    }]);
    setHint(`Đã thêm ${spec.name} lên bảng lắp ráp. Dùng công cụ Chọn để kéo tới vị trí mong muốn.`);
  };

  /* Mạch được soát liên tục sau mỗi thao tác, không cần bấm nút kiểm tra */
  useEffect(() => {
    if (report.safeToPower) onPassCircuit();
  }, [report.safeToPower]);

  const setKnob = (v: number) => {
    const id = currentRheostat?.id;
    if (!id) return;
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, knob: v } : p)));
  };

  const toggleK = () => {
    const k = parts.find((p) => p.kind === 'switch');
    if (k) togglePart(k.id);
  };


  /* ---------------- Bảng lắp ráp ---------------- */
  /* Lọc khay linh kiện theo từ khoá, không phân biệt dấu tiếng Việt */
  const fold = (v: string) =>
    v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
  const visibleParts = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return PART_ORDER;
    return PART_ORDER.filter((k) => {
      const spec = PART_CATALOG[k];
      return fold(`${spec.name} ${spec.short} ${spec.group} ${spec.desc}`).includes(q);
    });
  }, [query]);

  const holes: { id: string; x: number; y: number }[] = [];
  for (let c = 0; c < 11; c++) {
    for (let r = 0; r < 5; r++) {
      holes.push({ id: `h${c}-${r}`, x: 92 + c * 66, y: 250 + r * 62 });
    }
  }
  const holeAt = (id: string) => holes.find((h) => h.id === id);
  const holeUsed = (id: string) =>
    wires.some((w) => (w.from.c === BOARD_ID && w.from.t === id) || (w.to.c === BOARD_ID && w.to.t === id));

  const kClosed = !!parts.find((p) => p.kind === 'switch')?.closed;

  return (
    <div className="ml-scroll h-full min-h-0 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)] gap-3 pb-3 pr-1">

      {/* ============ CỘT TRÁI — KIỂM TRA MẠCH & KHAY LINH KIỆN ============ */}
      <div className="ml-scroll flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
          <header className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2">
            <h2 className="text-[clamp(12.5px,0.86vw,15px)] font-extrabold tracking-widest text-slate-700 uppercase">
              Hệ thống kiểm tra
            </h2>
            <button
              onClick={() => setChecked((v) => !v)}
              disabled={parts.length === 0}
              className={`h-8 px-3 rounded-lg text-[clamp(12.5px,0.86vw,15px)] font-bold flex items-center gap-1.5 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                checked ? 'bg-slate-700 hover:bg-slate-800 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}>
              <SearchCheck className="w-4 h-4" /> {checked ? 'Ẩn kết quả' : 'Kiểm tra'}
            </button>
          </header>

          {checked && (
            <div className="ml-scroll p-3 space-y-2 max-h-[280px] overflow-y-auto">
              <div className={`ml-rise rounded-xl px-3 py-2 text-[clamp(12.5px,0.86vw,15px)] font-bold text-center ${
                report.level === 'ok' ? 'bg-emerald-100 text-emerald-800'
                  : report.level === 'warn' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}>{report.title}</div>

              {report.messages.map((m, i) => (
                <div key={i}
                  className={`ml-rise flex gap-2 rounded-xl px-3 py-2 text-[clamp(12.5px,0.86vw,15px)] leading-relaxed border ${
                    m.level === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : m.level === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}>
                  {m.level === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    : m.level === 'warn' ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{m.text}</span>
                </div>
              ))}

              {isPassed && (
                <p className="text-[12.5px] text-slate-400 pt-1">
                  Bản lắp này đã được xác nhận đạt — bước Báo cáo thực hành đã mở khoá.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
          <header className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <h2 className="text-[clamp(12.5px,0.86vw,15px)] font-extrabold tracking-widest text-slate-700 uppercase">{t('sim.tray')}</h2>
            <span className="text-[12.5px] text-slate-400 font-semibold">{visibleParts.length}/{PART_ORDER.length}</span>
          </header>

          <div className="p-3">
            <div className="flex gap-2 mb-3">
              {(['hot', 'cold'] as const).map((side) => (
                <button key={side} onClick={() => setWireSide(side)}
                  className={`flex-1 h-9 rounded-lg border text-[clamp(13px,0.9vw,15.5px)] font-bold flex items-center justify-center gap-2 transition-colors ${
                    wireSide === side ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-400'
                  }`}>
                  <span className="w-3.5 h-3.5 rounded-full" style={{ background: WIRE_COLORS[side] }} />
                  {side === 'hot' ? 'Dây đỏ (+)' : 'Dây xanh (−)'}
                </button>
              ))}
            </div>

            {/* Ô tìm kiếm linh kiện */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('sim.search')}
                className="w-full h-9 pl-8 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-[clamp(12.5px,0.86vw,15px)] outline-none focus:border-indigo-400 focus:bg-white transition-colors"
              />
              {query && (
                <button onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 grid place-items-center rounded-md text-slate-400 hover:bg-slate-200">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="ml-scroll grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1.5">
              {visibleParts.length === 0 && (
                <p className="col-span-2 text-center text-[clamp(12.5px,0.86vw,15px)] text-slate-400 py-6">{t('sim.noResult')}</p>
              )}
              {visibleParts.map((k) => (
                <button
                  key={k}
                  onClick={() => addPart(k)}
                  title={PART_CATALOG[k].desc}
                  className="group bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl p-2 flex flex-col items-center gap-1 transition-colors"
                >
                  <div className="h-12 grid place-items-center">
                    <PartThumb kind={k} size={k === 'multimeter' ? 26 : 60}
                      live={{ closed: true, knob: 0.4, needle: 0.55, func: 'V', unit: 'V', auto: true, reading: '12.0' }} />
                  </div>
                  <span className="text-[12px] font-bold text-slate-600 text-center leading-tight">{PART_CATALOG[k].short}</span>
                  <span className="text-[11.5px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                    <Plus className="w-2.5 h-2.5" /> Thêm
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {parts.some((p) => p.kind === 'multimeter') && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
            <header className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-indigo-600" />
              <h2 className="text-[clamp(12.5px,0.86vw,15px)] font-extrabold tracking-widest text-slate-700 uppercase">Đồng hồ vạn năng</h2>
            </header>
            <div className="p-3 space-y-3">
              {parts.filter((p) => p.kind === 'multimeter').map((p, mi) => {
                const v = dmm(p);
                const spec = DMM_FUNCS.find((x) => x.id === (p.func ?? 'V')) ?? DMM_FUNCS[1];
                const rangeLabel = p.rangeIdx == null
                  ? 'Thang tự động'
                  : `Thang ${spec.ranges[Math.min(p.rangeIdx, spec.ranges.length - 1)]} ${spec.unit}`;
                return (
                  <div key={p.id} className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[clamp(12.5px,0.86vw,15px)] font-extrabold text-slate-700">Đồng hồ {mi + 1}</span>
                      <span className="font-mono font-extrabold text-[clamp(13px,0.9vw,15.5px)] text-slate-900">
                        {v.text || '– – –'} <span className="text-[12.5px] text-slate-500">{v.unit}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      {DMM_FUNCS.map((fn) => (
                        <button key={fn.id} title={fn.name} onClick={() => setDmmFunc(p.id, fn.id)}
                          className={`h-6 rounded-md text-[12px] font-extrabold border transition-colors ${
                            (p.func ?? 'V') === fn.id
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}>{fn.label}</button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      <DmmChip label="HOLD" active={!!p.hold} onClick={() => dmmAction(p.id, 'hold')} />
                      <DmmChip label="REL" active={p.rel != null} onClick={() => dmmAction(p.id, 'rel')} />
                      <DmmChip label={p.peak === 'min' ? 'MIN' : 'MAX'} active={!!p.peak} onClick={() => dmmAction(p.id, 'peak')} />
                      <DmmChip label={p.ac ? 'AC' : 'DC'} active={!!p.ac} onClick={() => dmmAction(p.id, 'select')} />
                      <DmmChip label="Đèn nền" active={!!p.light} onClick={() => dmmAction(p.id, 'light')} />
                      <DmmChip label={rangeLabel} active={p.rangeIdx != null} onClick={() => dmmAction(p.id, 'range')} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ============ CỘT GIỮA — BÀN LẮP RÁP ============ */}
      <div className="flex flex-col gap-2 min-h-[560px] lg:min-h-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
          <header className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CircuitBoard className="w-4 h-4 text-indigo-600" />
              <h2 className="text-[clamp(12.5px,0.86vw,15px)] font-extrabold tracking-widest text-slate-700 uppercase">Bảng lắp ráp mạch điện</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={toggleK}
                className={`h-7 px-2.5 rounded-lg text-[clamp(12.5px,0.86vw,15px)] font-bold flex items-center gap-1.5 border transition-colors ${
                  kClosed ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}>
                <Power className="w-3.5 h-3.5" />
                {kClosed ? 'Khóa K: đóng' : 'Khóa K: mở'}
              </button>
              <button onClick={() => { setWires((p) => p.map((w) => ({ ...w, points: [] }))); setHint('Đã duỗi thẳng lại toàn bộ dây nối.'); }}
                className="h-7 px-2.5 rounded-lg text-[clamp(12.5px,0.86vw,15px)] font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1.5">
                <Spline className="w-3.5 h-3.5" /> Duỗi dây
              </button>
              <button onClick={() => { setWires([]); setPending(null); setHint('Đã tháo toàn bộ dây nối. Lắp lại mạch từ đầu.'); }}
                className="h-7 px-2.5 rounded-lg text-[clamp(12.5px,0.86vw,15px)] font-bold bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Tháo dây
              </button>
            </div>
          </header>

          <div className="relative flex-1 min-h-0 bg-slate-100/70">
            {/* Thanh công cụ nổi */}
            <div className="absolute left-3 top-3 z-20 bg-white/95 backdrop-blur rounded-xl border border-slate-200 shadow-md p-1 flex flex-col gap-1">
              {([
                ['select', MousePointer2, 'Chọn & di chuyển'],
                ['wire', Cable, 'Nối dây'],
                ['erase', Eraser, 'Tháo dây / gỡ linh kiện'],
              ] as const).map(([id, Icon, title]) => (
                <button key={id} title={title} onClick={() => { setTool(id); setPending(null); }}
                  className={`w-8 h-8 grid place-items-center rounded-lg transition-colors ${
                    tool === id ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-100'
                  }`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Phóng to / thu nhỏ */}
            <div className="absolute left-3 bottom-3 z-20 bg-white/95 backdrop-blur rounded-xl border border-slate-200 shadow-md p-1 flex items-center gap-1">
              <button title="Thu nhỏ" onClick={() => zoomAt(view.z / 1.2)}
                className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="w-11 text-center text-[clamp(12.5px,0.86vw,15px)] font-extrabold text-slate-600 tabular-nums">
                {Math.round(view.z * 100)}%
              </span>
              <button title="Phóng to" onClick={() => zoomAt(view.z * 1.2)}
                className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button title="Về khung hình gốc" onClick={() => setView({ z: 1, tx: 0, ty: 0 })}
                className="w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 border-l border-slate-200">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {currentRheostat && (
              <RheostatKnob
                value={knob}
                onChange={setKnob}
                items={rheostats.map((p, i) => ({ id: p.id, label: `Biến trở ${i + 1}` }))}
                activeId={currentRheostat.id}
                onPick={setActiveRheostat}
              />
            )}

            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onWheel={handleWheel}
              onPointerDown={startPan}
              onPointerMove={handleMove}
              onPointerUp={handleUp}
              onPointerLeave={handleUp}
              onClick={() => { setPending(null); setSelected(null); }}
            >
              <PartDefs />

              {/* Vùng nền: kéo để di chuyển khung nhìn */}
              <rect x={-3000} y={-3000} width={9000} height={9000} fill="transparent" />

              <g transform={`translate(${view.tx},${view.ty}) scale(${view.z})`}>
              {/* Bảng lắp ráp */}
              <g>
                <rect x={BOARD.x + 4} y={BOARD.y + 10} width={BOARD.w - 8} height={BOARD.h} rx={16}
                  fill="#0F172A" opacity={0.28} />
                <rect x={BOARD.x} y={BOARD.y} width={BOARD.w} height={BOARD.h} rx={14} fill="#7C8B9C" />
                <rect x={BOARD.x} y={BOARD.y} width={BOARD.w} height={16} rx={14} fill="#B8C6D4" opacity={0.75} />
                <rect x={BOARD.x + 5} y={BOARD.y + 5} width={BOARD.w - 10} height={BOARD.h - 10} rx={10} fill="#5A6B7C" />
                <rect x={BOARD.x + 11} y={BOARD.y + 11} width={BOARD.w - 22} height={BOARD.h - 22} rx={7} fill="url(#mlBoard)" />
                <rect x={BOARD.x + 11} y={BOARD.y + 11} width={BOARD.w - 22} height={10} rx={5}
                  fill="#000000" opacity={0.22} />
                {holes.map((h) => {
                  const used = holeUsed(h.id);
                  const active = !!pending && pending.c === BOARD_ID && pending.t === h.id;
                  return (
                    <g key={h.id}
                      className={tool === 'wire' || tool === 'erase' ? 'cursor-crosshair' : ''}
                      onPointerDown={(e) => handleTerminal(e, { c: BOARD_ID, t: h.id })}
                      onClick={(e) => { if (tool !== 'select') e.stopPropagation(); }}>
                      <title>Lỗ cắm — cắm được nhiều đầu dây, các dây cùng một lỗ được nối với nhau</title>
                      <circle cx={h.x} cy={h.y + 0.8} r={8} fill="#4E7BD8" opacity={0.5} />
                      <circle cx={h.x} cy={h.y} r={8} fill="#16295C" stroke="#12224B" strokeWidth={1} />
                      <path d={`M ${h.x - 5.6} ${h.y - 5.6} A 8 8 0 0 1 ${h.x + 5.6} ${h.y - 5.6}`}
                        fill="none" stroke="#0A1533" strokeWidth={1.6} strokeLinecap="round" opacity={0.9} />
                      <circle cx={h.x} cy={h.y} r={3.6} fill="#070E22" />
                      <circle cx={h.x} cy={h.y - 0.6} r={3.6} fill="#000000" opacity={0.6} />
                      {used && <circle cx={h.x} cy={h.y} r={5.4} fill="#CBD5E1" stroke="#64748B" strokeWidth={1} />}
                      {tool === 'wire' && (
                        <circle cx={h.x} cy={h.y} r={10} fill="none"
                          stroke={active ? '#F59E0B' : '#34D399'} strokeWidth={active ? 2.6 : 1.2}
                          strokeOpacity={active ? 1 : 0.55} />
                      )}
                      {active && (
                        <circle cx={h.x} cy={h.y} r={10} fill="none" stroke="#F59E0B" strokeWidth={2}>
                          <animate attributeName="r" values="10;16;10" dur="1.1s" repeatCount="indefinite" />
                          <animate attributeName="stroke-opacity" values="0.9;0;0.9" dur="1.1s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </g>
                  );
                })}
                <text x={CANVAS_W / 2} y={BOARD.y + BOARD.h - 26} textAnchor="middle"
                  fontSize={13} fontWeight={700} fill="#DBE6FF" letterSpacing={2.4}>
                  BẢNG LẮP RÁP MẠCH ĐIỆN MÔN VẬT LÝ
                </text>
              </g>

              {parts.length === 0 && (
                <g>
                  <text x={CANVAS_W / 2} y={150} textAnchor="middle" fontSize={19} fontWeight={800} fill="#94A3B8">
                    {t('sim.empty')}
                  </text>
                </g>
              )}

              {/* Linh kiện */}
              {parts.map((p) => {
                const spec = PART_CATALOG[p.kind];
                const faulty = report.faultyIds.includes(p.id);
                return (
                  <g key={p.id} transform={`translate(${p.x},${p.y})`}
                    onPointerDown={(e) => handlePartDown(e, p)}
                    onClick={(e) => e.stopPropagation()}
                    className={`${tool === 'erase' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}>
                    {faulty && (
                      <rect x={-7} y={-7} width={spec.w + 14} height={spec.h + 14} rx={13}
                        fill="none" stroke="#EF4444" strokeWidth={3} strokeDasharray="7 5">
                        <animate attributeName="stroke-opacity" values="1;0.25;1" dur="1s" repeatCount="indefinite" />
                      </rect>
                    )}
                    {selected === p.id && !faulty && (
                      <rect x={-6} y={-6} width={spec.w + 12} height={spec.h + 12} rx={12}
                        fill="none" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 4" />
                    )}
                    <PartArt kind={p.kind} live={liveOf(p)} />
                    {p.kind === 'powersupply' && PS_HOTSPOTS.map((h) => (
                      <g key={h.id} className="cursor-pointer"
                        onPointerDown={(e) => { e.stopPropagation(); psAction(p.id, h.id); }}
                        onClick={(e) => e.stopPropagation()}>
                        <title>{h.title}</title>
                        {h.shape === 'circle'
                          ? <circle cx={h.x} cy={h.y} r={h.r} fill="transparent" />
                          : <rect x={h.x} y={h.y} width={h.w} height={h.h} fill="transparent" />}
                      </g>
                    ))}

                    {p.kind === 'multimeter' && DMM_HOTSPOTS.map((h) => (
                      <g key={h.id} className="cursor-pointer"
                        onPointerDown={(e) => { e.stopPropagation(); dmmAction(p.id, h.id); }}
                        onClick={(e) => e.stopPropagation()}>
                        <title>{h.title}</title>
                        {h.shape === 'circle'
                          ? <circle cx={h.x * DMM_SCALE} cy={h.y * DMM_SCALE} r={(h.r ?? 0) * DMM_SCALE} fill="transparent" />
                          : <rect x={h.x * DMM_SCALE} y={h.y * DMM_SCALE}
                              width={(h.w ?? 0) * DMM_SCALE} height={(h.h ?? 0) * DMM_SCALE} fill="transparent" />}
                      </g>
                    ))}

                    {spec.terminals.map((t) => {
                      const active = !!pending && pending.c === p.id && pending.t === t.id;
                      return (
                        <g key={t.id}
                          onPointerDown={(e) => handleTerminal(e, { c: p.id, t: t.id })}
                          onClick={(e) => { if (tool !== 'select') e.stopPropagation(); }}
                          className={tool === 'wire' || tool === 'erase' ? 'cursor-crosshair' : ''}>
                          <circle cx={t.x} cy={t.y} r={11} fill="transparent" />
                          {tool === 'wire' && (
                            <circle cx={t.x} cy={t.y} r={11} fill="none"
                              stroke={active ? '#F59E0B' : '#34D399'} strokeWidth={active ? 3 : 1.6}
                              strokeOpacity={active ? 1 : 0.75} />
                          )}
                          {active && (
                            <circle cx={t.x} cy={t.y} r={11} fill="none" stroke="#F59E0B" strokeWidth={2}>
                              <animate attributeName="r" values="11;17;11" dur="1.1s" repeatCount="indefinite" />
                              <animate attributeName="stroke-opacity" values="0.9;0;0.9" dur="1.1s" repeatCount="indefinite" />
                            </circle>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Dây nối — luôn vẽ sau cùng nên nằm trên mọi linh kiện */}
              <g style={{ pointerEvents: tool === 'wire' ? 'none' : 'auto' }}>
                {wires.map((w) => {
                  const pts = wirePath(w);
                  if (!pts) return null;
                  const d = splinePath(pts);
                  const stroke = w.color;
                  const bends = w.points ?? [];
                  return (
                    <g key={w.id}>
                      <path d={d} fill="none" stroke="#0F172A" strokeOpacity={0.25} strokeWidth={7}
                        strokeLinecap="round" strokeLinejoin="round" transform="translate(1,3)" />
                      <path d={d} fill="none" stroke={stroke} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                      <path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={1.6}
                        strokeLinecap="round" strokeLinejoin="round" />

                      {/* Vùng bắt chuột để bẻ cong hoặc gỡ dây */}
                      <path d={d} fill="none" stroke="transparent" strokeWidth={12} strokeLinecap="round"
                        className={tool === 'erase' ? 'cursor-pointer' : 'cursor-crosshair'}
                        onPointerDown={(e) => startBend(e, w)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (tool === 'erase') { setWires((p) => p.filter((x) => x.id !== w.id)); }
                        }} />

                      {tool === 'select' && bends.map((q, i) => (
                        <circle key={i} cx={q.x} cy={q.y} r={5}
                          fill="#FFFFFF" stroke={stroke} strokeWidth={2}
                          className="cursor-move"
                          onPointerDown={(e) => { e.stopPropagation(); wireDrag.current = { id: w.id, idx: i }; }}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setWires((prev) => prev.map((x) => (x.id === w.id
                              ? { ...x, points: (x.points ?? []).filter((_, j) => j !== i) }
                              : x)));
                          }}>
                          <title>Kéo để bẻ cong · bấm đúp để bỏ nếp gấp</title>
                        </circle>
                      ))}
                    </g>
                  );
                })}
              </g>
              </g>
            </svg>
          </div>

          <footer className="px-4 py-2 border-t border-slate-200 bg-slate-50/70 flex items-center gap-3">
            <span className="text-[clamp(12.5px,0.86vw,15px)] text-slate-500 flex-1 truncate">{hint}</span>
            <button onClick={() => {
                const stamp = new Date().toLocaleTimeString('vi-VN');
                const payload = { name: `Bản lắp ${stamp}`, data: { parts, wires }, isValid: report.safeToPower };
                if (!onSaveCircuit) { setSavedAt(stamp); return; }
                onSaveCircuit(payload)
                  .then(() => { setSavedAt(stamp); setHint('Đã lưu bản lắp vào cơ sở dữ liệu.'); })
                  .catch(() => setHint('Không lưu được bản lắp — kiểm tra lại máy chủ dữ liệu.'));
              }}
              className="h-8 px-3 rounded-xl text-[clamp(12.5px,0.86vw,15px)] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 shrink-0">
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              {savedAt ? `Đã lưu ${savedAt}` : 'Lưu bản lắp'}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Thành phần phụ                                                      */
/* ------------------------------------------------------------------ */

const DmmChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className={`h-6 px-2 rounded-md text-[12px] font-extrabold border transition-colors ${
      active ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
    }`}>{label}</button>
);

/** Núm xoay biến trở — kéo lên/xuống hoặc dùng thanh trượt */
const RheostatKnob: React.FC<{
  value: number;
  onChange: (v: number) => void;
  items: { id: string; label: string }[];
  activeId: string;
  onPick: (id: string) => void;
}> = ({ value, onChange, items, activeId, onPick }) => {
  const dragging = useRef<{ y: number; v: number } | null>(null);
  const angle = -140 + value * 280;

  return (
    <div className="absolute right-3 bottom-3 z-20 bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-md px-3 py-2.5 flex items-center gap-3">
      <div
        className="relative w-14 h-14 rounded-full bg-slate-800 shadow-inner cursor-ns-resize touch-none grid place-items-center"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          dragging.current = { y: e.clientY, v: value };
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const dy = dragging.current.y - e.clientY;
          onChange(Math.max(0, Math.min(1, dragging.current.v + dy / 160)));
        }}
        onPointerUp={() => { dragging.current = null; }}
      >
        <div className="absolute inset-1.5 rounded-full bg-slate-700" />
        <div className="absolute w-1.5 h-5 bg-white rounded-full"
          style={{ transform: `rotate(${angle}deg) translateY(-13px)` }} />
        <div className="absolute inset-0 rounded-full border-2 border-slate-900/40" />
      </div>
      <div>
        {items.length > 1 && (
          <div className="flex gap-1 mb-1.5">
            {items.map((it, i) => (
              <button key={it.id} onClick={() => onPick(it.id)}
                className={`h-6 px-2 rounded-md text-[12px] font-bold border transition-colors ${
                  it.id === activeId ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}>#{i + 1}</button>
            ))}
          </div>
        )}
        <div className="text-[12px] font-bold uppercase tracking-wide text-slate-500">
          {items.find((i) => i.id === activeId)?.label ?? 'Núm biến trở'}
        </div>
        <div className="font-mono font-extrabold text-slate-800 text-sm">{Math.round(value * 120)} Ω</div>
        <input type="range" min={0} max={100} value={Math.round(value * 100)}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="w-24 accent-indigo-600 mt-1" />
      </div>
    </div>
  );
};

