<?php

namespace App\Services;

use App\Models\Business;
use App\Models\JobReferral;
use App\Models\JobType;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class JobReferralService
{
    protected TremendousService $tremendousService;

    public function __construct(?TremendousService $tremendousService = null)
    {
        $this->tremendousService = $tremendousService ?? new TremendousService();
    }

    /**
     * Create a new job referral
     */
    public function createReferral(
        User $user,
        JobType $jobType,
        string $referredName,
        string $referredPhone,
        string $referredEmail
    ): JobReferral {
        return JobReferral::create([
            'user_id' => $user->id,
            'business_id' => $jobType->business_id,
            'job_type_id' => $jobType->id,
            'referred_name' => $referredName,
            'referred_phone' => $referredPhone,
            'referred_email' => $referredEmail,
            'status' => JobReferral::STATUS_PENDING,
            'reward_amount' => $jobType->reward_amount,
        ]);
    }

    /**
     * Send reward for a completed referral
     */
    public function sendReward(JobReferral $referral, string $productId = 'OKMHM2X2OHYV'): array
    {
        if (!$referral->isRewardable()) {
            return [
                'success' => false,
                'error' => 'Referral is not eligible for reward',
            ];
        }

        $user = $referral->user;
        $business = $referral->business;

        try {
            $result = $this->tremendousService->sendGiftCard(
                $user->email,
                $user->name,
                (float) $referral->reward_amount,
                $productId,
                "Thank you for your referral to {$business->name}! The job has been completed."
            );

            if ($result['success']) {
                $referral->markRewardSent($result['order_id']);

                Log::info('Referral reward sent', [
                    'referral_id' => $referral->id,
                    'user_id' => $user->id,
                    'amount' => $referral->reward_amount,
                    'order_id' => $result['order_id'],
                ]);

                return [
                    'success' => true,
                    'order_id' => $result['order_id'],
                ];
            }

            $referral->update([
                'reward_status' => JobReferral::REWARD_STATUS_FAILED,
                'admin_notes' => ($referral->admin_notes ? $referral->admin_notes . "\n" : '') .
                    "[" . now()->format('Y-m-d H:i') . "] Reward failed: " . ($result['error'] ?? 'Unknown error'),
            ]);

            return [
                'success' => false,
                'error' => $result['error'] ?? 'Unknown error',
            ];

        } catch (Exception $e) {
            Log::error('Referral reward exception', [
                'referral_id' => $referral->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get user dashboard statistics
     */
    public function getUserStats(User $user): array
    {
        $referrals = $user->jobReferrals();

        return [
            'total_referrals' => $referrals->count(),
            'pending' => $referrals->clone()->pending()->count(),
            'in_progress' => $referrals->clone()->inProgress()->count(),
            'completed' => $referrals->clone()->completed()->count(),
            'total_earned' => $referrals->clone()
                ->where('reward_status', JobReferral::REWARD_STATUS_SENT)
                ->sum('reward_amount'),
            'pending_earnings' => $referrals->clone()
                ->where('status', JobReferral::STATUS_COMPLETED)
                ->where(function ($q) {
                    $q->whereNull('reward_status')
                        ->orWhere('reward_status', JobReferral::REWARD_STATUS_PENDING);
                })
                ->sum('reward_amount'),
        ];
    }

    /**
     * Get business statistics for admin
     */
    public function getBusinessStats(Business $business): array
    {
        $referrals = $business->jobReferrals();

        return [
            'total_referrals' => $referrals->count(),
            'pending' => $referrals->clone()->pending()->count(),
            'in_progress' => $referrals->clone()->inProgress()->count(),
            'completed' => $referrals->clone()->completed()->count(),
            'total_paid' => $referrals->clone()
                ->where('reward_status', JobReferral::REWARD_STATUS_SENT)
                ->sum('reward_amount'),
            'by_job_type' => $business->jobTypes()
                ->withCount('jobReferrals')
                ->get()
                ->map(fn ($jt) => [
                    'name' => $jt->name,
                    'count' => $jt->job_referrals_count,
                    'reward' => $jt->reward_amount,
                ]),
        ];
    }

    /**
     * Get active job types by business for dropdown
     */
    public function getJobTypesByBusiness(): array
    {
        return Business::active()
            ->with(['jobTypes' => fn ($q) => $q->active()->ordered()])
            ->ordered()
            ->get()
            ->map(fn ($business) => [
                'id' => $business->id,
                'name' => $business->name,
                'job_types' => $business->jobTypes->map(fn ($jt) => [
                    'id' => $jt->id,
                    'name' => $jt->name,
                    'reward' => $jt->formatted_reward,
                    'description' => $jt->description,
                ]),
            ])
            ->toArray();
    }

    /**
     * Update referral status with timestamp
     */
    public function updateStatus(JobReferral $referral, string $status, ?string $notes = null): void
    {
        $data = ['status' => $status];

        switch ($status) {
            case JobReferral::STATUS_CONTACTED:
                $data['contacted_at'] = now();
                break;
            case JobReferral::STATUS_HIRED:
                $data['hired_at'] = now();
                break;
            case JobReferral::STATUS_COMPLETED:
                $data['completed_at'] = now();
                break;
        }

        if ($notes) {
            $data['admin_notes'] = ($referral->admin_notes ? $referral->admin_notes . "\n" : '') .
                "[" . now()->format('Y-m-d H:i') . "] " . $notes;
        }

        $referral->update($data);
    }
}
