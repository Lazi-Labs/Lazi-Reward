<?php

use App\Livewire\ReviewWizard;
use App\Livewire\ScreenshotUpload;
use Illuminate\Support\Facades\Route;

Route::get('/', ReviewWizard::class)->name('home');
Route::get('/upload-review/{token}', ScreenshotUpload::class)->name('upload');
Route::view('/concepts/modern-dark', 'concepts.modern-dark')->name('concepts.modern-dark');
Route::view('/concepts/vibrant-gradient', 'concepts.vibrant-gradient')->name('concepts.vibrant-gradient');
Route::view('/concepts/minimalist-clean', 'concepts.minimalist-clean')->name('concepts.minimalist-clean');
