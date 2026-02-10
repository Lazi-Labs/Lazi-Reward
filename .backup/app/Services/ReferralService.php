<?php

namespace App\Services;

use App\Models\User;
use App\Models\Referrer;
use App\Models\Referral;
use App\Models\ReferralCampaign;
use App\Models\ReferralClick;
use App\Models\ReferralReward;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
// QrCode package is optional - will be generated if available

class ReferralService
{
    protected TremendousService $tremendousService;

    public function __construct(TremendousService $tremendousService)
    {
        $this->tremendousService = $tremendousService;
    }

    /**
     * Create referrer account after customer completes first job
     */
    public function createReferrer(User $user, ReferralCampaign $campaign, ?Referrer $referredBy = null): Referrer
    {
        // Check if user already has a referrer account for this campaign
        $existing = Referrer::where('user_id', $user->id)
            ->where('campaign_id', $campaign->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        // Generate unique code
        $code = $this->generateUniqueCode();

        // Create referral link
        $link = url("/r/{$code}");

        // Generate QR code
        $qrCodePath = $this->generateQRCode($code, $link);

        return Referrer::create([
            'user_id' => $user->id,
            'campaign_id' => $campaign->id,
            'referral_code' => $code,
            'referral_link' => $link,
            'qr_code_path' => $qrCodePath,
            'source' => $referredBy ? 'referred' : 'direct',
            'referred_by_id' => $referredBy?->id,
            'qualified_at' => now(),
        ]);
    }

    /**
     * Generate unique 8-character code
     */
    public function generateUniqueCode(): string
    {
        do {
            // Mix of uppercase, lowercase, and numbers for readability
            $code = Str::random(8);
        } while (Referrer::where('referral_code', $code)->exists());

        return $code;
    }

    /**
     * Generate QR code image using external API
     */
    public function generateQRCode(string $code, string $link): string
    {
        try {
            // Use QR Server API for QR code generation (free, no auth required)
            $qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=' . urlencode($link);
            
            $context = stream_context_create([
                'http' => [
                    'timeout' => 10,
                    'user_agent' => 'Mozilla/5.0',
                ],
            ]);
            
            $qrImage = @file_get_contents($qrUrl, false, $context);

            if ($qrImage === false) {
                Log::warning('QR code generation skipped - API unavailable');
                return '';
            }

            $path = "qr-codes/{$code}.png";
            Storage::disk('public')->put($path, $qrImage);

            return $path;
        } catch (\Exception $e) {
            Log::error('Failed to generate QR code', [
                'code' => $code,
                'error' => $e->getMessage(),
            ]);
            return '';
        }
    }

    /**
     * Track click on referral link
     */
    public function trackClick(Referrer $referrer, Request $request): ReferralClick
    {
        $referrer->increment('total_reach');

        $click = ReferralClick::create([
            'referrer_id' => $referrer->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referer_url' => $request->headers->get('referer'),
            'device_type' => $this->getDeviceType($request->userAgent()),
            'browser' => $this->getBrowser($request->userAgent()),
            'os' => $this->getOS($request->userAgent()),
        ]);

        // Store in session for attribution (30 days)
        session(['referral_code' => $referrer->referral_code]);
        Cookie::queue('referral_code', $referrer->referral_code, 60 * 24 * 30);

        return $click;
    }

    /**
     * Track referral signup
     */
    public function trackSignup(User $newUser, Referrer $referrer, ?string $source = null): Referral
    {
        $referrer->increment('total_referrals');

        return Referral::create([
            'referrer_id' => $referrer->id,
            'referred_user_id' => $newUser->id,
            'campaign_id' => $referrer->campaign_id,
            'status' => Referral::STATUS_PENDING,
            'signed_up_at' => now(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'source' => $source ?? $this->detectSource(),
        ]);
    }

    /**
     * Track conversion (job completion) and trigger reward
     */
    public function trackConversion(User $referredUser): ?ReferralReward
    {
        // Find their pending referral record
        $referral = Referral::where('referred_user_id', $referredUser->id)
            ->where('status', Referral::STATUS_PENDING)
            ->first();

        if (!$referral) {
            return null;
        }

        // Update referral status
        $referral->markAsConverted();

        // Update referrer stats
        $referrer = $referral->referrer;
        $referrer->increment('converted_referrals');

        // Send reward
        return $this->sendReward($referrer, $referral);
    }

    /**
     * Send reward to referrer
     */
    public function sendReward(Referrer $referrer, Referral $referral): ReferralReward
    {
        $campaign = $referrer->campaign;
        $amount = $campaign->reward_amount;

        $reward = ReferralReward::create([
            'referrer_id' => $referrer->id,
            'referral_id' => $referral->id,
            'amount' => $amount,
            'type' => $campaign->reward_type,
            'status' => ReferralReward::STATUS_PENDING,
        ]);

        try {
            match ($campaign->reward_type) {
                'cash' => $this->sendCashReward($referrer, $reward),
                'credit' => $this->addAccountCredit($referrer, $reward),
                'gift_card' => $this->sendGiftCard($referrer, $reward),
                default => throw new \Exception('Invalid reward type: ' . $campaign->reward_type),
            };

            $referrer->increment('total_earnings', $amount);
            $referral->markAsRewarded();

            Log::info('Referral reward sent successfully', [
                'referrer_id' => $referrer->id,
                'referral_id' => $referral->id,
                'amount' => $amount,
                'type' => $campaign->reward_type,
            ]);

        } catch (\Exception $e) {
            $reward->markAsFailed($e->getMessage());

            Log::error('Referral reward failed', [
                'referrer_id' => $referrer->id,
                'referral_id' => $referral->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $reward;
    }

    /**
     * Send cash via payment provider (placeholder for PayPal/Venmo integration)
     */
    protected function sendCashReward(Referrer $referrer, ReferralReward $reward): void
    {
        $user = $referrer->user;

        // For now, mark as pending manual processing
        // In production, integrate with PayPal Payouts API or similar
        $reward->update([
            'status' => ReferralReward::STATUS_PENDING,
            'payment_method' => $referrer->preferred_payout_method ?? 'manual',
            'payment_details' => json_encode([
                'payout_email' => $referrer->payout_email,
                'note' => 'Pending manual payout - integrate PayPal/Venmo API',
            ]),
        ]);

        // TODO: Integrate PayPal Payouts API
        // if ($referrer->payout_email) {
        //     $payout = PayPalService::sendPayout(
        //         email: $referrer->payout_email,
        //         amount: $reward->amount,
        //         note: "Referral reward"
        //     );
        //     $reward->markAsSent('paypal', $payout['batch_id']);
        // }
    }

    /**
     * Add credit to user account
     */
    protected function addAccountCredit(Referrer $referrer, ReferralReward $reward): void
    {
        $user = $referrer->user;

        // Add credit to user (assumes user has account_credit column)
        // $user->increment('account_credit', $reward->amount);

        $reward->markAsSent('account_credit', "CREDIT-{$user->id}-" . now()->timestamp);
    }

    /**
     * Send gift card via Tremendous
     */
    protected function sendGiftCard(Referrer $referrer, ReferralReward $reward): void
    {
        $user = $referrer->user;

        $order = $this->tremendousService->sendReward(
            recipientEmail: $user->email,
            recipientName: $user->name,
            amount: $reward->amount,
            campaignId: config('services.tremendous.default_campaign_id'),
            deliveryMethod: 'EMAIL',
            externalId: "referral-reward-{$reward->id}"
        );

        if (!$order) {
            throw new \Exception('Failed to send gift card via Tremendous');
        }

        $reward->markAsSent('gift_card', $order['id'] ?? null);
        $reward->update(['payment_details' => json_encode($order)]);
    }

    /**
     * Get referrer by code
     */
    public function getReferrerByCode(string $code): ?Referrer
    {
        return Referrer::where('referral_code', $code)
            ->whereNotNull('qualified_at')
            ->first();
    }

    /**
     * Get referrer from session/cookie
     */
    public function getReferrerFromSession(): ?Referrer
    {
        $code = session('referral_code') ?? request()->cookie('referral_code');

        if (!$code) {
            return null;
        }

        return $this->getReferrerByCode($code);
    }

    /**
     * Get dashboard stats for a referrer
     */
    public function getDashboardStats(Referrer $referrer): array
    {
        return [
            'referral_link' => $referrer->referral_link,
            'referral_code' => $referrer->referral_code,
            'qr_code_url' => $referrer->qr_code_url,
            'total_reach' => $referrer->total_reach,
            'total_referrals' => $referrer->total_referrals,
            'converted_referrals' => $referrer->converted_referrals,
            'total_earnings' => $referrer->total_earnings,
            'formatted_earnings' => $referrer->formatted_earnings,
            'pending_rewards' => $referrer->pending_rewards_count,
            'conversion_rate' => $referrer->conversion_rate,
            'recent_referrals' => $this->getRecentReferrals($referrer),
            'recent_clicks' => $this->getRecentClicks($referrer),
        ];
    }

    /**
     * Get recent referrals for dashboard
     */
    protected function getRecentReferrals(Referrer $referrer, int $limit = 10): array
    {
        return $referrer->referrals()
            ->with('referredUser:id,name,email')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'name' => $r->referredUser->name ?? 'Unknown',
                'email' => $this->maskEmail($r->referredUser->email ?? ''),
                'status' => $r->status,
                'signed_up_at' => $r->signed_up_at?->format('M d, Y'),
                'converted_at' => $r->converted_at?->format('M d, Y'),
                'rewarded_at' => $r->rewarded_at?->format('M d, Y'),
            ])
            ->toArray();
    }

    /**
     * Get recent clicks for dashboard
     */
    protected function getRecentClicks(Referrer $referrer, int $limit = 10): array
    {
        return $referrer->clicks()
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'device' => $c->device_type,
                'browser' => $c->browser,
                'converted' => $c->converted,
                'created_at' => $c->created_at->format('M d, Y H:i'),
            ])
            ->toArray();
    }

    /**
     * Mask email for privacy
     */
    protected function maskEmail(string $email): string
    {
        if (empty($email)) {
            return '';
        }

        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return '***';
        }

        $name = $parts[0];
        $domain = $parts[1];

        $maskedName = substr($name, 0, 2) . str_repeat('*', max(0, strlen($name) - 2));

        return $maskedName . '@' . $domain;
    }

