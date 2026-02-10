# Tremendous API - Usage Examples

## Quick Start Examples

### 1. Get All Products for Carousel ($25 fixed amount)

```php
use App\Services\TremendousService;

$tremendous = app(TremendousService::class);

// Get products from your campaign
$campaignId = config('services.tremendous.default_campaign_id');
$products = $tremendous->getCampaignProducts($campaignId);

// Each product will have:
// - id: Product identifier
// - name: Display name (e.g., "Amazon.com Gift Card")
// - description: Product description
// - images: Array with image URLs
// - countries: Available countries
// - currency_codes: Supported currencies

foreach ($products as $product) {
    echo "{$product['name']} - Available in " . implode(', ', $product['countries']) . "\n";
}
```

### 2. Display in Livewire Component

In your Blade file:

```html
<!-- Simple usage -->
<livewire:gift-card-carousel 
    :campaign-id="$campaignId" 
    :amount="25.00" 
/>

<!-- Or with default campaign from config -->
<livewire:gift-card-carousel />
```

### 3. Display with Alpine.js

```html
<div x-data="giftCarousel()" x-init="init()">
    <!-- Loading State -->
    <div x-show="loading" class="text-center py-8">
        <div class="spinner"></div>
        <p>Loading gift cards...</p>
    </div>

    <!-- Carousel -->
    <div x-show="!loading && products.length > 0" class="relative">
        <!-- Current Product -->
        <template x-if="currentProduct">
            <div class="card">
                <img :src="currentProduct.images?.['1x']" :alt="currentProduct.name">
                <h3 x-text="currentProduct.name"></h3>
                <p x-text="currentProduct.description"></p>
                <div class="text-2xl font-bold text-green-600">$25.00</div>
            </div>
        </template>

        <!-- Navigation -->
        <button @click="prev()" class="nav-btn left">←</button>
        <button @click="next()" class="nav-btn right">→</button>

        <!-- Dots -->
        <div class="dots">
            <template x-for="(product, index) in products" :key="product.id">
                <button 
                    @click="currentIndex = index"
                    :class="{'active': index === currentIndex}"
                    class="dot"
                ></button>
            </template>
        </div>
    </div>
</div>

<script>
function giftCarousel() {
    return {
        products: [],
        currentIndex: 0,
        loading: true,
        
        get currentProduct() {
            return this.products[this.currentIndex] || null;
        },
        
        async init() {
            try {
                const campaignId = '{{ config("services.tremendous.default_campaign_id") }}';
                const response = await fetch(`/api/tremendous/campaigns/${campaignId}/products`);
                const data = await response.json();
                this.products = data.data || [];
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                this.loading = false;
            }
        },
        
        next() {
            this.currentIndex = (this.currentIndex + 1) % this.products.length;
        },
        
        prev() {
            this.currentIndex = this.currentIndex === 0 
                ? this.products.length - 1 
                : this.currentIndex - 1;
        }
    }
}
</script>
```

## Complete Review Reward Flow

### Step 1: User Submits Review with Photo

```php
// In your ReviewController

use App\Services\TremendousService;

public function submitReview(Request $request)
{
    $validated = $request->validate([
        'business_id' => 'required|exists:businesses,id',
        'review_text' => 'required|string',
        'photo' => 'required|image',
        'reviewer_name' => 'required|string',
        'reviewer_email' => 'required|email',
    ]);

    // Store review
    $review = Review::create([
        'business_id' => $validated['business_id'],
        'text' => $validated['review_text'],
        'reviewer_name' => $validated['reviewer_name'],
        'reviewer_email' => $validated['reviewer_email'],
        'status' => 'pending_verification',
    ]);

    // Store photo
    $photoPath = $request->file('photo')->store('review-photos', 'public');
    $review->photo_path = $photoPath;
    $review->save();

    // Return to gift card selection
    return redirect()->route('reviews.select-reward', $review->id);
}
```

### Step 2: Show Gift Card Selection (Carousel)

```php
// ReviewController.php

public function selectReward(Review $review, TremendousService $tremendous)
{
    $campaignId = config('services.tremendous.default_campaign_id');
    $products = $tremendous->getCampaignProducts($campaignId);
    $amount = config('services.tremendous.default_reward_amount', 25);

    return view('reviews.select-reward', [
        'review' => $review,
        'products' => $products,
        'amount' => $amount,
        'campaignId' => $campaignId
    ]);
}
```

