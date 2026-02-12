<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class JobType extends Model
{
    use HasUuids;

    protected $fillable = [
        'business_id',
        'name',
        'slug',
        'description',
        'reward_amount',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'reward_amount' => 'decimal:2',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (JobType $jobType) {
            if (empty($jobType->slug)) {
                $baseSlug = Str::slug($jobType->name);
                $slug = $baseSlug;
                $count = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $count++;
                }
                $jobType->slug = $slug;
            }
        });
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function jobReferrals(): HasMany
    {
        return $this->hasMany(JobReferral::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function getFormattedRewardAttribute(): string
    {
        return '$' . number_format($this->reward_amount, 2);
    }
}
