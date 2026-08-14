/**
 * Cài đặt chung của ứng dụng: ngôn ngữ (Việt / Anh) và phong cách giao diện
 * (rực rỡ có hiệu ứng / đơn giản gọn gàng).
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'vi' | 'en';

/** Sáu màu chủ đạo cho người dùng chọn */
export const ACCENTS = [
  { id: 'indigo', vi: 'Chàm', en: 'Indigo', swatch: '#4f46e5' },
  { id: 'teal', vi: 'Mòng két', en: 'Teal', swatch: '#0d9488' },
  { id: 'forest', vi: 'Xanh lá', en: 'Forest', swatch: '#15803d' },
  { id: 'amber', vi: 'Hổ phách', en: 'Amber', swatch: '#b45309' },
  { id: 'crimson', vi: 'Đỏ son', en: 'Crimson', swatch: '#be123c' },
  { id: 'plum', vi: 'Mận chín', en: 'Plum', swatch: '#7e22ce' },
] as const;

export type Accent = typeof ACCENTS[number]['id'];

const LANG_KEY = 'modulab-lang';
const ACCENT_KEY = 'modulab-accent';

/* ------------------------------------------------------------------ */
/* Từ điển                                                             */
/* ------------------------------------------------------------------ */

const DICT = {
  /* Chung */
  'app.tagline': ['Phòng thực hành Vật lí điện học ảo', 'Virtual physics lab for electricity'],
  'app.back': ['Quay lại', 'Back'],
  'app.home': ['Trang chủ', 'Home'],
  'app.start': ['Bắt đầu', 'Start'],
  'app.continue': ['Tiếp tục', 'Continue'],
  'app.close': ['Đóng', 'Close'],
  'app.save': ['Lưu', 'Save'],
  'app.cancel': ['Huỷ', 'Cancel'],
  'app.loading': ['Đang nạp dữ liệu…', 'Loading data…'],
  'app.settings': ['Cài đặt', 'Settings'],
  'app.language': ['Ngôn ngữ', 'Language'],
  'app.theme': ['Màu nền', 'Colour mode'],
  'app.theme.light': ['Sáng', 'Light'],
  'app.theme.dark': ['Tối', 'Dark'],
  'app.accent': ['Màu chủ đạo', 'Accent colour'],

  /* Điều hướng */
  'nav.progress': ['Tiến trình bài học', 'Lesson progress'],
  'nav.current': ['Thực hành hiện tại:', 'Current lab:'],
  'nav.theory': ['Tài liệu', 'Reference'],
  'nav.theory.lesson': ['Lý thuyết ôn tập', 'Lesson notes'],
  'nav.theory.prep': ['Chuẩn bị thí nghiệm', 'Lab preparation'],
  'nav.theory.tools': ['Khám phá dụng cụ', 'Explore instruments'],
  'nav.quiz': ['Khởi động', 'Warm-up'],
  'nav.circuit': ['Thực hành', 'Lab practice'],
  'nav.report': ['Báo cáo thực hành', 'Lab report'],
  'nav.teacher': ['Bảng quản lý', 'Class dashboard'],

  /* Trang chủ */
  'home.hero.title': ['Học Vật lí điện học bằng cách tự tay lắp mạch', 'Learn electricity by wiring circuits yourself'],
  'home.hero.sub': [
    'Lắp mạch, đo đạc và viết báo cáo ngay trên máy — an toàn tuyệt đối, sai bao nhiêu lần cũng được.',
    'Wire, measure and report right on your screen — perfectly safe, and you can fail as often as you like.',
  ],
  'home.enter': ['Vào phòng thực hành', 'Enter the lab'],
  'home.chooseRole': ['Chọn tài khoản để bắt đầu', 'Pick an account to start'],
  'home.role.student': ['Học sinh', 'Student'],
  'home.role.teacher': ['Giáo viên', 'Teacher'],
  'home.role.guest': ['Khách tham quan', 'Guest'],
  'home.features': ['Ứng dụng có gì', 'What is inside'],
  'home.steps': ['Các phần của ứng dụng', 'What you can do here'],
  'home.f1.title': ['Tài liệu', 'Reference'],
  'home.f1.desc': ['Ôn công thức, xem trước bộ dụng cụ và danh sách cần chuẩn bị.', 'Review formulas, preview the kit and the checklist.'],
  'home.f2.title': ['Khởi động', 'Warm-up quiz'],
  'home.f2.desc': ['75 câu hỏi chia ba chủ đề, tính điểm và có bảng xếp hạng.', '75 questions across three topics, scored with a leaderboard.'],
  'home.f3.title': ['Thực hành', 'Lab practice'],
  'home.f3.desc': ['Bộ giải mạch thật: nối sai là hệ thống báo ngay, không cháy thiết bị.', 'A real solver: wire it wrong and it warns you, nothing burns.'],
  'home.f4.title': ['Báo cáo thực hành', 'Lab report'],
  'home.f4.desc': ['Nhập số liệu, tự tính sai số và nộp cho giáo viên.', 'Enter data, compute the error and submit to your teacher.'],
  'home.stat.questions': ['câu hỏi', 'questions'],
  'home.stat.parts': ['linh kiện mô phỏng', 'simulated parts'],
  'home.stat.safe': ['an toàn tuyệt đối', 'completely safe'],

  /* Khởi động */
  'quiz.title': ['Khởi động', 'Warm-up'],
  'quiz.pickTopic': ['Chọn chủ đề để khởi động', 'Choose a topic to warm up'],
  'quiz.allTopics': ['Tổng hợp cả ba chủ đề', 'All three topics'],
  'quiz.questionCount': ['Số câu mỗi lượt', 'Questions per round'],
  'quiz.begin': ['Bắt đầu khởi động', 'Start warm-up'],
  'quiz.question': ['Câu', 'Question'],
  'quiz.correct': ['Chính xác!', 'Correct!'],
  'quiz.wrong': ['Chưa đúng', 'Not quite'],
  'quiz.next': ['Câu tiếp theo', 'Next question'],
  'quiz.finish': ['Xem kết quả', 'See results'],
  'quiz.streak': ['chuỗi đúng', 'streak'],
  'quiz.timeUp': ['Hết giờ!', 'Time up!'],
  'quiz.score': ['Điểm số', 'Score'],
  'quiz.again': ['Chơi lại', 'Play again'],
  'quiz.explain': ['Giải thích', 'Explanation'],

  /* Chuẩn bị thí nghiệm */
  'prep.title': ['Chuẩn bị trước khi vào phòng thực hành', 'Before you enter the lab'],
  'prep.checklist': ['Danh sách dụng cụ cần chuẩn bị', 'Equipment checklist'],
  'prep.steps': ['Các bước tiến hành', 'Procedure'],
  'prep.safety': ['Quy tắc an toàn', 'Safety rules'],
  'prep.done': ['Đã chuẩn bị', 'Ready'],
  'prep.progress': ['Đã chuẩn bị', 'Prepared'],
  'prep.items': ['dụng cụ', 'items'],

  /* Mô phỏng */
  'sim.search': ['Tìm linh kiện…', 'Search parts…'],
  'sim.tray': ['Khay linh kiện', 'Parts tray'],
  'sim.empty': ['Bàn lắp đang trống — chọn linh kiện từ khay bên trái để bắt đầu.', 'The bench is empty — pick parts from the tray to begin.'],
  'sim.noResult': ['Không tìm thấy linh kiện nào khớp.', 'No matching parts.'],
  'sim.board': ['Bảng lắp ráp mạch điện', 'Circuit assembly board'],
} as const;

