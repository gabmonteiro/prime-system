"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight custom Select to avoid native dropdown positioning issues inside modals.
 * Props:
 * - id?: string
 * - value: string
 * - onChange: (value: string) => void
 * - options: Array<{ value: string; label: string }>
 * - placeholder?: string
 * - className?: string (applied to the trigger)
 */
export default function Select({
  id,
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || null;

  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        ref={buttonRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white flex items-center justify-between ${className}`}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className="h-4 w-4 text-gray-500 ml-2 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 top-full z-[10010] mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg focus:outline-none"
        >
          {options.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">Sem opções</li>
          )}
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`cursor-pointer select-none px-3 py-2 text-sm hover:bg-blue-50 ${
                opt.value === value ? "bg-blue-50 text-blue-700" : "text-gray-900"
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

