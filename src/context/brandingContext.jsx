"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";

const BrandingContext = createContext({
  logoUrl: null,
  loaded: false,
  reload: () => {},
});

export function BrandingProvider({ children }) {
  const [state, setState] = useState({ logoUrl: null, loaded: false });

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/branding", { cache: "no-store" });
      const data = await res.json();
      setState({
        logoUrl: data.logo ? `/api/branding/logo?v=${data.logo.versao}` : null,
        loaded: true,
      });
    } catch {
      setState({ logoUrl: null, loaded: true });
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <BrandingContext.Provider value={{ ...state, reload }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

const SIZES = {
  sm: { box: "w-8 h-8 rounded-lg", icon: "w-5 h-5" },
  md: { box: "w-10 h-10 rounded-xl", icon: "w-6 h-6" },
  lg: { box: "w-16 h-16 rounded-2xl", icon: "w-8 h-8" },
};

/** Logo da empresa (se enviada em Configurações) ou o ícone padrão na cor de destaque. */
export function BrandLogo({ size = "md", className = "" }) {
  const { logoUrl, loaded } = useBranding();
  const s = SIZES[size] || SIZES.md;
  if (!loaded)
    return <div className={`${s.box} bg-gray-100 shrink-0 ${className}`} />;
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt="Logo"
        className={`${s.box} object-contain bg-white shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      className={`${s.box} bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shrink-0 ${className}`}
    >
      <ChartBarIcon className={`${s.icon} text-white`} />
    </div>
  );
}
