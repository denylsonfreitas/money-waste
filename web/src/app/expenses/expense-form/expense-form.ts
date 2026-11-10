import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, output, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { CreateExpenseRequest, EXPENSE_CATEGORIES, Expense, ExpenseCategory } from '../expense.model';
import { ExpenseService } from '../expense.service';
import { formatBrl, todayIso } from '../format';

const CONNECTION_ERROR = 'Não foi possível falar com o servidor. Verifique a conexão e tente de novo.';
const GENERIC_ERROR = 'Não foi possível registrar o gasto. Tente de novo.';

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
