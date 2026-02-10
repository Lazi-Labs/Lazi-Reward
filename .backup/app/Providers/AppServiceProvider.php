<?php

namespace App\Providers;

use Filament\Support\Colors\Color;
use Filament\Support\Facades\FilamentColor;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        FilamentColor::register( [
            'primary' => [
                50  => '250, 250, 250',
                100 => '244, 244, 245',
                200 => '228, 228, 231',
                300 => '212, 212, 216',
                400 => '161, 161, 170',
                500 => '113, 113, 122',
                600 => '82, 82, 91',
                700 => '63, 63, 70',
                800 => '39, 39, 42',
                900 => '24, 24, 27',
                950 => '9, 9, 11',
            ],
            'gray'    => Color::Zinc,
        ] );
    }
}
