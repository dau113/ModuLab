/**
 * Bảng lắp ráp mạch điện — bố cục lỗ cắm và các đường dẫn chìm bên trong.
 *
 * Vẽ theo đúng bảng Edison dùng ở trường (xem ảnh chụp bộ dụng cụ):
 *   · Bốn góc bảng là bốn ngoặc chữ U, mỗi ngoặc nối ba lỗ.
 *   · Phần giữa là tám chuỗi chéo, mỗi chuỗi cũng nối ba lỗ thẳng hàng.
 *
 * Vạch trắng in trên mặt bảng chính là thanh kim loại chìm bên dưới, nên các lỗ
 * nằm trên cùng một vạch là một điểm nối duy nhất; vạch khác nhau thì độc lập.
 */

export const BOARD_ID = 'BOARD';

/** Vị trí bảng trên khung vẽ */
export const BOARD_RECT = { x: 34, y: 200, w: 772, h: 350 };

export interface BoardHole {
  id: string;
  x: number;
  y: number;
  /** Mã đường dẫn chìm mà lỗ này thuộc về */
  track: string;
}

export interface BoardTrack {
  id: string;
  /** Các điểm nối liền thành vạch trắng in trên mặt bảng */
  points: { x: number; y: number }[];
  /** Nhãn dễ đọc, dùng cho dòng nhắc thao tác */
  label: string;
}

const holes: BoardHole[] = [];
const tracks: BoardTrack[] = [];

/** Thêm một đường dẫn gồm các lỗ nối liền nhau theo thứ tự */
const addTrack = (id: string, label: string, pts: [number, number][]) => {
  const points = pts.map(([x, y]) => ({ x, y }));
  points.forEach((p, i) => holes.push({ id: `${id}.${i}`, x: p.x, y: p.y, track: id }));
  tracks.push({ id, points, label });
};

/* ------------------------------------------------------------------ */
/* Bốn ngoặc chữ U ở bốn góc                                           */
/* ------------------------------------------------------------------ */

const ARM = 52;   // khoảng cách từ đỉnh ngoặc ra hai đầu theo chiều ngang
const RISE = 36;  // độ mở của ngoặc theo chiều dọc

const CORNERS: { id: string; label: string; apexX: number; apexY: number; dir: 1 | -1 }[] = [
  { id: 'u-tl', label: 'ngoặc góc trên trái', apexX: 96, apexY: 276, dir: 1 },
  { id: 'u-bl', label: 'ngoặc góc dưới trái', apexX: 96, apexY: 464, dir: 1 },
  { id: 'u-tr', label: 'ngoặc góc trên phải', apexX: 744, apexY: 276, dir: -1 },
  { id: 'u-br', label: 'ngoặc góc dưới phải', apexX: 744, apexY: 464, dir: -1 },
];

CORNERS.forEach(({ id, label, apexX, apexY, dir }) => {
  addTrack(id, label, [
    [apexX + dir * ARM, apexY - RISE],
    [apexX, apexY],
    [apexX + dir * ARM, apexY + RISE],
  ]);
});

/* ------------------------------------------------------------------ */
/* Tám chuỗi chéo ở giữa, xếp thành hai hàng bốn cột                   */
/* ------------------------------------------------------------------ */

const DX = 56;  // nửa bề ngang một chuỗi
const DY = 40;  // nửa chiều cao một chuỗi
const COL_X = [248, 364, 480, 596];
const ROW_Y = [292, 448];

ROW_Y.forEach((cy, r) => {
  COL_X.forEach((cx, c) => {
    addTrack(`d${r}-${c}`, `chuỗi hàng ${r + 1}, cột ${c + 1}`, [
      [cx - DX, cy + DY],
      [cx, cy],
      [cx + DX, cy - DY],
    ]);
  });
});

export const BOARD_HOLES: BoardHole[] = holes;
export const BOARD_TRACKS: BoardTrack[] = tracks;

const TRACK_OF = new Map(holes.map((h) => [h.id, h.track]));
const LABEL_OF = new Map(tracks.map((t) => [t.id, t.label]));

/**
 * Đổi mã lỗ cắm thành mã đường dẫn. Các lỗ chung một vạch trắng trả về cùng
 * một mã nên bộ giải mạch hiểu chúng đã được nối thông với nhau.
 */
export const trackOf = (holeId: string): string => TRACK_OF.get(holeId) ?? holeId;

/** Các lỗ cùng nằm trên một đường dẫn với lỗ đã cho */
export const holesOnSameTrack = (holeId: string): BoardHole[] => {
  const t = trackOf(holeId);
  return holes.filter((h) => h.track === t);
};

/** Nhãn dễ đọc của một lỗ cắm, dùng cho dòng nhắc thao tác */
export const holeLabel = (holeId: string): string => {
  const [trackId, idx] = holeId.split('.');
  const label = LABEL_OF.get(trackId);
  if (!label) return holeId;
  const pos = idx === '0' ? 'đầu 1' : idx === '1' ? 'giữa' : 'đầu 2';
  return `${label} — ${pos}`;
};
