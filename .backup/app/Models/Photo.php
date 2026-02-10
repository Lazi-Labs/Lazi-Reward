<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Photo extends Model
{
    use HasUuids;

    protected $fillable = [
        'business_id',
        'name',
        'path',
        'alt',
        'is_used',
    ];

    protected $casts = [
        'is_used' => 'boolean',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_used', false);
    }

    public function scopeUsed($query)
    {
        return $query->where('is_used', true);
    }

    public function markAsUsed(): void
    {
        $this->update(['is_used' => true]);
    }

    public function getUrlAttribute(): ?string
    {
        if (!$this->path) {
            return null;
        }
        
        // If path starts with 'samples/', use placeholder image
        if (str_starts_with($this->path, 'samples/')) {
            $seed = md5($this->path);
            return "https://picsum.photos/seed/{$seed}/800/600";
        }
        
        return Storage::disk('public')->url($this->path);
    }
}
