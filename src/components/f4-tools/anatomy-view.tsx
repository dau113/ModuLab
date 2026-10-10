/**
 * Hình linh kiện tương tác cho phần Khám phá dụng cụ.
 *
 * Trước đây phần này chỉ có một hình tĩnh kèm một đoạn mô tả chung, nên học sinh
 * nhìn thấy cái núm hay cái chốt trên hình mà không biết nó là gì. Ở đây mỗi bộ
 * phận có một vùng riêng: rê chuột vào thì tô sáng và hiện tên, bấm vào thì ghim
 * lại để đọc kỹ phần giải thích.
 *
 * Vùng bấm vẽ bằng hai nét chồng lên nhau — một nét trắng mờ nằm dưới, một nét
 * sẫm đứt quãng nằm trên — để nhìn rõ trên cả thân nhựa sáng lẫn vỏ máy tối màu.
 *
 * QUY TẮC BỐ CỤC, ĐỪNG ĐỔI: phần chữ thay đổi theo con trỏ phải nằm DƯỚI danh
 * sách tên bộ phận, không được nằm trên. Bản trước đặt ngược lại nên rê chuột
 * vào một cái tên là đoạn chữ phía trên dài ra, đẩy cả hàng tên tụt xuống, con
 * trỏ rơi ra ngoài, chữ co lại, hàng tên nhảy về chỗ cũ — lặp vô tận, nhìn như
 * giật lên giật xuống. Hàng tên nằm trên thì nó không bao giờ tự dịch chuyển
 * dưới con trỏ nữa. Vì lẽ đó mọi thứ phản ứng với hover đều giữ kích thước cố
 * định: nút tên không đổi độ đậm chữ, chấm ghim luôn chiếm sẵn chỗ.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { MousePointerClick, Pin, X } from 'lucide-react';
import { PART_CATALOG, PartArt, PartDefs, ANATOMY } from '../f5-circuit';
import type { PartKind, PartLive, AnatomySpot, AnatomyShape } from '../f5-circuit';

/**
 * Trạng thái hiển thị của từng linh kiện khi đứng yên trong phần khám phá.
 *
 * Riêng biến trở phải để con chạy đúng 0,5 vì vùng bấm của con chạy ghi toạ độ
 * cố định trong anatomy.ts; đổi số này mà quên đổi toạ độ là vùng bấm lệch khỏi hình.
 */
const SHOWCASE: PartLive = {
  closed: true,
  knob: 0.5,
  needle: 0.6,
  powerOn: true,
  volt: 12,
  ampReading: '0.12',
  voltReading: '12.0',
  bright: 0.5,
  rated: 12,
  ledColor: '#EF4444',
  energized: true,
  func: 'V',
  unit: 'V',
  auto: true,
  reading: '12.00',
  bar: 0.45,
};

const shapeProps = (s: AnatomyShape) =>
  s.shape === 'circle'
    ? { cx: s.x, cy: s.y, r: s.r ?? 8 }
    : { x: s.x, y: s.y, width: s.w ?? 10, height: s.h ?? 10, rx: 3 };

const Shape: React.FC<{ s: AnatomyShape } & React.SVGProps<SVGElement>> = ({ s, ...rest }) => {
  const p = shapeProps(s) as Record<string, number>;
  return s.shape === 'circle'
    ? <circle {...p} {...(rest as React.SVGProps<SVGCircleElement>)} />
    : <rect {...p} {...(rest as React.SVGProps<SVGRectElement>)} />;
};

interface Props {
  kind: PartKind;
  /** Tên hiển thị của dụng cụ, dùng cho nhãn trợ năng */
  name?: string;
}

