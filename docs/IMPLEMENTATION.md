# Tremendous API Integration - Implementation Summary

## What's Included

This complete Tremendous API integration package provides everything you need to:

1. **Pull products from your Tremendous campaigns** ($25 fixed amount)
2. **Display gift cards in a beautiful carousel**
3. **Send automated rewards** after review verification
4. **Track rewards** in your database
5. **Handle webhooks** from Tremendous

## Files Included

### Core Service & Controller
- `app/Services/TremendousService.php` - Complete API service with all endpoints
- `app/Http/Controllers/TremendousController.php` - REST API controller
- `routes/api.php` - All API routes

### Configuration
- `config/services.php` - Service configuration
- `.env.example` - Environment variables template

### Frontend Components
- `app/Livewire/GiftCardCarousel.php` - Livewire carousel component
- `resources/views/livewire/gift-card-carousel.blade.php` - Carousel UI

### Database
- `database/migrations/2024_12_11_000000_add_tremendous_columns_to_reviews.php` - Migration

### Documentation
- `README.md` - Complete integration guide
- `EXAMPLES.md` - Usage examples and code samples

## Quick Setup (5 Minutes)

### 1. Copy Files to Your Project

```bash
# Copy service
cp app/Services/TremendousService.php /path/to/your-project/app/Services/

# Copy controller
cp app/Http/Controllers/TremendousController.php /path/to/your-project/app/Http/Controllers/Api/

# Copy Livewire component
cp app/Livewire/GiftCardCarousel.php /path/to/your-project/app/Livewire/
cp -r resources/views/livewire/gift-card-carousel.blade.php /path/to/your-project/resources/views/livewire/

# Add routes
cat routes/api.php >> /path/to/your-project/routes/api.php

# Add config
cat config/services.php >> /path/to/your-project/config/services.php

# Copy migration
cp database/migrations/*.php /path/to/your-project/database/migrations/
```

### 2. Configure Environment

Add to your `.env`:

```env
TREMENDOUS_API_KEY=your-sandbox-key
TREMENDOUS_BASE_URL=https://testflight.tremendous.com/api/v2
TREMENDOUS_DEFAULT_CAMPAIGN_ID=YOUR-CAMPAIGN-ID
TREMENDOUS_DEFAULT_REWARD_AMOUNT=25
```

### 3. Run Migration

```bash
php artisan migrate
```

### 4. Get Your Campaign ID

**Option A: From Dashboard**
1. Log into https://testflight.tremendous.com
2. Go to "Campaign templates"
3. Copy the ID from your campaign

**Option B: Via API**
```bash
curl --header 'Authorization: Bearer YOUR-API-KEY' \
     --url 'https://testflight.tremendous.com/api/v2/campaigns'
```

## Using the Gift Card Carousel

### In Any Blade View

```html
<livewire:gift-card-carousel 
    campaign-id="YOUR-CAMPAIGN-ID" 
    :amount="25" 
/>
```

### Via API Endpoint

```bash
# Get products for carousel
GET /api/tremendous/campaigns/{campaign-id}/products

# Response:
{
  "success": true,
  "data": [
    {
      "id": "PROD123",
      "name": "Amazon.com Gift Card",
      "images": {"1x": "https://..."},
      "description": "...",
      "countries": ["US"]
    }
  ]
}
```

## Sending Rewards

### Simple Way (Helper Method)

```php
use App\Services\TremendousService;

$tremendous = app(TremendousService::class);

$order = $tremendous->sendEmailReward(
    recipientEmail: '[email protected]',
    recipientName: 'John Doe',
    amount: 25.00,
    campaignId: config('services.tremendous.default_campaign_id'),
    externalId: 'review-12345'
);

if ($order) {
    // Success! Reward sent
    $rewardId = $order['rewards'][0]['id'];
}
```

### Advanced Way (Full Control)

```php
$order = $tremendous->createOrder([
    'external_id' => 'review-12345',
    'payment' => [
        'funding_source_id' => 'BALANCE'
    ],
    'reward' => [
        'value' => [
            'denomination' => 25,
            'currency_code' => 'USD'
        ],
        'delivery' => [
            'method' => 'EMAIL'
        ],
        'recipient' => [
            'name' => 'John Doe',
            'email' => '[email protected]'
        ],
        'campaign_id' => 'YOUR-CAMPAIGN-ID'
    ]
]);
```

## Complete Review Flow Integration

### 1. User Selects Gift Card
```html
<!-- Show carousel on reward selection page -->
<livewire:gift-card-carousel />
```

### 2. User Posts Review to Google
```php
// Guide them to post and take screenshot
return view('reviews.post-instructions', ['review' => $review]);
```

### 3. User Submits Screenshot
```php
public function submitProof(Request $request, Review $review)
{
    $screenshotPath = $request->file('screenshot')->store('screenshots');
    
    $review->update([
        'screenshot_path' => $screenshotPath,
        'status' => 'pending_verification'
    ]);
    
    // Trigger your n8n workflow
    $this->triggerOcrVerification($review);
}
```

