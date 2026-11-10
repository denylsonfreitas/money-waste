import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { App } from './app';
import { Expense } from './expenses/expense.model';

const API_URL = 'http://localhost:5215/api/expenses';

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

  function registerExpense(description: string, date: string): void {
    const type = (id: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    type('amount', '45.90');
    type('description', description);
    const select = el.querySelector<HTMLSelectElement>('#category')!;
    select.value = 'food';
    select.dispatchEvent(new Event('change'));
    type('date', date);
    el.querySelector<HTMLButtonElement>('app-expense-form button[type="submit"]')!.click();
    fixture.detectChanges();

    http
      .expectOne({ method: 'POST', url: API_URL })
      .flush({ id: description, amount: 45.9, description, category: 'food', date }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();
  }

  it('mostra o título Money Waste e o formulário de novo gasto', () => {
    respondList([]);

    expect(el.querySelector('h1')?.textContent).toContain('Money Waste');
    expect(el.querySelector('app-expense-form form')).toBeTruthy();
  });

  // Critério 8 (posição na tela)
  it('mostra a lista de gastos do mês abaixo do formulário', () => {
    respondList([{ id: '1', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-10' }]);

    const form = el.querySelector('app-expense-form')!;
    const list = el.querySelector('app-expense-list')!;
    expect(form.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(listedDescriptions()).toEqual(['Almoço']);
  });

  // Critério 10
  it('ao registrar um gasto do mês atual, ele aparece na lista na posição certa sem recarregar', () => {
    respondList([
      { id: 'b', amount: 10, description: 'Café', category: 'food', date: '2026-11-07' },
      { id: 'a', amount: 20, description: 'Ônibus', category: 'transport', date: '2026-11-03' },
    ]);

    registerExpense('Almoço', '2026-11-05');
    respondList([
      { id: 'b', amount: 10, description: 'Café', category: 'food', date: '2026-11-07' },
      { id: 'Almoço', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-05' },
      { id: 'a', amount: 20, description: 'Ônibus', category: 'transport', date: '2026-11-03' },
    ]);

    expect(listedDescriptions()).toEqual(['Café', 'Almoço', 'Ônibus']);
  });

  // Critério 11
  it('ao registrar um gasto de outro mês, mostra a confirmação e a lista não passa a mostrá-lo', () => {
    respondList([{ id: 'b', amount: 10, description: 'Café', category: 'food', date: '2026-11-07' }]);

    registerExpense('Viagem', '2026-10-20');
    // A API decide o mês atual: a lista recarregada continua sem o gasto de outubro.
    respondList([{ id: 'b', amount: 10, description: 'Café', category: 'food', date: '2026-11-07' }]);

    expect(byTestId('confirmation')?.textContent?.trim()).toBe('Gasto registrado: Viagem — R$ 45,90');
    expect(listedDescriptions()).toEqual(['Café']);
  });

  // Critério 12
  it('se a lista falha, mostra a mensagem de erro e o formulário continua registrando', () => {
    http.expectOne({ method: 'GET', url: API_URL }).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    expect(byTestId('list-error')?.textContent?.trim()).toBe('Não foi possível carregar os gastos do mês.');

    registerExpense('Almoço', '2026-11-05');
    expect(byTestId('confirmation')?.textContent?.trim()).toBe('Gasto registrado: Almoço — R$ 45,90');

    // O registro dispara nova tentativa de carregar a lista.
    respondList([{ id: 'Almoço', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-05' }]);
    expect(byTestId('list-error')).toBeNull();
    expect(listedDescriptions()).toEqual(['Almoço']);
  });
});