export const PartAnatomy: React.FC<Props> = ({ kind, name }) => {
  const spec = PART_CATALOG[kind];
  const spots: AnatomySpot[] = useMemo(() => ANATOMY[kind] ?? [], [kind]);

  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  /* Đổi sang dụng cụ khác thì bỏ hết phần đang chọn của dụng cụ cũ */
  useEffect(() => { setHover(null); setPinned(null); }, [kind]);

  const activeId = hover ?? pinned;
  const active = spots.find((s) => s.id === activeId) ?? null;

  /* Phím Esc bỏ ghim, cho người dùng bàn phím thoát ra mà không cần chuột */
  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPinned(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pinned]);

  if (!spots.length) return null;

  const PAD = 14;
  const vbW = spec.w + PAD * 2;
  const vbH = spec.h + PAD * 2;
  /* Máy cao như đồng hồ vạn năng thì hạn chế chiều cao để không đẩy phần chữ xuống quá sâu */
  const tall = vbH / vbW > 1.2;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
        <MousePointerClick className="w-4 h-4 text-indigo-600 shrink-0" />
        <p className="text-[clamp(13px,0.9vw,15.5px)] font-semibold text-slate-700">
          Rê chuột hoặc bấm vào từng bộ phận để xem chức năng
        </p>
        {pinned && (
          <button onClick={() => setPinned(null)}
            className="ml-auto h-7 px-2.5 inline-flex items-center gap-1 rounded-lg border border-slate-300
              text-[clamp(12.5px,0.86vw,15px)] text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-3.5 h-3.5" /> Bỏ chọn
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col sm:flex-row gap-4">
        {/* Hình vẽ kèm lớp vùng bấm. Máy cao thì giới hạn theo chiều cao, máy ngang thì theo bề ngang. */}
        <div className={`shrink-0 mx-auto sm:mx-0 ${tall ? 'w-56' : 'w-full sm:w-80'}`}>
          <svg viewBox={`${-PAD} ${-PAD} ${vbW} ${vbH}`}
            className={`w-full h-auto ${tall ? 'max-h-[26rem]' : ''}`}
            role="img" aria-label={`Sơ đồ bộ phận của ${name ?? spec.name}`}>
            <PartDefs />
            <PartArt kind={kind} live={SHOWCASE} />

            {spots.map((s) => {
              const on = s.id === activeId;
              return (
                <g key={s.id}
                  tabIndex={0}
                  role="button"
                  aria-label={s.label}
                  aria-pressed={s.id === pinned}
                  style={{ cursor: 'pointer', outline: 'none' }}
                  onMouseEnter={() => setHover(s.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(s.id)}
                  onBlur={() => setHover(null)}
                  onClick={() => setPinned((p) => (p === s.id ? null : s.id))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setPinned((p) => (p === s.id ? null : s.id));
                    }
                  }}>
                  {/* Vùng bắt chuột: trong suốt nhưng vẫn nhận sự kiện */}
                  {s.shapes.map((sh, i) => (
                    <Shape key={`hit-${i}`} s={sh} fill="transparent" />
                  ))}
                  {/*
                    Nét trắng nằm dưới để viền nổi được trên cả thân nhựa sáng lẫn vỏ máy tối.

                    `vectorEffect="non-scaling-stroke"` giữ bề dày nét tính bằng điểm ảnh chứ
                    không co theo viewBox. Thiếu nó thì ở linh kiện vẽ trong khung toạ độ lớn
                    như đồng hồ vạn năng, nét mảnh đi tới mức gần như biến mất.
                  */}
                  {s.shapes.map((sh, i) => (
                    <Shape key={`halo-${i}`} s={sh} fill="none"
                      stroke="#FFFFFF" strokeOpacity={on ? 0.95 : 0.55}
                      strokeWidth={on ? 5.5 : 3.5} vectorEffect="non-scaling-stroke"
                      style={{ pointerEvents: 'none' }} />
                  ))}
                  {/*
                    Vùng đang chọn thêm một quầng chàm mờ bọc ngoài nét chính. Quầng
                    này nằm hẳn ngoài viền nên mắt bắt được ngay cả khi vùng bé bằng
                    một cái nút bấm, mà không làm mờ hình vẽ bên dưới.
                  */}
                  {on && s.shapes.map((sh, i) => (
                    <Shape key={`glow-${i}`} s={sh} fill="none"
                      stroke="#4F46E5" strokeOpacity={0.3} strokeWidth={9}
                      vectorEffect="non-scaling-stroke"
                      style={{ pointerEvents: 'none' }} />
                  ))}
                  {s.shapes.map((sh, i) => (
                    <Shape key={`line-${i}`} s={sh}
                      fill={on ? 'rgba(79,70,229,0.24)' : 'transparent'}
                      stroke={on ? '#4F46E5' : '#1E293B'}
                      strokeOpacity={on ? 1 : 0.5}
                      strokeWidth={on ? 2.4 : 1.3}
                      strokeDasharray={on ? undefined : '3 4'}
                      vectorEffect="non-scaling-stroke"
                      style={{ pointerEvents: 'none' }} />
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          {/*
            Danh sách tên bộ phận ĐỨNG TRÊN. Chiều cao của nó không phụ thuộc vào
            bộ phận nào đang chọn, nên rê chuột dọc hàng này không làm hàng tự dịch.
          */}
          <p className="text-[clamp(12px,0.82vw,14px)] text-slate-500">
            <strong className="font-semibold text-slate-700">{spots.length} bộ phận</strong>
            {' · rê chuột để xem nhanh, bấm để giữ lại'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {spots.map((s) => {
              const on = s.id === activeId;
              const isPinned = s.id === pinned;
              /*
                Độ đậm chữ và bề rộng của nút giữ nguyên ở mọi trạng thái. Đổi chữ
                sang đậm khi rê chuột sẽ làm nút rộng ra, cả hàng dồn lại và các nút
                phía sau trượt khỏi con trỏ — lại sinh ra đúng kiểu nhấp nháy cũ.
              */
              return (
                <button key={s.id}
                  onMouseEnter={() => setHover(s.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(s.id)}
                  onBlur={() => setHover(null)}
                  onClick={() => setPinned((p) => (p === s.id ? null : s.id))}
                  aria-pressed={isPinned}
                  className={`h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border font-medium
                    text-[clamp(12.5px,0.86vw,15px)] transition-colors ${
                    isPinned
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : on
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                  }`}>
                  {/* Chấm ghim luôn chiếm chỗ, chỉ đổi màu — nút không đổi bề rộng */}
                  <span aria-hidden className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isPinned ? 'bg-indigo-600' : 'bg-transparent'}`} />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/*
            Khung giải thích nằm DƯỚI CÙNG và có chiều cao tối thiểu, nên dù bộ phận
            này mô tả dài hơn bộ phận kia thì cũng không thứ gì ở trên bị xê dịch.
          */}
          <div className="mt-3 min-h-[8rem] rounded-lg border border-slate-200 border-l-[3px] border-l-indigo-500
            bg-white px-3.5 py-3">
            {active ? (
              <>
                <div className="flex items-start gap-2">
                  <h5 className="text-[clamp(14px,0.98vw,16.5px)] font-bold text-indigo-900">
                    {active.label}
                  </h5>
                  {pinned === active.id && (
                    <span className="mt-0.5 shrink-0 inline-flex items-center gap-1 text-[clamp(11px,0.76vw,13px)]
                      text-indigo-700">
                      <Pin className="w-3 h-3" /> đang giữ
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[clamp(13px,0.9vw,15.5px)] text-slate-700 leading-relaxed">
                  {active.desc}
                </p>
              </>
            ) : (
              <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 leading-relaxed">
                Đưa chuột lên hình vẽ, hoặc chọn một tên ở hàng trên, để đọc chức năng
                của từng bộ phận. Bấm vào thì phần giải thích được giữ lại cho em đọc kỹ.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
