/**
 * Quản lí lớp và nhóm của giáo viên.
 *
 * Thầy cô tạo lớp, chia nhóm, rồi phát mã cho học sinh. Mỗi nhóm một mã dạng
 * `1204N2`; nhóm 0 luôn có sẵn và dành cho em nào nộp bài riêng lẻ.
 *
 * Phần phát mã có hai lối: chép từng mã, hoặc tải cả bảng mã ra tệp để in hay
 * dán lên nhóm chat của lớp. Bắt thầy cô gõ tay bốn mươi mã là cách chắc chắn
 * sinh ra lỗi chính tả rồi học sinh vào nhầm nhóm.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus, Trash2, Copy, Check, Loader2, AlertCircle, FileSpreadsheet,
  Users, School, ChevronRight,
} from 'lucide-react';
import { api } from '../../api/client';
import type { ClassInfo, ClassStudent } from '../../api/client';

const card = 'rounded-xl border border-slate-200 bg-white';
const field = `w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-900
  text-[clamp(13px,0.9vw,15.5px)] outline-none transition-colors
  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60`;
const label = 'block text-[clamp(12.5px,0.86vw,15px)] font-semibold text-slate-600 mb-1';

/** Nút chép một mã, đổi sang dấu tích trong hai giây để người bấm biết đã chép */
const CopyButton: React.FC<{ text: string; title: string }> = ({ text, title }) => {
  const [xong, setXong] = useState(false);
  return (
    <button type="button" title={title} aria-label={title}
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setXong(true);
        window.setTimeout(() => setXong(false), 2000);
      }}
      className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-slate-200
        text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
      {xong ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

interface Props {
  onChanged?: () => void;
}

export const ClassManager: React.FC<Props> = ({ onChanged }) => {
  const [list, setList] = useState<ClassInfo[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [students, setStudents] = useState<ClassStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', joinCode: '', groupCount: '4' });

  const load = useCallback(async () => {
    try {
      const l = await api.classes();
      setList(l);
      setOpenId((p) => p ?? l[0]?.id ?? null);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!openId) { setStudents(null); return; }
    let huy = false;
    api.classStudents(openId)
      .then((s) => { if (!huy) setStudents(s); })
      .catch(() => { if (!huy) setStudents([]); });
    return () => { huy = true; };
  }, [openId, list]);

  const mo = list?.find((c) => c.id === openId) ?? null;

  const taoLop = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const c = await api.createClass({
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        joinCode: form.joinCode.trim() || undefined,
        groupCount: Number(form.groupCount) || 0,
      });
      setForm({ name: '', code: '', joinCode: '', groupCount: '4' });
      await load();
      setOpenId(c.id);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setBusy(false); }
  };

  const chay = async (fn: () => Promise<unknown>) => {
    setError(null);
    try { await fn(); await load(); onChanged?.(); } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  /**
   * Xuất bảng mã ra tệp CSV mở được bằng Excel hay Google Sheets.
   *
   * Chuỗi ﻿ ở đầu tệp là dấu hiệu UTF-8; thiếu nó thì Excel đọc tiếng Việt
   * thành kí tự lạ. Ô nào có dấu phẩy thì bọc trong nháy kép.
   */
  const xuatMa = (c: ClassInfo) => {
    const o = (v: string | number) => {
      const t = String(v);
      return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const rows = [
      ['Lớp', c.code],
      ['Mã lớp', c.joinCode],
      [],
      ['Nhóm', 'Tên nhóm', 'Mã học sinh nhập', 'Số thành viên'],
      ...c.groups.map((g) => [
        g.groupNo === 0 ? 'Riêng lẻ' : g.groupNo, g.name, g.joinCode, g.memberCount,
      ]),
      [],
      ['Cách dùng', 'Học sinh nhập mã của nhóm mình, kèm số thứ tự trong lớp'],
    ];
    const csv = '﻿' + rows.map((r) => r.map(o).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ModuLab - Ma lop ${c.code}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /** Toàn bộ mã của lớp gom thành một đoạn, để dán thẳng vào nhóm chat */
  const chepTatCa = (c: ClassInfo) => [
    `Lớp ${c.code} — mã vào lớp ${c.joinCode}`,
    ...c.groups.map((g) => `${g.name}: ${g.joinCode}`),
    'Nhập mã của nhóm mình kèm số thứ tự trong lớp.',
  ].join('\n');

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200
          bg-rose-50 px-3 py-2.5 text-[clamp(12.5px,0.86vw,15px)] text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      {/* ---------- Tạo lớp ---------- */}
      <form onSubmit={taoLop} className={`${card} p-3.5 space-y-3`}>
        <h3 className="font-bold text-[clamp(14px,0.98vw,16.5px)] text-slate-900">Tạo lớp mới</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="lop-name">Tên lớp</label>
            <input id="lop-name" className={field} value={form.name} disabled={busy} required
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Lớp 12A4 - Chuyên Lý" />
          </div>
          <div>
            <label className={label} htmlFor="lop-code">Tên gọi tắt</label>
            <input id="lop-code" className={field} value={form.code} disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="12A4" />
          </div>
          <div>
            <label className={label} htmlFor="lop-groups">Số nhóm</label>
            <input id="lop-groups" type="number" min="0" max="20" className={field}
              value={form.groupCount} disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, groupCount: e.target.value }))} />
          </div>
        </div>
        <button type="submit" disabled={busy}
          className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white
            font-bold text-[clamp(13px,0.9vw,15.5px)] hover:bg-indigo-700
            disabled:opacity-60 transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Tạo lớp
        </button>
      </form>

      {/* ---------- Danh sách lớp ---------- */}
      {!list && <p className="text-slate-500">Đang tải danh sách lớp…</p>}
      {list && !list.length && (
        <div className={`${card} p-4`}>
          <p className="text-[clamp(13px,0.9vw,15.5px)] text-slate-500">
            Bạn chưa có lớp nào. Tạo lớp đầu tiên ở khung trên, rồi phát mã cho học sinh.
          </p>
        </div>
      )}

      {list && list.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr] gap-3">
          <div className={`${card} p-2 max-h-[30rem] overflow-y-auto ml-scroll`}>
            {list.map((c) => (
              <button key={c.id} onClick={() => setOpenId(c.id)} aria-pressed={openId === c.id}
                className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2
                  transition-colors ${openId === c.id
                  ? 'bg-indigo-50 text-indigo-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                <School className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[clamp(12.5px,0.86vw,15px)] truncate">
                    {c.code}
                  </span>
                  <span className="block text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500">
                    mã {c.joinCode} · {c.studentCount} HS
                  </span>
                </span>
                {openId === c.id && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </div>

          {mo && (
            <div className="space-y-3">
              {/* Bảng mã từng nhóm */}
              <div className={card}>
                <div className="px-3.5 py-2.5 border-b border-slate-200 flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[clamp(13.5px,0.94vw,16px)] text-slate-900 truncate">
                      {mo.name}
                    </h4>
                    <p className="text-[clamp(12px,0.82vw,14px)] text-slate-500">
                      Mã lớp {mo.joinCode} · {mo.groups.length} nhóm · {mo.studentCount} học sinh
                    </p>
                  </div>
                  <CopyButton text={chepTatCa(mo)} title="Chép toàn bộ mã của lớp" />
                  <button onClick={() => xuatMa(mo)}
                    className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border
                      border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold
                      text-[clamp(12px,0.82vw,14px)] hover:bg-emerald-100 transition-colors">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất bảng mã
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Xoá lớp "${mo.code}"?`)) void chay(() => api.deleteClass(mo.id));
                    }}
                    aria-label={`Xoá lớp ${mo.code}`}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border
                      border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300
                      transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {mo.groups.map((g) => (
                    <div key={g.id}
                      className={`rounded-lg border p-2.5 ${g.groupNo === 0
                        ? 'border-slate-200 bg-slate-50' : 'border-indigo-200 bg-indigo-50'}`}>
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 font-semibold text-[clamp(12.5px,0.86vw,15px)]
                          text-slate-800 truncate">
                          {g.name}
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1
                          text-[clamp(11.5px,0.78vw,13.5px)] text-slate-500">
                          <Users className="w-3 h-3" />{g.memberCount}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <code className="min-w-0 flex-1 px-2 py-1 rounded bg-white border
                          border-slate-200 font-mono font-bold text-[clamp(13px,0.9vw,15.5px)]
                          text-slate-900 select-all truncate">
                          {g.joinCode}
                        </code>
                        <CopyButton text={g.joinCode} title={`Chép mã ${g.joinCode}`} />
                        {g.groupNo !== 0 && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Xoá ${g.name}? Học sinh trong nhóm chuyển sang làm riêng lẻ.`)) {
                                void chay(() => api.deleteGroup(mo.id, g.groupNo));
                              }
                            }}
                            aria-label={`Xoá ${g.name}`}
                            className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-lg
                              border border-slate-200 bg-white text-slate-400 hover:text-rose-600
                              hover:border-rose-300 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button onClick={() => void chay(() => api.addGroup(mo.id, {}))}
                    className="rounded-lg border border-dashed border-slate-300 p-2.5 text-slate-500
                      hover:border-indigo-400 hover:text-indigo-700 transition-colors
                      inline-flex items-center justify-center gap-1.5
                      text-[clamp(12.5px,0.86vw,15px)] font-semibold">
                    <Plus className="w-4 h-4" /> Thêm nhóm
                  </button>
                </div>
              </div>

              {/* Học sinh trong lớp, xếp theo nhóm */}
              <div className={card}>
                <div className="px-3.5 py-2.5 border-b border-slate-200">
                  <h4 className="font-bold text-[clamp(13.5px,0.94vw,16px)] text-slate-900">
                    Học sinh trong lớp
                  </h4>
                </div>
                {!students && <p className="p-3.5 text-slate-500">Đang tải…</p>}
                {students && !students.length && (
                  <p className="p-3.5 text-[clamp(13px,0.9vw,15.5px)] text-slate-500">
                    Chưa em nào vào lớp. Phát mã ở trên cho học sinh để các em tự vào.
                  </p>
                )}
                {students && students.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[clamp(12.5px,0.86vw,15px)]">
                      <thead className="bg-slate-100 text-slate-600 font-bold
                        text-[clamp(11.5px,0.78vw,13.5px)] uppercase">
                        <tr>
                          <th className="px-2.5 py-2 w-12 text-center">STT</th>
                          <th className="px-2.5 py-2">Họ và tên</th>
                          <th className="px-2.5 py-2">Nhóm</th>
                          <th className="px-2.5 py-2">Đăng nhập gần nhất</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-2.5 py-2 text-center font-mono text-slate-500">
                              {s.seatNo ?? '—'}
                            </td>
                            <td className="px-2.5 py-2 font-semibold text-slate-800">{s.name}</td>
                            <td className="px-2.5 py-2 text-slate-600">{s.groupName}</td>
                            <td className="px-2.5 py-2 font-mono text-slate-500">
                              {s.lastLoginAt ?? 'chưa bao giờ'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
