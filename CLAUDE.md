# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm run lint` — run ESLint (flat config, `eslint.config.mjs`)
- `npx prisma migrate dev` — apply pending migrations
- `npx prisma generate` — regenerate Prisma client (outputs to `src/lib/generated/prisma/`)
- `npx prisma migrate dev --name <name>` — create a new migration

## Tech Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma 7 (PostgreSQL via `@prisma/adapter-pg`), better-auth for authentication, shadcn/ui components, Zod for validation, react-hook-form.

## Architecture

### Feature-based organization (`src/features/<feature>/`)

Each feature contains:
- `components/` — React components specific to the feature
- `contracts/` — TypeScript types/interfaces (e.g., `transaction.types.ts`)
- `services/commands/` — server actions for mutations (`'use server'`), validated with Zod
- `services/queries/` — server actions for data fetching (`'use server'`)

Features: `transactions`, `merchants`, `categories`, `dashboard`, `auth`.

### Routing (`src/app/`)

- `(app)/` — authenticated routes (layout checks session, redirects to `/sign-in`)
- `(auth)/` — sign-in/sign-up pages
- `api/auth/[...all]/` — better-auth API route handler

### Shared code (`src/shared/`)

- `lib/auth/` — better-auth config (`index.ts`), session helpers (`helpers.ts`), client (`client.ts`)
- `lib/prisma.ts` — singleton Prisma client
- `types/common.ts` — `OperationResult<T>` and `PaginatedResult<T>` used across all commands/queries
- `utils/error-handling.ts` — `handleCommandError()` for consistent server action error handling

### UI (`src/components/`)

- `ui/` — shadcn/ui primitives
- App-level components (e.g., `app-sidebar.tsx`, `merchant-combobox.tsx`)

## Key Patterns

- **Public IDs**: DB uses autoincrement `id` internally; external-facing code uses `publicId` (UUID). Commands receive `publicId`, resolve to internal `id` before DB operations.
- **Server actions**: All data access uses Next.js server actions (`'use server'`). Commands return `OperationResult`, queries return typed data or `PaginatedResult`.
- **Auth guard**: `requireUser()` in every server action; redirects to `/sign-in` if unauthenticated. `getCurrentUser()` for nullable check.
- **Prisma client**: Generated to `src/lib/generated/prisma/` — do not edit. Import types from `@/lib/generated/prisma/client`.
- **Polish language**: User-facing error messages and form labels are in Polish.
- **Prisma schema conventions**: Models use `@@map("snake_case_table")`, fields use `@map("snake_case_column")` for DB column names while keeping camelCase in code.
