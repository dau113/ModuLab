/**
 * Mô phỏng tương tác đặt dưới mỗi bài lý thuyết ôn tập.
 *
 * Mỗi bài một mô phỏng, kéo thanh trượt là số liệu đổi ngay. Chỗ này không thay
 * cho bàn lắp ráp ở ModuSim: ở đây không có dây để nối sai, chỉ có đúng một
 * công thức của bài đang đọc, để thấy đại lượng nào kéo theo đại lượng nào.
 *
 * MÀU TRONG SVG LẤY TỪ BIẾN CỦA BẢNG MÀU, không ghi mã màu cứng. Chế độ tối
 * đảo cả bảng xám lẫn bảng chàm ở cấp biến CSS, nên mã cứng kiểu "#334155" giữ
 * nguyên màu tối và nằm chìm trong nền tối — vẽ xong không ai nhìn ra.
 * Chỉ dùng những họ màu CÓ đảo ở chế độ tối: xám, chàm, hổ phách, lục, hồng,
 * lam, lục lam, tía, cam. Tránh họ violet và sky vì hai họ đó không đảo.
 */
import React, { useState } from 'react';
import { RotateCcw, Sigma } from 'lucide-react';

const C = {
  day: 'var(--color-slate-400)',
  net: 'var(--color-slate-600)',
  mo: 'var(--color-slate-300)',
  nhat: 'var(--color-slate-500)',
  chu: 'var(--color-slate-700)',
  nen: 'var(--color-slate-50)',
  the: 'var(--color-slate-100)',
  trang: 'var(--color-slate-50)',
  dong: 'var(--color-amber-500)',
  tro: 'var(--color-purple-600)',
  ap: 'var(--color-blue-600)',
  cd: 'var(--color-rose-600)',
  ok: 'var(--color-emerald-600)',
  nhan: 'var(--color-indigo-600)',
};

/* ------------------------------------------------------------------ */
/* Mảnh ghép dùng chung                                                */
/* ------------------------------------------------------------------ */

/** Số kiểu Việt Nam: dấu phẩy ngăn phần thập phân */
const so = (n: number, d = 2) =>
  (Number.isFinite(n) ? n : 0).toFixed(d).replace('.', ',');

/** Dòng điện tự chọn đơn vị: dưới 1A thì đọc bằng mA cho dễ hình dung */
const dongDien = (i: number) =>
  (Math.abs(i) < 1 ? `${so(i * 1000, 1)} mA` : `${so(i, 3)} A`);

/** Số rất lớn viết dạng a × 10ⁿ, số mũ để phông tự dựng thành chỉ số trên */
const luyThua = (n: number): React.ReactNode => {
  if (!Number.isFinite(n) || n <= 0) return '0';
  const mu = Math.floor(Math.log10(n));
  const he = n / 10 ** mu;
  return <>{so(he, 2)} × 10<sup className="text-[0.62em]">{mu}</sup></>;
};

/**
 * Thời gian một vòng của vệt sáng chạy trên dây.
 * Dòng càng lớn vệt chạy càng nhanh. Phải chặn hai đầu, nếu không dòng rất nhỏ
 * thì vệt đứng im như mạch hỏng, còn dòng rất lớn thì nhoè thành một vạch.
 */
const nhipChay = (i: number) =>
  (i > 1e-6 ? Math.min(3, Math.max(0.18, 0.055 / i)) : 0);

const Slider: React.FC<{
  nhan: React.ReactNode;
  donVi: string;
  giaTri: number;
  min: number; max: number; buoc: number;
  doi: (v: number) => void;
  soLe?: number;
  mau?: string;
}> = ({ nhan, donVi, giaTri, min, max, buoc, doi, soLe = 1, mau = C.nhan }) => (
  <label className="block">
    <span className="flex items-baseline justify-between gap-2 mb-1">
      <span className="text-[clamp(12.5px,0.86vw,15px)] font-semibold text-slate-600">{nhan}</span>
      <span className="font-mono font-bold text-[clamp(13.5px,0.94vw,16px)] tabular-nums"
        style={{ color: mau }}>
        {so(giaTri, soLe)} <span className="font-sans font-semibold">{donVi}</span>
      </span>
    </span>
    <input type="range" min={min} max={max} step={buoc} value={giaTri}
      onChange={(e) => doi(Number(e.target.value))}
      className="w-full h-2 rounded-full bg-slate-200 appearance-none cursor-pointer
        accent-indigo-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" />
  </label>
);

