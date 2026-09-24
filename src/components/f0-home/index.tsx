/**
 * F0 — Trang chủ.
 *
 * Nguyên tắc về màu: màu chàm chỉ dành cho MỘT việc là hành động chính (nút vào
 * phòng thực hành, dòng đang chọn, viền khi bấm phím). Mọi thứ còn lại dùng
 * thang xám: phân cấp do cỡ chữ và độ đậm quyết định, không phải do màu. Trước
 * đây tiêu đề, biểu tượng, số liệu, nút bấm đều cùng một màu chàm nên không có
 * gì nổi bật hơn gì.
 *
 * Về bố cục: khối chọn tài khoản là thao tác đăng nhập nên trình bày như một
 * danh sách chọn, còn khối giới thiệu các phần là thông tin nên trình bày như
 * một danh sách có đánh số. Hai mục đích khác nhau thì hình thức phải khác nhau.
 */
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { SettingsMenu } from '../common';
import { APP_VERSION } from '../../version';
import type { ApiUser } from '../../api/client';

interface HomeMenuProps {
  users: ApiUser[];
  onEnter: (userId: string, guest?: boolean) => void;
  currentUserId?: string;
}

type Role = 'hs' | 'gv' | 'khach';

const SECTIONS = [
  {
    name: 'Khởi động',
    desc: 'Trắc nghiệm nhanh hoặc trò chơi phiêu lưu, lấy câu hỏi từ ngân hàng 75 câu chia ba chủ đề.',
  },
  {
    name: 'Thực hành',
    desc: 'Lắp mạch trên bảng lắp ráp ảo. Bộ giải mạch tính đúng dòng và thế, nối sai thì báo ngay chỗ sai.',
  },
  {
    name: 'Báo cáo thực hành',
    desc: 'Nhập số liệu từng lần đo, tự tính điện trở trung bình và sai số, rồi nộp cho giáo viên.',
  },
  {
    name: 'Tài liệu',
    desc: 'Lý thuyết bốn bài từ định luật Ohm tới nguồn điện, kèm tra cứu từng dụng cụ trong bộ thí nghiệm.',
  },
];