export type TKey = keyof typeof DICT;

/* ------------------------------------------------------------------ */
/* Ngữ cảnh                                                            */
/* ------------------------------------------------------------------ */

interface SettingsValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
  t: (key: TKey) => string;
}

const SettingsContext = createContext<SettingsValue | null>(null);

const readStored = <T extends string>(key: string, allowed: T[], fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = window.localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => readStored(LANG_KEY, ['vi', 'en'], 'vi'));
  const [accent, setAccent] = useState<Accent>(
    () => readStored(ACCENT_KEY, ACCENTS.map((a) => a.id) as Accent[], 'indigo'),
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    try { window.localStorage.setItem(LANG_KEY, lang); } catch { /* bỏ qua */ }
  }, [lang]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    try { window.localStorage.setItem(ACCENT_KEY, accent); } catch { /* bỏ qua */ }
  }, [accent]);

  const value = useMemo<SettingsValue>(() => ({
    lang, setLang, accent, setAccent,
    t: (key: TKey) => DICT[key]?.[lang === 'vi' ? 0 : 1] ?? String(key),
  }), [lang, accent]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsValue => {
  const ctx = useContext(SettingsContext);
  if (ctx) return ctx;
  // Dùng ngoài provider: trả về bản mặc định tiếng Việt để không làm vỡ giao diện
  return {
    lang: 'vi', setLang: () => undefined, accent: 'indigo', setAccent: () => undefined,
    t: (key: TKey) => DICT[key]?.[0] ?? String(key),
  };
};

/** Chọn giữa hai chuỗi theo ngôn ngữ hiện tại, dùng cho dữ liệu lấy từ máy chủ */
export const useBi = () => {
  const { lang } = useSettings();
  return (vi: string, en?: string) => (lang === 'en' && en ? en : vi);
};
