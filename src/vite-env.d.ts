/// <reference types="vite/client" />

/** Cho phép nhập tệp HTML dưới dạng chuỗi bằng hậu tố ?raw của Vite */
declare module '*.html?raw' {
  const content: string;
  export default content;
}

/** Ảnh chụp thật dùng trong trang chủ */
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
