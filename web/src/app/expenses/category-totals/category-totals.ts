import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { CategoryTotal, categoryLabel } from '../expense.model';
import { ExpenseService } from '../expense.service';
import { formatBrl } from '../format';

/**
 * Gastos por categoria do mês atual (MW-004). Quem calcula e ordena é a API;
 * aqui só exibimos, na ordem recebida. Depois de um registro, `reload()` busca de novo.
 */
@Component({
  selector: 'app-category-totals',
  templateUrl: './category-totals.html',
  styleUrl: './category-totals.scss',
})
export class CategoryTotals implements OnInit {
  private readonly service = inject(ExpenseService);
  private request?: Subscription;

  /** `null` enquanto a primeira carga não terminou. */
  protected readonly totals = signal<CategoryTotal[] | null>(null);
  protected readonly failed = signal(false);

  protected readonly formatBrl = formatBrl;
  protected readonly categoryLabel = categoryLabel;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    // Só a resposta mais recente vale (evita totais antigos sobrescreverem os novos).
    this.request?.unsubscribe();
    this.request = this.service.currentMonthTotalsByCategory().subscribe({
      next: (totals) => {
        this.failed.set(false);
        this.totals.set(totals);
      },
      error: () => this.failed.set(true),
    });
  }
}
