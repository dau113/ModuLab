import React, { useState } from 'react';
import { TeacherClassStats, LabModule } from '../../types';
import { AssignmentManager } from './assignments';
import { BentoCard, WarningBadge } from '../common';
import { 
  Users, 
  FileSpreadsheet, 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Award,
  BookOpen,
  Send
} from 'lucide-react';

interface TeacherDashboardProps {
  stats: TeacherClassStats;
  modules: LabModule[];
  /** Gọi khi có bài tập mới hoặc điểm vừa đổi, để màn hình cha nạp lại số liệu lớp */
  onChanged?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ stats, modules, onChanged }) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);

  /**
   * Xuất sổ điểm ra tệp CSV thật.
   *
   * Bản trước chỉ đợi một giây rồi hiện hộp thoại báo "đã xuất" mà không có tệp
   * nào cả. Giờ dựng nội dung từ chính danh sách học sinh đang hiển thị rồi cho
   * trình duyệt tải về.
   *
   * Hai chi tiết để Excel mở ra không bị lỗi chữ Việt:
   *   · chuỗi \uFEFF ở đầu tệp báo cho Excel biết đây là UTF-8;
   *   · ô có dấu phẩy, nháy kép hay xuống dòng phải bọc trong nháy kép, và nháy
   *     kép bên trong phải nhân đôi.
   */
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const o = (v: string | number | null) => {
        const t = v === null || v === undefined ? '' : String(v);
        return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
      };
      const dong = [
        ['Họ và tên', 'Nhóm thực hành', 'Điểm khởi động', 'Báo cáo thực hành'],
        ...stats.studentList.map((s) => [s.name, s.team, s.quizScore ?? '', s.reportStatus]),
      ];
      const csv = '\uFEFF' + dong.map((r) => r.map(o).join(',')).join('\r\n');

      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ModuLab - So diem ${stats.classCode} - ${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      /* Thu hồi địa chỉ tạm sau khi trình duyệt đã bắt đầu tải, không thì rò bộ nhớ */
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 h-full overflow-y-auto pr-1 pb-4 font-sans select-none">
      {/* Top Banner stats */}
      <BentoCard 
        className="md:col-span-4" 
        title="BẢNG ĐIỀU KHIỂN & SỔ ĐIỂM CHUYÊN MÔN" 
        subtitle={stats.className}
        action={
          <button
            disabled={isExporting}
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[clamp(13px,0.9vw,15.5px)] flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileSpreadsheet className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Đang xuất tệp...' : 'Xuất điểm Excel (UTF-8)'}</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div className="flex items-center justify-between text-indigo-900 font-bold text-[clamp(13px,0.9vw,15.5px)] mb-1">
              <span>Game ôn tập</span>
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-950">
              {stats.quizCompleted}/{stats.totalStudents} <span className="text-[clamp(13px,0.9vw,15.5px)] font-medium text-indigo-700">HS</span>
            </div>
            <div className="w-full bg-indigo-200 h-1.5 rounded-full mt-2">
              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${stats.totalStudents ? (stats.quizCompleted / stats.totalStudents) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between text-emerald-900 font-bold text-[clamp(13px,0.9vw,15.5px)] mb-1">
              <span>Báo cáo đã nộp</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-950">
              {stats.reportsSubmitted}/{stats.totalStudents || 0} <span className="text-[clamp(13px,0.9vw,15.5px)] font-medium text-emerald-700">HS</span>
            </div>
            <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2">
              <div className="bg-emerald-600 h-1.5 rounded-full"
                style={{ width: `${stats.totalStudents ? (stats.reportsSubmitted / stats.totalStudents) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-700 font-bold text-[clamp(13px,0.9vw,15.5px)] mb-1">
              <span>Sĩ số lớp</span>
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.totalStudents} <span className="text-[clamp(13px,0.9vw,15.5px)] font-medium text-slate-500">Học sinh</span>
            </div>
            <p className="text-[12.5px] text-slate-500 font-medium mt-2">
              {stats.totalTeams} nhóm thực hành
            </p>
          </div>
        </div>
      </BentoCard>

      {/* Giao bài tập — ghi thẳng vào cơ sở dữ liệu, học sinh thấy ngay.
          Để chiếm trọn bề ngang vì bên trong có bảng theo dõi từng học sinh. */}
      <BentoCard className="md:col-span-6" title="QUẢN LÝ GIAO BÀI TẬP"
        subtitle="Bài giao ở đây hiện ngay trong mục bài tập của học sinh">
        <div className="mt-2">
          <AssignmentManager modules={modules} onChanged={onChanged} />
        </div>
      </BentoCard>

      {/* Error Frequency Analysis (most wrong questions) */}
      <BentoCard className="md:col-span-3" title="Thống kê câu hỏi lỗi nhiều nhất" subtitle="Phân tích để giảng dạy lại">
        <div className="mt-2 space-y-3">
          {stats.errorStats.map((err, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-[clamp(13px,0.9vw,15.5px)]">
              <div className="flex items-start gap-2 min-w-0">
                <span className="w-5 h-5 rounded bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[12.5px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-slate-800 font-medium truncate">{err.question}</span>
              </div>
              <div className="shrink-0 flex items-center gap-1.5">
                <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {err.wrongCount} HS sai
                </span>
              </div>
            </div>
          ))}
        </div>
      </BentoCard>

      {/* Student Leaderboard & Report status grid */}
      <BentoCard className="md:col-span-3" title="Danh sách học sinh & Tình trạng" subtitle="Theo dõi điểm số lớp">
        <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 max-h-[260px]">
          <table className="w-full text-left text-[clamp(13px,0.9vw,15.5px)]">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[12.5px] sticky top-0 border-b border-slate-200">
              <tr>
                <th className="p-2.5">Họ và tên</th>
                <th className="p-2.5">Nhóm thực hành</th>
                <th className="p-2.5 text-center">Điểm K.Động</th>
                <th className="p-2.5 text-right">Báo cáo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {stats.studentList.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-800">{stu.name}</td>
                  <td className="p-2.5 text-slate-500 text-[clamp(12.5px,0.86vw,15px)]">{stu.team}</td>
                  <td className="p-2.5 text-center font-mono font-bold">
                    {stu.quizScore !== null ? (
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                        {stu.quizScore} đ
                      </span>
                    ) : (
                      <span className="text-slate-400">---</span>
                    )}
                  </td>
                  <td className="p-2.5 text-right">
                    <span className={`px-2 py-0.5 rounded text-[12.5px] font-bold ${
                      stu.reportStatus === 'Đạt'
                        ? 'bg-emerald-100 text-emerald-800'
                        : stu.reportStatus === 'Chưa đạt'
                          ? 'bg-amber-100 text-amber-800'
                          : stu.reportStatus === 'Chưa chấm'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                      {stu.reportStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoCard>
    </div>
  );
};
