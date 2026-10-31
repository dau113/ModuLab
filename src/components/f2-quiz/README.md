# ModuStart — ôn tập và trò chơi phiêu lưu

| Tệp | Vai trò |
| --- | --- |
| `index.tsx` | Trò chơi ôn tập nhanh, bốc câu từ ngân hàng 75 câu |
| `quest.tsx` | Khung chứa trò chơi phiêu lưu: chọn chủ đề, chỉnh cỡ hình, nhận kết quả |
| `game.html` | Bản thân trò chơi — HTML/CSS/JS thuần, chạy trong khung nhúng riêng |
| `lesson-view.tsx` | Phía học sinh của bài giảng tự do |
| `art.tsx` | Hình linh kiện vẽ cho mấy câu hỏi cần nhìn hình |

## Phóng to thu nhỏ trò chơi (từ V1.81)

Trò chơi co giãn theo bề ngang nhưng hình vẽ bên trong thì cố định: sân khấu
cao tối thiểu 430px, nhân vật 150×180, cộng thanh trạng thái và khay đáp án là
khoảng **1150×790**. Màn hình laptop 1280×800 chỉ chừa cho khung trò chơi
1007×439 — thiếu gần 300px chiều cao, học sinh phải cuộn trong khung mới thấy
hết, mà đang đánh quái thì không ai nghĩ tới việc cuộn.

Nay trò chơi luôn được vẽ ở đúng khổ gốc rồi **thu phóng cả khối** cho vừa chỗ
trống. Ba nút: thu nhỏ, phóng to (40%–200%), và *Vừa khung* để máy tự chọn.
Mức đã chọn lưu trong trình duyệt nên lần sau mở lại vẫn thế.

Thêm nút **Toàn màn hình** (thoát bằng Esc). Trên laptop 1280×800 nó nâng mức
hiển thị từ 59% lên 105% — chính thanh tiêu đề và thanh bên của ứng dụng mới
là thứ bóp nhỏ trò chơi, chứ không phải màn hình.

### Ba chỗ dễ sai

**Mức phóng không được nằm trong `key` của thẻ nhúng.** Đổi `key` là React tháo
thẻ ra lắp lại, trò chơi khởi động lại từ đầu. Chỉnh cỡ giữa trận mà mất sạch
tiến độ thì thà đừng có nút.

**Toàn màn hình phải dùng CÙNG một thẻ, chỉ đổi lớp CSS.** Dựng hai nhánh JSX
riêng cũng làm React lắp lại thẻ nhúng, hỏng y như trên. (Chuyển sang cổng
`createPortal` cũng hỏng: trình duyệt nạp lại `<iframe>` mỗi khi thẻ ấy bị dời
chỗ trong cây DOM.)

**Phải đo ô nội dung, không lấy `clientWidth`/`clientHeight`.** Hai số đó tính
cả phần đệm, nên lớp phủ có đệm 12px mỗi bên thì mức phóng tính ra lớn hơn chỗ
thật 24px và trò chơi thò ra ngoài đúng chừng ấy. Dùng `contentRect` của
`ResizeObserver`.

### Một lỗi nền tảng lộ ra nhờ việc này

Lớp phủ `position: fixed` ban đầu chỉ phủ được vùng nội dung chứ không phủ hết
cửa sổ. Thủ phạm là `.ml-page { animation: … both }` trong `index.css`:
`both` gồm cả `forwards`, nên chạy xong phần tử vẫn giữ `transform` của khung
hình cuối. Khung hình cuối là trạng thái bình thường, nhưng **có** transform
khác với **không** có — một transform, dù là ma trận đơn vị, vẫn biến phần tử
thành khối chứa cho mọi hậu duệ `position: fixed`.

Đã đổi `both` thành `backwards` ở `.ml-page`, `.ml-rise` và `.ml-pop`. Nhìn y
hệt vì khung hình cuối vốn trùng với trạng thái bình thường, nhưng từ nay mọi
lớp phủ `fixed` trong ứng dụng mới phủ đúng cả cửa sổ.
