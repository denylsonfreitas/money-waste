import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { todayIso } from '../format';
import { ExpenseForm } from './expense-form';

const API_URL = 'http://localhost:5215/api/expenses';

describe('ExpenseForm', () => {
  let fixture: ComponentFixture<ExpenseForm>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseForm);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const input = (id: string) => el.querySelector<HTMLInputElement>(`#${id}`)!;
  const select = () => el.querySelector<HTMLSelectElement>('#category')!;
  const byTestId = (id: string) => el.querySelector(`[data-testid="${id}"]`);

  function type(id: string, value: string): void {
    const field = input(id);
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  function choose(category: string): void {
    select().value = category;
    select().dispatchEvent(new Event('change'));
  }

  function submit(): void {
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
  }

  function fillValid(): void {
    type('amount', '45.90');
    type('description', 'Almoço');
    choose('food');
    type('date', '2026-11-05');
    fixture.detectChanges();
  }

  // Critério 9
  describe('ao carregar', () => {
    it('mostra os campos Valor, Descrição, Categoria e Data', () => {
      const labels = Array.from(el.querySelectorAll('label')).map((l) => l.textContent?.trim());
      expect(labels).toEqual(['Valor', 'Descrição', 'Categoria', 'Data']);
      expect(input('amount')).toBeTruthy();
      expect(input('description')).toBeTruthy();
      expect(select()).toBeTruthy();
      expect(input('date')).toBeTruthy();
    });

    it('lista as 8 categorias com os rótulos em português', () => {
      const options = Array.from(select().options)
        .filter((o) => o.value)
        .map((o) => o.textContent?.trim());
      expect(options).toEqual([
        'Alimentação',
        'Transporte',
        'Moradia',
        'Saúde',
        'Lazer',
        'Educação',
        'Compras',
        'Outros',
      ]);
    });

    it('vem com a Data preenchida com hoje', () => {
      expect(input('date').value).toBe(todayIso());
    });
  });

  // Critério 10
  describe('ao registrar com dados válidos', () => {
    it('envia à API, mostra a confirmação e limpa o formulário com a Data de hoje', () => {
      fillValid();
      submit();

      const req = http.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        amount: 45.9,
        description: 'Almoço',
        category: 'food',
        date: '2026-11-05',
      });
      req.flush(
        { id: '1', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-05' },
        { status: 201, statusText: 'Created' },
      );
      fixture.detectChanges();

      expect(byTestId('confirmation')?.textContent?.trim()).toBe('Gasto registrado: Almoço — R$ 45,90');
      expect(input('amount').value).toBe('');
      expect(input('description').value).toBe('');
      expect(select().value).toBe('');
      expect(input('date').value).toBe(todayIso());
      expect(byTestId('amount-error')).toBeNull();
      expect(byTestId('description-error')).toBeNull();
      expect(byTestId('category-error')).toBeNull();
    });

    it('avisa quem usa o formulário (evento created) com o gasto devolvido pela API', () => {
      const created: unknown[] = [];
      fixture.componentInstance.created.subscribe((expense) => created.push(expense));
      fillValid();
      submit();

      const expense = { id: '1', amount: 45.9, description: 'Almoço', category: 'food', date: '2026-11-05' };
      http.expectOne(API_URL).flush(expense, { status: 201, statusText: 'Created' });

      expect(created).toEqual([expense]);
    });

    it('não emite created quando a API falha', () => {
      const created: unknown[] = [];
      fixture.componentInstance.created.subscribe((expense) => created.push(expense));
      fillValid();
      submit();

      http.expectOne(API_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(created).toEqual([]);
    });

    it('formata valores maiores no padrão brasileiro', () => {
      fillValid();
      submit();
      http
        .expectOne(API_URL)
        .flush({ id: '2', amount: 1234.56, description: 'Aluguel', category: 'housing', date: '2026-11-05' });
      fixture.detectChanges();

      expect(byTestId('confirmation')?.textContent?.trim()).toBe('Gasto registrado: Aluguel — R$ 1.234,56');
    });
  });

  // Critério 11
  describe('com dados inválidos', () => {
    it('com tudo vazio, mostra erro em cada campo obrigatório e não envia nada', () => {
      submit();

      http.expectNone(API_URL);
      expect(byTestId('amount-error')?.textContent).toContain('Informe o valor do gasto.');
      expect(byTestId('description-error')?.textContent).toContain('A descrição é obrigatória.');
      expect(byTestId('category-error')?.textContent).toContain('Escolha uma categoria.');
    });

    for (const amount of ['0', '-5']) {
      it(`com valor ${amount}, mostra que o valor deve ser maior que zero e não envia nada`, () => {
        fillValid();
        type('amount', amount);
        submit();

        http.expectNone(API_URL);
        expect(byTestId('amount-error')?.textContent).toContain('O valor deve ser maior que zero.');
      });
    }

    it('com valor de mais de 2 casas decimais, mostra erro e não envia nada', () => {
      fillValid();
      type('amount', '10.999');
      submit();

      http.expectNone(API_URL);
      expect(byTestId('amount-error')?.textContent).toContain('no máximo 2 casas decimais');
    });

    it('com descrição só de espaços, mostra que a descrição é obrigatória e não envia nada', () => {
      fillValid();
      type('description', '   ');
      submit();

      http.expectNone(API_URL);
      expect(byTestId('description-error')?.textContent).toContain('A descrição é obrigatória.');
    });

    it('sem categoria, mostra erro e não envia nada', () => {
      fillValid();
      choose('');
      submit();

      http.expectNone(API_URL);
      expect(byTestId('category-error')?.textContent).toContain('Escolha uma categoria.');
    });
  });

  // Critério 12
  describe('quando a API falha', () => {
    it('com 400, mostra a mensagem da API em português e mantém os dados digitados', () => {
      fillValid();
      submit();

      http.expectOne(API_URL).flush(
        { title: 'Dados do gasto inválidos.', status: 400, errors: { category: ['A categoria é inválida.'] } },
        { status: 400, statusText: 'Bad Request' },
      );
      fixture.detectChanges();

      expect(byTestId('submit-error')?.textContent).toContain('A categoria é inválida.');
      expect(byTestId('confirmation')).toBeNull();
      expectFormKept();
    });

    it('com falha de conexão, mostra mensagem em português e mantém os dados digitados', () => {
      fillValid();
      submit();

      http.expectOne(API_URL).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
      fixture.detectChanges();

      expect(byTestId('submit-error')?.textContent).toContain('Não foi possível falar com o servidor');
      expectFormKept();
    });

    function expectFormKept(): void {
      expect(input('amount').value).toBe('45.90');
      expect(input('description').value).toBe('Almoço');
      expect(select().value).toBe('food');
      expect(input('date').value).toBe('2026-11-05');
    }
  });
});