```html
<!-- resources/views/reviews/select-reward.blade.php -->

<div class="container">
    <h1>Choose Your Reward</h1>
    <p>Select your ${{ number_format($amount, 2) }} gift card:</p>

    <livewire:gift-card-carousel 
        :campaign-id="$campaignId" 
        :amount="$amount" 
    />

    <form method="POST" action="{{ route('reviews.post-to-google', $review) }}">
        @csrf
        <p class="mt-6 text-center">
            <button type="submit" class="btn btn-primary">
                Continue to Post Review
            </button>
        </p>
    </form>
</div>
```

### Step 3: User Posts to Google & Submits Screenshot

```php
// ReviewController.php

public function postToGoogle(Review $review)
{
    return view('reviews.post-instructions', [
        'review' => $review,
        'business' => $review->business
    ]);
}

public function submitProof(Request $request, Review $review)
{
    $validated = $request->validate([
        'screenshot' => 'required|image|max:10240', // 10MB max
    ]);

    // Store screenshot
    $screenshotPath = $request->file('screenshot')->store('review-screenshots', 'public');
    
    $review->update([
        'screenshot_path' => $screenshotPath,
        'status' => 'pending_ocr',
        'submitted_at' => now(),
    ]);

    // Trigger n8n workflow via webhook
    $this->triggerOcrWorkflow($review);

    return redirect()->route('reviews.pending', $review)
        ->with('success', 'Screenshot submitted! Verifying your review...');
}

protected function triggerOcrWorkflow(Review $review)
{
    Http::post(config('services.n8n.webhook_url'), [
        'review_id' => $review->id,
        'screenshot_url' => Storage::url($review->screenshot_path),
        'expected_text' => $review->text,
        'reviewer_name' => $review->reviewer_name,
        'reviewer_email' => $review->reviewer_email,
    ]);
}
```

### Step 4: n8n Workflow Verifies & Sends Reward

```javascript
// n8n Code Node - After OCR Verification

const reviewId = $input.item.json.review_id;
const ocrText = $input.item.json.ocr_text;
const expectedText = $input.item.json.expected_text;
const reviewerName = $input.item.json.reviewer_name;
const reviewerEmail = $input.item.json.reviewer_email;

// Check if texts match (simple similarity check)
const similarity = calculateSimilarity(ocrText, expectedText);

if (similarity > 0.8) {
  // Verification passed - send reward via Tremendous API
  return {
    json: {
      verified: true,
      review_id: reviewId,
      send_reward: true,
      recipient_name: reviewerName,
      recipient_email: reviewerEmail,
      amount: 25,
      campaign_id: process.env.TREMENDOUS_CAMPAIGN_ID
    }
  };
} else {
  // Verification failed
  return {
    json: {
      verified: false,
      review_id: reviewId,
      send_reward: false,
      reason: 'Text mismatch',
      similarity: similarity
    }
  };
}
```

### Step 5: Send Reward (n8n HTTP Request to Laravel API)

```javascript
// n8n HTTP Request Node
// POST to your Laravel API

// URL: https://your-domain.com/api/tremendous/orders
// Method: POST
// Authentication: Bearer Token
// Body:
{
  "external_id": "review-{{ $json.review_id }}",
  "payment": {
    "funding_source_id": "BALANCE"
  },
  "reward": {
    "value": {
      "denomination": {{ $json.amount }},
      "currency_code": "USD"
    },
    "delivery": {
      "method": "EMAIL"
    },
    "recipient": {
      "name": "{{ $json.recipient_name }}",
      "email": "{{ $json.recipient_email }}"
    },
    "campaign_id": "{{ $json.campaign_id }}"
  }
}
```

### Step 6: Handle Webhook from Tremendous (Optional)

