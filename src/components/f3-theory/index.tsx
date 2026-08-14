import React from 'react';
import { LabModule } from '../../types';
import { BentoCard, WarningBadge } from '../common';
import { CheckCircle, BookOpen, Award, FileCheck, Layers } from 'lucide-react';

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
      {/* Top Banner / Module Selector */}
      <BentoCard 
        className="md:col-span-4" 
        title="Danh mục bài thực hành — Chương trình GDPT 2018"
        subtitle={module.title}
        action={
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-slate-500 font-medium hidden sm:inline">Bài thực hành:</span>
            <select
              value={module.id}
              onChange={(e) => onSwitchModule(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[13px] font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {availableModules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
          {module.description}
        </p>

        {/* Verified Badge Header - NOT HIDDEN AT FOOTER (NT-6 rule from PRD) */}
        <div className="mt-4 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>NỘI DUNG ĐÃ ĐƯỢC KIỂM DUYỆT CHÍNH THỨC</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-emerald-800">
            <div><strong>Người duyệt:</strong> {module.verifiedBy}</div>
            <div><strong>Ngày duyệt:</strong> {module.verifiedDate}</div>
            <div><strong>Nguồn:</strong> {module.referenceSource}</div>
          </div>
        </div>
      </BentoCard>

      {/* Theory Main Card */}
      <BentoCard className="md:col-span-6" title="Lý thuyết cốt lõi & Định luật">
        <div className="prose prose-sm max-w-none text-slate-700 space-y-4 font-sans">
          {module.id === 'lab-1' ? (
            <>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[13px] font-bold">1</span>
                  Cơ sở định luật Ôm cho đoạn mạch
                </h4>
                <p className="text-[13px] leading-relaxed text-slate-600 mb-3">
                  Cường độ dòng điện chạy qua một dây dẫn tỉ lệ thuận với hiệu điện thế đặt vào hai đầu dây và tỉ lệ nghịch với điện trở của dây:
                </p>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-center font-mono text-base font-bold text-indigo-600 shadow-inner">
                  I = U / R &nbsp; ➔ &nbsp; R = U / I
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[13px]">
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="font-bold text-slate-800">U</span>: Hiệu điện thế (V)
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="font-bold text-slate-800">I</span>: Cường độ dòng (A)
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100">
                    <span className="font-bold text-slate-800">R</span>: Điện trở (Ω)
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[13px] font-bold">2</span>
                  Quy tắc đấu nối dụng cụ đo (Vôn-Ampe)
                </h4>
                <ul className="text-[13px] space-y-2 text-slate-600 list-disc pl-4">
                  <li>
                    <strong>Ampe kế (A):</strong> Mắc <span className="text-indigo-600 font-bold underline">NỐI TIẾP</span> với điện trở cần đo $R_x$ để dòng điện chạy qua điện trở đều đi qua ampe kế.
                  </li>
                  <li>
                    <strong>Vôn kế (V):</strong> Mắc <span className="text-indigo-600 font-bold underline">SONG SONG</span> vào hai cực của điện trở $R_x$ để đo hiệu điện thế rơi trên nó.
                  </li>
                  <li>
                    <strong>Khóa K:</strong> Luôn ở trạng thái <span className="text-rose-600 font-bold">MỞ (ngắt mạch)</span> khi đang lắp dây hoặc kiểm tra lại chốt cắm.
                  </li>
                </ul>
              </div>

              <WarningBadge 
                type="danger"
                text="TUYỆT ĐỐI KHÔNG mắc song song Ampe kế với cực dương (+) và âm (-) của nguồn điện vì điện trở trong của Ampe kế rất nhỏ (RA ≈ 0), sẽ gây ĐOẢN MẠCH NGUỒN, làm cháy nổ đồng hồ đo và nguy hiểm!"
              />
            </>
          ) : (
            <>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[13px] font-bold">1</span>
                  Mạch mắc Nối tiếp (R1 nt R2)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[11.5px] font-bold text-slate-400 uppercase">Dòng điện</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">I = I₁ = I₂</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[11.5px] font-bold text-slate-400 uppercase">Hiệu điện thế</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">U = U₁ + U₂</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[11.5px] font-bold text-slate-400 uppercase">Điện trở TĐ</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">Rtđ = R₁ + R₂</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[13px] font-bold">2</span>
                  Mạch mắc Song song (R1 // R2)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[11.5px] font-bold text-slate-400 uppercase">Hiệu điện thế</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">U = U₁ = U₂</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[11.5px] font-bold text-slate-400 uppercase">Dòng điện rẽ nhánh</p>
                    <p className="font-mono font-bold text-slate-800 mt-1">I = I₁ + I₂</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[11.5px] font-bold text-slate-400 uppercase">Điện trở TĐ</p>
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
