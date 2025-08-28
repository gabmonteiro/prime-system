"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function parseYmd(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function formatYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatBr(date) {
  return date.toLocaleDateString("pt-BR");
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function getMonthDaysGrid(monthDate) {
  const start = startOfMonth(monthDate);
  const startDay = (start.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    0,
  ).getDate();
  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), d));
  }
  // pad to 6 rows of 7
  while (days.length % 7 !== 0) days.push(null);
  while (days.length < 42) days.push(null);
  return days;
}

export default function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Selecionar data",
  className = "",
  min,
  max,
  required,
}) {
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseYmd(value), [value]);
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(selectedDate || new Date()),
  );

  useEffect(() => {
    if (selectedDate) setCurrentMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const minDate = useMemo(() => parseYmd(min), [min]);
  const maxDate = useMemo(() => parseYmd(max), [max]);

  const monthDays = useMemo(
    () => getMonthDaysGrid(currentMonth),
    [currentMonth],
  );

  const isDisabled = (dt) => {
    if (!dt) return true;
    if (minDate && dt < minDate) return true;
    if (maxDate && dt > maxDate) return true;
    return false;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white flex items-center justify-between ${className}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-calendar` : undefined}
      >
        <span className={selectedDate ? "text-gray-900" : "text-gray-400"}>
          {selectedDate ? formatBr(selectedDate) : placeholder}
        </span>
        <svg
          className="h-4 w-4 text-gray-500 ml-2 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>

      {open && (
        <div
          id={`${id}-calendar`}
          role="dialog"
          className="absolute left-0 right-0 top-full z-[10010] mt-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setCurrentMonth((d) => addMonths(d, -1))}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="Mês anterior"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.707 14.707a1 1 0 01-1.414 0L6.586 10l4.707-4.707a1 1 0 111.414 1.414L9.414 10l3.293 3.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className="text-sm font-medium text-gray-700">
              {currentMonth.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth((d) => addMonths(d, 1))}
              className="p-1 rounded hover:bg-gray-100"
              aria-label="Próximo mês"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.293 5.293a1 1 0 011.414 0L13.414 10l-4.707 4.707a1 1 0 11-1.414-1.414L10.586 10 7.293 6.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
            {"DSTQQSS".split("").map((d, i) => (
              <div key={i} className="text-center py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((dt, idx) => {
              const isSelected =
                selectedDate && dt && formatYmd(dt) === formatYmd(selectedDate);
              const disabled = isDisabled(dt);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (!dt) return;
                    onChange(formatYmd(dt));
                    setOpen(false);
                  }}
                  className={`h-8 w-8 rounded text-sm flex items-center justify-center ${
                    dt ? "" : "invisible"
                  } ${
                    disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : isSelected
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-50 text-gray-700"
                  }`}
                >
                  {dt ? dt.getDate() : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
