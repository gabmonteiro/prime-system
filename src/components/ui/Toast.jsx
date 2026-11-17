"use client";
import { createContext, useCallback, useContext, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback(
    (id) => setToasts((list) => list.filter((t) => t.id !== id)),
    [],
  );

  const show = useCallback(
    (message, type = "success") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((list) => [...list.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[100000] flex flex-col gap-2 sm:w-96 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg text-white animate-fadeIn ${
              t.type === "error" ? "bg-red-500" : "bg-green-500"
            }`}
          >
            {t.type === "error" ? (
              <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 shrink-0" />
            )}
            <span className="flex-1 text-sm">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-white/80 hover:text-white"
              aria-label="Fechar"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** const toast = useToast(); toast("Salvo!"); toast("Falhou", "error"); */
export function useToast() {
  return useContext(ToastContext);
}
