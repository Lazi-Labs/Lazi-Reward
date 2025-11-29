# Lazi Rewards

A gift card incentive system for collecting Google reviews. Customers select a business location, copy a pre-written review, post it on Google, and upload a screenshot to claim their reward.

## Tech Stack

- **Laravel 12** - PHP framework
- **Livewire 3** - Reactive components
- **Flux UI Pro** - Component library
- **Tailwind CSS 4** - Styling
- **SQLite** - Database

## Requirements

- PHP 8.2+
- Composer
- Node.js & npm
- [Laravel Herd](https://herd.laravel.com/) (recommended for local dev)

## Installation

```bash
# Clone the repository
git clone <repo-url> lazi-coupons
cd lazi-coupons

# Run setup (installs dependencies, creates .env, runs migrations, builds assets)
composer setup
```

## Development

```bash
# Start all services (server, queue, logs, vite)
composer dev
```

This runs concurrently:
- Laravel dev server
- Queue worker
- Log viewer (Pail)
- Vite dev server

Access the app at `https://lazi-coupons.test` (with Herd) or `http://localhost:8000`.

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# n8n webhook URLs for processing submissions
N8N_SUBMISSION_WEBHOOK=https://your-n8n-instance.com/webhook/submission
N8N_UPLOAD_WEBHOOK=https://your-n8n-instance.com/webhook/upload
```

Business locations, reviews, and gift card options are configured in `config/business.php`.

## Testing

```bash
composer test
```

## How It Works

1. **Select Location** - Customer chooses which business they visited
2. **Post Review** - Customer copies the pre-written review, enters their details, and is redirected to Google Business Profile
3. **Claim Reward** - Customer returns via unique link to upload a screenshot of their posted review

Submissions trigger webhooks to n8n for processing gift card fulfillment.
# lazi-rewards
