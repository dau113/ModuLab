/**
 * Bản đồ bộ phận của từng linh kiện, dùng cho phần Khám phá dụng cụ.
 *
 * Mỗi mục là một vùng trên hình vẽ kèm tên và chức năng của bộ phận đó. Học
 * sinh rê chuột hoặc bấm vào vùng nào thì đọc được phần giải thích của vùng ấy,
 * thay vì phải đoán xem cái núm hay cái chốt trên hình là cái gì.
 *
 * TOẠ ĐỘ: ghi theo đúng hệ toạ độ của hình vẽ linh kiện, tức là khung
 * `PART_CATALOG[kind].w × h`. Riêng đồng hồ vạn năng, hình gốc được vẽ trong một
 * nhóm `scale(DMM_SCALE)` nên các số ở đây đã nhân sẵn với hệ số đó.
 *
 * THỨ TỰ: vùng lớn đặt trước, vùng nhỏ đặt sau. Lớp phủ vẽ theo đúng thứ tự này
 * nên vùng nhỏ nằm trên cùng và giành được con trỏ — nếu không, cái đế nhựa to
 * sẽ che hết mấy cái chốt cắm bé.
 */
import type { PartKind } from './parts';

export interface AnatomyShape {
  shape: 'rect' | 'circle';
  x: number;
  y: number;
  w?: number;
  h?: number;
  r?: number;
}

export interface AnatomySpot {
  id: string;
  label: string;
  desc: string;
  /** Một bộ phận có thể gồm nhiều mảnh rời, ví dụ hai cái vít hay hai chân đèn */
  shapes: AnatomyShape[];
}

const rect = (x: number, y: number, w: number, h: number): AnatomyShape =>
  ({ shape: 'rect', x, y, w, h });
const circ = (x: number, y: number, r: number): AnatomyShape =>
  ({ shape: 'circle', x, y, r });

/** Đế nhựa xanh dùng chung cho hầu hết linh kiện cắm trên bàn */
const plate = (w: number, h: number): AnatomySpot => ({
  id: 'plate',
  label: 'Đế nhựa cách điện',
  desc: 'Nhựa không dẫn điện, giữ linh kiện đứng vững trên bàn và cho em cầm nắm an toàn '
    + 'kể cả khi mạch đang có điện. Mọi linh kiện trong bộ dụng cụ đều dùng chung kiểu đế này '
    + 'nên cắm lên bảng lắp ráp rất nhanh.',
  shapes: [rect(0, 0, w, h - 8)],
});

/** Chốt cắm kiểu vặn: tâm núm nằm hơi cao hơn điểm neo một chút */
const post = (x: number, y: number, pol: 'pos' | 'neg', extra: string): AnatomySpot => ({
  id: pol === 'pos' ? 'post-pos' : 'post-neg',
  label: pol === 'pos' ? 'Chốt dương (+) — màu đỏ' : 'Chốt âm (−) — màu đen',
  desc: extra,
  shapes: [circ(x, y - 1, 10)],
});

