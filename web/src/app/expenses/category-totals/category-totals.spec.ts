import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryTotal } from '../expense.model';
import { CategoryTotals } from './category-totals';

const URL = 'http://localhost:5215/api/expenses/totals-by-category';

describe('CategoryTotals', () => {
  let fixture: ComponentFixture<CategoryTotals>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryTotals],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryTotals);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const byTestId = (id: string) => el.querySelector(`[data-testid="${id}"]`);
  const shownLines = () =>
    Array.from(el.querySelectorAll('[data-testid="category-total"]')).map((li) => li.textContent?.trim());

  function respond(totals: CategoryTotal[]): void {
    const req = http.expectOne(URL);
    expect(req.request.method).toBe('GET');
    req.flush(totals);
    fixture.detectChanges();
  }

  // Critério 8
  it('mostra cada categoria com o rótulo em português e o valor, na ordem recebida da API', () => {
    respond([
      { category: 'housing', total: 100 },
      { category: 'food', total: 58.4 },
    ]);

    expect(shownLines()).toEqual(['Moradia — R$ 100,00', 'Alimentação — R$ 58,40']);
    expect(byTestId('category-totals-error')).toBeNull();
  });

  it('formata valores com ponto de milhar', () => {
    respond([{ category: 'housing', total: 1234.56 }]);

    expect(shownLines()).toEqual(['Moradia — R$ 1.234,56']);
  });

  // Critério 9
  it('sem gastos no mês, mostra Nenhum gasto neste mês.', () => {
    respond([]);

    expect(byTestId('category-totals-empty')?.textContent?.trim()).toBe('Nenhum gasto neste mês.');
    expect(shownLines()).toEqual([]);
  });

  it('enquanto carrega, não mostra linha nem a mensagem de vazio', () => {
    expect(byTestId('category-totals-loading')).toBeTruthy();
    expect(byTestId('category-totals-empty')).toBeNull();

    respond([]);
  });

  // Critério 11
  it('se a API responde com erro, mostra a mensagem e nunca Nenhum gasto neste mês.', () => {
    http.expectOne(URL).flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(byTestId('category-totals-error')?.textContent?.trim()).toBe(
      'Não foi possível carregar os gastos por categoria.',
    );
    expect(el.textContent).not.toContain('Nenhum gasto neste mês.');
    expect(shownLines()).toEqual([]);
  });

  // Critério 11 (falha de conexão)
  it('se a conexão falha, mostra a mensagem de erro', () => {
    http.expectOne(URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    expect(byTestId('category-totals-error')?.textContent?.trim()).toBe(
      'Não foi possível carregar os gastos por categoria.',
    );
    expect(el.textContent).not.toContain('Nenhum gasto neste mês.');
  });

  // Critério 10
  it('reload() busca de novo e mostra os novos totais', () => {
    respond([{ category: 'food', total: 45.9 }]);

    fixture.componentInstance.reload();
    respond([{ category: 'food', total: 58.4 }]);

    expect(shownLines()).toEqual(['Alimentação — R$ 58,40']);
  });

  it('reload() depois de uma falha volta a mostrar os totais', () => {
    http.expectOne(URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    fixture.componentInstance.reload();
    respond([{ category: 'leisure', total: 10 }]);

    expect(byTestId('category-totals-error')).toBeNull();
    expect(shownLines()).toEqual(['Lazer — R$ 10,00']);
  });
});
