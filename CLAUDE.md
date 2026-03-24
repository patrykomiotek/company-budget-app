# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server
- `npm run build` — production build (standalone output for Docker)
- `npm run lint` — run ESLint (flat config, `eslint.config.mjs`)
- `npx prisma migrate dev` — apply pending migrations
- `npx prisma generate` — regenerate Prisma client (outputs to `src/lib/generated/prisma/`)
- `npx prisma migrate dev --name <name>` — create a new migration
- `npx prisma db seed` — seed companies and categories

## Tech Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma 7 (PostgreSQL via `@prisma/adapter-pg`), better-auth for authentication, shadcn/ui components (base-ui), Zod for validation, react-hook-form.

## Architecture

### Feature-based organization (`src/features/<feature>/`)

Each feature contains:
- `components/` — React components specific to the feature
- `contracts/` — TypeScript types/interfaces (e.g., `transaction.types.ts`)
- `services/commands/` — server actions for mutations (`'use server'`), validated with Zod
- `services/queries/` — server actions for data fetching (`'use server'`)

Features: `transactions`, `merchants`, `customers`, `categories`, `employees`, `products`, `invoices`, `dashboard`, `auth`.

### Routing (`src/app/`)

- `(app)/` — authenticated routes (layout checks session, redirects to `/sign-in`)
  - `/dashboard` — P&L overview with actual vs forecast
  - `/transactions` — transaction list with filters
  - `/transactions/new` — create transaction (with inline category, subscription, invoice support)
  - `/customers` — B2B customer CRUD (who pays you)
  - `/merchants` — merchant/vendor CRUD (who you pay)
  - `/employees` — współpracownicy (collaborators) CRUD
  - `/categories` — expense/income category management
- `(auth)/` — sign-in/sign-up pages
- `api/auth/[...all]/` — better-auth API route handler
- `api/healthcheck/` — health check for Railway deployment

### Shared code (`src/shared/`)

- `lib/auth/` — better-auth config (`index.ts`), session helpers (`helpers.ts`), client (`client.ts`)
- `lib/company/` — company context: `helpers.ts` (cookie-based active company), `queries.ts`
- `lib/prisma.ts` — singleton Prisma client
- `context/company-context.tsx` — CompanyProvider + useCompany() hook for workspace switching
- `types/common.ts` — `OperationResult<T>` and `PaginatedResult<T>` used across all commands/queries
- `utils/error-handling.ts` — `handleCommandError()` for consistent server action error handling

### UI (`src/components/`)

- `ui/` — shadcn/ui primitives (base-ui based)
- App-level components (e.g., `app-sidebar.tsx`, `merchant-combobox.tsx`, `searchable-select.tsx`)

## Key Patterns

- **Company context**: Two companies (Anna PRO, Web Amigos). Active company stored in cookie, read by server components/actions via `getActiveCompanyFilter()`. "Wszystko" = no filter. Sidebar has workspace switcher.
- **Transaction types**: `INCOME`, `EXPENSE`, `FORECAST_INCOME`, `FORECAST_EXPENSE`. Type determines which fields show in the form (merchant vs customer, employee assignment).
- **Merchant vs Customer**: Expenses → Merchant (Sprzedawca). Income → Customer (Klient). Both support inline creation via combobox.
- **Multi-currency**: PLN (primary), EUR, USD. Foreign amounts store `exchangeRate` to PLN. Dashboard aggregates in PLN.
- **Public IDs**: DB uses autoincrement `id` internally; external-facing code uses `publicId` (UUID). Commands receive `publicId`, resolve to internal `id` before DB operations.
- **Server actions**: All data access uses Next.js server actions (`'use server'`). Commands return `OperationResult`, queries return typed data or `PaginatedResult`.
- **Auth guard**: `requireUser()` in every server action; redirects to `/sign-in` if unauthenticated. `getCurrentUser()` for nullable check.
- **Prisma client**: Generated to `src/lib/generated/prisma/` — do not edit. Import types from `@/lib/generated/prisma/client`.
- **Find-or-create**: Use `prisma.upsert` for atomic find-or-create operations (employees, products, customers). Avoid find+create race conditions.
- **Polish language**: User-facing error messages and form labels are in Polish.
- **Prisma schema conventions**: Models use `@@map("snake_case_table")`, fields use `@map("snake_case_column")` for DB column names while keeping camelCase in code. When renaming models, keep `@@map` pointing to original table name to avoid migrations.
- **Inline creation**: Categories, merchants, customers, employees, products can all be created inline from the transaction form via combobox "Dodaj: ..." pattern or dialog.

## Deployment

- **Railway**: `railway.toml` configures Dockerfile build, `prisma migrate deploy` as pre-deploy, healthcheck at `/api/healthcheck`
- **Docker**: Multi-stage build (`node:22-alpine`), standalone Next.js output
- **CI/CD**: GitHub Actions — lint + build on PR/push to `dev`/`main`, semantic release on `main`
- **Git hooks**: Husky pre-commit (lint-staged: ESLint + Prettier), commit-msg (commitlint conventional commits)

## Code Style

- ESLint requires curly braces on all `if`/`else` statements (curly rule)
- Prettier for formatting
- Conventional commits enforced: `feat:`, `fix:`, `chore:`, `docs:`, etc.
