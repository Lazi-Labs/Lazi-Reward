<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobReferral extends Model
{
    use HasUuids;

    const STATUS_PENDING = 'pending';
    const STATUS_CONTACTED = 'contacted';
    const STATUS_HIRED = 'hired';
    const STATUS_COMPLETED = 'completed';
    const STATUS_REJECTED = 'rejected';

    const REWARD_STATUS_PENDING = 'pending';
    const REWARD_STATUS_SENT = 'sent';
    const REWARD_STATUS_FAILED = 'failed';

    protected $fillable = [
        'user_id',
        'business_id',
        'job_type_id',
        'referred_name',
        'referred_phone',
        'referred_email',
        'status',
        'contacted_at',
        'hired_at',
        'completed_at',
        'rewarded_at',
        'reward_amount',
        'reward_status',
        'reward_reference',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'reward_amount' => 'decimal:2',
            'contacted_at' => 'datetime',
            'hired_at' => 'datetime',
            'completed_at' => 'datetime',
            'rewarded_at' => 'datetime',
        ];
    }

    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING => 'Pending',
            self::STATUS_CONTACTED => 'Contacted',
            self::STATUS_HIRED => 'Hired',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_REJECTED => 'Rejected',
        ];
    }

    public static function getRewardStatuses(): array
    {
        return [
            self::REWARD_STATUS_PENDING => 'Pending',
            self::REWARD_STATUS_SENT => 'Sent',
            self::REWARD_STATUS_FAILED => 'Failed',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function jobType(): BelongsTo
    {
        return $this->belongsTo(JobType::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeInProgress($query)
    {
        return $query->whereIn('status', [self::STATUS_CONTACTED, self::STATUS_HIRED]);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isRewardable(): bool
    {
        return $this->status === self::STATUS_COMPLETED && $this->reward_status !== self::REWARD_STATUS_SENT;
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING => 'gray',
            self::STATUS_CONTACTED => 'blue',
            self::STATUS_HIRED => 'yellow',
            self::STATUS_COMPLETED => 'green',
            self::STATUS_REJECTED => 'red',
            default => 'gray',
        };
    }

    public function getFormattedRewardAttribute(): string
    {
        return '$' . number_format($this->reward_amount ?? 0, 2);
    }

    public function markAsContacted(): void
    {
        $this->update([
            'status' => self::STATUS_CONTACTED,
            'contacted_at' => now(),
        ]);
    }

    public function markAsHired(): void
    {
        $this->update([
            'status' => self::STATUS_HIRED,
            'hired_at' => now(),
        ]);
    }

    public function markAsCompleted(): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);
    }

    public function markAsRejected(): void
    {
        $this->update([
            'status' => self::STATUS_REJECTED,
        ]);
    }

    public function markRewardSent(string $reference): void
    {
        $this->update([
            'reward_status' => self::REWARD_STATUS_SENT,
            'reward_reference' => $reference,
            'rewarded_at' => now(),
        ]);
    }
}
