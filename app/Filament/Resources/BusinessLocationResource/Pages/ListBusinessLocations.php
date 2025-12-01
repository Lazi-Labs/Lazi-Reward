<?php

namespace App\Filament\Resources\BusinessLocationResource\Pages;

use App\Filament\Resources\BusinessLocationResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListBusinessLocations extends ListRecords
{
    protected static string $resource = BusinessLocationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