/** Ô kết quả: tên đại lượng ở trên, trị số lớn ở dưới */
const KetQua: React.FC<{ ten: string; tri: React.ReactNode; mau?: string; phu?: string }> = ({
  ten, tri, mau = C.nhan, phu,
}) => (
  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 min-w-0">
    {/* Không cắt cụt nhãn: cột bên phải hẹp nên "Cường độ dòng điện" bị cắt
        thành "CƯỜNG ĐỘ D..." — cho xuống dòng vẫn đọc được, ngắn hơn thì mất chữ. */}
    <p className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wide leading-tight">{ten}</p>
    <p className="font-mono font-extrabold text-[clamp(16px,1.2vw,21px)] tabular-nums leading-tight"
      style={{ color: mau }}>{tri}</p>
    {phu && <p className="text-[11.5px] text-slate-400 leading-tight mt-0.5">{phu}</p>}
  </div>
);

/** Khung chung của mọi mô phỏng: tên, câu gợi ý thử, nút đặt lại */
const KhungMoPhong: React.FC<{
  ten: string;
  goiY: React.ReactNode;
  datLai: () => void;
  children: React.ReactNode;
}> = ({ ten, goiY, datLai, children }) => (
  <div data-sim={ten} className="rounded-xl border-2 border-indigo-200 bg-indigo-50/40 p-3.5">
    <div className="flex flex-wrap items-center gap-2 mb-1">
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-600
        text-white font-bold text-[11.5px] uppercase tracking-wide">
        <Sigma className="w-3.5 h-3.5" /> Mô phỏng
      </span>
      <h4 className="font-bold text-[clamp(14px,0.98vw,16.5px)] text-slate-800">{ten}</h4>
      <button type="button" onClick={datLai}
        className="ml-auto h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border
          border-slate-300 bg-white text-slate-600 text-[clamp(12px,0.82vw,14px)]
          hover:border-indigo-400 hover:text-indigo-700 transition-colors">
        <RotateCcw className="w-3.5 h-3.5" /> Đặt lại
      </button>
    </div>
    <p className="text-[clamp(12.5px,0.86vw,15px)] text-slate-600 mb-3 leading-relaxed">{goiY}</p>
    {children}
  </div>
);

/** Vệt sáng chạy dọc một đường dây, thể hiện có dòng điện */
const VetDong: React.FC<{ d: string; nhip: number; dam?: number }> = ({ d, nhip, dam = 3.5 }) =>
  (nhip > 0 ? (
    <path d={d} fill="none" stroke={C.dong} strokeWidth={dam} strokeLinecap="round"
      strokeDasharray="6 26" className="ml-current"
      style={{ animationDuration: `${nhip}s` }} />
  ) : null);

/** Pin vẽ theo ký hiệu sách giáo khoa, xếp chồng theo số vôn */
const BoPin: React.FC<{ x: number; y: number; soO: number }> = ({ x, y, soO }) => (
  <g>
    {Array.from({ length: soO }, (_, k) => (
      <g key={k} transform={`translate(0, ${k * 13})`}>
        <line x1={x - 13} y1={y} x2={x + 13} y2={y} stroke={C.chu} strokeWidth={3.6} />
        <line x1={x - 6} y1={y + 6} x2={x + 6} y2={y + 6} stroke={C.chu} strokeWidth={2.2} />
      </g>
    ))}
    <text x={x - 20} y={y + 4} textAnchor="end" fontSize={13} fontWeight={700} fill={C.chu}>+</text>
    <text x={x - 20} y={y + soO * 13 + 2} textAnchor="end" fontSize={15} fontWeight={700} fill={C.chu}>−</text>
  </g>
);

