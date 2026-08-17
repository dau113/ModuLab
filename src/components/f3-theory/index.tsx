import React, { useState } from 'react';
import { LabModule } from '../../types';
import { BentoCard } from '../common';
import { BookOpen, Award, FileCheck, Layers, Zap, Activity, CircuitBoard, ArrowRight, AlertTriangle, Power } from 'lucide-react';

interface TheoryViewProps {
  module: LabModule;
  onSwitchModule: (modId: string) => void;
  availableModules: LabModule[];
}

export const TheoryView: React.FC<TheoryViewProps> = ({
  module,
  onSwitchModule,
  availableModules,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 h-full overflow-y-auto pr-1 pb-4">
      {/* Thanh chọn bài thực hành — gọn, chỉ để đổi bài */}
      <div className="md:col-span-6 bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-[clamp(15px,1.05vw,17.5px)] font-bold text-slate-800 truncate">{module.title}</span>
        </div>
        <select
          value={module.id}
          onChange={(e) => onSwitchModule(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[clamp(14px,0.98vw,16.5px)] font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {availableModules.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>

      {/* Theory Main Card */}
      <BentoCard className="md:col-span-6" title="Lý thuyết cốt lõi & Định luật">
        <div className="prose prose-sm max-w-none text-slate-700 space-y-4 font-sans">
          {module.id === 'lab-1' ? (
            <>
              {/* 1 — Định luật Ôm, công thức viết dạng phân số cho dễ đọc */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <SectionTitle n={1}>Cơ sở định luật Ôm cho đoạn mạch</SectionTitle>
                <p className="text-[clamp(13px,0.9vw,15.5px)] leading-relaxed text-slate-600 mb-4">
                  Cường độ dòng điện chạy qua một dây dẫn tỉ lệ thuận với hiệu điện thế đặt vào hai đầu dây
                  và tỉ lệ nghịch với điện trở của dây:
                </p>

                <div className="bg-white rounded-xl border border-slate-200 py-5 px-4 flex items-center justify-center gap-6 flex-wrap">
                  <Formula left="I" num="U" den="R" />
                  <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                  <Formula left="R" num="U" den="I" />
                </div>

                {/* Ba đại lượng, mỗi cái một thẻ có biểu tượng và màu riêng */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <QuantityCard
                    symbol="U" icon={Zap} tone="amber"
                    name="Hiệu điện thế" unit="Vôn (V)"
                    note="Chênh lệch điện thế giữa hai đầu điện trở" />
                  <QuantityCard
                    symbol="I" icon={Activity} tone="sky"
                    name="Cường độ dòng điện" unit="Ampe (A)"
                    note="Lượng điện tích chạy qua tiết diện mỗi giây" />
                  <QuantityCard
                    symbol="R" icon={CircuitBoard} tone="violet"
                    name="Điện trở" unit="Ôm (Ω)"
                    note="Mức cản trở dòng điện của vật dẫn" />
                </div>
              </div>

              {/* 2 — Sơ đồ mạch có dòng điện chạy, bấm khoá K để xem */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <SectionTitle n={2}>Sơ đồ mạch đo — bấm khoá K để xem dòng điện chạy</SectionTitle>
                <LiveCircuitDiagram />
              </div>

              {/* 3 — Quy tắc đấu nối */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <SectionTitle n={3}>Quy tắc đấu nối dụng cụ đo</SectionTitle>
                <ul className="text-[clamp(13px,0.9vw,15.5px)] space-y-2 text-slate-600 list-disc pl-4">
                  <li>
                    <strong>Ampe kế (A):</strong> Mắc <span className="text-indigo-600 font-bold">nối tiếp</span> với
                    điện trở cần đo R<sub>x</sub> để dòng điện qua điện trở đều đi qua ampe kế.
                  </li>
                  <li>
                    <strong>Vôn kế (V):</strong> Mắc <span className="text-indigo-600 font-bold">song song</span> vào
                    hai đầu R<sub>x</sub> để đo hiệu điện thế rơi trên nó.
                  </li>
                  <li>
                    <strong>Khoá K:</strong> Luôn để <span className="text-rose-600 font-bold">mở</span> khi đang lắp dây
                    hoặc kiểm tra lại chốt cắm.
                  </li>
                </ul>
              </div>

              {/* Cảnh báo gọn: một biểu tượng, một tiêu đề, một dòng giải thích */}
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[clamp(14px,0.98vw,16.5px)] font-bold text-rose-800 mb-1">
                    Cảnh báo nguy hiểm
                  </h4>
                  <p className="text-[clamp(13px,0.9vw,15.5px)] text-rose-900 leading-relaxed">
                    Không mắc ampe kế song song với nguồn hoặc với điện trở. Điện trở trong của ampe kế
                    gần bằng 0 nên sẽ gây đoản mạch, làm cháy đồng hồ đo và hỏng nguồn.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[clamp(13px,0.9vw,15.5px)] font-bold">1</span>
                  Mạch mắc Nối tiếp (R1 nt R2)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[clamp(13px,0.9vw,15.5px)]">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[12.5px] font-bold text-slate-400 uppercase">Dòng điện</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">I = I₁ = I₂</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[12.5px] font-bold text-slate-400 uppercase">Hiệu điện thế</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">U = U₁ + U₂</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[12.5px] font-bold text-slate-400 uppercase">Điện trở TĐ</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">Rtđ = R₁ + R₂</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[clamp(13px,0.9vw,15.5px)] font-bold">2</span>
                  Mạch mắc Song song (R1 // R2)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[clamp(13px,0.9vw,15.5px)]">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[12.5px] font-bold text-slate-400 uppercase">Hiệu điện thế</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">U = U₁ = U₂</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[12.5px] font-bold text-slate-400 uppercase">Dòng điện rẽ nhánh</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">I = I₁ + I₂</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[12.5px] font-bold text-slate-400 uppercase">Điện trở TĐ</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">Rtđ = (R₁·R₂)/(R₁+R₂)</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </BentoCard>

    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Các mảnh dùng riêng cho trang lý thuyết                             */
/* ------------------------------------------------------------------ */

const SectionTitle: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <h4 className="text-[clamp(14px,0.98vw,16.5px)] font-bold text-indigo-900 mb-3 flex items-center gap-2">
    <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[clamp(13px,0.9vw,15.5px)] font-bold shrink-0">
      {n}
    </span>
    {children}
  </h4>
);

/** Công thức dạng phân số thẳng đứng, in to cho dễ đọc */
const Formula: React.FC<{ left: string; num: string; den: string }> = ({ left, num, den }) => (
  <div className="flex items-center gap-2.5 text-indigo-700">
    <span className="text-[28px] font-serif italic leading-none">{left}</span>
    <span className="text-[26px] leading-none">=</span>
    <span className="inline-flex flex-col items-center leading-none">
      <span className="text-[24px] font-serif italic px-2">{num}</span>
      <span className="w-full h-[2px] bg-indigo-700 my-1" />
      <span className="text-[24px] font-serif italic px-2">{den}</span>
    </span>
  </div>
);

const TONES: Record<string, { chip: string; text: string; ring: string }> = {
  amber: { chip: 'bg-amber-100 text-amber-700', text: 'text-amber-700', ring: 'border-amber-200' },
  sky: { chip: 'bg-sky-100 text-sky-700', text: 'text-sky-700', ring: 'border-sky-200' },
  violet: { chip: 'bg-violet-100 text-violet-700', text: 'text-violet-700', ring: 'border-violet-200' },
};

/** Thẻ giới thiệu một đại lượng: ký hiệu, tên, đơn vị và một dòng giải nghĩa */
const QuantityCard: React.FC<{
  symbol: string; icon: React.ElementType; tone: keyof typeof TONES;
  name: string; unit: string; note: string;
}> = ({ symbol, icon: Icon, tone, name, unit, note }) => {
  const c = TONES[tone];
  return (
    <div className={`bg-white rounded-xl border ${c.ring} p-3`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-8 h-8 rounded-lg grid place-items-center ${c.chip}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className={`text-[26px] font-serif italic leading-none ${c.text}`}>{symbol}</span>
      </div>
      <div className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-800">{name}</div>
      <div className={`text-[12.5px] font-bold ${c.text}`}>{unit}</div>
      <p className="text-[12.5px] text-slate-500 leading-snug mt-1">{note}</p>
    </div>
  );
};

/**
 * Sơ đồ mạch đo điện trở, vẽ bằng SVG. Bấm khoá K để đóng mạch: cần gạt hạ xuống
 * và các chấm sáng chạy dọc dây theo chiều dòng điện.
 */
const LiveCircuitDiagram: React.FC = () => {
  const [closed, setClosed] = useState(false);

  /* Đường đi của dòng điện trong mạch chính, vẽ theo chiều kim đồng hồ */
  const LOOP = 'M 60 150 L 60 60 L 150 60 L 235 60 L 320 60 L 320 150 L 230 150 L 60 150';

  return (
    <div>
      <svg viewBox="0 0 380 190" className="w-full max-w-xl mx-auto block">
        {/* Dây dẫn */}
        <path d={LOOP} fill="none" stroke="#94A3B8" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {closed && (
          <path d={LOOP} fill="none" stroke="#F59E0B" strokeWidth={3.5} strokeLinecap="round"
            strokeDasharray="6 26" className="ml-current" />
        )}

        {/* Nguồn điện bên trái */}
        <g>
          <line x1={44} y1={95} x2={76} y2={95} stroke="#334155" strokeWidth={4} />
          <line x1={52} y1={110} x2={68} y2={110} stroke="#334155" strokeWidth={2.5} />
          <text x={34} y={92} textAnchor="end" fontSize={13} fontWeight={700} fill="#334155">+</text>
          <text x={34} y={116} textAnchor="end" fontSize={15} fontWeight={700} fill="#334155">−</text>
          <text x={60} y={140} textAnchor="middle" fontSize={11} fontWeight={700} fill="#64748B">Nguồn</text>
        </g>

        {/* Khoá K phía trên */}
        <g>
          <circle cx={132} cy={60} r={4} fill="#475569" />
          <circle cx={168} cy={60} r={4} fill="#475569" />
          <line x1={132} y1={60} x2={168} y2={60} stroke="#E2E8F0" strokeWidth={3} />
          <line x1={132} y1={60} x2={168} y2={closed ? 60 : 40}
            stroke="#334155" strokeWidth={3.5} strokeLinecap="round"
            style={{ transition: 'all 0.25s cubic-bezier(0.3,1.3,0.6,1)' }} />
          <text x={150} y={26} textAnchor="middle" fontSize={12} fontWeight={800}
            fill={closed ? '#059669' : '#DC2626'}>K</text>
        </g>

        {/* Ampe kế nối tiếp */}
        <g>
          <circle cx={235} cy={60} r={15} fill="#FFFFFF" stroke="#0E7490" strokeWidth={2.5} />
          <text x={235} y={65} textAnchor="middle" fontSize={13} fontWeight={800} fill="#0E7490">A</text>
        </g>

        {/* Điện trở cần đo ở nhánh dưới */}
        <g>
          <rect x={175} y={138} width={56} height={24} rx={4} fill="#FFFFFF" stroke="#7C3AED" strokeWidth={2.5} />
          <text x={203} y={155} textAnchor="middle" fontSize={13} fontWeight={800} fill="#7C3AED">Rx</text>
        </g>

        {/* Vôn kế mắc song song hai đầu điện trở */}
        <g>
          <line x1={175} y1={150} x2={175} y2={178} stroke="#94A3B8" strokeWidth={2.5} />
          <line x1={231} y1={150} x2={231} y2={178} stroke="#94A3B8" strokeWidth={2.5} />
          <line x1={175} y1={178} x2={188} y2={178} stroke="#94A3B8" strokeWidth={2.5} />
          <line x1={218} y1={178} x2={231} y2={178} stroke="#94A3B8" strokeWidth={2.5} />
          <circle cx={203} cy={178} r={14} fill="#FFFFFF" stroke="#1D4ED8" strokeWidth={2.5} />
          <text x={203} y={183} textAnchor="middle" fontSize={13} fontWeight={800} fill="#1D4ED8">V</text>
        </g>
      </svg>

      <div className="flex items-center justify-center gap-3 mt-2">
        <button
          onClick={() => setClosed((v) => !v)}
          className={`h-10 px-4 rounded-xl text-[clamp(13px,0.9vw,15.5px)] font-bold flex items-center gap-2 transition-colors ${
            closed ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-700 hover:bg-slate-800 text-white'
          }`}
        >
          <Power className="w-4 h-4" />
          {closed ? 'Khoá K đang đóng — bấm để ngắt' : 'Bấm để đóng khoá K'}
        </button>
        <span className="text-[12.5px] text-slate-500">
          {closed
            ? 'Dòng điện chạy từ cực dương qua khoá K, ampe kế rồi qua Rx về cực âm.'
            : 'Mạch đang hở nên chưa có dòng điện.'}
        </span>
      </div>
    </div>
  );
};
