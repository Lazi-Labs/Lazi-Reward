# Windsurf Prompt: Add Tremendous Reward Sending to Existing Webhook

## Context
The n8n workflow is ALREADY set up and working! It:
- ✅ Receives screenshot webhooks
- ✅ Performs OCR with Claude
- ✅ Verifies text match
- ✅ Posts back to Laravel at `/api/webhook/verification-result`

**What's Missing:** The Laravel webhook endpoint needs to send Tremendous rewards when status is "approved"

## Current Setup

### n8n Posts To:
```
POST https://rewards.perfectcatchai.com/api/webhook/verification-result

Body:
{
  "token": "submission-unique-token",
  "status": "approved" | "rejected"
}
```

### Current Laravel Behavior:
The webhook controller currently:
- Updates submission status
- But does NOT send Tremendous reward yet

## Tasks

### Phase 1: Find and Examine Current Webhook Controller

1. **Locate the webhook controller**
   - Look for: `app/Http/Controllers/Api/WebhookController.php` or similar
   - Or search for: `Route::post('/api/webhook/verification-result'` in routes
   - Find the method that handles `/api/webhook/verification-result`

2. **Examine current implementation**
   - What does it do when status is "approved"?
   - What model does it use? (Review? Submission? other?)
   - What fields exist on the model?

### Phase 2: Add Database Columns for Tremendous Tracking

3. **Create Migration**
   - Create new migration: `add_tremendous_columns_to_submissions`
   - Add these columns to the submissions table (or whatever table is used):
     ```php
     $table->string('verification_status')->nullable();
     $table->timestamp('verified_at')->nullable();
     $table->string('tremendous_order_id')->nullable();
     $table->string('tremendous_reward_id')->nullable();
     $table->string('tremendous_campaign_id')->nullable();
     $table->decimal('reward_amount', 10, 2)->nullable();
     $table->string('reward_currency', 3)->default('USD');
     $table->string('reward_status')->nullable();
     $table->timestamp('reward_sent_at')->nullable();
     $table->timestamp('reward_delivered_at')->nullable();
     $table->text('verification_notes')->nullable();
     ```
   - Add indexes for performance
   - Run migration: `php artisan migrate`

### Phase 3: Update Webhook Controller to Send Rewards

4. **Inject TremendousService**
   ```php
   protected TremendousService $tremendous;

   public function __construct(TremendousService $tremendous)
   {
       $this->tremendous = $tremendous;
   }
   ```

5. **Update the verificationResult method** (or whatever it's called)
   
   **Key Changes:**
   
   a) **After finding submission by token:**
   ```php
   // Check if already rewarded
   if ($submission->reward_status === 'sent') {
       return response()->json([
           'success' => false,
           'message' => 'Reward already sent'
       ], 400);
   }
   ```

   b) **Update verification status:**
   ```php
   $submission->update([
       'verification_status' => $validated['status'],
       'verified_at' => now(),
   ]);
   ```

   c) **If rejected, stop here:**
   ```php
   if ($validated['status'] === 'rejected') {
       $submission->update(['reward_status' => 'rejected']);
       return response()->json(['success' => true, 'reward_sent' => false]);
   }
   ```

   d) **If approved, send Tremendous reward:**
   ```php
   try {
       $campaignId = config('services.tremendous.default_campaign_id');
       $amount = config('services.tremendous.default_reward_amount', 25);

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

       $submission->update([
           'tremendous_order_id' => $order['id'],
           'tremendous_reward_id' => $order['rewards'][0]['id'] ?? null,
           'tremendous_campaign_id' => $campaignId,
           'reward_amount' => $amount,
           'reward_currency' => 'USD',
           'reward_status' => 'sent',
           'reward_sent_at' => now(),
       ]);

       \Log::info('Reward sent', [
           'submission_id' => $submission->id,
           'order_id' => $order['id']
       ]);

       return response()->json([
           'success' => true,
           'message' => 'Reward sent successfully',
           'reward_sent' => true,
           'order' => [
               'id' => $order['id'],
               'reward_id' => $order['rewards'][0]['id'] ?? null,
               'amount' => $amount,
               'recipient' => $submission->email,
           ]
       ]);

   } catch (\Exception $e) {
       \Log::error('Reward sending failed', [
           'submission_id' => $submission->id,
           'error' => $e->getMessage()
       ]);

       $submission->update([
           'reward_status' => 'failed',
           'verification_notes' => 'Error: ' . $e->getMessage()
       ]);

       return response()->json([
           'success' => false,
           'message' => 'Reward sending failed',
           'error' => $e->getMessage(),
           'reward_sent' => false
       ], 500);
   }
   ```

