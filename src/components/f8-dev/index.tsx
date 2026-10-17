/**
 * Trang ModuDev — chỉ tài khoản vai trò dev mới vào được.
 *
 * Ba việc: xem thẳng dữ liệu từng bảng, chạy câu SELECT để tra cứu, và quản lí
 * tài khoản người dùng. Mọi chặn đều nằm ở máy chủ chứ không nằm ở đây; trang
 * này chỉ là cái cửa sổ. Giấu nút đi không phải là bảo mật — người biết việc
 * vẫn gọi thẳng được API, nên chính API phải tự từ chối.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Database, Table2, Terminal, Users, ScrollText, Loader2, AlertCircle,
  Play, Lock, LockOpen, RefreshCw,
} from 'lucide-react';
import { api } from '../../api/client';
import type { DevTable, DevQueryResult, DevAccount } from '../../api/client';

type Tab = 'tables' | 'query' | 'accounts' | 'logs';

const TABS: { id: Tab; text: string; Icon: typeof Table2 }[] = [
  { id: 'tables', text: 'Bảng dữ liệu', Icon: Table2 },
  { id: 'query', text: 'Chạy truy vấn', Icon: Terminal },
  { id: 'accounts', text: 'Tài khoản', Icon: Users },
  { id: 'logs', text: 'Nhật ký', Icon: ScrollText },
];

const card = 'rounded-xl border border-slate-200 bg-white';
const cell = 'px-2.5 py-1.5 border-b border-slate-100 align-top';

/** Một ô dữ liệu bất kì của SQLite, đưa về chuỗi đọc được */
const show = (v: unknown): string => {
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'string') return v.length > 160 ? `${v.slice(0, 160)}…` : v;
  return String(v);
};

const Banner: React.FC<{ text: string }> = ({ text }) => (
  <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50
    px-3 py-2.5 text-[clamp(12.5px,0.86vw,15px)] text-rose-800">
    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
    <span className="min-w-0 break-words">{text}</span>
  </div>
);

