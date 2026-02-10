# Updated Integration: n8n ↔ Laravel ↔ Tremendous

## 🎯 Your Current Setup (Analysis)

Your n8n workflow already has the RIGHT architecture:

```
Webhook → Claude OCR → Verify Match → Update Laravel → Send Reward
```

### Current Flow:
1. ✅ Webhook receives screenshot + data
2. ✅ Claude Anthropic analyzes image (OCR)
3. ✅ JavaScript verifies text match
4. ✅ Posts result back to Laravel at: `/api/webhook/verification-result`
5. ⏳ **Missing**: Laravel → Tremendous reward sending

## 🔧 What Needs to Be Added to Laravel

Your n8n workflow posts to:
```
POST https://rewards.perfectcatchai.com/api/webhook/verification-result

Body:
{
  "token": "submission-token",
  "status": "approved" or "rejected"
}
```

### Current Laravel Endpoint Behavior
Based on your workflow, this endpoint currently:
- Updates submission status
- But does NOT send Tremendous reward yet

### What We Need to Add
The Laravel endpoint should:
1. ✅ Receive verification result (already does this)
2. ✅ Update submission status (already does this)
3. ⏳ **NEW**: If approved → Send Tremendous reward
4. ⏳ **NEW**: Store Tremendous order/reward IDs
5. ⏳ **NEW**: Return success/failure to n8n

---

## 📦 Updated Laravel Controller

