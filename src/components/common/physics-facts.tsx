/**
 * Màn hình chờ lúc nạp dữ liệu, có kèm một câu chuyện nhỏ về vật lí.
 *
 * Lúc máy chủ ngủ dậy có khi phải đợi gần một phút. Để người dùng nhìn cái vòng
 * quay suốt từng ấy thời gian thì chỉ thấy lâu; đọc được một điều hay về chính
 * môn mình đang học thì thời gian đó không phí.
 *
 * Mỗi câu đều là một con số hoặc một sự việc kiểm chứng được, không phải lời
 * động viên chung chung — vì đây là phần mềm cho giờ Vật lí.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Lightbulb } from 'lucide-react';

export interface PhysicsFact {
  /** Câu dẫn ngắn, in đậm */
  title: string;
  /** Phần giải thích, một đến hai câu */
  body: string;
}

/**
 * Ngân hàng câu. Phần lớn xoay quanh điện học cho hợp với nội dung bài, xen vài
 * câu ở lĩnh vực khác cho đỡ đơn điệu.
 */
export const PHYSICS_FACTS: PhysicsFact[] = [
  {
    title: 'Electron trong dây đồng bò chậm hơn con ốc sên',
    body: 'Chỉ khoảng vài phần mười milimét mỗi giây. Đèn sáng ngay khi bật công tắc không phải vì electron chạy nhanh, '
      + 'mà vì điện trường lan dọc dây gần bằng tốc độ ánh sáng, đẩy đồng loạt mọi electron trên đường.',
  },
  {
    title: 'Dòng điện 100 mA đủ gây nguy hiểm tính mạng',
    body: 'Chỉ bằng một phần mười ampe — nhỏ hơn dòng qua một bóng đèn 12V trong bộ thí nghiệm. '
      + 'Điều quyết định không phải hiệu điện thế, mà là dòng điện đi qua cơ thể.',
  },
  {
    title: 'Điện trở của bóng đèn sợi đốt tăng hơn mười lần khi sáng',
    body: 'Lúc nguội, dây tóc vonfram có điện trở rất nhỏ. Vì vậy ngay khoảnh khắc bật đèn, dòng vọt lên gấp nhiều lần '
      + 'dòng định mức — đó là lí do bóng đèn hay đứt đúng lúc vừa bật.',
  },
  {
    title: 'Ampe kế mắc song song là cách nhanh nhất làm hỏng nó',
    body: 'Điện trở trong của ampe kế gần bằng không, nên mắc song song với một linh kiện là tạo ra một đường nối tắt. '
      + 'Dòng dồn hết qua đồng hồ và cầu chì bên trong nổ.',
  },
  {
    title: 'Vôn kế lí tưởng có điện trở vô cùng lớn',
    body: 'Thực tế thì cỡ vài mêga-ôm. Nhờ vậy nó gần như không lấy dòng của mạch, và số nó chỉ đúng là hiệu điện thế '
      + 'vốn có chứ không phải hiệu điện thế đã bị chính nó làm sai lệch.',
  },
  {
    title: 'Georg Ohm bị đồng nghiệp chê là "ảo tưởng" khi công bố định luật của mình',
    body: 'Năm 1827 công trình của ông bị giới hàn lâm Đức bác bỏ, ông mất việc ở trường trung học. '
      + 'Phải mười mấy năm sau định luật Ohm mới được công nhận.',
  },
  {
    title: 'Pin không chứa sẵn electron để "bơm" vào mạch',
    body: 'Electron vốn đã có sẵn trong dây dẫn. Pin chỉ tạo ra hiệu điện thế để đẩy chúng đi, giống cái bơm đẩy nước '
      + 'trong ống chứ không phải cái thùng chứa nước.',
  },
  {
    title: 'Đoản mạch một viên pin AA có thể làm nó nóng tới hơn 70 °C',
    body: 'Toàn bộ năng lượng hoá học biến thành nhiệt trong chính viên pin, vì điện trở ngoài gần bằng không '
      + 'và chỉ còn điện trở trong hạn dòng.',
  },
  {
    title: 'LED không phải điện trở',
    body: 'Dưới một ngưỡng điện áp nhất định nó gần như không dẫn; vượt ngưỡng thì dòng tăng vọt. '
      + 'Vì vậy LED luôn phải mắc kèm điện trở hạn dòng, nếu không nó cháy rất nhanh.',
  },
  {
    title: 'Chim đậu trên dây điện cao thế không bị giật',
    body: 'Hai chân chim gần như cùng một điện thế nên hiệu điện thế giữa chúng gần bằng không. '
      + 'Dòng điện cần một hiệu điện thế mới chạy qua được.',
  },
  {
    title: 'Dây dẫn trong nhà nóng lên theo bình phương cường độ dòng điện',
    body: 'Công suất toả nhiệt là I²R. Dòng tăng gấp đôi thì nhiệt toả ra gấp bốn — đó là lí do dây quá tải cháy '
      + 'nhanh hơn nhiều so với mức người ta tưởng.',
  },
  {
    title: 'Sét là một dòng điện khoảng 30 000 ampe',
    body: 'Nhưng chỉ kéo dài vài chục phần triệu giây. Không khí trên đường đi của nó nóng tới khoảng 30 000 °C, '
      + 'nóng hơn bề mặt Mặt Trời năm lần.',
  },
  {
    title: 'Điện trở suất của bạc nhỏ nhất trong các kim loại',
    body: 'Nhưng dây điện vẫn làm bằng đồng. Bạc chỉ dẫn tốt hơn đồng khoảng 5 %, trong khi đắt hơn hàng chục lần.',
  },
  {
    title: 'Sai số của phép đo không phải là lỗi của người đo',
    body: 'Mọi dụng cụ đều có giới hạn. Ghi được sai số cùng kết quả mới là làm thí nghiệm đúng cách, '
      + 'còn ghi một con số trần trụi là chưa nói hết sự thật.',
  },
  {
    title: 'Một tia chớp chứa đủ năng lượng thắp sáng bóng 100 W trong vài tháng',
    body: 'Nhưng con người chưa thu được, vì toàn bộ năng lượng đó đổ xuống trong chưa tới một phần nghìn giây '
      + 'và không thiết bị nào chịu nổi công suất tức thời ấy.',
  },
  {
    title: 'Mắc nối tiếp thì dòng như nhau, mắc song song thì hiệu điện thế như nhau',
    body: 'Hai câu này gói gọn gần hết bài toán mạch điện ở phổ thông. Nhớ được chúng thì phần lớn đề bài '
      + 'chỉ còn là việc nhìn ra đâu nối tiếp, đâu song song.',
  },
  {
    title: 'Cơ thể người có điện trở thay đổi từ vài nghìn tới hơn một triệu ôm',
    body: 'Tay khô có điện trở rất lớn, tay ướt thì nhỏ đi hàng trăm lần. Đó là lí do không bao giờ chạm vào '
      + 'mạch điện khi tay còn ướt.',
  },
  {
    title: 'Biến trở con chạy thay đổi điện trở bằng cách thay đổi chiều dài dây',
    body: 'Điện trở tỉ lệ thuận với chiều dài và tỉ lệ nghịch với tiết diện. Kéo con chạy là kéo dài hoặc rút ngắn '
      + 'đoạn dây mà dòng điện phải đi qua.',
  },
];

