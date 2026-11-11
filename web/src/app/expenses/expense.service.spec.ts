import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CategoryTotal, Expense, MonthComparisonResponse } from './expense.model';
import { ExpenseService } from './expense.service';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExpenseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envia POST para /api/expenses na URL base da API e devolve o gasto criado', () => {
    const created: Expense = {
      id: 'abc',
      amount: 45.9,
      description: 'Almoço',
      category: 'food',
      date: '2026-11-05',
    };
    let result: Expense | undefined;

    service
      .create({ amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-05' })
      .subscribe((expense) => (result = expense));

    const req = http.expectOne('http://localhost:5215/api/expenses');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      amount: 45.9,
      description: 'Almoço',
      category: 'food',
      date: '2026-11-05',
    });
    req.flush(created, { status: 201, statusText: 'Created' });

    expect(result).toEqual(created);
  });

  it('busca os gastos do mês atual com GET em /api/expenses', () => {
    const expenses: Expense[] = [
      { id: 'b', amount: 10, description: 'Café', category: 'food', date: '2026-11-07' },
      { id: 'a', amount: 20, description: 'Ônibus', category: 'transport', date: '2026-11-03' },
    ];
    let result: Expense[] | undefined;

    service.listCurrentMonth().subscribe((list) => (result = list));

    const req = http.expectOne('http://localhost:5215/api/expenses');
    expect(req.request.method).toBe('GET');
    req.flush(expenses);

    expect(result).toEqual(expenses);
  });

  it('busca o total do mês atual com GET em /api/expenses/total e devolve o número', () => {
    let result: number | undefined;

    service.currentMonthTotal().subscribe((total) => (result = total));

    const req = http.expectOne('http://localhost:5215/api/expenses/total');
    expect(req.request.method).toBe('GET');
    req.flush({ total: 158.4 });

    expect(result).toBe(158.4);
  });

  it('busca os totais por categoria do mês atual com GET em /api/expenses/totals-by-category', () => {
    const totals: CategoryTotal[] = [
      { category: 'housing', total: 100 },
      { category: 'food', total: 58.4 },
    ];
    let result: CategoryTotal[] | undefined;

    service.currentMonthTotalsByCategory().subscribe((list) => (result = list));

    const req = http.expectOne('http://localhost:5215/api/expenses/totals-by-category');
    expect(req.request.method).toBe('GET');
    req.flush(totals);

    expect(result).toEqual(totals);
  });

  // MW-006
  it('busca a comparação com o mês anterior com GET em /api/expenses/month-comparison', () => {
    const comparison: MonthComparisonResponse = { currentMonthTotal: 150, previousMonthTotal: 100, difference: 50 };
    let result: MonthComparisonResponse | undefined;

    service.monthComparison().subscribe((response) => (result = response));

    const req = http.expectOne('http://localhost:5215/api/expenses/month-comparison');
    expect(req.request.method).toBe('GET');
    req.flush(comparison);

    expect(result).toEqual(comparison);
  });

  // MW-005
  it('envia PUT para /api/expenses/{id} e devolve o gasto atualizado', () => {
    const updated: Expense = { id: 'abc', amount: 50, description: 'Almoço', category: 'food', date: '2026-11-05' };
    let result: Expense | undefined;

    service
      .update('abc', { amount: 50, description: 'Almoço', category: 'food', date: '2026-11-05' })
      .subscribe((expense) => (result = expense));

    const req = http.expectOne('http://localhost:5215/api/expenses/abc');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ amount: 50, description: 'Almoço', category: 'food', date: '2026-11-05' });
    req.flush(updated);

    expect(result).toEqual(updated);
  });

  // MW-005
  it('envia DELETE para /api/expenses/{id}', () => {
    let done = false;

    service.remove('abc').subscribe(() => (done = true));

    const req = http.expectOne('http://localhost:5215/api/expenses/abc');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(done).toBeTrue();
  });
});
