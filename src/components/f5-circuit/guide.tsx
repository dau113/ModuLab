/**
 * Hướng dẫn sử dụng phần Thực hành.
 *
 * Gồm hai phần: bảng tra nhanh các công cụ và thao tác, và một bài hướng dẫn
 * từng bước dẫn học sinh lắp xong mạch đo điện trở đầu tiên.
 */
import React, { useState } from 'react';
import {
  X, MousePointer2, Cable, Eraser, Plus, Power, SearchCheck, Spline,
  ChevronLeft, ChevronRight, CircuitBoard, Lightbulb, Gauge, Trash2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Bảng tra nhanh                                                      */
/* ------------------------------------------------------------------ */

const TOOLS: { icon: React.ElementType; name: string; how: string }[] = [
  { icon: MousePointer2, name: 'Công cụ Chọn', how: 'Kéo linh kiện để đổi chỗ. Bấm một cái vào công tắc để đóng hoặc mở khoá K.' },
  { icon: Cable, name: 'Công cụ Nối dây', how: 'Bấm lần lượt vào hai chốt (hoặc hai lỗ trên bảng) để tạo một sợi dây nối chúng.' },
  { icon: Eraser, name: 'Công cụ Tẩy', how: 'Bấm vào dây để tháo dây, bấm vào linh kiện để gỡ linh kiện khỏi bàn.' },
  { icon: Plus, name: 'Thêm bảng lắp ráp', how: 'Lấy thêm một tấm bảng. Kéo bảng để đổi chỗ, đặt được nhiều tấm cùng lúc.' },
  { icon: SearchCheck, name: 'Nút Kiểm tra', how: 'Soát lại mạch và liệt kê những chỗ chưa đúng quy tắc trước khi đóng điện.' },
  { icon: Spline, name: 'Sơ đồ mạch', how: 'Vẽ lại mạch bằng ký hiệu quy ước, dây đi vuông góc như sơ đồ trên giấy.' },
];

const TIPS: { icon: React.ElementType; title: string; body: string }[] = [
  {
    icon: CircuitBoard, title: 'Bảng lắp ráp nối ngầm bên trong',
    body: 'Các lỗ nằm trên cùng một vạch trắng là một điểm nối duy nhất — cắm vào lỗ nào trong vạch đó cũng như nhau. '
      + 'Bốn góc bảng là bốn ngoặc chữ U nối bốn lỗ, phần giữa là tám nhóm ba lỗ nằm ngang. Mỗi lỗ chỉ cắm được một đầu dây.',
  },
  {
    icon: Gauge, title: 'Cắm linh kiện thẳng xuống bảng',
    body: 'Kéo linh kiện lại gần bảng rồi thả tay: chốt nào gần lỗ sẽ tự hít vào và nối điện luôn, không cần kéo dây. '
      + 'Những lỗ sắp cắm vào hiện vòng xanh nét đứt để bạn thấy trước.',
  },
  {
    icon: Lightbulb, title: 'Chọn bóng đèn cho đúng nguồn',
    body: 'Bấm ô nhỏ ghi mức điện áp trên đế đèn để thay bóng. Bóng có điện áp thấp hơn nguồn sẽ cháy ngay — '
      + 'ví dụ bóng 2,5V cắm vào nguồn 12V. Đèn LED phải cắm đúng cực và cần điện trở hạn dòng.',
  },
  {
    icon: Trash2, title: 'Gỡ nhầm thì làm sao',
    body: 'Chọn linh kiện rồi bấm dấu ✕ đỏ ở góc, hoặc nhấn phím Delete. Bảng lắp ráp cũng gỡ được như vậy.',
  },
  {
    icon: Power, title: 'Biến áp nguồn',
    body: 'Bấm công tắc bên trái để bật hoặc tắt — có chữ ON/OFF báo trạng thái. Bấm núm tròn để đổi mức điện áp, '
      + 'chạy qua tám mức từ 1,5V tới 24V.',
  },
];

/* ------------------------------------------------------------------ */
/* Bài hướng dẫn từng bước                                             */
/* ------------------------------------------------------------------ */

const STEPS: { title: string; body: string; hint: string }[] = [
  {
    title: 'Lấy một tấm bảng lắp ráp',
    body: 'Bấm nút "Thêm bảng lắp ráp" màu chàm ở đầu khay bên trái. Tấm bảng xuất hiện trên bàn lắp, '
      + 'kéo được sang chỗ khác nếu muốn.',
    hint: 'Bàn lắp lúc mới vào hoàn toàn trống, phải có bảng rồi mới lắp mạch được.',
  },
  {
    title: 'Lấy đủ linh kiện cho bài đo điện trở',
    body: 'Trong khay lần lượt bấm: Đế pin, Công tắc đơn, Ampe kế, Điện trở Rx, Biến trở, Vôn kế. '
      + 'Linh kiện sẽ tự đặt lên tấm bảng đầu tiên.',
    hint: 'Gõ vào ô tìm kiếm phía trên khay để lọc nhanh, ví dụ gõ "vôn" ra ngay vôn kế.',
  },
  {
    title: 'Sắp xếp cho gọn rồi cắm xuống bảng',
    body: 'Dùng công cụ Chọn kéo từng linh kiện về đúng chỗ. Thả gần lỗ cắm thì chốt tự hít vào và nối điện luôn.',
    hint: 'Chốt đã cắm có vòng xanh quanh chân. Nhấc linh kiện lên là chốt tự rút ra.',
  },
  {
    title: 'Nối mạch chính theo đúng thứ tự',
    body: 'Đổi sang công cụ Nối dây, rồi nối thành một vòng kín: nguồn → khoá K → ampe kế → điện trở Rx → '
      + 'biến trở → về cực còn lại của nguồn.',
    hint: 'Ampe kế mắc NỐI TIẾP, tức là dòng điện phải chạy xuyên qua nó.',
  },
  {
    title: 'Mắc vôn kế song song hai đầu Rx',
    body: 'Vẫn ở công cụ Nối dây, nối một chốt của vôn kế vào đầu này của Rx và chốt kia vào đầu kia của Rx.',
    hint: 'Vôn kế mắc SONG SONG. Nếu mắc nối tiếp thì dòng gần như bằng 0 và số đo vô nghĩa.',
  },
  {
    title: 'Kiểm tra trước khi đóng điện',
    body: 'Bấm nút "Kiểm tra" ở ô Hệ thống kiểm tra. Hệ thống liệt kê những chỗ chưa đúng và giải thích lý do.',
    hint: 'Sửa xong thì bấm Kiểm tra lại, vì kết quả cũ tự ẩn đi mỗi khi bạn đổi mạch.',
  },
  {
    title: 'Đóng khoá K và đọc số liệu',
    body: 'Bấm vào công tắc để đóng khoá. Đọc số trên ampe kế và vôn kế, rồi xoay núm biến trở để lấy lần đo tiếp theo.',
    hint: 'Lấy đủ năm lần đo ở năm vị trí biến trở khác nhau, ghi vào bước Báo cáo thực hành.',
  },
];

/* ------------------------------------------------------------------ */

export const PracticeGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<'tour' | 'ref'>('tour');
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/50 grid place-items-center p-4"
      onClick={onClose}>
      <div className="ml-pop bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl
        max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        <header className="px-5 py-3.5 border-b border-slate-200 flex items-center gap-3 shrink-0">
          <h2 className="text-h2 mr-auto">
            Hướng dẫn sử dụng phần Thực hành
          </h2>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {([['tour', 'Làm theo từng bước'], ['ref', 'Tra nhanh']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`h-9 px-3.5 text-body font-semibold transition-colors ${ tab === id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50' }`}>{label}</button>
            ))}
          </div>
          <button onClick={onClose} title="Đóng"
            className="w-9 h-9 grid place-items-center rounded-xl text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="ml-scroll flex-1 overflow-y-auto p-5">
          {tab === 'tour' ? (
            <div>
              {/* Thanh tiến trình các bước */}
              <div className="flex gap-1.5 mb-4">
                {STEPS.map((_, i) => (
                  <button key={i} onClick={() => setStep(i)}
                    title={`Bước ${i + 1}`}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= step ? 'bg-indigo-600' : 'bg-slate-200'
                    }`} />
                ))}
              </div>

              <div key={step} className="ml-rise">
                <p className="text-meta font-semibold text-indigo-600 mb-1">
                  Bước {step + 1} / {STEPS.length}
                </p>
                <h3 className="text-h2 mb-2">{s.title}</h3>
                <p className="text-body text-slate-700 leading-relaxed mb-3">{s.body}</p>
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-body text-amber-900 leading-relaxed">
                  <strong>Mẹo:</strong> {s.hint}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-5">
                <button onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step === 0}
                  className="h-10 px-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-body flex items-center gap-1.5 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" /> Bước trước
                </button>

                {step < STEPS.length - 1 ? (
                  <button onClick={() => setStep((n) => n + 1)}
                    className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-body flex items-center gap-1.5 ml-auto">
                    Bước tiếp theo <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={onClose}
                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-body ml-auto">
                    Bắt tay vào lắp
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <section>
                <h3 className="text-h3 mb-2.5">
                  Các công cụ trên thanh
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TOOLS.map((tl) => (
                    <div key={tl.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex gap-3">
                      <span className="w-9 h-9 shrink-0 rounded-lg bg-white border border-slate-200 grid place-items-center">
                        <tl.icon className="w-4 h-4 text-indigo-600" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-body font-semibold text-slate-800">{tl.name}</div>
                        <p className="text-meta text-slate-600 leading-snug mt-0.5">{tl.how}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-h3 mb-2.5">
                  Những điều dễ nhầm
                </h3>
                <div className="space-y-2.5">
                  {TIPS.map((tip) => (
                    <div key={tip.title} className="rounded-xl border border-slate-200 p-3.5 flex gap-3">
                      <tip.icon className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-body font-semibold text-slate-800 mb-0.5">{tip.title}</div>
                        <p className="text-body text-slate-600 leading-relaxed">{tip.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
