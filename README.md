# Retain API

REST API for **Retain**, a personal expense and budget manager. It handles authentication, expenses, monthly budgets, categories, the user dashboard and admin insights.

- **Live API:** https://retain-app-backend-6pyt.onrender.com/api (health check: [`/api/health`](https://retain-app-backend-6pyt.onrender.com/api/health))
- **Frontend:** [Github Repo](https://github.com/El-Gibbor/retain-app-frontend) | [Live Url](https://retain-app-frontend-dusky.vercel.app)
- **Demo login:** `demo@retain.app` / `DemoPass2026`

> The API runs on Render's free tier and sleeps after about 15 minutes without traffic, so the first request after a quiet spell can take up to a minute.

## Tech Stack

| Area | Technology |
| --- | --- |
| Runtime | Node.js 20+, TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 with the `pg` driver adapter |
| Auth | JWT (`jsonwebtoken`), password hashing with `bcryptjs` |
| Validation | Zod |
| Security | Helmet, CORS allow-list |

## Features

- **Authentication**: sign up, sign in and current-user lookup with JWT bearer tokens. Every new account gets the `USER` role; the admin account is created by the seed script.
- **Expenses**: full CRUD scoped to the signed-in user, with search, category and payment-method filters, date and amount ranges, sorting by date or amount, and pagination.
- **Monthly budgets**: set or update a budget per month and get spent, remaining, percent used and a `within` / `approaching` / `over` status.
- **User dashboard**: monthly totals, remaining budget, highest expense, spending by category and recent expenses in one request.
- **Admin categories**: create, rename and delete categories. Deleting a category moves its expenses to the protected **Uncategorized** category in a single transaction.
- **Admin insights**: user and expense totals, total value, expenses this month, spending per category, top 5 and bottom 5 categories, recent expenses and recent sign-ups.
- **Ownership checks**: users only ever see their own expenses and budgets. Requests for another user's records return `404` so their ids are never confirmed.

## Getting Started

### Prerequisites

- Node.js 20 or newer
- A PostgreSQL database (a free [Neon](https://neon.tech) project works)

### Setup

```bash
git clone https://github.com/El-Gibbor/retain-app-backend.git
cd retain-app-backend
npm install
cp .env.example .env   # then fill in the values below
npm run db:deploy      # apply migrations
npm run db:seed        # create the admin account and default categories
npm run dev            # http://localhost:4000
```

### Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Port to listen on. Defaults to `4000`. |
| `NODE_ENV` | No | `development`, `production` or `test`. |
| `CLIENT_ORIGIN` | No | Allowed frontend origin(s), comma-separated. Defaults to `http://localhost:5173`. |
| `DATABASE_URL` | Yes | Pooled Postgres connection string used by the app at runtime. |
| `DATABASE_URL_UNPOOLED` | Yes | Direct Postgres connection string used by Prisma migrations. |
| `JWT_SECRET` | Yes | Secret for signing tokens, at least 32 characters. |
| `JWT_EXPIRES_IN` | No | Token lifetime, e.g. `7d` or `12h`. Defaults to `7d`. |
| `ADMIN_NAME` | Seed only | Display name of the seeded admin. |
| `ADMIN_EMAIL` | Seed only | Email of the seeded admin. |
| `ADMIN_PASSWORD` | Seed only | Password of the seeded admin, at least 8 characters. |

The server validates its environment on startup and exits with a clear message if anything is missing.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with hot reload. |
| `npm run build` | Generate the Prisma client and compile to `dist/`. |
| `npm start` | Run the compiled build. |
| `npm run lint` | Lint the project. |
| `npm run typecheck` | Type-check without emitting files. |
| `npm run db:migrate` | Create and apply a migration in development. |
| `npm run db:deploy` | Apply pending migrations (production). |
| `npm run db:seed` | Seed the admin account and categories. Safe to re-run. |

## API Reference

Base path: `/api`. Protected routes expect an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/signup` | Public | Create an account. Body: `{ name, email, password }`. Returns `{ token, user }`. |
| `POST` | `/auth/signin` | Public | Sign in. Body: `{ email, password }`. Returns `{ token, user }`. |
| `GET` | `/auth/me` | User | Return the signed-in user. |

### Expenses

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/expenses` | User | List the user's expenses (see query parameters below). |
| `GET` | `/expenses/:id` | User | Get one expense. |
| `POST` | `/expenses` | User | Create an expense. |
| `PATCH` | `/expenses/:id` | User | Update any subset of fields. |
| `DELETE` | `/expenses/:id` | User | Delete an expense. Returns `204`. |

**Expense body**

```json
{
  "title": "Groceries",
  "amount": 45.5,
  "date": "2026-10-02",
  "paymentMethod": "CARD",
  "categoryId": "uuid (optional, defaults to Uncategorized)",
  "notes": "optional"
}
```

`paymentMethod` is one of `CASH`, `CARD`, `BANK_TRANSFER`, `MOBILE_MONEY`, `OTHER`.

**List query parameters**

| Parameter | Example | Description |
| --- | --- | --- |
| `search` | `grocer` | Case-insensitive match on title or notes. |
| `categoryId` | `id1,id2` | One or more category ids. |
| `paymentMethod` | `CASH,CARD` | One or more payment methods. |
| `from`, `to` | `2026-10-01` | Inclusive date range. |
| `minAmount`, `maxAmount` | `10`, `100` | Inclusive amount range. |
| `sortBy` | `date` \| `amount` | Defaults to `date`. |
| `sortOrder` | `asc` \| `desc` | Defaults to `desc`. |
| `page`, `limit` | `1`, `10` | Pagination. `limit` is capped at 100. |

Returns `{ data: Expense[], pagination: { page, limit, total, totalPages } }`.

### Categories

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/categories` | User | List all categories, with Uncategorized last. |

### Budgets

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/budgets/:month` | User | Budget summary for a month (`YYYY-MM`). |
| `PUT` | `/budgets/:month` | User | Set or update the budget. Body: `{ amount }`. |

A budget summary looks like:

```json
{
  "month": "2026-10",
  "budget": 800,
  "spent": 672,
  "remaining": 128,
  "percentUsed": 84,
  "status": "approaching"
}
```

`status` is `unset` (no budget), `within` (under 80%), `approaching` (80–100%) or `over` (above 100%).

### Dashboard

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/dashboard?month=YYYY-MM` | User | Budget summary, expense count, highest expense, spending by category and the 5 most recent expenses. `month` defaults to the current month. |

### Admin

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/admin/categories` | Admin | Create a category. Body: `{ name }`. |
| `PATCH` | `/admin/categories/:id` | Admin | Rename a category. Body: `{ name }`. |
| `DELETE` | `/admin/categories/:id` | Admin | Delete a category and move its expenses to Uncategorized. Returns `{ deletedId, reassignedExpenses, reassignedTo }`. |
| `GET` | `/admin/insights` | Admin | Platform statistics. |

### Health

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Liveness check. |

### Errors

Every error uses the same shape:

```json
{
  "error": {
    "message": "Validation failed",
    "details": { "amount": ["Amount must be greater than 0"] }
  }
}
```
