"use client";
import Modal from "./Modal";

export default function ConfirmDialog({
  isOpen,
  title = "Confirmar",
  message,
  confirmLabel = "Confirmar",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
  children,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {message && <p className="text-gray-700 mb-4">{message}</p>}
      {children}
      <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
            danger
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Aguarde..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
