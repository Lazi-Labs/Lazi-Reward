<?php

namespace App\Filament\Resources\ReferrerResource\Pages;

use App\Filament\Resources\ReferrerResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewReferrer extends ViewRecord
{
    protected static string $resource = ReferrerResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make(),
        ];
    }
}
