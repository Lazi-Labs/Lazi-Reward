#!/bin/sh
set -e

# Ensure storage directories exist and have correct permissions
mkdir -p /var/www/html/storage/framework/{sessions,views,cache}
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/storage/app/public
chown -R www-data:www-data /var/www/html/storage
chown -R www-data:www-data /var/www/html/bootstrap/cache

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Wait for database to be ready (if using external MySQL)
if [ "$DB_CONNECTION" = "mysql" ]; then
    echo "Waiting for MySQL..."
    sleep 5
fi

# Run migrations
php artisan migrate --force

# Only cache in production
if [ "$APP_ENV" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Create storage link
php artisan storage:link --force 2>/dev/null || true

# Create supervisor log directory
mkdir -p /var/log/supervisor

exec "$@"
