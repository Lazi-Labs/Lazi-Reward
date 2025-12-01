<?php

namespace App\Filament\Resources\BusinessLocationResource\Pages;

use App\Filament\Resources\BusinessLocationResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditBusinessLocation extends EditRecord
{
    protected static string $resource = BusinessLocationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
