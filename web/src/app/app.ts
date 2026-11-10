import { Component } from '@angular/core';

import { ExpenseForm } from './expenses/expense-form/expense-form';

@Component({
  selector: 'app-root',
  imports: [ExpenseForm],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
