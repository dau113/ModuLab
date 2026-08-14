# Máy chủ dữ liệu ModuLab

Backend viết bằng Node thuần: `node:http` cho API và `node:sqlite` cho cơ sở dữ liệu,
**không cần cài thêm gói nào**. Yêu cầu Node từ phiên bản 22 trở lên.

## Chạy lần đầu

```bash
npm run db:seed     # tạo tệp server/data/modulab.db và nạp dữ liệu khởi tạo
npm run server      # chạy API ở http://localhost:8787
npm run dev         # ở cửa sổ dòng lệnh khác — giao diện gọi /api qua proxy của Vite
```

`npm run db:reset` xoá sạch rồi nạp lại từ đầu.

## Các tệp

| Tệp | Vai trò |
|---|---|
| `schema.sql` | Toàn bộ lược đồ: 14 bảng và 1 khung nhìn tổng hợp |
| `db.mjs` | Mở cơ sở dữ liệu, áp lược đồ, các hàm truy vấn theo nghiệp vụ |
| `seed.mjs` | Nạp dữ liệu khởi tạo, đọc thẳng từ `src/data/mockData.ts` |
| `index.mjs` | Định tuyến API |
| `data/modulab.db` | Tệp cơ sở dữ liệu (không đưa lên kho mã nguồn) |

## Các điểm cuối

| Phương thức | Đường dẫn | Công dụng |
|---|---|---|
| GET | `/api/health` | Kiểm tra máy chủ và tình trạng dữ liệu |
| GET | `/api/bootstrap` | Nạp một lượt: người dùng, bài thực hành, dụng cụ, câu hỏi |
| GET | `/api/users` | Danh sách tài khoản |
| POST | `/api/auth/login` | Đăng nhập theo email hoặc mã tài khoản |
| GET | `/api/modules` | Danh sách bài thực hành |
| GET | `/api/tools` | Thư viện dụng cụ kèm các chế độ đo |
| GET | `/api/questions?moduleId=` | Ngân hàng câu hỏi |
| POST | `/api/questions` | Giáo viên thêm câu hỏi mới |
| POST | `/api/attempts` | Ghi lượt chơi Game ôn tập |
| GET | `/api/reports/:userId/:moduleId` | Lấy báo cáo, tự tạo nếu chưa có |
| PUT | `/api/reports/:userId/:moduleId` | Lưu bảng số liệu đo |
| POST | `/api/reports/:userId/:moduleId/submit` | Nộp báo cáo kèm kết quả sai số |
| GET | `/api/circuits/:userId` | Danh sách bản lắp đã lưu |
| GET | `/api/circuit/:id` | Chi tiết một bản lắp |
| POST | `/api/circuits` | Lưu bản lắp từ phần mô phỏng |
| GET | `/api/teacher/stats?classCode=` | Số liệu tổng hợp cho Bảng quản lý |

## Ghi chú

- Số liệu trong Bảng quản lý được tính trực tiếp từ bảng `quiz_attempts` và `lab_reports`
  qua khung nhìn `v_student_progress`, không phải số cố định.
- Mọi thao tác quan trọng đều ghi vào bảng `activity_logs`.
- Đổi cổng bằng biến môi trường `PORT`, đổi vị trí tệp dữ liệu bằng `MODULAB_DB`.
