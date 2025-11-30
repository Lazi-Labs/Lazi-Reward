<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'business_key',
        'gift_card_choice',
        'status',
        'token',
        'screenshot_path',
    ];
}
