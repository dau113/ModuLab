/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { LabStep, LabReportRow, TeacherClassStats } from './types';
import { api } from './api/client';
import type { ApiUser, Bootstrap } from './api/client';
import { TopNav, Sidebar, Footer, WarningBadge } from './components/common';
import { SettingsProvider, useSettings } from './settings';
import { HomeMenu } from './components/f0-home';
import { PrepGuideView } from './components/f3-theory/prep';
import { AuthAccountView } from './components/f1-auth';
import { QuizGame } from './components/f2-quiz';
import { TheoryView } from './components/f3-theory';
import { ToolExplorer } from './components/f4-tools';
import { CircuitSimulator } from './components/f5-circuit';
import { LabReportView } from './components/f6-report';
import { TeacherDashboard } from './components/f7-teacher';
import { ShieldAlert, UserCheck } from 'lucide-react';

function Workspace() {
  /* Dữ liệu nạp từ máy chủ */
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [teacherStats, setTeacherStats] = useState<TeacherClassStats | null>(null);

  const [atHome, setAtHome] = useState(true);
  const [currentStep, setCurrentStep] = useState<LabStep | 'teacher' | 'account'>('quiz');
  const { t, lang } = useSettings();
  const [currentModuleId, setCurrentModuleId] = useState<string>('lab-1');
  const [reportRows, setReportRows] = useState<LabReportRow[]>([]);
  const [isCircuitPassed, setIsCircuitPassed] = useState<boolean>(false);
  const [isReportPassed, setIsReportPassed] = useState<boolean>(false);
  const [isReportSubmitted, setIsReportSubmitted] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const boot = await api.bootstrap();
      setData(boot);
      setCurrentUser((prev) => prev ?? boot.users.find((u) => u.role === 'hs') ?? boot.users[0]);
      if (boot.modules.length) setCurrentModuleId((prev) => (boot.modules.some((m) => m.id === prev) ? prev : boot.modules[0].id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không kết nối được máy chủ dữ liệu');
    }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  /* Bảng số liệu của học sinh hiện tại */
  useEffect(() => {
    if (!currentUser || !currentModuleId) return;
    let cancelled = false;
    api.getReport(currentUser.id, currentModuleId)
      .then((report) => {
        if (cancelled) return;
        setReportRows(report.rows);
        setIsReportSubmitted(report.status !== 'dang_lam');
        setIsReportPassed(report.relErr != null && report.relErr <= 0.1);
      })
      .catch(() => { if (!cancelled) setReportRows([]); });
    return () => { cancelled = true; };
  }, [currentUser?.id, currentModuleId]);

  /* Số liệu Bảng quản lý — nạp lại mỗi lần giáo viên mở */
  useEffect(() => {
    if (currentStep !== 'teacher' || !currentUser) return;
    api.teacherStats(currentUser.classCode).then(setTeacherStats).catch(() => setTeacherStats(null));
  }, [currentStep, currentUser?.classCode, isReportSubmitted]);

  const modules = data?.modules ?? [];
  const currentModule = modules.find((m) => m.id === currentModuleId) || modules[0];

  const handleSwitchUser = (userId: string) => {
    const user = data?.users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'gv' && currentStep !== 'teacher') {
        setCurrentStep('teacher');
      } else if (user.role === 'hs' && currentStep === 'teacher') {
        setCurrentStep('theory');
      }
    }
  };

  const handleUpdateRows = (rows: LabReportRow[]) => {
    setReportRows(rows);
    if (currentUser) void api.saveReportRows(currentUser.id, currentModuleId, rows).catch(() => undefined);
  };

  /* Màn hình chờ và màn hình báo lỗi kết nối */
  if (loadError) {
    return (
      <div className="w-full h-screen bg-slate-100 text-slate-900 grid place-items-center p-6 font-sans">
        <div className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h1 className="text-lg font-extrabold mb-2">Không kết nối được cơ sở dữ liệu</h1>
          <p className="text-[13px] text-slate-600 mb-1">{loadError}</p>
          <p className="text-[13px] text-slate-500 mb-4">
            Hãy mở một cửa sổ dòng lệnh khác và chạy <code className="font-mono font-bold">npm run server</code>,
            lần đầu chạy thêm <code className="font-mono font-bold">npm run db:seed</code>.
          </p>
          <button onClick={() => void loadAll()}
            className="px-4 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold">
            Thử kết nối lại
          </button>
        </div>
      </div>
    );
  }

  if (!data || !currentUser || !currentModule) {
    return (
      <div className="w-full h-screen bg-slate-100 text-slate-900 grid place-items-center font-sans">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] font-bold text-slate-500">Đang nạp dữ liệu từ cơ sở dữ liệu…</p>
        </div>
      </div>
    );
  }

  if (atHome) {
    return (
      <HomeMenu
        users={data.users}
        currentUserId={currentUser.id}
        onEnter={(userId, guest) => {
          const u = data.users.find((x) => x.id === userId);
          if (u) setCurrentUser(u);
          setIsGuestMode(!!guest);
          setCurrentStep(u?.role === 'gv' ? 'teacher' : 'quiz');
          setAtHome(false);
        }}
      />
    );
  }

  return (
    <div className="w-full h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Navigation Bar */}
      <TopNav
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        availableUsers={data.users}
        onGoHome={() => setAtHome(true)}
      />

      {/* Guest mode warning banner if triggered */}
      {isGuestMode && (
        <div className="bg-amber-400 text-slate-950 px-6 py-1.5 text-[13px] font-bold flex items-center justify-between shadow-sm z-10 animate-fadeIn">
          <span>⚠️ Bạn đang truy cập ở Chế độ Khách (Chưa đăng nhập) — Kết quả Game ôn tập và Báo cáo sẽ không được ghi nhận vào điểm chính thức!</span>
          <button 
            onClick={() => setIsGuestMode(false)}
            className="underline hover:text-indigo-900 text-[12.5px] ml-4 font-extrabold"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Step / Feature Navigation */}
        <Sidebar
          currentStep={currentStep === 'account' ? 'quiz' : currentStep}
          onSelectStep={(step) => setCurrentStep(step)}
          userRole={currentUser.role}
          labTitle={currentModule.title}
          isReportPassed={isReportPassed}
        />

        {/* Main Bento Grid Content Area */}
        <main className="flex-1 p-6 overflow-hidden flex flex-col">
          {/* Quick breadcrumb & role check bar */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/80 shrink-0 text-[13px]">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span>ModuLab Workspace</span>
              <span>/</span>
              <span className="font-bold text-slate-800">
                {currentStep === 'theory' && `${t('nav.theory')} — ${t('nav.theory.lesson')}`}
                {currentStep === 'prep' && `${t('nav.theory')} — ${t('nav.theory.prep')}`}
                {currentStep === 'tools' && `${t('nav.theory')} — ${t('nav.theory.tools')}`}
                {currentStep === 'quiz' && t('nav.quiz')}
                {currentStep === 'circuit' && t('nav.circuit')}
                {currentStep === 'report' && t('nav.report')}
                {currentStep === 'teacher' && t('nav.teacher')}
                {currentStep === 'account' && (lang === 'vi' ? 'Tài khoản & Phân quyền' : 'Accounts & roles')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentStep('account')}
                className={`px-3 py-1 rounded-lg text-[13px] font-bold transition-all flex items-center gap-1.5 ${
                  currentStep === 'account' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tài khoản & Phân quyền (F1)</span>
              </button>
            </div>
          </div>

          {/* Dynamic Content View with Bento Grid container inside */}
          <div className="flex-1 min-h-0">
            {currentStep === 'theory' && (
              <TheoryView
                module={currentModule}
                onSwitchModule={(modId) => {
                  setCurrentModuleId(modId);
                  setIsCircuitPassed(false);
                  setIsReportPassed(false);
                  setIsReportSubmitted(false);
                }}
                availableModules={modules}
              />
            )}

            {currentStep === 'prep' && (
              <PrepGuideView module={currentModule} onGoToCircuit={() => setCurrentStep('circuit')} />
            )}

            {currentStep === 'tools' && (
              <ToolExplorer tools={data.tools} />
            )}

            {currentStep === 'quiz' && (
              <QuizGame
                userRole={currentUser.role}
                extraQuestions={data.questions}
                onFinishQuiz={(score, total) => {
                  void api.saveAttempt({
                    userId: currentUser.id,
                    moduleId: currentModuleId,
                    score,
                    total,
                  }).catch(() => undefined);
                }}
              />
            )}

            {currentStep === 'circuit' && (
              <CircuitSimulator
                isPassed={isCircuitPassed}
                onPassCircuit={() => setIsCircuitPassed(true)}
                onSaveCircuit={(payload) =>
                  api.saveCircuit({
                    userId: currentUser.id,
                    moduleId: currentModuleId,
                    name: payload.name,
                    data: payload.data,
                    isValid: payload.isValid,
                  }).then(() => undefined)
                }
              />
            )}

            {currentStep === 'report' && (
              <LabReportView
                module={currentModule}
                rows={reportRows}
                onUpdateRows={handleUpdateRows}
                teamCode={currentUser.teamCode}
                isSubmitted={isReportSubmitted}
                onSubmitReport={(passed, summary) => {
                  setIsReportPassed(passed);
                  setIsReportSubmitted(true);
                  void api.submitReport(currentUser.id, currentModuleId, summary ?? {}).catch(() => undefined);
                  alert(
                    passed
                      ? `🎉 Nhóm 3 đã nộp báo cáo thành công (Kết quả: ĐẠT YÊU CẦU)! Dữ liệu đã được đồng bộ vào Sổ điểm của giáo viên.`
                      : `⚠️ Báo cáo đã nộp nhưng kết quả CHƯA ĐẠT do sai số vượt ngưỡng cho phép (≤ ${(currentModule.maxErrorThreshold * 100).toFixed(0)}%). Hãy xem nhận xét gợi ý để chỉnh sửa hoặc làm lại!`
                  );
                }}
              />
            )}

            {currentStep === 'teacher' && (
              teacherStats
                ? <TeacherDashboard stats={teacherStats} />
                : <div className="h-full grid place-items-center text-[13px] text-slate-500">Đang nạp số liệu lớp…</div>
            )}

            {currentStep === 'account' && (
              <AuthAccountView
                currentUser={currentUser}
                onUpdateUser={(updated) => setCurrentUser((prev) => ({ ...prev, ...updated }))}
                onSwitchUserRole={handleSwitchUser}
                availableUsers={data.users}
              />
            )}
          </div>
        </main>
      </div>

      {/* Footer Bar */}
      <Footer />
    </div>
  );
}


export default function App() {
  return (
    <SettingsProvider>
      <Workspace />
    </SettingsProvider>
  );
}
