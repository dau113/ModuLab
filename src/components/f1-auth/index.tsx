import React, { useState } from 'react';
import { User } from '../../types';
import { BentoCard, WarningBadge } from '../common';
import { Users, UserCheck, ShieldCheck, KeyRound, ArrowRightLeft, LogIn } from 'lucide-react';

interface AuthAccountViewProps {
  currentUser: User;
  onUpdateUser: (updated: Partial<User>) => void;
  onSwitchUserRole: (userId: string) => void;
  availableUsers: User[];
}

export const AuthAccountView: React.FC<AuthAccountViewProps> = ({
  currentUser,
  onUpdateUser,
  onSwitchUserRole,
  availableUsers,
}) => {
  const [classCodeInput, setClassCodeInput] = useState<string>(currentUser.classCode || '11A2-VL');
  const [teamInput, setTeamInput] = useState<string>(currentUser.teamCode || 'Nhóm 3 - Bàn 5');
  const [isJoined, setIsJoined] = useState<boolean>(false);

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ classCode: classCodeInput, teamCode: teamInput });
    setIsJoined(true);
    setTimeout(() => setIsJoined(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 h-full overflow-y-auto pr-1 pb-4 font-sans select-none">
      {/* Account Info Bento Card */}
      <BentoCard 
        className="md:col-span-4" 
        title="Quản lý Tài khoản & Phân quyền (Hệ thống F1)" 
        subtitle={`Xin chào, ${currentUser.name}!`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-[13px]">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Thông tin định danh hệ thống</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400">Họ và tên:</span>
              <span className="font-bold text-slate-800">{currentUser.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400">Email:</span>
              <span className="font-mono text-slate-700">{currentUser.email}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Vai trò CSDL (RLS):</span>
              <span className={`px-2 py-0.5 rounded font-extrabold uppercase ${
                currentUser.role === 'gv' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {currentUser.role === 'gv' ? 'Giáo viên bộ môn' : 'Học sinh THPT'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Tổ chức Lớp & Nhóm thực hành</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400">Mã lớp học:</span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                {currentUser.classCode || 'Chưa tham gia'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-400">Nhóm thực hành:</span>
              <span className="font-bold text-slate-800">{currentUser.teamCode || 'Không áp dụng'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Chế độ đồng bộ:</span>
              <span className="text-emerald-600 font-bold">✓ Supabase Realtime</span>
            </div>
          </div>
        </div>

        {/* Join Class / Team Form */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            <span>Đăng ký tham gia Lớp học & Nhóm mới</span>
          </h4>
          <form onSubmit={handleJoinClass} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
            <div>
              <label className="font-bold text-slate-600 block mb-1">Mã lớp (6 ký tự):</label>
              <input
                type="text"
                required
                maxLength={8}
                value={classCodeInput}
                onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                placeholder="VD: 11A2-VL"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Tên / Mã nhóm (1-6 HS):</label>
              <input
                type="text"
                required
                value={teamInput}
                onChange={(e) => setTeamInput(e.target.value)}
                placeholder="VD: Nhóm 3 - Bàn 5"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                {isJoined ? '✓ Đã cập nhật thành công!' : 'Xác nhận vào Lớp / Nhóm'}
              </button>
            </div>
          </form>
        </div>
      </BentoCard>

      {/* Role Switching Bento Card */}
      <BentoCard className="md:col-span-2 flex flex-col justify-between" accent={true} title="Mô phỏng Vai trò CSDL">
        <div className="space-y-3 text-[13px]">
          <p className="text-indigo-100 leading-relaxed font-medium">
            Trong môi trường xem trước ModuLab, bạn có thể chuyển đổi nhanh giữa tài khoản <strong>Học sinh</strong> và <strong>Giáo viên</strong> để trải nghiệm phân quyền RLS (NT-1 trong TRD).
          </p>
          <div className="space-y-2 mt-4">
            {availableUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => onSwitchUserRole(u.id)}
                className={`w-full p-3 rounded-xl text-left font-bold transition-all flex items-center justify-between ${
                  u.id === currentUser.id
                    ? 'bg-white text-slate-900 shadow-lg scale-[1.02]'
                    : 'bg-indigo-800/80 text-indigo-200 hover:bg-indigo-700 border border-indigo-700'
                }`}
              >
                <div>
                  <div className="text-[13px]">{u.name}</div>
                  <div className="text-[11.5px] opacity-75">{u.role === 'gv' ? 'Giáo viên bộ môn' : `HS • ${u.teamCode}`}</div>
                </div>
                <ArrowRightLeft className={`w-4 h-4 ${u.id === currentUser.id ? 'text-indigo-600' : 'text-indigo-300'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-indigo-500/50 text-[11.5px] text-indigo-200 font-medium">
          🔒 Supabase Row Level Security (RLS) tự động chặn học sinh truy cập nội dung Nháp hoặc sửa điểm chính thức.
        </div>
      </BentoCard>
    </div>
  );
};
