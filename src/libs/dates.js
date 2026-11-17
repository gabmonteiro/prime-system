// Utilitários de datas e mês fiscal (compartilhado entre servidor e cliente).
//
// Convenção: campos "somente data" (data do serviço, vencimento, data de pagamento,
// data da despesa) são tratados pelo DIA EM UTC. Novos registros são gravados ao
// meio-dia UTC (YYYY-MM-DDT12:00:00Z) para nunca "pular" de dia por fuso horário.
// Registros antigos (meia-noite de Brasília = 03:00Z, ou 00:00Z) também caem no dia certo.

export const DEFAULT_FISCAL_START = 17;

/** "YYYY-MM-DD" (ou Date) -> Date ao meio-dia UTC. */
export function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00.000Z`);
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12),
  );
}

/** Date -> "YYYY-MM-DD" pelo dia UTC. */
export function toYmd(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/** Hoje (no fuso do navegador/servidor) como "YYYY-MM-DD". */
export function todayYmd() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Formata data somente-dia em pt-BR sem sofrer com fuso. */
export function formatDate(value) {
  const ymd = toYmd(value);
  if (!ymd) return "-";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

/** Soma meses mantendo o dia (limitado ao último dia do mês). */
export function addMonthsDateOnly(value, months) {
  const d = toDateOnly(value);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const day = d.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, last), 12));
}

function daysInMonth(year, month1) {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

function effectiveStart(year, month1, fiscalStart) {
  return Math.min(fiscalStart, daysInMonth(year, month1));
}

/** Chave "YYYY-MM" do mês fiscal ao qual a data pertence. */
export function getFiscalMonthKey(value, fiscalStart = DEFAULT_FISCAL_START) {
  const d = new Date(value);
  let year = d.getUTCFullYear();
  let month = d.getUTCMonth() + 1;
  if (d.getUTCDate() < effectiveStart(year, month, fiscalStart)) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Intervalo [start, end) em UTC do mês fiscal "YYYY-MM". */
export function getFiscalMonthRange(key, fiscalStart = DEFAULT_FISCAL_START) {
  const [year, month] = key.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const start = new Date(
    Date.UTC(year, month - 1, effectiveStart(year, month, fiscalStart)),
  );
  const end = new Date(
    Date.UTC(
      nextYear,
      nextMonth - 1,
      effectiveStart(nextYear, nextMonth, fiscalStart),
    ),
  );
  return { start, end };
}

export function shiftMonthKey(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

/** Lista de chaves de `fromKey` até `toKey` (inclusive). */
export function monthKeysBetween(fromKey, toKey) {
  const keys = [];
  let k = fromKey;
  while (k <= toKey && keys.length < 600) {
    keys.push(k);
    k = shiftMonthKey(k, 1);
  }
  return keys;
}

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function formatMonthKey(key, short = false) {
  if (!key) return "";
  const [y, m] = key.split("-").map(Number);
  const name = MONTHS_PT[m - 1] || "";
  if (short) return `${name.slice(0, 3)}/${String(y).slice(2)}`;
  return `${name} de ${y}`;
}
