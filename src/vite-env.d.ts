/// <reference types="vite/client" />

/** Cho phép nhập tệp HTML dưới dạng chuỗi bằng hậu tố ?raw của Vite */
declare module '*.html?raw' {
  const content: string;
  export default content;
}
