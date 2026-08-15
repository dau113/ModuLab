import type { LabModule, ToolItem, QuizQuestion, TeacherClassStats } from '../types';

export const INITIAL_USERS = [
  {
    id: 'user-1',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@thpt.edu.vn',
    role: 'hs' as const,
    classCode: '11A2-VL',
    teamCode: 'Nhóm 3 - Bàn 5',
  },
  {
    id: 'user-2',
    name: 'Thầy Trần Hùng',
    email: 'hung.tran@thpt.edu.vn',
    role: 'gv' as const,
    classCode: '11A2-VL',
    teamCode: '',
  },
];

export const LAB_MODULES: LabModule[] = [
  {
    id: 'lab-1',
    title: 'Đo điện trở bằng ampe kế và vôn kế',
    description: 'Thực hành mắc mạch điện theo định luật Ôm để xác định giá trị điện trở chưa biết Rx bằng cách đo cường độ dòng điện (I) và hiệu điện thế (U).',
    theoryContent: `### 1. Cơ sở lý thuyết & Định luật Ôm
Cường độ dòng điện chạy qua một dây dẫn tỉ lệ thuận với hiệu điện thế đặt vào hai đầu dây và tỉ lệ nghịch với điện trở của dây:

$$I = \\frac{U}{R} \\implies R = \\frac{U}{I}$$

*Trong đó:*
* **U**: Hiệu điện thế giữa hai đầu điện trở (Vôn - V)
* **I**: Cường độ dòng điện chạy qua điện trở (Ampe - A)
* **R**: Điện trở của vật dẫn (Ôm - $\\Omega$)

---

### 2. Sơ đồ mạch điện chuẩn
Để xác định chính xác điện trở chưa biết $R_x$, ta cần dùng **Ampe kế** mắc nối tiếp với $R_x$ để đo dòng điện chạy qua nó, và **Vôn kế** mắc song song với $R_x$ để đo hiệu điện thế giữa hai đầu điện trở.

> **⚠️ LƯU Ý AN TOÀN QUAN TRỌNG:**
> * **TUYỆT ĐỐI KHÔNG** mắc song song Ampe kế với nguồn điện hoặc điện trở vì điện trở trong của Ampe kế rất nhỏ ($R_A \\approx 0$), sẽ gây ra hiện tượng **ĐOẢN MẠCH NGUỒN**, làm cháy nổ đồng hồ đo và hỏng nguồn!
> * Luôn để Khó K ở trạng thái **MỞ (ngắt mạch)** trước khi tiến hành đấu nối dây dẫn.
> * Chỉ đóng điện khi đã kiểm tra và đảm bảo các chốt dương (+) của dụng cụ đo nối về phía cực dương của nguồn.`,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    maxErrorThreshold: 0.10, // 10%
    verifiedBy: 'Thầy Trần Hùng — GV Vật lí',
    verifiedDate: '20/07/2026',
    referenceSource: 'SGK Vật lí 11 (Chương trình GDPT 2018) - Bộ Kết nối tri thức',
    status: 'da_duyet',
  },
  {
    id: 'lab-2',
    title: 'Khảo sát mạch điện nối tiếp và song song',
    description: 'Nghiên cứu sự phân bố điện áp và cường độ dòng điện trong các nhánh mạch nối tiếp và mạch rẽ nhánh song song.',
    theoryContent: `### 1. Đoạn mạch nối tiếp ($R_1 \\text{ nt } R_2$)
Trong đoạn mạch gồm hai điện trở mắc nối tiếp:
* **Cường độ dòng điện:** Có giá trị như nhau tại mọi điểm: $I = I_1 = I_2$
* **Hiệu điện thế:** Bằng tổng các hiệu điện thế thành phần: $U = U_1 + U_2$
* **Điện trở tương đương:** $R_{tđ} = R_1 + R_2$

---

### 2. Đoạn mạch song song ($R_1 \\parallel R_2$)
Trong đoạn mạch gồm hai điện trở mắc song song:
* **Hiệu điện thế:** Bằng nhau giữa hai đầu mỗi nhánh: $U = U_1 = U_2$
* **Cường độ dòng điện:** Dòng điện mạch chính bằng tổng dòng qua các nhánh: $I = I_1 + I_2$
* **Điện trở tương đương:** $\\frac{1}{R_{tđ}} = \\frac{1}{R_1} + \\frac{1}{R_2} \\implies R_{tđ} = \\frac{R_1 \\cdot R_2}{R_1 + R_2}$`,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    maxErrorThreshold: 0.12,
    verifiedBy: 'Cô Lê Mai — Tổ trưởng chuyên môn',
    verifiedDate: '22/07/2026',
    referenceSource: 'SGK Vật lí 11 - Bài 23: Điện trở. Định luật Ôm',
    status: 'da_duyet',
  },
];