/** Điện trở hình chữ nhật, có nhãn và trị số */
const HopTro: React.FC<{
  x: number; y: number; w?: number; h?: number; ten: string; tri?: string; mau?: string;
}> = ({ x, y, w = 62, h = 26, ten, tri, mau = C.tro }) => (
  <g>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={5}
      fill={C.trang} stroke={mau} strokeWidth={2.5} />
    <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill={mau}>{ten}</text>
    {tri && (
      <text x={x} y={y + h / 2 + 15} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={C.nhat}>
        {tri}
      </text>
    )}
  </g>
);

/* ------------------------------------------------------------------ */
/* 1. Định luật Ohm — I = U / R                                        */
/* ------------------------------------------------------------------ */

/** Chọn mốc trên của trục dòng điện theo nấc tròn, để đổi R thấy độ dốc đổi */
const NAC_I = [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5];
const nacTren = (v: number) => NAC_I.find((x) => v <= x) ?? NAC_I[NAC_I.length - 1];

export const SimOhm: React.FC = () => {
  const [u, setU] = useState(6);
  const [r, setR] = useState(100);
  const i = r > 0 ? u / r : 0;
  const nhip = nhipChay(i);
  const soO = Math.max(1, Math.min(8, Math.round(u / 1.5)));

  /* Đồ thị U – I: đường thẳng qua gốc, độ dốc bằng 1/R */
  const GX0 = 34, GY0 = 112, GW = 176, GH = 92;
  const uMax = 12;
  const iMax = nacTren(uMax / r);
  const px = (uu: number) => GX0 + (uu / uMax) * GW;
  const py = (ii: number) => GY0 - Math.min(1, ii / iMax) * GH;

  const VONG = 'M 46 124 L 46 40 L 150 40 L 254 40 L 254 124 L 150 124 L 46 124';

  return (
    <KhungMoPhong
      ten="Định luật Ohm — kéo thử U và R"
      goiY={<>Tăng gấp đôi <b>U</b> xem <b>I</b> có gấp đôi không. Rồi giữ nguyên <b>U</b>,
        tăng gấp đôi <b>R</b> xem <b>I</b> còn lại bao nhiêu.</>}
      datLai={() => { setU(6); setR(100); }}>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] gap-3 items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-2">
          <svg viewBox="0 0 300 200" className="w-full max-w-[26rem] mx-auto block" role="img"
            aria-label={`Mạch điện với hiệu điện thế ${so(u, 1)} vôn, điện trở ${so(r, 0)} ôm, cường độ dòng điện ${dongDien(i)}`}>
            <path d={VONG} fill="none" stroke={C.day} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            <VetDong d={VONG} nhip={nhip} />
            <BoPin x={46} y={62} soO={soO} />
            <text x={46} y={62 + soO * 13 + 20} textAnchor="middle" fontSize={11.5}
              fontWeight={700} fill={C.ap}>{so(u, 1)} V</text>
            <HopTro x={150} y={124} ten="R" tri={`${so(r, 0)} Ω`} />
            <g>
              <circle cx={150} cy={40} r={15} fill={C.trang} stroke={C.dong} strokeWidth={2.5} />
              <text x={150} y={45} textAnchor="middle" fontSize={13} fontWeight={800} fill={C.dong}>A</text>
              <text x={150} y={18} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={C.dong}>
                {dongDien(i)}
              </text>
            </g>
          </svg>

          {/* Đồ thị U – I của chính điện trở đang chọn */}
          <svg viewBox="0 0 240 140" className="w-full max-w-[21rem] mx-auto block" role="img"
            aria-label={`Đồ thị cường độ dòng điện theo hiệu điện thế, đường thẳng qua gốc toạ độ`}>
            <line x1={GX0} y1={GY0} x2={GX0 + GW} y2={GY0} stroke={C.mo} strokeWidth={1.6} />
            <line x1={GX0} y1={GY0} x2={GX0} y2={GY0 - GH} stroke={C.mo} strokeWidth={1.6} />
            <text x={GX0 + GW} y={GY0 + 16} textAnchor="end" fontSize={11} fontWeight={700} fill={C.nhat}>U (V)</text>
            <text x={GX0 - 6} y={GY0 - GH - 2} textAnchor="end" fontSize={11} fontWeight={700} fill={C.nhat}>I (A)</text>
            <text x={GX0 - 6} y={GY0 + 4} textAnchor="end" fontSize={10} fill={C.nhat}>0</text>
            <text x={GX0 - 6} y={GY0 - GH + 8} textAnchor="end" fontSize={10} fill={C.nhat}>{so(iMax, 2)}</text>
            <text x={GX0 + GW} y={GY0 + 16 - 16} textAnchor="end" fontSize={10} fill={C.nhat}>{uMax}</text>

            <line x1={px(0)} y1={py(0)} x2={px(uMax)} y2={py(uMax / r)}
              stroke={C.tro} strokeWidth={2.6} strokeLinecap="round" />
            <line x1={px(u)} y1={GY0} x2={px(u)} y2={py(i)} stroke={C.mo} strokeWidth={1.4} strokeDasharray="3 3" />
            <line x1={GX0} y1={py(i)} x2={px(u)} y2={py(i)} stroke={C.mo} strokeWidth={1.4} strokeDasharray="3 3" />
            <circle cx={px(u)} cy={py(i)} r={5} fill={C.dong} stroke={C.trang} strokeWidth={2} />
            <text x={GX0 + GW} y={GY0 - GH + 10} textAnchor="end" fontSize={10.5} fontWeight={700} fill={C.tro}>
              độ dốc = 1/R
            </text>
          </svg>
        </div>

        <div className="space-y-3">
          <Slider nhan={<>Hiệu điện thế <b>U</b></>} donVi="V" giaTri={u}
            min={0} max={12} buoc={0.1} doi={setU} mau={C.ap} />
          <Slider nhan={<>Điện trở <b>R</b></>} donVi="Ω" giaTri={r}
            min={10} max={500} buoc={5} doi={setR} soLe={0} mau={C.tro} />

          <div className="rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-center">
            <p className="font-serif italic text-[clamp(15px,1.1vw,19px)] text-slate-700">
              I = U / R = {so(u, 1)} / {so(r, 0)}
            </p>
            <p className="font-mono font-extrabold text-[clamp(17px,1.3vw,23px)] mt-0.5"
              style={{ color: C.dong }}>{dongDien(i)}</p>
          </div>

          <p className="text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500 leading-relaxed">
            Đồ thị luôn là đường thẳng đi qua gốc toạ độ: <b>I tỉ lệ thuận với U</b>.
            Đổi R thì đường đó đổi độ dốc chứ không cong đi.
          </p>
        </div>
      </div>
    </KhungMoPhong>
  );
};