### 4. n8n Verifies & Sends Reward
```javascript
// In n8n, after OCR verification succeeds:
// HTTP Request to: POST /api/tremendous/orders

{
  "external_id": "review-{{ $json.review_id }}",
  "payment": {"funding_source_id": "BALANCE"},
  "reward": {
    "value": {"denomination": 25, "currency_code": "USD"},
    "delivery": {"method": "EMAIL"},
    "recipient": {
      "name": "{{ $json.reviewer_name }}",
      "email": "{{ $json.reviewer_email }}"
    },
    "campaign_id": "{{ $env.TREMENDOUS_CAMPAIGN_ID }}"
  }
}
```

### 5. Track Reward Status
```php
// Update your review record
$review->update([
    'tremendous_order_id' => $order['id'],
    'tremendous_reward_id' => $order['rewards'][0]['id'],
    'reward_amount' => 25.00,
    'reward_status' => 'sent',
    'reward_sent_at' => now()
]);
```

## Testing

### Test Campaign Products API
```bash
php artisan tinker

>>> $tremendous = app(App\Services\TremendousService::class);
>>> $products = $tremendous->getCampaignProducts('YOUR-CAMPAIGN-ID');
>>> dump($products);
```

### Test Sending a Reward
```bash
# Use your own email for testing in sandbox
php artisan tinker

>>> $tremendous = app(App\Services\TremendousService::class);
>>> $order = $tremendous->sendEmailReward(
...     '[email protected]',
...     'Test User',
...     1.00,
...     'YOUR-CAMPAIGN-ID',
...     'test-' . time()
... );
>>> dump($order);
```

### Run Test Command
```bash
php artisan tremendous:test
```

## API Endpoints Reference

```
GET    /api/tremendous/products
GET    /api/tremendous/products/{id}
GET    /api/tremendous/campaigns
GET    /api/tremendous/campaigns/{id}
GET    /api/tremendous/campaigns/{id}/products  ← For carousel
POST   /api/tremendous/campaigns
PUT    /api/tremendous/campaigns/{id}
GET    /api/tremendous/orders
POST   /api/tremendous/orders                   ← Send rewards
GET    /api/tremendous/orders/{id}
GET    /api/tremendous/rewards
GET    /api/tremendous/rewards/{id}
POST   /api/tremendous/rewards/{id}/generate-link
POST   /api/tremendous/rewards/{id}/resend
POST   /api/tremendous/rewards/{id}/cancel
GET    /api/tremendous/funding-sources
POST   /api/tremendous/cache/clear
POST   /api/tremendous/webhooks/handle          ← Webhook endpoint
```

## Important Notes

### Sandbox vs Production

**Sandbox** (for testing):
- URL: `https://testflight.tremendous.com/api/v2`
- $5,000 in fake money to test
- Rewards only sent to your organization's emails
- Sign up at: https://testflight.tremendous.com

**Production**:
- URL: `https://api.tremendous.com/api/v2`
- Requires approval (1-2 business days)
- Real money, real rewards
- Request access: Team Settings > Developers > Request Production Access

### Rate Limiting
- Tremendous API: 30 requests per 30 seconds
- Cache is used to minimize API calls
- Products and campaigns cached for 1 hour

### Cost Considerations
- Tremendous charges per reward sent
- $25 reward = $25 cost (no markup in sandbox)
- Check pricing for production at https://www.tremendous.com/pricing

## Troubleshooting

### "Campaign not found"
- Make sure you've created a campaign in the Tremendous dashboard
- Copy the campaign ID exactly (case-sensitive)
- Try refreshing: `GET /api/tremendous/campaigns?fresh=true`

### "Insufficient balance"
```php
$sources = $tremendous->getFundingSources();
$balance = collect($sources)->firstWhere('method', 'balance');
echo "Balance: $" . ($balance['available_cents'] / 100);
```

### Products not loading
```bash
# Clear cache
POST /api/tremendous/cache/clear

# Check logs
tail -f storage/logs/laravel.log
```

### Webhook not working
- Verify signature secret matches
- Check webhook URL is publicly accessible
- Test with: `POST /api/tremendous/webhooks/{id}/simulate`

## Support & Resources

- **Tremendous Docs**: https://developers.tremendous.com
- **API Reference**: https://developers.tremendous.com/reference
- **Support Email**: [email protected]
- **Dashboard**: https://testflight.tremendous.com (sandbox)

## Next Steps

1. ✅ Copy files to your Laravel project
2. ✅ Configure `.env` with your API credentials
3. ✅ Run migration: `php artisan migrate`
4. ✅ Create a campaign in Tremendous dashboard
5. ✅ Test with: `php artisan tremendous:test`
6. ✅ Add carousel to your review form
7. ✅ Integrate with your n8n OCR workflow
8. ✅ Test end-to-end flow in sandbox
9. ✅ Request production access when ready

## Questions?

Refer to:
- `README.md` - Detailed integration guide
- `EXAMPLES.md` - Code examples and patterns
- Tremendous API docs - Complete API reference

Happy integrating! 🎉
