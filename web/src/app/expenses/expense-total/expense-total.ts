import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { ExpenseService } from '../expense.service';
import { formatBrl } from '../format';

/**
 * Total gasto no mês atual (MW-003). Quem calcula é a API; aqui só exibimos.
 * Depois de um registro, `reload()` busca o total de novo.
 */
@Component({
  selector: 'app-expense-total',
  templateUrl: './expense-total.html',
  styleUrl: './expense-total.scss',
})
export class ExpenseTotal implements OnInit {
  private readonly service = inject(ExpenseService);
  private request?: Subscription;

  /** `null` enquanto a primeira carga não terminou (nunca mostramos R$ 0,00 sem resposta). */
  protected readonly total = signal<number | null>(null);
  protected readonly failed = signal(false);

  protected readonly formatBrl = formatBrl;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    // Só a resposta mais recente vale (evita um total antigo sobrescrever o novo).
    this.request?.unsubscribe();
    this.request = this.service.currentMonthTotal().subscribe({
      next: (total) => {
        this.failed.set(false);
        this.total.set(total);
      },
      error: () => this.failed.set(true),
    });
  }
}
