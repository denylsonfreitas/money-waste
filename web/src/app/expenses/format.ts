const brl = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Ex.: 1234.5 → "R$ 1.234,50" (com espaço comum, como no texto da história). */
export function formatBrl(amount: number): string {
  return `R$ ${brl.format(amount)}`;
}

/** Data local de hoje em aaaa-mm-dd (formato do input date e da API). */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
