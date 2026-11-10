import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CategoryTotal, Expense } from './expense.model';
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
});
