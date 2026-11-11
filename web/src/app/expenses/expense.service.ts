import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../api.config';
import { CategoryTotal, CreateExpenseRequest, CurrentMonthTotal, Expense, MonthComparisonResponse } from './expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  create(request: CreateExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(`${this.baseUrl}/api/expenses`, request);
  }

  /** Edita um gasto existente (MW-005): mesmos campos e regras da criação. */
  update(id: string, request: CreateExpenseRequest): Observable<Expense> {
    return this.http.put<Expense>(`${this.baseUrl}/api/expenses/${id}`, request);
  }

  /** Exclui um gasto de vez (MW-005). */
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/expenses/${id}`);
  }

  /** Gastos do mês atual, já na ordem de exibição (mais recente primeiro). */
  listCurrentMonth(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.baseUrl}/api/expenses`);
  }

  /** Total gasto no mês atual, calculado pela API (mesmos gastos de `listCurrentMonth`). */
  currentMonthTotal(): Observable<number> {
    return this.http
      .get<CurrentMonthTotal>(`${this.baseUrl}/api/expenses/total`)
      .pipe(map((response) => response.total));
  }

  /** Totais por categoria do mês atual, calculados pela API, já na ordem de exibição. */
  currentMonthTotalsByCategory(): Observable<CategoryTotal[]> {
    return this.http.get<CategoryTotal[]>(`${this.baseUrl}/api/expenses/totals-by-category`);
  }

  /** Total do mês atual x total do mês anterior, calculados pela API (MW-006). */
  monthComparison(): Observable<MonthComparisonResponse> {
    return this.http.get<MonthComparisonResponse>(`${this.baseUrl}/api/expenses/month-comparison`);
  }
}
