export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'housing'
  | 'health'
  | 'leisure'
  | 'education'
  | 'shopping'
  | 'other';

/** Lista fixa de categorias (MW-001): código do contrato da API + rótulo exibido. */
export const EXPENSE_CATEGORIES: readonly { value: ExpenseCategory; label: string }[] = [
  { value: 'food', label: 'Alimentação' },
  { value: 'transport', label: 'Transporte' },
  { value: 'housing', label: 'Moradia' },
  { value: 'health', label: 'Saúde' },
  { value: 'leisure', label: 'Lazer' },
  { value: 'education', label: 'Educação' },
  { value: 'shopping', label: 'Compras' },
  { value: 'other', label: 'Outros' },
];

/** Rótulo em português de um código de categoria (ex.: "food" → "Alimentação"). */
export function categoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

export interface CreateExpenseRequest {
  amount: number;
  description: string;
  category: ExpenseCategory;
  /** aaaa-mm-dd; quando omitida, a API usa a data de hoje. */
  date?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string;
}
