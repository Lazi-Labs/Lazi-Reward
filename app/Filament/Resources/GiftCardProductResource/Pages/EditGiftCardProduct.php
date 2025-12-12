<?php

namespace App\Filament\Resources\GiftCardProductResource\Pages;

use App\Filament\Resources\GiftCardProductResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditGiftCardProduct extends EditRecord
{
    protected static string $resource = GiftCardProductResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
