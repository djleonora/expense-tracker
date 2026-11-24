# Expense Tracker

A full-stack expense tracker built with Angular, Express, and PostgreSQL.

## Features

- Add, list, and delete expenses
- Running total computed on the client
- REST API with input validation and rate limiting

## Tech Stack

- **Frontend:** Angular (standalone components, signals, `HttpClient`), TypeScript
- **Backend:** Node.js, Express 5, `pg` (raw SQL), JavaScript (ES modules)
- **Database:** PostgreSQL

## Project Structure

```
expense-tracker/
├── backend/     Express API
└── frontend/    Angular app
```

## API Endpoints

| Method | Endpoint               | Description           |
|--------|------------------------|-----------------------|
| GET    | `/api/expenses`        | List all expenses     |
| POST   | `/api/expenses`        | Create an expense     |
| DELETE | `/api/expenses/:id`    | Delete an expense     |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Angular CLI (`npm install -g @angular/cli`)

### 1. Create the database

```sql
CREATE DATABASE expenses;

\c expenses

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Start the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/expenses
```

Then run:

```bash
npm run dev
```

The API runs on `http://localhost:5000`.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
ng serve --proxy-config proxy.conf.json
```

Open `http://localhost:4200`.

The proxy forwards `/api` requests to the backend, so the frontend does not need CORS configuration during development.

## Notes

- `.env` and `node_modules/` are excluded from version control.
- Replace `USER` and `PASSWORD` with your PostgreSQL credentials.