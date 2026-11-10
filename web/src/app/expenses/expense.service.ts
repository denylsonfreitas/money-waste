import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api.config';
import { CreateExpenseRequest, Expense } from './expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  create(request: CreateExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(`${this.baseUrl}/api/expenses`, request);
  }

  /** Gastos do mês atual, já na ordem de exibição (mais recente primeiro). */
  listCurrentMonth(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.baseUrl}/api/expenses`);
  }
}
