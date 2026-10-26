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

---

## Tài khoản và phân quyền (từ V1.69)

Ba vai trò, máy chủ kiểm ở từng điểm cuối trong bảng định tuyến của
`server/index.mjs`, không kiểm ở giao diện:

| Vai trò | Vào được |
| --- | --- |
| `hs` | bài làm của chính mình, bài tập của lớp mình |
| `gv` | mọi thứ của `hs`, thêm giao bài và chấm bài trong lớp mình |
| `dev` | thêm khu `/api/dev/*` để xem cơ sở dữ liệu |

Mật khẩu băm bằng scrypt kèm muối riêng từng tài khoản, lưu ở cột
`users.password_hash`. Phiên đăng nhập là một dòng trong bảng `sessions`;
đăng xuất là xoá dòng đó nên thu hồi được thật.

### Tạo tài khoản developer

Hai cách, chọn một.

**Cách 1 — có dòng lệnh trên máy chủ:**

```
npm run dev:account -- --email dev@truong.edu.vn --password 'MatKhauDai'
```

Bỏ `--password` thì lệnh tự sinh một mật khẩu ngẫu nhiên và in ra đúng một lần.

**Cách 2 — biến môi trường (dùng cho Render, nơi không có dòng lệnh):**

| Biến | Bắt buộc | Ví dụ |
| --- | --- | --- |
| `MODULAB_DEV_EMAIL` | có | `dev@truong.edu.vn` |
| `MODULAB_DEV_PASSWORD` | có, tối thiểu 8 kí tự | mật khẩu của riêng bạn |
| `MODULAB_DEV_NAME` | không | `Quản trị ModuLab` |

Đặt đủ hai biến bắt buộc rồi triển khai lại; máy chủ tự tạo tài khoản lúc khởi
động và ghi một dòng vào nhật ký. Thiếu một biến thì bỏ qua lặng lẽ, nên máy
của người phát triển không tự mọc tài khoản dev ngoài ý muốn.

Khởi động lại mà mật khẩu không đổi thì máy chủ không làm gì cả — phiên đang
đăng nhập vẫn còn, không bị đăng xuất sau mỗi lần triển khai. Đổi giá trị biến
`MODULAB_DEV_PASSWORD` là đổi mật khẩu, và mọi phiên cũ bị thu hồi ngay.

Cố tình không có điểm cuối HTTP nào tạo được quyền `dev`: phải sửa được biến
môi trường hoặc chạy được lệnh trên chính máy chủ, nên người dùng web không tự
nâng quyền cho mình được dù đọc hết mã nguồn.

### Khung truy vấn của dev

Ba lớp chặn, xem `server/devtools.mjs`:

1. phải đăng nhập bằng vai trò `dev`;
2. câu lệnh phải là một `SELECT` đơn, không dấu chấm phẩy thứ hai;
3. chạy trên một kết nối **mở ở chế độ chỉ đọc riêng** — lớp này là ràng buộc
   thật của SQLite, không phải đọc chuỗi đoán ý như hai lớp trên.

### Lưu ý khi triển khai

- **Render gói miễn phí xoá ổ đĩa mỗi lần deploy**, nên tệp SQLite mất theo và
  mọi tài khoản học sinh đăng kí sẽ biến mất. Phải gắn một ổ đĩa bền rồi trỏ
  `MODULAB_DB` vào đó.
- **Vercel chỉ phục vụ tệp tĩnh**, không chạy được máy chủ này. Đặt biến
  `VITE_API_URL` trỏ sang địa chỉ Render. Không đặt thì ứng dụng tự thử API
  cùng nguồn trước rồi mới quay sang địa chỉ dự phòng.

### Vì sao không có chỗ xem mật khẩu

Cột `users.password_hash` giữ chuỗi dạng `scrypt$<muối>$<băm>`, là kết quả của
một phép băm **một chiều**: từ mật khẩu tính ra được chuỗi đó, nhưng từ chuỗi
đó không tính ngược lại được. Lúc đăng nhập, máy chủ băm lại cái người dùng vừa
gõ rồi so hai chuỗi — không nơi nào trong hệ thống đọc được mật khẩu gốc, kể cả
tài khoản `dev` hay người có tệp cơ sở dữ liệu trong tay.

