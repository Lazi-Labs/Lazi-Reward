<?php

use App\Livewire\Account\Dashboard;
use App\Livewire\Auth\LoginForm;
use App\Livewire\Auth\RegisterForm;
use App\Livewire\ReviewWizard;
use App\Livewire\ScreenshotUpload;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// Public routes with rate limiting
Route::middleware(['throttle:60,1'])->group(function () {
    Route::get('/', ReviewWizard::class)->name('home');
    Route::get('/upload-review/{token}', ScreenshotUpload::class)->name('upload');
});

// Guest auth routes
Route::middleware(['guest'])->group(function () {
    Route::get('/login', LoginForm::class)->name('login');
    Route::get('/register', RegisterForm::class)->name('register');
});

// Logout
Route::post('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();

    return redirect('/');
})->name('logout');

// Authenticated customer routes
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', Dashboard::class)->name('dashboard');
});

// Concept pages (can be removed in production)
Route::view('/concepts/modern-dark', 'concepts.modern-dark')->name('concepts.modern-dark');
Route::view('/concepts/vibrant-gradient', 'concepts.vibrant-gradient')->name('concepts.vibrant-gradient');
Route::view('/concepts/minimalist-clean', 'concepts.minimalist-clean')->name('concepts.minimalist-clean');
