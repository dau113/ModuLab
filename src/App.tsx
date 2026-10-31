/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { LabStep, LabReportRow, TeacherClassStats } from './types';
import { api, isOffline, getToken, setSignedOutHandler } from './api/client';
import type { ApiUser, Bootstrap } from './api/client';
import { TopNav, Sidebar, Footer, WarningBadge, VersionBadge } from './components/common';
import { LoadingWithFact } from './components/common/physics-facts';
import { SettingsProvider, useSettings } from './settings';
import { sfx, music } from './audio';
import { HomeMenu } from './components/f0-home';
import { AuthAccountView } from './components/f1-auth';
import { SignIn } from './components/f1-auth/sign-in';
import { DeveloperConsole } from './components/f8-dev';
import { MyAssignments } from './components/f2-quiz/my-assignments';
import { MyLessons } from './components/f2-quiz/lesson-view';
import { JoinClass } from './components/f1-auth/join-class';
import { QuizGame } from './components/f2-quiz';
import { PhysicsQuest } from './components/f2-quiz/quest';
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
  const [fading, setFading] = useState(false);

  /** Đổi màn hình kèm hiệu ứng chuyển: phủ mờ ra rồi mới đổi nội dung */
  const navigate = useCallback((run: () => void) => {
    setFading(true);
    window.setTimeout(() => {
      run();
      window.setTimeout(() => setFading(false), 30);
    }, 190);
  }, []);
  const [currentStep, setCurrentStep] = useState<LabStep | 'teacher' | 'account' | 'dev'>('quiz');
  const { t, lang } = useSettings();
  const [currentModuleId, setCurrentModuleId] = useState<string>('lab-1');
  const [reportRows, setReportRows] = useState<LabReportRow[]>([]);
  const [isCircuitPassed, setIsCircuitPassed] = useState<boolean>(false);
  const [isReportPassed, setIsReportPassed] = useState<boolean>(false);
  const [isReportSubmitted, setIsReportSubmitted] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  /* Tăng lên mỗi lần học sinh vào lớp khác, để danh sách bài tập nạp lại */
  const [classTick, setClassTick] = useState(0);

  /* Hai dòng nhắc này đóng được; đóng rồi thì thôi không hiện lại trong phiên */
  const [guestNoteOpen, setGuestNoteOpen] = useState(true);
  const [offlineNoteOpen, setOfflineNoteOpen] = useState(true);

  /** Trạng thái lưu bảng số liệu — phản ánh đúng việc đang xảy ra */
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'local' | 'error'>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const boot = await api.bootstrap();
      setData(boot);
      if (boot.modules.length) setCurrentModuleId((prev) => (boot.modules.some((m) => m.id === prev) ? prev : boot.modules[0].id));

      /* Còn mã phiên trong trình duyệt thì đăng nhập lại luôn, người dùng khỏi
         phải gõ mật khẩu mỗi lần mở trang. Mã hỏng thì bỏ qua, về màn đăng nhập. */
      if (getToken()) {
        const me = await api.me();
        if (me) setCurrentUser(me);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không kết nối được máy chủ dữ liệu');
    }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  /* Mục "Bài giảng tự do" trong ModuDoc chỉ dành cho học sinh — giáo viên soạn
     bài ở ModuManage. Ai đang đứng ở đó mà không phải học sinh thì đưa về mục
     lý thuyết: thanh bên đã ẩn mục này nên họ không có đường bấm quay lại. */
  useEffect(() => {
    if (currentStep === 'lessons' && currentUser && currentUser.role !== 'hs') {
      setCurrentStep('theory');
    }
  }, [currentStep, currentUser]);

  /* Máy chủ báo mã phiên hết hiệu lực thì đưa người dùng về màn đăng nhập ngay,
     thay vì để họ bấm mãi mà không hiểu vì sao chẳng có gì xảy ra. */
  useEffect(() => {
    setSignedOutHandler(() => { setCurrentUser(null); setAtHome(true); });
    return () => setSignedOutHandler(null);
  }, []);

  /* Tiếng bấm chung cho mọi nút; lần chạm đầu cũng mở khoá âm thanh của trình duyệt */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest('button, [role="button"], select, input[type="range"]');
      music.resume();
      if (el && !(el as HTMLButtonElement).disabled) sfx.click();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

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

  /* Chế độ khách không có tài khoản thật. Dựng một người dùng giả để màn hình
     vẫn vẽ được; mọi lời gọi máy chủ sẽ bị từ chối và rơi về bản lưu trong
     trình duyệt, đúng như dòng nhắc "kết quả sẽ không được ghi vào sổ điểm". */
  const viewer: ApiUser | null = currentUser
    ?? (isGuestMode
      ? { id: 'khach', name: 'Khách', email: '', role: 'hs', classCode: '', teamCode: '' }
      : null);

  const modules = data?.modules ?? [];
  const currentModule = modules.find((m) => m.id === currentModuleId) || modules[0];

  /** Đăng xuất: thu hồi mã phiên ở máy chủ rồi quay về trang chủ */
  const handleSignOut = useCallback(() => {
    void api.logout().finally(() => {
      setCurrentUser(null);
      setIsGuestMode(false);
      setTeacherStats(null);
      setAtHome(true);
      setCurrentStep('quiz');
    });
  }, []);

  const handleUpdateRows = (rows: LabReportRow[]) => {
    setReportRows(rows);
    if (!currentUser) return;
    setSyncState('saving');
    api.saveReportRows(currentUser.id, currentModuleId, rows)
      .then(() => { setSyncState(isOffline() ? 'local' : 'saved'); setSavedAt(new Date()); })
      .catch(() => setSyncState('error'));
  };

  /* Màn hình chờ và màn hình báo lỗi kết nối */
  if (loadError) {
    return (
      <div className="w-full h-screen bg-slate-100 text-slate-900 grid place-items-center p-6 font-sans">
        <div className="max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h1 className="text-lg font-extrabold mb-2">Không kết nối được cơ sở dữ liệu</h1>
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-600 mb-1">{loadError}</p>
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500 mb-4">
            Hãy mở một cửa sổ dòng lệnh khác và chạy <code className="font-mono font-bold">npm run server</code>,
            lần đầu chạy thêm <code className="font-mono font-bold">npm run db:seed</code>.
          </p>
          <button onClick={() => void loadAll()}
            className="px-4 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[clamp(13px,0.9vw,15.5px)] font-bold">
            Thử kết nối lại
          </button>
        </div>
      </div>
    );
  }

  if (!data || !currentModule) return <LoadingWithFact />;

  if (atHome || !viewer) {
    return (
      <div className="ml-page ml-scale">
        <PageFade active={fading} />
        <VersionBadge />
        <HomeMenu
          currentUser={currentUser}
          signInPanel={(
            <SignIn
              onSignedIn={(u) => navigate(() => {
                setCurrentUser(u);
                setIsGuestMode(false);
                setCurrentStep(u.role === 'gv' ? 'teacher' : u.role === 'dev' ? 'dev' : 'quiz');
                setAtHome(false);
              })}
              onGuest={() => navigate(() => {
                setIsGuestMode(true);
                setGuestNoteOpen(true);
                setCurrentStep('quiz');
                setAtHome(false);
              })}
            />
          )}
          onSignOut={handleSignOut}
          onContinue={() => navigate(() => {
            setCurrentStep(viewer?.role === 'gv' ? 'teacher'
              : viewer?.role === 'dev' ? 'dev' : 'quiz');
            setAtHome(false);
          })}
        />
      </div>
    );
  }

  return (
    <div className="ml-scale w-full h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none overflow-hidden">
      <PageFade active={fading} />
      <VersionBadge />
      {/* Top Navigation Bar */}
      <TopNav
        currentUser={viewer}
        isGuest={isGuestMode}
        onSignOut={handleSignOut}
        onGoHome={() => navigate(() => setAtHome(true))}
      />

      {/* Guest mode warning banner if triggered */}
      {isGuestMode && guestNoteOpen && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 px-6 py-1.5
          text-[clamp(13px,0.9vw,15.5px)] flex items-center gap-3 z-10 animate-fadeIn">
          <span className="flex-1">
            Đang xem ở chế độ khách — kết quả làm bài sẽ không được ghi vào sổ điểm.
          </span>
          <button onClick={() => setAtHome(true)}
            className="underline underline-offset-2 hover:text-amber-950 shrink-0">
            Đăng nhập
          </button>
          <button onClick={() => setGuestNoteOpen(false)} title="Ẩn dòng nhắc này"
            className="w-6 h-6 grid place-items-center rounded hover:bg-amber-200 shrink-0">
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Step / Feature Navigation */}
        <Sidebar
          currentStep={currentStep === 'account' || currentStep === 'dev' ? 'quiz' : currentStep}
          onSelectStep={(step) => navigate(() => setCurrentStep(step))}
          userRole={viewer.role}
          labTitle={currentModule.title}
          isReportPassed={isReportPassed}
        />

        {/* Main Bento Grid Content Area */}
        <main key={currentStep} className="ml-page flex-1 p-6 overflow-hidden flex flex-col">
          {isOffline() && offlineNoteOpen && (
            <div className="mb-3 shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2
              text-[clamp(12.5px,0.86vw,15px)] text-amber-900 flex items-center gap-3">
              <span className="flex-1">
                Đang chạy ở chế độ ngoại tuyến — bài làm được lưu trong trình duyệt của máy này.
              </span>
              <button onClick={() => setOfflineNoteOpen(false)} title="Ẩn dòng nhắc này"
                className="w-5 h-5 grid place-items-center rounded hover:bg-amber-200 shrink-0">
                ✕
              </button>
            </div>
          )}
          {/* Quick breadcrumb & role check bar */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/80 shrink-0 text-[clamp(13px,0.9vw,15.5px)]">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span>ModuLab Workspace</span>
              <span>/</span>
              <span className="font-bold text-slate-800">
                {currentStep === 'theory' && `${t('nav.theory')} — ${t('nav.theory.lesson')}`}
                {currentStep === 'tools' && `${t('nav.theory')} — ${t('nav.theory.tools')}`}
                {currentStep === 'lessons' && `${t('nav.theory')} — ${t('nav.theory.lessons')}`}
                {currentStep === 'quiz' && `${t('nav.quiz')} — ${t('nav.quiz.drill')}`}
                {currentStep === 'quest' && `${t('nav.quiz')} — ${t('nav.quest')}`}
                {/* Phần có trang con thì ghép tên ngắn với tên trang con; phần
                    không có trang con thì hiện thẳng tên đầy đủ, để dòng này
                    lúc nào cũng có dạng "Modu… — <tiếng Việt>". */}
                {currentStep === 'circuit' && t('nav.circuit.full')}
                {currentStep === 'report' && t('nav.report.full')}
                {currentStep === 'teacher' && t('nav.teacher.full')}
                {currentStep === 'account' && (lang === 'vi' ? 'Tài khoản & Phân quyền' : 'Accounts & roles')}
                {currentStep === 'dev' && (lang === 'vi' ? 'ModuDev — Cơ sở dữ liệu' : 'ModuDev — Database')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentStep('account')}
                className={`px-3 py-1 rounded-lg text-[clamp(13px,0.9vw,15.5px)] font-bold transition-all flex items-center gap-1.5 ${
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

            {currentStep === 'tools' && (
              <ToolExplorer tools={data.tools} />
            )}

            {/*
              Bài giảng tự do, nằm trong nhóm ModuDoc.
              Cùng một mục nhưng hai vai nhìn thấy hai thứ khác nhau: giáo viên
              soạn bài, học sinh làm bài. Gộp vào một chỗ để tài liệu của lớp
              nằm cùng chỗ với tài liệu ôn tập, khỏi phải nhớ bài giảng của thầy
              cô thì vào mục nào.
            */}
            {currentStep === 'lessons' && (
              <div className="h-full overflow-y-auto pr-1 ml-scroll space-y-4">
                {isGuestMode ? (
                  <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500">
                    Phần này dành cho tài khoản đã đăng nhập — bài giảng do thầy cô của lớp em soạn.
                  </p>
                ) : (
                  <>
                    <section>
                      <h3 className="mb-2 text-[clamp(14px,0.98vw,16.5px)] font-bold text-slate-900">
                        Lớp của em
                      </h3>
                      <JoinClass compact onJoined={(c) => {
                        setCurrentUser((prev) => (prev
                          ? { ...prev, classCode: c.classCode, teamCode: c.groupName, seatNo: c.seatNo }
                          : prev));
                        setClassTick((n) => n + 1);
                      }} />
                    </section>
                    <section>
                      <h3 className="mb-2 text-[clamp(14px,0.98vw,16.5px)] font-bold text-slate-900">
                        Bài giảng của thầy cô
                      </h3>
                      <MyLessons key={`bg-${classTick}`} />
                    </section>
                    <section>
                      <h3 className="mb-2 text-[clamp(14px,0.98vw,16.5px)] font-bold text-slate-900">
                        Bài tập được giao
                      </h3>
                      <MyAssignments key={classTick} />
                    </section>
                  </>
                )}
              </div>
            )}

            {/* ModuStart chỉ còn trò chơi ôn tập. Phần vào lớp và phần bài tập
                được giao đã dồn hết sang ModuDoc → Bài giảng tự do, để mọi thứ
                thuộc về lớp nằm chung một chỗ. */}
            {currentStep === 'quiz' && (
              <div className="h-full overflow-y-auto pr-1 ml-scroll space-y-4">
                <QuizGame
                userRole={viewer.role}
                extraQuestions={data.questions}
                onFinishQuiz={(score, total, correct) => {
                  void api.saveAttempt({
                    userId: viewer.id,
                    moduleId: currentModuleId,
                    score,
                    total,
                    correct,
                  }).catch(() => undefined);
                }}
                />
              </div>
            )}

            {currentStep === 'quest' && (
              <PhysicsQuest
                userRole={viewer.role}
                extraQuestions={data.questions}
                onFinishQuiz={(score, total, correct) => {
                  void api.saveAttempt({
                    userId: viewer.id,
                    moduleId: currentModuleId,
                    score,
                    total,
                    correct,
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
                    userId: viewer.id,
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
                onNewReport={() => {
                  setReportRows([]);
                  setIsReportSubmitted(false);
                  setIsReportPassed(false);
                  void api.reopenReport(viewer.id, currentModuleId).catch(() => undefined);
                }}
                module={currentModule}
                rows={reportRows}
                onUpdateRows={handleUpdateRows}
                syncState={syncState}
                savedAt={savedAt}
                teamCode={viewer.teamCode}
                isSubmitted={isReportSubmitted}
                onSubmitReport={(passed, summary) => {
                  setIsReportPassed(passed);
                  setIsReportSubmitted(true);
                  void api.submitReport(viewer.id, currentModuleId, summary ?? {}).catch(() => undefined);
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
                ? <TeacherDashboard stats={teacherStats} modules={modules} classId={viewer.classId}
                    onChanged={() => {
                      /* Tạo hoặc đổi lớp làm đổi luôn lớp đang mở của giáo viên ở máy chủ,
                         nên phải nạp lại hồ sơ, không thì thanh trên còn ghi lớp cũ. */
                      void api.me().then((u) => { if (u) setCurrentUser(u); }).catch(() => undefined);
                      void api.teacherStats().then(setTeacherStats).catch(() => undefined);
                    }} />
                : <div className="h-full grid place-items-center text-[clamp(13px,0.9vw,15.5px)] text-slate-500">Đang nạp số liệu lớp…</div>
            )}

            {currentStep === 'account' && (
              <AuthAccountView
                currentUser={viewer}
                isGuest={isGuestMode}
                onUpdateUser={(updated) => setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev))}
                onSignOut={handleSignOut}
              />
            )}

            {currentStep === 'dev' && viewer.role === 'dev' && <DeveloperConsole />}
          </div>
        </main>
      </div>

      {/* Footer Bar */}
      <Footer />
    </div>
  );
}


/** Màn phủ mờ dùng cho lúc chuyển giữa các trang */
const PageFade: React.FC<{ active: boolean }> = ({ active }) => (
  <div
    aria-hidden
    className={`fixed inset-0 z-[60] bg-slate-950 pointer-events-none transition-opacity duration-200 ${
      active ? 'opacity-35' : 'opacity-0'
    }`}
  />
);

export default function App() {
  return (
    <SettingsProvider>
      <Workspace />
    </SettingsProvider>
  );
}