### Phase 4: Verify Configuration

6. **Check .env has required values:**
   ```
   TREMENDOUS_API_KEY=PROD_...
   TREMENDOUS_BASE_URL=https://api.tremendous.com/api/v2
   TREMENDOUS_DEFAULT_CAMPAIGN_ID=<your-campaign-id>
   TREMENDOUS_DEFAULT_REWARD_AMOUNT=25
   ```

7. **Clear caches:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

### Phase 5: Testing

8. **Test the updated endpoint:**
   ```bash
   curl -X POST https://rewards.perfectcatchai.com/api/webhook/verification-result \
     -H "Content-Type: application/json" \
     -d '{
       "token": "existing-test-token",
       "status": "approved"
     }'
   ```

9. **Expected response:**
   ```json
   {
     "success": true,
     "message": "Reward sent successfully",
     "reward_sent": true,
     "order": {
       "id": "ORDER123",
       "reward_id": "REWARD123",
       "amount": 25,
       "recipient": "[email protected]"
     }
   }
   ```

10. **Verify in database:**
    ```sql
    SELECT id, reward_status, tremendous_order_id, tremendous_reward_id, reward_sent_at
    FROM submissions
    WHERE token = 'your-test-token';
    ```

11. **Check Tremendous dashboard:**
    - Log into: https://app.tremendous.com
    - Go to Orders
    - Verify order was created

### Phase 6: Update Model (if needed)

12. **Add fillable fields to Submission model:**
    ```php
    protected $fillable = [
        // ... existing fields ...
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
    ];
    ```

## Important Notes

- **Do NOT modify the n8n workflow** - it's already correct
- **Do NOT change the webhook URL** - `/api/webhook/verification-result` is correct
- **Do NOT change the request format** - n8n is already sending `{token, status}`
- **The only changes are in Laravel** - adding Tremendous reward sending logic

## Error Handling

The implementation should handle:
- ✅ Duplicate rewards (check reward_status before sending)
- ✅ Missing campaign ID (log error, return failure)
- ✅ Tremendous API errors (catch exception, log, return failure)
- ✅ Database errors (wrap in transaction if needed)
- ✅ Invalid token (return 404)

## Success Criteria

After implementation:
- [ ] Migration created and run successfully
- [ ] Webhook controller updated with Tremendous integration
- [ ] TremendousService injected and used
- [ ] Test submission approved → reward sent
- [ ] Database record shows order_id and reward_id
- [ ] Tremendous dashboard shows new order
- [ ] User receives email from Tremendous
- [ ] Logs show successful flow
- [ ] Duplicate attempts are prevented

## Reference Files

Use these for implementation guidance:
- `/mnt/user-data/outputs/UPDATED_INTEGRATION_GUIDE.md` - Complete implementation details
- `/mnt/user-data/outputs/tremendous-integration/app/Services/TremendousService.php` - Service reference
- Current n8n workflow - Already correct, don't change

## Output Expected

Provide:
1. Summary of files modified
2. Migration file created
3. Controller changes made
4. Test results
5. Any errors encountered
6. Next steps if any

---

**Ready to execute!** This should complete the integration and enable automatic Tremendous reward sending when n8n verifies reviews.
