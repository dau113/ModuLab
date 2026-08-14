import type { QuizQuestion } from '../types';

/**
 * Ngân hàng câu hỏi phần Khởi động — 75 câu chia theo ba chủ đề:
 * Sai số (18 câu) · Điện trở (16 câu) · Dụng cụ đo (41 câu).
 */
export interface QuizTopic { id: string; name: string; nameEn: string; color: string; icon: string }

export const QUIZ_TOPICS: QuizTopic[] = [
  { id: 'A', name: 'Lý thuyết sai số', nameEn: 'Measurement error', color: 'violet', icon: 'Sigma' },
  { id: 'B', name: 'Lý thuyết điện trở', nameEn: 'Resistance', color: 'amber', icon: 'Zap' },
  { id: 'C', name: 'Dụng cụ đo', nameEn: 'Instruments', color: 'emerald', icon: 'Gauge' },
];

export const QUIZ_BANK: (QuizQuestion & { topic: string })[] = [
  {
    id: 'a1', topic: 'A', timeLimit: 30,
    question: 'Ý nghĩa lý thuyết lớn nhất của việc xác định "sai số tỉ đối" (sai số tương đối) so với "sai số tuyệt đối" là gì?',
    options: [
      { id: 'a', text: 'Cho biết chính xác khoảng giá trị chứa đại lượng cần đo.', isCorrect: false },
      { id: 'b', text: 'Giúp người đo biết được độ chia nhỏ nhất của thiết bị nhanh hơn.', isCorrect: false },
      { id: 'c', text: 'Phản ánh chính xác mức độ chất lượng (độ chính xác) của phép đo, không phụ thuộc vào độ lớn của đơn vị đo.', isCorrect: true },
      { id: 'd', text: 'Loại bỏ hoàn toàn sai số ngẫu nhiên ra khỏi kết quả cuối cùng.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'a2', topic: 'A', timeLimit: 30,
    question: 'Khi đọc kết quả trên các đồng hồ đo điện dùng kim, nguyên nhân chính gây ra "sai số ngẫu nhiên" (sai số do người đọc) là gì?',
    options: [
      { id: 'a', text: 'Kim đồng hồ bị ma sát với trục quay.', isCorrect: false },
      { id: 'b', text: 'Người đo nhìn xiên góc, không đặt mắt vuông góc với mặt số tại vị trí kim chỉ.', isCorrect: true },
      { id: 'c', text: 'Người đo chưa chỉnh kim về vạch 0 trước khi đo.', isCorrect: false },
      { id: 'd', text: 'Từ trường Trái Đất làm lệch kim.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'a3', topic: 'A', timeLimit: 30,
    question: 'Việc tăng số lần đo (n) trong một bài thực hành mạch điện có tác dụng lý thuyết như thế nào đối với việc xử lý sai số?',
    options: [
      { id: 'a', text: 'Làm giảm đồng thời cả sai số ngẫu nhiên lẫn sai số hệ thống của dụng cụ.', isCorrect: false },
      { id: 'b', text: 'Làm giảm sai số ngẫu nhiên trung bình (sai số chuẩn), nhưng giữ nguyên sai số dụng cụ.', isCorrect: true },
      { id: 'c', text: 'Làm tăng sai số hệ thống do thiết bị hoạt động quá tải.', isCorrect: false },
      { id: 'd', text: 'Không có giá trị cải thiện độ chính xác của phép đo.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'a4', topic: 'A', timeLimit: 30,
    question: 'Khái niệm "sai số dụng cụ" (sai số hệ thống tối đa do thiết bị) thường được xác định dựa trên quy ước lý thuyết nào đối với các thiết bị đo kim cơ học?',
    options: [
      { id: 'a', text: 'Phụ thuộc vào kích thước lớn hay nhỏ của màn hình hiển thị.', isCorrect: false },
      { id: 'b', text: 'Thường lấy bằng một độ chia nhỏ nhất hoặc một nửa độ chia nhỏ nhất tùy theo quy ước.', isCorrect: true },
      { id: 'c', text: 'Lấy bằng giá trị lớn nhất ghi trên thang đo.', isCorrect: false },
      { id: 'd', text: 'Thay đổi ngẫu nhiên theo thời gian bấm giờ của người đo.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'a5', topic: 'A', timeLimit: 30,
    question: 'Thế nào là "phép đo trực tiếp" và "phép đo gián tiếp" một đại lượng mạch điện?',
    options: [
      { id: 'a', text: 'Đo trực tiếp là đo bằng đồng hồ kim, đo gián tiếp là đo bằng đồng hồ số.', isCorrect: false },
      { id: 'b', text: 'Đo trực tiếp là đo trong mạch một chiều, đo gián tiếp là đo trong mạch xoay chiều.', isCorrect: false },
      { id: 'c', text: 'Đo trực tiếp là đọc kết quả từ thiết bị đo chuyên dụng, đo gián tiếp là tính toán thông qua công thức toán học từ các kết quả đo trực tiếp.', isCorrect: true },
      { id: 'd', text: 'Đo trực tiếp không có sai số, đo gián tiếp luôn có sai số rất lớn.', isCorrect: false },
    ],
    explanation: 'Đo I bằng ampe kế là đo trực tiếp; tính R = U/I là đo gián tiếp.',
  },
  {
    id: 'a6', topic: 'A', timeLimit: 30,
    question: 'Sai số hệ thống là loại sai số như thế nào?',
    options: [
      { id: 'a', text: 'Sai số xuất hiện thất thường, lúc lớn lúc nhỏ, không theo quy luật nào.', isCorrect: false },
      { id: 'b', text: 'Sai số có độ lớn và dấu gần như không đổi (hoặc biến đổi theo một quy luật xác định), lặp lại ở mọi lần đo.', isCorrect: true },
      { id: 'c', text: 'Sai số chỉ xuất hiện khi đo gián tiếp qua công thức.', isCorrect: false },
      { id: 'd', text: 'Sai số do người đo cộng trừ nhầm khi tính toán kết quả.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'a7', topic: 'A', timeLimit: 30,
    question: 'Trường hợp nào sau đây là nguyên nhân gây ra sai số hệ thống?',
    options: [
      { id: 'a', text: 'Tay người đo hơi run làm kim rung nhẹ khi đọc.', isCorrect: false },
      { id: 'b', text: 'Mỗi lần đọc, mắt lại đặt ở một góc nhìn khác nhau.', isCorrect: false },
      { id: 'c', text: 'Kim ampe kế chưa được chỉnh về vạch 0 nên mọi lần đo đều lệch dư 0,02 A.', isCorrect: true },
      { id: 'd', text: 'Nguồn điện dao động thất thường không theo quy luật.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'a8', topic: 'A', timeLimit: 30,
    question: 'Cách xử lý đúng để làm giảm sai số hệ thống do dụng cụ gây ra là gì?',
    options: [
      { id: 'a', text: 'Đo thật nhiều lần rồi lấy giá trị trung bình.', isCorrect: false },
      { id: 'b', text: 'Hiệu chỉnh dụng cụ (chỉnh kim về 0, chuẩn lại thang đo) hoặc trừ đi phần lệch đã biết.', isCorrect: true },
      { id: 'c', text: 'Loại bỏ những kết quả lệch nhiều so với giá trị trung bình.', isCorrect: false },
      { id: 'd', text: 'Không có cách nào, sai số hệ thống là ngẫu nhiên nên không xử lý được.', isCorrect: false },
    ],
    explanation: 'Lấy trung bình nhiều lần đo chỉ làm giảm sai số ngẫu nhiên, không giảm được sai số hệ thống.',
  },
  {
    id: 'a9', topic: 'A', timeLimit: 30,
    question: 'Sai số ngẫu nhiên có đặc điểm nào sau đây?',
    options: [
      { id: 'a', text: 'Luôn làm kết quả đo lớn hơn giá trị thật.', isCorrect: false },
      { id: 'b', text: 'Có thể làm kết quả lớn hơn hoặc nhỏ hơn giá trị thật và giảm dần khi tăng số lần đo.', isCorrect: true },
      { id: 'c', text: 'Luôn giữ nguyên độ lớn qua tất cả các lần đo.', isCorrect: false },
      { id: 'd', text: 'Chỉ xuất hiện ở đồng hồ hiện số, không có ở đồng hồ kim.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'a10', topic: 'A', timeLimit: 30,
    question: 'Đo cường độ dòng điện 3 lần được: I₁ = 0,50 A; I₂ = 0,53 A; I₃ = 0,56 A. Giá trị trung bình của phép đo là bao nhiêu?',
    options: [
      { id: 'a', text: '0,50 A', isCorrect: false },
      { id: 'b', text: '0,53 A', isCorrect: true },
      { id: 'c', text: '0,55 A', isCorrect: false },
      { id: 'd', text: '1,59 A', isCorrect: false },
    ],
    explanation: 'Ī = (0,50 + 0,53 + 0,56)/3 = 0,53 A.',
  },
  {
    id: 'a11', topic: 'A', timeLimit: 30,
    question: 'Với bộ số liệu I₁ = 0,50 A; I₂ = 0,53 A; I₃ = 0,56 A (Ī = 0,53 A), sai số tuyệt đối trung bình của phép đo là bao nhiêu?',
    options: [
      { id: 'a', text: '0,01 A', isCorrect: false },
      { id: 'b', text: '0,02 A', isCorrect: true },
      { id: 'c', text: '0,03 A', isCorrect: false },
      { id: 'd', text: '0,06 A', isCorrect: false },
    ],
    explanation: 'ΔĪ = (0,03 + 0 + 0,03)/3 = 0,02 A.',
  },
  {
    id: 'a12', topic: 'A', timeLimit: 30,
    question: 'Một phép đo cho kết quả U = 6,0 ± 0,1 V. Sai số tỉ đối của phép đo này xấp xỉ bằng bao nhiêu?',
    options: [
      { id: 'a', text: '0,6 %', isCorrect: false },
      { id: 'b', text: '1,7 %', isCorrect: true },
      { id: 'c', text: '6,0 %', isCorrect: false },
      { id: 'd', text: '16,7 %', isCorrect: false },
    ],
    explanation: 'δU = ΔU/Ū × 100 % = 0,1/6,0 × 100 % ≈ 1,7 %.',
  },
  {
    id: 'a13', topic: 'A', timeLimit: 30,
    question: 'Đo gián tiếp điện trở bằng công thức R = U/I, biết sai số tỉ đối δU = 2 % và δI = 3 %. Sai số tỉ đối của R bằng bao nhiêu?',
    options: [
      { id: 'a', text: '1 %', isCorrect: false },
      { id: 'b', text: '1,5 %', isCorrect: false },
      { id: 'c', text: '5 %', isCorrect: true },
      { id: 'd', text: '6 %', isCorrect: false },
    ],
    explanation: 'Với phép nhân/chia, các sai số tỉ đối cộng lại: δR = δU + δI = 5 %.',
  },
  {
    id: 'a14', topic: 'A', timeLimit: 30,
    question: 'Với đại lượng được tính bằng tổng hoặc hiệu X = A ± B, sai số tuyệt đối của X được tính như thế nào?',
    options: [
      { id: 'a', text: 'ΔX = ΔA − ΔB', isCorrect: false },
      { id: 'b', text: 'ΔX = ΔA + ΔB', isCorrect: true },
      { id: 'c', text: 'ΔX = ΔA × ΔB', isCorrect: false },
      { id: 'd', text: 'ΔX = (ΔA + ΔB)/2', isCorrect: false },
    ],
    explanation: 'Sai số tuyệt đối luôn cộng lại, kể cả khi công thức là phép trừ.',
  },
  {
    id: 'a15', topic: 'A', timeLimit: 30,
    question: 'Một ampe kế có ĐCNN là 0,02 A, quy ước lấy sai số dụng cụ bằng một ĐCNN. Kim dừng đúng vạch 0,40 A và bỏ qua sai số ngẫu nhiên. Kết quả đo được ghi là',
    options: [
      { id: 'a', text: 'I = 0,40 ± 0,01 A', isCorrect: false },
      { id: 'b', text: 'I = 0,40 ± 0,02 A', isCorrect: true },
      { id: 'c', text: 'I = 0,4 ± 0,2 A', isCorrect: false },
      { id: 'd', text: 'I = 0,40 A (phép đo không có sai số)', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'a16', topic: 'A', timeLimit: 30,
    question: 'Cách ghi kết quả nào sau đây đúng quy tắc (sai số làm tròn tới 1 chữ số có nghĩa, giá trị trung bình lấy cùng bậc thập phân với sai số)?',
    options: [
      { id: 'a', text: 'R = 12,3456 ± 0,2 Ω', isCorrect: false },
      { id: 'b', text: 'R = 12,3 ± 0,2 Ω', isCorrect: true },
      { id: 'c', text: 'R = 12,3 ± 0,15678 Ω', isCorrect: false },
      { id: 'd', text: 'R = 12 ± 0,25 Ω', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'a17', topic: 'A', timeLimit: 30,
    question: 'Kết quả một phép đo được viết dưới dạng A = Ā ± ΔA. Cách viết này có ý nghĩa gì?',
    options: [
      { id: 'a', text: 'Giá trị thật của đại lượng chắc chắn bằng đúng Ā.', isCorrect: false },
      { id: 'b', text: 'Giá trị thật của đại lượng nằm trong khoảng từ Ā − ΔA đến Ā + ΔA.', isCorrect: true },
      { id: 'c', text: 'Phép đo đã bị sai và cần đo lại từ đầu.', isCorrect: false },
      { id: 'd', text: 'ΔA là phần dư thừa cần bỏ đi khi tính toán.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'a18', topic: 'A', timeLimit: 30,
    question: 'Có hai phép đo: chiều dài l = 100,0 ± 0,5 cm và hiệu điện thế U = 2,0 ± 0,1 V. Phép đo nào chính xác hơn?',
    options: [
      { id: 'a', text: 'Phép đo U, vì sai số tuyệt đối nhỏ hơn (0,1 \\< 0,5).', isCorrect: false },
      { id: 'b', text: 'Phép đo l, vì sai số tỉ đối nhỏ hơn (0,5 % \\< 5 %).', isCorrect: true },
      { id: 'c', text: 'Hai phép đo chính xác như nhau.', isCorrect: false },
      { id: 'd', text: 'Không so sánh được vì hai đại lượng khác đơn vị.', isCorrect: false },
    ],
    explanation: 'Muốn so sánh độ chính xác của hai phép đo khác đơn vị, phải dùng sai số tỉ đối.',
  },
  {
    id: 'b1', topic: 'B', timeLimit: 30,
    question: 'Trong mạch điện thực hành, người ta thường mắc thêm một biến trở. Vai trò vật lý chủ yếu của biến trở là gì?',
    options: [
      { id: 'a', text: 'Cung cấp thêm năng lượng cho mạch điện.', isCorrect: false },
      { id: 'b', text: 'Thay đổi điện trở của mạch để điều chỉnh cường độ dòng điện hoặc điện áp.', isCorrect: true },
      { id: 'c', text: 'Tự động ngắt mạch khi dòng điện vượt quá giới hạn.', isCorrect: false },
      { id: 'd', text: 'Biến đổi dòng điện xoay chiều thành một chiều.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'b2', topic: 'B', timeLimit: 30,
    question: 'Chiều dòng điện theo quy ước trong sơ đồ mạch điện được xác định như thế nào?',
    options: [
      { id: 'a', text: 'Từ cực dương của nguồn điện, qua dây dẫn và thiết bị điện, tới cực âm của nguồn điện.', isCorrect: true },
      { id: 'b', text: 'Từ cực âm của nguồn điện, qua dây dẫn, tới cực dương.', isCorrect: false },
      { id: 'c', text: 'Luôn đi theo chiều chuyển động của các electron tự do.', isCorrect: false },
      { id: 'd', text: 'Từ nơi có điện thế thấp đến nơi có điện thế cao.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'b3', topic: 'B', timeLimit: 30,
    question: 'Khi ta mắc nối tiếp thêm các bóng đèn vào một mạch điện đang sáng (giữ nguyên nguồn điện), độ sáng của các bóng đèn cũ sẽ thay đổi như thế nào?',
    options: [
      { id: 'a', text: 'Sáng mạnh hơn.', isCorrect: false },
      { id: 'b', text: 'Sáng yếu đi.', isCorrect: true },
      { id: 'c', text: 'Giữ nguyên độ sáng.', isCorrect: false },
      { id: 'd', text: 'Nhấp nháy liên tục.', isCorrect: false },
    ],
    explanation: 'Điện trở toàn mạch tăng nên cường độ dòng điện giảm.',
  },
  {
    id: 'b4', topic: 'B', timeLimit: 30,
    question: 'Trên nhãn của một bóng đèn sợi đốt có ghi thông số "220V – 60W". Thông số 220V mang ý nghĩa vật lý gì?',
    options: [
      { id: 'a', text: 'Hiệu điện thế tối thiểu để đèn có thể phát sáng.', isCorrect: false },
      { id: 'b', text: 'Hiệu điện thế tối đa mà đèn chịu được trước khi nổ.', isCorrect: false },
      { id: 'c', text: 'Hiệu điện thế định mức để bóng đèn hoạt động bình thường và đạt công suất 60W.', isCorrect: true },
      { id: 'd', text: 'Hiệu điện thế do bóng đèn tự tạo ra.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'b5', topic: 'B', timeLimit: 30,
    question: 'Điện trở của một vật dẫn đặc trưng cho tính chất nào và có đơn vị là gì?',
    options: [
      { id: 'a', text: 'Đặc trưng cho khả năng tích điện của vật dẫn, đơn vị là vôn (V).', isCorrect: false },
      { id: 'b', text: 'Đặc trưng cho mức độ cản trở dòng điện của vật dẫn, đơn vị là ôm (Ω).', isCorrect: true },
      { id: 'c', text: 'Đặc trưng cho lượng điện năng vật dẫn sinh ra, đơn vị là oát (W).', isCorrect: false },
      { id: 'd', text: 'Đặc trưng cho tốc độ của các electron, đơn vị là ampe (A).', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'b6', topic: 'B', timeLimit: 30,
    question: 'Biểu thức nào sau đây là biểu thức của định luật Ôm cho đoạn mạch chỉ chứa điện trở?',
    options: [
      { id: 'a', text: 'I = U · R', isCorrect: false },
      { id: 'b', text: 'I = U/R', isCorrect: true },
      { id: 'c', text: 'I = R/U', isCorrect: false },
      { id: 'd', text: 'U = I/R', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'b7', topic: 'B', timeLimit: 30,
    question: 'Đặt hiệu điện thế U = 6 V vào hai đầu một điện trở thì dòng điện qua nó là I = 0,5 A. Giá trị của điện trở đó là',
    options: [
      { id: 'a', text: '3 Ω', isCorrect: false },
      { id: 'b', text: '6 Ω', isCorrect: false },
      { id: 'c', text: '12 Ω', isCorrect: true },
      { id: 'd', text: '0,08 Ω', isCorrect: false },
    ],
    explanation: 'R = U/I = 6/0,5 = 12 Ω.',
  },
  {
    id: 'b8', topic: 'B', timeLimit: 30,
    question: 'Mắc nối tiếp hai điện trở R₁ = 10 Ω và R₂ = 20 Ω. Điện trở tương đương của đoạn mạch bằng',
    options: [
      { id: 'a', text: '6,7 Ω', isCorrect: false },
      { id: 'b', text: '10 Ω', isCorrect: false },
      { id: 'c', text: '20 Ω', isCorrect: false },
      { id: 'd', text: '30 Ω', isCorrect: true },
    ],
    explanation: 'Nối tiếp: R = R₁ + R₂ = 30 Ω.',
  },
  {
    id: 'b9', topic: 'B', timeLimit: 30,
    question: 'Mắc song song hai điện trở giống nhau, mỗi cái 10 Ω. Điện trở tương đương của đoạn mạch bằng',
    options: [
      { id: 'a', text: '5 Ω', isCorrect: true },
      { id: 'b', text: '10 Ω', isCorrect: false },
      { id: 'c', text: '20 Ω', isCorrect: false },
      { id: 'd', text: '100 Ω', isCorrect: false },
    ],
    explanation: '1/R = 1/10 + 1/10 → R = 5 Ω. Ghép song song luôn cho điện trở nhỏ hơn từng điện trở thành phần.',
  },
  {
    id: 'b10', topic: 'B', timeLimit: 30,
    question: 'Trong đoạn mạch gồm các điện trở mắc nối tiếp, phát biểu nào sau đây là đúng?',
    options: [
      { id: 'a', text: 'Hiệu điện thế trên mỗi điện trở đều bằng nhau.', isCorrect: false },
      { id: 'b', text: 'Cường độ dòng điện qua mỗi điện trở đều bằng nhau, hiệu điện thế chia theo tỉ lệ với điện trở.', isCorrect: true },
      { id: 'c', text: 'Cường độ dòng điện chia đôi khi đi qua mỗi điện trở.', isCorrect: false },
      { id: 'd', text: 'Điện trở tương đương nhỏ hơn điện trở nhỏ nhất trong mạch.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'b11', topic: 'B', timeLimit: 30,
    question: 'Trong đoạn mạch gồm các điện trở mắc song song, đại lượng nào bằng nhau trên mọi nhánh?',
    options: [
      { id: 'a', text: 'Cường độ dòng điện.', isCorrect: false },
      { id: 'b', text: 'Hiệu điện thế.', isCorrect: true },
      { id: 'c', text: 'Công suất tiêu thụ.', isCorrect: false },
      { id: 'd', text: 'Điện trở của mỗi nhánh.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'b12', topic: 'B', timeLimit: 30,
    question: 'Hai dây dẫn cùng chất, cùng tiết diện, dây thứ hai dài gấp đôi dây thứ nhất. So với dây thứ nhất, điện trở của dây thứ hai',
    options: [
      { id: 'a', text: 'giảm một nửa.', isCorrect: false },
      { id: 'b', text: 'không đổi.', isCorrect: false },
      { id: 'c', text: 'tăng gấp đôi.', isCorrect: true },
      { id: 'd', text: 'tăng gấp bốn lần.', isCorrect: false },
    ],
    explanation: 'R = ρ·l/S, điện trở tỉ lệ thuận với chiều dài.',
  },
  {
    id: 'b13', topic: 'B', timeLimit: 30,
    question: 'Trong công thức R = ρ·l/S, đại lượng điện trở suất ρ cho biết điều gì?',
    options: [
      { id: 'a', text: 'Cho biết chiều dài tối đa của dây dẫn.', isCorrect: false },
      { id: 'b', text: 'Đặc trưng cho bản chất vật liệu làm dây dẫn; ρ càng nhỏ thì vật liệu dẫn điện càng tốt.', isCorrect: true },
      { id: 'c', text: 'Cho biết tiết diện của dây dẫn.', isCorrect: false },
      { id: 'd', text: 'Đặc trưng cho hiệu điện thế đặt vào hai đầu dây.', isCorrect: false },
    ],
    explanation: 'Đồng có ρ nhỏ hơn nikelin nên đồng được dùng làm dây nối, nikelin dùng làm dây điện trở.',
  },
  {
    id: 'b14', topic: 'B', timeLimit: 30,
    question: 'Khi nhiệt độ của một dây dẫn kim loại tăng lên thì điện trở của nó thay đổi thế nào?',
    options: [
      { id: 'a', text: 'Tăng lên.', isCorrect: true },
      { id: 'b', text: 'Giảm xuống.', isCorrect: false },
      { id: 'c', text: 'Không thay đổi.', isCorrect: false },
      { id: 'd', text: 'Giảm rồi lại tăng.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'b15', topic: 'B', timeLimit: 30,
    question: 'Đồ thị biểu diễn sự phụ thuộc của cường độ dòng điện I vào hiệu điện thế U của một điện trở là đường thẳng đi qua gốc tọa độ. Điều đó chứng tỏ',
    options: [
      { id: 'a', text: 'điện trở giảm dần khi tăng hiệu điện thế.', isCorrect: false },
      { id: 'b', text: 'cường độ dòng điện tỉ lệ thuận với hiệu điện thế, điện trở của vật dẫn không đổi.', isCorrect: true },
      { id: 'c', text: 'cường độ dòng điện tỉ lệ nghịch với hiệu điện thế.', isCorrect: false },
      { id: 'd', text: 'phép đo đã mắc sai số hệ thống.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'b16', topic: 'B', timeLimit: 30,
    question: 'Bóng đèn ghi "220V – 60W" hoạt động bình thường. Cường độ dòng điện qua đèn xấp xỉ bằng bao nhiêu?',
    options: [
      { id: 'a', text: '0,27 A', isCorrect: true },
      { id: 'b', text: '3,67 A', isCorrect: false },
      { id: 'c', text: '60 A', isCorrect: false },
      { id: 'd', text: '13 200 A', isCorrect: false },
    ],
    explanation: 'P = U·I → I = P/U = 60/220 ≈ 0,27 A.',
  },
  {
    id: 'c1', topic: 'C', timeLimit: 30,
    question: 'Cho thiết bị đo như hình vẽ, đây là dụng cụ gì?',
    options: [
      { id: 'a', text: 'Ampe kế.', isCorrect: true },
      { id: 'b', text: 'Vôn kế.', isCorrect: false },
      { id: 'c', text: 'Cân.', isCorrect: false },
      { id: 'd', text: 'Đồng hồ để bàn.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c2', topic: 'C', timeLimit: 30,
    question: 'Cho thiết bị đo như hình vẽ, giới hạn đo (GHĐ) và độ chia nhỏ nhất (ĐCNN) của dụng cụ là',
    options: [
      { id: 'a', text: '1 A và 0,2 A.', isCorrect: false },
      { id: 'b', text: '1 A và 0,02 A.', isCorrect: true },
      { id: 'c', text: '85 A và 2,51 A.', isCorrect: false },
      { id: 'd', text: '85 A và 1 A.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c3', topic: 'C', timeLimit: 30,
    question: 'Một ampe kế có các vạch chia chính lần lượt là 0; 0,2; 0,4; 0,6; 0,8 và vạch cuối cùng là 1 A. Giới hạn đo (GHĐ) của dụng cụ này là bao nhiêu?',
    options: [
      { id: 'a', text: '0,8 A', isCorrect: false },
      { id: 'b', text: '1 A', isCorrect: true },
      { id: 'c', text: '5 A', isCorrect: false },
      { id: 'd', text: '0,2 A', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c4', topic: 'C', timeLimit: 30,
    question: 'Tại sao ampe kế luôn phải được mắc nối tiếp với đoạn mạch hoặc linh kiện cần đo cường độ dòng điện?',
    options: [
      { id: 'a', text: 'Để dòng điện đi qua ampe kế nhỏ hơn dòng điện thực tế của mạch.', isCorrect: false },
      { id: 'b', text: 'Để toàn bộ dòng điện chạy qua linh kiện đều phải đi qua ampe kế.', isCorrect: true },
      { id: 'c', text: 'Để ampe kế không tiêu thụ điện năng của nguồn.', isCorrect: false },
      { id: 'd', text: 'Để ampe kế chịu cùng một hiệu điện thế với linh kiện đó.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c5', topic: 'C', timeLimit: 30,
    question: 'Điều gì sẽ xảy ra đối với mạch điện nếu một học sinh sơ ý mắc ampe kế song song với một bóng đèn đang sáng?',
    options: [
      { id: 'a', text: 'Bóng đèn sẽ sáng mạnh hơn bình thường.', isCorrect: false },
      { id: 'b', text: 'Ampe kế sẽ đo được chính xác dòng điện của bóng đèn.', isCorrect: false },
      { id: 'c', text: 'Xảy ra hiện tượng đoản mạch, bóng đèn tắt và ampe kế có nguy cơ bị hỏng.', isCorrect: true },
      { id: 'd', text: 'Chiều dòng điện trong mạch bị đảo ngược.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c6', topic: 'C', timeLimit: 30,
    question: 'Trên mặt một số ampe kế cơ học (dùng kim chỉ) thường có in ký hiệu dấu ngã (\\~) hoặc dấu gạch ngang (–). Ý nghĩa của những ký hiệu này là gì?',
    options: [
      { id: 'a', text: 'Thể hiện giới hạn đo của thiết bị.', isCorrect: false },
      { id: 'b', text: 'Cho biết thiết bị dùng cho dòng điện xoay chiều (AC) hay một chiều (DC).', isCorrect: true },
      { id: 'c', text: 'Ký hiệu nhà sản xuất thiết bị.', isCorrect: false },
      { id: 'd', text: 'Cảnh báo thiết bị dễ bị chập cháy.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c7', topic: 'C', timeLimit: 30,
    question: 'Khi cần đo cường độ của một dòng điện mà bạn hoàn toàn chưa biết trước giá trị ước lượng của nó, nguyên tắc an toàn đầu tiên khi chọn thang đo (giới hạn đo) trên ampe kế là gì?',
    options: [
      { id: 'a', text: 'Chọn thang đo nhỏ nhất để có độ chính xác cao nhất.', isCorrect: false },
      { id: 'b', text: 'Chọn thang đo ở mức trung bình.', isCorrect: false },
      { id: 'c', text: 'Chọn thang đo lớn nhất hiện có, sau đó hạ dần xuống nếu cần.', isCorrect: true },
      { id: 'd', text: 'Thử đo nhanh bằng bất kỳ thang đo nào trong 1 giây.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c8', topic: 'C', timeLimit: 30,
    question: 'Trên mặt đồng hồ của các dụng cụ đo điện cơ học bằng kim thường có một con ốc nhựa nhỏ màu đen nằm ngay dưới gốc kim chỉ thị. Chức năng của ốc này là gì?',
    options: [
      { id: 'a', text: 'Dùng để tháo mặt kính của đồng hồ.', isCorrect: false },
      { id: 'b', text: 'Điều chỉnh giới hạn đo của thiết bị.', isCorrect: false },
      { id: 'c', text: 'Thay đổi từ đo dòng điện một chiều sang xoay chiều.', isCorrect: false },
      { id: 'd', text: 'Điều chỉnh điểm 0 để chỉnh kim về đúng vạch số 0 trước khi đo.', isCorrect: true },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c9', topic: 'C', timeLimit: 30,
    question: 'Sự khác biệt lớn nhất về mặt tiện dụng giữa Aptomat và Cầu chì truyền thống trong việc bảo vệ mạch điện là gì?',
    options: [
      { id: 'a', text: 'Aptomat ngắt điện nhanh hơn cầu chì.', isCorrect: false },
      { id: 'b', text: 'Aptomat có thể bảo vệ chống sét, cầu chì thì không.', isCorrect: false },
      { id: 'c', text: 'Aptomat có thể đóng lại để sử dụng tiếp sau khi khắc phục sự cố, còn cầu chì bị đứt phải thay dây mới.', isCorrect: true },
      { id: 'd', text: 'Aptomat không có điện trở, cầu chì có điện trở.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c10', topic: 'C', timeLimit: 30,
    question: 'Muốn đo hiệu điện thế giữa hai đầu một bóng đèn, phải mắc vôn kế như thế nào?',
    options: [
      { id: 'a', text: 'Mắc nối tiếp với bóng đèn.', isCorrect: false },
      { id: 'b', text: 'Mắc song song với bóng đèn.', isCorrect: true },
      { id: 'c', text: 'Mắc nối tiếp với nguồn điện.', isCorrect: false },
      { id: 'd', text: 'Mắc trực tiếp vào hai cực của nguồn khi đã tháo bóng đèn ra.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c11', topic: 'C', timeLimit: 30,
    question: 'Vì sao vôn kế cần có điện trở trong rất lớn?',
    options: [
      { id: 'a', text: 'Để dòng điện rẽ qua vôn kế là rất nhỏ, hầu như không làm thay đổi mạch cần đo.', isCorrect: true },
      { id: 'b', text: 'Để vôn kế đo được cả dòng xoay chiều lẫn một chiều.', isCorrect: false },
      { id: 'c', text: 'Để kim vôn kế quay chậm hơn cho dễ đọc.', isCorrect: false },
      { id: 'd', text: 'Để vôn kế tiêu thụ nhiều điện năng, giúp số đo lớn hơn.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c12', topic: 'C', timeLimit: 30,
    question: 'Một ampe kế lý tưởng có điện trở trong bằng bao nhiêu?',
    options: [
      { id: 'a', text: 'Rất lớn (coi như vô cùng).', isCorrect: false },
      { id: 'b', text: 'Bằng không.', isCorrect: true },
      { id: 'c', text: 'Bằng điện trở của mạch.', isCorrect: false },
      { id: 'd', text: 'Bằng đúng giới hạn đo của nó.', isCorrect: false },
    ],
    explanation: 'Vì mắc nối tiếp nên điện trở ampe kế phải rất nhỏ để không làm giảm dòng điện cần đo.',
  },
  {
    id: 'c13', topic: 'C', timeLimit: 30,
    question: 'Khi mắc ampe kế một chiều vào mạch, chốt (+) của ampe kế phải được nối như thế nào?',
    options: [
      { id: 'a', text: 'Nối về phía cực âm của nguồn điện.', isCorrect: false },
      { id: 'b', text: 'Nối về phía cực dương của nguồn điện.', isCorrect: true },
      { id: 'c', text: 'Nối tùy ý, không ảnh hưởng gì.', isCorrect: false },
      { id: 'd', text: 'Nối xuống đất để chống giật.', isCorrect: false },
    ],
    explanation: 'Mắc ngược cực thì kim quay ngược về phía trái vạch 0 và có thể làm cong kim, hỏng máy.',
  },
  {
    id: 'c14', topic: 'C', timeLimit: 30,
    question: 'Trước khi dùng đồng hồ vạn năng để đo điện trở của một linh kiện, ta phải làm gì?',
    options: [
      { id: 'a', text: 'Giữ nguyên mạch đang có điện rồi vặn về thang Ω để đo cho nhanh.', isCorrect: false },
      { id: 'b', text: 'Ngắt nguồn điện, tháo linh kiện ra khỏi mạch rồi mới vặn về thang đo Ω.', isCorrect: true },
      { id: 'c', text: 'Tăng hiệu điện thế của nguồn lên mức lớn nhất.', isCorrect: false },
      { id: 'd', text: 'Nhúng đầu que đo vào nước để tiếp xúc tốt hơn.', isCorrect: false },
    ],
    explanation: 'Đo điện trở khi mạch còn nguồn sẽ làm sai kết quả và có thể cháy đồng hồ.',
  },
  {
    id: 'c15', topic: 'C', timeLimit: 30,
    question: 'Khi đang đo, màn hình đồng hồ vạn năng hiện số "1" ở góc trái (hoặc chữ "OL"). Điều đó có nghĩa là gì?',
    options: [
      { id: 'a', text: 'Giá trị cần đo đúng bằng 1 đơn vị.', isCorrect: false },
      { id: 'b', text: 'Giá trị cần đo vượt quá thang đo đang chọn, cần chuyển sang thang đo lớn hơn.', isCorrect: true },
      { id: 'c', text: 'Đồng hồ đã hết pin.', isCorrect: false },
      { id: 'd', text: 'Mạch điện đang bị đoản mạch.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c16', topic: 'C', timeLimit: 30,
    question: 'Trên đồng hồ vạn năng, muốn đo hiệu điện thế của một viên pin thì phải vặn núm chọn sang vùng ký hiệu nào?',
    options: [
      { id: 'a', text: 'DCA', isCorrect: false },
      { id: 'b', text: 'DCV', isCorrect: true },
      { id: 'c', text: 'ACV', isCorrect: false },
      { id: 'd', text: 'Ω', isCorrect: false },
    ],
    explanation: 'DCV: hiệu điện thế một chiều; DCA: cường độ dòng điện một chiều; ACV: hiệu điện thế xoay chiều; Ω: điện trở.',
  },
  {
    id: 'c17', topic: 'C', timeLimit: 30,
    question: 'Vai trò của khóa K (công tắc) trong mạch điện thực hành là gì?',
    options: [
      { id: 'a', text: 'Làm tăng cường độ dòng điện trong mạch.', isCorrect: false },
      { id: 'b', text: 'Đóng hoặc ngắt mạch điện, chỉ được đóng khi đã kiểm tra xong toàn bộ sơ đồ.', isCorrect: true },
      { id: 'c', text: 'Đo hiệu điện thế giữa hai điểm của mạch.', isCorrect: false },
      { id: 'd', text: 'Chuyển dòng điện xoay chiều thành một chiều.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c18', topic: 'C', timeLimit: 30,
    question: 'Ưu điểm chính của việc lắp mạch trên bảng cắm (breadboard) so với hàn trực tiếp các linh kiện là gì?',
    options: [
      { id: 'a', text: 'Mạch chạy khỏe hơn vì điện trở tiếp xúc bằng không.', isCorrect: false },
      { id: 'b', text: 'Lắp và tháo nhanh, sửa sai dễ dàng, linh kiện dùng lại được nhiều lần và an toàn cho học sinh.', isCorrect: true },
      { id: 'c', text: 'Không cần nguồn điện vẫn có dòng điện chạy trong mạch.', isCorrect: false },
      { id: 'd', text: 'Có thể bỏ qua bước vẽ sơ đồ mạch điện.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c19', topic: 'C', timeLimit: 30,
    question: 'Vì sao dây nối trong bộ dụng cụ thí nghiệm điện luôn có vỏ nhựa bọc ngoài và hai đầu là chốt cắm?',
    options: [
      { id: 'a', text: 'Để dây dẫn điện tốt hơn lõi kim loại trần.', isCorrect: false },
      { id: 'b', text: 'Để cách điện an toàn cho người dùng và tạo tiếp xúc chắc chắn, tránh chập mạch.', isCorrect: true },
      { id: 'c', text: 'Để làm tăng điện trở của dây dẫn.', isCorrect: false },
      { id: 'd', text: 'Chỉ để phân biệt màu sắc cho đẹp.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c20', topic: 'C', timeLimit: 30,
    question: 'Vì sao tuyệt đối không được dùng dây dẫn nối trực tiếp hai cực của nguồn điện?',
    options: [
      { id: 'a', text: 'Vì nguồn sẽ không phát ra dòng điện nào cả.', isCorrect: false },
      { id: 'b', text: 'Vì điện trở mạch ngoài gần bằng 0 nên dòng điện rất lớn, gây đoản mạch, làm nóng dây và hỏng nguồn.', isCorrect: true },
      { id: 'c', text: 'Vì dòng điện sẽ đổi chiều liên tục.', isCorrect: false },
      { id: 'd', text: 'Vì hiệu điện thế của nguồn sẽ tăng lên gấp đôi.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c21', topic: 'C', timeLimit: 30,
    question: 'Khi lắp đèn LED vào mạch điện thực hành, cần lưu ý điều gì?',
    options: [
      { id: 'a', text: 'LED lắp chiều nào cũng sáng như nhau.', isCorrect: false },
      { id: 'b', text: 'LED có phân cực (chân dài là cực dương) và cần mắc nối tiếp một điện trở hạn dòng.', isCorrect: true },
      { id: 'c', text: 'LED phải được mắc song song trực tiếp với hai cực nguồn để sáng nhất.', isCorrect: false },
      { id: 'd', text: 'LED chỉ hoạt động với dòng điện xoay chiều.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c22', topic: 'C', timeLimit: 30,
    question: 'Thiết bị trong hình là dụng cụ gì?',
    options: [
      { id: 'a', text: 'Vôn kế một chiều chuyên dụng.', isCorrect: false },
      { id: 'b', text: 'Đồng hồ vạn năng hiện số (đồng hồ đo điện đa năng).', isCorrect: true },
      { id: 'c', text: 'Ampe kìm dùng để đo dòng điện không cần cắt mạch.', isCorrect: false },
      { id: 'd', text: 'Máy biến áp hạ áp dùng trong phòng thí nghiệm.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c23', topic: 'C', timeLimit: 30,
    question: 'Núm xoay của đồng hồ trong hình đang đặt ở vị trí nào và dùng để đo đại lượng gì?',
    options: [
      { id: 'a', text: 'Thang 20 A một chiều, dùng để đo cường độ dòng điện.', isCorrect: false },
      { id: 'b', text: 'Thang 20 V một chiều (DCV), dùng để đo hiệu điện thế một chiều.', isCorrect: true },
      { id: 'c', text: 'Thang 20 V xoay chiều (ACV), dùng để đo hiệu điện thế xoay chiều.', isCorrect: false },
      { id: 'd', text: 'Thang 20 Ω, dùng để đo điện trở.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c24', topic: 'C', timeLimit: 30,
    question: 'Với vị trí núm xoay như trong hình, số hiển thị trên màn hình cho kết quả đo là bao nhiêu?',
    options: [
      { id: 'a', text: '9,55 A', isCorrect: false },
      { id: 'b', text: '9,55 V', isCorrect: true },
      { id: 'c', text: '9,55 Ω', isCorrect: false },
      { id: 'd', text: '9,55 mV', isCorrect: false },
    ],
    explanation: 'Núm đang ở vùng DCV nên đơn vị của số đo là vôn; thang 20 V cho phép đọc tới hai chữ số thập phân.',
  },
  {
    id: 'c25', topic: 'C', timeLimit: 30,
    question: 'Núm xoay đang ở thang 200 Ω và màn hình hiện "OL" (một số đồng hồ hiện số "1" ở góc trái). Điều đó có nghĩa là gì?',
    options: [
      { id: 'a', text: 'Điện trở cần đo đúng bằng 1 Ω.', isCorrect: false },
      { id: 'b', text: 'Giá trị cần đo vượt quá thang 200 Ω (hoặc mạch đang hở); phải chuyển sang thang đo lớn hơn.', isCorrect: true },
      { id: 'c', text: 'Đồng hồ hết pin, cần thay pin mới.', isCorrect: false },
      { id: 'd', text: 'Hai que đo đang bị chập vào nhau.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c26', topic: 'C', timeLimit: 30,
    question: 'Quan sát các cổng cắm que đo trong hình. Que đo màu đen luôn phải được cắm vào cổng nào?',
    options: [
      { id: 'a', text: 'Cổng 10A', isCorrect: false },
      { id: 'b', text: 'Cổng VΩmA', isCorrect: false },
      { id: 'c', text: 'Cổng COM', isCorrect: true },
      { id: 'd', text: 'Cổng nào cũng được, không quan trọng', isCorrect: false },
    ],
    explanation: 'COM (common) là cổng chung, luôn dành cho que đen; que đỏ mới đổi cổng theo đại lượng cần đo.',
  },
  {
    id: 'c27', topic: 'C', timeLimit: 30,
    question: 'Muốn đo một dòng điện khoảng 5 A, que đo màu đỏ phải được cắm vào cổng nào trong hình?',
    options: [
      { id: 'a', text: 'Cổng COM', isCorrect: false },
      { id: 'b', text: 'Cổng VΩmA', isCorrect: false },
      { id: 'c', text: 'Cổng 10A', isCorrect: true },
      { id: 'd', text: 'Cắm cổng nào cũng đo được', isCorrect: false },
    ],
    explanation: 'Cổng VΩmA chỉ chịu tối đa 200 mA; cắm nhầm sẽ làm đứt cầu chì bên trong đồng hồ.',
  },
  {
    id: 'c28', topic: 'C', timeLimit: 30,
    question: 'Vôn kế trong hình có độ chia nhỏ nhất (ĐCNN) là bao nhiêu và kim đang chỉ giá trị nào?',
    options: [
      { id: 'a', text: 'ĐCNN 0,2 V; kim chỉ 6,0 V', isCorrect: true },
      { id: 'b', text: 'ĐCNN 2 V; kim chỉ 6,0 V', isCorrect: false },
      { id: 'c', text: 'ĐCNN 0,2 V; kim chỉ 3,0 V', isCorrect: false },
      { id: 'd', text: 'ĐCNN 1 V; kim chỉ 6,0 V', isCorrect: false },
    ],
    explanation: 'Giữa hai vạch số liền nhau (cách nhau 2 V) có 10 khoảng nhỏ, nên ĐCNN = 2/10 = 0,2 V.',
  },
  {
    id: 'c29', topic: 'C', timeLimit: 30,
    question: 'Cho ampe kế như hình vẽ. Giới hạn đo, độ chia nhỏ nhất và số chỉ của kim lần lượt là',
    options: [
      { id: 'a', text: '3 A; 0,5 A; 1,5 A', isCorrect: false },
      { id: 'b', text: '3 A; 0,1 A; 1,4 A', isCorrect: true },
      { id: 'c', text: '1,5 A; 0,1 A; 1,4 A', isCorrect: false },
      { id: 'd', text: '3 A; 0,01 A; 1,40 A', isCorrect: false },
    ],
    explanation: 'Vạch lớn cách nhau 0,5 A và được chia thành 5 khoảng nhỏ → ĐCNN = 0,1 A.',
  },
  {
    id: 'c30', topic: 'C', timeLimit: 30,
    question: 'Điện trở trong hình có các vòng màu lần lượt là Nâu – Đen – Đỏ – Nhũ vàng. Giá trị của điện trở này là',
    options: [
      { id: 'a', text: '100 Ω ± 5 %', isCorrect: false },
      { id: 'b', text: '1 000 Ω (1 kΩ) ± 5 %', isCorrect: true },
      { id: 'c', text: '10 000 Ω ± 10 %', isCorrect: false },
      { id: 'd', text: '12 Ω ± 5 %', isCorrect: false },
    ],
    explanation: 'Nâu = 1, Đen = 0 → số 10; Đỏ = hệ số ×100 → 10 × 100 = 1 000 Ω; nhũ vàng là vòng sai số 5 %.',
  },
  {
    id: 'c31', topic: 'C', timeLimit: 30,
    question: 'Năm lỗ cắm được khoanh màu vàng trong hình (cột 7, các hàng A – E) có đặc điểm gì?',
    options: [
      { id: 'a', text: 'Chúng hoàn toàn cách điện với nhau.', isCorrect: false },
      { id: 'b', text: 'Chúng được nối thông với nhau bằng một thanh kim loại bên trong bảng, nên cắm hai chân linh kiện vào nhóm này là đã nối chúng với nhau.', isCorrect: true },
      { id: 'c', text: 'Chúng nối thông với toàn bộ hàng ngang từ cột 1 đến cột 12\\.', isCorrect: false },
      { id: 'd', text: 'Chúng chính là hai cực dương và âm của nguồn điện.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c32', topic: 'C', timeLimit: 30,
    question: 'Hai dải lỗ chạy dọc mép trên và mép dưới bảng cắm, có kèm vạch đỏ (+) và vạch xanh (–), được dùng để làm gì?',
    options: [
      { id: 'a', text: 'Chỉ để trang trí cho bảng dễ nhìn.', isCorrect: false },
      { id: 'b', text: 'Là hai đường cấp nguồn: các lỗ trên cùng một dải nối thông suốt chiều dài bảng, dùng để lấy cực dương và cực âm cho toàn mạch.', isCorrect: true },
      { id: 'c', text: 'Là nơi cắm que đo của đồng hồ vạn năng.', isCorrect: false },
      { id: 'd', text: 'Là các lỗ bắt vít để cố định bảng xuống bàn.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c33', topic: 'C', timeLimit: 30,
    question: 'Dụng cụ trong hình là gì và bộ phận con chạy có tác dụng gì?',
    options: [
      { id: 'a', text: 'Cầu chì; con chạy dùng để ngắt mạch khi quá tải.', isCorrect: false },
      { id: 'b', text: 'Biến trở con chạy; dịch chuyển con chạy làm thay đổi chiều dài phần dây có dòng điện chạy qua, do đó thay đổi điện trở của mạch.', isCorrect: true },
      { id: 'c', text: 'Máy biến áp; con chạy dùng để đổi hiệu điện thế đầu ra.', isCorrect: false },
      { id: 'd', text: 'Ampe kế; con chạy dùng để chỉnh kim về vạch 0\\.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c34', topic: 'C', timeLimit: 30,
    question: 'Sơ đồ mạch điện trong hình mắc sai ở chỗ nào?',
    options: [
      { id: 'a', text: 'Khóa K bị mắc nhầm vị trí, phải đặt sát cực âm của nguồn.', isCorrect: false },
      { id: 'b', text: 'Ampe kế đang được mắc song song với bóng đèn, trong khi đúng ra phải mắc nối tiếp.', isCorrect: true },
      { id: 'c', text: 'Nguồn điện bị mắc ngược cực dương – âm.', isCorrect: false },
      { id: 'd', text: 'Bóng đèn phải được mắc song song trực tiếp với hai cực của nguồn.', isCorrect: false },
    ],
    explanation: 'Mắc như hình sẽ gây đoản mạch qua ampe kế: đèn tắt và ampe kế có nguy cơ cháy.',
  },
  {
    id: 'c35', topic: 'C', timeLimit: 30,
    question: 'Ba chức năng cơ bản và hay dùng nhất của một chiếc đồng hồ vạn năng là gì?',
    options: [
      { id: 'a', text: 'Đo khối lượng, đo thể tích và đo nhiệt độ.', isCorrect: false },
      { id: 'b', text: 'Đo hiệu điện thế, đo cường độ dòng điện và đo điện trở.', isCorrect: true },
      { id: 'c', text: 'Tạo ra dòng điện, tích trữ điện năng và biến đổi điện áp.', isCorrect: false },
      { id: 'd', text: 'Đo công suất, đo thời gian và đo cường độ ánh sáng.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c36', topic: 'C', timeLimit: 30,
    question: 'Trên đồng hồ vạn năng, hai vùng thang đo DCV và ACV khác nhau ở điểm nào?',
    options: [
      { id: 'a', text: 'DCV đo hiệu điện thế một chiều (pin, bộ nguồn một chiều), còn ACV đo hiệu điện thế xoay chiều (ổ điện dân dụng).', isCorrect: true },
      { id: 'b', text: 'DCV dùng để đo điện trở, còn ACV dùng để đo cường độ dòng điện.', isCorrect: false },
      { id: 'c', text: 'DCV chỉ dùng cho thang đo nhỏ, ACV chỉ dùng cho thang đo lớn.', isCorrect: false },
      { id: 'd', text: 'Hai vùng này hoàn toàn giống nhau, chỉ khác màu chữ in trên mặt đồng hồ.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c37', topic: 'C', timeLimit: 30,
    question: 'Thao tác nào sau đây là nguy hiểm nhất khi sử dụng đồng hồ vạn năng?',
    options: [
      { id: 'a', text: 'Để núm xoay ở thang đo cường độ dòng điện (A) rồi cắm hai que đo song song vào hai cực của nguồn điện.', isCorrect: true },
      { id: 'b', text: 'Để núm xoay ở thang ACV lớn nhất khi chưa sử dụng đến.', isCorrect: false },
      { id: 'c', text: 'Cắm que đo màu đen vào cổng COM.', isCorrect: false },
      { id: 'd', text: 'Ngắt nguồn điện trước khi đo điện trở của linh kiện.', isCorrect: false },
    ],
    explanation: 'Ở thang đo dòng, điện trở trong của đồng hồ rất nhỏ nên mắc song song sẽ gây đoản mạch, làm đứt cầu chì hoặc cháy đồng hồ.',
  },
  {
    id: 'c38', topic: 'C', timeLimit: 30,
    question: 'Chức năng kiểm tra thông mạch (continuity, ký hiệu hình sóng âm thanh) trên đồng hồ vạn năng dùng để làm gì?',
    options: [
      { id: 'a', text: 'Đo chính xác giá trị điện trở của một dây dẫn dài.', isCorrect: false },
      { id: 'b', text: 'Kiểm tra nhanh xem một đoạn dây hay một mối nối có bị đứt hay không; nếu mạch còn thông, đồng hồ sẽ phát ra tiếng "bíp".', isCorrect: true },
      { id: 'c', text: 'Đo công suất tiêu thụ của thiết bị điện.', isCorrect: false },
      { id: 'd', text: 'Nạp điện trở lại cho pin đã hết.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c39', topic: 'C', timeLimit: 30,
    question: 'Trước khi đo điện trở, người ta thường chập hai đầu que đo vào nhau. Nếu đồng hồ chỉ giá trị xấp xỉ 0 Ω thì điều đó chứng tỏ gì?',
    options: [
      { id: 'a', text: 'Đồng hồ đã bị hỏng, không dùng được nữa.', isCorrect: false },
      { id: 'b', text: 'Que đo và đồng hồ hoạt động bình thường (điện trở của hai que đo không đáng kể), có thể tiến hành phép đo.', isCorrect: true },
      { id: 'c', text: 'Đang có một dòng điện rất lớn chạy qua đồng hồ.', isCorrect: false },
      { id: 'd', text: 'Cần chuyển ngay núm xoay sang vùng ACV.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
  {
    id: 'c40', topic: 'C', timeLimit: 30,
    question: 'Sau khi đo xong, nên đưa núm xoay của đồng hồ vạn năng về vị trí nào?',
    options: [
      { id: 'a', text: 'Giữ nguyên ở thang đo vừa sử dụng cho lần sau khỏi mất công.', isCorrect: false },
      { id: 'b', text: 'Vặn về vị trí OFF (hoặc thang ACV lớn nhất) và rút que đo ra khỏi mạch.', isCorrect: true },
      { id: 'c', text: 'Vặn về thang đo cường độ dòng điện nhỏ nhất.', isCorrect: false },
      { id: 'd', text: 'Vặn về thang đo điện trở nhỏ nhất.', isCorrect: false },
    ],
    explanation: 'Cách này tránh làm hỏng đồng hồ nếu lần sau lỡ tay đo nhầm đại lượng.',
  },
  {
    id: 'c41', topic: 'C', timeLimit: 30,
    question: 'So với đồng hồ vạn năng kim, ưu điểm chính của đồng hồ vạn năng hiện số là gì?',
    options: [
      { id: 'a', text: 'Đọc kết quả trực tiếp bằng chữ số nên hạn chế được sai số do đặt mắt lệch góc nhìn khi đọc kim.', isCorrect: true },
      { id: 'b', text: 'Kết quả đo hoàn toàn không còn sai số.', isCorrect: false },
      { id: 'c', text: 'Không cần phải chọn thang đo trước khi đo.', isCorrect: false },
      { id: 'd', text: 'Đo được thêm cả khối lượng và nhiệt độ của vật.', isCorrect: false },
    ],
    explanation: 'Xem lại phần lý thuyết tương ứng để nắm rõ hơn kiến thức này.',
  },
];

/** Lấy ngẫu nhiên n câu, có thể lọc theo chủ đề */
export const pickQuestions = (n: number, topic?: string) => {
  const pool = topic ? QUIZ_BANK.filter((q) => q.topic === topic) : QUIZ_BANK;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
};
