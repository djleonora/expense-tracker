import {Injectable, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface Expense {
    id: number;
    title: string;
    amount: number;
    category: string;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class ExpenseService {
    private http = inject(HttpClient);
    private readonly url = '/api/expenses';

    list(): Observable<Expense[]> {
        return this.http.get<Expense[]>(this.url);
    }

    create(data: Pick<Expense, 'title' | 'amount' | 'category'>): Observable<Expense> {
        return this.http.post<Expense>(this.url, data);
    }

    remove(id: number): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}   