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

  /* Hai dụng cụ không phải linh kiện cắm trên bàn nên vẽ riêng */
  const EXTRA_ART: Record<string, (size: number) => React.ReactNode> = {
    'tool-board': (size) => <BoardArt size={size} />,
    'tool-wire': (size) => <WireArt size={size} />,
  };
  const artOf = (toolId: string, size: number): React.ReactNode | null => {
    const kind = partOf(toolId);
    if (kind) {
      return (
        <PartThumb kind={kind} size={kind === 'multimeter' ? Math.round(size * 0.45) : size}
          live={{ closed: true, knob: 0.45, needle: 0.6, func: 'V', unit: 'V', auto: true, reading: '12.00' }} />
      );
    }
    return EXTRA_ART[toolId]?.(size) ?? null;
  };
  const hasArt = (toolId: string) => !!partOf(toolId) || !!EXTRA_ART[toolId];

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
                  {artOf(t.id, 58) ?? getToolIcon(t.iconName)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-[clamp(13px,0.9vw,15.5px)] font-bold truncate leading-snug ${isSelected ? 'text-indigo-950 font-extrabold' : 'text-slate-800'}`}>
                    {t.name}
                  </h4>
                  <p className="text-[clamp(12.5px,0.86vw,15px)] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
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
          {hasArt(selectedTool.id) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-center gap-5">
              <div className="shrink-0 grid place-items-center w-44 h-36">
                {artOf(selectedTool.id, 168)}
              </div>
              <div className="min-w-0">
                <p className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-400 uppercase tracking-wider mb-1">Hình dạng thực tế</p>
                <h5 className="text-[clamp(15px,1.05vw,17.5px)] font-extrabold text-slate-800 mb-1">
                  {partOf(selectedTool.id) ? PART_CATALOG[partOf(selectedTool.id)!].name : selectedTool.name}
                </h5>
                <p className="text-[clamp(14px,0.98vw,16.5px)] text-slate-600 leading-relaxed">
                  {partOf(selectedTool.id) ? PART_CATALOG[partOf(selectedTool.id)!].desc : selectedTool.detailedDesc}
                </p>
              </div>
            </div>
          )}

          {/* Detailed description */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h5 className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cấu tạo & Nguyên lý</h5>
            <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-700 leading-relaxed font-medium">
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
                    <span className="text-[clamp(13px,0.9vw,15.5px)] font-bold uppercase tracking-wider text-indigo-200">Núm xoay thang đo DMM (Tương tác)</span>
                  </div>
                  <span className="text-[12.5px] bg-indigo-700 px-2 py-0.5 rounded border border-indigo-600">
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
                        className={`py-2.5 px-3 rounded-xl text-[clamp(13px,0.9vw,15.5px)] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                          isModeSelected 
                            ? 'bg-amber-400 text-slate-950 shadow-lg scale-[1.02] ring-2 ring-white/50' 
                            : 'bg-indigo-800/80 text-indigo-200 hover:bg-indigo-700 border border-indigo-700'
                        }`}
                      >
                        <span className="text-sm font-mono">{m.name}</span>
                        <span className="text-[12.5px] opacity-90 font-sans">{m.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {!selectedMode && (
                  <div className="bg-indigo-950/80 border border-indigo-800/80 p-4 rounded-xl text-center">
                    <p className="text-[clamp(13px,0.9vw,15.5px)] text-indigo-200 font-medium">
                      Hãy chọn một vị trí núm xoay ở trên để xem phần lý thuyết và cách mắc của chế độ đo đó.
                    </p>
                  </div>
                )}

                {selectedMode && (
                  <div className="bg-indigo-950/80 border border-indigo-800/80 p-3.5 rounded-xl text-[clamp(13px,0.9vw,15.5px)] space-y-2">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <span>📌 Chế độ được chọn:</span>
                      <span className="uppercase">{selectedMode.label}</span>
                    </div>
                    <p className="text-indigo-100 text-[clamp(13px,0.9vw,15.5px)] leading-relaxed">{selectedMode.desc}</p>
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
              <h5 className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <span>Quy tắc đọc sai số</span>
              </h5>
              <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 leading-relaxed font-medium">
                {selectedTool.errorReading}
              </p>
            </div>

            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl shadow-sm">
              <h5 className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Cảnh báo nguy hiểm / Phòng tránh</span>
              </h5>
              <p className="text-[clamp(13px,0.9vw,15.5px)] text-rose-900 leading-relaxed font-bold">
                {selectedTool.safetyWarning || 'Luôn thao tác cẩn thận, ngắt khóa K trước khi nối hoặc tháo dây dẫn để đảm bảo an toàn tuyệt đối.'}
              </p>
            </div>
          </div>
        </div>
      </BentoCard>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Hình vẽ cho hai dụng cụ không nằm trong thư viện linh kiện           */
/* ------------------------------------------------------------------ */

const BoardArt: React.FC<{ size: number }> = ({ size }) => {
  const holes: [number, number][] = [];
  for (let c = 0; c < 7; c++) for (let r = 0; r < 4; r++) holes.push([16 + c * 19, 22 + r * 19]);
  return (
    <svg viewBox="0 0 152 116" width={size} height={(size * 116) / 152}>
      <defs>
        <linearGradient id="tbBoard" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#31589F" />
          <stop offset="55%" stopColor="#254690" />
          <stop offset="100%" stopColor="#16295C" />
        </linearGradient>
      </defs>
      <rect x={3} y={9} width={146} height={104} rx={9} fill="#0F172A" opacity={0.25} />
      <rect x={0} y={0} width={152} height={108} rx={9} fill="#7C8B9C" />
      <rect x={0} y={0} width={152} height={12} rx={9} fill="#B8C6D4" opacity={0.75} />
      <rect x={5} y={5} width={142} height={98} rx={7} fill="#5A6B7C" />
      <rect x={9} y={9} width={134} height={90} rx={5} fill="url(#tbBoard)" />
      <rect x={9} y={9} width={134} height={7} rx={3} fill="#000000" opacity={0.22} />
      {holes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y + 0.6} r={5.4} fill="#4E7BD8" opacity={0.5} />
          <circle cx={x} cy={y} r={5.4} fill="#16295C" stroke="#12224B" strokeWidth={0.8} />
          <circle cx={x} cy={y} r={2.4} fill="#070E22" />
        </g>
      ))}
      <text x={76} y={94} textAnchor="middle" fontSize={7} fontWeight={700} fill="#DBE6FF" letterSpacing={1.2}>
        BẢNG LẮP RÁP MẠCH ĐIỆN
      </text>
    </svg>
  );
};

const WireArt: React.FC<{ size: number }> = ({ size }) => {
  const lead = (y: number, color: string, dark: string) => (
    <g>
      <path d={`M 22 ${y} C 52 ${y - 16}, 100 ${y + 16}, 130 ${y}`}
        fill="none" stroke="#0F172A" strokeOpacity={0.2} strokeWidth={7} strokeLinecap="round"
        transform="translate(1,3)" />
      <path d={`M 22 ${y} C 52 ${y - 16}, 100 ${y + 16}, 130 ${y}`}
        fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />
      <path d={`M 22 ${y} C 52 ${y - 16}, 100 ${y + 16}, 130 ${y}`}
        fill="none" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={1.6} strokeLinecap="round" />
      {[16, 136].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={y + 3} rx={9} ry={3.6} fill="#0F172A" opacity={0.22} />
          <rect x={cx - 9} y={y - 5} width={18} height={10} rx={4} fill={dark} />
          <rect x={cx - 7} y={y - 4} width={14} height={3.4} rx={1.7} fill="#FFFFFF" opacity={0.35} />
          <rect x={cx < 76 ? cx - 15 : cx + 8} y={y - 2.4} width={7} height={4.8} rx={2} fill="#C9D3DE" />
        </g>
      ))}
    </g>
  );
  return (
    <svg viewBox="0 0 152 116" width={size} height={(size * 116) / 152}>
      {lead(34, '#DC2626', '#8E1508')}
      {lead(82, '#2563EB', '#16307A')}
    </svg>
  );
};
