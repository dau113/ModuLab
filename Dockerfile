# ModuLab — gói cả giao diện lẫn máy chủ dữ liệu vào một ảnh duy nhất
FROM node:22-alpine

WORKDIR /app

# Cài thư viện trước để tận dụng bộ nhớ đệm của Docker
COPY package*.json ./
RUN npm ci

# Chép mã nguồn rồi dựng giao diện
COPY . .
RUN npm run build

# Cơ sở dữ liệu nằm ngoài mã nguồn để gắn ổ đĩa lưu lâu dài
ENV MODULAB_DB=/data/modulab.db
ENV NODE_ENV=production
ENV PORT=8787
VOLUME ["/data"]
EXPOSE 8787

# Nạp dữ liệu nếu cơ sở dữ liệu còn trống, sau đó chạy máy chủ
CMD ["sh", "-c", "npm run db:seed && npm run server"]
