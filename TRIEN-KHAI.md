# Triển khai ModuLab

Ứng dụng chạy được ở hai chế độ.

## 1. Có máy chủ dữ liệu (đầy đủ chức năng)

Cần nơi chạy được Node 22 kèm ổ đĩa lưu lâu dài: Render, Railway, Fly.io hoặc
một máy chủ riêng. Máy chủ vừa phục vụ giao diện vừa chạy API và cơ sở dữ liệu.

```bash
npm ci
npm run build          # dựng giao diện vào thư mục dist
npm run db:seed        # tạo cơ sở dữ liệu lần đầu
npm run server         # chạy ở cổng 8787, phục vụ luôn giao diện
```

Trên Render: chọn **New Blueprint**, trỏ vào kho mã nguồn, tệp `render.yaml`
đã khai báo sẵn lệnh dựng, lệnh chạy và ổ đĩa 1GB gắn ở `/var/data`.

Có sẵn `Dockerfile` nếu muốn chạy bằng Docker:

```bash
docker build -t modulab .
docker run -p 8787:8787 -v modulab-data:/data modulab
```

## 2. Chỉ web tĩnh (Vercel, Netlify, GitHub Pages)

Những nơi này không chạy được máy chủ Node nên **API sẽ không có**. Ứng dụng tự
nhận biết điều đó và chuyển sang **chế độ ngoại tuyến**: dùng dữ liệu đóng gói
sẵn trong mã nguồn, bài làm lưu vào bộ nhớ trình duyệt của từng máy. Trên màn
hình sẽ có dòng nhắc màu vàng cho biết đang ở chế độ này.

Với Vercel, tệp `vercel.json` đã khai báo sẵn lệnh dựng và điều hướng về
`index.html`. Chỉ cần trỏ Vercel vào kho mã nguồn là xong, không cần cấu hình gì thêm.

Điều **không có** ở chế độ ngoại tuyến:

- Giáo viên không xem được bài của cả lớp (mỗi máy chỉ có dữ liệu của chính nó)
- Câu hỏi giáo viên thêm không lưu lại sau khi xoá bộ nhớ trình duyệt
- Không đồng bộ giữa các máy

Muốn đủ chức năng thì dùng cách 1.

## Biến môi trường

| Biến | Ý nghĩa |
|---|---|
| `PORT` | Cổng máy chủ, mặc định 8787 |
| `MODULAB_DB` | Vị trí tệp cơ sở dữ liệu, nên trỏ vào ổ đĩa lưu lâu dài |
| `MODULAB_DIST` | Thư mục giao diện đã dựng, mặc định `dist` |
| `VITE_API_TARGET` | Chỉ dùng khi phát triển, địa chỉ máy chủ cho proxy của Vite |