export const ANATOMY: Record<PartKind, AnatomySpot[]> = {

  /* ---------------------------------------------------------------- */
  battery: [
    plate(132, 68),
    {
      id: 'cells',
      label: 'Ngăn chứa pin 12V',
      desc: 'Bên trong là các viên pin mắc nối tiếp để cộng hiệu điện thế lại thành 12V. '
        + 'Chữ DC trên nhãn nghĩa là điện một chiều: chiều dòng điện không đổi theo thời gian, '
        + 'khác với điện xoay chiều ở ổ cắm trong nhà.',
      shapes: [rect(16, 14, 100, 20)],
    },
    {
      id: 'screws',
      label: 'Vít bắt đế',
      desc: 'Giữ nắp đế với thân. Học sinh không cần tháo hai con vít này trong giờ thực hành.',
      shapes: [circ(12, 12, 5), circ(120, 12, 5)],
    },
    post(24, 50, 'neg', 'Cực âm của nguồn. Theo quy ước, dòng điện đi ra ở cực dương, chạy qua '
      + 'mạch ngoài rồi trở về cực âm. Dây nối từ chốt này thường dùng màu đen cho dễ phân biệt.'),
    post(108, 50, 'pos', 'Cực dương của nguồn, nơi dòng điện đi ra mạch ngoài. Tuyệt đối không nối '
      + 'thẳng chốt đỏ sang chốt đen bằng một sợi dây: đó là đoản mạch, dòng điện sẽ rất lớn và làm hỏng nguồn.'),
  ],

  /* ---------------------------------------------------------------- */
  battery9v: [
    {
      id: 'body',
      label: 'Thân pin vuông 9V',
      desc: 'Pin khô 9V thường dùng cho đồng hồ đo và mạch nhỏ. Hiệu điện thế 9V nhỏ hơn bộ nguồn '
        + '12V nên dòng điện qua cùng một điện trở cũng nhỏ hơn, theo định luật Ohm I = U/R.',
      shapes: [rect(4, 12, 80, 50)],
    },
    {
      id: 'caps',
      label: 'Hai đầu cực của pin',
      desc: 'Đầu tròn là cực dương, đầu vuông có lỗ là cực âm. Hai đầu làm khác hình nhau để '
        + 'không lắp ngược được — đây là cách thiết kế chống nhầm cực rất hay gặp.',
      shapes: [rect(22, 6, 10, 8), rect(56, 6, 12, 8)],
    },
    {
      id: 'holder',
      label: 'Đế giữ pin',
      desc: 'Giữ viên pin cố định và dẫn điện từ hai đầu cực ra hai chốt cắm bên dưới.',
      shapes: [rect(0, 56, 88, 16)],
    },
    post(26, 58, 'neg', 'Nối với cực âm của viên pin.'),
    post(62, 58, 'pos', 'Nối với cực dương của viên pin.'),
  ],

  /* ---------------------------------------------------------------- */
  powersupply: [
    {
      id: 'case',
      label: 'Vỏ máy biến áp nguồn',
      desc: 'Máy hạ điện áp 220V từ ổ cắm xuống mức an toàn rồi chỉnh lưu thành điện một chiều. '
        + 'Vỏ kim loại sơn tĩnh điện vừa che mạch bên trong vừa toả nhiệt.',
      shapes: [rect(6, 26, 174, 106)],
    },
    {
      id: 'amp-display',
      label: 'Màn hình cường độ dòng điện',
      desc: 'Hiện cường độ dòng điện mà máy đang cấp cho mạch, đơn vị ampe (A). Số này tăng lên '
        + 'khi điện trở mạch ngoài giảm. Nếu nó nhảy vọt bất thường thì gần như chắc chắn mạch đang bị nối tắt.',
      shapes: [rect(40, 40, 54, 24)],
    },
    {
      id: 'volt-display',
      label: 'Màn hình hiệu điện thế',
      desc: 'Hiện hiệu điện thế ở hai cổng ra, đơn vị vôn (V). Đây là số em đặt trước khi đóng '
        + 'mạch, và nên so lại với số đo trên vôn kế để thấy sai số giữa hai dụng cụ.',
      shapes: [rect(108, 40, 54, 24)],
    },
    {
      id: 'overload',
      label: 'Đèn báo quá tải',
      desc: 'Sáng lên khi dòng điện vượt quá khả năng của máy, thường là do đoản mạch hoặc điện '
        + 'trở mạch ngoài quá nhỏ. Thấy đèn này sáng thì tắt nguồn ngay rồi kiểm tra lại dây nối.',
      shapes: [circ(101, 36, 5.5)],
    },
    {
      id: 'power-switch',
      label: 'Công tắc nguồn',
      desc: 'Gạt về phía chữ I là bật, phía chữ O là tắt. Quy tắc an toàn: luôn tắt nguồn trước '
        + 'khi tháo lắp dây, và chỉ bật sau khi đã kiểm tra xong toàn mạch.',
      shapes: [rect(20, 92, 16, 24)],
    },
    {
      id: 'ac-ports',
      label: 'Cổng xoay chiều AC 12V',
      desc: 'Cấp điện xoay chiều 12V cho các bài về máy biến áp và cảm ứng điện từ. Bài đo điện '
        + 'trở bằng ampe kế và vôn kế là bài điện một chiều nên không dùng hai cổng này.',
      shapes: [circ(52, 104, 7.5), circ(72, 104, 7.5)],
    },
    {
      id: 'knob',
      label: 'Núm chỉnh điện áp',
      desc: 'Xoay để đổi hiệu điện thế đầu ra trong khoảng 0 đến 12V. Thói quen tốt là vặn về 0 '
        + 'trước khi bật máy rồi tăng dần, vì tăng từ từ thì kịp nhận ra bất thường trước khi linh kiện hỏng.',
      shapes: [circ(158, 100, 14)],
    },
    post(98, 116, 'neg', 'Cổng ra một chiều, cực âm. Dòng điện từ mạch ngoài trở về máy qua chốt này.'),
    post(140, 116, 'pos', 'Cổng ra một chiều, cực dương. Đây là nơi dòng điện đi ra mạch ngoài.'),
  ],

  /* ---------------------------------------------------------------- */
  switch: [
    plate(104, 58),
    {
      id: 'window',
      label: 'Ô báo trạng thái',
      desc: 'Hiện chữ ĐÓNG hoặc MỞ để biết mạch đang kín hay hở mà không cần nhìn kỹ cần gạt. '
        + 'Mạch hở thì không có dòng điện, mọi số đo đều bằng 0.',
      shapes: [rect(16, 12, 72, 18)],
    },
    {
      id: 'lever',
      label: 'Cần gạt (khoá K)',
      desc: 'Gạt xuống cho đầu đỏ chạm tiếp điểm là đóng mạch, nhấc lên là ngắt. Trong sơ đồ mạch '
        + 'điện, bộ phận này được vẽ bằng kí hiệu khoá K.',
      shapes: [rect(20, 30, 62, 13)],
    },
    {
      id: 'contact',
      label: 'Tiếp điểm cố định',
      desc: 'Miếng kim loại mà cần gạt sẽ chạm vào. Chỗ tiếp xúc phải sạch, nếu bị gỉ hoặc bẩn thì '
        + 'điện trở tiếp xúc tăng lên và dòng điện đo được sẽ nhỏ hơn thực tế.',
      shapes: [circ(82, 38, 6)],
    },
    {
      id: 'pivot',
      label: 'Trục quay',
      desc: 'Đầu cố định của cần gạt, vừa làm trục quay vừa dẫn điện xuống chốt cắm bên dưới.',
      shapes: [circ(22, 38, 6)],
    },
    post(22, 44, 'neg', 'Một đầu của khoá K. Khoá K luôn mắc nối tiếp trong mạch chính.'),
    post(82, 44, 'pos', 'Đầu còn lại của khoá K, nối tiếp sang linh kiện kế tiếp.'),
  ],

  /* ---------------------------------------------------------------- */
  switch2: [
    plate(118, 72),
    {
      id: 'label',
      label: 'Nhãn 2 chiều',
      desc: 'Cho biết đây là công tắc chuyển mạch: dòng điện luôn đi về một trong hai nhánh A hoặc '
        + 'B, không bao giờ cả hai cùng lúc.',
      shapes: [rect(14, 9, 90, 14)],
    },
    {
      id: 'lever',
      label: 'Cần gạt chuyển nhánh',
      desc: 'Quay quanh trục giữa để nối chốt chung sang nhánh A hoặc nhánh B. Nhờ vậy em đổi được '
        + 'cách mắc mạch mà không phải rút dây ra cắm lại.',
      shapes: [rect(40, 30, 57, 13)],
    },
    {
      id: 'contact-a',
      label: 'Tiếp điểm A',
      desc: 'Nhánh thứ nhất. Khi cần gạt chỉ sang đây, dòng điện đi qua nhánh A còn nhánh B hở mạch.',
      shapes: [circ(22, 36, 6)],
    },
    {
      id: 'contact-b',
      label: 'Tiếp điểm B',
      desc: 'Nhánh thứ hai, hoạt động ngược lại với nhánh A.',
      shapes: [circ(96, 36, 6)],
    },
    {
      id: 'pivot',
      label: 'Trục quay chung',
      desc: 'Điểm chung của hai nhánh, nối xuống chốt đen ở giữa. Dòng điện luôn đi qua trục này '
        + 'rồi mới rẽ sang A hoặc B.',
      shapes: [circ(59, 36, 7)],
    },
    {
      id: 'post-a',
      label: 'Chốt nhánh A (+)',
      desc: 'Đầu ra của nhánh A.',
      shapes: [circ(20, 57, 10)],
    },
    {
      id: 'post-com',
      label: 'Chốt chung (−)',
      desc: 'Chốt nối với trục quay. Dây từ nguồn thường nối vào đây.',
      shapes: [circ(59, 57, 10)],
    },
    {
      id: 'post-b',
      label: 'Chốt nhánh B (+)',
      desc: 'Đầu ra của nhánh B.',
      shapes: [circ(98, 57, 10)],
    },
  ],

  /* ---------------------------------------------------------------- */
  rheostat: [
    plate(142, 68),
    {
      id: 'winding',
      label: 'Cuộn dây điện trở',
      desc: 'Dây hợp kim có điện trở suất lớn, quấn đều quanh lõi sứ. Con chạy càng xa chốt nối thì '
        + 'đoạn dây có dòng đi qua càng dài, nên điện trở càng lớn — đúng công thức R = ρL/S.',
      shapes: [rect(22, 30, 98, 12)],
    },
    {
      id: 'rail',
      label: 'Thanh trượt kim loại',
      desc: 'Thanh dẫn điện để con chạy trượt dọc theo. Thanh này gần như không có điện trở, nên '
        + 'điện trở của cả biến trở chỉ do đoạn dây hợp kim quyết định.',
      shapes: [rect(20, 20, 102, 6)],
    },
    {
      id: 'slider',
      label: 'Con chạy',
      desc: 'Kéo sang trái hoặc phải để thay đổi điện trở trong mạch, nhờ đó đổi được cường độ dòng '
        + 'điện mà không cần đổi nguồn. Đây chính là cách lấy nhiều cặp số (U, I) khác nhau cho bảng '
        + 'số liệu trong bài thực hành.',
      shapes: [rect(61, 12, 16, 28), circ(69, 5, 6)],
    },
    {
      id: 'rating',
      label: 'Thông số ghi trên thân',
      desc: 'Dòng chữ 0 – 120Ω cho biết điện trở thay đổi được từ gần 0 đến 120 ôm.',
      shapes: [rect(50, 45, 42, 11)],
    },
    post(22, 54, 'neg', 'Một đầu của đoạn dây điện trở đang dùng.'),
    post(118, 54, 'pos', 'Đầu còn lại. Biến trở mắc nối tiếp vào mạch chính để điều chỉnh dòng điện.'),
  ],

  /* ---------------------------------------------------------------- */
  resistor: [
    plate(118, 60),
    {
      id: 'body',
      label: 'Thân điện trở mẫu Rx',
      desc: 'Điện trở 100Ω chịu được công suất 5W. Đây chính là vật dẫn cần đo trong bài thực hành: '
        + 'em đo hiệu điện thế U ở hai đầu và cường độ dòng điện I chạy qua, rồi tính R = U/I và so '
        + 'với giá trị ghi trên thân.',
      shapes: [rect(20, 12, 78, 22)],
    },
    {
      id: 'leads',
      label: 'Hai chân nối',
      desc: 'Dẫn điện từ thân điện trở xuống hai chốt cắm. Hai chân này gần như không có điện trở '
        + 'nên không ảnh hưởng tới kết quả đo.',
      shapes: [rect(10, 19, 12, 8), rect(96, 19, 12, 8)],
    },
    post(20, 46, 'neg', 'Một đầu của điện trở Rx.'),
    post(98, 46, 'pos', 'Đầu còn lại của Rx. Vôn kế phải mắc song song đúng vào hai chốt này thì '
      + 'số đo mới là hiệu điện thế trên Rx.'),
  ],

  /* ---------------------------------------------------------------- */
  lamp: [
    plate(100, 66),
    {
      id: 'glass',
      label: 'Bóng thuỷ tinh',
      desc: 'Bên trong hút gần hết không khí để dây tóc không bị cháy khi nóng đỏ. Thuỷ tinh rất nóng '
        + 'lúc đèn sáng nên ngoài đời không được chạm tay vào.',
      shapes: [circ(50, 18, 13)],
    },
    {
      id: 'filament',
      label: 'Dây tóc',
      desc: 'Dây vonfram mảnh, điện trở lớn. Dòng điện qua đây toả nhiệt làm dây nóng tới mức phát '
        + 'sáng — đó là tác dụng nhiệt của dòng điện. Điện áp càng cao thì càng sáng, nhưng vượt mức '
        + 'định mức thì đứt.',
      shapes: [circ(50, 19, 6)],
    },
    {
      id: 'socket',
      label: 'Đui đèn',
      desc: 'Giữ bóng và dẫn điện vào hai đầu dây tóc. Đui xoáy cho phép thay bóng khi cháy mà không '
        + 'phải thay cả linh kiện.',
      shapes: [rect(40, 28, 20, 16)],
    },
    {
      id: 'rating-chip',
      label: 'Ô chọn mức điện áp',
      desc: 'Trong phần ModuSim, bấm vào ô này để đổi loại bóng từ 1,5V tới 24V. Chọn bóng có mức điện '
        + 'áp định mức phù hợp với nguồn: cấp quá mức thì bóng cháy, cấp thiếu thì bóng sáng mờ.',
      shapes: [rect(36, 47, 28, 13)],
    },
    post(22, 52, 'neg', 'Một đầu dây tóc. Bóng sợi đốt cắm chiều nào cũng sáng vì không phân biệt cực.'),
    post(78, 52, 'pos', 'Đầu còn lại của dây tóc.'),
  ],

  /* ---------------------------------------------------------------- */
  led: [
    plate(100, 66),
    {
      id: 'dome',
      label: 'Vỏ nhựa LED',
      desc: 'Lớp nhựa trong vừa bảo vệ con chip bên trong vừa hội tụ ánh sáng về phía trước. LED phát '
        + 'sáng do chuyển thẳng điện năng thành quang năng nên gần như không nóng, khác hẳn bóng sợi đốt.',
      shapes: [rect(39, 9, 22, 26)],
    },
    {
      id: 'ring',
      label: 'Vành đế',
      desc: 'Gờ nhựa ở chân vỏ, dùng làm dấu nhận biết mặt phẳng phía cực âm trên LED thật.',
      shapes: [rect(38, 33, 24, 5)],
    },
    {
      id: 'legs',
      label: 'Hai chân LED',
      desc: 'Chân dài là cực dương, chân ngắn là cực âm. LED chỉ cho dòng đi theo một chiều: cắm ngược '
        + 'thì không sáng và cũng không có dòng chạy qua. Đây là điểm khác cơ bản so với bóng sợi đốt.',
      shapes: [rect(42, 36, 5, 11), rect(54, 36, 5, 9)],
    },
    {
      id: 'color-chip',
      label: 'Ô đổi màu LED',
      desc: 'Bấm để chọn đỏ, xanh lá, xanh dương hoặc vàng. Màu khác nhau thì hiệu điện thế cần để '
        + 'đèn sáng cũng khác nhau một chút.',
      shapes: [rect(36, 47, 28, 13)],
    },
    post(22, 52, 'pos', 'Cực dương, nối với chân dài. Dòng điện phải đi vào chốt này thì đèn mới sáng.'),
    post(78, 52, 'neg', 'Cực âm, nối với chân ngắn.'),
  ],

  /* ---------------------------------------------------------------- */
  coil: [
    plate(96, 58),
    {
      id: 'winding',
      label: 'Cuộn dây đồng',
      desc: 'Nhiều vòng dây đồng quấn sát nhau. Khi có dòng điện chạy qua, cuộn dây sinh ra từ trường '
        + 'giống một thanh nam châm — càng nhiều vòng và dòng càng lớn thì từ trường càng mạnh.',
      shapes: [rect(20, 12, 56, 22)],
    },
    {
      id: 'frame',
      label: 'Khung quấn dây',
      desc: 'Giữ các vòng dây đều nhau và cố định. Lồng thêm lõi sắt vào trong khung sẽ làm từ trường '
        + 'mạnh lên rõ rệt.',
      shapes: [rect(18, 10, 60, 26)],
    },
    post(24, 46, 'neg', 'Một đầu cuộn dây.'),
    post(72, 46, 'pos', 'Đầu còn lại. Đổi chiều dòng điện qua hai chốt này thì hai cực từ của cuộn dây cũng đổi chỗ.'),
  ],

  /* ---------------------------------------------------------------- */
  ammeter: [
    plate(104, 106),
    {
      id: 'face',
      label: 'Mặt số',
      desc: 'Khung kính che thang chia độ và kim chỉ thị. Khi đọc số phải nhìn thẳng góc, nhìn chéo '
        + 'sẽ lệch vạch — đó là sai số do thị sai.',
      shapes: [rect(7, 3, 90, 64)],
    },
    {
      id: 'scale',
      label: 'Thang chia độ',
      desc: 'Chia từ 0 đến 3A. Khoảng cách giữa hai vạch nhỏ nhất gọi là độ chia nhỏ nhất, nó quyết '
        + 'định sai số dụng cụ khi em đọc kết quả.',
      shapes: [rect(11, 8, 82, 32)],
    },
    {
      id: 'needle',
      label: 'Kim chỉ thị và trục quay',
      desc: 'Dòng điện qua cuộn dây trong máy tạo lực làm kim quay, dòng càng lớn kim lệch càng nhiều. '
        + 'Trước khi đo, kim phải nằm đúng vạch 0.',
      shapes: [circ(52, 59, 9)],
    },
    {
      id: 'symbol',
      label: 'Ký hiệu dụng cụ',
      desc: 'Chữ A cho biết đây là ampe kế, đo cường độ dòng điện. Chữ DC cho biết chỉ dùng được với '
        + 'dòng một chiều.',
      shapes: [circ(19, 58, 9), circ(84, 59, 8)],
    },
    {
      id: 'nameplate',
      label: 'Tên và dải đo',
      desc: 'Ghi rõ loại dụng cụ. Ampe kế phải mắc NỐI TIẾP với đoạn mạch cần đo, vì điện trở trong '
        + 'của nó rất nhỏ; mắc song song sẽ gây đoản mạch và cháy cầu chì.',
      shapes: [rect(14, 73, 76, 12)],
    },
    post(30, 92, 'neg', 'Chốt âm của ampe kế. Dòng điện đi ra ở đây để trở về nguồn.'),
    post(74, 92, 'pos', 'Chốt dương. Dòng điện phải đi vào chốt này thì kim mới lệch thuận.'),
  ],

  /* ---------------------------------------------------------------- */
  voltmeter: [
    plate(104, 106),
    {
      id: 'face',
      label: 'Mặt số',
      desc: 'Khung kính che thang chia độ và kim chỉ thị. Đọc số phải nhìn thẳng góc để tránh sai số thị sai.',
      shapes: [rect(7, 3, 90, 64)],
    },
    {
      id: 'scale',
      label: 'Thang chia độ',
      desc: 'Chia từ 0 đến 15V. Chọn thang đo lớn hơn giá trị cần đo nhưng không quá lớn, vì thang càng '
        + 'rộng thì mỗi vạch ứng với càng nhiều vôn và kết quả càng kém chính xác.',
      shapes: [rect(11, 8, 82, 32)],
    },
    {
      id: 'needle',
      label: 'Kim chỉ thị và trục quay',
      desc: 'Kim lệch theo hiệu điện thế đặt vào hai chốt. Trước khi đo phải chỉnh kim về đúng vạch 0.',
      shapes: [circ(52, 59, 9)],
    },
    {
      id: 'symbol',
      label: 'Ký hiệu dụng cụ',
      desc: 'Chữ V cho biết đây là vôn kế, đo hiệu điện thế. Chữ DC cho biết chỉ dùng với dòng một chiều.',
      shapes: [circ(19, 58, 9), circ(84, 59, 8)],
    },
    {
      id: 'nameplate',
      label: 'Tên và dải đo',
      desc: 'Vôn kế phải mắc SONG SONG với đoạn mạch cần đo. Điện trở trong của nó rất lớn nên gần như '
        + 'không lấy dòng của mạch; nếu mắc nối tiếp, nó sẽ chặn dòng và cả mạch coi như hở.',
      shapes: [rect(14, 73, 76, 12)],
    },
    post(30, 92, 'neg', 'Chốt âm, nối vào điểm có điện thế thấp hơn.'),
    post(74, 92, 'pos', 'Chốt dương, nối vào điểm có điện thế cao hơn.'),
  ],

  /* ---------------------------------------------------------------- */
  /* Đồng hồ vạn năng: toạ độ đã nhân sẵn với DMM_SCALE = 1.34         */
  multimeter: [
    {
      id: 'body',
      label: 'Vỏ máy',
      desc: 'Đồng hồ vạn năng gộp nhiều dụng cụ vào một máy: đo được hiệu điện thế, cường độ dòng điện '
        + 'và điện trở, chỉ cần xoay núm sang chức năng tương ứng.',
      shapes: [rect(0, 0, 158, 265)],
    },
    {
      id: 'lcd',
      label: 'Màn hình số',
      desc: 'Hiện thẳng kết quả bằng chữ số nên không phải đọc vạch như đồng hồ kim, tránh được sai số '
        + 'thị sai. Góc màn hình còn báo đang ở chế độ DC hay AC, tự động chọn thang hay không.',
      shapes: [rect(15, 28, 129, 67)],
    },
    {
      id: 'dial',
      label: 'Núm xoay chọn chức năng',
      desc: 'Chọn đại lượng cần đo: V là hiệu điện thế, A là cường độ dòng điện, Ω là điện trở, OFF là '
        + 'tắt máy. Xoay sai chức năng là lỗi hay gặp nhất — để ở thang A rồi mắc song song như vôn kế '
        + 'sẽ gây đoản mạch.',
      shapes: [circ(79, 175, 40)],
    },
    {
      id: 'btn-range',
      label: 'Nút RANGE',
      desc: 'Chuyển giữa tự động chọn thang và tự chọn thang bằng tay. Tự chọn tay dùng khi muốn cố định '
        + 'số chữ số sau dấu phẩy cho cả bảng số liệu.',
      shapes: [rect(15, 100, 28, 14)],
    },
    {
      id: 'btn-rel',
      label: 'Nút REL',
      desc: 'Lấy giá trị đang hiện làm mốc 0, các số sau đó là độ lệch so với mốc. Dùng để trừ bớt điện '
        + 'trở của chính hai que đo khi đo điện trở nhỏ.',
      shapes: [rect(48, 100, 28, 14)],
    },
    {
      id: 'btn-peak',
      label: 'Nút MAX/MIN',
      desc: 'Ghi lại giá trị lớn nhất và nhỏ nhất đo được trong suốt quá trình, hữu ích khi số đo nhảy liên tục.',
      shapes: [rect(80, 100, 28, 14)],
    },
    {
      id: 'btn-light',
      label: 'Nút LIGHT',
      desc: 'Bật đèn nền màn hình để đọc số khi phòng thực hành thiếu sáng.',
      shapes: [rect(113, 100, 28, 14)],
    },
    {
      id: 'btn-hold',
      label: 'Nút HOLD',
      desc: 'Giữ nguyên số đang hiện trên màn hình. Rất tiện khi hai tay còn đang giữ que đo mà chưa kịp ghi số.',
      shapes: [circ(19, 125, 10)],
    },
    {
      id: 'btn-select',
      label: 'Nút SELECT',
      desc: 'Chuyển giữa một chiều (DC) và xoay chiều (AC). Để nhầm sang AC trong mạch một chiều thì số '
        + 'đọc gần như bằng 0 — một lỗi rất dễ nhầm là đồng hồ hỏng.',
      shapes: [circ(139, 125, 10)],
    },
    {
      id: 'jack-10a',
      label: 'Cổng 10A',
      desc: 'Cắm que đỏ vào đây khi đo dòng điện lớn, tới 10 ampe. Cổng này đi qua một đường dẫn riêng '
        + 'chịu được dòng cao.',
      shapes: [circ(40, 241, 10)],
    },
    {
      id: 'jack-com',
      label: 'Cổng COM',
      desc: 'Cổng chung, luôn cắm que đen vào đây dù đang đo đại lượng nào. COM viết tắt của common, '
        + 'nghĩa là điểm mốc chung cho mọi phép đo.',
      shapes: [circ(79, 241, 10)],
    },
    {
      id: 'jack-vomega',
      label: 'Cổng VΩmA',
      desc: 'Cắm que đỏ vào đây để đo hiệu điện thế, điện trở và dòng điện nhỏ. Đây là cổng dùng cho '
        + 'hầu hết các phép đo trong bài thực hành.',
      shapes: [circ(129, 241, 10)],
    },
  ],
};
