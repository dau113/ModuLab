/**
 * F0 — Trang chủ: giới thiệu ngắn gọn và chọn tài khoản trước khi vào phòng thực hành.
 */
import React from 'react';
import {
  BookOpen, HelpCircle, Cpu, FileText, ArrowRight,
  GraduationCap, Users, Eye,
} from 'lucide-react';
import { useSettings } from '../../settings';
import { SettingsBar } from '../common';
import type { ApiUser } from '../../api/client';

interface HomeMenuProps {
  users: ApiUser[];
  onEnter: (userId: string, guest?: boolean) => void;
  currentUserId?: string;
}

const STEPS = [
  { icon: HelpCircle, key: 'f2' },
  { icon: Cpu, key: 'f3' },
  { icon: FileText, key: 'f4' },
  { icon: BookOpen, key: 'f1' },
] as const;

export const HomeMenu: React.FC<HomeMenuProps> = ({ users, onEnter }) => {
  const { t, lang } = useSettings();
  const students = users.filter((u) => u.role === 'hs');
  const teachers = users.filter((u) => u.role === 'gv');

  return (
    <div className="ml-scroll h-screen overflow-y-auto bg-slate-50 text-slate-800">
      <header className="h-16 border-b border-slate-200 bg-white px-6 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 grid place-items-center">
            <div className="w-4 h-4 border-2 border-white rounded-sm" />
          </div>
          <h1 className="text-lg font-bold tracking-tight uppercase">ModuLab</h1>
        </div>
        <SettingsBar />
      </header>

      <div className="max-w-5xl mx-auto px-6 md:px-8">
        {/* Giới thiệu */}
        <section className="py-12 md:py-16 border-b border-slate-200">
          <h2 className="text-3xl md:text-4xl font-bold leading-snug max-w-2xl mb-5">
            {t('home.hero.title')}
          </h2>
          <p className="text-[clamp(15px,1.05vw,17.5px)] text-slate-700 max-w-3xl leading-relaxed mb-4">
            {t('home.hero.intro')}
          </p>
          <p className="text-[clamp(14px,0.98vw,16.5px)] text-slate-500 max-w-2xl leading-relaxed">
            {t('home.hero.sub')}
          </p>

          <dl className="flex flex-wrap gap-x-10 gap-y-3 mt-8">
            {[
              ['75', t('home.stat.questions')],
              ['13', t('home.stat.parts')],
              ['4', lang === 'vi' ? 'phần chính' : 'main sections'],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="text-2xl font-bold text-indigo-700 leading-none">{n}</dt>
                <dd className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 mt-1">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Chọn tài khoản */}
        <section className="py-10 border-b border-slate-200">
          <h3 className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-500 uppercase tracking-widest mb-4">
            {t('home.chooseRole')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RoleCard icon={GraduationCap} title={t('home.role.student')}
              caption={`${students.length} ${lang === 'vi' ? 'tài khoản' : 'accounts'}`}>
              {students.slice(0, 3).map((u) => (
                <AccountRow key={u.id} label={u.name} onClick={() => onEnter(u.id)} />
              ))}
            </RoleCard>

            <RoleCard icon={Users} title={t('home.role.teacher')}
              caption={lang === 'vi' ? 'Xem tiến độ cả lớp' : 'Track the whole class'}>
              {teachers.map((u) => (
                <AccountRow key={u.id} label={u.name} onClick={() => onEnter(u.id)} />
              ))}
            </RoleCard>

            <RoleCard icon={Eye} title={t('home.role.guest')}
              caption={lang === 'vi' ? 'Xem thử, không lưu kết quả' : 'Look around, nothing saved'}>
              <AccountRow label={t('home.enter')}
                onClick={() => onEnter(students[0]?.id ?? users[0]?.id, true)} />
            </RoleCard>
          </div>
        </section>

        {/* Bốn bước */}
        <section className="py-10">
          <h3 className="text-[clamp(13px,0.9vw,15.5px)] font-bold text-slate-500 uppercase tracking-widest mb-4">
            {t('home.steps')}
          </h3>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <li key={s.key} className="bg-white rounded-xl border border-slate-200 p-5">
                <s.icon className="w-5 h-5 text-indigo-600 mb-3" />
                <h4 className="text-[clamp(15px,1.05vw,17.5px)] font-bold mb-1.5">{t(`home.${s.key}.title` as never)}</h4>
                <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 leading-relaxed">{t(`home.${s.key}.desc` as never)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="border-t border-slate-200 py-6 px-6 md:px-8">
        <p className="max-w-5xl mx-auto text-[13px] text-slate-400">
          ModuLab · {lang === 'vi' ? 'Phòng thực hành Vật lí điện học' : 'Virtual electricity lab'}
        </p>
      </footer>
    </div>
  );
};

const RoleCard: React.FC<{
  icon: React.ElementType; title: string; caption: string; children: React.ReactNode;
}> = ({ icon: Icon, title, caption, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-100">
      <Icon className="w-5 h-5 text-indigo-600" />
      <div className="min-w-0">
        <div className="text-[clamp(14px,0.98vw,16.5px)] font-bold leading-tight">{title}</div>
        <div className="text-[13px] text-slate-500 truncate">{caption}</div>
      </div>
    </div>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const AccountRow: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button onClick={onClick}
    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-indigo-50 flex items-center justify-between group transition-colors">
    <span className="text-[clamp(13px,0.9vw,15.5px)] font-medium truncate">{label}</span>
    <ArrowRight className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);
