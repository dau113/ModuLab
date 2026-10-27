/**
 * Hiện một tệp đã tải lên: ảnh, video, âm thanh, hoặc nút tải về.
 *
 * Địa chỉ tệp phải hỏi máy chủ mới có, vì nó kèm mã phiên — thẻ <img> và
 * <video> của trình duyệt không gửi được tiêu đề Authorization, nên mã phải đi
 * trong chuỗi truy vấn. Vì vậy thành phần này phải chờ một nhịp trước khi vẽ.
 */
import React, { useEffect, useState } from 'react';
import { FileDown, Loader2, FileWarning } from 'lucide-react';
import { api } from '../../api/client';
import type { UploadInfo } from '../../api/client';

interface Props {
  uploadId: string;
  /** Biết sẵn thông tin tệp thì truyền vào, khỏi hỏi máy chủ lần nữa */
  info?: UploadInfo | null;
  className?: string;
}

export const UploadMedia: React.FC<Props> = ({ uploadId, info, className }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<UploadInfo | null>(info ?? null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    let huy = false;
    setUrl(null); setLoi(null);

    void (async () => {
      try {
        const u = await api.fileUrl(uploadId);
        if (!huy) setUrl(u);
        if (!info) {
          const t = await api.uploadInfo(uploadId);
          if (!huy) setMeta(t);
        }
      } catch (e) {
        if (!huy) setLoi(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => { huy = true; };
  }, [uploadId, info]);

  if (loi) {
    return (
      <p className={`flex items-start gap-2 text-[clamp(12.5px,0.86vw,15px)] text-rose-700 ${className ?? ''}`}>
        <FileWarning className="w-4 h-4 shrink-0 mt-0.5" /> {loi}
      </p>
    );
  }
  if (!url) {
    return (
      <p className={`flex items-center gap-2 text-[clamp(12.5px,0.86vw,15px)] text-slate-500 ${className ?? ''}`}>
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải tệp…
      </p>
    );
  }

  const mime = meta?.mime ?? '';
  const ten = meta?.filename ?? 'Tệp đính kèm';

  if (mime.startsWith('image/')) {
    return (
      <img src={url} alt={ten}
        className={`max-w-full h-auto rounded-xl border border-slate-200 ${className ?? ''}`} />
    );
  }
  if (mime.startsWith('video/')) {
    return (
      <video src={url} controls preload="metadata"
        className={`max-w-full rounded-xl border border-slate-200 bg-black ${className ?? ''}`} />
    );
  }
  if (mime.startsWith('audio/')) {
    return <audio src={url} controls className={`w-full ${className ?? ''}`} />;
  }

  /* Mọi thứ còn lại: nút tải về. Không nhúng vào trang — mở một tệp lạ ngay
     trong trang là mở đường cho mã lạ chạy dưới tên miền của mình. */
  return (
    <a href={url} download={ten} target="_blank" rel="noreferrer"
      className={`inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-300
        bg-white text-slate-700 font-semibold text-[clamp(12.5px,0.86vw,15px)]
        hover:border-indigo-400 hover:text-indigo-700 transition-colors ${className ?? ''}`}>
      <FileDown className="w-4 h-4" />
      <span className="truncate max-w-[18rem]">{ten}</span>
      {meta?.size ? (
        <span className="text-slate-400 font-normal">
          {meta.size > 1048576
            ? `${(meta.size / 1048576).toFixed(1)} MB`
            : `${Math.max(1, Math.round(meta.size / 1024))} KB`}
        </span>
      ) : null}
    </a>
  );
};

/**
 * Nhúng video từ liên kết ngoài.
 *
 * Chỉ nhận YouTube và Vimeo — nhúng bừa một địa chỉ bất kì vào khung iframe là
 * cho trang lạ chạy ngay trong ứng dụng. Địa chỉ khác thì hiện thành liên kết
 * bấm ra ngoài, an toàn hơn và vẫn dùng được.
 */
export const VideoLink: React.FC<{ url: string; title?: string }> = ({ url, title }) => {
  const nhung = (() => {
    try {
      const u = new URL(url);
      const h = u.hostname.replace(/^www\./, '');
      if (h === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
      if (h === 'youtube.com' || h === 'm.youtube.com') {
        const v = u.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
        if (u.pathname.startsWith('/embed/')) return `https://www.youtube.com${u.pathname}`;
      }
      if (h === 'vimeo.com') return `https://player.vimeo.com/video${u.pathname}`;
    } catch { /* địa chỉ hỏng thì coi như không nhúng được */ }
    return null;
  })();

  if (nhung) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden border border-slate-200"
        style={{ aspectRatio: '16 / 9' }}>
        <iframe src={nhung} title={title || 'Video bài giảng'} allowFullScreen
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-300
        bg-white text-indigo-700 font-semibold text-[clamp(12.5px,0.86vw,15px)]
        hover:border-indigo-400 transition-colors break-all">
      Mở video ở trang gốc
    </a>
  );
};
