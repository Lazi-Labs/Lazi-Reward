<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Referral extends Model
{
    use HasUuids;

    protected $fillable = [
        'referrer_id',
        'referred_user_id',
        'campaign_id',
        'status',
        'clicked_at',
        'signed_up_at',
        'converted_at',
        'rewarded_at',
        'ip_address',
        'user_agent',
        'source',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'clicked_at' => 'datetime',
            'signed_up_at' => 'datetime',
            'converted_at' => 'datetime',
            'rewarded_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    // Status constants
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONVERTED = 'converted';
    public const STATUS_REWARDED = 'rewarded';
    public const STATUS_CANCELLED = 'cancelled';

    // Relationships
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    public function referredUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(ReferralCampaign::class, 'campaign_id');
    }

    public function reward(): HasOne
    {
        return $this->hasOne(ReferralReward::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeConverted($query)
    {
        return $query->where('status', self::STATUS_CONVERTED);
    }

    public function scopeRewarded($query)
    {
        return $query->where('status', self::STATUS_REWARDED);
    }

    // Helpers
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isConverted(): bool
    {
        return $this->status === self::STATUS_CONVERTED;
    }

    public function isRewarded(): bool
    {
        return $this->status === self::STATUS_REWARDED;
    }

    public function markAsConverted(): void
    {
        $this->update([
            'status' => self::STATUS_CONVERTED,
            'converted_at' => now(),
        ]);
    }

    public function markAsRewarded(): void
    {
        $this->update([
            'status' => self::STATUS_REWARDED,
            'rewarded_at' => now(),
        ]);
    }
}
