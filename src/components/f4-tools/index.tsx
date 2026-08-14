import React, { useState } from 'react';
import { ToolItem, ToolMode } from '../../types';
import { BentoCard, WarningBadge } from '../common';
import { PartThumb, PART_CATALOG } from '../f5-circuit';
import type { PartKind } from '../f5-circuit';
import { 
  Gauge, 
  Activity, 
  Compass, 
  BatteryCharging, 
  Cpu, 
  ToggleLeft, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  RotateCw
} from 'lucide-react';

interface ToolExplorerProps {
  tools: ToolItem[];
}

export const ToolExplorer: React.FC<ToolExplorerProps> = ({ tools }) => {
  const [selectedToolId, setSelectedToolId] = useState<string>(tools[0]?.id || 'tool-dmm');
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);

  const selectedTool = tools.find((t) => t.id === selectedToolId) || tools[0];
  const selectedMode = selectedTool.modes?.find((m) => m.id === selectedModeId);

  /* Ảnh linh kiện dùng chung với phần mô phỏng mạch 2D */
  const PART_OF_TOOL: Record<string, PartKind> = {
    'tool-dmm': 'multimeter',
    'tool-ammeter': 'ammeter',
    'tool-voltmeter': 'voltmeter',
    'tool-battery': 'battery',
    'tool-resistor': 'resistor',
    'tool-switch': 'switch',
    'tool-rheostat': 'rheostat',
    'tool-lamp': 'lamp',
    'tool-coil': 'coil',
    'tool-powersupply': 'powersupply',
    'tool-battery9v': 'battery9v',
    'tool-galvanometer': 'galvanometer',
  };
  const partOf = (toolId: string): PartKind | null => PART_OF_TOOL[toolId] ?? null;

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'Gauge': return <Gauge className="w-6 h-6 text-indigo-600" />;
      case 'Activity': return <Activity className="w-6 h-6 text-emerald-600" />;
      case 'Compass': return <Compass className="w-6 h-6 text-blue-600" />;
      case 'BatteryCharging': return <BatteryCharging className="w-6 h-6 text-amber-600" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-purple-600" />;
      case 'ToggleLeft': return <ToggleLeft className="w-6 h-6 text-rose-600" />;
      default: return <Gauge className="w-6 h-6 text-indigo-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 h-full overflow-y-auto pr-1 pb-4">
      {/* Tool List Sidebar inside Bento */}
      <BentoCard className="md:col-span-2 flex flex-col" title="Danh mục thiết bị thực hành" subtitle="Dụng cụ & Linh kiện">
        <div className="mt-2 space-y-2 flex-1">
          {tools.map((t) => {
            const isSelected = t.id === selectedToolId;
            return (
              <div
                key={t.id}
                onClick={() => {
                  setSelectedToolId(t.id);
                  if (t.modes && t.modes.length > 0) {
                    setSelectedModeId(null);
                  }
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                  isSelected 
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm' 
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-16 h-14 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                  isSelected ? 'bg-white shadow-sm border border-indigo-100' : 'bg-slate-100'
                }`}>
                  {partOf(t.id)
                    ? <PartThumb kind={partOf(t.id)!} size={partOf(t.id) === 'multimeter' ? 26 : 58}
                        live={{ closed: true, knob: 0.4, needle: 0.55, func: 'V', unit: 'V', auto: true, reading: '12.00' }} />
                    : getToolIcon(t.iconName)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-[13px] font-bold truncate leading-snug ${isSelected ? 'text-indigo-950 font-extrabold' : 'text-slate-800'}`}>
                    {t.name}
                  </h4>
                  <p className="text-[12.5px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {t.shortDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </BentoCard>

      {/* Tool Detailed Reference Card */}
      <BentoCard className="md:col-span-4" title="Tra cứu & Hướng dẫn sử dụng an toàn" subtitle={selectedTool.name}>
        <div className="space-y-5 mt-2 font-sans">
          {/* Ảnh thiết bị */}
          {partOf(selectedTool.id) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-5">
              <div className="shrink-0 grid place-items-center w-40 h-36">
                <PartThumb kind={partOf(selectedTool.id)!}
                  size={partOf(selectedTool.id) === 'multimeter' ? 84 : 168}
                  live={{ closed: true, knob: 0.45, needle: 0.6, func: 'V', unit: 'V', auto: true, reading: '12.00' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hình dạng thực tế</p>
                <h5 className="text-sm font-extrabold text-slate-800 mb-1">
                  {PART_CATALOG[partOf(selectedTool.id)!].name}
                </h5>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  {PART_CATALOG[partOf(selectedTool.id)!].desc}
                </p>
                <p className="text-[12.5px] text-slate-400 mt-2">
                  Chốt đỏ là cực dương (+), chốt đen là cực âm (−) — giống hệt linh kiện trong phần Mô phỏng mạch 2D.
                </p>
              </div>
            </div>
          )}

          {/* Detailed description */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h5 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cấu tạo & Nguyên lý</h5>
            <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
              {selectedTool.detailedDesc}
            </p>
          </div>

          {/* Interactive DMM Mode Dial if available */}
          {selectedTool.modes && selectedTool.modes.length > 0 && (
            <div className="p-4 bg-indigo-900 text-white rounded-2xl shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-indigo-300 animate-spin" style={{ animationDuration: '10s' }} />
                    <span className="text-[13px] font-bold uppercase tracking-wider text-indigo-200">Núm xoay thang đo DMM (Tương tác)</span>
                  </div>
                  <span className="text-[11.5px] bg-indigo-700 px-2 py-0.5 rounded border border-indigo-600">
                    Chạm để xoay núm
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {selectedTool.modes.map((m) => {
                    const isModeSelected = m.id === selectedModeId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedModeId(isModeSelected ? null : m.id)}
                        className={`py-2.5 px-3 rounded-xl text-[13px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                          isModeSelected 
                            ? 'bg-amber-400 text-slate-950 shadow-lg scale-[1.02] ring-2 ring-white/50' 
                            : 'bg-indigo-800/80 text-indigo-200 hover:bg-indigo-700 border border-indigo-700'
                        }`}
                      >
                        <span className="text-sm font-mono">{m.name}</span>
                        <span className="text-[11.5px] opacity-90 font-sans">{m.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {!selectedMode && (
                  <div className="bg-indigo-950/80 border border-indigo-800/80 p-4 rounded-xl text-center">
                    <p className="text-[13px] text-indigo-200 font-medium">
                      Hãy chọn một vị trí núm xoay ở trên để xem phần lý thuyết và cách mắc của chế độ đo đó.
                    </p>
                  </div>
                )}

                {selectedMode && (
                  <div className="bg-indigo-950/80 border border-indigo-800/80 p-3.5 rounded-xl text-[13px] space-y-2">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <span>📌 Chế độ được chọn:</span>
                      <span className="uppercase">{selectedMode.label}</span>
                    </div>
                    <p className="text-indigo-100 text-[13px] leading-relaxed">{selectedMode.desc}</p>
                    <div className="pt-2 border-t border-indigo-800 flex items-start gap-2 text-emerald-300 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>Cách mắc chuẩn:</strong> {selectedMode.safeUsage}</span>
                    </div>
                    {selectedMode.warning && (
                      <div className="pt-2 border-t border-indigo-800 flex items-start gap-2 text-rose-300 font-bold">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
                        <span>{selectedMode.warning}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>
          )}

          {/* Error reading instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <h5 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <span>Quy tắc đọc sai số</span>
              </h5>
              <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                {selectedTool.errorReading}
              </p>
            </div>

            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl shadow-sm">
              <h5 className="text-[13px] font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Cảnh báo nguy hiểm / Phòng tránh</span>
              </h5>
              <p className="text-[13px] text-rose-900 leading-relaxed font-bold">
                {selectedTool.safetyWarning || 'Luôn thao tác cẩn thận, ngắt khóa K trước khi nối hoặc tháo dây dẫn để đảm bảo an toàn tuyệt đối.'}
              </p>
            </div>
          </div>
        </div>
      </BentoCard>
    </div>
  );
};