/* ------------------------------------------------------------------ */
/* 2. Đoạn mạch nối tiếp và song song                                  */
/* ------------------------------------------------------------------ */

export const SimMach: React.FC = () => {
  const [kieu, setKieu] = useState<'nt' | 'ss'>('nt');
  const [u, setU] = useState(9);
  const [r1, setR1] = useState(60);
  const [r2, setR2] = useState(30);

  const rtd = kieu === 'nt' ? r1 + r2 : (r1 * r2) / (r1 + r2);
  const i = rtd > 0 ? u / rtd : 0;
  const i1 = kieu === 'nt' ? i : u / r1;
  const i2 = kieu === 'nt' ? i : u / r2;
  const u1 = kieu === 'nt' ? i * r1 : u;
  const u2 = kieu === 'nt' ? i * r2 : u;
  const nhip = nhipChay(i);
  const nhip1 = nhipChay(i1);
  const nhip2 = nhipChay(i2);

  const NT = 'M 40 120 L 40 44 L 110 44 L 210 44 L 280 44 L 280 120 L 160 120 L 40 120';
  /* Song song: vòng ngoài, rồi hai nhánh cùng bắc giữa hai nút.
     Khung rộng hơn hẳn khung nối tiếp vì ở đây phải nhét thêm hai dòng chữ
     dòng điện nhánh; vẽ chật thì chữ I₁, I₂ lòi ra ngoài khung nhìn. */
  const SS_NGOAI = 'M 40 142 L 40 34 L 130 34 L 322 34 L 322 142 L 130 142 L 40 142';
  const SS_N1 = 'M 130 34 L 130 68 L 322 68 L 322 34';
  const SS_N2 = 'M 130 142 L 130 108 L 322 108 L 322 142';

  return (
    <KhungMoPhong
      ten="Nối tiếp hay song song — số nào giữ nguyên, số nào chia ra"
      goiY={<>Đổi qua lại hai kiểu mắc với cùng <b>R₁</b>, <b>R₂</b>. Để ý: nối tiếp thì
        <b> I giữ nguyên còn U chia ra</b>; song song thì ngược lại.</>}
      datLai={() => { setKieu('nt'); setU(9); setR1(60); setR2(30); }}>

      <div className="flex gap-2 mb-3">
        {([['nt', 'Nối tiếp'], ['ss', 'Song song']] as const).map(([k, ten]) => (
          <button key={k} type="button" onClick={() => setKieu(k)}
            aria-pressed={kieu === k}
            className={`h-9 px-3.5 rounded-xl border-2 font-bold text-[clamp(12.5px,0.86vw,15px)]
              transition-colors ${kieu === k
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-indigo-400'}`}>
            {ten}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] gap-3 items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-2">
          {kieu === 'nt' ? (
            <svg viewBox="0 0 320 170" className="w-full max-w-[28rem] mx-auto block" role="img"
              aria-label={`Hai điện trở mắc nối tiếp, dòng điện ${dongDien(i)} qua cả hai`}>
              <path d={NT} fill="none" stroke={C.day} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
              <VetDong d={NT} nhip={nhip} />
              {/* Chặn ở 4 ô: vẽ đúng số pin theo vôn thì 12V thành 8 ô, chồng
                  dài quá mép dây dưới và đè lên dòng chữ cường độ dòng điện. */}
              <BoPin x={40} y={63} soO={Math.max(1, Math.min(4, Math.round(u / 1.5)))} />
              <HopTro x={110} y={44} ten="R₁" tri={`${so(r1, 0)} Ω`} />
              <HopTro x={210} y={44} ten="R₂" tri={`${so(r2, 0)} Ω`} />
              <text x={110} y={26} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={C.ap}>
                U₁ = {so(u1, 2)} V
              </text>
              <text x={210} y={26} textAnchor="middle" fontSize={11.5} fontWeight={800} fill={C.ap}>
                U₂ = {so(u2, 2)} V
              </text>
              <text x={170} y={152} textAnchor="middle" fontSize={12} fontWeight={800} fill={C.dong}>
                I = {dongDien(i)} — như nhau ở mọi chỗ
              </text>
            </svg>
          ) : (
            <svg viewBox="0 0 372 178" className="w-full max-w-[28rem] mx-auto block" role="img"
              aria-label={`Hai điện trở mắc song song, dòng chính ${dongDien(i)} chia thành hai nhánh`}>
              <path d={SS_NGOAI} fill="none" stroke={C.day} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
              <path d={SS_N1} fill="none" stroke={C.day} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
              <path d={SS_N2} fill="none" stroke={C.day} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
              <VetDong d={SS_NGOAI} nhip={nhip} />
              <VetDong d={SS_N1} nhip={nhip1} dam={3} />
              <VetDong d={SS_N2} nhip={nhip2} dam={3} />
              <BoPin x={40} y={70} soO={Math.max(1, Math.min(4, Math.round(u / 1.5)))} />
              {/* Trị số ghi luôn trong hộp. Treo xuống dưới hộp như ở mạch nối
                  tiếp thì nó rơi đúng vào nhánh thứ hai, chữ chồng lên hộp R₂. */}
              <HopTro x={264} y={68} w={80} ten={`R₁ = ${so(r1, 0)}Ω`} />
              <HopTro x={264} y={108} w={80} ten={`R₂ = ${so(r2, 0)}Ω`} />
              <circle cx={130} cy={34} r={3.5} fill={C.net} />
              <circle cx={130} cy={142} r={3.5} fill={C.net} />
              <text x={140} y={62} fontSize={11} fontWeight={800} fill={C.dong}>I₁ = {dongDien(i1)}</text>
              <text x={140} y={102} fontSize={11} fontWeight={800} fill={C.dong}>I₂ = {dongDien(i2)}</text>
              <text x={186} y={166} textAnchor="middle" fontSize={12} fontWeight={800} fill={C.ap}>
                U = {so(u, 1)} V — như nhau ở cả hai nhánh
              </text>
            </svg>
          )}
        </div>

        <div className="space-y-3">
          <Slider nhan={<>Hiệu điện thế <b>U</b></>} donVi="V" giaTri={u}
            min={1} max={12} buoc={0.5} doi={setU} mau={C.ap} />
          <Slider nhan={<>Điện trở <b>R₁</b></>} donVi="Ω" giaTri={r1}
            min={10} max={200} buoc={5} doi={setR1} soLe={0} mau={C.tro} />
          <Slider nhan={<>Điện trở <b>R₂</b></>} donVi="Ω" giaTri={r2}
            min={10} max={200} buoc={5} doi={setR2} soLe={0} mau={C.tro} />

          <div className="grid grid-cols-2 gap-2">
            <KetQua ten="R tương đương" tri={`${so(rtd, 1)} Ω`} mau={C.tro}
              phu={kieu === 'nt' ? 'R₁ + R₂' : 'R₁R₂ / (R₁+R₂)'} />
            <KetQua ten="Dòng mạch chính" tri={dongDien(i)} mau={C.dong} phu="I = U / R" />
          </div>

          <p className="text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500 leading-relaxed">
            {kieu === 'nt'
              ? <>Nối tiếp: điện trở tương đương <b>lớn hơn</b> từng điện trở thành phần,
                nên thêm điện trở vào là dòng giảm.</>
              : <>Song song: điện trở tương đương <b>nhỏ hơn</b> cả hai, nên thêm nhánh vào
                là dòng mạch chính tăng.</>}
          </p>
        </div>
      </div>
    </KhungMoPhong>
  );
};

/* ------------------------------------------------------------------ */
/* 3. Cường độ dòng điện — I = S·n·v·e                                 */
/* ------------------------------------------------------------------ */

const E_HAT = 1.6e-19;     // độ lớn điện tích electron, culông

export const SimCddd: React.FC = () => {
  /* Tiết diện tính bằng mm², mật độ theo 10²⁸ hạt mỗi mét khối, tốc độ mm/s */
  const [s, setS] = useState(1);
  const [n, setN] = useState(8.5);
  const [v, setV] = useState(0.1);
  const [dt, setDt] = useState(2);

  const i = (s * 1e-6) * (n * 1e28) * (v * 1e-3) * E_HAT;
  const dq = i * dt;
  const soHat = dq / E_HAT;

  /* Ống dây vẽ to nhỏ theo tiết diện, chấm điện tử dày thưa theo mật độ */
  const caoOng = 18 + s * 16;
  const soCham = Math.round(10 + n * 5);
  const nhip = v > 0 ? Math.min(6, Math.max(0.35, 1.1 / v)) : 0;

  return (
    <KhungMoPhong
      ten="Cường độ dòng điện sinh ra từ đâu"
      goiY={<>Dòng điện là dòng các electron trôi có hướng. Kéo thử ba thanh dưới đây xem
        <b> tiết diện</b>, <b>mật độ hạt</b> và <b>tốc độ trôi</b> ảnh hưởng thế nào tới <b>I</b>.</>}
      datLai={() => { setS(1); setN(8.5); setV(0.1); setDt(2); }}>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] gap-3 items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-2">
          <svg viewBox="0 0 320 150" className="w-full max-w-[28rem] mx-auto block" role="img"
            aria-label={`Đoạn dây dẫn có electron trôi, cường độ dòng điện ${dongDien(i)}`}>
            {/* Thân dây */}
            <rect x={40} y={75 - caoOng / 2} width={240} height={caoOng} rx={caoOng / 2}
              fill={C.the} stroke={C.day} strokeWidth={2} />
            {/* Tiết diện thẳng: mặt cắt mà ta đếm điện tích đi qua */}
            <line x1={160} y1={75 - caoOng / 2 - 12} x2={160} y2={75 + caoOng / 2 + 12}
              stroke={C.cd} strokeWidth={2.4} strokeDasharray="5 4" />
            <text x={160} y={75 - caoOng / 2 - 17} textAnchor="middle" fontSize={11}
              fontWeight={700} fill={C.cd}>tiết diện thẳng S</text>

            {/* Electron trôi: mỗi chấm một hạt, chạy từ trái sang phải */}
            <g>
              {Array.from({ length: soCham }, (_, k) => {
                const y = 75 - caoOng / 2 + 5 + ((k * 37) % Math.max(1, caoOng - 10));
                /* Lệch pha đều theo số hạt. Trước đây lấy (k % 7) nên gần như
                   cùng pha, cả đám dồn thành một cục chạy qua chứ không rải
                   đều dọc ống như dòng điện thật. */
                const tre = (k / soCham) * nhip;
                return (
                  <circle key={k} cx={46} cy={y} r={2.6} fill={C.nhan}>
                    {nhip > 0 && (
                      <animate attributeName="cx" from="46" to="274"
                        dur={`${nhip}s`} begin={`${-tre}s`} repeatCount="indefinite" />
                    )}
                  </circle>
                );
              })}
            </g>

            <path d="M 60 132 L 262 132" stroke={C.dong} strokeWidth={2.6} strokeLinecap="round" />
            <path d="M 254 127 L 264 132 L 254 137" fill="none" stroke={C.dong}
              strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            <text x={60} y={127} fontSize={11} fontWeight={700} fill={C.dong}>chiều dòng điện</text>
            <text x={44} y={22} fontSize={12} fontWeight={800} fill={C.nhan}>
              I = S · n · v · e = {dongDien(i)}
            </text>
          </svg>
        </div>

        <div className="space-y-3">
          <Slider nhan={<>Tiết diện <b>S</b></>} donVi="mm²" giaTri={s}
            min={0.2} max={3} buoc={0.1} doi={setS} mau={C.nhat} />
          <Slider nhan={<>Mật độ hạt <b>n</b></>} donVi="×10²⁸ /m³" giaTri={n}
            min={1} max={12} buoc={0.5} doi={setN} mau={C.nhan} />
          <Slider nhan={<>Tốc độ trôi <b>v</b></>} donVi="mm/s" giaTri={v}
            min={0.02} max={0.5} buoc={0.01} doi={setV} soLe={2} mau={C.ok} />
          <Slider nhan={<>Khoảng thời gian <b>Δt</b></>} donVi="s" giaTri={dt}
            min={1} max={10} buoc={1} doi={setDt} soLe={0} mau={C.nhat} />

          <div className="grid grid-cols-2 gap-2">
            <KetQua ten="Cường độ I" tri={dongDien(i)} mau={C.dong} />
            <KetQua ten="Điện lượng Δq" tri={`${so(dq, 2)} C`} mau={C.ap} phu="Δq = I · Δt" />
          </div>
          <KetQua ten="Số electron qua tiết diện" tri={luyThua(soHat)}
            mau={C.nhan} phu={`trong ${so(dt, 0)} giây`} />

          <p className="text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500 leading-relaxed">
            Tốc độ trôi chỉ cỡ phần mười milimét mỗi giây — rất chậm. Đèn sáng ngay khi
            bật công tắc không phải vì electron chạy nhanh, mà vì cả dây đã sẵn electron
            và chúng cùng chuyển động gần như tức thì.
          </p>
        </div>
      </div>
    </KhungMoPhong>
  );
};

/* ------------------------------------------------------------------ */
/* 4. Nguồn điện có điện trở trong — I = E / (R + r)                   */
/* ------------------------------------------------------------------ */

export const SimNguon: React.FC = () => {
  const [e, setE] = useState(12);
  const [rTrong, setRTrong] = useState(1);
  const [rNgoai, setRNgoai] = useState(20);

  const i = e / (rNgoai + rTrong);
  const u = e - i * rTrong;              // hiệu điện thế mạch ngoài
  const matTrong = i * rTrong;           // phần điện áp mất trong nguồn
  const hieuSuat = e > 0 ? (u / e) * 100 : 0;
  const nhip = nhipChay(i);
  const doanMach = rNgoai <= 1.5;

  const VONG = 'M 46 132 L 46 46 L 160 46 L 266 46 L 266 132 L 160 132 L 46 132';

  return (
    <KhungMoPhong
      ten="Vì sao vôn kế đo được ít hơn số ghi trên pin"
      goiY={<>Bản thân nguồn cũng có điện trở, gọi là <b>điện trở trong r</b>. Kéo <b>R</b> nhỏ
        dần xem phần điện áp mất bên trong nguồn lớn lên thế nào.</>}
      datLai={() => { setE(12); setRTrong(1); setRNgoai(20); }}>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] gap-3 items-start">
        <div className="rounded-xl border border-slate-200 bg-white p-2">
          <svg viewBox="0 0 320 180" className="w-full max-w-[28rem] mx-auto block" role="img"
            aria-label={`Nguồn ${so(e, 1)} vôn có điện trở trong ${so(rTrong, 1)} ôm, mạch ngoài ${so(rNgoai, 0)} ôm, dòng ${dongDien(i)}`}>
            <path d={VONG} fill="none" stroke={C.day} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            <VetDong d={VONG} nhip={nhip} />

            {/* Khung nét đứt bao lấy nguồn: suất điện động nối tiếp điện trở trong */}
            {/* Nhãn đặt DƯỚI khung, không đặt trên: để trên thì nó nằm đúng chỗ
                dây trên đi qua, chữ và dây chồng lên nhau. */}
            <rect x={16} y={54} width={60} height={80} rx={8} fill="none"
              stroke={doanMach ? C.cd : C.mo} strokeWidth={2} strokeDasharray="5 4" />
            <BoPin x={46} y={64} soO={Math.max(1, Math.min(4, Math.round(e / 4)))} />
            <HopTro x={46} y={119} w={40} h={20} ten="r" mau={C.cd} />
            <text x={46} y={148} textAnchor="middle" fontSize={11} fontWeight={700}
              fill={doanMach ? C.cd : C.nhat}>bên trong nguồn</text>
            <text x={46} y={162} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.cd}>
              mất {so(matTrong, 2)} V
            </text>

            <HopTro x={266} y={89} w={26} h={56} ten="R" mau={C.tro} />
            <text x={266} y={162} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={C.tro}>
              {so(rNgoai, 0)} Ω
            </text>
            <text x={170} y={32} textAnchor="middle" fontSize={12} fontWeight={800} fill={C.dong}>
              I = {dongDien(i)}
            </text>
            <text x={178} y={152} textAnchor="middle" fontSize={12} fontWeight={800} fill={C.ap}>
              U mạch ngoài = {so(u, 2)} V
            </text>
          </svg>
        </div>

        <div className="space-y-3">
          <Slider nhan={<>Suất điện động <b>E</b></>} donVi="V" giaTri={e}
            min={1.5} max={24} buoc={0.5} doi={setE} mau={C.ap} />
          <Slider nhan={<>Điện trở trong <b>r</b></>} donVi="Ω" giaTri={rTrong}
            min={0.1} max={5} buoc={0.1} doi={setRTrong} mau={C.cd} />
          <Slider nhan={<>Mạch ngoài <b>R</b></>} donVi="Ω" giaTri={rNgoai}
            min={0.5} max={100} buoc={0.5} doi={setRNgoai} soLe={1} mau={C.tro} />

          <div className="grid grid-cols-2 gap-2">
            <KetQua ten="Dòng điện I" tri={dongDien(i)} mau={C.dong} phu="I = E / (R + r)" />
            <KetQua ten="U mạch ngoài" tri={`${so(u, 2)} V`} mau={C.ap} phu="U = E − I·r" />
          </div>
          <KetQua ten="Hiệu suất nguồn" tri={`${so(hieuSuat, 1)} %`}
            mau={hieuSuat > 70 ? C.ok : C.cd} phu="H = U / E = R / (R + r)" />

          {doanMach ? (
            <p className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2
              text-[clamp(11.5px,0.78vw,13.5px)] text-rose-800 leading-relaxed">
              <b>Mạch ngoài quá nhỏ — gần như đoản mạch.</b> Dòng vọt lên {dongDien(i)} và
              gần hết điện áp mất ngay bên trong nguồn, nên nguồn nóng lên rất nhanh.
            </p>
          ) : (
            <p className="text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500 leading-relaxed">
              Pin ghi {so(e, 1)} V nhưng vôn kế mắc ngoài chỉ đọc {so(u, 2)} V, vì {so(matTrong, 2)} V
              đã rơi trên điện trở trong. R càng nhỏ thì phần mất càng lớn.
            </p>
          )}
        </div>
      </div>
    </KhungMoPhong>
  );
};