    /**
     * Detect referral source
     */
    protected function detectSource(): string
    {
        $referer = request()->headers->get('referer', '');

        if (empty($referer)) {
            return 'direct';
        }

        if (str_contains($referer, 'facebook.com') || str_contains($referer, 'fb.com')) {
            return 'facebook';
        }

        if (str_contains($referer, 'twitter.com') || str_contains($referer, 'x.com')) {
            return 'twitter';
        }

        if (str_contains($referer, 'instagram.com')) {
            return 'instagram';
        }

        if (str_contains($referer, 'linkedin.com')) {
            return 'linkedin';
        }

        if (str_contains($referer, 'wa.me') || str_contains($referer, 'whatsapp.com')) {
            return 'whatsapp';
        }

        return 'other';
    }

    /**
     * Get device type from user agent
     */
    protected function getDeviceType(?string $userAgent): string
    {
        if (!$userAgent) {
            return 'unknown';
        }

        $userAgent = strtolower($userAgent);

        if (preg_match('/mobile|android|iphone|ipod|blackberry|windows phone/i', $userAgent)) {
            return 'mobile';
        }

        if (preg_match('/tablet|ipad/i', $userAgent)) {
            return 'tablet';
        }

        return 'desktop';
    }

    /**
     * Get browser from user agent
     */
    protected function getBrowser(?string $userAgent): string
    {
        if (!$userAgent) {
            return 'unknown';
        }

        if (str_contains($userAgent, 'Chrome') && !str_contains($userAgent, 'Edg')) {
            return 'Chrome';
        }
        if (str_contains($userAgent, 'Safari') && !str_contains($userAgent, 'Chrome')) {
            return 'Safari';
        }
        if (str_contains($userAgent, 'Firefox')) {
            return 'Firefox';
        }
        if (str_contains($userAgent, 'Edg')) {
            return 'Edge';
        }
        if (str_contains($userAgent, 'Opera') || str_contains($userAgent, 'OPR')) {
            return 'Opera';
        }

        return 'Other';
    }

    /**
     * Get OS from user agent
     */
    protected function getOS(?string $userAgent): string
    {
        if (!$userAgent) {
            return 'unknown';
        }

        if (str_contains($userAgent, 'Windows')) {
            return 'Windows';
        }
        if (str_contains($userAgent, 'Mac OS')) {
            return 'macOS';
        }
        if (str_contains($userAgent, 'Linux') && !str_contains($userAgent, 'Android')) {
            return 'Linux';
        }
        if (str_contains($userAgent, 'Android')) {
            return 'Android';
        }
        if (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
            return 'iOS';
        }

        return 'Other';
    }

    /**
     * Get or create default campaign
     */
    public function getDefaultCampaign(): ReferralCampaign
    {
        return ReferralCampaign::active()->first()
            ?? ReferralCampaign::create([
                'name' => 'Job Referral Program',
                'slug' => 'job-referral-program',
                'active' => true,
                'reward_amount' => 200.00,
                'reward_type' => 'gift_card',
                'conversion_trigger' => 'job_completion',
                'description' => 'Earn $200 for every friend who completes a job with us!',
            ]);
    }
}
