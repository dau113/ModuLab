import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Đặt DISABLE_HMR=true để tắt nạp nóng và tắt luôn việc theo dõi tệp,
      // đỡ tốn CPU khi sửa mã hàng loạt bằng công cụ tự động.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Chuyển tiếp mọi lời gọi /api sang máy chủ dữ liệu chạy ở cổng 8787
      proxy: {
        '/api': {
          target: process.env.VITE_API_TARGET || 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
  };
});
