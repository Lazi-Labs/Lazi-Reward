# Tremendous API Integration for Laravel

Complete Laravel integration with the Tremendous API for managing gift card rewards, campaigns, and products.

## Features

- ✅ Complete API coverage for all major Tremendous endpoints
- ✅ Products management with carousel support
- ✅ Campaign creation and management
- ✅ Order and reward handling
- ✅ Webhook support with signature verification
- ✅ Automatic caching for performance
- ✅ Comprehensive error handling and logging
- ✅ RESTful API endpoints
- ✅ Support for both sandbox and production environments

## Installation

### 1. Copy Files to Your Laravel Project

```bash
# Service
cp app/Services/TremendousService.php your-project/app/Services/

# Controller
cp app/Http/Controllers/TremendousController.php your-project/app/Http/Controllers/Api/

# Routes
cat routes/api.php >> your-project/routes/api.php

# Config
cat config/services.php >> your-project/config/services.php
```

### 2. Configure Environment Variables

Copy the contents of `.env.example` to your `.env` file and fill in your Tremendous credentials:

```env
TREMENDOUS_API_KEY=your-api-key-here
TREMENDOUS_BASE_URL=https://testflight.tremendous.com/api/v2
TREMENDOUS_DEFAULT_CAMPAIGN_ID=your-campaign-id
TREMENDOUS_DEFAULT_REWARD_AMOUNT=25
```

### 3. Get Your API Credentials

**Sandbox Environment:**
1. Sign up at https://testflight.tremendous.com
2. Navigate to Team Settings > Developers
3. Generate an API key

**Production Environment:**
1. Sign up at https://www.tremendous.com
2. Request production access
3. Once approved, generate production API key at https://api.tremendous.com

## API Endpoints

### Products

#### Get All Products
```bash
GET /api/tremendous/products
GET /api/tremendous/products?fresh=true  # Force refresh cache
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "PRODUCT123",
      "name": "Amazon.com Gift Card",
      "description": "Amazon.com gift card",
      "currency_codes": ["USD"],
      "countries": ["US"]
    }
  ]
}
```

#### Get Single Product
```bash
GET /api/tremendous/products/{product_id}
```

### Campaigns

#### Get All Campaigns
```bash
GET /api/tremendous/campaigns
GET /api/tremendous/campaigns?fresh=true  # Force refresh cache
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "CAMPAIGN123",
      "name": "Review Rewards",
      "description": "Rewards for customer reviews",
      "products": ["PROD1", "PROD2", "PROD3"]
    }
  ]
}
```

#### Get Single Campaign
```bash
GET /api/tremendous/campaigns/{campaign_id}
```

#### Get Campaign Products
```bash
GET /api/tremendous/campaigns/{campaign_id}/products
```

This endpoint returns the full product details for all products in a campaign - perfect for building a carousel!

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "PROD1",
      "name": "Amazon.com Gift Card",
      "description": "Amazon.com gift card",
      "images": {
        "1x": "https://tremendous.com/images/amazon.png"
      }
    },
    {
      "id": "PROD2",
      "name": "Visa Prepaid Card",
      "description": "Virtual Visa card"
    }
  ]
}
```

#### Create Campaign
```bash
POST /api/tremendous/campaigns
Content-Type: application/json

{
  "name": "Review Rewards Campaign",
  "description": "Gift cards for customer reviews",
  "products": ["PROD1", "PROD2", "PROD3"],
  "from": "Your Company",
  "email_subject": "Thank you for your review!",
  "message": "Here's your reward for leaving a review"
}
```

#### Update Campaign
```bash
PUT /api/tremendous/campaigns/{campaign_id}
Content-Type: application/json

{
  "name": "Updated Campaign Name",
  "products": ["PROD1", "PROD2"]
}
```

### Orders

#### Create Order (Send Reward)
```bash
POST /api/tremendous/orders
Content-Type: application/json

{
  "external_id": "review-12345",
  "payment": {
    "funding_source_id": "BALANCE"
  },
  "reward": {
    "value": {
      "denomination": 25,
      "currency_code": "USD"
    },
    "delivery": {
      "method": "EMAIL"
    },
    "recipient": {
      "name": "John Doe",
      "email": "[email protected]"
    },
    "campaign_id": "YOUR-CAMPAIGN-ID"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "ORDER123",
    "external_id": "review-12345",
    "status": "EXECUTED",
    "rewards": [
      {
        "id": "REWARD123",
        "value": {
          "denomination": 25,
          "currency_code": "USD"
        },
        "delivery": {
          "method": "EMAIL",
          "status": "SUCCEEDED"
        }
      }
    ]
  }
}
```

#### List Orders
```bash
GET /api/tremendous/orders?offset=0&limit=10
```

#### Get Single Order
```bash
GET /api/tremendous/orders/{order_id}
```

### Rewards

#### List Rewards
```bash
GET /api/tremendous/rewards?offset=0&limit=10
```

#### Get Single Reward
```bash
GET /api/tremendous/rewards/{reward_id}
```

#### Generate Reward Link
```bash
POST /api/tremendous/rewards/{reward_id}/generate-link
```

#### Resend Reward
```bash
POST /api/tremendous/rewards/{reward_id}/resend
```

#### Cancel Reward
```bash
POST /api/tremendous/rewards/{reward_id}/cancel
```

### Funding Sources

#### Get All Funding Sources
```bash
GET /api/tremendous/funding-sources
```

#### Get Single Funding Source
```bash
GET /api/tremendous/funding-sources/{funding_source_id}
```

### Utility

#### Clear Cache
```bash
POST /api/tremendous/cache/clear
```

## Using the Service Directly

You can also use the `TremendousService` class directly in your code:

```php
use App\Services\TremendousService;

