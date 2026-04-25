<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralClick extends Model
{
    use HasUuids;

    protected $fillable = [
        'referrer_id',
        'ip_address',
        'user_agent',
        'referer_url',
        'country',
        'city',
        'device_type',
        'browser',
        'os',
        'converted',
    ];

    protected function casts(): array
    {
        return [
            'converted' => 'boolean',
        ];
    }

    // Relationships
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    // Scopes
    public function scopeConverted($query)
    {
        return $query->where('converted', true);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    public function scopeThisWeek($query)
    {
        return $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year);
    }
}