```php
// TremendousController.php (already included)

protected function handleRewardDelivered(array $data): void
{
    $rewardId = $data['payload']['resource']['id'];
    $externalId = $data['payload']['resource']['external_id'] ?? null;

    if ($externalId && str_starts_with($externalId, 'review-')) {
        $reviewId = str_replace('review-', '', $externalId);
        
        $review = Review::find($reviewId);
        if ($review) {
            $review->update([
                'status' => 'completed',
                'reward_id' => $rewardId,
                'reward_sent_at' => now(),
            ]);

            // Send confirmation email to reviewer
            Mail::to($review->reviewer_email)->send(
                new RewardDeliveredMail($review)
            );
        }
    }
}
```

## Advanced Usage

### Create Custom Campaign Programmatically

```php
use App\Services\TremendousService;

$tremendous = app(TremendousService::class);

// Get all available products
$allProducts = $tremendous->getProducts();

// Filter to only US gift cards
$usProducts = collect($allProducts)
    ->filter(fn($p) => in_array('US', $p['countries'] ?? []))
    ->pluck('id')
    ->take(5) // Limit to 5 products
    ->toArray();

// Create campaign
$campaign = $tremendous->createCampaign([
    'name' => 'Q4 2024 Review Rewards',
    'description' => 'Gift cards for customer reviews - Q4 2024',
    'products' => $usProducts,
    'from' => 'LaziRewards',
    'email_subject' => 'Thank you for your review!',
    'message' => 'We appreciate your feedback. Enjoy your reward!'
]);

// Save campaign ID
Setting::set('current_campaign_id', $campaign['id']);
```

### Bulk Send Rewards

```php
$reviews = Review::where('status', 'verified')
    ->whereNull('reward_id')
    ->get();

foreach ($reviews as $review) {
    try {
        $order = $tremendous->sendEmailReward(
            recipientEmail: $review->reviewer_email,
            recipientName: $review->reviewer_name,
            amount: 25.00,
            campaignId: config('services.tremendous.default_campaign_id'),
            externalId: "review-{$review->id}"
        );

        if ($order) {
            $review->update([
                'reward_id' => $order['rewards'][0]['id'] ?? null,
                'order_id' => $order['id'],
                'status' => 'reward_sent'
            ]);
        }
    } catch (\Exception $e) {
        Log::error("Failed to send reward for review {$review->id}", [
            'error' => $e->getMessage()
        ]);
    }
}
```

### Check Balance Before Sending

```php
$fundingSources = $tremendous->getFundingSources();
$balance = collect($fundingSources)
    ->firstWhere('method', 'balance');

if ($balance && $balance['available_cents'] >= 2500) { // $25.00
    // Proceed with sending reward
    $order = $tremendous->sendEmailReward(...);
} else {
    // Insufficient balance - notify admin
    Mail::to(config('mail.admin'))->send(
        new LowBalanceAlert($balance['available_cents'])
    );
}
```

## Testing Commands

### Artisan Command to Test Integration

```php
// app/Console/Commands/TestTremendousIntegration.php

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\TremendousService;

class TestTremendousIntegration extends Command
{
    protected $signature = 'tremendous:test';
    protected $description = 'Test Tremendous API integration';

    public function handle(TremendousService $tremendous)
    {
        $this->info('Testing Tremendous API Integration...');

        // Test 1: Get Products
        $this->info('1. Fetching products...');
        $products = $tremendous->getProducts();
        $this->info("   Found {$products->count()} products");

        // Test 2: Get Campaigns
        $this->info('2. Fetching campaigns...');
        $campaigns = $tremendous->getCampaigns();
        $this->info("   Found {$campaigns->count()} campaigns");

        // Test 3: Get Campaign Products
        if (!empty($campaigns)) {
            $campaignId = $campaigns[0]['id'];
            $this->info("3. Fetching products for campaign {$campaignId}...");
            $campaignProducts = $tremendous->getCampaignProducts($campaignId);
            $this->info("   Found {$campaignProducts->count()} products");
            
            foreach ($campaignProducts as $product) {
                $this->line("   - {$product['name']}");
            }
        }

        // Test 4: Check Funding Sources
        $this->info('4. Checking funding sources...');
        $fundingSources = $tremendous->getFundingSources();
        foreach ($fundingSources as $source) {
            $balance = $source['available_cents'] ?? 0;
            $this->info("   {$source['method']}: \$" . number_format($balance / 100, 2));
        }

        $this->info('✓ Tests completed successfully!');
    }
}
```

Run with:
```bash
php artisan tremendous:test
```
