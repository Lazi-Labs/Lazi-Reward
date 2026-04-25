<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevent clickjacking
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Enable XSS filter in browsers
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Referrer policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions policy (disable unnecessary browser features)
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Strict Transport Security (HTTPS only) - only in production
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // Content Security Policy
        $csp = $this->buildContentSecurityPolicy();
        $response->headers->set('Content-Security-Policy', $csp);

        return $response;
    }

    protected function buildContentSecurityPolicy(): string
    {
        $viteDevServer = app()->environment('local')
            ? ' https://lazi-rewards.test:5173 https://lazi-rewards.test:5174 wss://lazi-rewards.test:5173 wss://lazi-rewards.test:5174'
            : '';

        $policies = [
            "default-src" => "'self'",
            "script-src" => "'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com" . $viteDevServer,
            "style-src" => "'self' 'unsafe-inline' https://fonts.bunny.net https://fonts.googleapis.com" . $viteDevServer,
            "font-src" => "'self' https://fonts.bunny.net https://fonts.gstatic.com data:",
            "img-src" => "'self' data: blob: https:",
            "connect-src" => "'self' https://rewards.perfectcatchai.com https://cloudflareinsights.com" . $viteDevServer,
            "frame-ancestors" => "'self'",
            "form-action" => "'self'",
            "base-uri" => "'self'",
            "object-src" => "'none'",
        ];

        return collect($policies)
            ->map(fn ($value, $key) => "{$key} {$value}")
            ->implode('; ');
    }
}
