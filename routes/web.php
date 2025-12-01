<?php

use App\Livewire\ReviewWizard;
use App\Livewire\ScreenshotUpload;
use Illuminate\Support\Facades\Route;

// Public routes with rate limiting
Route::middleware(['throttle:60,1'])->group(function () {
    Route::get('/', ReviewWizard::class)->name('home');
    Route::get('/upload-review/{token}', ScreenshotUpload::class)->name('upload');
});

// Concept pages (can be removed in production)
Route::view('/concepts/modern-dark', 'concepts.modern-dark')->name('concepts.modern-dark');
Route::view('/concepts/vibrant-gradient', 'concepts.vibrant-gradient')->name('concepts.vibrant-gradient');
Route::view('/concepts/minimalist-clean', 'concepts.minimalist-clean')->name('concepts.minimalist-clean');
