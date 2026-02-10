<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralReward extends Model
{
    use HasUuids;

    protected $fillable = [
        'referrer_id',
        'referral_id',
        'amount',
        'type',
        'status',
        'payment_method',
        'payment_reference',
        'payment_details',
        'failure_reason',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'sent_at' => 'datetime',
        ];
    }

    // Status constants
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_SENT = 'sent';
    public const STATUS_FAILED = 'failed';

    // Type constants
    public const TYPE_CASH = 'cash';
    public const TYPE_CREDIT = 'credit';
    public const TYPE_GIFT_CARD = 'gift_card';

    // Relationships
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    public function referral(): BelongsTo
    {
        return $this->belongsTo(Referral::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeSent($query)
    {
        return $query->where('status', self::STATUS_SENT);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    // Helpers
    public function getFormattedAmountAttribute(): string
    {
        return '$' . number_format($this->amount, 2);
    }

    public function markAsSent(string $paymentMethod, ?string $reference = null): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'payment_method' => $paymentMethod,
            'payment_reference' => $reference,
            'sent_at' => now(),
        ]);
    }

    public function markAsFailed(string $reason): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'failure_reason' => $reason,
        ]);
    }
}
