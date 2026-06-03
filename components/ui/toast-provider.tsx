"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Toast = {
  id: string;
  title: string;
  body?: string;
};

type ToastContextValue = {
  pushToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    function handle(event: Event) {
      const custom = event as CustomEvent<Omit<Toast, "id">>;
      pushToast(custom.detail);
    }

    window.addEventListener("rru-toast", handle);
    return () => window.removeEventListener("rru-toast", handle);
  }, [pushToast]);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 grid w-[min(360px,calc(100vw-32px))] gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="grid grid-cols-[4px_1fr] border border-[rgba(0,255,102,0.34)] bg-bg-2 shadow-glow">
            <div className="bg-accent" />
            <div className="p-3">
              <div className="mono-label mb-1 text-accent">{toast.title}</div>
              {toast.body ? <div className="font-mono text-[11px] leading-5 text-text-dim">{toast.body}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return ctx;
}

export function emitToast(title: string, body?: string) {
  window.dispatchEvent(new CustomEvent("rru-toast", { detail: { title, body } }));
}
