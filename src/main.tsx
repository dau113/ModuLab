import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * Lưới an toàn: nếu một thành phần nào đó lỗi thì hiện thông báo kèm nội dung lỗi
 * thay vì để trang trắng, giúp tìm nguyên nhân ngay trên máy người dùng.
 */
interface BoundaryProps { children: ReactNode }
interface BoundaryState { error: Error | null }

class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[ModuLab] Lỗi giao diện:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24,
        background: '#f8fafc', color: '#0f172a',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      }}>
        <div style={{
          maxWidth: 560, background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 16, padding: 24,
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
            Giao diện gặp lỗi
          </h1>
          <p style={{ fontSize: 14, color: '#475569', margin: '0 0 12px', lineHeight: 1.6 }}>
            Ứng dụng đã dừng để tránh hiển thị sai. Bạn thử tải lại trang; nếu vẫn lỗi
            thì gửi nội dung bên dưới cho người phát triển.
          </p>
          <pre style={{
            fontSize: 12, background: '#f1f5f9', padding: 12, borderRadius: 8,
            overflow: 'auto', maxHeight: 220, margin: '0 0 16px',
          }}>{String(this.state.error?.stack ?? this.state.error)}</pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              height: 40, padding: '0 16px', borderRadius: 12, border: 'none',
              background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
