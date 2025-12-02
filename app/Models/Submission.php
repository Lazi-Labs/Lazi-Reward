<?php

namespace App\Models;

use App\Observers\SubmissionObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy(SubmissionObserver::class)]
class Submission extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'business_id',
        'gift_card_id',
        'business_key',
        'gift_card_choice',
        'status',
        'token',
        'screenshot_path',
        'service_photo_path',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function giftCard(): BelongsTo
    {
        return $this->belongsTo(GiftCard::class);
    }
}
