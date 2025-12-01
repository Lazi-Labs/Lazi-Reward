# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Full development environment (server, queue, logs, vite)
composer dev

# Initial setup
composer setup

# Run tests
composer test

# Lint code
./vendor/bin/pint

# Individual commands
php artisan serve          # Start Laravel server
npm run dev               # Vite dev server
php artisan queue:listen  # Queue worker
php artisan pail          # Log viewer

# Single test file
php artisan test tests/Feature/ExampleTest.php

# Build for production
npm run build

# Create admin user for Filament
php artisan make:filament-user
```

## Architecture

This is a Laravel 12 + Livewire 3 + Flux UI + Filament application for collecting Google reviews in exchange for gift cards.

### Core Flow
1. User visits homepage → `ReviewWizard` component (step 1: select business location)
2. User selects location → step 2: upload service photo, copy pre-written review, enter contact details, choose gift card
3. Form submission → creates `Submission` record, sends webhook to n8n, opens Google Business Profile in new tab while redirecting to upload page
4. User returns via token URL → `ScreenshotUpload` component to upload review screenshot
5. Screenshot upload → updates submission, sends webhook to n8n

### Key Models
- `BusinessLocation` - Business locations with GMB links, review templates (UUID, managed via admin)
- `GiftCard` - Gift card options (UUID, managed via admin)
- `Submission` - Customer submissions with photos (UUID, relationships to location and gift card)
- `User` - Admin users for Filament panel

### Key Files
- `config/business.php` - Webhook URLs only (locations/gift cards now in database)
- `app/Livewire/ReviewWizard.php` - Multi-step form wizard
- `app/Livewire/ScreenshotUpload.php` - Screenshot upload with token validation
- `app/Filament/Resources/` - Admin panel resources

### Admin Panel (Filament)
Access at `/admin` with any registered user.

**Resources:**
- `SubmissionResource` - View/manage customer submissions with status, photos
- `BusinessLocationResource` - CRUD for business locations (Settings group)
- `GiftCardResource` - CRUD for gift card options (Settings group)
- `UserResource` - Manage admin users (Settings group)

### Blade Components

Reusable components in `resources/views/components/`:

| Component | Description |
|-----------|-------------|
| `wizard.layout` | Two-column layout with sidebar and content area |
| `wizard.sidebar` | Progress sidebar showing all 3 steps |
| `wizard.step` | Individual step item in the sidebar |
| `page-header` | Step indicator badge + heading + description |
| `card` | Generic card wrapper with border |
| `location-card` | Business location selection button |
| `location-badge` | Selected location badge with dismiss button |
| `review-box` | Copyable review text box |
| `alert` | Alert/notice box (warning, info, success types) |
| `success-card` | Success confirmation with icon |
| `step-indicator` | "Step X of Y" badge |
| `security-badge` | Security trust badge |

### Tech Stack
- Laravel 12 with MySQL (PHP 8.3+)
- Livewire 3 for reactive components
- Filament v3 for admin panel
- Flux UI (Pro) for component library - use `<flux:component.subcomponent>` syntax (e.g., `<flux:select.option>`)
- Tailwind CSS 4
- Laravel Herd for local dev (uses `.test` domain)

### Webhooks
Submissions and uploads trigger webhooks to n8n (configured via `N8N_SUBMISSION_WEBHOOK` and `N8N_UPLOAD_WEBHOOK` env vars).

## CI/CD

GitHub Actions workflow in `.github/workflows/ci-cd.yml`:

- **On PR to main**: Runs tests with MySQL
- **On push to main**: Runs tests, builds assets, deploys via SSH/rsync

### Deployment
- Uses rsync over SSH to deploy to production server
- Post-deploy runs: `composer install`, `php artisan migrate`, cache commands
- Server config stored in GitHub secrets/variables (APPSYNC_*)

### Required Secrets
- `SSH_PRIVATE_KEY` - SSH key for deployment
- `APPSYNC_REMOTE_USER` - SSH username
- `APPSYNC_REMOTE_DBPASSWORD` - Production DB password
- `COMPOSER_AUTH` - Flux UI Pro credentials (JSON format)

### Required Variables
- `APPSYNC_REMOTE_HOST` - Server IP
- `APPSYNC_REMOTE_BASEPATH` - Deployment path
- `APPSYNC_REMOTE_DBNAME` - Production DB name
