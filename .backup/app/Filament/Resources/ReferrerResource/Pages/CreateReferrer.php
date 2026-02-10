<?php

namespace App\Filament\Resources\ReferrerResource\Pages;

use App\Filament\Resources\ReferrerResource;
use App\Services\ReferralService;
use Filament\Resources\Pages\CreateRecord;

class CreateReferrer extends CreateRecord
{
    protected static string $resource = ReferrerResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $referralService = app(ReferralService::class);

        // Generate unique code if not provided
        if (empty($data['referral_code'])) {
            $data['referral_code'] = $referralService->generateUniqueCode();
        }

        // Generate referral link
        $data['referral_link'] = url("/r/{$data['referral_code']}");

        // Generate QR code
        $data['qr_code_path'] = $referralService->generateQRCode(
            $data['referral_code'],
            $data['referral_link']
        );

        // Set qualified timestamp
        $data['qualified_at'] = now();

        return $data;
    }
}
