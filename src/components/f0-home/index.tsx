/**
 * F0 — Trang chủ.
 *
 * Nguyên tắc về màu: màu chàm chỉ dành cho MỘT việc là hành động chính (nút vào
 * phòng thực hành, dòng đang chọn, viền khi bấm phím). Mọi thứ còn lại dùng
 * thang xám: phân cấp do cỡ chữ và độ đậm quyết định, không phải do màu. Trước
 * đây tiêu đề, biểu tượng, số liệu, nút bấm đều cùng một màu chàm nên không có
 * gì nổi bật hơn gì.
 *
 * Về bố cục: khối chọn tài khoản là thao tác đăng nhập nên trình bày như một
 * danh sách chọn, còn khối giới thiệu các phần là thông tin nên trình bày như
 * một danh sách có đánh số. Hai mục đích khác nhau thì hình thức phải khác nhau.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';
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

type Role = 'hs' | 'gv' | 'khach';

const SECTIONS = [
  {
    name: 'Khởi động',
    desc: 'Trắc nghiệm nhanh hoặc trò chơi phiêu lưu, lấy câu hỏi từ ngân hàng 75 câu chia ba chủ đề.',
  },
  {
    name: 'Thực hành',
    desc: 'Lắp mạch trên bảng lắp ráp ảo. Bộ giải mạch tính đúng dòng và thế, nối sai thì báo ngay chỗ sai.',
  },
  {
    name: 'Báo cáo thực hành',
    desc: 'Nhập số liệu từng lần đo, tự tính điện trở trung bình và sai số, rồi nộp cho giáo viên.',
  },
  {
    name: 'Tài liệu',
    desc: 'Lý thuyết bốn bài từ định luật Ohm tới nguồn điện, kèm tra cứu từng dụng cụ trong bộ thí nghiệm.',
  },
];

/** Ảnh nền của khung hình lớn mở đầu trang */
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
    label: 'Hỗ trợ tìm lỗi',
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
  const [role, setRole] = useState<Role>('hs');
  const [slide, setSlide] = useState(0);
  const [maxSlide, setMaxSlide] = useState(SLIDES.length - 1);
  const [zoom, setZoom] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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

  /* Kích thước thẻ ảnh khai báo bằng biến CSS để co giãn theo chiều cao màn hình */
  const trackVars = {
    '--card-h': 'clamp(280px, 46vh, 430px)',
    '--card-w': 'calc(var(--card-h) * 0.74)',
    '--card-gap': '16px',
  } as React.CSSProperties;

  const students = users.filter((u) => u.role === 'hs');
  const teachers = users.filter((u) => u.role === 'gv');
  const list = role === 'hs' ? students : role === 'gv' ? teachers : [];

  const [picked, setPicked] = useState<string | null>(null);
  const chosen = picked ?? list[0]?.id ?? null;

  const enter = () => {
    if (role === 'khach') onEnter(students[0]?.id ?? users[0]?.id, true);
    else if (chosen) onEnter(chosen);
  };

  return (
    <div className="ml-scroll h-screen overflow-y-auto bg-white text-slate-900">
      {/* ---------------------------------------------------------------- */}
      {/* Khung hình lớn: ảnh chụp tiết thực hành phủ kín, tiêu đề và băng   */}
      {/* ảnh đặt đè lên trên. Thanh tên ứng dụng nằm luôn trong khung này.  */}
      {/* ---------------------------------------------------------------- */}
      {/*
        Chiều cao dùng min-height chứ không cố định: khối đăng nhập nằm trong
        khung hình nên ở màn thấp nội dung có thể cao hơn một màn hình, ép chiều
        cao thì nút bấm cuối khối bị cắt mất.
      */}
      <section className="relative overflow-hidden lg:min-h-[max(600px,86vh)]">
        <img
          src={HERO_BG}
          alt="Một tiết thực hành Vật lí điện học tại phòng thí nghiệm của trường"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundImage: OVERLAY_SIDE }} />
        <div className="absolute inset-0" style={{ backgroundImage: OVERLAY_VERT }} />

        <div className="relative flex flex-col lg:min-h-[max(600px,86vh)]">
          <header className="h-16 shrink-0 px-6 md:px-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md grid place-items-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.32)' }}>
                <div className="w-3 h-3 rounded-[2px]" style={{ border: '2px solid #fff' }} />
              </div>
              <span className="text-[clamp(15px,1.05vw,17.5px)] font-semibold tracking-tight text-white">
                ModuLab
              </span>
            </div>
            <SettingsMenu tone="onDark" />
          </header>

          <div className="px-6 md:px-10 pb-12 grid gap-10 lg:flex-1 lg:min-h-0
            lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-center">

            {/* Cột chữ — nguyên văn tiêu đề của bản 1.51 */}
            <div className="pt-4 lg:pt-0">
              <h1 className="text-[clamp(26px,3vw,38px)] font-bold leading-[1.15] tracking-tight text-white">
                {/* Dấu cách không ngắt (\u00A0) giữ "Vật lí" không bị tách đôi khi xuống dòng */}
                “ModuLab” — trợ lý số hỗ trợ giờ thực hành Vật lí cấp THPT
              </h1>

              {/*
                Khối đăng nhập đặt luôn trong khung hình để vừa mở trang đã thấy,
                không phải cuộn xuống mới vào được phòng thực hành.

                Vì nằm đè lên ảnh nên khối này phải có nền riêng, không mượn được
                nền trắng của trang như trước. Dùng `bg-white` thì giao diện tối
                vẫn đúng: trong index.css đã có sẵn luật `.dark .bg-white` đổi nền
                sang màu tối, nên chữ và nền vẫn đổi cùng nhịp với nhau.
              */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-white text-slate-900
                overflow-hidden shadow-2xl shadow-slate-950/40">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h2 className="text-[clamp(16px,1.2vw,19px)] font-semibold">Vào phòng thực hành</h2>
                  <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 mt-0.5">
                    Chọn tài khoản của em, hoặc vào xem thử với tư cách khách.
                  </p>
                </div>

                {/* Chọn vai trò */}
                <div className="px-5 pt-4">
                  <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                    {([
                      ['hs', `Học sinh (${students.length})`],
                      ['gv', `Giáo viên (${teachers.length})`],
                      ['khach', 'Khách'],
                    ] as [Role, string][]).map(([id, label]) => (
                      <button key={id}
                        onClick={() => { setRole(id); setPicked(null); }}
                        className={`h-9 px-4 text-[clamp(13px,0.9vw,15.5px)] transition-colors ${
                          role === id
                            ? 'bg-slate-900 text-white font-medium'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danh sách tài khoản */}
                <div className="px-5 py-4">
                  {role === 'khach' ? (
                    <p className="text-[clamp(14px,0.98vw,16.5px)] text-slate-600 py-2">
                      Vào xem toàn bộ ứng dụng mà không ghi lại kết quả. Bài làm và số liệu sẽ không được lưu.
                    </p>
                  ) : (
                    /* Giới hạn chiều cao rồi cho cuộn: lớp đông thì danh sách dài,
                       để tràn ra là khối này cao quá một màn hình. */
                    <ul className="ml-scroll max-h-[13.5rem] overflow-y-auto
                      divide-y divide-slate-100 border border-slate-200 rounded-lg">
                      {list.map((u) => (
                        <li key={u.id}>
                          <button
                            onClick={() => setPicked(u.id)}
                            onDoubleClick={enter}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                              chosen === u.id ? 'bg-indigo-50' : 'hover:bg-slate-100'
                            }`}>
                            <span className={`w-4 h-4 rounded-full border-2 shrink-0 grid place-items-center ${
                              chosen === u.id ? 'border-indigo-600' : 'border-slate-300'
                            }`}>
                              {chosen === u.id && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                            </span>
                            <span className="text-[clamp(14px,0.98vw,16.5px)] truncate">{u.name}</span>
                            {u.teamCode && (
                              <span className="ml-auto text-[clamp(13px,0.9vw,15.5px)] text-slate-400 shrink-0">
                                {u.teamCode}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                      {list.length === 0 && (
                        <li className="px-4 py-3 text-[clamp(14px,0.98vw,16.5px)] text-slate-500">
                          Chưa có tài khoản nào.
                        </li>
                      )}
                    </ul>
                  )}

                  <button
                    onClick={enter}
                    disabled={role !== 'khach' && !chosen}
                    className="mt-4 h-11 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700
                      disabled:bg-slate-200 disabled:text-slate-400
                      text-white text-[clamp(14px,0.98vw,16.5px)] font-medium
                      flex items-center gap-2 transition-colors">
                    Vào phòng thực hành
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
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
                        text-[clamp(14px,0.98vw,16.5px)] font-semibold leading-tight">
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

                <div className="flex-1 h-px bg-white/25 relative">
                  <div className="absolute inset-y-0 left-0 bg-white transition-[width] duration-500"
                    style={{ width: `${maxSlide === 0 ? 100 : (slide / maxSlide) * 100}%` }} />
                </div>

                <span className="text-white/80 tabular-nums text-[clamp(16px,1.2vw,19px)] shrink-0">
                  {String(slide + 1).padStart(2, '0')}
                  <span className="text-white/45"> / {String(SLIDES.length).padStart(2, '0')}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 md:px-10">

        {/* Giới thiệu */}
        <section className="pt-14 pb-12">
          <div className="space-y-4 text-[clamp(15px,1.15vw,18px)] text-slate-600 leading-relaxed max-w-2xl">
            <p>
              Trong các tiết thực hành, học sinh thường gặp khó khăn khi không biết mạch đã lắp đúng
              hay chưa, không dám cấp nguồn vì lo hư hỏng, hoặc quên cách sử dụng các dụng cụ đo.
              Trong khi đó, giáo viên phải dành nhiều thời gian kiểm tra từng nhóm, khiến quá trình
              thực hành bị gián đoạn.
            </p>
            <p>
              Việc tự học cũng không dễ dàng hơn. Quá nhiều nguồn tài liệu khiến học sinh khó chọn
              lọc thông tin đáng tin cậy; nội dung thường nặng lý thuyết, thiếu trực quan và chưa gắn
              kết với thực tế.
            </p>
            <p className="text-slate-900 font-medium">
              ModuLab được xây dựng để giải quyết những khoảng cách đó.
            </p>
            <p>
              Một nền tảng hỗ trợ học sinh kiểm tra mạch trước khi cấp nguồn, làm quen với dụng cụ đo
              và tiếp cận kiến thức thực hành trực quan hơn — giúp việc học không chỉ dừng lại ở lý
              thuyết mà trở thành trải nghiệm thử, hiểu và làm được.
            </p>
          </div>

          <p className="mt-6 text-[clamp(17px,1.2vw,20px)] text-slate-900 tracking-tight">
            Learn it. Build it. Verify it.
          </p>

        </section>

        {/* Giới thiệu các phần — đây là thông tin, nên trình bày như một danh sách */}
        <section className="pb-16 border-t border-slate-200 pt-10">
          <h2 className="text-[clamp(16px,1.2vw,19px)] font-semibold mb-1">Ứng dụng gồm bốn phần</h2>
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 mb-6">
            Làm theo thứ tự này là hợp lý nhất, nhưng em vào phần nào trước cũng được.
          </p>

          <ol className="space-y-5">
            {SECTIONS.map((s, i) => (
              <li key={s.name} className="flex gap-4">
                <span className="shrink-0 w-7 text-[clamp(14px,0.98vw,16.5px)] text-slate-400 tabular-nums pt-0.5">
                  {i + 1}.
                </span>
                <div>
                  <h3 className="text-[clamp(15px,1.05vw,17.5px)] font-medium">{s.name}</h3>
                  <p className="text-[clamp(14px,0.98vw,16.5px)] text-slate-600 leading-relaxed mt-1 max-w-2xl">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="border-t border-slate-200 py-5 px-6 md:px-10">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 max-w-2xl leading-relaxed">
            Sản phẩm hướng theo chủ trương của Chính phủ và Bộ Giáo dục và Đào tạo về dạy học phát
            triển năng lực, trong đó có yêu cầu tăng cường thực hành và thí nghiệm ở môn Vật lí.
          </p>
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-400">
            ModuLab v{APP_VERSION} · Phòng thực hành Vật lí điện học
          </p>
        </div>
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
                <p className="text-white text-[clamp(16px,1.2vw,19px)] font-semibold">
                  {SLIDES[zoom].label}
                </p>
                <p className="mt-1 text-white/70 text-[clamp(13px,0.9vw,15.5px)] leading-relaxed">
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
