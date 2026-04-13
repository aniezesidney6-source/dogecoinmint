'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_STYLES: Record<Toast['type'], { border: string; iconColor: string; icon: ReactNode }> = {
  success: { border: 'rgba(0,255,178,0.3)',  iconColor: '#00FFB2', icon: <CheckCircle size={16} /> },
  error:   { border: 'rgba(255,69,85,0.3)',   iconColor: '#FF4555', icon: <AlertCircle size={16} /> },
  info:    { border: 'rgba(247,183,49,0.3)',  iconColor: '#F7B731', icon: <Info size={16} /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => {
          const s = TOAST_STYLES[t.type];
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white shadow-2xl"
              style={{
                background: 'rgba(13,17,23,0.97)',
                border: `1px solid ${s.border}`,
                backdropFilter: 'blur(16px)',
              }}
            >
              <span style={{ color: s.iconColor, flexShrink: 0 }}>{s.icon}</span>
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="opacity-40 hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
