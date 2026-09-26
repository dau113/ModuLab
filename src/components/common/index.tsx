import React, { useState } from 'react';
import { User, LabStep, UserRole } from '../../types';
import { 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  LogOut,
  LayoutGrid,
} from 'lucide-react';
import { useTheme } from '../../theme';
import { useSettings, ACCENTS } from '../../settings';
import { APP_VERSION } from '../../version';
import { Settings } from 'lucide-react';
import { music, isSfxEnabled, toggleSfx } from '../../audio';

interface TopNavProps {
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  availableUsers: User[];
  onGoHome: () => void;
  /** Vị trí hiện tại, ví dụ "Khởi động — Ôn tập nhanh" */
  location?: string;
}

/**
 * Cài đặt gom vào một nút bánh răng.
 *
 * Trước đây sáu chấm màu chủ đạo nằm thẳng trên thanh trên, chiếm gần một phần
 * năm bề ngang và kéo mắt về phía nó mỗi lần nhìn lên — không hợp với một công
 * cụ học tập. Giờ chúng nằm trong bảng cài đặt, mở khi cần.
 */
/**
 * Nút cài đặt.
 *
 * `tone` chỉ đổi kiểu của nút bấm: mặc định đặt trên nền sáng, còn `onDark`
 * dùng khi nút nằm đè lên ảnh chụp ở trang chủ.
 */
