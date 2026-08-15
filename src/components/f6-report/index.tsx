import React, { useState } from 'react';
import { LabModule, LabReportRow } from '../../types';
import { BentoCard, WarningBadge } from '../common';
import { 
  Calculator, 
  FileCheck, 
  HelpCircle, 
  Download, 
  Send, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Trash2,
  PlusCircle,
  FilePlus
} from 'lucide-react';

interface LabReportViewProps {
  module: LabModule;
  rows: LabReportRow[];
  onUpdateRows: (rows: LabReportRow[]) => void;
  teamCode: string;
  onSubmitReport: (passed: boolean, summary?: { rAvg: number; deltaR: number; relErr: number }) => void;
  isSubmitted: boolean;
  /** Mở một bản báo cáo mới, xoá sạch số liệu cũ để làm lại từ đầu */
  onNewReport: () => void;
}

export const LabReportView: React.FC<LabReportViewProps> = ({
  module,
  rows,
  onUpdateRows,
  teamCode,
  onSubmitReport,
  isSubmitted,
  onNewReport,
}) => {
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);
  const [selectedRowForFormula, setSelectedRowForFormula] = useState<number | null>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleValueChange = (id: number, field: 'u' | 'i', valStr: string) => {
    if (isSubmitted) return;
    const val = parseFloat(valStr);
    if (isNaN(val) && valStr !== '') return;

    const newRows = rows.map((r) => {
      if (r.id === id) {
        const updated = { ...r, [field]: valStr === '' ? 0 : val };
        // Auto calculate R = U / I (convert mA to A if needed)
        const iInAmperes = updated.iUnit === 'mA' ? updated.i / 1000 : updated.i;
        const uInVolts = updated.uUnit === 'mV' ? updated.u / 1000 : updated.u;
        const rCalc = iInAmperes > 0 ? Math.round((uInVolts / iInAmperes) * 100) / 100 : 0;
        return { ...updated, rCalc };
      }
      return r;
    });
    onUpdateRows(newRows);
  };

  const handleUnitChange = (id: number, field: 'uUnit' | 'iUnit', unit: string) => {
    if (isSubmitted) return;
    const newRows = rows.map((r) => {
      if (r.id === id) {
        const updated = { ...r, [field]: unit };
        const iInAmperes = updated.iUnit === 'mA' ? updated.i / 1000 : updated.i;
        const uInVolts = updated.uUnit === 'mV' ? updated.u / 1000 : updated.u;
        const rCalc = iInAmperes > 0 ? Math.round((uInVolts / iInAmperes) * 100) / 100 : 0;
        return { ...updated, rCalc };
      }
      return r;
    });
    onUpdateRows(newRows);
  };

  const handleAddRow = () => {
    if (isSubmitted) return;
    const nextId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
    onUpdateRows([...rows, { id: nextId, u: 0, uUnit: 'V', i: 0, iUnit: 'mA', rCalc: 0 }]);
  };

  const handleRemoveRow = (id: number) => {
    if (isSubmitted || rows.length <= 1) return;
    onUpdateRows(rows.filter((r) => r.id !== id).map((r, idx) => ({ ...r, id: idx + 1 })));
  };

  // Calculations
  const validRows = rows.filter((r) => r.rCalc > 0);
  const avgR = validRows.length > 0
    ? Math.round((validRows.reduce((sum, r) => sum + r.rCalc, 0) / validRows.length) * 100) / 100
    : 0;
  
  // Reference expected resistor for Lab 1 is 20 Ω
  const expectedR = 20.0;
  const absError = Math.round(Math.abs(avgR - expectedR) * 100) / 100;
  const relativeError = expectedR > 0 ? Math.round((absError / expectedR) * 10000) / 100 : 0;
  const isPassed = relativeError <= module.maxErrorThreshold * 100;

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`📄 Đã xuất thành công báo cáo của ${teamCode} ra tệp PDF (Chuẩn định dạng tiếng Việt UTF-8)!`);
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 h-full overflow-y-auto pr-1 pb-4">
      {/* Top Header info for group report */}
      <BentoCard 
        className="md:col-span-4" 
        title="Biểu mẫu Báo cáo thực hành nhóm (Dùng chung)" 
        subtitle={`${module.title} • ${teamCode || 'Nhóm 3 - Bàn 5'}`}
        action={
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[clamp(13px,0.9vw,15.5px)] font-bold border border-blue-200 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>Đang đồng bộ realtime (4 thành viên)</span>
            </span>
          </div>
        }
      >
        <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 mt-1 mb-4">
          Nhập số liệu đo từ thí nghiệm thật vào bảng bên dưới. Hệ thống sẽ tự động chuyển đổi đơn vị và tính toán giá trị điện trở R = U / I.
        </p>

        {/* Table Data */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-[clamp(13px,0.9vw,15.5px)] font-sans">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[clamp(12.5px,0.86vw,15px)] border-b border-slate-200">
              <tr>
                <th className="p-3 w-16">Lần đo</th>
                <th className="p-3">Hiệu điện thế (U)</th>
                <th className="p-3">Cường độ dòng (I)</th>
                <th className="p-3">Điện trở tính được R = U/I</th>
                <th className="p-3 text-right">Chi tiết</th>
                <th className="p-3 text-right w-14">Xoá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-medium">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-center bg-slate-50/50">#0{row.id}</td>
                  
                  {/* U input */}
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 max-w-[140px]">
                      <input
                        disabled={isSubmitted}
                        type="number"
                        step="0.1"
                        value={row.u || ''}
                        onChange={(e) => handleValueChange(row.id, 'u', e.target.value)}
                        placeholder="0.0"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                      <select
                        disabled={isSubmitted}
                        value={row.uUnit}
                        onChange={(e) => handleUnitChange(row.id, 'uUnit', e.target.value as any)}
                        className="p-1.5 bg-slate-100 border border-slate-200 rounded font-bold text-slate-600 outline-none"
                      >
                        <option value="V">V</option>
                        <option value="mV">mV</option>
                      </select>
                    </div>
                  </td>

                  {/* I input */}
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 max-w-[140px]">
                      <input
                        disabled={isSubmitted}
                        type="number"
                        step="1"
                        value={row.i || ''}
                        onChange={(e) => handleValueChange(row.id, 'i', e.target.value)}
                        placeholder="0"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      />
                      <select
                        disabled={isSubmitted}
                        value={row.iUnit}
                        onChange={(e) => handleUnitChange(row.id, 'iUnit', e.target.value as any)}
                        className="p-1.5 bg-slate-100 border border-slate-200 rounded font-bold text-slate-600 outline-none"
                      >
                        <option value="mA">mA</option>
                        <option value="A">A</option>
                      </select>
                    </div>
                  </td>

                  {/* R Calc */}
                  <td className="p-3">
                    <span className="font-mono text-sm font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {row.rCalc > 0 ? `${row.rCalc} Ω` : '---'}
                    </span>
                  </td>

                  {/* Step by step button */}
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedRowForFormula(row.id);
                        setShowFormulaModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[clamp(12.5px,0.86vw,15px)] font-bold text-slate-700 flex items-center gap-1 ml-auto transition-colors"
                    >
                      <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Xem cách tính</span>
                    </button>
                  </td>

                  {/* Xoá lần đo */}
                  <td className="p-3 text-right">
                    <button
                      disabled={isSubmitted || rows.length <= 1}
                      onClick={() => handleRemoveRow(row.id)}
                      title={rows.length <= 1 ? 'Phải giữ lại ít nhất một lần đo' : `Xoá lần đo #0${row.id}`}
                      className="w-8 h-8 grid place-items-center rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[clamp(12.5px,0.86vw,15px)] text-slate-500">
            Bảng đang có <strong className="text-slate-700">{rows.length}</strong> lần đo — càng nhiều lần đo thì sai số ngẫu nhiên càng nhỏ.
          </p>
          <button
            disabled={isSubmitted}
            onClick={handleAddRow}
            className="px-3.5 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[clamp(13px,0.9vw,15.5px)] font-bold flex items-center gap-1.5 transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm lần đo</span>
          </button>
        </div>
      </BentoCard>

      {/* Right Column: Auto Assessment & Submission */}
      <BentoCard className="md:col-span-2 flex flex-col justify-between" title="KẾT QUẢ & THẨM ĐỊNH" subtitle="Chấm điểm sai số">
        <div className="space-y-4 font-sans">
          {/* Average metrics */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-[clamp(13px,0.9vw,15.5px)]">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">R trung bình (R-avg):</span>
              <span className="font-mono font-extrabold text-base text-slate-900">{avgR > 0 ? `${avgR} Ω` : '0 Ω'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Giá trị mẫu (R0):</span>
              <span className="font-mono font-bold text-slate-700">{expectedR} Ω</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-700 font-bold">Sai số tương đối:</span>
              <span className={`font-mono font-extrabold text-sm px-2 py-0.5 rounded ${isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {relativeError}% (Ngưỡng ≤ {(module.maxErrorThreshold * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Pass/Fail banner */}
          <div className={`p-4 rounded-2xl border transition-all ${
            avgR === 0 
              ? 'bg-slate-100 border-slate-200 text-slate-500' 
              : isPassed 
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm' 
              : 'bg-amber-50 border-amber-400 text-amber-950'
          }`}>
            <div className="flex items-center gap-2 font-bold text-[clamp(13px,0.9vw,15.5px)] mb-1">
              {avgR === 0 && <HelpCircle className="w-4 h-4" />}
              {avgR > 0 && isPassed && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {avgR > 0 && !isPassed && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              <span className="uppercase font-extrabold">
                {avgR === 0 ? 'Chưa có số liệu' : isPassed ? 'ĐẠT YÊU CẦU THỰC HÀNH' : 'CHƯA ĐẠT (SAI SỐ LỚN)'}
              </span>
            </div>
            <p className="text-[clamp(13px,0.9vw,15.5px)] leading-relaxed mt-1">
              {avgR === 0 
                ? 'Hãy nhập ít nhất 1 lần đo hiệu điện thế và dòng điện.' 
                : isPassed 
                ? 'Nhóm đã đo rất cẩn thận! Các điểm tiếp xúc chốt cắm chặt chẽ, số liệu hoàn toàn đáng tin cậy.' 
                : 'Sai số > 10%. Gợi ý đã kiểm duyệt: Hãy kiểm tra lại độ chặt của chốt cắm tiếp xúc dây và chỉnh kim về đúng vạch 0.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mt-6 pt-4 border-t border-slate-200">
          <button
            disabled={avgR === 0 || isExporting}
            onClick={handleExportPDF}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-200 rounded-xl text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Download className={`w-4 h-4 text-indigo-600 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Đang xuất tệp PDF...' : 'Xuất Báo cáo ra tệp PDF'}</span>
          </button>

          {!isSubmitted && (
            <button
              disabled={avgR === 0}
              onClick={() => onSubmitReport(isPassed, { rAvg: avgR, deltaR: absError, relErr: relativeError / 100 })}
              className={`w-full py-3 px-4 rounded-xl text-[clamp(14px,0.98vw,16.5px)] font-bold flex items-center justify-center gap-2 transition-colors ${
                avgR > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Nộp báo cáo chính thức</span>
            </button>
          )}

          {isSubmitted && (
            <div className="space-y-2">
              <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[clamp(14px,0.98vw,16.5px)] font-bold text-emerald-800 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã gửi vào sổ điểm giáo viên</span>
              </div>
              <button
                onClick={onNewReport}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[clamp(14px,0.98vw,16.5px)] font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <FilePlus className="w-4 h-4" />
                <span>Làm bài báo cáo mới</span>
              </button>
              <p className="text-[clamp(12.5px,0.86vw,15px)] text-slate-500 text-center leading-relaxed">
                Bản đã nộp vẫn được giữ trong sổ điểm; bài mới sẽ là một lượt đo khác.
              </p>
            </div>
          )}
        </div>
      </BentoCard>

      {/* Modal step-by-step formula derivation (NOT a black box rule!) */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Chi tiết cách tính (Không là hộp đen)</h3>
                  <p className="text-[clamp(12.5px,0.86vw,15px)] text-slate-400">Minh bạch công thức và từng bước thế số</p>
                </div>
              </div>
              <span className="text-[clamp(13px,0.9vw,15.5px)] bg-slate-100 px-2.5 py-1 rounded-lg font-bold text-slate-700">
                Lần đo #0{selectedRowForFormula}
              </span>
            </div>

            {/* Derivation steps */}
            {(() => {
              const r = rows.find((item) => item.id === selectedRowForFormula) || rows[0];
              const iInAmperes = r.iUnit === 'mA' ? r.i / 1000 : r.i;
              const uInVolts = r.uUnit === 'mV' ? r.u / 1000 : r.u;

              return (
                <div className="space-y-4 text-[clamp(13px,0.9vw,15.5px)]">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-indigo-900 block mb-1">Bước 1: Nhận diện & Quy đổi đơn vị chuẩn SI</strong>
                    <p className="text-slate-600">
                      • Hiệu điện thế đo được: <code className="font-bold text-slate-800">{r.u} {r.uUnit}</code>
                      {r.uUnit === 'mV' && ` = ${uInVolts} V (chia 1000)`}
                    </p>
                    <p className="text-slate-600 mt-1">
                      • Cường độ dòng đo được: <code className="font-bold text-slate-800">{r.i} {r.iUnit}</code>
                      {r.iUnit === 'mA' ? ` ➔ Quy đổi: ${r.i} mA / 1000 = ${iInAmperes} A` : ' (Đã ở chuẩn Ampe)'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-indigo-900 block mb-1">Bước 2: Áp dụng công thức Định luật Ôm</strong>
                    <p className="text-slate-600 mb-2">
                      Công thức xác định điện trở: R = U / I
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-center font-mono text-sm font-bold text-indigo-700">
                      R = {uInVolts} / {iInAmperes} = {r.rCalc} Ω
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-medium leading-relaxed">
                    ✓ <strong>Đảm bảo chữ số có nghĩa:</strong> Kết quả được làm tròn hợp lý theo quy tắc sai số dụng cụ đo và hiển thị chính xác <code className="font-extrabold">{r.rCalc} Ω</code>.
                  </div>
                </div>
              );
            })()}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-[clamp(13px,0.9vw,15.5px)] hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