export const EXPLORE_TOOLS: ToolItem[] = [
  {
    id: 'tool-dmm',
    name: 'Đồng hồ vạn năng hiện số',
    category: 'meter',
    shortDesc: 'Dụng cụ đo đa năng: đo hiệu điện thế (U), cường độ dòng điện (I) và điện trở (R).',
    detailedDesc: 'Đồng hồ vạn năng kỹ thuật số cho phép lựa chọn nhiều chế độ đo thông qua núm xoay chọn thang đo. Trang bị màn hình LCD hiện số chính xác cao, bảo vệ chống quá tải.',
    iconName: 'Gauge',
    errorReading: 'Sai số dụng cụ bằng ±(0.5% + 2 chữ số cuối). Cần chọn đúng thang đo lớn hơn giá trị cần đo một chút để có độ chính xác cao nhất.',
    modes: [
      {
        id: 'mode-dcv',
        name: 'DCV (V=)',
        label: 'Đo điện áp một chiều (Vôn kế)',
        desc: 'Đo hiệu điện thế một chiều giữa hai điểm trong mạch điện.',
        safeUsage: 'Mắc SONG SONG với đoạn mạch cần đo. Chốt màu đỏ (+) nối về phía cực dương của nguồn, chốt đen (-) COM nối về phía cực âm.',
      },
      {
        id: 'mode-dca',
        name: 'DCA (A=)',
        label: 'Đo dòng điện một chiều (Ampe kế)',
        desc: 'Đo cường độ dòng điện chạy qua một nhánh của mạch điện.',
        safeUsage: 'Mắc NỐI TIẾP vào mạch điện cần đo dòng qua đó.',
        warning: '⚠️ TUYỆT ĐỐI KHÔNG mắc song song chế độ DCA vào nguồn điện hoặc điện trở! Sẽ gây đoản mạch, đứt cầu chì hoặc cháy hỏng đồng hồ!',
      },
      {
        id: 'mode-ohm',
        name: 'Ω (Ohm)',
        label: 'Đo điện trở trực tiếp',
        desc: 'Đo giá trị điện trở của linh kiện khi đã tách rời khỏi nguồn điện.',
        safeUsage: 'Mắc vào hai đầu điện trở. CHÚ Ý: Linh kiện bắt buộc phải KHÔNG CÓ dòng điện chạy qua (đã ngắt nguồn) mới được đo chế độ này.',
        warning: '⚠️ Ngắt nguồn điện mạch thí nghiệm trước khi xoay về thang đo ôm (Ω).',
      },
      {
        id: 'mode-acv',
        name: 'ACV (V~)',
        label: 'Đo điện áp xoay chiều',
        desc: 'Đo hiệu điện thế xoay chiều (điện lưới, máy phát điện). Không áp dụng cho bài thí nghiệm Pin một chiều trong bài học này.',
        safeUsage: 'Mắc song song với nguồn điện xoay chiều cần kiểm tra.',
      }
    ]
  },
  {
    id: 'tool-ammeter',
    name: 'Ampe kế kim (0 – 3A)',
    category: 'meter',
    shortDesc: 'Dụng cụ đo cường độ dòng điện trong mạch (thang đo 0 - 3A).',
    detailedDesc: 'Ampe kế có điện trở trong R_A rất nhỏ (gần bằng 0), dùng để đo dòng điện chạy qua thiết bị mà không làm ảnh hưởng đáng kể đến tổng trở mạch.',
    iconName: 'Activity',
    errorReading: 'Sai số tuyệt đối ΔI = 0.05A (đối với thang đo 3A). Nhìn thẳng góc với mặt đồng hồ để không bị sai số do thị sai.',
    safetyWarning: '⚠️ Lỗi NGUY HIỂM: Cấm mắc song song với nguồn! Mắc đúng chiều chốt (+) và (-).'
  },
  {
    id: 'tool-voltmeter',
    name: 'Vôn kế kim (0 – 15V)',
    category: 'meter',
    shortDesc: 'Dụng cụ đo hiệu điện thế giữa hai điểm trong mạch (thang đo 0 - 15V).',
    detailedDesc: 'Vôn kế có điện trở trong R_V rất lớn (hàng mêga-ôm), đảm bảo không có dòng điện đáng kể phân nhánh qua đồng hồ khi mắc song song.',
    iconName: 'Compass',
    errorReading: 'Sai số tuyệt đối ΔU = 0.2V (thang 15V). Chọn thang đo phù hợp để kim quay trên nửa thang đo sau.',
    safetyWarning: 'Mắc SONG SONG với linh kiện cần đo hiệu điện thế. Chốt (+) nối về phía cực dương nguồn.'
  },
  {
    id: 'tool-battery',
    name: 'Đế pin (nguồn một chiều 12V)',
    category: 'source',
    shortDesc: 'Cung cấp hiệu điện thế một chiều ổn định cho mạch thí nghiệm.',
    detailedDesc: 'Hộp pin thí nghiệm có các chốt cắm đầu ra điều chỉnh được điện áp 3V, 6V, 9V, 12V. Có cầu chì tự ngắt khi bị quá tải.',
    iconName: 'BatteryCharging',
    errorReading: 'Điện áp thực tế có thể sụt giảm nhẹ khi mạch có dòng tải lớn do điện trở trong của pin (r).',
    safetyWarning: '⚠️ Cấm chập trực tiếp hai cực (+) và (-) của nguồn với dây dẫn (gây ĐOẢN MẠCH NGUỒN làm nóng chảy dây và hỏng nguồn).'
  },
  {
    id: 'tool-resistor',
    name: 'Điện trở mẫu Rx (100Ω – 5W)',
    category: 'component',
    shortDesc: 'Linh kiện tiêu thụ điện năng, cản trở dòng điện trong mạch.',
    detailedDesc: 'Các điện trở sứ công suất 5W - 10W có chốt cắm chuẩn 4mm, được sử dụng để làm điện trở mẫu hoặc đối tượng đo R_x trong bài thực hành.',
    iconName: 'Cpu',
    errorReading: 'Sai số do nhiệt độ tỏa ra khi dòng điện chạy qua lâu làm tăng điện trở thực tế.',
    safetyWarning: 'Không để cường độ dòng điện vượt quá công suất định mức P_max = I²R của điện trở.'
  },
  {
    id: 'tool-switch',
    name: 'Công tắc đơn (khoá K)',
    category: 'component',
    shortDesc: 'Dùng để đóng hoặc ngắt dòng điện trong mạch thí nghiệm.',
    detailedDesc: 'Công tắc kiểu dao cắt dạng hở, giúp học sinh quan sát rõ ràng trạng thái đóng mạch hay ngắt mạch an toàn.',
    iconName: 'ToggleLeft',
    errorReading: 'Tiếp xúc tại bề mặt dao cắt có thể gây ra điện trở tiếp xúc nhỏ (≈ 0.05Ω) nếu bị oxy hóa hoặc bám bụi.',
    safetyWarning: 'Luôn mở Khóa K khi đang thao tác đấu nối dây dẫn! Chỉ đóng lại khi đã được giáo viên kiểm tra hoặc tự kiểm tra trên phần mềm.'
  },
  {
    id: 'tool-rheostat',
    name: 'Biến trở con chạy (0 – 120Ω)',
    category: 'component',
    shortDesc: 'Thay đổi điện trở của mạch để điều chỉnh cường độ dòng điện.',
    detailedDesc: 'Dây điện trở quấn quanh lõi sứ, con chạy trượt dọc theo thanh kim loại chia dây thành hai phần. Phần dây nằm giữa chốt cố định và con chạy chính là điện trở tham gia vào mạch, nên dịch con chạy là thay đổi được điện trở.',
    iconName: 'SlidersHorizontal',
    errorReading: 'Vạch chia trên thân biến trở chỉ có tính tham khảo; muốn biết chính xác phải đo bằng đồng hồ ở thang Ω khi đã ngắt nguồn.',
    safetyWarning: '⚠️ Trước khi đóng khóa K phải đưa con chạy về vị trí điện trở LỚN NHẤT, sau đó mới giảm dần để tránh dòng điện tăng vọt.'
  },
  {
    id: 'tool-lamp',
    name: 'Đui đèn và bóng đèn 6V – 3W',
    category: 'component',
    shortDesc: 'Biến điện năng thành quang năng, dùng quan sát trực quan có dòng điện hay không.',
    detailedDesc: 'Bóng đèn dây tóc lắp trên đui có hai chốt cắm. Dây tóc vonfam nóng lên tới vài nghìn độ nên phát sáng; điện trở nóng của đèn khoảng 30Ω, lớn hơn nhiều so với điện trở khi nguội.',
    iconName: 'Lightbulb',
    errorReading: 'Điện trở của đèn thay đổi theo nhiệt độ nên đèn không tuân theo định luật Ôm một cách tuyến tính — đồ thị U theo I là đường cong.',
    safetyWarning: 'Không cấp điện áp vượt quá giá trị định mức ghi trên bóng, dây tóc sẽ đứt ngay lập tức.'
  },
  {
    id: 'tool-powersupply',
    name: 'Biến áp nguồn một chiều 0 – 12V',
    category: 'source',
    shortDesc: 'Nguồn ổn áp phòng thí nghiệm, điều chỉnh được điện áp lối ra.',
    detailedDesc: 'Bộ nguồn hạ áp và chỉnh lưu điện lưới thành điện một chiều ổn định 0 – 12V, dòng tối đa 5A. Hai màn hình hiện số cho biết điện áp và cường độ dòng điện lối ra; đèn Overload báo quá tải và mạch tự ngắt bảo vệ.',
    iconName: 'PlugZap',
    errorReading: 'Số chỉ trên màn hình của bộ nguồn là điện áp tại hai cực lối ra, nhỏ hơn suất điện động một chút khi mạch có dòng lớn do sụt áp trong máy.',
    safetyWarning: '⚠️ Chỉ dùng cặp cổng DC cho bài thực hành một chiều. Vặn núm về 0V trước khi bật, sau đó mới tăng dần đến điện áp cần dùng.'
  },
  {
    id: 'tool-battery9v',
    name: 'Pin vuông 9V',
    category: 'source',
    shortDesc: 'Nguồn điện gọn nhẹ 9V cho các mạch nhỏ.',
    detailedDesc: 'Pin khô kiềm gồm sáu ngăn 1,5V ghép nối tiếp trong một vỏ vuông, suất điện động 9V, điện trở trong khoảng 1Ω — lớn hơn hộp pin thí nghiệm nên điện áp sụt rõ khi mạch có dòng lớn.',
    iconName: 'BatteryFull',
    errorReading: 'Pin dùng lâu thì suất điện động giảm và điện trở trong tăng, làm số đo lệch dần theo thời gian.',
    safetyWarning: '⚠️ Cấm chập hai cực của pin. Pin nóng lên bất thường phải ngắt mạch ngay.'
  },
  {
    id: 'tool-coil',
    name: 'Cuộn dây',
    category: 'component',
    shortDesc: 'Tạo từ trường khi có dòng điện, dùng cho thí nghiệm cảm ứng điện từ.',
    detailedDesc: 'Cuộn dây đồng nhiều vòng quấn quanh khung. Khi có dòng điện chạy qua, cuộn dây sinh từ trường giống một nam châm thẳng; ngược lại khi từ thông qua cuộn dây biến thiên thì trong cuộn dây xuất hiện suất điện động cảm ứng.',
    iconName: 'CircleDashed',
    errorReading: 'Điện trở thuần của cuộn dây nhỏ (khoảng 6Ω) nên nếu mắc trực tiếp vào nguồn sẽ có dòng lớn.',
    safetyWarning: 'Luôn mắc nối tiếp với điện trở hoặc biến trở để hạn chế dòng qua cuộn dây.'
  },
  {
    id: 'tool-board',
    name: 'Bảng lắp ráp mạch điện',
    category: 'component',
    shortDesc: 'Mặt bảng có nhiều lỗ cắm để cố định linh kiện và bắt dây.',
    detailedDesc: 'Bảng nhựa cứng với lưới lỗ cắm chuẩn 4mm. Các đầu dây cắm chung một lỗ thì được nối với nhau, nhờ vậy học sinh dựng được sơ đồ mạch gọn gàng, dễ soát lỗi hơn so với nối dây trực tiếp giữa các linh kiện.',
    iconName: 'LayoutGrid',
    errorReading: 'Lỗ cắm lỏng hoặc bị oxy hóa sẽ sinh điện trở tiếp xúc làm số đo sai lệch — cắm chặt và lắc thử trước khi đo.',
    safetyWarning: 'Sắp xếp dây gọn, không để dây trần chạm nhau tạo đường nối tắt ngoài ý muốn.'
  },
  {
    id: 'tool-wire',
    name: 'Dây nối có chốt cắm',
    category: 'component',
    shortDesc: 'Dẫn điện giữa các linh kiện trong mạch.',
    detailedDesc: 'Dây đồng nhiều sợi bọc nhựa, hai đầu gắn chốt cắm 4mm. Quy ước dùng màu nóng cho nhánh nối về cực dương và màu lạnh cho nhánh nối về cực âm để dễ soát sơ đồ.',
    iconName: 'Cable',
    errorReading: 'Bản thân dây có điện trở rất nhỏ nhưng chỗ tiếp xúc lỏng lại gây sai số đáng kể, nhất là khi đo điện trở nhỏ.',
    safetyWarning: 'Không dùng dây có vỏ nhựa nứt hoặc lõi đồng lòi ra ngoài.'
  }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Để xác định điện trở chưa biết Rx bằng phương pháp Vôn-Ampe, cần mắc Ampe kế và Vôn kế vào mạch như thế nào cho đúng?',
    timeLimit: 30,
    options: [
      { id: 'a', text: 'Ampe kế mắc nối tiếp với Rx, Vôn kế mắc song song với Rx', isCorrect: true },
      { id: 'b', text: 'Ampe kế mắc song song với Rx, Vôn kế mắc nối tiếp với Rx', isCorrect: false },
      { id: 'c', text: 'Cả hai dụng cụ đều mắc nối tiếp với điện trở Rx', isCorrect: false },
      { id: 'd', text: 'Cả hai dụng cụ đều mắc song song với nguồn điện', isCorrect: false },
    ],
    explanation: 'Ampe kế đo cường độ dòng điện chạy qua điện trở nên bắt buộc phải mắc nối tiếp với Rx. Vôn kế đo hiệu điện thế giữa hai đầu điện trở nên bắt buộc phải mắc song song với Rx.'
  },
  {
    id: 'q2',
    question: 'Điều gì là NGUY HIỂM NHẤT sẽ xảy ra khi vô tình mắc SONG SONG Ampe kế trực tiếp vào hai cực của nguồn điện?',
    timeLimit: 30,
    options: [
      { id: 'a', text: 'Kim Ampe kế sẽ chỉ số 0, không có dòng điện chạy qua', isCorrect: false },
      { id: 'b', text: 'Đoản mạch nguồn điện do điện trở trong Ampe kế rất nhỏ (RA ≈ 0), có thể gây cháy nổ thiết bị', isCorrect: true },
      { id: 'c', text: 'Vôn kế trong mạch sẽ báo giá trị quá lớn', isCorrect: false },
      { id: 'd', text: 'Dòng điện xoay chiều sẽ biến đổi thành dòng một chiều', isCorrect: false },
    ],
    explanation: 'Ampe kế được thiết kế có điện trở trong RA gần bằng 0 Ω để không cản trở dòng điện. Nếu mắc song song với nguồn, dòng điện đoản mạch I = E/r cực lớn sẽ phát sinh làm cháy khung dây đồng hồ và hỏng nguồn!'
  },
  {
    id: 'q3',
    question: 'Theo định luật Ôm cho đoạn mạch, khi tăng gấp đôi hiệu điện thế U đặt vào hai đầu một điện trở R cố định thì cường độ dòng điện I sẽ:',
    timeLimit: 30,
    options: [
      { id: 'a', text: 'Giảm đi một nửa', isCorrect: false },
      { id: 'b', text: 'Không thay đổi', isCorrect: false },
      { id: 'c', text: 'Tăng lên gấp đôi (tỉ lệ thuận với U)', isCorrect: true },
      { id: 'd', text: 'Tăng lên gấp 4 lần', isCorrect: false },
    ],
    explanation: 'Theo công thức I = U/R. Với R là hằng số không đổi, cường độ dòng điện I tỉ lệ thuận trực tiếp với hiệu điện thế U đặt vào hai đầu mạch.'
  },
  {
    id: 'q4',
    question: 'Khi sử dụng đồng hồ vạn năng kỹ thuật số để đo cường độ dòng điện một chiều trong thí nghiệm, ta cần xoay núm chọn về chế độ nào?',
    timeLimit: 30,
    options: [
      { id: 'a', text: 'Chế độ DCV (V=)', isCorrect: false },
      { id: 'b', text: 'Chế độ ACV (V~)', isCorrect: false },
      { id: 'c', text: 'Chế độ DCA (A=)', isCorrect: true },
      { id: 'd', text: 'Chế độ ôm (Ω)', isCorrect: false },
    ],
    explanation: 'DCA (Direct Current Amperage - A=) là thang đo chuyên dụng để đo cường độ dòng điện một chiều trong mạch. DCV đo điện áp một chiều, ACV đo điện áp xoay chiều, và Ω đo điện trở.'
  },
  {
    id: 'q5',
    question: 'Tại sao trước khi bắt đầu cắm dây nối các thiết bị trên bàn thực hành, học sinh phải luôn đảm bảo Khóa K đang ở trạng thái MỞ (ngắt mạch)?',
    timeLimit: 30,
    options: [
      { id: 'a', text: 'Để tiết kiệm pin cho chiếc đồng hồ đo Vôn kế', isCorrect: false },
      { id: 'b', text: 'Đảm bảo an toàn, tránh dòng điện chạy đột ngột khi cắm nhầm dây gây đoản mạch hoặc chập cháy', isCorrect: true },
      { id: 'c', text: 'Vì nếu đóng Khóa K thì dây nối sẽ bị rò rỉ điện ra ngoài không khí', isCorrect: false },
      { id: 'd', text: 'Để điện trở Rx đạt nhiệt độ phòng chuẩn trước khi đo', isCorrect: false },
    ],
    explanation: 'Mở khóa K giúp mạch điện bị ngắt hoàn toàn. Trong lúc thao tác cắm dây, nếu vô tình cắm sai chốt hoặc chập cực thì mạch vẫn chưa có điện, giúp bảo vệ an toàn cho cả học sinh và thiết bị đo.'
  }
];