export const HomeMenu: React.FC<HomeMenuProps> = ({ users, onEnter }) => {
  const [role, setRole] = useState<Role>('hs');

  const students = users.filter((u) => u.role === 'hs');
  const teachers = users.filter((u) => u.role === 'gv');
  const list = role === 'hs' ? students : role === 'gv' ? teachers : [];

  const [picked, setPicked] = useState<string | null>(null);
  const chosen = picked ?? list[0]?.id ?? null;

  const enter = () => {
    if (role === 'khach') onEnter(students[0]?.id ?? users[0]?.id, true);
    else if (chosen) onEnter(chosen);
  };

  return (
    <div className="ml-scroll h-screen overflow-y-auto bg-white text-slate-900">
      {/* Thanh trên: chỉ tên ứng dụng và một nút cài đặt */}
      <header className="h-16 border-b border-slate-200 px-6 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-slate-900 grid place-items-center">
            <div className="w-3 h-3 border-2 border-white rounded-[2px]" />
          </div>
          <span className="text-[clamp(15px,1.05vw,17.5px)] font-semibold tracking-tight">ModuLab</span>
        </div>
        <SettingsMenu />
      </header>

      <div className="max-w-4xl mx-auto px-6 md:px-10">

        {/* Giới thiệu */}
        <section className="pt-14 pb-12">
          <h1 className="text-[clamp(28px,3.4vw,42px)] font-bold leading-[1.15] tracking-tight max-w-3xl">
            “ModuLab” — trợ lý số hỗ trợ giờ học thực hành cho học sinh THPT
          </h1>

          <div className="mt-5 space-y-4 text-[clamp(15px,1.15vw,18px)] text-slate-600 leading-relaxed max-w-2xl">
            <p>
              Trong các tiết thực hành, học sinh thường gặp khó khăn khi không biết mạch đã lắp đúng
              hay chưa, không dám cấp nguồn vì lo hư hỏng, hoặc quên cách sử dụng các dụng cụ đo.
              Trong khi đó, giáo viên phải dành nhiều thời gian kiểm tra từng nhóm, khiến quá trình
              thực hành bị gián đoạn.
            </p>
            <p>
              Việc tự học cũng không dễ dàng hơn. Quá nhiều nguồn tài liệu khiến học sinh khó chọn
              lọc thông tin đáng tin cậy; nội dung thường nặng lý thuyết, thiếu trực quan và chưa gắn
              kết với thực tế.
            </p>
            <p className="text-slate-900 font-medium">
              ModuLab được xây dựng để giải quyết những khoảng cách đó.
            </p>
            <p>
              Một nền tảng hỗ trợ học sinh kiểm tra mạch trước khi cấp nguồn, làm quen với dụng cụ đo
              và tiếp cận kiến thức thực hành trực quan hơn — giúp việc học không chỉ dừng lại ở lý
              thuyết mà trở thành trải nghiệm thử, hiểu và làm được.
            </p>
          </div>

          <p className="mt-6 text-[clamp(17px,1.2vw,20px)] text-slate-900 tracking-tight">
            Learn it. Build it. Verify it.
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4">
            {[
              ['75', 'câu hỏi'],
              ['13', 'linh kiện mô phỏng'],
              ['4', 'bài lý thuyết'],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="text-[clamp(22px,1.9vw,28px)] font-semibold leading-none tabular-nums">{n}</dt>
                <dd className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 mt-1.5">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Đăng nhập — đây là thao tác, nên trình bày như một danh sách chọn */}
        <section className="pb-14">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-[clamp(16px,1.2vw,19px)] font-semibold">Vào phòng thực hành</h2>
              <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 mt-0.5">
                Chọn tài khoản của em, hoặc vào xem thử với tư cách khách.
              </p>
            </div>

            {/* Chọn vai trò */}
            <div className="px-5 pt-4">
              <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                {([
                  ['hs', `Học sinh (${students.length})`],
                  ['gv', `Giáo viên (${teachers.length})`],
                  ['khach', 'Khách'],
                ] as [Role, string][]).map(([id, label]) => (
                  <button key={id}
                    onClick={() => { setRole(id); setPicked(null); }}
                    className={`h-9 px-4 text-[clamp(13px,0.9vw,15.5px)] transition-colors ${
                      role === id
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách tài khoản */}
            <div className="px-5 py-4">
              {role === 'khach' ? (
                <p className="text-[clamp(14px,0.98vw,16.5px)] text-slate-600 py-2">
                  Vào xem toàn bộ ứng dụng mà không ghi lại kết quả. Bài làm và số liệu sẽ không được lưu.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {list.map((u) => (
                    <li key={u.id}>
                      <button
                        onClick={() => setPicked(u.id)}
                        onDoubleClick={enter}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                          chosen === u.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                        }`}>
                        <span className={`w-4 h-4 rounded-full border-2 shrink-0 grid place-items-center ${
                          chosen === u.id ? 'border-indigo-600' : 'border-slate-300'
                        }`}>
                          {chosen === u.id && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                        </span>
                        <span className="text-[clamp(14px,0.98vw,16.5px)] truncate">{u.name}</span>
                        {u.teamCode && (
                          <span className="ml-auto text-[clamp(13px,0.9vw,15.5px)] text-slate-400 shrink-0">
                            {u.teamCode}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                  {list.length === 0 && (
                    <li className="px-4 py-3 text-[clamp(14px,0.98vw,16.5px)] text-slate-500">
                      Chưa có tài khoản nào.
                    </li>
                  )}
                </ul>
              )}

              <button
                onClick={enter}
                disabled={role !== 'khach' && !chosen}
                className="mt-4 h-11 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700
                  disabled:bg-slate-200 disabled:text-slate-400
                  text-white text-[clamp(14px,0.98vw,16.5px)] font-medium
                  flex items-center gap-2 transition-colors">
                Vào phòng thực hành
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Giới thiệu các phần — đây là thông tin, nên trình bày như một danh sách */}
        <section className="pb-16 border-t border-slate-200 pt-10">
          <h2 className="text-[clamp(16px,1.2vw,19px)] font-semibold mb-1">Ứng dụng gồm bốn phần</h2>
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 mb-6">
            Làm theo thứ tự này là hợp lý nhất, nhưng em vào phần nào trước cũng được.
          </p>

          <ol className="space-y-5">
            {SECTIONS.map((s, i) => (
              <li key={s.name} className="flex gap-4">
                <span className="shrink-0 w-7 text-[clamp(14px,0.98vw,16.5px)] text-slate-400 tabular-nums pt-0.5">
                  {i + 1}.
                </span>
                <div>
                  <h3 className="text-[clamp(15px,1.05vw,17.5px)] font-medium">{s.name}</h3>
                  <p className="text-[clamp(14px,0.98vw,16.5px)] text-slate-600 leading-relaxed mt-1 max-w-2xl">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="border-t border-slate-200 py-5 px-6 md:px-10">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 max-w-2xl leading-relaxed">
            Sản phẩm hướng theo chủ trương của Chính phủ và Bộ Giáo dục và Đào tạo về dạy học phát
            triển năng lực, trong đó có yêu cầu tăng cường thực hành và thí nghiệm ở môn Vật lí.
          </p>
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-400">
            ModuLab v{APP_VERSION} · Phòng thực hành Vật lí điện học
          </p>
        </div>
      </footer>
    </div>
  );
};
