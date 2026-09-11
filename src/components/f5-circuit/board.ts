/**
 * Bảng lắp ráp mạch điện — bố cục lỗ cắm và các đường dẫn chìm bên trong.
 *
 * Lưới 10 cột × 4 hàng, tổng cộng 40 lỗ. Vạch trắng in trên mặt bảng chính là
 * thanh kim loại chìm bên dưới, nối các lỗ trên cùng một vạch thành một điểm nối:
 *
 *   · 4 ngoặc chữ U ôm bốn góc, mỗi ngoặc nối 4 lỗ (hai cột ngoài cùng).
 *   · 8 nhóm ngang ở giữa, mỗi nhóm nối 3 lỗ liền nhau trên cùng một hàng.
 *
 * Toạ độ ở đây là toạ độ trong lòng bảng. Mỗi bảng đặt trên bàn lắp có gốc
 * riêng, nên có thể đặt nhiều bảng cùng lúc mà không lẫn lỗ của nhau.
 */

/** Tiền tố mã bảng; mỗi bảng trên bàn mang một mã riêng dạng BOARD-1, BOARD-2… */
export const BOARD_PREFIX = 'BOARD';

/** Một mã linh kiện có phải là bảng lắp ráp hay không */
export const isBoardId = (id: string): boolean => id.startsWith(BOARD_PREFIX);

/** Kích thước một tấm bảng */
export const BOARD_W = 704;
export const BOARD_H = 322;

const GRID_COLS = 10;
const GRID_ROWS = 4;
const X0 = 64;
const Y0 = 60;
const DX = 64;
const DY = 68;

const px = (col: number) => X0 + col * DX;
const py = (row: number) => Y0 + row * DY;

export interface BoardHole {
  id: string;
  /** Toạ độ trong lòng bảng */
  x: number;
  y: number;
  col: number;
  row: number;
  /** Mã đường dẫn chìm; lỗ đứng riêng mang mã của chính nó */
  track: string;
}

export interface BoardTrack {
  id: string;
  points: { x: number; y: number }[];
  label: string;
}

type Cell = [number, number];

/**
 * Bốn ngoặc chữ U ở bốn góc. Mỗi ngoặc gồm hai lỗ hàng trên, một cạnh dọc và
 * hai lỗ hàng dưới, ôm lấy góc bảng.
 */
const CORNER_TRACKS: { id: string; label: string; cells: Cell[] }[] = [
  { id: 'u-tl', label: 'ngoặc góc trên trái', cells: [[1, 0], [0, 0], [0, 1], [1, 1]] },
  { id: 'u-tr', label: 'ngoặc góc trên phải', cells: [[8, 0], [9, 0], [9, 1], [8, 1]] },
  { id: 'u-bl', label: 'ngoặc góc dưới trái', cells: [[1, 2], [0, 2], [0, 3], [1, 3]] },
  { id: 'u-br', label: 'ngoặc góc dưới phải', cells: [[8, 2], [9, 2], [9, 3], [8, 3]] },
];

/** Tám nhóm ngang ở giữa: mỗi hàng có hai nhóm ba lỗ liền nhau */
const MID_TRACKS: { id: string; label: string; cells: Cell[] }[] = [];
for (let r = 0; r < GRID_ROWS; r++) {
  MID_TRACKS.push({
    id: `m${r}a`,
    label: `nhóm ngang hàng ${r + 1} bên trái`,
    cells: [[2, r], [3, r], [4, r]],
  });
  MID_TRACKS.push({
    id: `m${r}b`,
    label: `nhóm ngang hàng ${r + 1} bên phải`,
    cells: [[5, r], [6, r], [7, r]],
  });
}

/* ------------------------------------------------------------------ */

const trackByCell = new Map<string, string>();
const tracks: BoardTrack[] = [];

[...CORNER_TRACKS, ...MID_TRACKS].forEach(({ id, label, cells }) => {
  cells.forEach(([c, r]) => trackByCell.set(`${c},${r}`, id));
  tracks.push({ id, label, points: cells.map(([c, r]) => ({ x: px(c), y: py(r) })) });
});

const holes: BoardHole[] = [];
for (let r = 0; r < GRID_ROWS; r++) {
  for (let c = 0; c < GRID_COLS; c++) {
    holes.push({
      id: `h${c}-${r}`,
      x: px(c),
      y: py(r),
      col: c,
      row: r,
      track: trackByCell.get(`${c},${r}`) ?? `solo-${c}-${r}`,
    });
  }
}

export const BOARD_HOLES: BoardHole[] = holes;
export const BOARD_TRACKS: BoardTrack[] = tracks;

const TRACK_OF = new Map(holes.map((h) => [h.id, h.track]));

/**
 * Đổi mã lỗ cắm thành mã đường dẫn. Các lỗ chung một vạch trắng trả về cùng
 * một mã nên bộ giải mạch hiểu chúng đã được nối thông với nhau. Việc tách
 * bảng này với bảng kia do phần mã bảng trong mã chốt lo, không phải ở đây.
 */
export const trackOf = (holeId: string): string => TRACK_OF.get(holeId) ?? holeId;

/** Các lỗ cùng nằm trên một đường dẫn với lỗ đã cho */
export const holesOnSameTrack = (holeId: string): BoardHole[] => {
  const t = trackOf(holeId);
  return holes.filter((h) => h.track === t);
};

/** Nhãn dễ đọc của một lỗ cắm, dùng cho dòng nhắc thao tác */
export const holeLabel = (holeId: string): string => {
  const h = holes.find((x) => x.id === holeId);
  return h ? `cột ${h.col + 1} hàng ${h.row + 1}` : holeId;
};
