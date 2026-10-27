/**
 * Đổi lời nhắc của trình duyệt khi ô bắt buộc còn để trống.
 *
 * Câu "Vui lòng điền vào trường này." là câu mặc định của chính trình duyệt,
 * không nằm trong mã nguồn nên không sửa thẳng được. Cách duy nhất là dùng API
 * kiểm tra biểu mẫu: bắt sự kiện `invalid` rồi gọi `setCustomValidity` để đặt
 * câu của mình.
 *
 * Hai chỗ dễ sai:
 *
 *   · Sự kiện `invalid` KHÔNG nổi bọt lên cha, nên phải nghe ở pha bắt
 *     (`capture: true`) trên `document` thì mới nhận được của mọi ô.
 *
 *   · Đặt câu riêng xong thì ô đó bị coi là sai VĨNH VIỄN cho tới khi xoá câu
 *     ấy đi. Quên xoá là người dùng điền đúng rồi vẫn không gửi được biểu mẫu.
 *     Vì vậy mỗi lần nội dung ô thay đổi đều phải xoá trước, rồi để trình duyệt
 *     tự kiểm lại từ đầu.
 */

/** Ô nhập chữ, ô chọn, ô đánh dấu — những thứ có thể "sai quy tắc" */
type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const CHUA_DIEN = 'Vui lòng điền vào mục này.';
const CHUA_CHON = 'Vui lòng chọn một mục.';

const isField = (el: EventTarget | null): el is FormField =>
  !!el && typeof (el as FormField).setCustomValidity === 'function';

/** Ô mà người dùng chọn chứ không gõ, nên phải nói "chọn" thay vì "điền" */
const laOChon = (el: FormField): boolean =>
  el.tagName === 'SELECT'
  || (el.tagName === 'INPUT' && ['checkbox', 'radio', 'file'].includes((el as HTMLInputElement).type));

export function setupValidationMessages(): () => void {
  const onInvalid = (e: Event) => {
    const el = e.target;
    if (!isField(el) || !el.validity) return;

    /* Chỉ đổi câu của trường hợp bỏ trống. Các lỗi khác — email sai dạng, số
       ngoài khoảng — để nguyên câu của trình duyệt, vì những câu đó đã nói rõ
       sai ở đâu và còn kèm cả ví dụ. */
    el.setCustomValidity(el.validity.valueMissing
      ? (laOChon(el) ? CHUA_CHON : CHUA_DIEN)
      : '');
  };

  /* Xoá câu riêng ngay khi người dùng sửa, nếu không ô kẹt ở trạng thái sai */
  const onEdit = (e: Event) => {
    if (isField(e.target)) e.target.setCustomValidity('');
  };

  document.addEventListener('invalid', onInvalid, true);
  document.addEventListener('input', onEdit, true);
  document.addEventListener('change', onEdit, true);

  return () => {
    document.removeEventListener('invalid', onInvalid, true);
    document.removeEventListener('input', onEdit, true);
    document.removeEventListener('change', onEdit, true);
  };
}
