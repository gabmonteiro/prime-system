"use client";
import { Children, useEffect, useState } from "react";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/** Container dos filtros de uma listagem. */
export default function FilterBar({ children, onClear, activeCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [first, ...rest] = Children.toArray(children);
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          Filtros
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
          >
            <XMarkIcon className="h-4 w-4" />
            Limpar
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {first}
        {/* No celular os demais filtros ficam recolhidos */}
        {rest.length > 0 && (
          <div className={open ? "contents" : "hidden sm:contents"}>{rest}</div>
        )}
      </div>
      {rest.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden mt-3 w-full text-sm text-blue-600 font-medium"
        >
          {open ? "Menos filtros" : `Mais filtros (${rest.length})`}
        </button>
      )}
    </div>
  );
}

/** Campo de busca com debounce. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
  delay = 350,
}) {
  const [text, setText] = useState(value || "");

  useEffect(() => setText(value || ""), [value]);

  useEffect(() => {
    if (text === (value || "")) return;
    const id = setTimeout(() => onChange(text), delay);
    return () => clearTimeout(id);
  }, [text, value, onChange, delay]);

  return (
    <div className={`relative ${className}`}>
      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    </div>
  );
}
