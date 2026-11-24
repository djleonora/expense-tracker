import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { TransactionStore } from './transaction.store';
import { CATEGORIES, CategoryId, TxType } from './transaction.model';
import { ThemeService } from './theme.service';


@Component({
  selector: 'app-root',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  store = inject(TransactionStore);

  type: TxType = 'expense';
  title = '';
  amount: number | null = null;
  amountText = '';
  category: CategoryId = 'food';
  theme = inject(ThemeService);
  editingWallet = false;
  walletText = '';
  walletAmount: number | null = null;

  meta(id: CategoryId): string {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? `${c.icon} ${c.label}` : id;
  }

  startWalletEdit() {
  this.editingWallet = true;
  this.walletAmount = this.store.walletAmount();
  this.walletText = this.walletAmount ? this.format(this.walletAmount) : '';
}

onWalletInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const digits = input.value.replace(/\D/g, '').slice(0, 12);

  this.walletAmount = digits ? Number(digits) : null;
  this.walletText = this.walletAmount ? this.format(this.walletAmount) : '';
  input.value = this.walletText;
}

saveWallet() {
  // Enter and blur can both fire, so only continue while editing.
  if (!this.editingWallet) return;
  this.editingWallet = false;

  const value = this.walletAmount ?? 0;

  // Empty or zero counts as a cancel, so nothing is sent to the API.
  if (value <= 0) return;

  // Value unchanged, so there's nothing to save.
  if (value === this.store.walletAmount()) return;

  this.store.setWallet(value);
}

cancelWalletEdit() {
  this.editingWallet = false;
  this.walletAmount = null;
  this.walletText = '';
}

  dateLabel(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.round((today.getTime() - date.getTime()) / 86_400_000);

    if (diff === 0) return 'Hari ini';
    if (diff === 1) return 'Kemarin';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  // Largest remainder method: rounded percentages that always sum to 100.
  shares = computed(() => {
    const items = this.store.breakdown();
    const total = this.store.totalExpenses();
    const result = new Map<CategoryId, number>();
    if (!total) return result;

    const exact = items.map((b) => ({ id: b.id, value: (b.amount / total) * 100 }));
    for (const e of exact) result.set(e.id, Math.floor(e.value));

    let remaining = 100 - [...result.values()].reduce((a, b) => a + b, 0);
    const byRemainder = [...exact].sort((a, b) => (b.value % 1) - (a.value % 1));

    for (const e of byRemainder) {
      if (remaining-- <= 0) break;
      result.set(e.id, result.get(e.id)! + 1);
    }
    return result;
  });

  share(id: CategoryId): number {
    return this.shares().get(id) ?? 0;
  }

  // Bar width relative to the largest category, so the top bar is always 100%.
  barWidth(amount: number): number {
    const max = this.store.breakdown()[0]?.amount ?? 0;
    return max ? (amount / max) * 100 : 0;
  }

  resetDemo() {
    if (confirm('Kembalikan ke 14 data demo?')) {
      this.store.resetDemo();
    }
  }

  clearAll() {
    if (confirm('Hapus semua transaksi? Tindakan ini tidak bisa dibatalkan.')) {
      this.store.clearAll();
    }
  }

  filter = signal<CategoryId | 'all'>('all');

  visible = computed(() => {
    const f = this.filter();
    const list = this.store.transactions();
    return f === 'all' ? list : list.filter((t) => t.category === f);
  });

  setFilter(f: CategoryId | 'all') {
    this.filter.set(f);
  }

  CATEGORIES = CATEGORIES;

  get categoryOptions() {
    return CATEGORIES.filter((c) => c.type === this.type);
  }

  setType(type: TxType) {
    this.type = type;
    this.category = this.categoryOptions[0].id;
  }

  // Keep only digits, cap at 12 digits, then show with thousand separators.
  onAmountInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 12);

    this.amount = digits ? Number(digits) : null;
    this.amountText = this.amount ? this.format(this.amount) : '';
    input.value = this.amountText;
  }

  add() {
    const title = this.title.trim();
    if (!title || !this.amount || this.amount <= 0) return;

    this.store.add({
      type: this.type,
      title,
      amount: this.amount,
      category: this.category,
    });

    this.title = '';
    this.amount = null;
    this.amountText = '';
  }

  private format(n: number): string {
    return new Intl.NumberFormat('en-US').format(n);
  }
}