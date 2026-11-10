import { Component } from '@angular/core';

import { ExpenseForm } from './expenses/expense-form/expense-form';
import { ExpenseList } from './expenses/expense-list/expense-list';

@Component({
  selector: 'app-root',
  imports: [ExpenseForm, ExpenseList],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
