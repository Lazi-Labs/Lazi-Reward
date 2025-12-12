# PHP/Composer stage - install vendor dependencies first
FROM php:8.3-fpm-alpine AS composer-deps

# Install required PHP extensions for composer
RUN apk add --no-cache \
    icu-dev \
    libzip-dev \
    && docker-php-ext-install intl zip

# Install composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy composer files
COPY composer.json composer.lock ./

# Install dependencies (with flux-pro auth)
RUN composer config http-basic.composer.fluxui.dev "chris@portseif.io" "187005dd-39e5-41b8-9e27-1c9e735daa65" && \
    composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Build stage for frontend assets
FROM node:20-alpine AS frontend

WORKDIR /app

# Copy vendor from composer stage (needed for flux.css)
COPY --from=composer-deps /app/vendor ./vendor

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# PHP stage
FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    sqlite \
    sqlite-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    linux-headers \
    $PHPIZE_DEPS

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    pdo_sqlite \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd \
    zip \
    intl \
    opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY --chown=www-data:www-data . .

# Copy built frontend assets
COPY --from=frontend --chown=www-data:www-data /app/public/build ./public/build

# Create necessary directories
RUN mkdir -p storage/framework/{sessions,views,cache} \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache \
    && mkdir -p database \
    && chown -R www-data:www-data storage bootstrap/cache database

# Install PHP dependencies (with flux-pro auth)
RUN composer config http-basic.composer.fluxui.dev "chris@portseif.io" "187005dd-39e5-41b8-9e27-1c9e735daa65" && \
    composer install --no-dev --optimize-autoloader --no-interaction

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
