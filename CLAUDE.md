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

Features: `transactions`, `merchants`, `customers`, `categories`, `employees`, `products`, `invoices`, `dashboard`, `auth`, `fakturownia`.

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
- **Fakturownia integration**: Pull-on-demand import of invoices from Fakturownia.pl API. User clicks "Importuj z Fakturowni" in transaction form → picks invoice from dialog → form fields auto-populate. Department-to-company mapping: Web Amigos (dept 1493345), Anna PRO (dept 1891309). Customer matching by NIP then name. Linking fields: `fakturowniaInvoiceId` on Transaction, `fakturowniaClientId` on Customer, `fakturowniaProductId` on Product. Config via env vars `FAKTUROWNIA_API_TOKEN` and `FAKTUROWNIA_ACCOUNT_NAME`.

## Deployment

- **Railway**: `railway.toml` configures Dockerfile build, `prisma migrate deploy` as pre-deploy, healthcheck at `/api/healthcheck`
- **Docker**: Multi-stage build (`node:22-alpine`), standalone Next.js output
- **CI/CD**: GitHub Actions — lint + build on PR/push to `dev`/`main`, semantic release on `main`
- **Git hooks**: Husky pre-commit (lint-staged: ESLint + Prettier), commit-msg (commitlint conventional commits)

## Code Style

- ESLint requires curly braces on all `if`/`else` statements (curly rule)
- Prettier for formatting
- Conventional commits enforced: `feat:`, `fix:`, `chore:`, `docs:`, etc.

## Testing Requirements

All new code must include tests. Use Vitest + React Testing Library (`jsdom` environment). Test files live next to the code they test in `__tests__/` directories.

**Required tests by file type:**

| File type                          | Tests required                                 | Example                                                                 |
| ---------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| **Utility functions** (pure JS/TS) | Unit tests                                     | `src/app/lib/utils/__tests__/fileValidation.test.ts`                    |
| **Redux slices**                   | Unit tests for all reducers                    | `src/store/__tests__/threadsSlice.test.ts`                              |
| **Zod schemas / validators**       | Unit tests for valid/invalid inputs            | `src/features/messages/contracts/__tests__/message.types.test.ts`       |
| **React components**               | Integration tests (render, interaction, state) | `src/app/components/__tests__/KnowledgeBasePickerDialog.test.tsx`       |
| **Complex components**             | Unit tests for logic + integration for UI      | `src/app/components/Assistant/PromptForm/__tests__/PromptForm.test.tsx` |
| **New screens / pages**            | At minimum E2E smoke test (Playwright)         | `npm run test:e2e`                                                      |

**Unit test conventions (Vitest):**

- Wrap components with `<NextIntlClientProvider messages={...} locale="en">` for i18n
- Mock server actions (`vi.mock`) — never call real APIs in tests
- Mock external modules (Stripe, Prisma, logger) that would fail in jsdom
- Use `vi.hoisted()` for mock functions referenced inside `vi.mock()` factories
- Add `ResizeObserver` polyfill when testing cmdk/Radix components
- Use `@testing-library/user-event` for realistic user interactions
- Use `waitFor` for async state changes
- Follow existing patterns in `src/store/__tests__/`, `src/app/lib/utils/__tests__/`

### E2E Tests (Playwright)

E2E tests live in `e2e/` and run against a seeded local database.

**Structure:**

- `e2e/helpers.ts` — `ROUTES`, `LABELS`, `login()`, URL builders, Polish label constants
- `e2e/fixtures.ts` — Test data constants (course titles, quiz questions, event data)
- `e2e/seed-fixtures.ts` — Seeds test courses, lessons, quizzes, events, evaluations
- `e2e/global-setup.ts` — Resets DB, runs main seed + fixture seed
- `e2e/auth.setup.ts` — Stores authenticated sessions to `.auth/admin.json` and `.auth/user.json`

**Naming:** Files use `{priority}-{name}.spec.ts` format:

- `p0-*` — Critical flows: auth, enrollment, learning, quizzes, certificates
- `p1-*` — Important flows: course management, events, evaluations, CRUD
- `p2-*` — Admin/auxiliary: users, companies, events CRUD
- `smoke-*` — Quick navigation and page-load checks

**Playwright projects** (in `playwright.config.ts`):

- `setup` — Auth setup (runs first)
- `p0-no-auth` — P0 auth tests (no stored auth)
- `p0-user` — P0 user flows (stored user auth)
- `p0-approval` — P0 enrollment approval (multi-role, own auth)
- `p1-user` — P1 user flows (stored user auth)
- `p1-admin` — P1 admin flows (stored admin auth)
- `p2-admin` — P2 admin flows (stored admin auth)
- `smoke` — Smoke tests (stored admin auth)

**Conventions:**

- All routes use `/pl` locale prefix (Polish UI text in assertions)
- Import `ROUTES` and `LABELS` from `e2e/helpers.ts`, test data from `e2e/fixtures.ts`
- Use semantic selectors: `getByRole()`, `getByText()`, Polish labels — no `data-testid` unless already present
- Serial tests (`test.describe.serial`) for multi-step flows (enrollment → learning → quiz)
- Timeouts: 10s for visibility checks, 15s for navigation/login, 30s for hard navigations
- Multi-role tests use separate browser contexts with `login()` helper

### Manual Regression Checklist

A prioritized manual regression checklist is maintained at `docs/regression-checklist.md`. It covers ~120 test cases across P0 (critical), P1 (high), P2 (medium), and P3 (low/admin) scenarios for auth, course enrollment, learning, quizzes, certificates, events, evaluations, company/startup management, file uploads, i18n, and email notifications. Use it before releases to verify core functionality.

## Post-Task Workflow

After completing any coding task that modifies or creates files:

1. **Write tests first** — Add unit/integration tests for all new code before proceeding to review. Follow the testing conventions in the "Testing Requirements" section above.
2. **Run tests** — Execute `npx vitest run` to verify all tests pass.
3. **Run code review** — Run `/coderabbit:review` to review the changes before reporting completion to the user.
