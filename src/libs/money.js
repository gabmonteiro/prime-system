// Utilitários de dinheiro (compartilhado entre servidor e cliente).

export function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function formatMoney(value) {
  return (Number(value) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Divide `total` em `n` partes iguais com 2 casas; a diferença de arredondamento
 * vai para a última parte, garantindo que a soma seja exatamente `total`.
 */
export function splitAmount(total, n) {
  const count = Math.max(1, Math.floor(n));
  const cents = Math.round((Number(total) || 0) * 100);
  const base = Math.floor(cents / count);
  const parts = Array.from({ length: count }, () => base);
  parts[count - 1] += cents - base * count;
  return parts.map((c) => c / 100);
}
