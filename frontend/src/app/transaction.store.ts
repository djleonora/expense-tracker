import { Injectable, computed, inject, signal } from '@angular/core';
import { CategoryId, Transaction, TransactionInput, TxType } from './transaction.model';
import { TransactionService } from './transaction.service';

@Injectable({ providedIn: 'root' })
export class TransactionStore {
  private api = inject(TransactionService);

  readonly transactions = signal<Transaction[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly WALLET_TITLE = 'Wallet';

  readonly totalIncome = computed(() => this.sumBy('income'));
  readonly totalExpenses = computed(() => this.sumBy('expense'));
  readonly netBalance = computed(() => this.totalIncome() - this.totalExpenses());
  readonly walletEntry = computed(() =>
  this.transactions().find((t) => t.type === 'income' && t.title === this.WALLET_TITLE) ?? null);
  readonly walletAmount = computed(() => this.walletEntry()?.amount ?? 0);

  setWallet(amount: number, category: CategoryId = 'salary'): void {
    this.error.set('');
  
    const current = this.walletEntry();
    const input: TransactionInput = {
    type: 'income',
    title: this.WALLET_TITLE,
    amount,
    category,
  };

  if (current) {
    this.update(current.id, input);
  } else {
    this.add(input);
  }
}

  // Expense totals per category, largest first. Used by the chart in a later step.
  readonly breakdown = computed(() => {
    const totals = new Map<CategoryId, number>();
    for (const t of this.transactions()) {
      if (t.type !== 'expense') continue;
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
    return [...totals.entries()]
      .map(([id, amount]) => ({ id, amount }))
      .sort((a, b) => b.amount - a.amount);
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.error.set('');
        this.loading.set(false);
      },
      error: () => this.fail('Gagal memuat data.'),
    });
  }

  add(input: TransactionInput): void {
    this.api.create(input).subscribe({
      next: (tx) => this.transactions.update((list) => [tx, ...list]),
      error: () => this.fail('Gagal menyimpan data.'),
    });
  }

  update(id: string, input: TransactionInput): void {
    this.api.update(id, input).subscribe({
      next: (tx) => this.transactions.update((list) => list.map((t) => (t.id === id ? tx : t))),
      error: () => this.fail('Gagal mengubah data.'),
    });
  }

  remove(id: string): void {
    this.api.remove(id).subscribe({
      next: () => this.transactions.update((list) => list.filter((t) => t.id !== id)),
      error: () => this.fail('Gagal menghapus data.'),
    });
  }

  resetDemo(): void {
    this.api.reset().subscribe({
      next: (data) => this.transactions.set(data),
      error: () => this.fail('Gagal mereset data.'),
    });
  }

  clearAll(): void {
    this.api.clearAll().subscribe({
      next: () => this.transactions.set([]),
      error: () => this.fail('Gagal menghapus semua data.'),
    });
  }

  private sumBy(type: TxType): number {
    return this.transactions()
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private fail(message: string): void {
    this.error.set(message);
    this.loading.set(false);
  }
}