"use client";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
}) {
  const titleId = useId();
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(typeof window !== "undefined" ? document.body : null);
  }, []);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-7xl mx-4",
  };

  if (!portalTarget) return null;

  return createPortal(
    <div className="modal-overlay animate-fadeIn" style={{ zIndex: 9999 }}>
      <div
        className="absolute inset-0"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      <div
        className={`modal-content w-full ${sizeClasses[size]} animate-fadeIn`}
        style={{ zIndex: 10000 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-xl">
            <h3 id={titleId} className="text-xl font-semibold text-gray-900">
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className="modal-body p-6">{children}</div>
      </div>
    </div>,
    portalTarget,
  );
}
