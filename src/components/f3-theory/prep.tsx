/**
 * Chuẩn bị thí nghiệm — danh sách dụng cụ, các bước tiến hành và quy tắc an toàn
 * cho bài thực hành đang chọn. Học sinh tự đánh dấu từng mục đã chuẩn bị xong.
 */
import React, { useMemo, useState } from 'react';
import {
  ClipboardList, CheckCircle2, Circle, ShieldAlert, ListOrdered,
  Sigma, ArrowRight, Boxes,
} from 'lucide-react';
import { BentoCard } from '../common';
import { useSettings } from '../../settings';
import { PartThumb, PART_CATALOG } from '../f5-circuit';
import type { PartKind } from '../f5-circuit';
import type { LabModule } from '../../types';

interface PrepItem {
  kind?: PartKind;
  name: string;
  nameEn: string;
  qty: string;
  qtyEn: string;
  why: string;
  whyEn: string;
}

interface PrepGuide {
  goal: string;
  goalEn: string;
  formula: string;
  items: PrepItem[];
  steps: [string, string][];
  safety: [string, string][];
}

/* Bài đo điện trở bằng vôn kế – ampe kế */
const GUIDE_RESISTANCE: PrepGuide = {
  goal: 'Xác định điện trở của một vật dẫn bằng phương pháp vôn kế – ampe kế, rồi đánh giá sai số của phép đo.',
  goalEn: 'Determine a conductor’s resistance using the voltmeter–ammeter method, then evaluate the measurement error.',
  formula: 'R = U / I',
  items: [
    {
      kind: 'powersupply', name: 'Biến áp nguồn một chiều 0 – 12V', nameEn: 'Adjustable DC power supply 0–12V',
      qty: '1 bộ', qtyEn: '1 unit',
      why: 'Cấp điện cho mạch, điều chỉnh được điện áp để lấy nhiều cặp số liệu khác nhau.',
      whyEn: 'Powers the circuit; the adjustable voltage lets you take several data pairs.',
    },
    {
      kind: 'switch', name: 'Công tắc đơn (khoá K)', nameEn: 'Single switch (key K)',
      qty: '1 chiếc', qtyEn: '1 piece',
      why: 'Đóng ngắt mạch an toàn; luôn để mở trong lúc đấu nối.',
      whyEn: 'Opens and closes the circuit safely; keep it open while wiring.',
    },
    {
      kind: 'resistor', name: 'Điện trở cần đo Rx', nameEn: 'Unknown resistor Rx',
      qty: '1 chiếc', qtyEn: '1 piece',
      why: 'Đối tượng của phép đo; giá trị ghi trên vỏ dùng để đối chiếu sai số.',
      whyEn: 'The object being measured; the printed value is your reference.',
    },
    {
      kind: 'rheostat', name: 'Biến trở con chạy 0 – 120Ω', nameEn: 'Sliding rheostat 0–120Ω',
      qty: '1 chiếc', qtyEn: '1 piece',
      why: 'Thay đổi cường độ dòng điện để có nhiều lần đo, đồng thời bảo vệ mạch.',
      whyEn: 'Varies the current for repeated readings and protects the circuit.',
    },
    {
      kind: 'multimeter', name: 'Đồng hồ vạn năng', nameEn: 'Digital multimeter',
      qty: '2 chiếc', qtyEn: '2 pieces',
      why: 'Một chiếc để thang A đo dòng điện, một chiếc để thang V đo hiệu điện thế.',
      whyEn: 'One on the A range for current, one on the V range for voltage.',
    },
    {
      name: 'Dây nối có chốt cắm', nameEn: 'Patch leads with plugs',
      qty: '7 – 8 sợi', qtyEn: '7–8 leads',
      why: 'Dùng màu nóng cho nhánh nối về cực dương, màu lạnh cho nhánh về cực âm.',
      whyEn: 'Use a warm colour towards the positive pole, a cool colour towards the negative.',
    },
    {
      name: 'Bảng lắp ráp mạch điện', nameEn: 'Circuit assembly board',
      qty: '1 tấm', qtyEn: '1 board',
      why: 'Cố định linh kiện, các đầu dây cắm chung một lỗ thì được nối với nhau.',
      whyEn: 'Holds the parts; leads sharing a hole are electrically connected.',
    },
    {
      name: 'Bảng số liệu và máy tính bỏ túi', nameEn: 'Data sheet and calculator',
      qty: '1 bộ', qtyEn: '1 set',
      why: 'Ghi ít nhất 5 lần đo rồi tính giá trị trung bình và sai số.',
      whyEn: 'Record at least five readings, then compute the mean and the error.',
    },
  ],
  steps: [
    ['Kiểm tra dụng cụ: chỉnh kim đồng hồ về vạch 0, chập hai que đo ở thang Ω xem có chỉ 0Ω không.',
     'Check the instruments: zero the needles and short the probes on the Ω range to confirm a 0Ω reading.'],
    ['Đưa con chạy biến trở về vị trí điện trở lớn nhất và để khoá K ở trạng thái mở.',
     'Set the rheostat to maximum resistance and leave key K open.'],
    ['Mắc mạch chính nối tiếp: nguồn → khoá K → ampe kế → điện trở Rx → biến trở → về cực âm của nguồn.',
     'Wire the main series loop: supply → key K → ammeter → Rx → rheostat → back to the negative pole.'],
    ['Mắc vôn kế song song đúng hai đầu điện trở Rx, chốt dương của đồng hồ về phía cực dương.',
     'Connect the voltmeter in parallel across Rx, its positive terminal towards the positive side.'],
    ['Kiểm tra lại toàn mạch, mời giáo viên duyệt rồi mới đóng khoá K.',
     'Re-check the whole circuit and have your teacher approve it before closing key K.'],
    ['Dịch con chạy biến trở, mỗi vị trí ghi một cặp giá trị U và I; lấy đủ 5 lần đo.',
     'Move the rheostat slider and record a U–I pair at each position; take five readings.'],
    ['Tính R cho từng lần đo, lấy trung bình rồi tính sai số tuyệt đối và sai số tương đối.',
     'Compute R for each reading, average them, then find the absolute and relative error.'],
    ['Mở khoá K, vặn nguồn về 0V, tháo mạch và cất dụng cụ đúng vị trí.',
     'Open key K, turn the supply back to 0V, dismantle the circuit and put everything away.'],
  ],
  safety: [
    ['Luôn để khoá K mở trong suốt quá trình đấu nối dây.',
     'Keep key K open the entire time you are wiring.'],
    ['Không bao giờ mắc ampe kế song song với nguồn hoặc với điện trở — sẽ gây đoản mạch.',
     'Never connect an ammeter in parallel with the source or a resistor — it short-circuits.'],
    ['Đưa biến trở về giá trị lớn nhất trước khi đóng điện, sau đó mới giảm dần.',
     'Set the rheostat to its maximum before switching on, then reduce gradually.'],
    ['Ngắt hoàn toàn nguồn điện trước khi chuyển đồng hồ sang thang đo điện trở.',
     'Fully disconnect the supply before switching a meter to the resistance range.'],
    ['Thấy dây nóng bất thường, có mùi khét hay khói thì ngắt điện ngay và báo giáo viên.',
     'If a lead gets hot, smells burnt or smokes, cut the power at once and tell your teacher.'],
  ],
};