Vì vậy trang ModuDev không có nút "xem mật khẩu", mà có nút **Đặt lại mật
khẩu**: sinh một mật khẩu mới (hoặc nhận mật khẩu bạn tự gõ), hiện ra đúng một
lần để chép cho học sinh, rồi thu hồi mọi phiên đang mở của tài khoản đó.

Muốn xem lại được mật khẩu thì phải lưu nguyên văn trong cơ sở dữ liệu — ai đọc
được tệp đó là biết mật khẩu của cả lớp, và vì nhiều người dùng chung một mật
khẩu cho nhiều nơi nên thiệt hại không dừng ở phần mềm này.

---

## Lớp học, nhóm và mã vào lớp (từ V1.72)

Đăng kí chỉ cần tên, email, mật khẩu. Lớp lập sau, trong ứng dụng.

### Mã vào lớp

Dạng `<4 chữ số lớp>N<số nhóm>` — ví dụ `1204N2` là lớp mã 1204, nhóm 2.
Mã bốn chữ số sinh tự động từ tên gọi tắt của lớp: "12A4" cho ra "1204"; trùng
với lớp đã có thì lấy số nhỏ nhất còn trống. Giáo viên cũng tự đặt được.

**Nhóm 0 luôn tồn tại** trong mọi lớp và mang nghĩa "làm riêng lẻ", nên em nào
không thuộc nhóm nào vẫn vào lớp được bằng mã kết thúc bằng `N0`.

Số thứ tự của học sinh KHÔNG nằm trong mã — em nhập ở một ô riêng khi vào lớp.
Nhờ vậy giáo viên chỉ phát một mã cho cả nhóm thay vì bốn mươi mã khác nhau.
Số thứ tự phải duy nhất trong một lớp, nếu không sổ điểm không phân biệt được ai.

### Phát mã cho học sinh

Trong ModuManage, mục **Lớp học & nhóm thực hành**:

- chép mã từng nhóm, hoặc chép cả bảng mã thành một đoạn để dán vào nhóm chat;
- **Xuất bảng mã** tải về tệp CSV mở được bằng Excel hay Google Sheets.

### Xoá nhóm

Học sinh trong nhóm bị xoá chuyển sang nhóm "làm riêng lẻ" chứ không rơi ra
ngoài lớp — nếu rơi ra thì mọi bài các em đã nộp sẽ không còn thuộc lớp nào.
Nhóm 0 không xoá được.

---

## Hai loại điểm, đừng lẫn (sửa ở V1.73)

Game ôn tập có **điểm trò chơi**: mỗi câu đúng 10 điểm, cộng thêm thưởng trả
lời nhanh (tối đa 2) và thưởng chuỗi đúng liên tiếp (tối đa 5). Mười câu có thể
ra hơn một trăm điểm. Đó là điểm để chơi cho vui, không phải điểm học.

**Chấm bài phải dùng cột `quiz_attempts.correct` — số câu đúng.** Bản trước lấy
`score` chia số câu rồi nhân mười, nên sổ điểm hiện những con số như `36/10`.

| Cột | Nghĩa | Dùng để |
| --- | --- | --- |
| `score` | điểm trò chơi, có thưởng | hiển thị trong game |
| `correct` | số câu đúng | **chấm bài**, thang 10 |
| `total` | số câu của lượt chơi | mẫu số |

Lượt chơi từ trước V1.73 không có `correct` nên không suy ngược ra được. Những
lượt đó ước lượng bằng `score / total` rồi chặn trong khoảng 0–10: đúng hẳn với
bản đồ phiêu lưu (ở đó mỗi câu đúng đúng 10 điểm, không thưởng), hơi rộng tay
với trắc nghiệm nhanh.

Khi so hai lượt chơi để lấy lượt tốt nhất cũng xếp theo **tỉ lệ câu đúng**, không
theo điểm trò chơi — nếu không thì lượt trả lời vội mà sai nhiều vẫn có thể hơn
điểm lượt làm cẩn thận.
