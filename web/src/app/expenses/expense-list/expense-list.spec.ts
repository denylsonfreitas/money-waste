import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Expense } from '../expense.model';
import { ExpenseList } from './expense-list';

const API_URL = 'http://localhost:5215/api/expenses';

describe('ExpenseList', () => {
  let fixture: ComponentFixture<ExpenseList>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseList],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseList);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const byTestId = (id: string) => el.querySelector(`[data-testid="${id}"]`);
  const items = () =>
    Array.from(el.querySelectorAll('[data-testid="expense-item"]')).map((item) => ({
      date: item.querySelector('[data-testid="expense-date"]')?.textContent?.trim(),
      description: item.querySelector('[data-testid="expense-description"]')?.textContent?.trim(),
      category: item.querySelector('[data-testid="expense-category"]')?.textContent?.trim(),
      amount: item.querySelector('[data-testid="expense-amount"]')?.textContent?.trim(),
    }));

  function respond(expenses: Expense[]): void {
    const req = http.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush(expenses);
    fixture.detectChanges();
  }

  // Critério 8
  it('mostra os gastos do mês na ordem da API, com data, descrição, categoria e valor', () => {
    respond([
      { id: '3', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-10' },
      { id: '2', amount: 1234.56, description: 'Aluguel', category: 'housing', date: '2026-11-07' },
      { id: '1', amount: 12.5, description: 'Ônibus', category: 'transport', date: '2026-11-03' },
    ]);

    expect(items()).toEqual([
      { date: '10/11/2026', description: 'Almoço', category: 'Alimentação', amount: 'R$ 45,90' },
      { date: '07/11/2026', description: 'Aluguel', category: 'Moradia', amount: 'R$ 1.234,56' },
      { date: '03/11/2026', description: 'Ônibus', category: 'Transporte', amount: 'R$ 12,50' },
    ]);
    expect(byTestId('list-empty')).toBeNull();
    expect(byTestId('list-error')).toBeNull();
  });

  // Critério 9
  it('sem gastos no mês, mostra "Nenhum gasto registrado neste mês."', () => {
    respond([]);

    expect(byTestId('list-empty')?.textContent?.trim()).toBe('Nenhum gasto registrado neste mês.');
    expect(byTestId('expense-list')).toBeNull();
  });

  // Critério 12
  it('com erro da API, mostra "Não foi possível carregar os gastos do mês."', () => {
    http.expectOne(API_URL).flush('falhou', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    expect(byTestId('list-error')?.textContent?.trim()).toBe('Não foi possível carregar os gastos do mês.');
    expect(byTestId('expense-list')).toBeNull();
    expect(byTestId('list-empty')).toBeNull();
  });

  // Critério 12
  it('com falha de conexão, mostra "Não foi possível carregar os gastos do mês."', () => {
    http.expectOne(API_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    expect(byTestId('list-error')?.textContent?.trim()).toBe('Não foi possível carregar os gastos do mês.');
  });

  it('enquanto a lista não chega, não mostra a mensagem de lista vazia', () => {
    expect(byTestId('list-loading')).toBeTruthy();
    expect(byTestId('list-empty')).toBeNull();
    http.expectOne(API_URL).flush([]);
  });

  // Critério 10 (reload)
  it('reload() busca a lista de novo e mostra o resultado novo', () => {
    respond([]);

    fixture.componentInstance.reload();
    respond([{ id: '1', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-10' }]);

    expect(items().map((i) => i.description)).toEqual(['Almoço']);
    expect(byTestId('list-empty')).toBeNull();
  });

  it('reload() depois de um erro volta a mostrar a lista quando a API responde', () => {
    http.expectOne(API_URL).flush('falhou', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    fixture.componentInstance.reload();
    respond([{ id: '1', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-10' }]);

    expect(byTestId('list-error')).toBeNull();
    expect(items().length).toBe(1);
  });

  // MW-005
  describe('editar e excluir', () => {
    const lunch: Expense = { id: 'lunch', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-05' };
    const click = (testId: string) => {
      el.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)!.click();
      fixture.detectChanges();
    };

    beforeEach(() => respond([lunch]));

    it('cada item tem os botões Editar e Excluir', () => {
      const buttons = Array.from(el.querySelectorAll('[data-testid="expense-item"] button')).map((b) =>
        b.textContent?.trim(),
      );
      expect(buttons).toEqual(['Editar', 'Excluir']);
    });

    // Critério 9
    it('Editar avisa (evento edit) qual gasto editar, sem chamar a API', () => {
      const edited: Expense[] = [];
      fixture.componentInstance.edit.subscribe((expense) => edited.push(expense));

      click('edit-expense');

      expect(edited).toEqual([lunch]);
      http.expectNone(() => true);
    });

    // Critério 13
    it('Excluir pede confirmação, envia DELETE e avisa (evento deleted)', () => {
      const confirm = spyOn(window, 'confirm').and.returnValue(true);
      const deleted: Expense[] = [];
      fixture.componentInstance.deleted.subscribe((expense) => deleted.push(expense));

      click('delete-expense');

      expect(confirm).toHaveBeenCalledWith('Excluir o gasto "Almoço — R$ 45,90"?');
      const req = http.expectOne(`${API_URL}/lunch`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(deleted).toEqual([lunch]);
    });

    // Critério 14
    it('sem confirmação, nada é enviado e o gasto continua na lista', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const deleted: Expense[] = [];
      fixture.componentInstance.deleted.subscribe((expense) => deleted.push(expense));

      click('delete-expense');

      http.expectNone(() => true);
      expect(deleted).toEqual([]);
      expect(items().map((i) => i.description)).toEqual(['Almoço']);
    });

    // Critério 15
    for (const [name, fail] of [
      ['404', (req: TestRequest) => req.flush(null, { status: 404, statusText: 'Not Found' })],
      ['falha de conexão', (req: TestRequest) => req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' })],
    ] as const) {
      it(`com ${name} ao excluir, mostra "Não foi possível excluir o gasto." e mantém a lista`, () => {
        spyOn(window, 'confirm').and.returnValue(true);
        const deleted: Expense[] = [];
        fixture.componentInstance.deleted.subscribe((expense) => deleted.push(expense));

        click('delete-expense');
        fail(http.expectOne(`${API_URL}/lunch`));
        fixture.detectChanges();

        expect(byTestId('delete-error')?.textContent?.trim()).toBe('Não foi possível excluir o gasto.');
        expect(deleted).toEqual([]);
        expect(items().map((i) => i.description)).toEqual(['Almoço']);
      });
    }
  });
});