interface PrepGuideViewProps {
  module?: LabModule;
  onGoToCircuit: () => void;
}

export const PrepGuideView: React.FC<PrepGuideViewProps> = ({ module, onGoToCircuit }) => {
  const { t, lang } = useSettings();
  const g = GUIDE_RESISTANCE;
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const ready = checked.size;
  const total = g.items.length;
  const pct = Math.round((ready / total) * 100);
  const allReady = ready === total;

  const bi = useMemo(() => (vi: string, en: string) => (lang === 'en' ? en : vi), [lang]);

  return (
    <div className="ml-scroll grid grid-cols-1 lg:grid-cols-6 gap-4 h-full overflow-y-auto pr-1 pb-4">

      {/* Mục tiêu bài thực hành */}
      <BentoCard className="lg:col-span-6" accent title={t('prep.title')}
        subtitle={module?.title ?? 'Đo điện trở bằng vôn kế – ampe kế'}>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <p className="text-[14px] leading-relaxed opacity-95 flex-1">{bi(g.goal, g.goalEn)}</p>
          <div className="shrink-0 bg-white/15 border border-white/25 rounded-2xl px-5 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11.5px] font-bold opacity-80 uppercase tracking-widest mb-1">
              <Sigma className="w-3.5 h-3.5" /> {lang === 'vi' ? 'Công thức chính' : 'Key formula'}
            </div>
            <div className="font-mono text-2xl font-extrabold">{g.formula}</div>
          </div>
        </div>
      </BentoCard>

      {/* Danh sách dụng cụ */}
      <BentoCard className="lg:col-span-4" title={t('prep.checklist')}
        subtitle={`${bi('Đánh dấu từng món khi đã lấy đủ', 'Tick each item once you have it')}`}
        action={
          <div className="text-right">
            <div className="text-[12px] font-bold text-slate-500">
              {t('prep.progress')} {ready}/{total} {t('prep.items')}
            </div>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div className={`h-full rounded-full transition-all duration-500 ${
                allReady ? 'bg-emerald-500' : 'bg-indigo-500'
              }`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        }>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {g.items.map((item, i) => {
            const on = checked.has(i);
            return (
              <button key={item.name} onClick={() => toggle(i)}
                className={`text-left rounded-xl border p-3 flex gap-3 transition-colors ${
                  on ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                }`}>
                <div className="w-14 h-12 shrink-0 grid place-items-center rounded-xl bg-white border border-slate-200 overflow-hidden">
                  {item.kind
                    ? <PartThumb kind={item.kind} size={item.kind === 'multimeter' ? 22 : 52}
                        live={{ closed: true, knob: 0.4, needle: 0.55, func: 'V', unit: 'V', auto: true, reading: '12.00' }} />
                    : <Boxes className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-1.5">
                    {on
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 ml-pop" />
                      : <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />}
                    <span className="text-[13px] font-bold leading-snug">{bi(item.name, item.nameEn)}</span>
                  </div>
                  <div className="text-[11.5px] font-bold text-indigo-600 mt-0.5 ml-6">{bi(item.qty, item.qtyEn)}</div>
                  <p className="text-[12px] text-slate-500 leading-snug mt-1">{bi(item.why, item.whyEn)}</p>
                </div>
              </button>
            );
          })}
        </div>

        {allReady && (
          <div className="ml-pop mt-3 rounded-2xl bg-emerald-50 border border-emerald-300 p-3 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-[13px] font-bold text-emerald-800 flex-1">
              {bi('Đã chuẩn bị đủ dụng cụ — sẵn sàng vào bàn lắp ráp!',
                  'All set — time to head to the assembly bench!')}
            </p>
            <button onClick={onGoToCircuit}
              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-extrabold flex items-center gap-1.5 shrink-0">
              {bi('Vào mô phỏng', 'Open the simulator')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </BentoCard>

      {/* Quy tắc an toàn */}
      <BentoCard className="lg:col-span-2" title={t('prep.safety')}
        subtitle={bi('Đọc kỹ trước khi đóng điện', 'Read before switching on')}>
        <ul className="space-y-2">
          {g.safety.map(([vi, en], i) => (
            <li key={i} className="flex gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="text-[12.5px] text-rose-900 leading-relaxed">{bi(vi, en)}</span>
            </li>
          ))}
        </ul>
      </BentoCard>

      {/* Các bước tiến hành */}
      <BentoCard className="lg:col-span-6" title={t('prep.steps')}
        subtitle={bi('Làm tuần tự từ trên xuống', 'Work through them in order')}>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {g.steps.map(([vi, en], i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <span className="w-7 h-7 shrink-0 rounded-full bg-indigo-600 text-white grid place-items-center text-[12.5px] font-bold">
                {i + 1}
              </span>
              <span className="text-[13px] text-slate-700 leading-relaxed">{bi(vi, en)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[12px] text-slate-400 flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5" />
          {bi('Bỏ qua bước kiểm tra dụng cụ là nguyên nhân số một khiến số liệu sai lệch.',
              'Skipping the instrument check is the number-one cause of bad data.')}
        </p>
      </BentoCard>
    </div>
  );
};

export { ClipboardList };
