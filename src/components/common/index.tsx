import React from 'react';
import { User, LabStep, UserRole } from '../../types';
import { 
  BookOpen, 
  Wrench, 
  HelpCircle, 
  Cpu, 
  FileText, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  LogOut,
  LayoutGrid,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '../../theme';
import { useSettings, ACCENTS } from '../../settings';
import { Home, Sun, Moon, ClipboardList, Rocket } from 'lucide-react';

interface TopNavProps {
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  availableUsers: User[];
  onGoHome: () => void;
}

/** Cụm cài đặt: ngôn ngữ · màu chủ đạo · sáng tối */
export const SettingsBar: React.FC = () => {
  const { lang, setLang, accent, setAccent, t } = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-3">
      {/* Màu chủ đạo */}
      <div className="flex items-center gap-1" title={t('app.accent')}>
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAccent(a.id)}
            title={lang === 'en' ? a.en : a.vi}
            aria-label={lang === 'en' ? a.en : a.vi}
            className={`w-5 h-5 rounded-full transition-all ${
              accent === a.id
                ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                : 'opacity-60 hover:opacity-100'
            }`}
            style={{ backgroundColor: a.swatch }}
          />
        ))}
      </div>

      <div className="h-6 w-px bg-slate-200" />

      {/* Ngôn ngữ */}
      <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
        {(['vi', 'en'] as const).map((l) => (
          <button key={l} onClick={() => setLang(l)}
            className={`h-7 px-2.5 text-[12px] font-bold transition-colors ${
              lang === l ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Sáng / tối */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={theme === 'dark' ? t('app.theme.light') : t('app.theme.dark')}
        className="w-8 h-7 grid place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </div>
  );
};

export const TopNav: React.FC<TopNavProps> = ({ currentUser, onSwitchUser, availableUsers, onGoHome }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
      <div className="flex items-center gap-4">
        <button onClick={onGoHome} title="Về trang chủ"
          className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 uppercase font-sans">ModuLab</h1>
        </button>

        <button onClick={onGoHome}
          className="ml-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[12px] font-bold flex items-center gap-1.5 transition-colors">
          <Home className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Trang chủ</span>
        </button>
      </div>

      <div className="flex items-center gap-6">
        <SettingsBar />

        {/* User / Team & Role Switcher */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="text-right hidden sm:block">
            <div className="text-[13px] font-bold text-slate-800 flex items-center justify-end gap-1.5">
              <span>{currentUser.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[11.5px] font-extrabold uppercase ${
                currentUser.role === 'gv' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {currentUser.role === 'gv' ? 'Giáo viên' : 'Học sinh'}
              </span>
            </div>
            <div className="text-[11.5px] text-slate-500 font-medium">
              {currentUser.role === 'hs' ? `Lớp: ${currentUser.classCode} • ${currentUser.teamCode}` : `Lớp: ${currentUser.classCode} • Bảng quản lý`}
            </div>
          </div>

          <div className="relative group">
            <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-[13px] cursor-pointer shadow-sm hover:ring-2 hover:ring-indigo-400 transition-all">
              {currentUser.name.split(' ').slice(-1)[0][0]}
            </div>
            {/* Dropdown to switch accounts */}
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2 hidden group-hover:block z-50">
              <div className="text-[11.5px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1">
                Chuyển đổi tài khoản mô phỏng
              </div>
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onSwitchUser(u.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] flex items-center justify-between font-medium transition-colors ${
                    u.id === currentUser.id 
                      ? 'bg-indigo-50 text-indigo-700 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div>{u.name}</div>
                    <div className="text-[11.5px] text-slate-400">{u.role === 'gv' ? 'Giáo viên Vật lí' : `HS - ${u.teamCode}`}</div>
                  </div>
                  {u.id === currentUser.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

interface SidebarProps {
  currentStep: LabStep | 'teacher';
  onSelectStep: (step: LabStep | 'teacher') => void;
  userRole: UserRole;
  labTitle: string;
  isReportPassed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentStep, 
  onSelectStep, 
  userRole,
  labTitle,
  isReportPassed
}) => {
  const { t } = useSettings();
  const steps: {
    id: LabStep | 'teacher';
    label: string;
    icon: React.ReactNode;
    roleOnly?: UserRole;
    children?: { id: LabStep; label: string; icon: React.ReactNode }[];
  }[] = [
    { id: 'quiz', label: t('nav.quiz'), icon: <Rocket className="w-4 h-4" /> },
    { id: 'circuit', label: t('nav.circuit'), icon: <Cpu className="w-4 h-4" /> },
    { id: 'report', label: t('nav.report'), icon: <FileText className="w-4 h-4" /> },
    {
      id: 'theory',
      label: t('nav.theory'),
      icon: <BookOpen className="w-4 h-4" />,
      children: [
        { id: 'theory', label: t('nav.theory.lesson'), icon: <BookOpen className="w-3.5 h-3.5" /> },
        { id: 'prep', label: t('nav.theory.prep'), icon: <ClipboardList className="w-3.5 h-3.5" /> },
        { id: 'tools', label: t('nav.theory.tools'), icon: <Wrench className="w-3.5 h-3.5" /> },
      ],
    },
    { id: 'teacher', label: t('nav.teacher'), icon: <Users className="w-4 h-4" />, roleOnly: 'gv' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-6 shrink-0 z-10">
      <div>
        <div className="flex items-center justify-between mb-4 px-2">
          <p className="text-[11.5px] font-bold text-slate-400 uppercase tracking-widest">{t('nav.progress')}</p>
          <span className="text-[11.5px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            Module 01
          </span>
        </div>

        <div className="mb-4 px-2 py-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <p className="text-[11.5px] font-bold text-indigo-600 uppercase mb-0.5">{t('nav.current')}</p>
          <p className="text-[13px] font-bold text-slate-800 line-clamp-2 leading-snug">{labTitle}</p>
        </div>

        <nav className="flex flex-col gap-1">
          {steps.map((s) => {
            if (s.roleOnly && s.roleOnly !== userRole) return null;
            const childIds = s.children?.map((c) => c.id) ?? [];
            const isActive = s.children
              ? childIds.includes(currentStep as LabStep)
              : currentStep === s.id;

            return (
              <div key={s.id}>
                <div
                  onClick={() => onSelectStep(s.children ? s.children[0].id : s.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm cursor-pointer transition-all select-none ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`${isActive ? 'text-white' : 'text-slate-400'}`}>{s.icon}</span>
                    <span className="text-[13px]">{s.label}</span>
                  </div>
                  {s.children && (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'text-white rotate-180' : 'text-slate-300'
                    }`} />
                  )}
                </div>

                {/* Hai mục nhỏ của phần Lý thuyết, chỉ hiện khi đang ở phần này */}
                {s.children && isActive && (
                  <div className="mt-1 ml-4 pl-3 border-l-2 border-indigo-100 flex flex-col gap-0.5">
                    {s.children.map((c) => {
                      const childActive = currentStep === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => onSelectStep(c.id)}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all select-none ${
                            childActive
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                          }`}
                        >
                          <span className={`${childActive ? 'text-indigo-600' : 'text-slate-400'}`}>{c.icon}</span>
                          <span className="text-[12.5px]">{c.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

    </aside>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[11.5px] font-medium text-slate-400 uppercase tracking-widest shrink-0">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 font-bold text-slate-600">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div> 
          ModuLab Engine Online
        </span>
        <span>Chương trình GDPT 2018 (Thông tư 32/2018)</span>
      </div>
      <div className="flex gap-4 items-center font-bold text-slate-500">
        <span>Bảo chứng bởi GV Vật lí THPT</span>
        <span>•</span>
        <span>Phiên bản v1.21</span>
      </div>
    </footer>
  );
};

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  accent?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({ 
  children, 
  className = '', 
  title, 
  subtitle, 
  action,
  accent = false 
}) => {
  if (accent) {
    return (
      <section className={`bg-indigo-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col ${className}`}>
        <div className="relative z-10 flex flex-col h-full">
          {title && (
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-[13px] font-bold opacity-80 uppercase tracking-widest mb-0.5">{title}</h3>
                {subtitle && <p className="text-sm font-semibold opacity-90">{subtitle}</p>}
              </div>
              {action && <div>{action}</div>}
            </div>
          )}
          <div className="flex-1 flex flex-col">{children}</div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </section>
    );
  }

  return (
    <section className={`bento-card bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-start mb-4 gap-2">
          <div>
            {title && <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</h3>}
            {subtitle && <p className="text-base font-bold text-slate-800 leading-snug">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </section>
  );
};

interface WarningBadgeProps {
  text: string;
  type?: 'warning' | 'danger' | 'success' | 'info';
  className?: string;
}

export const WarningBadge: React.FC<WarningBadgeProps> = ({ 
  text, 
  type = 'warning',
  className = '' 
}) => {
  const styles = {
    warning: 'bg-amber-50 text-amber-800 border-amber-300',
    danger: 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse font-bold',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    info: 'bg-blue-50 text-blue-800 border-blue-300',
  };

  const icons = {
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    info: <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />,
  };

  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-[13px] leading-relaxed ${styles[type]} ${className}`}>
      {icons[type]}
      <span className="flex-1">{text}</span>
    </div>
  );
};
