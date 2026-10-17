/**
 * Tạo hoặc đặt lại tài khoản developer.
 *
 *   npm run dev:account -- --email dev@modulab.tech --password 'MatKhauDai'
 *   npm run dev:account                      (lấy từ biến môi trường, hoặc tự sinh mật khẩu)
 *
 * Cố tình KHÔNG có điểm cuối HTTP nào làm việc này. Muốn có tài khoản dev thì
 * phải chạy được lệnh trên chính máy chủ, nên người dùng web không có cách nào
 * tự nâng quyền cho mình dù có đọc được toàn bộ mã nguồn.
 */
import { randomBytes } from 'node:crypto';
import { upsertDeveloper } from './auth.mjs';

const argOf = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

const email = argOf('email') ?? process.env.MODULAB_DEV_EMAIL ?? 'dev@modulab.tech';
const name = argOf('name') ?? process.env.MODULAB_DEV_NAME ?? 'ModuLab Developer';

/* Không truyền mật khẩu thì sinh một chuỗi ngẫu nhiên và in ra đúng một lần.
   Như vậy không có mật khẩu mặc định nào nằm sẵn trong mã nguồn để người khác
   đọc được rồi đăng nhập thẳng vào cơ sở dữ liệu thật. */
const sinh = !argOf('password') && !process.env.MODULAB_DEV_PASSWORD;
const password = argOf('password') ?? process.env.MODULAB_DEV_PASSWORD
  ?? randomBytes(9).toString('base64url');

const kq = upsertDeveloper({ email, password, name });

console.log('');
console.log(kq.created ? '✓ Đã tạo tài khoản developer' : '✓ Đã đặt lại tài khoản developer');
console.log(`  Email     : ${kq.email}`);
console.log(`  Vai trò   : ${kq.role}`);
if (sinh) {
  console.log(`  Mật khẩu  : ${password}`);
  console.log('');
  console.log('  Mật khẩu này chỉ in ra lần này thôi — chép lại ngay.');
  console.log('  Muốn đặt mật khẩu của riêng mình thì chạy lại với: -- --password "..."');
} else {
  console.log('  Mật khẩu  : (dùng mật khẩu bạn vừa đặt)');
}
console.log('');
console.log('  Đăng nhập vào ứng dụng bằng tài khoản này sẽ thấy thêm mục "ModuDev".');
console.log('');
