<?php

namespace App\Filament\Resources\JobReferralResource\Pages;

use App\Filament\Resources\JobReferralResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditJobReferral extends EditRecord
{
    protected static string $resource = JobReferralResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
