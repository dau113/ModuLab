/**
 * F0 — Trang chủ.
 *
 * Bố cục hai tầng:
 *
 *   · Tầng trên là một khung hình lớn: ảnh chụp tiết thực hành phủ kín màn
 *     hình, chữ trắng đặt bên trái, băng ảnh các bước làm việc nằm bên phải.
 *     Ảnh ở đây không phải hình minh hoạ thêm vào cho đẹp — nó nói ngay điều
 *     mà đoạn văn phải mất một khổ mới nói được: đây là giờ thực hành thật,
 *     với bộ dụng cụ thật.
 *
 *   · Tầng dưới trở lại nền sáng, chữ dẫn dắt: giới thiệu, bốn phần của ứng
 *     dụng, rồi danh sách tài khoản. Phần này là nơi đọc và thao tác nên giữ
 *     đúng lối cũ, không đặt ảnh chen vào.
 *
 * Nguyên tắc màu vẫn giữ nguyên: màu chàm chỉ dành cho hành động chính.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';
import { useSettings } from '../../settings';
import { SettingsMenu } from '../common';
import { APP_VERSION } from '../../version';
import type { ApiUser } from '../../api/client';

/* Ảnh chụp tại phòng thí nghiệm trường, dùng đúng bộ dụng cụ mà phần mềm mô phỏng */
import photoClass from '../../assets/photos/tiet-hoc.jpg';
import photoKit from '../../assets/photos/bo-dung-cu-that.jpg';
import photoApp from '../../assets/photos/dung-modulab.jpg';
import photoWarning from '../../assets/photos/canh-bao-doan-mach.jpg';
import photoCompare from '../../assets/photos/doi-chieu-ao-that.jpg';

interface HomeMenuProps {
  users: ApiUser[];
  onEnter: (userId: string, guest?: boolean) => void;
  currentUserId?: string;
}

type Role = 'hs' | 'gv';

/** Bốn phần của ứng dụng, viết thành một hàng chữ chứ không phải bốn thẻ */
const SECTIONS = ['Khởi động', 'Thực hành', 'Báo cáo thực hành', 'Tài liệu'];

/** Ảnh nền của khung hình lớn */
const HERO_BG = photoClass;

/**
 * Các lớp phủ tối viết thẳng bằng mã màu, không mượn thang màu của Tailwind.
 *
 * Giao diện tối của ModuLab đảo ngược cả thang xám ở cấp biến CSS: `slate-950`
 * ở chế độ tối hoá ra màu trắng. Nếu lớp phủ dùng `from-slate-950` thì khi bật
 * chế độ tối nó sẽ phủ TRẮNG lên ảnh, chữ trắng nằm trên nền trắng và mất hút.
 * Ảnh chụp thì lúc nào cũng cần nền tối để chữ trắng đọc được, nên ba lớp phủ
 * dưới đây cố định màu, không đổi theo giao diện.
 */
const OVERLAY_SIDE =
  'linear-gradient(to right, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.70) 50%, rgba(2,6,23,0.40) 100%)';
const OVERLAY_VERT =
  'linear-gradient(to top, rgba(2,6,23,0.75) 0%, rgba(2,6,23,0) 50%, rgba(2,6,23,0.45) 100%)';
const CARD_SCRIM =
  'linear-gradient(to top, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.15) 55%, rgba(2,6,23,0) 100%)';

/**
 * Băng ảnh bên phải, xếp theo đúng trình tự một buổi thực hành: xem bộ dụng cụ,
 * lắp thử trên phần mềm, để phần mềm bắt lỗi, rồi đối chiếu với số đo thật.
 */
