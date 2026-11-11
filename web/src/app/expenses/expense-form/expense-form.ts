import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { CreateExpenseRequest, EXPENSE_CATEGORIES, Expense, ExpenseCategory } from '../expense.model';
import { ExpenseService } from '../expense.service';
import { formatBrl, todayIso } from '../format';

const CONNECTION_ERROR = 'Não foi possível falar com o servidor. Verifique a conexão e tente de novo.';
const GENERIC_ERROR = 'Não foi possível registrar o gasto. Tente de novo.';
const UPDATE_ERROR = 'Não foi possível salvar as alterações.';

function positiveAmount(control: AbstractControl<number | null>): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || Number.isNaN(value)) return { amountRequired: true };
  if (value <= 0) return { amountNotPositive: true };
  if (Math.round(value * 100) / 100 !== value) return { amountTooManyDecimals: true };
  return null;
}

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value?.trim() ? null : { blank: true };
}

@Component({
  selector: 'app-expense-form',
  imports: [ReactiveFormsModule],
  templateUrl: './expense-form.html',
  styleUrl: './expense-form.scss',
})
export class ExpenseForm {
  private readonly expenses = inject(ExpenseService);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Emitido quando a API confirma o registro de um gasto. */
  readonly created = output<Expense>();
  /** Emitido quando a API confirma a edição de um gasto (MW-005). */
  readonly updated = output<Expense>();

  /** Gasto em edição; `null` no modo "Novo gasto". */
  protected readonly editing = signal<Expense | null>(null);

  protected readonly categories = EXPENSE_CATEGORIES;
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly confirmation = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    amount: this.fb.control<number | null>(null, positiveAmount),
    description: this.fb.control('', notBlank),
    category: this.fb.control<ExpenseCategory | ''>('', Validators.required),
    date: this.fb.control(todayIso()),
  });

  protected showErrors(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected amountError(): string {
    const errors = this.form.controls.amount.errors;
    if (errors?.['amountTooManyDecimals']) return 'O valor deve ter no máximo 2 casas decimais.';
    if (errors?.['amountNotPositive']) return 'O valor deve ser maior que zero.';
    return 'Informe o valor do gasto.';
  }

  /** Passa o formulário para o modo "Editar gasto", preenchido com os dados do gasto. */
  startEdit(expense: Expense): void {
    this.editing.set(expense);
    this.confirmation.set(null);
    this.errorMessage.set(null);
    this.submitted.set(false);
    const { amount, description, category, date } = expense;
    this.form.reset({ amount, description, category, date });
  }

  /** Volta ao modo "Novo gasto" sem enviar nada à API. */
  protected cancel(): void {
    this.editing.set(null);
    this.errorMessage.set(null);
    this.resetForm();
  }

  protected submit(): void {
    this.submitted.set(true);
    this.confirmation.set(null);
    this.errorMessage.set(null);
    if (this.form.invalid || this.submitting()) return;

    const { amount, description, category, date } = this.form.getRawValue();
    const request: CreateExpenseRequest = {
      amount: amount!,
      description: description.trim(),
      category: category as ExpenseCategory,
      ...(date ? { date } : {}),
    };

    this.submitting.set(true);
    const editing = this.editing();
    if (editing) {
      this.saveEdit(editing.id, request);
      return;
    }

    this.expenses.create(request).subscribe({
      next: (expense) => {
        this.submitting.set(false);
        this.confirmation.set(`Gasto registrado: ${expense.description} — ${formatBrl(expense.amount)}`);
        this.resetForm();
        this.created.emit(expense);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.describeError(error));
      },
    });
  }

  private saveEdit(id: string, request: CreateExpenseRequest): void {
    this.expenses.update(id, request).subscribe({
      next: (expense) => {
        this.submitting.set(false);
        this.confirmation.set(`Gasto atualizado: ${expense.description} — ${formatBrl(expense.amount)}`);
        this.editing.set(null);
        this.resetForm();
        this.updated.emit(expense);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set(UPDATE_ERROR);
      },
    });
  }

  private resetForm(): void {
    this.form.reset({ amount: null, description: '', category: '', date: todayIso() });
    this.submitted.set(false);
  }

  private describeError(error: HttpErrorResponse): string {
    if (error.status === 0) return CONNECTION_ERROR;
    const fieldErrors = error.error?.errors as Record<string, string[]> | undefined;
    const messages = fieldErrors ? Object.values(fieldErrors).flat() : [];
    return messages.length ? messages.join(' ') : GENERIC_ERROR;
  }
}