/** Chọn ngẫu nhiên một câu khác câu đang hiện, để lần đổi nào cũng thấy mới */
const pickOther = (current: number): number => {
  if (PHYSICS_FACTS.length < 2) return 0;
  let i = current;
  while (i === current) i = Math.floor(Math.random() * PHYSICS_FACTS.length);
  return i;
};

interface Props {
  /** Dòng chữ chính của màn chờ */
  label?: string;
  /** Bao nhiêu giây thì đổi sang câu khác */
  rotateSeconds?: number;
}

export const LoadingWithFact: React.FC<Props> = ({
  label = 'Đang nạp dữ liệu từ cơ sở dữ liệu…',
  rotateSeconds = 9,
}) => {
  /* Chọn câu đầu ngay khi dựng, không chọn trong lúc vẽ, để câu không nhảy
     lung tung mỗi lần React vẽ lại màn hình này. */
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * PHYSICS_FACTS.length));
  const [mo, setMo] = useState(true);
  const dong = useRef<number | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      /* Mờ đi rồi mới đổi chữ, đổi xong mới hiện lại — đổi thẳng thì chữ giật */
      setMo(false);
      dong.current = window.setTimeout(() => {
        setIdx((v) => pickOther(v));
        setMo(true);
      }, 280);
    }, Math.max(rotateSeconds, 4) * 1000);

    return () => {
      window.clearInterval(t);
      if (dong.current !== null) window.clearTimeout(dong.current);
    };
  }, [rotateSeconds]);

  const fact = PHYSICS_FACTS[idx];

  return (
    <div className="w-full h-screen bg-slate-100 text-slate-900 grid place-items-center font-sans px-6">
      <div className="w-full max-w-xl text-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-500">{label}</p>

        {/*
          Khung giữ chiều cao tối thiểu cố định. Câu dài câu ngắn khác nhau, không
          giữ chỗ sẵn thì mỗi lần đổi câu cả khối lại nhảy lên nhảy xuống.
        */}
        <div className="mt-6 min-h-[8.5rem] flex items-start justify-center">
          <div className={`rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left
            transition-opacity duration-300 ${mo ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex items-center gap-1.5 text-indigo-700">
              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[clamp(11px,0.76vw,13px)] font-bold uppercase tracking-wider">
                Có thể em chưa biết
              </span>
            </div>
            <p className="mt-1.5 text-[clamp(13.5px,0.94vw,16px)] font-bold text-slate-900 leading-snug">
              {fact.title}
            </p>
            <p className="mt-1 text-[clamp(12.5px,0.86vw,15px)] text-slate-600 leading-relaxed">
              {fact.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
