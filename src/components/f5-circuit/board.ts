/**
 * Bảng lắp ráp mạch điện — bố cục lỗ cắm và các đường dẫn chìm bên trong.
 *
 * Trên mặt bảng thật, mỗi vạch trắng in nổi nối hai lỗ cắm liền nhau; bên dưới
 * lớp nhựa là một thanh kim loại nối thông hai lỗ đó. Hai lỗ cùng một vạch coi
 * như một điểm nối duy nhất, còn các vạch khác nhau thì độc lập.
 *
 * Các vạch xếp so le kiểu gạch xây: hàng chẵn ghép từ cột 0, hàng lẻ ghép lệch
 * đi một cột, đúng như hình chụp bộ dụng cụ Edison dùng ở trường.
 */

export const BOARD_ID = 'BOARD';

/** Vị trí bảng trên khung vẽ và khoảng cách lỗ */
export const BOARD_RECT = { x: 34, y: 206, w: 772, h: 338 };
export const COLS = 10;
export const ROWS = 5;
const X0 = 92;
const Y0 = 250;
const DX = 74;
const DY = 62;

export interface BoardHole {
  id: string;
  x: number;
  y: number;
  /** Mã đường dẫn chìm mà lỗ này thuộc về */
  track: string;
}

export interface BoardTrack {
  id: string;
  /** Hai đầu của vạch trắng in trên mặt bảng */
  a: { x: number; y: number };
  b: { x: number; y: number };
}

const holes: BoardHole[] = [];
const tracks: BoardTrack[] = [];

for (let r = 0; r < ROWS; r++) {
  /* Hàng lẻ lệch đi một cột để các vạch nằm so le nhau */
  const offset = r % 2;
  for (let c = 0; c < COLS; c++) {
    const id = `h${c}-${r}`;
    const x = X0 + c * DX;
    const y = Y0 + r * DY;

    /* Cặp lỗ nào nằm chung một vạch: (offset, offset+1), (offset+2, offset+3)… */
    const rel = c - offset;
    const pairIndex = rel >= 0 ? Math.floor(rel / 2) : -1;
    const inPair = rel >= 0 && pairIndex * 2 + 1 + offset < COLS;

    const track = inPair ? `t${r}-${pairIndex}` : `s${c}-${r}`;
    holes.push({ id, x, y, track });

    /* Ghi lại vạch trắng để vẽ, chỉ ghi một lần ở lỗ bên trái của cặp */
    if (inPair && rel % 2 === 0) {
      tracks.push({ id: track, a: { x, y }, b: { x: x + DX, y } });
    }
  }
}

export const BOARD_HOLES: BoardHole[] = holes;
export const BOARD_TRACKS: BoardTrack[] = tracks;

const TRACK_OF = new Map(holes.map((h) => [h.id, h.track]));

/**
 * Đổi mã lỗ cắm thành mã đường dẫn. Hai lỗ chung một vạch trắng trả về cùng
 * một mã nên bộ giải mạch hiểu chúng đã được nối thông với nhau.
 */
export const trackOf = (holeId: string): string => TRACK_OF.get(holeId) ?? holeId;

/** Các lỗ cùng nằm trên một đường dẫn với lỗ đã cho */
export const holesOnSameTrack = (holeId: string): BoardHole[] => {
  const t = trackOf(holeId);
  return holes.filter((h) => h.track === t);
};
