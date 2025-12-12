<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class GiftCardProduct extends Model
{
    use HasUuids;

    protected $fillable = [
        'tremendous_product_id',
        'name',
        'description',
        'image_url',
        'category',
        'min_value',
        'max_value',
        'currency_code',
        'is_active',
        'sort_order',
        'last_synced_at',
    ];

    protected $casts = [
        'min_value' => 'decimal:2',
        'max_value' => 'decimal:2',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'last_synced_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    public function getFormattedValueRangeAttribute(): string
    {
        if ($this->min_value == $this->max_value) {
            return '$' . number_format($this->min_value, 0);
        }
        return '$' . number_format($this->min_value, 0) . ' - $' . number_format($this->max_value, 0);
    }
}
