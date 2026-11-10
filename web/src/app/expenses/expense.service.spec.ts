import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Expense } from './expense.model';
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
});
