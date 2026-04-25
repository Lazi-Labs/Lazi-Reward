@AGENTS.md

# LAZI Rewards — Claude Code project guide

Customer rewards, referral, and review platform for **LIV Pools** and **Perfect Catch Electric**, modeled after [referpro.com](https://www.referpro.com/how-it-works).

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** strict
- **Tailwind CSS 4** + **shadcn/ui** (Radix base, new-york style)
- **Clerk** for authentication
- **Drizzle ORM** + **Neon Postgres** (serverless HTTP driver)
- **Zod** for runtime validation
- **Resend** (email) + **Twilio** (SMS) — wired in Phase 5
- **Tremendous** for gift card issuance — wired in Phase 5
- Hosted on **Vercel**

## Build phases

Track progress via TaskList. Plan lives at `/Users/yramos/.claude/plans/look-over-the-entire-cryptic-sunbeam.md` (note: that plan was for the abandoned Laravel-extension path; the current Next.js plan lives in this repo's task list).

| Phase | Status |
|---|---|
| 0 — Scaffold (this) | in progress |
| 1 — Drizzle schema | pending |
| 2 — Public marketing + Clerk auth | pending |
| 3 — Customer referral flow | pending |
| 4 — Admin panel (CRM) | pending |
| 5 — Notifications + reward fulfillment | pending |

## Layout

```
src/
├── app/                    # App Router pages
│   ├── layout.tsx          # Root layout — wraps with ClerkProvider
│   ├── page.tsx            # Public marketing home
│   └── globals.css         # Tailwind + shadcn theme tokens
├── components/
│   └── ui/                 # shadcn primitives (button, card, input, etc.)
├── db/
│   ├── index.ts            # Neon HTTP client + Drizzle instance
│   ├── schema.ts           # Drizzle table definitions (Phase 1)
│   └── migrations/         # drizzle-kit generated SQL (Phase 1+)
├── lib/
│   └── utils.ts            # cn() and shared helpers
└── proxy.ts                # Clerk auth gating (Next.js 16 proxy convention)
```

## Conventions

- **App Router + Server Components by default.** Add `"use client"` only when needed for interactivity.
- **Use `proxy.ts`, not `middleware.ts`.** Next.js 16 deprecated `middleware.ts`.
- **shadcn primitives over raw HTML.** Read the shadcn skill before composing UI.
- **Drizzle for all DB access.** No raw SQL in route handlers.
- **Zod for all external input.** Validate API request bodies, search params, form submissions.
- **Server Actions or Route Handlers.** No separate API client unless we need cross-app reuse.
- **Env vars via `.env.local`** (gitignored). Template in `.env.example`. On Vercel use `vercel env`.
- **Drizzle scripts auto-load `.env`** via `dotenv/config` in `drizzle.config.ts`.

## Commands

```bash
pnpm dev              # next dev (turbopack)
pnpm build            # next build
pnpm lint             # eslint
pnpm typecheck        # tsc --noEmit
pnpm db:push          # apply schema directly to DB (dev)
pnpm db:generate      # generate migration SQL from schema diff
pnpm db:migrate       # apply migrations (CI/prod)
pnpm db:studio        # open Drizzle Studio
```

## Reference: prior Laravel implementation

A complete Laravel + Filament implementation of this product (with full referral marketing schema, Tremendous gift card integration, and review wizard) lives on the `feature/referral-crm-revamp` branch. Use it as a reference for:

- Business rules around referral attribution and rewards
- Tremendous API integration patterns
- The referral campaign data model

Do **not** port verbatim — translate concepts to Drizzle/Next.js idioms.

## Branches

- `main` — pre-revamp state (3-way fork mess; do not deploy)
- `feature/referral-crm-revamp` — Laravel restoration (preserved as reference)
- `feature/nextjs-rebuild` — **active** — this branch
