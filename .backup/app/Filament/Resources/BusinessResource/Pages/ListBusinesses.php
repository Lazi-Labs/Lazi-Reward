<?php

namespace App\Filament\Resources\BusinessResource\Pages;

use Filament\Actions\CreateAction;
use App\Filament\Resources\BusinessResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListBusinesses extends ListRecords
{
    protected static string $resource = BusinessResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
