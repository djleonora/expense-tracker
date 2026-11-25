import { HttpInterceptorFn } from '@angular/common/http';
import { localDate } from './utils/date';

const GUEST_KEY = 'expense-tracker:guest-id';

/** Returns the stored guest id, creating one on first visit. */
export function getGuestId(): string {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export const guestInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/transactions')) {
    return next(req);
  }

  const headers = req.headers
    .set('x-guest-id', getGuestId())
    .set('x-local-date', localDate());

  return next(req.clone({ headers }));
};