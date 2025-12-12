<?php

namespace App\Filament\Resources\GiftCardProductResource\Pages;

use App\Filament\Resources\GiftCardProductResource;
use App\Services\TremendousService;
use Filament\Actions\Action;
use Filament\Actions\CreateAction;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;

class ListGiftCardProducts extends ListRecords
{
    protected static string $resource = GiftCardProductResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('sync')
                ->label('Sync from Tremendous')
                ->icon('heroicon-o-arrow-path')
                ->color('info')
                ->action(function () {
                    $service = app(TremendousService::class);
                    $synced = $service->syncProducts();

                    Notification::make()
                        ->title('Sync Complete')
                        ->body("Synced {$synced} products from Tremendous API")
                        ->success()
                        ->send();
                })
                ->requiresConfirmation()
                ->modalHeading('Sync Products')
                ->modalDescription('This will fetch the latest product data from Tremendous API and update the local cache.')
                ->modalSubmitActionLabel('Sync Now'),
            CreateAction::make(),
        ];
    }
}
