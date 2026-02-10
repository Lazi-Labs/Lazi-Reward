<?php

namespace App\Http\Controllers;

use App\Models\Referrer;
use App\Services\ReferralService;
use Illuminate\Http\Request;

class ReferralController extends Controller
{
    public function __construct(
        protected ReferralService $referralService
    ) {}

    /**
     * Handle referral link clicks
     * GET /r/{code}
     */
    public function handleClick(string $code, Request $request)
    {
        $referrer = $this->referralService->getReferrerByCode($code);

        if (!$referrer) {
            // Invalid or inactive referral code - redirect to home
            return redirect('/')->with('error', 'Invalid referral link.');
        }

        // Track the click
        $this->referralService->trackClick($referrer, $request);

        // Redirect to signup/home page with referral code
        return redirect()->route('home', ['ref' => $code]);
    }

    /**
     * User referral dashboard
     * GET /referrals
     */
    public function dashboard()
    {
        $user = auth()->user();

        $referrer = Referrer::where('user_id', $user->id)->first();

        if (!$referrer) {
            return view('referrals.not-eligible', [
                'message' => 'Complete your first job to unlock your referral dashboard!',
            ]);
        }

        $stats = $this->referralService->getDashboardStats($referrer);

        return view('referrals.dashboard', [
            'referrer' => $referrer,
            'stats' => $stats,
        ]);
    }

    /**
     * Download QR code
     * GET /referrals/qr-code
     */
    public function downloadQRCode()
    {
        $user = auth()->user();
        $referrer = Referrer::where('user_id', $user->id)->firstOrFail();

        if (!$referrer->qr_code_path) {
            abort(404, 'QR code not found.');
        }

        $path = storage_path('app/public/' . $referrer->qr_code_path);

        if (!file_exists($path)) {
            // Regenerate QR code
            $qrPath = $this->referralService->generateQRCode(
                $referrer->referral_code,
                $referrer->referral_link
            );
            $referrer->update(['qr_code_path' => $qrPath]);
            $path = storage_path('app/public/' . $qrPath);
        }

        return response()->download(
            $path,
            "referral-qr-{$referrer->referral_code}.png"
        );
    }

    /**
     * Get referral stats as JSON (for AJAX)
     * GET /referrals/stats
     */
    public function stats()
    {
        $user = auth()->user();
        $referrer = Referrer::where('user_id', $user->id)->first();

        if (!$referrer) {
            return response()->json(['error' => 'Not a referrer'], 404);
        }

        return response()->json(
            $this->referralService->getDashboardStats($referrer)
        );
    }

    /**
     * Update payout preferences
     * POST /referrals/payout-settings
     */
    public function updatePayoutSettings(Request $request)
    {
        $validated = $request->validate([
            'preferred_payout_method' => 'required|in:paypal,venmo,gift_card,credit',
            'payout_email' => 'nullable|email|required_if:preferred_payout_method,paypal,venmo',
        ]);

        $user = auth()->user();
        $referrer = Referrer::where('user_id', $user->id)->firstOrFail();

        $referrer->update($validated);

        return back()->with('success', 'Payout settings updated!');
    }
}
