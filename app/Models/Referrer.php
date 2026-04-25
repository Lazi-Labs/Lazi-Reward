<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Referrer extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'campaign_id',
        'referral_code',
        'referral_link',
        'qr_code_path',
        'total_reach',
        'total_referrals',
        'converted_referrals',
        'total_earnings',
        'source',
        'referred_by_id',
        'qualified_at',
        'preferred_payout_method',
        'payout_email',
    ];

    protected function casts(): array
    {
        return [
            'total_reach' => 'integer',
            'total_referrals' => 'integer',
            'converted_referrals' => 'integer',
            'total_earnings' => 'decimal:2',
            'qualified_at' => 'datetime',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(ReferralCampaign::class, 'campaign_id');
    }

    public function referredBy(): BelongsTo
    {
        return $this->belongsTo(Referrer::class, 'referred_by_id');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class);
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(ReferralReward::class);
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(ReferralClick::class);
    }

    public function downlineReferrers(): HasMany
    {
        return $this->hasMany(Referrer::class, 'referred_by_id');
    }

    // Scopes
    public function scopeQualified($query)
    {
        return $query->whereNotNull('qualified_at');
    }

    public function scopeWithConversions($query)
    {
        return $query->where('converted_referrals', '>', 0);
    }

    // Helpers
    public function isQualified(): bool
    {
        return $this->qualified_at !== null;
    }

    public function getQrCodeUrlAttribute(): ?string
    {
        if (!$this->qr_code_path) {
            return null;
        }
        return Storage::url($this->qr_code_path);
    }

    public function getConversionRateAttribute(): float
    {
        if ($this->total_referrals === 0) {
            return 0;
        }
        return round(($this->converted_referrals / $this->total_referrals) * 100, 2);
    }

    public function getFormattedEarningsAttribute(): string
    {
        return '$' . number_format($this->total_earnings, 2);
    }

    public function getPendingRewardsCountAttribute(): int
    {
        return $this->referrals()
            ->where('status', 'converted')
            ->whereNull('rewarded_at')
            ->count();
    }
}
