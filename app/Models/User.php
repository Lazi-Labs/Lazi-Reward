<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return true; // All users can access admin panel
    }

    public function jobReferrals(): HasMany
    {
        return $this->hasMany(JobReferral::class);
    }

    public function getTotalEarningsAttribute(): float
    {
        return $this->jobReferrals()
            ->where('reward_status', 'sent')
            ->sum('reward_amount');
    }

    public function getPendingReferralsCountAttribute(): int
    {
        return $this->jobReferrals()
            ->whereIn('status', ['pending', 'contacted', 'hired'])
            ->count();
    }

    public function getCompletedReferralsCountAttribute(): int
    {
        return $this->jobReferrals()
            ->where('status', 'completed')
            ->count();
    }
}
