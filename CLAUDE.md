# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Laravel 12** (PHP 8.3+)
- **Livewire 3** for reactive components
- **Filament 4** for the admin panel
- **Flux UI / Flux Pro** (Livewire's component library) — `<flux:component.subcomponent>` syntax (e.g. `<flux:select.option>`)
- **Tailwind CSS 4** + **Vite**
- **Tremendous** for gift card distribution
- **n8n** webhooks for notifications

## Application overview

LAZI Rewards is a customer engagement platform for **LIV Pools** and **Perfect Catch Electric**. It does three things in one product:

1. **Review collection** — anonymous review wizard that gives customers a gift card in exchange for a Google review (`ReviewWizard`, `ScreenshotUpload`).
2. **Referral marketing** — campaign-based referral system with tracked links, conversions, and rewards (`ReferralCampaign`, `Referrer`, `Referral`, `ReferralClick`, `ReferralReward`).
3. **CRM + reward fulfillment** — staff-facing Filament admin for businesses, gift cards, reviews, photos, submissions, and referral data; gift card payout via Tremendous.

## Development commands

```bash
composer install                 # install PHP deps
npm install && npm run dev       # install JS deps + start Vite
php artisan serve                # start the dev server
php artisan queue:listen         # process queued jobs
php artisan pail                 # tail logs
composer test                    # phpunit suite
./vendor/bin/pint                # code style
php artisan make:filament-user   # create an admin user
```

`docker-compose.yml` and `Dockerfile` are present for containerized dev — see them for the full stack (app, db, queue worker).

## Architecture

### Domain models (`app/Models/`)
- `Business` — a business location with GMB link and review template.
- `User` — admin and customer accounts (Filament admins + Livewire-authenticated customers).
- `Submission` — a review submission tied to a business and a gift card; carries verification status, Tremendous reward delivery info, and review reservation state.
- `Review`, `CustomerReview`, `Photo` — review content and supporting media; reviews can be paired with photos via `Filament\Pages\PairReviewsPhotos`.
- `GiftCard`, `GiftCardProduct` — gift card catalog and SKU-level Tremendous products.
- `ReferralCampaign`, `Referrer`, `Referral`, `ReferralClick`, `ReferralReward` — the full referral marketing graph (a campaign can have many referrers, each with referrals, with attributable clicks and earned rewards).

### Public Livewire flows (`app/Livewire/`)
- `ReviewWizard` — multi-step review submission flow at `/`.
- `ScreenshotUpload` — token-validated screenshot upload at `/upload-review/{token}`.
- `GiftCardSelector`, `GiftCardCarousel` — gift card picker components used inside the wizard.

### Authenticated customer area
- `Auth\LoginForm`, `Auth\RegisterForm` — at `/login`, `/register`.
- `Account\Dashboard` — at `/dashboard` (auth middleware).

### Admin (Filament 4) at `/admin`
**Resources** (`app/Filament/Resources/`):
`BusinessResource`, `GiftCardResource`, `GiftCardProductResource`, `PhotoResource`, `ReferralCampaignResource`, `ReferralResource`, `ReferralRewardResource`, `ReferrerResource`, `ReviewResource`, `SubmissionResource`, `UserResource`.

**Widgets** (`app/Filament/Widgets/`):
`StatsOverview`, `SubmissionsChart`, `LatestSubmissions`, `BusinessBreakdown`, `GiftCardPopularity`, `ActivityFeed`.

**Custom pages**: `Filament\Pages\PairReviewsPhotos`.

### Services (`app/Services/`)
- `ReferralService` — referral attribution, click tracking, reward calculation.
- `TremendousService` — gift card issuance via the Tremendous API.

### Notifications (`app/Notifications/`)
`NewSubmissionNotification`, `ScreenshotUploadedNotification`.

### Webhooks
Submissions and uploads trigger webhooks to n8n via `N8N_SUBMISSION_WEBHOOK` and `N8N_UPLOAD_WEBHOOK` (see `.env.example`).

## Routes (`routes/web.php`)

| Method | Path | Component | Auth |
|---|---|---|---|
| GET | `/` | `ReviewWizard` | public (throttled) |
| GET | `/upload-review/{token}` | `ScreenshotUpload` | public (throttled) |
| GET | `/login` | `Auth\LoginForm` | guest |
| GET | `/register` | `Auth\RegisterForm` | guest |
| POST | `/logout` | inline | any |
| GET | `/dashboard` | `Account\Dashboard` | auth |
| GET | `/concepts/*` | static views | public — design concepts, removable in prod |

Filament admin lives at `/admin` (mounted by Filament's service provider).

## Reusable Blade components (`resources/views/components/`)

`wizard.layout`, `wizard.sidebar`, `wizard.step`, `wizard.mobile-nav`, `page-header`, `card`, `location-card`, `location-badge`, `review-box`, `alert`, `success-card`, `step-indicator`, `security-badge`, `footer-badge(s)`, `dark-mode-toggle`, `skeletons.*`, `layouts.app`, `layouts.landing`. Use these when building new Livewire views to keep visual consistency.

## CI/CD

GitHub Actions in `.github/workflows/ci-cd.yml` — see file for the up-to-date matrix. Historically: tests on PR; on push to `main`, build assets and rsync deploy. Required GitHub secrets/variables follow the `APPSYNC_*` naming.

## Conventions

- Branches: `feature/*`, `fix/*`. Commit prefixes: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`.
- Run `./vendor/bin/pint` and `composer test` before opening a PR.
- Never commit secrets — use `.env` (gitignored) and the `.env.example` template.
- New referral or review flows should reuse `ReferralService` and `TremendousService` rather than calling their primitives directly.

## Repo cleanup history

This repo went through a multi-fork experiment (Next.js scaffold + a parallel `JobReferral` Laravel fork). All of that was removed in `feature/referral-crm-revamp` (Phase 0) — the Laravel app you see now is the canonical one. Do not reintroduce a parallel JS-only frontend or a competing referral schema; extend `ReferralCampaign`/`Referrer`/`Referral` instead.
