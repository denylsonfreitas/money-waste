import { formatBrl, formatDateBr, todayIso } from './format';

describe('formatBrl', () => {
  it('formata no padrão brasileiro com 2 casas', () => {
    expect(formatBrl(45.9)).toBe('R$ 45,90');
    expect(formatBrl(1234.56)).toBe('R$ 1.234,56');
  });
});

describe('todayIso', () => {
  it('usa a data local no formato aaaa-mm-dd', () => {
    expect(todayIso(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05');
  });
});

describe('formatDateBr', () => {
  it('converte aaaa-mm-dd para dd/mm/aaaa', () => {
    expect(formatDateBr('2026-11-05')).toBe('05/11/2026');
    expect(formatDateBr('2026-01-30')).toBe('30/01/2026');
  });
});
