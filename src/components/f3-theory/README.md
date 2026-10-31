# Lý thuyết ôn tập (ModuDoc)

Bốn bài, mỗi bài một trang nội dung và **một phần mô phỏng ở cuối trang**
(`sims.tsx`, thêm ở V1.78):

| Bài | Mô phỏng | Công thức |
| --- | --- | --- |
| Điện trở & Định luật Ohm | kéo U và R, kèm đồ thị U–I | `I = U / R` |
| Đoạn mạch nối tiếp, song song | đổi qua lại hai kiểu mắc | `R = R₁+R₂` · `1/R = 1/R₁+1/R₂` |
| Cường độ dòng điện | electron trôi trong dây | `I = S·n·v·e` |
| Mạch điện & nguồn điện | nguồn có điện trở trong | `I = E/(R+r)` · `U = E − I·r` |

Phần này không thay cho bàn lắp ráp ở ModuSim: ở đây không có dây để nối sai,
chỉ có đúng một công thức của bài đang đọc, để thấy đại lượng nào kéo theo đại
lượng nào. Sai cách mắc thì sang ModuSim mới bắt được.

## Màu trong SVG phải lấy từ biến, không ghi mã cứng

Chế độ tối **đảo cả bảng xám lẫn bảng chàm ở cấp biến CSS**, nên lớp tiện ích
của Tailwind tự đổi theo, còn mã màu cứng viết thẳng vào thuộc tính SVG thì
không. Trước V1.78 các sơ đồ trong bài đều ghi kiểu `stroke="#334155"`: ở chế
độ tối thành nét tối nằm trên nền tối, ký hiệu nguồn và dấu +/− gần như mất hút.

Nay mọi nét vẽ dùng `var(--color-slate-700)` và tương tự. Thêm hai điều phải nhớ:

- Chỉ dùng những họ màu **có bản đảo** ở chế độ tối: xám, chàm, hổ phách, lục,
  hồng, lam, lục lam, tía, cam. Họ `violet` và `sky` không có bản đảo nên giữ
  nguyên màu ở cả hai chế độ — đã đổi hết sang `purple` và `blue`.
- Hình vẽ phải có **trần bề ngang** (`max-w-[28rem]` chẳng hạn). Thẻ `svg`
  để `w-full` trong một cột rộng cả nghìn điểm ảnh thì cao lên theo tỉ lệ khung
  nhìn, kéo cả thẻ mô phỏng dài ngoẵng xuống mấy màn hình.

## Chạy thử

```
node /path/to/sim-test.mjs <url>   # 36 phép thử
```

Phép thử đọc **chính con số hiện trên màn hình** chứ không đọc biến trong mã:
đặt U = 6 V, R = 100 Ω rồi đòi thấy đúng "60,0 mA". Sai công thức hay sai chỗ
hiển thị đều lộ ra. Có kiểm cả việc nét vẽ đổi màu khi bật chế độ tối.
Thuộc tính `data-sim` trên khung mô phỏng là chỗ bộ thử bám vào.
