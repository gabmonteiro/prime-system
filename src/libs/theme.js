// Tema (cor de destaque) e regras da logo. Compartilhado entre servidor e cliente.
//
// O Tailwind usa as classes `blue-*` / `primary-*` apontando para variáveis CSS
// (--brand-50 ... --brand-900). Trocar a cor = trocar essas variáveis.

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

// Paletas do Tailwind (cores prontas)
export const PRESETS = {
  azul: {
    nome: "Azul",
    palette: [
      "#eff6ff",
      "#dbeafe",
      "#bfdbfe",
      "#93c5fd",
      "#60a5fa",
      "#3b82f6",
      "#2563eb",
      "#1d4ed8",
      "#1e40af",
      "#1e3a8a",
    ],
  },
  indigo: {
    nome: "Índigo",
    palette: [
      "#eef2ff",
      "#e0e7ff",
      "#c7d2fe",
      "#a5b4fc",
      "#818cf8",
      "#6366f1",
      "#4f46e5",
      "#4338ca",
      "#3730a3",
      "#312e81",
    ],
  },
  violeta: {
    nome: "Violeta",
    palette: [
      "#f5f3ff",
      "#ede9fe",
      "#ddd6fe",
      "#c4b5fd",
      "#a78bfa",
      "#8b5cf6",
      "#7c3aed",
      "#6d28d9",
      "#5b21b6",
      "#4c1d95",
    ],
  },
  rosa: {
    nome: "Rosa",
    palette: [
      "#fdf2f8",
      "#fce7f3",
      "#fbcfe8",
      "#f9a8d4",
      "#f472b6",
      "#ec4899",
      "#db2777",
      "#be185d",
      "#9d174d",
      "#831843",
    ],
  },
  vermelho: {
    nome: "Vermelho",
    palette: [
      "#fef2f2",
      "#fee2e2",
      "#fecaca",
      "#fca5a5",
      "#f87171",
      "#ef4444",
      "#dc2626",
      "#b91c1c",
      "#991b1b",
      "#7f1d1d",
    ],
  },
  laranja: {
    nome: "Laranja",
    palette: [
      "#fff7ed",
      "#ffedd5",
      "#fed7aa",
      "#fdba74",
      "#fb923c",
      "#f97316",
      "#ea580c",
      "#c2410c",
      "#9a3412",
      "#7c2d12",
    ],
  },
  ambar: {
    nome: "Âmbar",
    palette: [
      "#fffbeb",
      "#fef3c7",
      "#fde68a",
      "#fcd34d",
      "#fbbf24",
      "#f59e0b",
      "#d97706",
      "#b45309",
      "#92400e",
      "#78350f",
    ],
  },
  verde: {
    nome: "Verde",
    palette: [
      "#f0fdf4",
      "#dcfce7",
      "#bbf7d0",
      "#86efac",
      "#4ade80",
      "#22c55e",
      "#16a34a",
      "#15803d",
      "#166534",
      "#14532d",
    ],
  },
  esmeralda: {
    nome: "Esmeralda",
    palette: [
      "#ecfdf5",
      "#d1fae5",
      "#a7f3d0",
      "#6ee7b7",
      "#34d399",
      "#10b981",
      "#059669",
      "#047857",
      "#065f46",
      "#064e3b",
    ],
  },
  ciano: {
    nome: "Ciano",
    palette: [
      "#ecfeff",
      "#cffafe",
      "#a5f3fc",
      "#67e8f9",
      "#22d3ee",
      "#06b6d4",
      "#0891b2",
      "#0e7490",
      "#155e75",
      "#164e63",
    ],
  },
  grafite: {
    nome: "Grafite",
    palette: [
      "#f8fafc",
      "#f1f5f9",
      "#e2e8f0",
      "#cbd5e1",
      "#94a3b8",
      "#64748b",
      "#475569",
      "#334155",
      "#1e293b",
      "#0f172a",
    ],
  },
};

export const DEFAULT_TEMA = { preset: "azul", cor: PRESETS.azul.palette[6] };

export function isHex(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || ""));
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  return (
    "#" +
    [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
  );
}

function mix(rgb, target, amount) {
  return rgb.map((c, i) => c + (target[i] - c) * amount);
}

/** Gera 10 tons a partir de uma cor (tratada como o tom 600). */
export function generatePalette(hex) {
  const base = hexToRgb(hex);
  const white = [255, 255, 255];
  const black = [0, 0, 0];
  const steps = [
    [white, 0.95],
    [white, 0.88],
    [white, 0.74],
    [white, 0.55],
    [white, 0.32],
    [white, 0.14],
    [white, 0],
    [black, 0.16],
    [black, 0.32],
    [black, 0.46],
  ];
  return steps.map(([t, a]) => rgbToHex(mix(base, t, a)));
}

/** Paleta (10 hex) do tema salvo. */
export function paletteFromTema(tema) {
  if (tema?.preset && PRESETS[tema.preset]) return PRESETS[tema.preset].palette;
  if (isHex(tema?.cor)) return generatePalette(tema.cor);
  return PRESETS.azul.palette;
}

/** CSS com as variáveis do tema (valores "r g b" para o Tailwind aplicar opacidade). */
export function temaCss(tema) {
  const palette = paletteFromTema(tema);
  const vars = SHADES.map(
    (s, i) => `--brand-${s}: ${hexToRgb(palette[i]).join(" ")};`,
  ).join(" ");
  return `html:root { ${vars} }`;
}

/** Lê a cor atual da marca no navegador (para gráficos). */
export function brandColor(shade = 500, alpha = 1) {
  if (typeof window === "undefined") return `rgba(59, 130, 246, ${alpha})`;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(`--brand-${shade}`)
    .trim();
  const [r, g, b] = v ? v.split(/\s+/) : [59, 130, 246];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------
export const LOGO_REGRAS = {
  tipos: ["image/png", "image/jpeg", "image/webp"],
  extensoes: "PNG, JPG ou WebP",
  maxBytes: 500 * 1024,
  minLado: 128,
  maxLado: 2048,
  recomendado: "512 × 512 px (quadrada)",
};