Replace or update your webhook controller:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Submission; // Or whatever your model is called
use App\Services\TremendousService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    protected TremendousService $tremendous;

    public function __construct(TremendousService $tremendous)
    {
        $this->tremendous = $tremendous;
    }

    /**
     * POST /api/webhook/verification-result
     * Called by n8n after OCR verification
     */
    public function verificationResult(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'status' => 'required|in:approved,rejected',
        ]);

        // Find submission by token
        $submission = Submission::where('token', $validated['token'])->first();

        if (!$submission) {
            Log::error('Submission not found', ['token' => $validated['token']]);
            return response()->json([
                'success' => false,
                'message' => 'Submission not found'
            ], 404);
        }

        // Check if already processed
        if ($submission->reward_status === 'sent') {
            Log::warning('Reward already sent', ['submission_id' => $submission->id]);
            return response()->json([
                'success' => false,
                'message' => 'Reward already sent for this submission',
                'submission_id' => $submission->id,
            ], 400);
        }

        // Update verification status
        $submission->update([
            'verification_status' => $validated['status'],
            'verified_at' => now(),
        ]);

        // If REJECTED, stop here
        if ($validated['status'] === 'rejected') {
            $submission->update([
                'reward_status' => 'rejected',
            ]);

            Log::info('Submission rejected', ['submission_id' => $submission->id]);
            
            return response()->json([
                'success' => true,
                'message' => 'Submission marked as rejected',
                'submission_id' => $submission->id,
                'reward_sent' => false,
            ]);
        }

        // APPROVED - Send Tremendous Reward
        try {
            $campaignId = config('services.tremendous.default_campaign_id');
            $amount = config('services.tremendous.default_reward_amount', 25);

            // Create Tremendous order
            $order = $this->tremendous->sendEmailReward(
                recipientEmail: $submission->email,
                recipientName: $submission->name,
                amount: $amount,
                campaignId: $campaignId,
                externalId: "submission-{$submission->id}"
            );

            if (!$order) {
                throw new \Exception('Failed to create Tremendous order');
            }

            // Update submission with reward info
            $submission->update([
                'tremendous_order_id' => $order['id'],
                'tremendous_reward_id' => $order['rewards'][0]['id'] ?? null,
                'tremendous_campaign_id' => $campaignId,
                'reward_amount' => $amount,
                'reward_currency' => 'USD',
                'reward_status' => 'sent',
                'reward_sent_at' => now(),
            ]);

            Log::info('Reward sent successfully', [
                'submission_id' => $submission->id,
                'order_id' => $order['id'],
                'reward_id' => $order['rewards'][0]['id'] ?? null,
                'recipient' => $submission->email,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Submission approved and reward sent',
                'submission_id' => $submission->id,
                'reward_sent' => true,
                'order' => [
                    'id' => $order['id'],
                    'reward_id' => $order['rewards'][0]['id'] ?? null,
                    'amount' => $amount,
                    'currency' => 'USD',
                    'recipient' => $submission->email,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to send Tremendous reward', [
                'submission_id' => $submission->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $submission->update([
                'reward_status' => 'failed',
                'verification_notes' => 'Error sending reward: ' . $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Verification approved but reward sending failed',
                'error' => $e->getMessage(),
                'submission_id' => $submission->id,
                'reward_sent' => false,
                'action_required' => 'Manual reward sending needed',
            ], 500);
        }
    }
}
```

---

## 🗄️ Database Migration

Add Tremendous tracking columns to your submissions table:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            // Verification tracking
            $table->string('verification_status')->nullable()->after('status');
            $table->timestamp('verified_at')->nullable()->after('verification_status');
            
            // Tremendous tracking
            $table->string('tremendous_order_id')->nullable();
            $table->string('tremendous_reward_id')->nullable();
            $table->string('tremendous_campaign_id')->nullable();
            $table->decimal('reward_amount', 10, 2)->nullable();
            $table->string('reward_currency', 3)->default('USD');
            $table->string('reward_status')->nullable()
                ->comment('pending, sent, delivered, failed, rejected');
            $table->timestamp('reward_sent_at')->nullable();
            $table->timestamp('reward_delivered_at')->nullable();
            $table->text('verification_notes')->nullable();
            
            // Indexes
            $table->index('tremendous_order_id');
            $table->index('tremendous_reward_id');
            $table->index('reward_status');
            $table->index('verification_status');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn([
                'verification_status',
                'verified_at',
                'tremendous_order_id',
                'tremendous_reward_id',
                'tremendous_campaign_id',
                'reward_amount',
                'reward_currency',
                'reward_status',
                'reward_sent_at',
                'reward_delivered_at',
                'verification_notes',
            ]);
        });
    }
};
```

---

## 🔄 n8n Workflow Updates (Optional Enhancements)

Your workflow is already good! Optional additions:

### Add Response Logging (After "Update Laravel (Verified)")

**Node Type:** Code
**Position:** After "Update Laravel (Verified)"

```javascript
const response = $input.item.json;

// Log the Laravel response
console.log('Laravel Response:', response);

if (response.success && response.reward_sent) {
  return [{
    json: {
      success: true,
      message: 'Reward sent successfully',
      order_id: response.order?.id,
      reward_id: response.order?.reward_id,
      recipient: response.order?.recipient,
    }
  }];
} else {
  return [{
    json: {
      success: false,
      message: response.message || 'Unknown error',
      error: response.error,
    }
  }];
}
```

### Add Error Notification (for failed rewards)

**Node Type:** Email Send
**Trigger:** When Laravel returns `reward_sent: false`

```
From: noreply@perfectcatch.com
To: admin@perfectcatch.com
Subject: ⚠️ Reward Sending Failed

Body:
Submission ID: {{ $json.submission_id }}
Error: {{ $json.error }}
Action Required: Manual reward sending needed
```

---

## 🧪 Testing the Complete Flow

### 1. Test Tremendous Connection
```bash
php artisan tinker

>>> $tremendous = app(\App\Services\TremendousService::class);
>>> $campaigns = $tremendous->getCampaigns();
>>> dump($campaigns);
```

### 2. Test Laravel Endpoint (Approved)
```bash
curl -X POST https://rewards.perfectcatchai.com/api/webhook/verification-result \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-token-123",
    "status": "approved"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Submission approved and reward sent",
  "reward_sent": true,
  "order": {
    "id": "ORDER123",
    "reward_id": "REWARD123",
    "amount": 25,
    "recipient": "[email protected]"
  }
}
```

### 3. Test Full n8n Workflow
1. Go to n8n workflow
2. Click "Execute Workflow"
3. Send test webhook:

```bash
curl -X POST https://your-n8n.com/webhook/screenshot-verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-token-123",
    "name": "John Doe",
    "review_content": "Great service and amazing experience!",
    "email": "[email protected]",
    "screenshot_url": "https://your-app.com/screenshots/test.jpg"
  }'
```

---

## 📊 Monitoring & Debugging

### Check Submission Status
```php
$submission = Submission::find($id);

echo "Verification Status: {$submission->verification_status}\n";
echo "Reward Status: {$submission->reward_status}\n";
echo "Order ID: {$submission->tremendous_order_id}\n";
echo "Reward ID: {$submission->tremendous_reward_id}\n";
```

### Check Logs
```bash
# Laravel logs
tail -f storage/logs/laravel.log | grep "reward"

# n8n logs
# Check execution history in n8n dashboard
```

### Check Tremendous Dashboard
- Log into: https://app.tremendous.com
- Go to "Orders" to see all sent rewards
- Match Order IDs with your database

---

## 🚨 Error Handling

### Common Issues:

**1. "Campaign not found"**
```bash
# Check campaign ID in .env
echo $TREMENDOUS_DEFAULT_CAMPAIGN_ID

# Verify it exists
php artisan tinker
>>> app(\App\Services\TremendousService::class)->getCampaign('YOUR-ID');
```

**2. "Insufficient balance"**
```bash
php artisan tinker
>>> $tremendous = app(\App\Services\TremendousService::class);
>>> $sources = $tremendous->getFundingSources();
>>> dump($sources);
```

**3. "Reward already sent"**
- Check database: `SELECT * FROM submissions WHERE reward_status = 'sent'`
- This prevents duplicate rewards

**4. Network timeout**
- Increase timeout in TremendousService
- Check Tremendous API status

---

## ✅ Success Checklist

Once deployed and tested:

- [ ] Migration run: `php artisan migrate`
- [ ] Controller updated with Tremendous integration
- [ ] Campaign ID configured in .env
- [ ] Test submission approved → reward sent
- [ ] Verify in Tremendous dashboard
- [ ] Check email received
- [ ] Database updated with order/reward IDs
- [ ] Logs show successful flow
- [ ] n8n workflow executes without errors

---

## 🎯 Final Flow Diagram

```
User submits review + screenshot
         ↓
Laravel creates submission (token)
         ↓
n8n webhook receives screenshot
         ↓
Claude analyzes image (OCR)
         ↓
JavaScript verifies text match
         ↓
n8n POSTs to Laravel: /api/webhook/verification-result
         ↓
Laravel receives: {token, status: "approved"}
         ↓
Laravel finds submission by token
         ↓
Laravel calls TremendousService.sendEmailReward()
         ↓
Tremendous creates order & queues delivery
         ↓
Laravel updates DB with order/reward IDs
         ↓
Laravel returns success to n8n
         ↓
(Later) Tremendous delivers email to user
         ↓
(Optional) Tremendous webhook → Laravel updates delivery status
```

---

## 🔐 Security Notes

1. **Rate Limiting**: Add to your webhook route
```php
Route::post('/webhook/verification-result', [WebhookController::class, 'verificationResult'])
    ->middleware('throttle:60,1'); // 60 requests per minute
```

2. **Token Validation**: Your token system is good
3. **API Authentication**: Optional but recommended for n8n → Laravel calls
4. **HTTPS**: Already using (rewards.perfectcatchai.com)

---

## 📚 Related Files

- `TremendousService.php` - Already deployed ✅
- `WebhookController.php` - Update with code above
- `Migration` - Add Tremendous columns
- `n8n workflow` - Already configured ✅
- `.env` - Add TREMENDOUS_DEFAULT_CAMPAIGN_ID

You're 90% there! Just need to add the Tremendous reward sending to your existing webhook endpoint.
