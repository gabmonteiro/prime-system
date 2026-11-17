"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, qs } from "../libs/fetcher";

/**
 * Carrega uma listagem paginada com filtros do servidor.
 * Retorna { data, stats, pagination, loading, error, reload }.
 */
export default function useApiList(url, params, { enabled = true } = {}) {
  const [state, setState] = useState({
    data: [],
    stats: null,
    pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
    loading: true,
    error: null,
  });
  const key = url + qs(params);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api(key, { signal: ctrl.signal });
      setState({
        data: Array.isArray(res) ? res : res.data || [],
        stats: res.stats || null,
        pagination: res.pagination || {
          page: 1,
          totalPages: 1,
          total: Array.isArray(res) ? res.length : 0,
        },
        loading: false,
        error: null,
        raw: res,
      });
    } catch (error) {
      if (error.name === "AbortError") return;
      setState((s) => ({ ...s, loading: false, error: error.message }));
    }
  }, [key]);

  useEffect(() => {
    if (enabled) load();
    return () => abortRef.current?.abort();
  }, [load, enabled]);

  return { ...state, reload: load };
}

/** Estado de filtros + página; trocar filtro volta para a página 1. */
export function useFilters(initial) {
  const [filters, setFilters] = useState(initial);
  const [page, setPage] = useState(1);
  const setFilter = useCallback((name, value) => {
    setFilters((f) => ({ ...f, [name]: value }));
    setPage(1);
  }, []);
  const clear = useCallback(() => {
    setFilters(initial);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const activeCount = Object.entries(filters).filter(
    ([k, v]) => v !== "" && v !== null && v !== undefined && v !== initial[k],
  ).length;
  return { filters, setFilter, clear, page, setPage, activeCount };
}
