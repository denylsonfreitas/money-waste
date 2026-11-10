import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { App } from './app';
import { CategoryTotal, Expense } from './expenses/expense.model';

const API_URL = 'http://localhost:5215/api/expenses';
const TOTAL_URL = 'http://localhost:5215/api/expenses/total';
const CATEGORIES_URL = 'http://localhost:5215/api/expenses/totals-by-category';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const byTestId = (id: string) => el.querySelector(`[data-testid="${id}"]`);
  const listedDescriptions = () =>
    Array.from(el.querySelectorAll('[data-testid="expense-description"]')).map((d) => d.textContent?.trim());

  function respondList(expenses: Expense[]): void {
    const req = http.expectOne({ method: 'GET', url: API_URL });
    req.flush(expenses);
    fixture.detectChanges();
  }

  const shownTotal = () => byTestId('month-total')?.textContent?.trim();

  function respondTotal(total: number): void {
    http.expectOne({ method: 'GET', url: TOTAL_URL }).flush({ total });
    fixture.detectChanges();
  }

  function failTotal(): void {
    http.expectOne({ method: 'GET', url: TOTAL_URL }).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();
  }

  const shownCategoryLines = () =>
    Array.from(el.querySelectorAll('[data-testid="category-total"]')).map((li) => li.textContent?.trim());

  function respondCategories(totals: CategoryTotal[]): void {
    http.expectOne({ method: 'GET', url: CATEGORIES_URL }).flush(totals);
    fixture.detectChanges();
  }

  function registerExpense(description: string, date: string, amount = '45.90', category = 'food'): void {
    const type = (id: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    type('amount', amount);
    type('description', description);
    const select = el.querySelector<HTMLSelectElement>('#category')!;
    select.value = category;
    select.dispatchEvent(new Event('change'));
    type('date', date);
    el.querySelector<HTMLButtonElement>('app-expense-form button[type="submit"]')!.click();
    fixture.detectChanges();

    http
      .expectOne({ method: 'POST', url: API_URL })
      .flush({ id: description, amount: Number(amount), description, category, date }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();
  }

  it('mostra o título Money Waste e o formulário de novo gasto', () => {
    respondTotal(0);
    respondCategories([]);
    respondList([]);

    expect(el.querySelector('h1')?.textContent).toContain('Money Waste');
    expect(el.querySelector('app-expense-form form')).toBeTruthy();
  });

  // Critério 8 (posição na tela)
  it('mostra a lista de gastos do mês abaixo do formulário', () => {
    respondTotal(45.9);
    respondCategories([]);
    respondList([{ id: '1', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-10' }]);

    const form = el.querySelector('app-expense-form')!;
    const list = el.querySelector('app-expense-list')!;
    expect(form.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(listedDescriptions()).toEqual(['Almoço']);
  });

  // Critério 10
  it('ao registrar um gasto do mês atual, ele aparece na lista na posição certa sem recarregar', () => {
    respondTotal(30);
    respondCategories([]);
    respondList([
      { id: 'b', amount: 10, description: 'Café', category: 'food', date: '2026-11-07' },
      { id: 'a', amount: 20, description: 'Ônibus', category: 'transport', date: '2026-11-03' },
    ]);

    registerExpense('Almoço', '2026-11-05');
    respondTotal(75.9);
    respondCategories([]);
    respondList([
      { id: 'b', amount: 10, description: 'Café', category: 'food', date: '2026-11-07' },
      { id: 'Almoço', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-05' },
      { id: 'a', amount: 20, description: 'Ônibus', category: 'transport', date: '2026-11-03' },
    ]);

    expect(listedDescriptions()).toEqual(['Café', 'Almoço', 'Ônibus']);
  });

  // Critério 11
  it('ao registrar um gasto de outro mês, mostra a confirmação e a lista não passa a mostrá-lo', () => {
    respondTotal(10);
    respondCategories([]);
    respondList([{ id: 'b', amount: 10, description: 'Café', category: 'food', date: '2026-11-07' }]);

    registerExpense('Viagem', '2026-10-20');
    respondTotal(10);
    respondCategories([]);
    // A API decide o mês atual: a lista recarregada continua sem o gasto de outubro.
    respondList([{ id: 'b', amount: 10, description: 'Café', category: 'food', date: '2026-11-07' }]);

    expect(byTestId('confirmation')?.textContent?.trim()).toBe('Gasto registrado: Viagem — R$ 45,90');
    expect(listedDescriptions()).toEqual(['Café']);
  });

  // Critério 12
  it('se a lista falha, mostra a mensagem de erro e o formulário continua registrando', () => {
    respondTotal(0);
    respondCategories([]);
    http.expectOne({ method: 'GET', url: API_URL }).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    expect(byTestId('list-error')?.textContent?.trim()).toBe('Não foi possível carregar os gastos do mês.');

    registerExpense('Almoço', '2026-11-05');
    expect(byTestId('confirmation')?.textContent?.trim()).toBe('Gasto registrado: Almoço — R$ 45,90');

    // O registro dispara nova tentativa de carregar a lista (e o total).
    respondTotal(45.9);
    respondCategories([]);
    respondList([{ id: 'Almoço', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-05' }]);
    expect(byTestId('list-error')).toBeNull();
    expect(listedDescriptions()).toEqual(['Almoço']);
  });

  // MW-003 — Critério 7 (posição e formato)
  it('mostra o total do mês entre o formulário e a lista de gastos', () => {
    respondTotal(1234.56);
    respondCategories([]);
    respondList([{ id: '1', amount: 1234.56, description: 'Aluguel', category: 'housing', date: '2026-11-05' }]);

    expect(shownTotal()).toBe('Total do mês: R$ 1.234,56');
    const form = el.querySelector('app-expense-form')!;
    const total = el.querySelector('app-expense-total')!;
    const list = el.querySelector('app-expense-list')!;
    expect(form.compareDocumentPosition(total) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(total.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // MW-003 — Critério 8
  it('sem gastos no mês, mostra Total do mês: R$ 0,00', () => {
    respondTotal(0);
    respondCategories([]);
    respondList([]);

    expect(shownTotal()).toBe('Total do mês: R$ 0,00');
  });

  // MW-003 — Critério 9
  it('ao registrar um gasto do mês atual, o total é atualizado sem recarregar a página', () => {
    respondTotal(45.9);
    respondCategories([]);
    respondList([{ id: 'a', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-01' }]);
    expect(shownTotal()).toBe('Total do mês: R$ 45,90');

    registerExpense('Ônibus', '2026-11-15', '12.50');
    respondTotal(58.4);
    respondCategories([]);
    respondList([
      { id: 'Ônibus', amount: 12.5, description: 'Ônibus', category: 'food', date: '2026-11-15' },
      { id: 'a', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-01' },
    ]);

    expect(shownTotal()).toBe('Total do mês: R$ 58,40');
  });

  // MW-003 — Critério 10
  it('ao registrar um gasto de outro mês, mostra a confirmação e o total não muda', () => {
    respondTotal(45.9);
    respondCategories([]);
    respondList([{ id: 'a', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-01' }]);

    registerExpense('Viagem', '2026-10-20', '300.00');
    // A API decide o mês atual: o total recarregado continua sem o gasto de outubro.
    respondTotal(45.9);
    respondCategories([]);
    respondList([{ id: 'a', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-01' }]);

    expect(byTestId('confirmation')?.textContent?.trim()).toBe('Gasto registrado: Viagem — R$ 300,00');
    expect(shownTotal()).toBe('Total do mês: R$ 45,90');
  });

  // MW-003 — Critério 11
  it('se o total falha, mostra a mensagem (nunca R$ 0,00) e o formulário continua registrando', () => {
    failTotal();
    respondCategories([]);
    respondList([]);

    expect(byTestId('total-error')?.textContent?.trim()).toBe('Não foi possível carregar o total do mês.');
    expect(byTestId('month-total')).toBeNull();
    expect(el.textContent).not.toContain('R$ 0,00');

    registerExpense('Almoço', '2026-11-05');
    expect(byTestId('confirmation')?.textContent?.trim()).toBe('Gasto registrado: Almoço — R$ 45,90');

    // O registro dispara nova tentativa de carregar o total.
    respondTotal(45.9);
    respondCategories([]);
    respondList([{ id: 'Almoço', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-05' }]);
    expect(byTestId('total-error')).toBeNull();
    expect(shownTotal()).toBe('Total do mês: R$ 45,90');
  });

  // MW-004 — Critério 8
  it('mostra Gastos por categoria entre o total do mês e a lista, na ordem da API', () => {
    respondTotal(158.4);
    respondCategories([
      { category: 'housing', total: 100 },
      { category: 'food', total: 58.4 },
    ]);
    respondList([
      { id: 'a', amount: 100, description: 'Aluguel', category: 'housing', date: '2026-11-05' },
      { id: 'b', amount: 58.4, description: 'Mercado', category: 'food', date: '2026-11-03' },
    ]);

    const categoriesTitle = el.querySelector('#category-totals-title')!;
    expect(categoriesTitle.textContent?.trim()).toBe('Gastos por categoria');
    expect(shownCategoryLines()).toEqual(['Moradia — R$ 100,00', 'Alimentação — R$ 58,40']);

    const total = el.querySelector('app-expense-total')!;
    const categories = el.querySelector('app-category-totals')!;
    const list = el.querySelector('app-expense-list')!;
    expect(total.compareDocumentPosition(categories) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(categories.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // MW-004 — Critério 9
  it('sem gastos no mês, Gastos por categoria mostra Nenhum gasto neste mês.', () => {
    respondTotal(0);
    respondCategories([]);
    respondList([]);

    expect(byTestId('category-totals-empty')?.textContent?.trim()).toBe('Nenhum gasto neste mês.');
  });

  // MW-004 — Critério 10
  it('ao registrar um gasto do mês atual, a linha da categoria é atualizada sem recarregar a página', () => {
    respondTotal(45.9);
    respondCategories([{ category: 'food', total: 45.9 }]);
    respondList([{ id: 'a', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-01' }]);
    expect(shownCategoryLines()).toEqual(['Alimentação — R$ 45,90']);

    registerExpense('Lanche', '2026-11-15', '12.50', 'food');
    respondTotal(58.4);
    respondCategories([{ category: 'food', total: 58.4 }]);
    respondList([
      { id: 'Lanche', amount: 12.5, description: 'Lanche', category: 'food', date: '2026-11-15' },
      { id: 'a', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-01' },
    ]);

    expect(shownCategoryLines()).toEqual(['Alimentação — R$ 58,40']);
  });

  // MW-004 — Critério 11
  it('se os totais por categoria falham, mostra a mensagem (nunca o vazio) e o resto da tela funciona', () => {
    respondTotal(45.9);
    http
      .expectOne({ method: 'GET', url: CATEGORIES_URL })
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();
    respondList([{ id: 'a', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-01' }]);

    expect(byTestId('category-totals-error')?.textContent?.trim()).toBe(
      'Não foi possível carregar os gastos por categoria.',
    );
    expect(el.textContent).not.toContain('Nenhum gasto neste mês.');
    expect(shownTotal()).toBe('Total do mês: R$ 45,90');
    expect(listedDescriptions()).toEqual(['Almoço']);

    registerExpense('Lanche', '2026-11-15', '12.50');
    expect(byTestId('confirmation')?.textContent?.trim()).toBe('Gasto registrado: Lanche — R$ 12,50');

    // O registro dispara nova tentativa de carregar os totais por categoria.
    respondTotal(58.4);
    respondCategories([{ category: 'food', total: 58.4 }]);
    respondList([
      { id: 'Lanche', amount: 12.5, description: 'Lanche', category: 'food', date: '2026-11-15' },
      { id: 'a', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-01' },
    ]);
    expect(byTestId('category-totals-error')).toBeNull();
    expect(shownCategoryLines()).toEqual(['Alimentação — R$ 58,40']);
  });
});
