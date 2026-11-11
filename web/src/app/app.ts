import { Component, viewChild } from '@angular/core';

import { CategoryTotals } from './expenses/category-totals/category-totals';
import { ExpenseForm } from './expenses/expense-form/expense-form';
import { ExpenseList } from './expenses/expense-list/expense-list';
import { ExpenseTotal } from './expenses/expense-total/expense-total';
import { MonthComparison } from './expenses/month-comparison/month-comparison';

@Component({
  selector: 'app-root',
  imports: [ExpenseForm, ExpenseTotal, MonthComparison, CategoryTotals, ExpenseList],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly total = viewChild.required(ExpenseTotal);
  private readonly comparison = viewChild.required(MonthComparison);
  private readonly categories = viewChild.required(CategoryTotals);
  private readonly list = viewChild.required(ExpenseList);

  /** Depois de registrar, editar ou excluir, o total, a comparação, as categorias e a lista buscam de novo. */
  protected refreshMonth(): void {
    this.total().reload();
    this.comparison().reload();
    this.categories().reload();
    this.list().reload();
  }
}
