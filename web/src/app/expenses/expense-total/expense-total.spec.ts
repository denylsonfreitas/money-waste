import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseTotal } from './expense-total';

const TOTAL_URL = 'http://localhost:5215/api/expenses/total';

describe('ExpenseTotal', () => {
  let fixture: ComponentFixture<ExpenseTotal>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseTotal],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseTotal);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const byTestId = (id: string) => el.querySelector(`[data-testid="${id}"]`);
  const shownTotal = () => byTestId('month-total')?.textContent?.trim();

  function respond(total: number): void {
    const req = http.expectOne(TOTAL_URL);
    expect(req.request.method).toBe('GET');
    req.flush({ total });
    fixture.detectChanges();
  }

  // Critério 7
  it('mostra o total do mês formatado em reais', () => {
    respond(1234.56);

    expect(shownTotal()).toBe('Total do mês: R$ 1.234,56');
    expect(byTestId('total-error')).toBeNull();
  });

  // Critério 8
  it('sem gastos no mês, mostra R$ 0,00', () => {
    respond(0);

    expect(shownTotal()).toBe('Total do mês: R$ 0,00');
  });

  it('enquanto carrega, não mostra valor nenhum', () => {
    expect(byTestId('total-loading')).toBeTruthy();
    expect(byTestId('month-total')).toBeNull();

    respond(10);
  });

  // Critério 11
  it('se a API responde com erro, mostra a mensagem e nunca R$ 0,00', () => {
    http.expectOne(TOTAL_URL).flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(byTestId('total-error')?.textContent?.trim()).toBe('Não foi possível carregar o total do mês.');
    expect(byTestId('month-total')).toBeNull();
    expect(el.textContent).not.toContain('R$ 0,00');
  });

  // Critério 11 (falha de conexão)
  it('se a conexão falha, mostra a mensagem de erro', () => {
    http.expectOne(TOTAL_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    expect(byTestId('total-error')?.textContent?.trim()).toBe('Não foi possível carregar o total do mês.');
    expect(el.textContent).not.toContain('R$ 0,00');
  });

  // Critério 9
  it('reload() busca o total de novo e mostra o novo valor', () => {
    respond(45.9);

    fixture.componentInstance.reload();
    respond(58.4);

    expect(shownTotal()).toBe('Total do mês: R$ 58,40');
  });

  it('reload() depois de uma falha volta a mostrar o total', () => {
    http.expectOne(TOTAL_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    fixture.detectChanges();

    fixture.componentInstance.reload();
    respond(12.5);

    expect(byTestId('total-error')).toBeNull();
    expect(shownTotal()).toBe('Total do mês: R$ 12,50');
  });
});
