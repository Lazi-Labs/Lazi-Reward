<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TremendousService;
use Illuminate\Http\JsonResponse;

class GiftCardCatalogController extends Controller
{
    public function __construct(
        protected TremendousService $tremendousService
    ) {}

    /**
     * Get gift card catalog
     * GET /api/gift-cards/catalog
     */
    public function index(): JsonResponse
    {
        $catalog = $this->tremendousService->getCatalog();

        return response()->json([
            'success' => true,
            'data' => $catalog,
            'count' => count($catalog),
        ]);
    }

    /**
     * Force refresh catalog from Tremendous API
     * POST /api/gift-cards/sync
     */
    public function sync(): JsonResponse
    {
        $synced = $this->tremendousService->syncProducts();

        return response()->json([
            'success' => true,
            'message' => "Synced {$synced} products from Tremendous API",
            'synced_count' => $synced,
        ]);
    }
}
