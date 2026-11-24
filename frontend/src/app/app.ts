import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExpenseService, Expense } from './expense';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [FormsModule, DecimalPipe],
  template: `
    <h1>Expense Tracker</h1>

    <form (ngSubmit)="add()">
      <input name="title" [(ngModel)]="title" placeholder="Title" required />
      <input name="amount" type="number" [(ngModel)]="amount" placeholder="Amount" required />
      <input name="category" [(ngModel)]="category" placeholder="Category" />
      <button type="submit">Add</button>
    </form>

    <p><strong>Total: {{ total() }}</strong></p>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    <ul>
      @for (e of expenses(); track e.id) {
        <li>
          {{ e.title }} - {{ e.amount | number }} ({{ e.category }})
          <button type="button" (click)="remove(e.id)">Delete</button>
        </li>
      } @empty {
        <li>Belum ada data.</li>
      }
    </ul>
  `,
})
export class App implements OnInit {
  private api = inject(ExpenseService);

  expenses = signal<Expense[]>([]);
  error = signal('');
  total = computed(() => this.expenses().reduce((sum, e) => sum + e.amount, 0));

  title = '';
  amount: number | null = null;
  category = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.list().subscribe({
      next: (data) => this.expenses.set(data),
      error: (err) => {
        console.error('GET /api/expenses gagal', err.status, String(err.error).slice(0, 200));
        this.error.set('Gagal memuat data.');
      },
    });
  }

  add() {
    if (!this.title || !this.amount) return;

    this.api.create({ title: this.title, amount: this.amount, category: this.category })
      .subscribe({
        next: () => {
          this.title = '';
          this.amount = null;
          this.category = '';
          this.error.set('');
          this.load();
        },
        error: () => this.error.set('Gagal menyimpan data.'),
      });
  }

  remove(id: number) {
    this.api.remove(id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Gagal menghapus data.'),
    });
  }
}