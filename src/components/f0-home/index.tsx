/**
 * F0 — Trang chủ, dựng theo lối trang giới thiệu môn học của các nền tảng học
 * thuật: chữ dẫn dắt, không dùng thẻ trang trí.
 *
 * Bốn nguyên tắc áp dụng ở đây:
 *   · Phân cấp do cỡ chữ và độ đậm, không do màu hay khung thẻ.
 *   · Biểu tượng chỉ dùng khi nó làm được việc, không dùng để trang trí.
 *   · Màu nhấn mang nghĩa "đây là hành động chính", không phải màu thương hiệu.
 *   · Số liệu nằm trong câu văn, không tách thành ô riêng.
 */
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSettings } from '../../settings';
import { SettingsMenu } from '../common';
import { APP_VERSION } from '../../version';
import type { ApiUser } from '../../api/client';

interface HomeMenuProps {
  users: ApiUser[];
  onEnter: (userId: string, guest?: boolean) => void;
  currentUserId?: string;
}

type Role = 'hs' | 'gv';

/** Bốn phần của ứng dụng, viết thành một hàng chữ chứ không phải bốn thẻ */
const SECTIONS = ['Khởi động', 'Thực hành', 'Báo cáo thực hành', 'Tài liệu'];

export const HomeMenu: React.FC<HomeMenuProps> = ({ users, onEnter }) => {
  const { t } = useSettings();
  const [role, setRole] = useState<Role>('hs');

  const students = users.filter((u) => u.role === 'hs');
  const teachers = users.filter((u) => u.role === 'gv');
  const list = role === 'hs' ? students : teachers;

  return (
    <div className="ml-scroll h-screen overflow-y-auto bg-[#fafaf9] text-slate-900">
      <header className="h-14 border-b border-slate-200 px-6 md:px-10 flex items-center justify-between">
        <span className="text-h3 font-medium tracking-tight">ModuLab</span>
        <SettingsMenu />
      </header>

      <div className="max-w-2xl mx-auto px-6 md:px-10">

        {/* Giới thiệu — số liệu nằm trong câu văn */}
        <section className="pt-10 pb-8">
          <h1 className="text-h1 tracking-tight">
            ModuLab — trợ lý số hỗ trợ giờ học thực hành cho học sinh THPT
          </h1>

          <p className="mt-6 text-h3 text-slate-700 leading-[1.75]">
            {t('home.hero.intro')}
          </p>

          <p className="mt-4 text-h3 text-slate-700 leading-[1.75]">
            Ứng dụng có <strong className="font-semibold">75 câu hỏi</strong> chia ba chủ đề,{' '}
            <strong className="font-semibold">13 linh kiện</strong> mô phỏng theo bộ dụng cụ thật và{' '}
            <strong className="font-semibold">4 bài lý thuyết</strong> từ định luật Ohm tới nguồn điện.
          </p>
        </section>

        {/* Bốn phần — một hàng chữ, không phải bốn thẻ */}
        <section className="py-6 border-t border-slate-200">
          <h2 className="text-h2 mb-2">Bốn phần của ứng dụng</h2>
          <p className="text-h3 text-slate-700 leading-[1.75]">
            {SECTIONS.map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <span className="text-slate-300"> · </span>}
                <span>{s}</span>
              </React.Fragment>
            ))}
          </p>
          <p className="mt-2 text-body text-slate-500 leading-relaxed">
            Làm theo thứ tự này là hợp lý nhất, nhưng em vào phần nào trước cũng được.
          </p>
        </section>

        {/* Chọn tài khoản — danh sách tên, mỗi dòng một mũi tên */}
        <section className="py-6 border-t border-slate-200">
          <h2 className="text-h2 mb-1">Vào phòng thực hành</h2>
          <p className="text-body text-slate-500 mb-5">
            Chọn tài khoản của em để bắt đầu.
          </p>

          <div className="flex gap-5 mb-3 text-body">
            {([['hs', 'Học sinh'], ['gv', 'Giáo viên']] as [Role, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setRole(id)}
                className={`pb-1 border-b-2 transition-colors ${
                  role === id
                    ? 'border-indigo-600 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <ul className="border-t border-slate-200">
            {list.map((u) => (
              <li key={u.id} className="border-b border-slate-200">
                <button onClick={() => onEnter(u.id)}
                  className="w-full text-left py-3 flex items-center gap-3 group">
                  <span className="text-h3 text-slate-800">{u.name}</span>
                  {u.teamCode && (
                    <span className="text-body text-slate-400">{u.teamCode}</span>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-300 ml-auto shrink-0
                    group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onEnter(students[0]?.id ?? users[0]?.id, true)}
            className="mt-4 text-body text-slate-500 underline underline-offset-4 hover:text-slate-800 transition-colors">
            Hoặc vào xem thử với tư cách khách
          </button>
        </section>
      </div>

      <footer className="border-t border-slate-200 py-5 px-6 md:px-10">
        <p className="max-w-2xl mx-auto text-body text-slate-400">
          ModuLab v{APP_VERSION}
        </p>
      </footer>
    </div>
  );
};
