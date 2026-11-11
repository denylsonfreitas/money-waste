import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { ExpenseService } from '../expense.service';
import { MonthComparisonResponse } from '../expense.model';
import { formatBrl } from '../format';

/**
 * Mês atual x mês anterior (MW-006). Quem calcula é a API; aqui só exibimos.
 * Depois de registrar, editar ou excluir, `reload()` busca a comparação de novo.
 */
@Component({
  selector: 'app-month-comparison',
  templateUrl: './month-comparison.html',
  styleUrl: './month-comparison.scss',
})
export class MonthComparison implements OnInit {
  private readonly service = inject(ExpenseService);
  private request?: Subscription;

  /** `null` enquanto a primeira carga não terminou (nunca mostramos R$ 0,00 sem resposta). */
  protected readonly comparison = signal<MonthComparisonResponse | null>(null);
  protected readonly failed = signal(false);

  protected readonly formatBrl = formatBrl;

  /** Frase da diferença, com o valor sem sinal: "a mais"/"a menos" já diz a direção. */
  protected readonly sentence = computed(() => {
    const difference = this.comparison()?.difference ?? 0;
    if (difference > 0) return `${formatBrl(difference)} a mais que no mês anterior.`;
    if (difference < 0) return `${formatBrl(-difference)} a menos que no mês anterior.`;
    return 'Igual ao mês anterior.';
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    // Só a resposta mais recente vale (evita uma comparação antiga sobrescrever a nova).
    this.request?.unsubscribe();
    this.request = this.service.monthComparison().subscribe({
      next: (comparison) => {
        this.failed.set(false);
        this.comparison.set(comparison);
      },
      error: () => this.failed.set(true),
    });
  }
}
