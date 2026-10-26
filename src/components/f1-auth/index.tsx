/**
 * Trang tài khoản: xem thông tin, đổi lớp hoặc nhóm, đổi mật khẩu, đăng xuất.
 *
 * Bản trước ghi "✓ Supabase Realtime" và "🔒 Supabase Row Level Security (RLS)"
 * trong khi dự án không dùng Supabase, và cũng chưa có đăng nhập thật nên không
 * có phân quyền nào cả. Những dòng đó đã bỏ. Chỗ này giờ nói đúng cái đang chạy:
 * phiên đăng nhập lưu ở bảng sessions, và máy chủ kiểm vai trò ở từng điểm cuối.
 */
import React, { useState } from 'react';
import { User } from '../../types';
import { BentoCard } from '../common';
import {
  Users, UserCheck, KeyRound, LogOut, ShieldCheck, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { api } from '../../api/client';
import { JoinClass } from './join-class';

interface AuthAccountViewProps {
  currentUser: User;
  isGuest?: boolean;
  onUpdateUser: (updated: Partial<User>) => void;
  onSignOut: () => void;
}

const field = `w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-900
  text-[clamp(13px,0.9vw,15.5px)] outline-none transition-colors
  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60`;
const label = 'block text-[clamp(12.5px,0.86vw,15px)] font-semibold text-slate-600 mb-1';

const VAI_TRO: Record<string, { text: string; cls: string }> = {
  gv: { text: 'Giáo viên bộ môn', cls: 'bg-amber-100 text-amber-800' },
  dev: { text: 'Developer', cls: 'bg-indigo-100 text-indigo-800' },
  hs: { text: 'Học sinh THPT', cls: 'bg-emerald-100 text-emerald-800' },
};

const Note: React.FC<{ kind: 'ok' | 'err'; text: string }> = ({ kind, text }) => (
  <div role={kind === 'err' ? 'alert' : undefined}
    className={`flex items-start gap-2 rounded-xl border px-3 py-2.5
      text-[clamp(12.5px,0.86vw,15px)] ${kind === 'err'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
    {kind === 'err' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
    <span className="min-w-0">{text}</span>
  </div>
);

export const AuthAccountView: React.FC<AuthAccountViewProps> = ({
  currentUser, isGuest, onUpdateUser, onSignOut,
}) => {
  const [pw, setPw] = useState({ old: '', next: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwNote, setPwNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwNote(null); setSavingPw(true);
    try {
      await api.changePassword(pw.old, pw.next);
      setPw({ old: '', next: '' });
      /* Máy chủ xoá hết phiên cũ khi đổi mật khẩu, nên lời gọi kế tiếp sẽ bị từ
         chối và ứng dụng tự đưa về màn đăng nhập. Báo trước cho người dùng biết. */
      setPwNote({ kind: 'ok', text: 'Đã đổi mật khẩu. Mọi thiết bị khác bị đăng xuất; em cần đăng nhập lại.' });
    } catch (err) {
      setPwNote({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
    } finally { setSavingPw(false); }
  };

  const vt = VAI_TRO[currentUser.role] ?? VAI_TRO.hs;

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 h-full overflow-y-auto pr-1 pb-4 font-sans">
      <BentoCard className="md:col-span-4" title="Tài khoản của em"
        subtitle={isGuest ? 'Đang xem thử — chưa đăng nhập' : `Xin chào, ${currentUser.name}!`}>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-[clamp(13px,0.9vw,15.5px)]">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Thông tin định danh</span>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Họ và tên</span>
              <span className="font-bold text-slate-800 text-right">{currentUser.name}</span>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Email</span>
              <span className="font-mono text-slate-700 truncate">{currentUser.email || '—'}</span>
            </div>
            <div className="flex justify-between gap-2 py-1">
              <span className="text-slate-500">Vai trò</span>
              <span className={`px-2 py-0.5 rounded font-bold ${isGuest ? 'bg-slate-200 text-slate-600' : vt.cls}`}>
                {isGuest ? 'Khách' : vt.text}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Lớp và nhóm thực hành</span>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Mã lớp</span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {currentUser.classCode || 'Chưa vào lớp'}
              </span>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Nhóm thực hành</span>
              <span className="font-bold text-slate-800 text-right">{currentUser.teamCode || '—'}</span>
            </div>
            <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Số thứ tự trong lớp</span>
              <span className="font-mono font-bold text-slate-800">
                {currentUser.seatNo ?? '—'}
              </span>
            </div>
            <div className="flex justify-between gap-2 py-1">
              <span className="text-slate-500">Nơi lưu bài làm</span>
              <span className={`font-bold ${isGuest ? 'text-amber-700' : 'text-emerald-700'}`}>
                {isGuest ? 'Chỉ trong trình duyệt' : 'Cơ sở dữ liệu lớp'}
              </span>
            </div>
          </div>
        </div>

        {!isGuest && currentUser.role === 'hs' && (
          <div className="mt-5 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2.5 flex items-center gap-2
              text-[clamp(13px,0.9vw,15.5px)]">
              <KeyRound className="w-4 h-4 text-indigo-600" /> Lớp và nhóm thực hành
            </h4>
            <JoinClass />
          </div>
        )}

        {!isGuest && currentUser.role === 'gv' && (
          <div className="mt-5 pt-4 border-t border-slate-200">
            <p className="text-[clamp(12.5px,0.86vw,15px)] text-slate-600">
              Lớp và nhóm quản lí ở mục <strong className="font-semibold text-slate-800">ModuManage</strong>:
              tạo lớp, chia nhóm, và lấy mã để phát cho học sinh.
            </p>
          </div>
        )}

      </BentoCard>

      <BentoCard className="md:col-span-2 flex flex-col justify-between" title="Bảo mật">
        {isGuest ? (
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 leading-relaxed">
            Em đang xem thử nên không có tài khoản nào để bảo vệ. Đăng kí một tài khoản
            thì bài làm, điểm số và báo cáo mới được lưu lại.
          </p>
        ) : (
          <form onSubmit={savePassword} className="space-y-3">
            <div>
              <label className={label} htmlFor="tk-oldpw">Mật khẩu hiện tại</label>
              <input id="tk-oldpw" type="password" className={field} value={pw.old} required
                disabled={savingPw} autoComplete="current-password"
                onChange={(e) => setPw((v) => ({ ...v, old: e.target.value }))} />
            </div>
            <div>
              <label className={label} htmlFor="tk-newpw">Mật khẩu mới</label>
              <input id="tk-newpw" type="password" className={field} value={pw.next} required
                disabled={savingPw} autoComplete="new-password" placeholder="Ít nhất 6 kí tự"
                onChange={(e) => setPw((v) => ({ ...v, next: e.target.value }))} />
            </div>
            <button type="submit" disabled={savingPw}
              className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl
                border border-slate-300 bg-white text-slate-700 font-bold
                text-[clamp(13px,0.9vw,15.5px)] hover:border-indigo-400 disabled:opacity-60 transition-colors">
              {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Đổi mật khẩu
            </button>
            {pwNote && <Note {...pwNote} />}
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
          <p className="text-[clamp(12px,0.82vw,14px)] text-slate-500 flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
            <span>
              Mật khẩu lưu dưới dạng chuỗi băm scrypt kèm muối riêng, không ai đọc lại được.
              Quyền xem của từng vai trò do máy chủ quyết định ở từng điểm cuối.
            </span>
          </p>
          <button onClick={onSignOut}
            className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl
              border border-slate-300 bg-white text-slate-700 font-bold
              text-[clamp(13px,0.9vw,15.5px)] hover:border-rose-400 hover:text-rose-700 transition-colors">
            <LogOut className="w-4 h-4" /> {isGuest ? 'Thoát chế độ khách' : 'Đăng xuất'}
          </button>
        </div>
      </BentoCard>
    </div>
  );
};
