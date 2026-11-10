import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { Expense, categoryLabel } from '../expense.model';
import { ExpenseService } from '../expense.service';
import { formatBrl, formatDateBr } from '../format';

/**
 * Lista dos gastos do mês atual (MW-002). Quem decide o que é "mês atual" e a ordem é a API;
 * aqui só exibimos. Depois de um registro, `reload()` busca a lista de novo.
 */
@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.html',
  styleUrl: './expense-list.scss',
})
export class ExpenseList implements OnInit {
  private readonly service = inject(ExpenseService);
  private request?: Subscription;

  /** `null` enquanto a primeira carga não terminou. */
  protected readonly expenses = signal<Expense[] | null>(null);
  protected readonly failed = signal(false);

  protected readonly formatBrl = formatBrl;
  protected readonly formatDateBr = formatDateBr;
  protected readonly categoryLabel = categoryLabel;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    // Só a resposta mais recente vale (evita uma lista antiga sobrescrever a nova).
    this.request?.unsubscribe();
    this.request = this.service.listCurrentMonth().subscribe({
      next: (expenses) => {
        this.failed.set(false);
        this.expenses.set(expenses);
      },
      error: () => this.failed.set(true),
    });
  }
}
