<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ReferralCampaign extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'active',
        'reward_amount',
        'reward_type',
        'conversion_trigger',
        'description',
        'terms_conditions',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'reward_amount' => 'decimal:2',
            'settings' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (ReferralCampaign $campaign) {
            if (empty($campaign->slug)) {
                $campaign->slug = Str::slug($campaign->name);
            }
        });
    }

    // Relationships
    public function referrers(): HasMany
    {
        return $this->hasMany(Referrer::class, 'campaign_id');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class, 'campaign_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    // Helpers
    public function getFormattedRewardAttribute(): string
    {
        return '$' . number_format($this->reward_amount, 2);
    }

    public function getTotalReferrersAttribute(): int
    {
        return $this->referrers()->count();
    }

    public function getTotalConversionsAttribute(): int
    {
        return $this->referrals()->where('status', 'rewarded')->count();
    }

    public function getTotalRewardsPaidAttribute(): float
    {
        return $this->referrers()->sum('total_earnings');
    }
}
