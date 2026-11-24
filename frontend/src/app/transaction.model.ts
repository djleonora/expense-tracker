export type TxType = 'income' | 'expense';

export type CategoryId =
  | 'food' | 'transport' | 'shopping' | 'bills' | 'health' | 'entertainment'
  | 'salary' | 'gift' | 'other';

export interface Transaction {
  id: string;
  type: TxType;
  title: string;
  amount: number;
  category: CategoryId;
  date: string;
}

export type TransactionInput = Pick<Transaction, 'type' | 'title' | 'amount' | 'category'>;

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  type: TxType;
}

export const CATEGORIES: Category[] = [
  { id: 'food', label: 'Food', icon: '🍜', type: 'expense' },
  { id: 'transport', label: 'Transport', icon: '🚗', type: 'expense' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', type: 'expense' },
  { id: 'bills', label: 'Bills', icon: '🧾', type: 'expense' },
  { id: 'health', label: 'Health', icon: '💊', type: 'expense' },
  { id: 'entertainment', label: 'Fun', icon: '🎮', type: 'expense' },
  { id: 'salary', label: 'Salary', icon: '💼', type: 'income' },
  { id: 'gift', label: 'Gift', icon: '🎁', type: 'income' },
  { id: 'other', label: 'Other', icon: '✨', type: 'income' },
];