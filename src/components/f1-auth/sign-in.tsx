/**
 * Màn hình đăng nhập và đăng kí.
 *
 * Trước đây phần này chỉ là một danh sách tài khoản có sẵn để bấm chọn, nên ai
 * mở trang cũng vào được sổ điểm của giáo viên. Giờ mỗi người một tài khoản
 * riêng có mật khẩu, và máy chủ mới là nơi quyết định ai được xem gì.
 */
import React, { useState } from 'react';
import {
  LogIn, UserPlus, Loader2, AlertCircle, Eye, EyeOff, GraduationCap, School, ArrowLeft,
} from 'lucide-react';
import { api } from '../../api/client';
import type { ApiUser } from '../../api/client';

type Mode = 'login' | 'register';

interface Props {
  onSignedIn: (user: ApiUser) => void;
  /** Vào xem thử mà không ghi lại gì; để trống thì không hiện lối này */
  onGuest?: () => void;
  /** Quay về trang giới thiệu */
  onBack?: () => void;
}

const label = 'block text-[clamp(12.5px,0.86vw,15px)] font-semibold text-slate-600 mb-1';
const field = `w-full h-11 px-3 rounded-xl border border-slate-300 bg-white text-slate-900
  text-[clamp(13px,0.9vw,15.5px)] outline-none transition-colors
  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60`;

export const SignIn: React.FC<Props> = ({ onSignedIn, onGuest, onBack }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<'hs' | 'gv'>('hs');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = mode === 'login'
        ? await api.login(form.email, form.password)
        : await api.register({
          name: form.name, email: form.email, password: form.password, role,
        });
      onSignedIn(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không kết nối được máy chủ.');
    } finally {
      setBusy(false);
    }
  };

  const dangKi = mode === 'register';

  return (
    <div className="w-full max-w-md">
      {onBack && (
        <button onClick={onBack}
          className="mb-3 inline-flex items-center gap-1.5 text-[clamp(12.5px,0.86vw,15px)]
            text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
        </button>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h2 className="text-[clamp(17px,1.25vw,21px)] font-bold text-slate-900">
          {dangKi ? 'Tạo tài khoản ModuLab' : 'Đăng nhập ModuLab'}
        </h2>
        <p className="mt-1 text-[clamp(13px,0.9vw,15.5px)] text-slate-500">
          {dangKi
            ? 'Bài làm, điểm số và báo cáo sẽ được lưu vào tài khoản này.'
            : 'Dùng email và mật khẩu em đã đăng kí.'}
        </p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {dangKi && (
            <>
              <div>
                <span className={label}>Em là</span>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'hs', text: 'Học sinh', Icon: GraduationCap },
                    { id: 'gv', text: 'Giáo viên', Icon: School },
                  ] as const).map(({ id, text, Icon }) => (
                    <button key={id} type="button" onClick={() => setRole(id)}
                      aria-pressed={role === id}
                      className={`h-11 inline-flex items-center justify-center gap-2 rounded-xl border
                        font-semibold text-[clamp(13px,0.9vw,15.5px)] transition-colors ${
                        role === id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'}`}>
                      <Icon className="w-4 h-4" /> {text}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={label} htmlFor="ml-name">Họ và tên</label>
                <input id="ml-name" className={field} value={form.name} onChange={set('name')}
                  disabled={busy} autoComplete="name" placeholder="Nguyễn Văn An" required />
              </div>
            </>
          )}

          <div>
            <label className={label} htmlFor="ml-email">Email</label>
            <input id="ml-email" type="email" className={field} value={form.email} onChange={set('email')}
              disabled={busy} autoComplete="email" placeholder="an@thpt.edu.vn" required />
          </div>

          <div>
            <label className={label} htmlFor="ml-pw">Mật khẩu</label>
            <div className="relative">
              <input id="ml-pw" type={showPw ? 'text' : 'password'} className={`${field} pr-11`}
                value={form.password} onChange={set('password')} disabled={busy}
                autoComplete={dangKi ? 'new-password' : 'current-password'}
                placeholder={dangKi ? 'Ít nhất 6 kí tự' : '••••••'} required />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-1 top-1 h-9 w-9 inline-flex items-center justify-center
                  rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {dangKi && (
            <p className="text-[clamp(12px,0.82vw,14px)] text-slate-500">
              {role === 'hs'
                ? 'Vào lớp sau khi đăng kí: giáo viên sẽ cho em một mã lớp dạng 1204N2 để nhập trong ứng dụng.'
                : 'Tạo lớp sau khi đăng nhập, trong mục quản lí lớp. Hệ thống sẽ sinh mã để thầy cô phát cho học sinh.'}
            </p>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200
              bg-rose-50 px-3 py-2.5 text-[clamp(12.5px,0.86vw,15px)] text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={busy}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl
              bg-indigo-600 text-white font-bold text-[clamp(13px,0.9vw,15.5px)]
              hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {busy
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lí…</>
              : dangKi
                ? <><UserPlus className="w-4 h-4" /> Tạo tài khoản</>
                : <><LogIn className="w-4 h-4" /> Đăng nhập</>}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-x-2 gap-y-1
          text-[clamp(12.5px,0.86vw,15px)]">
          <span className="text-slate-500">{dangKi ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</span>
          <button type="button" disabled={busy}
            onClick={() => { setMode(dangKi ? 'login' : 'register'); setError(null); }}
            className="font-semibold text-indigo-700 hover:underline">
            {dangKi ? 'Đăng nhập' : 'Đăng kí ngay'}
          </button>
          {onGuest && (
            <button type="button" onClick={onGuest}
              className="ml-auto text-slate-500 hover:text-slate-800 transition-colors">
              Vào xem thử
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
