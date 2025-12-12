<?php

namespace App\Services;

use App\Models\GiftCardProduct;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TremendousService
{
    protected string $baseUrl;
    protected string $apiKey;
    
    // Product IDs to include in catalog
    protected array $allowedProductIds = [
        'OKMHM2X2OHYV',    // Amazon.com
        'Q24BD9EZ332JT',   // Virtual Visa
        'KV934TZ93NQM',    // PayPal
        'T7V8GK9RPLMJ',    // Starbucks
        'WBMZG8RVPKD2',    // Target
    ];

    public function __construct()
    {
        $this->baseUrl = config('services.tremendous.base_url', 'https://testflight.tremendous.com/api/v2');
        $this->apiKey = config('services.tremendous.api_key', '');
    }

    /**
     * Fetch products from Tremendous API
     */
    public function fetchProducts(): array
    {
        if (empty($this->apiKey)) {
            Log::warning('Tremendous API key not configured');
            return [];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept' => 'application/json',
            ])->get($this->baseUrl . '/products');

            if ($response->successful()) {
                return $response->json('products', []);
            }

            Log::error('Tremendous API error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [];
        } catch (\Exception $e) {
            Log::error('Tremendous API exception', ['message' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Get filtered products (only allowed ones)
     */
    public function getFilteredProducts(): array
    {
        $products = $this->fetchProducts();
        
        return array_filter($products, function ($product) {
            return in_array($product['id'] ?? '', $this->allowedProductIds);
        });
    }

    /**
     * Sync products to database
     */
    public function syncProducts(): int
    {
        $products = $this->getFilteredProducts();
        $synced = 0;

        foreach ($products as $product) {
            GiftCardProduct::updateOrCreate(
                ['tremendous_product_id' => $product['id']],
                [
                    'name' => $product['name'] ?? 'Unknown',
                    'description' => $product['description'] ?? null,
                    'image_url' => $this->extractImageUrl($product),
                    'category' => $product['category'] ?? null,
                    'min_value' => $product['min_value'] ?? 0,
                    'max_value' => $product['max_value'] ?? 0,
                    'currency_code' => $product['currency_codes'][0] ?? 'USD',
                    'last_synced_at' => now(),
                ]
            );
            $synced++;
        }

        // Clear cache after sync
        Cache::forget('gift_card_catalog');

        return $synced;
    }

    /**
     * Get catalog (cached for 24 hours)
     */
    public function getCatalog(): array
    {
        return Cache::remember('gift_card_catalog', 86400, function () {
            // First try to get from database
            $products = GiftCardProduct::active()->ordered()->get();
            
            if ($products->isEmpty()) {
                // If no products in DB, sync from API
                $this->syncProducts();
                $products = GiftCardProduct::active()->ordered()->get();
            }

            return $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'tremendous_id' => $product->tremendous_product_id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'image_url' => $product->image_url,
                    'category' => $product->category,
                    'min_value' => (float) $product->min_value,
                    'max_value' => (float) $product->max_value,
                    'currency_code' => $product->currency_code,
                    'value_range' => $product->formatted_value_range,
                ];
            })->toArray();
        });
    }

    /**
     * Extract best image URL from product data
     */
    protected function extractImageUrl(array $product): ?string
    {
        // Try different image fields
        if (!empty($product['images'])) {
            // Get the largest image
            $images = $product['images'];
            usort($images, fn($a, $b) => ($b['width'] ?? 0) - ($a['width'] ?? 0));
            return $images[0]['src'] ?? null;
        }

        return $product['image_url'] ?? $product['logo_url'] ?? null;
    }

    /**
     * Get allowed product IDs
     */
    public function getAllowedProductIds(): array
    {
        return $this->allowedProductIds;
    }

    /**
     * Set allowed product IDs
     */
    public function setAllowedProductIds(array $ids): self
    {
        $this->allowedProductIds = $ids;
        return $this;
    }
}