class YourController extends Controller
{
    protected TremendousService $tremendous;

    public function __construct(TremendousService $tremendous)
    {
        $this->tremendous = $tremendous;
    }

    public function sendReward()
    {
        // Get campaign products for carousel
        $products = $this->tremendous->getCampaignProducts('YOUR-CAMPAIGN-ID');

        // Send a simple email reward
        $order = $this->tremendous->sendEmailReward(
            recipientEmail: '[email protected]',
            recipientName: 'John Doe',
            amount: 25.00,
            campaignId: 'YOUR-CAMPAIGN-ID',
            externalId: 'review-12345'
        );

        // Get all products
        $allProducts = $this->tremendous->getProducts();

        // Get specific product details
        $product = $this->tremendous->getProduct('PRODUCT-ID');

        // Create custom order
        $order = $this->tremendous->createOrder([
            'external_id' => 'unique-id-123',
            'payment' => ['funding_source_id' => 'BALANCE'],
            'reward' => [
                'value' => ['denomination' => 25, 'currency_code' => 'USD'],
                'delivery' => ['method' => 'EMAIL'],
                'recipient' => [
                    'name' => 'Jane Doe',
                    'email' => '[email protected]'
                ],
                'campaign_id' => 'YOUR-CAMPAIGN-ID'
            ]
        ]);

        return $order;
    }
}
```

## Building a Gift Card Carousel

To build a gift card carousel showing products from your campaign:

### Backend Endpoint
```php
// Already included in TremendousController.php
public function getCampaignProducts(string $id): JsonResponse
{
    $products = $this->tremendous->getCampaignProducts($id);
    return response()->json(['success' => true, 'data' => $products]);
}
```

### Frontend Example (Alpine.js/Livewire)
```html
<div x-data="giftCardCarousel()" x-init="loadProducts()">
    <div class="carousel">
        <template x-for="product in products" :key="product.id">
            <div class="gift-card">
                <img :src="product.images?.['1x']" :alt="product.name">
                <h3 x-text="product.name"></h3>
                <p x-text="product.description"></p>
                <span class="amount">$25.00</span>
            </div>
        </template>
    </div>
</div>

<script>
function giftCardCarousel() {
    return {
        products: [],
        async loadProducts() {
            const campaignId = 'YOUR-CAMPAIGN-ID';
            const response = await fetch(`/api/tremendous/campaigns/${campaignId}/products`);
            const data = await response.json();
            this.products = data.data;
        }
    }
}
</script>
```

## Webhooks

### Setting Up Webhooks

1. **Create a webhook in your Tremendous dashboard** or via API:

```bash
POST /api/tremendous/webhooks
```

2. **Set your webhook URL** to: `https://your-domain.com/api/tremendous/webhooks/handle`

3. **Save the webhook secret** to your `.env` file as `TREMENDOUS_WEBHOOK_SECRET`

### Handling Webhook Events

The webhook handler is already set up in the `TremendousController`. Events are automatically verified and logged.

Supported events:
- `ORDERS.CREATED` - When an order is created
- `REWARDS.DELIVERED` - When a reward is successfully delivered
- `REWARDS.CANCELED` - When a reward is canceled

Customize handling in `TremendousController.php`:

```php
protected function handleOrderCreated(array $data): void
{
    // Your custom logic here
    $orderId = $data['payload']['resource']['id'];
    
    // Update your database, send notifications, etc.
}

protected function handleRewardDelivered(array $data): void
{
    // Your custom logic here
    $rewardId = $data['payload']['resource']['id'];
    
    // Mark review as rewarded, update status, etc.
}
```

## Testing

### Using Sandbox Environment

The Tremendous sandbox environment allows you to:
- Test with $5,000 in fake money
- Rewards are only sent to your organization's email addresses
- All API endpoints work identically to production

### Example Test

```php
// Set campaign ID from your dashboard
$campaignId = 'YOUR-SANDBOX-CAMPAIGN-ID';

// Get products for testing carousel
$products = $tremendous->getCampaignProducts($campaignId);
dd($products);

// Send a test reward
$order = $tremendous->sendEmailReward(
    recipientEmail: '[email protected]', // Will be redirected to your account email
    recipientName: 'Test User',
    amount: 1.00, // Test with small amount
    campaignId: $campaignId,
    externalId: 'test-' . time()
);

dd($order);
```

## Error Handling

All methods return `null` on failure and log errors automatically. Always check for null:

```php
$order = $tremendous->createOrder($data);

if (!$order) {
    // Handle error - check logs for details
    return back()->with('error', 'Failed to create reward');
}

// Success
return back()->with('success', 'Reward sent!');
```

## Caching

Products and campaigns are cached for 1 hour by default. To refresh cache:

```php
// Via service
$tremendous->getProducts(fresh: true);
$tremendous->getCampaigns(fresh: true);
$tremendous->clearCache();

// Via API
POST /api/tremendous/cache/clear
```

## Rate Limiting

Tremendous API has a rate limit of **30 requests per 30 seconds**. The service automatically logs rate limit errors. For higher limits, contact [email protected].

## Support

- **Tremendous Documentation:** https://developers.tremendous.com
- **Tremendous Support:** [email protected]
- **API Status:** Check Tremendous status page

## License

This integration is open-source and free to use in your Laravel projects.