/** Bảng kết quả dùng chung cho cả phần xem bảng lẫn phần chạy truy vấn */
const ResultTable: React.FC<{ columns: string[]; rows: Record<string, unknown>[] }> = ({ columns, rows }) => {
  if (!rows.length) {
    return <p className="p-4 text-[clamp(13px,0.9vw,15.5px)] text-slate-500">Không có dòng nào.</p>;
  }
  return (
    <div className="overflow-auto max-h-[28rem] ml-scroll">
      <table className="w-full text-left text-[clamp(12px,0.82vw,14px)] font-mono">
        <thead className="sticky top-0 bg-slate-100 text-slate-600">
          <tr>{columns.map((c) => (
            <th key={c} className="px-2.5 py-2 font-bold whitespace-nowrap border-b border-slate-200">{c}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c} className={`${cell} ${r[c] === null ? 'text-slate-400' : 'text-slate-700'}`}>
                  {show(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const DeveloperConsole: React.FC = () => {
  const [tab, setTab] = useState<Tab>('tables');
  const [overview, setOverview] = useState<Record<string, string | number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.dev.overview().then(setOverview).catch(() => setOverview(null)); }, []);

  return (
    <div className="h-full overflow-y-auto pr-1 pb-4 space-y-4 ml-scroll">
      <div className={`${card} p-4`}>
        <div className="flex items-start gap-2.5">
          <Database className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h2 className="text-[clamp(15px,1.05vw,18px)] font-bold text-slate-900">
              ModuDev — Cửa xem cơ sở dữ liệu
            </h2>
            <p className="mt-0.5 text-[clamp(12.5px,0.86vw,15px)] text-slate-500">
              Khung truy vấn chạy trên một kết nối chỉ đọc riêng, nên không câu lệnh nào
              từ đây sửa được dữ liệu thật.
            </p>
          </div>
        </div>

        {overview && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {([
              ['Tài khoản', 'users'], ['Lớp', 'classes'], ['Bài tập', 'assignments'],
              ['Bài nộp', 'submissions'], ['Báo cáo', 'reports'], ['Lượt chơi', 'attempts'],
              ['Phiên đang mở', 'activeSessions'],
            ] as const).map(([text, key]) => (
              <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                <div className="text-[clamp(11px,0.76vw,13px)] text-slate-500">{text}</div>
                <div className="text-[clamp(16px,1.15vw,20px)] font-bold text-slate-900 font-mono">
                  {overview[key] ?? '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map(({ id, text, Icon }) => (
          <button key={id} onClick={() => { setTab(id); setError(null); }} aria-pressed={tab === id}
            className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border font-medium
              text-[clamp(12.5px,0.86vw,15px)] transition-colors ${
              tab === id
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'}`}>
            <Icon className="w-4 h-4" /> {text}
          </button>
        ))}
      </div>

      {error && <Banner text={error} />}

      {tab === 'tables' && <TablesTab onError={setError} />}
      {tab === 'query' && <QueryTab />}
      {tab === 'accounts' && <AccountsTab onError={setError} />}
      {tab === 'logs' && <LogsTab onError={setError} />}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Xem từng bảng                                                       */
/* ------------------------------------------------------------------ */

const PAGE = 25;

const TablesTab: React.FC<{ onError: (s: string | null) => void }> = ({ onError }) => {
  const [tables, setTables] = useState<DevTable[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{ total: number; rows: Record<string, unknown>[] } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.dev.tables()
      .then((t) => { setTables(t); setPicked((p) => p ?? t[0]?.name ?? null); })
      .catch((e) => onError(e.message));
  }, [onError]);

  useEffect(() => {
    if (!picked) return;
    setBusy(true);
    api.dev.table(picked, PAGE, page * PAGE)
      .then((r) => setData({ total: r.total, rows: r.rows }))
      .catch((e) => onError(e.message))
      .finally(() => setBusy(false));
  }, [picked, page, onError]);

  const cols = useMemo(
    () => tables?.find((t) => t.name === picked)?.columns.map((c) => c.name) ?? [],
    [tables, picked],
  );
  const maxPage = data ? Math.max(Math.ceil(data.total / PAGE) - 1, 0) : 0;

  if (!tables) return <p className="text-slate-500">Đang tải danh sách bảng…</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-3">
      <div className={`${card} p-2 max-h-[32rem] overflow-y-auto ml-scroll`}>
        {tables.map((t) => (
          <button key={t.name} onClick={() => { setPicked(t.name); setPage(0); }}
            aria-pressed={picked === t.name}
            className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2
              text-[clamp(12.5px,0.86vw,15px)] transition-colors ${
              picked === t.name ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="font-mono truncate">{t.name}</span>
            <span className="shrink-0 text-[clamp(11px,0.76vw,13px)] text-slate-400 font-mono">{t.rowCount}</span>
          </button>
        ))}
      </div>

      <div className={card}>
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200">
          <span className="font-mono font-bold text-[clamp(13px,0.9vw,15.5px)] text-slate-800">{picked}</span>
          <div className="flex items-center gap-1.5 text-[clamp(12px,0.82vw,14px)]">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
            <span className="text-slate-500">
              {data ? `${page * PAGE + 1}–${Math.min((page + 1) * PAGE, data.total)} / ${data.total}` : '—'}
            </span>
            <button onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page === 0}
              className="h-7 px-2 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50">←</button>
            <button onClick={() => setPage((p) => Math.min(p + 1, maxPage))} disabled={page >= maxPage}
              className="h-7 px-2 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50">→</button>
          </div>
        </div>
        {data && <ResultTable columns={cols} rows={data.rows} />}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Khung chạy truy vấn                                                 */
/* ------------------------------------------------------------------ */

const GOI_Y = [
  'SELECT id, name, email, role, status FROM users ORDER BY role, name',
  `SELECT a.title, a.due_at, COUNT(s.id) AS da_nop
   FROM assignments a LEFT JOIN submissions s ON s.assignment_id = a.id
   GROUP BY a.id ORDER BY a.created_at DESC`,
  `SELECT u.name, s.score, s.status, s.submitted_at
   FROM submissions s JOIN users u ON u.id = s.user_id
   ORDER BY s.submitted_at DESC`,
];

const QueryTab: React.FC = () => {
  const [sql, setSql] = useState(GOI_Y[0]);
  const [result, setResult] = useState<DevQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true); setError(null);
    try { setResult(await api.dev.query(sql)); } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally { setBusy(false); }
  }, [sql]);

  return (
    <div className="space-y-3">
      <div className={`${card} p-3`}>
        <label htmlFor="ml-sql" className="block text-[clamp(12.5px,0.86vw,15px)] font-semibold text-slate-600 mb-1.5">
          Câu truy vấn — chỉ nhận SELECT, mỗi lần một lệnh
        </label>
        <textarea id="ml-sql" value={sql} onChange={(e) => setSql(e.target.value)} rows={5} spellCheck={false}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void run(); } }}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 font-mono
            text-[clamp(12.5px,0.86vw,15px)] text-slate-800 outline-none resize-y
            focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button onClick={() => void run()} disabled={busy}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white
              font-semibold text-[clamp(12.5px,0.86vw,15px)] hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Chạy
          </button>
          <span className="text-[clamp(11.5px,0.78vw,13.5px)] text-slate-400">Ctrl + Enter</span>
          {result && (
            <span className="ml-auto text-[clamp(12px,0.82vw,14px)] text-slate-500 font-mono">
              {result.rowCount} dòng · {result.ms} ms{result.truncated ? ' · đã cắt bớt' : ''}
            </span>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {GOI_Y.map((q, i) => (
            <button key={i} onClick={() => setSql(q)}
              className="h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600
                text-[clamp(11.5px,0.78vw,13.5px)] hover:border-indigo-300 transition-colors">
              Mẫu {i + 1}
            </button>
          ))}
        </div>
      </div>

      {error && <Banner text={error} />}
      {result && <div className={card}><ResultTable columns={result.columns} rows={result.rows} /></div>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Tài khoản                                                           */
/* ------------------------------------------------------------------ */

const VAI_TRO: Record<string, string> = { hs: 'Học sinh', gv: 'Giáo viên', dev: 'Developer' };

const AccountsTab: React.FC<{ onError: (s: string | null) => void }> = ({ onError }) => {
  const [rows, setRows] = useState<DevAccount[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    api.dev.accounts().then(setRows).catch((e) => onError(e.message));
  }, [onError]);
  useEffect(load, [load]);

  const toggle = async (a: DevAccount) => {
    setBusyId(a.id);
    try {
      await api.dev.setStatus(a.id, a.status === 'khoa' ? 'hoat_dong' : 'khoa');
      load();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally { setBusyId(null); }
  };

  if (!rows) return <p className="text-slate-500">Đang tải danh sách tài khoản…</p>;

  return (
    <div className={card}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <span className="font-bold text-[clamp(13px,0.9vw,15.5px)] text-slate-800">{rows.length} tài khoản</span>
        <button onClick={load} className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border
          border-slate-200 text-slate-600 text-[clamp(12px,0.82vw,14px)] hover:bg-slate-50 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Tải lại
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[clamp(12.5px,0.86vw,15px)]">
          <thead className="bg-slate-100 text-slate-600 text-[clamp(11.5px,0.78vw,13.5px)] uppercase font-bold">
            <tr>
              <th className="px-2.5 py-2">Họ tên</th>
              <th className="px-2.5 py-2">Email</th>
              <th className="px-2.5 py-2">Vai trò</th>
              <th className="px-2.5 py-2">Lớp</th>
              <th className="px-2.5 py-2 text-center">Phiên</th>
              <th className="px-2.5 py-2 text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className={`${cell} font-semibold text-slate-800`}>{a.name}</td>
                <td className={`${cell} font-mono text-slate-600`}>{a.email}</td>
                <td className={cell}>
                  <span className={`px-2 py-0.5 rounded font-semibold text-[clamp(11.5px,0.78vw,13.5px)] ${
                    a.role === 'dev' ? 'bg-indigo-100 text-indigo-800'
                      : a.role === 'gv' ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'}`}>
                    {VAI_TRO[a.role] ?? a.role}
                  </span>
                </td>
                <td className={`${cell} text-slate-600`}>{a.classCode || '—'}</td>
                <td className={`${cell} text-center font-mono text-slate-600`}>{a.activeSessions}</td>
                <td className={`${cell} text-right`}>
                  <button onClick={() => void toggle(a)} disabled={busyId === a.id}
                    className={`h-7 px-2.5 inline-flex items-center gap-1.5 rounded-lg border
                      text-[clamp(11.5px,0.78vw,13.5px)] font-semibold transition-colors disabled:opacity-50 ${
                      a.status === 'khoa'
                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                        : 'border-slate-200 text-slate-600 hover:border-rose-300'}`}>
                    {a.status === 'khoa' ? <><Lock className="w-3 h-3" /> Đang khoá</> : <><LockOpen className="w-3 h-3" /> Hoạt động</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Nhật ký thao tác                                                    */
/* ------------------------------------------------------------------ */

const LogsTab: React.FC<{ onError: (s: string | null) => void }> = ({ onError }) => {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof api.dev.logs>> | null>(null);
  useEffect(() => { api.dev.logs(150).then(setRows).catch((e) => onError(e.message)); }, [onError]);
  if (!rows) return <p className="text-slate-500">Đang tải nhật ký…</p>;

  return (
    <div className={`${card} overflow-auto max-h-[32rem] ml-scroll`}>
      <table className="w-full text-left text-[clamp(12.5px,0.86vw,15px)]">
        <thead className="sticky top-0 bg-slate-100 text-slate-600 text-[clamp(11.5px,0.78vw,13.5px)] uppercase font-bold">
          <tr>
            <th className="px-2.5 py-2">Thời điểm</th>
            <th className="px-2.5 py-2">Người dùng</th>
            <th className="px-2.5 py-2">Thao tác</th>
            <th className="px-2.5 py-2">Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50">
              <td className={`${cell} font-mono text-slate-500 whitespace-nowrap`}>{l.createdAt}</td>
              <td className={`${cell} text-slate-700`}>{l.userName}</td>
              <td className={`${cell} font-mono text-indigo-700`}>{l.action}</td>
              <td className={`${cell} text-slate-600`}>{l.detail ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
