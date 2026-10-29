# Bộ mô phỏng mạch điện

## Vôn kế mắc song song, ampe kế mắc nối tiếp (sửa ở V1.76)

Quy tắc này là nội dung chính của bài thực hành đo điện trở, nên mắc sai thì
phần mềm **phải không cho ra số đo**. Trước V1.76 thì chưa: bảng soát mạch có
in cảnh báo, nhưng mặt đồng hồ vẫn lấy số thẳng từ nhánh và hiện ra một con số
trông rất hợp lí. Vôn kế mắc nối tiếp hiện đúng 12V — học sinh nào không đọc
bảng cảnh báo thì cứ thế chép vào bảng số liệu. Báo lỗi mà vẫn đưa số liệu thì
chẳng khác nào không báo.

### Nhận ra bằng tô-pô, không bằng con số

Phép thử nằm ở `meterFaults` trong `sim.ts`. Cách nhận:

> Bỏ nhánh của dụng cụ đo ra khỏi mạch (bỏ cả nhánh nguồn), hai cực nguồn còn
> thông nhau không?

- **Không thông** → mọi dòng đều buộc phải qua nó → **mắc nối tiếp**.
- **Vẫn thông** → có đường vòng, dòng chia nhau đi → **mắc song song**.

Từ đó: ampe kế mắc song song là sai, vôn kế mắc nối tiếp là sai. Cả hai trường
hợp đều bị cắt số đọc — đồng hồ số hiện `---`, đồng hồ kim về vạch 0 — kèm câu
giải thích tại sao và phải sửa thế nào.

Cách này đúng với mọi kiểu đấu, không chỉ mạch một vòng, và không phải đoán đâu
là điện trở Rx.

### Ba chỗ dễ sai đã vấp phải

**Vôn kế đo hai cực nguồn là hợp lệ.** Mạch chỉ có nguồn và vôn kế thì bỏ vôn kế
ra là hai cực mất liên lạc, phép thử trên sẽ kết luận nhầm là "nối tiếp". Nên
phải xét trước: dụng cụ có mắc song song trực tiếp với một linh kiện nào không
(hai chốt rơi đúng vào hai nút của linh kiện đó). Có thì thôi, không xét nữa.

**Vôn kế không được tính là đường dẫn** khi hỏi "có đường vòng qua ampe kế
không". Nhánh 2MΩ chỉ chia đi khoảng một phần triệu dòng mạch, ampe kế vẫn đo
gần đủ dòng nên vẫn là nối tiếp. Tính vôn kế là đường dẫn thì cứ mắc vôn kế
vòng qua cả đoạn mạch là ampe kế bị kết luận oan.

**Nhưng vôn kế LẠI được tính** khi hỏi "mạch có kín không". Vôn kế mắc nối tiếp
có làm mạch kín — dòng 6µA vẫn là dòng. Lẫn hai câu hỏi này vào nhau thì chính
cái lỗi vôn kế nối tiếp tự che được mình: nó bóp dòng xuống quá nhỏ, mạch bị coi
là hở, và phần soát mạch bỏ qua không xét nữa. Vì vậy có hai ngưỡng điện trở
khác nhau cho hai câu hỏi khác nhau.

### Một lỗi đi kèm

Danh sách "vật dẫn cần đo" lấy cả biến trở, rồi lấy phần tử đầu danh sách làm
Rx. Hễ trên bàn có biến trở đứng trước điện trở mẫu là mọi phép so dòng, so áp
đều so vào sai linh kiện: ampe kế mắc song song Rx lọt lưới, còn vôn kế mắc đúng
thì bị kết luận là sai. Nay điện trở mẫu luôn được xếp trước.

### Chạy thử

```
node /path/to/meter-test.mjs      # 23 phép thử trên bộ giải mạch
node /path/to/meter-ui2.mjs <url> # 14 phép thử trên giao diện thật
```

Bộ thử giao diện lắp mạch bằng cách bấm chuột như học sinh rồi đọc góc quay của
kim, vì cái cần kiểm là **cái học sinh nhìn thấy**, không phải cái bộ giải mạch
tính ra. Các thuộc tính `data-part`, `data-term`, `data-add` trên thẻ SVG có đó
để bộ thử bám vào.
