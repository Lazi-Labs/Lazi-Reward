<?php

namespace App\Filament\Resources\JobReferralResource\Pages;

use App\Filament\Resources\JobReferralResource;
use Filament\Actions\EditAction;
use Filament\Resources\Pages\ViewRecord;

class ViewJobReferral extends ViewRecord
{
    protected static string $resource = JobReferralResource::class;

    protected function getHeaderActions(): array
    {
        return [
            EditAction::make(),
        ];
    }
}
