/**
 * Bảng lắp ráp mạch điện — bố cục lỗ cắm và các đường dẫn chìm bên trong.
 *
 * Vẽ theo đúng bảng Edison dùng ở trường: các vạch trắng in trên mặt bảng chạy
 * chéo, ba lỗ nối lại thành hình chữ V. Bên dưới lớp nhựa là một thanh kim loại
 * nối thông cả ba lỗ đó, nên chúng là một điểm nối duy nhất. Hai chữ V khác
 * nhau thì hoàn toàn độc lập.
 *
 * Cách xếp: mỗi dải có một hàng lỗ trên và một hàng lỗ dưới. Lỗ hàng dưới nằm
 * giữa hai lỗ hàng trên và là đỉnh của chữ V. Dải kế tiếp lệch đi nửa cột để
 * các chữ V cài vào nhau giống trên mặt bảng thật.
 */

export const BOARD_ID = 'BOARD';

/** Vị trí bảng trên khung vẽ */
export const BOARD_RECT = { x: 34, y: 200, w: 772, h: 350 };

/** Số chữ V mỗi dải và số dải */
const CHEVRONS_PER_BAND = 5;
const BANDS = 3;

const X0 = 80;
const Y0 = 244;
const COL = 50;   // nửa bề ngang một chữ V
const GAP = 34;   // khoảng hở giữa hai chữ V liền nhau
const HALF = 46;  // độ sâu của chữ V
const BAND = 100; // khoảng cách giữa hai dải
const STEP = COL * 2 + GAP;

export interface BoardHole {
  id: string;
  x: number;
  y: number;
  /** Mã đường dẫn chìm mà lỗ này thuộc về */
  track: string;
}

export interface BoardTrack {
  id: string;
  /** Ba điểm của vạch trắng: đầu trái, đỉnh dưới, đầu phải */
  points: { x: number; y: number }[];
}

const holes: BoardHole[] = [];
const tracks: BoardTrack[] = [];

for (let b = 0; b < BANDS; b++) {
  /* Dải lẻ lệch nửa cột để các chữ V cài vào nhau */
  const shift = (b % 2) * (COL / 2);
  const yTop = Y0 + b * BAND;
  const yBottom = yTop + HALF;

  for (let k = 0; k < CHEVRONS_PER_BAND; k++) {
    const track = `t${b}-${k}`;
    const xLeft = X0 + shift + k * STEP;
    const xApex = xLeft + COL;
    const xRight = xLeft + COL * 2;

    const pts = [
      { id: `${track}L`, x: xLeft, y: yTop },
      { id: `${track}A`, x: xApex, y: yBottom },
      { id: `${track}R`, x: xRight, y: yTop },
    ];

    pts.forEach((p) => holes.push({ id: p.id, x: p.x, y: p.y, track }));
    tracks.push({ id: track, points: pts.map(({ x, y }) => ({ x, y })) });
  }
}

export const BOARD_HOLES: BoardHole[] = holes;
export const BOARD_TRACKS: BoardTrack[] = tracks;

const TRACK_OF = new Map(holes.map((h) => [h.id, h.track]));

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
  const m = /^t(\d+)-(\d+)([LAR])$/.exec(holeId);
  if (!m) return holeId;
  const side = m[3] === 'L' ? 'trái' : m[3] === 'R' ? 'phải' : 'đỉnh';
  return `dải ${Number(m[1]) + 1}, vạch ${Number(m[2]) + 1} (${side})`;
};
