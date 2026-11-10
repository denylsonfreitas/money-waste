import { Component } from '@angular/core';

import { CategoryTotals } from './expenses/category-totals/category-totals';
import { ExpenseForm } from './expenses/expense-form/expense-form';
import { ExpenseList } from './expenses/expense-list/expense-list';
import { ExpenseTotal } from './expenses/expense-total/expense-total';

@Component({
  selector: 'app-root',
  imports: [ExpenseForm, ExpenseTotal, CategoryTotals, ExpenseList],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