export const INITIAL_REPORT_ROWS = [
  { id: 1, u: 3.0, uUnit: 'V' as const, i: 145, iUnit: 'mA' as const, rCalc: 20.69 },
  { id: 2, u: 6.0, uUnit: 'V' as const, i: 295, iUnit: 'mA' as const, rCalc: 20.34 },
  { id: 3, u: 9.0, uUnit: 'V' as const, i: 440, iUnit: 'mA' as const, rCalc: 20.45 },
];

export const TEACHER_CLASS_STATS: TeacherClassStats = {
  classCode: '11A2-VL',
  className: 'Lớp 11A2 - Chuyên Lý THPT',
  totalStudents: 36,
  quizCompleted: 31,
  reportsSubmitted: 8, // out of 10 teams
  errorStats: [
    { question: 'Mắc song song Ampe kế với nguồn (Lỗi nguy hiểm)', wrongCount: 12 },
    { question: 'Quy đổi nhầm đơn vị mA sang A khi tính R = U/I', wrongCount: 9 },
    { question: 'Nhầm lẫn giữa chế độ DCV và DCA trên đồng hồ vạn năng', wrongCount: 6 },
    { question: 'Mắc ngược cực dương (+) của Vôn kế vào mạch', wrongCount: 5 },
  ],
  studentList: [
    { id: 'hs-1', name: 'Nguyễn Văn An', team: 'Nhóm 3 - Bàn 5', quizScore: 10, reportStatus: 'Đạt' },
    { id: 'hs-2', name: 'Lê Thị Mai', team: 'Nhóm 3 - Bàn 5', quizScore: 8, reportStatus: 'Đạt' },
    { id: 'hs-3', name: 'Trần Bình Trọng', team: 'Nhóm 1 - Bàn 1', quizScore: 6, reportStatus: 'Đạt' },
    { id: 'hs-4', name: 'Pham Duy Hưng', team: 'Nhóm 1 - Bàn 1', quizScore: 8, reportStatus: 'Đạt' },
    { id: 'hs-5', name: 'Hoàng Thùy Linh', team: 'Nhóm 2 - Bàn 3', quizScore: 4, reportStatus: 'Chưa đạt' },
    { id: 'hs-6', name: 'Đặng Bảo Khoa', team: 'Nhóm 2 - Bàn 3', quizScore: 10, reportStatus: 'Chưa đạt' },
    { id: 'hs-7', name: 'Vũ Minh Đức', team: 'Nhóm 4 - Bàn 6', quizScore: null, reportStatus: 'Chưa nộp' },
    { id: 'hs-8', name: 'Bùi Lan Hương', team: 'Nhóm 4 - Bàn 6', quizScore: 8, reportStatus: 'Chưa nộp' },
  ],
};
