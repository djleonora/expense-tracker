import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction, TransactionInput } from './transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private readonly url = '/api/transactions';

  list(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.url);
  }

  create(input: TransactionInput): Observable<Transaction> {
    return this.http.post<Transaction>(this.url, input);
  }

  update(id: string, input: TransactionInput): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.url}/${id}`, input);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  reset(): Observable<Transaction[]> {
    return this.http.post<Transaction[]>(`${this.url}/reset`, {});
  }

  clearAll(): Observable<void> {
    return this.http.delete<void>(this.url);
  }
}