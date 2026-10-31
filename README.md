# ModuLab

Trợ lí số giờ thực hành Vật Lí cấp trung học phổ thông — phần điện học.

Học sinh lắp mạch trên máy, phần mềm soát cách đấu nối và chỉ ra chỗ sai trước
khi đóng điện. Giáo viên tạo lớp, soạn bài giảng và theo dõi điểm số ngay trong
ứng dụng.

## Các phần

| Mục | Dùng để |
| --- | --- |
| **ModuStart** | Trò chơi ôn tập lý thuyết, có ngân hàng 75 câu hỏi |
| **ModuSim** | Bàn lắp ráp mạch điện 2D, soát lỗi đấu nối và mô phỏng số đo |
| **ModuLog** | Bảng số liệu và báo cáo thực hành |
| **ModuDoc** | Lý thuyết ôn tập kèm mô phỏng tương tác, thư viện dụng cụ, bài giảng của thầy cô |
| **ModuManage** | Dành cho giáo viên: lớp học, nhóm, soạn bài giảng, giao bài tập, sổ điểm |
| **ModuDev** | Dành cho tài khoản quản trị: xem thẳng cơ sở dữ liệu |

## Chạy trên máy

Cần **Node.js 22 trở lên** — máy chủ dùng SQLite có sẵn trong Node, không cài
thêm thư viện cơ sở dữ liệu nào.

```bash
npm install
npm run db:seed     # nạp nội dung: bài thực hành, dụng cụ, ngân hàng câu hỏi
npm run server      # máy chủ dữ liệu ở http://localhost:8787
npm run dev         # ở cửa sổ dòng lệnh khác — giao diện ở http://localhost:3000
```

Cơ sở dữ liệu mới nạp xong **không có lớp và không có học sinh nào**, mọi thống
kê bằng 0. Giáo viên tự tạo lớp, học sinh tự đăng kí rồi nhập mã vào lớp.

Cần dữ liệu trình diễn để quay video hay chụp ảnh cho bài báo cáo:

```bash
npm run db:demo              # thêm một lớp mẫu có sẵn điểm và báo cáo
npm run db:demo -- --clear   # xoá đúng lớp đó, không đụng lớp thật
```

## Tài liệu kĩ thuật

| Tệp | Nội dung |
| --- | --- |
| [`TRIEN-KHAI.md`](TRIEN-KHAI.md) | Đưa lên máy chủ thật |
| [`server/README.md`](server/README.md) | Máy chủ dữ liệu, phân quyền, bài giảng tự do, tệp tải lên |
| [`src/components/f5-circuit/README.md`](src/components/f5-circuit/README.md) | Bộ giải mạch và quy tắc mắc dụng cụ đo |
| [`src/components/f3-theory/README.md`](src/components/f3-theory/README.md) | Mô phỏng tương tác trong bài lý thuyết |
| [`src/components/f2-quiz/README.md`](src/components/f2-quiz/README.md) | Trò chơi ôn tập và trò chơi phiêu lưu |

## Công nghệ

React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · SQLite (`node:sqlite`).
Máy chủ không dùng thư viện ngoài nào — chỉ các mô-đun có sẵn của Node.
