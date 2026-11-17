"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "../libs/fetcher";
import { DEFAULT_FISCAL_START } from "../libs/dates";

/**
 * Carrega listas auxiliares usadas nos formulários/filtros.
 * which: array com "tipos" | "usuarios" | "contas" | "config"
 */
export default function useLookups(which = []) {
  const [state, setState] = useState({
    tipos: [],
    usuarios: [],
    contas: [],
    fiscalStart: DEFAULT_FISCAL_START,
    loaded: false,
  });
  const key = which.join(",");

  const load = useCallback(async () => {
    const want = key.split(",");
    const jobs = {
      tipos: want.includes("tipos")
        ? api("/api/tipoServico").catch(() => [])
        : null,
      usuarios: want.includes("usuarios")
        ? api("/api/user?forSelection=true").catch(() => [])
        : null,
      contas: want.includes("contas")
        ? api("/api/contas")
            .then((r) => r.data)
            .catch(() => [])
        : null,
      config: want.includes("config")
        ? api("/api/system-config").catch(() => ({}))
        : null,
    };
    const [tipos, usuarios, contas, config] = await Promise.all(
      Object.values(jobs),
    );
    setState((s) => ({
      tipos: tipos ?? s.tipos,
      usuarios: usuarios ?? s.usuarios,
      contas: contas ?? s.contas,
      fiscalStart: config?.fiscalMonthStart || s.fiscalStart,
      loaded: true,
    }));
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
