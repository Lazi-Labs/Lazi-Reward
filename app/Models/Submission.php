<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'business_location_id',
        'gift_card_id',
        'business_key',
        'gift_card_choice',
        'status',
        'token',
        'screenshot_path',
        'service_photo_path',
    ];

    public function businessLocation(): BelongsTo
    {
        return $this->belongsTo(BusinessLocation::class);
    }

    public function giftCard(): BelongsTo
    {
        return $this->belongsTo(GiftCard::class);
    }
}
