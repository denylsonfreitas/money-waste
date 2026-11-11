import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthComparison } from './month-comparison';

const COMPARISON_URL = 'http://localhost:5215/api/expenses/month-comparison';

describe('MonthComparison', () => {
  let fixture: ComponentFixture<MonthComparison>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthComparison],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthComparison);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const byTestId = (id: string) => el.querySelector(`[data-testid="${id}"]`);
  const shownPrevious = () => byTestId('previous-month-total')?.textContent?.trim();
  const shownSentence = () => byTestId('month-difference')?.textContent?.trim();

  function respond(currentMonthTotal: number, previousMonthTotal: number): void {
    const req = http.expectOne(COMPARISON_URL);
    expect(req.request.method).toBe('GET');
    // Diferença como a API calcula (em centavos exatos); aqui arredondada para evitar resíduo do JS.
    const difference = Math.round((currentMonthTotal - previousMonthTotal) * 100) / 100;
    req.flush({ currentMonthTotal, previousMonthTotal, difference });
    fixture.detectChanges();
  }

  function failWith(status: number): void {
    const req = http.expectOne(COMPARISON_URL);
    if (status === 0) req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    else req.flush(null, { status, statusText: 'Server Error' });
    fixture.detectChanges();
  }

  // Critério 8
  it('mostra o mês anterior e quanto a mais se gastou agora', () => {
    respond(150, 100);

    expect(shownPrevious()).toBe('Mês anterior: R$ 100,00');
    expect(shownSentence()).toBe('R$ 50,00 a mais que no mês anterior.');
  });

  // Critério 9
  it('com diferença negativa, mostra o valor sem sinal e "a menos"', () => {
    respond(1000, 1234.56);

    expect(shownPrevious()).toBe('Mês anterior: R$ 1.234,56');
    expect(shownSentence()).toBe('R$ 234,56 a menos que no mês anterior.');
  });

  // Critério 10
  it('com o mesmo total nos dois meses, mostra Igual ao mês anterior.', () => {
    respond(80, 80);

    expect(shownSentence()).toBe('Igual ao mês anterior.');
  });

  // Critério 10 (os dois zerados)
  it('sem gastos nos dois meses, mostra R$ 0,00 e Igual ao mês anterior.', () => {
    respond(0, 0);

    expect(shownPrevious()).toBe('Mês anterior: R$ 0,00');
    expect(shownSentence()).toBe('Igual ao mês anterior.');
  });

  it('enquanto carrega, não mostra valor nem comparação', () => {
    expect(byTestId('comparison-loading')).toBeTruthy();
    expect(byTestId('previous-month-total')).toBeNull();
    expect(byTestId('month-difference')).toBeNull();

    respond(10, 0);
  });

  // Critério 11
  it('reload() busca a comparação de novo e mostra o novo valor', () => {
    respond(150, 100);

    fixture.componentInstance.reload();
    respond(120, 100);

    expect(shownSentence()).toBe('R$ 20,00 a mais que no mês anterior.');
  });

  // Critério 12
  for (const [label, status] of [['a API responde com erro', 500], ['a conexão falha', 0]] as const) {
    it(`se ${label}, mostra a mensagem no lugar das duas linhas (nunca Igual ou R$ 0,00)`, () => {
      failWith(status);

      expect(byTestId('comparison-error')?.textContent?.trim()).toBe(
        'Não foi possível carregar a comparação com o mês anterior.',
      );
      expect(byTestId('previous-month-total')).toBeNull();
      expect(byTestId('month-difference')).toBeNull();
      expect(el.textContent).not.toContain('Igual ao mês anterior.');
      expect(el.textContent).not.toContain('R$ 0,00');
    });
  }

  it('reload() depois de uma falha volta a mostrar a comparação', () => {
    failWith(0);

    fixture.componentInstance.reload();
    respond(50, 50);

    expect(byTestId('comparison-error')).toBeNull();
    expect(shownSentence()).toBe('Igual ao mês anterior.');
  });
});
