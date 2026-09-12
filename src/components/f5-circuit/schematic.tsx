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
  /** Vai trò của đồng hồ vạn năng theo núm xoay */
  role?: 'ammeter' | 'voltmeter' | 'inert';
  faulty?: boolean;
}

/** Bề rộng chuẩn của một ký hiệu; hai chốt nằm ở hai đầu */
export const SYM_W = 92;
export const SYM_H = 56;

const STROKE = '#1E293B';

/** Ký hiệu quy ước của từng loại linh kiện, vẽ trong khung SYM_W × SYM_H */
export const Symbol: React.FC<SymbolProps> = ({ kind, closed, lit, role, faulty }) => {
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
          <circle cx={cx} cy={cy} r={15} fill={lit ? '#FEF3C7' : '#FFFFFF'} stroke={color} strokeWidth={2.2} />
          <path d={`M ${cx - 10.6} ${cy - 10.6} L ${cx + 10.6} ${cy + 10.6}
                    M ${cx + 10.6} ${cy - 10.6} L ${cx - 10.6} ${cy + 10.6}`}
            stroke={color} strokeWidth={2} />
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
