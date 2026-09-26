/// <reference types="vite/client" />

/** Cho phép nhập tệp HTML dưới dạng chuỗi bằng hậu tố ?raw của Vite */
declare module '*.html?raw' {
  const content: string;
  export default content;
}

/** Ảnh nhập trực tiếp trong mã; Vite trả về đường dẫn tệp sau khi đóng gói */
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
declare module '*.svg' {
  const src: string;
  export default src;
}