export const SettingsMenu: React.FC<{ tone?: 'onLight' | 'onDark' }> = ({ tone = 'onLight' }) => {
  const { lang, accent, setAccent, t } = useSettings();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(music.isOn());
  const [sfxOn, setSfxOn] = useState(isSfxEnabled());

  const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-body text-slate-600">{label}</span>
      {children}
    </div>
  );

  const Toggle: React.FC<{ on: boolean; onClick: () => void; onLabel: string; offLabel: string }> =
    ({ on, onClick, onLabel, offLabel }) => (
      <button onClick={onClick}
        className="h-8 px-3 rounded-lg border border-slate-200 text-body font-medium text-slate-700 hover:bg-slate-50 transition-colors">
        {on ? onLabel : offLabel}
      </button>
    );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={t('app.settings')}
        aria-expanded={open}
        className={`h-9 w-9 grid place-items-center rounded-lg border transition-colors ${
          tone === 'onDark'
            ? 'border-white/30 text-white/80 hover:bg-white/15'
            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
        }`}
      >
        <Settings className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-slate-200
            bg-white shadow-lg p-4">
            <p className="text-body font-semibold text-slate-900 mb-1">
              {t('app.settings')}
            </p>

            <div className="divide-y divide-slate-100">
              <Row label={t('app.theme')}>
                <Toggle on={theme === 'dark'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  onLabel={t('app.theme.dark')} offLabel={t('app.theme.light')} />
              </Row>

              <Row label="Nhạc nền">
                <Toggle on={musicOn} onClick={() => setMusicOn(music.toggle())}
                  onLabel="Đang bật" offLabel="Đang tắt" />
              </Row>

              <Row label="Tiếng thao tác">
                <Toggle on={sfxOn} onClick={() => setSfxOn(toggleSfx())}
                  onLabel="Đang bật" offLabel="Đang tắt" />
              </Row>

              <div className="pt-3">
                <p className="text-body text-slate-600 mb-2">{t('app.accent')}</p>
                <div className="flex items-center gap-2">
                  {ACCENTS.map((a) => (
                    <button key={a.id} onClick={() => setAccent(a.id)}
                      title={lang === 'en' ? a.en : a.vi}
                      aria-label={lang === 'en' ? a.en : a.vi}
                      className={`w-6 h-6 rounded-full transition-all ${
                        accent === a.id ? 'ring-2 ring-offset-2 ring-slate-400' : 'opacity-50 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: a.swatch }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/** Giữ tên cũ cho những chỗ đang dùng */
export const SettingsBar = SettingsMenu;

/**
 * Thanh trên của khu làm việc — đúng bốn thành phần.
 *
 * Trong lúc làm bài, học sinh chỉ cần biết ba điều: đang ở ứng dụng nào, đang
 * ở đâu trong ứng dụng, và mình là ai. Thứ tư là lối vào cài đặt. Mọi tuỳ chọn
 * đặt một lần như âm thanh, màu chủ đạo hay chế độ tối đều nằm trong đó.
 */
export const TopNav: React.FC<TopNavProps> = ({
  currentUser, onSwitchUser, availableUsers, onGoHome, location,
}) => (
  <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center gap-4 shrink-0 z-20">
    {/* 1 — Tên ứng dụng, bấm để về trang chủ */}
    <button onClick={onGoHome} title="Về trang chủ"
      className="text-h3 font-medium tracking-tight text-slate-900 hover:text-slate-500 transition-colors shrink-0">
      ModuLab
    </button>

    {/* 2 — Vị trí hiện tại */}
    {/* Đường dẫn vị trí: mục cha nhạt, mục đang mở đậm hơn */}
    {location && (
      <nav aria-label="Vị trí hiện tại" className="flex items-center gap-1.5 text-body min-w-0">
        {location.split(' — ').map((part, i, arr) => (
          <React.Fragment key={part}>
            {i > 0 && <span className="text-slate-300 shrink-0">/</span>}
            <span className={`truncate ${i === arr.length - 1 ? 'text-slate-800' : 'text-slate-500'}`}
              aria-current={i === arr.length - 1 ? 'page' : undefined}>
              {part}
            </span>
          </React.Fragment>
        ))}
      </nav>
    )}

    <div className="ml-auto flex items-center gap-2">
      {/* 3 — Tài khoản, bấm để đổi */}
      <div className="relative group">
        <button className="h-9 px-2.5 rounded-lg hover:bg-slate-50 text-body text-slate-700 transition-colors">
          {currentUser.name}
        </button>

        <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200
          p-1.5 hidden group-hover:block z-50">
          <p className="text-body text-slate-500 px-2.5 py-1.5">Đổi tài khoản</p>
          {availableUsers.map((u) => (
            <button key={u.id} onClick={() => onSwitchUser(u.id)}
              className={`w-full text-left px-2.5 py-2 rounded-md text-body flex items-center justify-between transition-colors ${ u.id === currentUser.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50' }`}>
              <span>
                {u.name}
                <span className="text-slate-400"> · {u.role === 'gv' ? 'Giáo viên' : u.teamCode}</span>
              </span>
              {u.id === currentUser.id && <CheckCircle2 className="w-4 h-4 text-slate-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* 4 — Cài đặt */}
      <SettingsMenu />
    </div>
  </header>
);

interface SidebarProps {
  currentStep: LabStep | 'teacher';
  onSelectStep: (step: LabStep | 'teacher') => void;
  userRole: UserRole;
  labTitle: string;
  isReportPassed?: boolean;
  /** Đang xem ở chế độ khách; nhắc ở cuối thanh bên cho khỏi chắn nội dung */
  isGuest?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentStep, 
  onSelectStep, 
  userRole,
  labTitle,
  isGuest,
  isReportPassed
}) => {
  const { t } = useSettings();
  const steps: {
    id: LabStep | 'teacher';
    label: string;
    roleOnly?: UserRole;
    children?: { id: LabStep; label: string }[];
  }[] = [
    {
      id: 'quiz',
      label: t('nav.quiz'),
      children: [
        { id: 'quiz', label: t('nav.quiz.drill') },
        { id: 'quest', label: t('nav.quest') },
      ],
    },
    { id: 'circuit', label: t('nav.circuit') },
    { id: 'report', label: t('nav.report') },
    {
      id: 'theory',
      label: t('nav.theory'),
      children: [
        { id: 'theory', label: t('nav.theory.lesson') },
        { id: 'tools', label: t('nav.theory.tools') },
      ],
    },
    { id: 'teacher', label: t('nav.teacher'), roleOnly: 'gv' },
  ];

  return (
    <aside className="w-56 bg-white border-r border-slate-200 py-4 flex flex-col gap-6 shrink-0 z-20">
      <div>
        <p className="px-5 mb-2 text-body text-slate-400">
          Bài thực hành 01
        </p>

        <nav className="flex flex-col">
          {steps.map((s) => {
            if (s.roleOnly && s.roleOnly !== userRole) return null;
            const childIds = s.children?.map((c) => c.id) ?? [];
            const isActive = s.children
              ? childIds.includes(currentStep as LabStep)
              : currentStep === s.id;

            return (
              <div key={s.id}>
                {/* Mục đang mở đánh dấu bằng vạch dọc bên trái, không tô nền cả ô */}
                <button
                  onClick={() => onSelectStep(s.children ? s.children[0].id : s.id)}
                  className={`w-full text-left pl-5 pr-4 py-2.5 border-l-2 transition-colors text-body ${ isActive ? 'border-indigo-600 text-slate-900 font-medium' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50' }`}
                >
                  {s.label}
                </button>

                {/* Mục con của phần Tài liệu, chỉ hiện khi đang ở phần này */}
                {s.children && isActive && (
                  <div className="flex flex-col">
                    {s.children.map((c) => {
                      const childActive = currentStep === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => onSelectStep(c.id)}
                          className={`w-full text-left pl-9 pr-4 py-2 border-l-2 transition-colors text-body ${ childActive ? 'border-indigo-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50' }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {isReportPassed && (
        <p className="px-5 text-body text-emerald-700">
          Mạch đã được xác nhận đạt.
        </p>
      )}

      {isGuest && (
        <p className="mt-auto px-5 pt-4 border-t border-slate-200 text-body text-slate-400 leading-relaxed">
          Chế độ khách — kết quả không ghi vào sổ điểm.
        </p>
      )}
    </aside>
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
                <h3 className="text-h3 opacity-90 mb-0.5">{title}</h3>
                {subtitle && <p className="text-body opacity-90">{subtitle}</p>}
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
            {title && <h3 className="text-h3 mb-1">{title}</h3>}
            {subtitle && <p className="text-body text-slate-600">{subtitle}</p>}
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
    danger: 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse font-semibold',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
    info: 'bg-blue-50 text-blue-800 border-blue-300',
  };

  const icons = {
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    info: <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />,
  };

  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-body leading-relaxed ${styles[type]} ${className}`}>
      {icons[type]}
      <span className="flex-1">{text}</span>
    </div>
  );
};

/**
 * Nhãn phiên bản dán ở góc dưới bên trái màn hình, hiện ở mọi trang.
 * Không chắn thao tác vì không nhận sự kiện chuột.
 */
export const VersionBadge: React.FC = () => (
  <div className="fixed bottom-2 left-2 z-50 pointer-events-none select-none px-2 py-1 rounded-md bg-slate-900/70 text-white text-meta font-semibold tracking-wide">
    ModuLab v{APP_VERSION}
  </div>
);