const SLIDES: { src: string; label: string; caption: string }[] = [
  {
    src: photoKit,
    label: 'Bộ dụng cụ thật',
    caption:
      'Bảng lắp ráp Edison, đồng hồ vạn năng và biến áp nguồn ở phòng thí nghiệm của trường. '
      + 'Mười ba linh kiện trong phần mềm đều dựng lại từ chính bộ dụng cụ này.',
  },
  {
    src: photoApp,
    label: 'Lắp thử trên ModuLab',
    caption:
      'Chọn linh kiện, nối dây và đóng khoá ngay trên máy. Lắp sai thì sửa lại, '
      + 'không tốn linh kiện và không phải chờ tới tiết sau.',
  },
  {
    src: photoWarning,
    label: 'Phần mềm bắt lỗi',
    caption:
      'Nối tắt hai cực nguồn, hệ thống báo đoản mạch, chỉ đúng chỗ sai kèm lý do '
      + 'thay vì để thiết bị cháy.',
  },
  {
    src: photoCompare,
    label: 'Đối chiếu hai bên',
    caption:
      'Đặt số đo trên đồng hồ thật cạnh số liệu phần mềm tính ra để thấy sai số '
      + 'ở đâu và vì sao có sai số đó.',
  },
];

export const HomeMenu: React.FC<HomeMenuProps> = ({ users, onEnter }) => {
  const { t } = useSettings();
  const [role, setRole] = useState<Role>('hs');
  const [slide, setSlide] = useState(0);
  const [maxSlide, setMaxSlide] = useState(SLIDES.length - 1);
  const [zoom, setZoom] = useState<number | null>(null);
  const accountsRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const students = users.filter((u) => u.role === 'hs');
  const teachers = users.filter((u) => u.role === 'gv');
  const list = role === 'hs' ? students : teachers;

  const go = useCallback((step: number) => {
    setSlide((i) => Math.min(maxSlide, Math.max(0, i + step)));
  }, [maxSlide]);

  /**
   * Bao nhiêu thẻ ảnh lọt vào khung thì dừng cuộn ở đó.
   *
   * Nếu cứ cho cuộn tới thẻ cuối cùng thì ở màn rộng sẽ còn trơ một thẻ với hai
   * khoảng trống bên cạnh, nhìn như hỏng. Số thẻ lọt khung thay đổi theo bề
   * ngang màn hình nên phải đo, không suy ra được từ hằng số.
   */
  useEffect(() => {
    const box = trackRef.current;
    if (!box) return;

    const measure = () => {
      const card = box.querySelector('button');
      if (!card) return;
      const step = card.getBoundingClientRect().width + 16;
      const fit = Math.max(1, Math.floor((box.clientWidth + 8) / step));
      const max = Math.max(0, SLIDES.length - fit);
      setMaxSlide(max);
      setSlide((i) => Math.min(i, max));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  /* Đóng ảnh phóng to bằng phím Esc, chuyển ảnh bằng phím mũi tên */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(null);
      if (zoom !== null) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, zoom]);

  const toAccounts = () =>
    accountsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /**
   * Kích thước thẻ ảnh khai báo bằng biến CSS để nó co giãn theo chiều cao màn
   * hình: màn thấp thì thẻ nhỏ lại, màn cao thì thẻ lấp đầy khung hình. Vì băng
   * ảnh dịch chuyển theo đúng hai biến này nên không cần đo đạc bằng JavaScript.
   */
  const trackVars = {
    '--card-h': 'clamp(280px, 46vh, 430px)',
    '--card-w': 'calc(var(--card-h) * 0.74)',
    '--card-gap': '16px',
  } as React.CSSProperties;

  return (
    <div className="ml-scroll ml-page h-screen overflow-y-auto text-slate-900">

      {/* ---------------------------------------------------------------- */}
      {/* Khung hình lớn: ảnh chụp phủ kín, chữ và băng ảnh đặt đè lên trên  */}
      {/* ---------------------------------------------------------------- */}
      {/*
        Trên màn rộng khung hình cao cố định theo màn hình. Trên điện thoại thì
        không: chữ và băng ảnh xếp chồng nên phải để khung cao theo nội dung,
        nếu ép chiều cao thì hàng nút chuyển ảnh bị cắt mất.
      */}
      <section className="relative overflow-hidden lg:min-h-[600px] lg:h-[82vh]">
        <img
          src={HERO_BG}
          alt="Một tiết thực hành Vật lí điện học tại phòng thí nghiệm của trường"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Hai lớp phủ tối: một lớp ngang cho cột chữ bên trái, một lớp dọc cho hàng nút bên dưới */}
        <div className="absolute inset-0" style={{ backgroundImage: OVERLAY_SIDE }} />
        <div className="absolute inset-0" style={{ backgroundImage: OVERLAY_VERT }} />

        <div className="relative lg:h-full flex flex-col">
          <header className="h-16 shrink-0 px-6 md:px-10 flex items-center justify-between">
            <span className="text-h3 font-medium tracking-tight text-white">ModuLab</span>
            <SettingsMenu tone="onDark" />
          </header>

          <div className="px-6 md:px-10 pb-12 grid gap-10 lg:flex-1 lg:min-h-0
            lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-center">

            {/* Cột chữ */}
            <div className="pt-4 lg:pt-0">
              <p className="text-body text-white/60">Trợ lý số giờ học thực hành</p>
              <h1 className="mt-3 text-white font-semibold tracking-tight
                text-[32px] leading-[1.12] md:text-[42px]">
                Lắp thử trên máy trước khi chạm vào thiết bị thật.
              </h1>
              <p className="mt-5 text-h3 text-white/75 leading-[1.7] max-w-[30rem]">
                ModuLab dựng lại phòng thực hành Vật lí điện học của trường: mười ba linh kiện
                mô phỏng theo bộ dụng cụ thật, chạy đúng các định luật vật lí. Đấu sai thì hệ
                thống chỉ ngay chỗ sai, không để cháy thiết bị.
              </p>
              <button
                onClick={toAccounts}
                className="mt-7 h-11 pl-6 pr-5 inline-flex items-center gap-2 rounded-full
                  bg-indigo-600 text-white text-body font-medium
                  hover:bg-indigo-500 transition-colors">
                Vào phòng thực hành
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Băng ảnh */}
            <div className="min-w-0 lg:self-center" style={trackVars}>
              <div ref={trackRef} className="overflow-hidden">
                <div
                  className="flex gap-[var(--card-gap)] transition-transform duration-500 ease-out"
                  style={{
                    transform:
                      `translateX(calc(${slide} * (var(--card-w) + var(--card-gap)) * -1))`,
                  }}>
                  {SLIDES.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => setZoom(i)}
                      title={`${s.label} — bấm để xem ảnh lớn`}
                      className="group relative shrink-0 w-[var(--card-w)] h-[var(--card-h)]
                        rounded-2xl overflow-hidden
                        text-left ring-1 ring-white/20 focus:outline-none
                        focus-visible:ring-2 focus-visible:ring-white">
                      <img src={s.src} alt={s.caption}
                        className="absolute inset-0 w-full h-full object-cover
                          transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0" style={{ backgroundImage: CARD_SCRIM }} />
                      <span className="absolute left-4 right-4 bottom-4 text-white
                        text-h3 font-semibold leading-tight">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hàng điều khiển: hai nút, thanh tiến trình, số thứ tự */}
              <div className="mt-6 flex items-center gap-4">
                <button onClick={() => go(-1)} disabled={slide === 0}
                  aria-label="Ảnh trước"
                  className="h-10 w-10 shrink-0 grid place-items-center rounded-full
                    border border-white/35 text-white transition-colors
                    hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button onClick={() => go(1)} disabled={slide >= maxSlide}
                  aria-label="Ảnh kế tiếp"
                  className="h-10 w-10 shrink-0 grid place-items-center rounded-full
                    border border-white/35 text-white transition-colors
                    hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent">
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Thanh này cho biết đã cuộn tới đâu, nên tính theo vị trí cuộn chứ không theo số thẻ */}
                <div className="flex-1 h-px bg-white/25 relative">
                  <div className="absolute inset-y-0 left-0 bg-white transition-[width] duration-500"
                    style={{ width: `${maxSlide === 0 ? 100 : (slide / maxSlide) * 100}%` }} />
                </div>

                <span className="text-white/80 tabular-nums text-h2 shrink-0">
                  {String(slide + 1).padStart(2, '0')}
                  <span className="text-white/45"> / {String(SLIDES.length).padStart(2, '0')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Phần đọc và thao tác, nền sáng như cũ                              */}
      {/* ---------------------------------------------------------------- */}
      <div className="max-w-2xl mx-auto px-6 md:px-10">

        <section className="pt-12 pb-8">
          <h2 className="text-h1 tracking-tight">
            ModuLab — trợ lý số hỗ trợ giờ học thực hành cho học sinh THPT
          </h2>

          <p className="mt-6 text-h3 text-slate-700 leading-[1.75]">
            {t('home.hero.intro')}
          </p>

          <p className="mt-4 text-h3 text-slate-700 leading-[1.75]">
            Ứng dụng có <strong className="font-semibold">75 câu hỏi</strong> chia ba chủ đề,{' '}
            <strong className="font-semibold">13 linh kiện</strong> mô phỏng theo bộ dụng cụ thật và{' '}
            <strong className="font-semibold">4 bài lý thuyết</strong> từ định luật Ohm tới nguồn điện.
          </p>
        </section>

        <section className="py-6 border-t border-slate-200">
          <h2 className="text-h2 mb-2">Bốn phần của ứng dụng</h2>
          <p className="text-h3 text-slate-700 leading-[1.75]">
            {SECTIONS.map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <span className="text-slate-300"> · </span>}
                <span>{s}</span>
              </React.Fragment>
            ))}
          </p>
          <p className="mt-2 text-body text-slate-500 leading-relaxed">
            Làm theo thứ tự này là hợp lý nhất, nhưng em vào phần nào trước cũng được.
          </p>
        </section>

        <section ref={accountsRef} className="py-6 border-t border-slate-200 scroll-mt-4">
          <h2 className="text-h2 mb-1">Vào phòng thực hành</h2>
          <p className="text-body text-slate-500 mb-5">
            Chọn tài khoản của em để bắt đầu.
          </p>

          <div className="flex gap-5 mb-3 text-body">
            {([['hs', 'Học sinh'], ['gv', 'Giáo viên']] as [Role, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setRole(id)}
                className={`pb-1 border-b-2 transition-colors ${
                  role === id
                    ? 'border-indigo-600 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <ul className="border-t border-slate-200">
            {list.map((u) => (
              <li key={u.id} className="border-b border-slate-200">
                <button onClick={() => onEnter(u.id)}
                  className="w-full text-left py-3 flex items-center gap-3 group">
                  <span className="text-h3 text-slate-800">{u.name}</span>
                  {u.teamCode && (
                    <span className="text-body text-slate-400">{u.teamCode}</span>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-300 ml-auto shrink-0
                    group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onEnter(students[0]?.id ?? users[0]?.id, true)}
            className="mt-4 text-body text-slate-500 underline underline-offset-4 hover:text-slate-800 transition-colors">
            Hoặc vào xem thử với tư cách khách
          </button>
        </section>
      </div>

      <footer className="border-t border-slate-200 py-5 px-6 md:px-10">
        <p className="max-w-2xl mx-auto text-body text-slate-400">
          ModuLab v{APP_VERSION}
        </p>
      </footer>

      {/* Ảnh phóng to: chỗ duy nhất hiện đủ lời chú thích của từng ảnh */}
      {zoom !== null && (
        <div
          className="fixed inset-0 z-50 p-6 grid place-items-center"
          style={{ backgroundColor: 'rgba(2,6,23,0.92)' }}
          onClick={() => setZoom(null)}>
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={SLIDES[zoom].src} alt={SLIDES[zoom].caption}
              className="w-full rounded-xl" />
            <div className="mt-4 flex items-start gap-4">
              <div className="min-w-0">
                <p className="text-white text-h2">{SLIDES[zoom].label}</p>
                <p className="mt-1 text-white/70 text-body leading-relaxed">
                  {SLIDES[zoom].caption}
                </p>
              </div>
              <button onClick={() => setZoom(null)} aria-label="Đóng ảnh"
                className="ml-auto h-9 w-9 shrink-0 grid place-items-center rounded-lg
                  border border-white/30 text-white/80 hover:bg-white/15 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
