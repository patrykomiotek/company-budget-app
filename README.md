# Company Budget App

Financial dashboard for managing budgets across multiple companies (Anna PRO, Web Amigos).

## Features

- **Transactions**: Income, expenses, and forecasts with multi-currency support (PLN, EUR, USD)
- **Company context**: Switch between Anna PRO, Web Amigos, or view combined data
- **Customers & Merchants**: B2B customer management (who pays you) and merchant/vendor tracking (who you pay)
- **Invoices**: Invoice number, due date, and line items (products/services) on transactions
- **Subscriptions**: Quick tool subscription creation with auto-generated monthly transactions
- **Categories**: Income/expense categories with subcategories, inline creation
- **Employees**: Collaborator management with assignment to expense transactions
- **P&L Dashboard**: Monthly profit & loss with actual vs forecast, category breakdowns

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui (base-ui)
- **Database**: PostgreSQL, Prisma 7
- **Auth**: better-auth
- **Validation**: Zod, react-hook-form

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env .env.local
# Edit .env.local with your DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL

# Run migrations
npx prisma migrate dev

# Seed database (companies + categories)
npx prisma db seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (standalone) |
| `npm run lint` | Run ESLint |
| `npx prisma migrate dev` | Apply migrations |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma db seed` | Seed companies and categories |

## Deployment

Deployed on **Railway** via Docker.

- `railway.toml` — build + deploy config
- `Dockerfile` — multi-stage build (node:22-alpine)
- Pre-deploy: `prisma migrate deploy`
- Healthcheck: `/api/healthcheck`

## CI/CD

- **GitHub Actions**: Lint + build on PR/push to `dev` and `main`
- **Semantic Release**: Auto-versioning and GitHub releases on `main`
- **CodeRabbit**: Automated code review on PRs
- **Git hooks**: Husky + lint-staged (ESLint, Prettier) + commitlint (conventional commits)
