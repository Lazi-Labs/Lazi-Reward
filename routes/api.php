<?php

use App\Http\Controllers\Api\GiftCardCatalogController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

// Webhook routes (no CSRF, no session)
Route::prefix('webhook')->group(function () {
    Route::post('/verification-result', [WebhookController::class, 'verificationResult'])->name('webhook.verification');
    Route::get('/check-status/{token}', [WebhookController::class, 'checkStatus'])->name('webhook.check-status');
});

// Gift Card Catalog API
Route::prefix('gift-cards')->group(function () {
    Route::get('/catalog', [GiftCardCatalogController::class, 'index'])->name('api.gift-cards.catalog');
    Route::post('/sync', [GiftCardCatalogController::class, 'sync'])->name('api.gift-cards.sync');
});
