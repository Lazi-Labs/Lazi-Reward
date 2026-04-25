<?php

namespace App\Filament\Resources\PhotoResource\Pages;

use Filament\Actions\Action;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\FileUpload;
use App\Filament\Resources\PhotoResource;
use App\Models\Photo;
use Filament\Actions;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;

class ListPhotos extends ListRecords
{
    protected static string $resource = PhotoResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('upload')
                ->label('Upload Photos')
                ->icon('heroicon-o-arrow-up-tray')
                ->schema([
                    Select::make('business_id')
                        ->label('Business')
                        ->relationship('business', 'name')
                        ->required()
                        ->searchable()
                        ->preload(),
                    FileUpload::make('photos')
                        ->label('Photos')
                        ->image()
                        ->multiple()
                        ->reorderable()
                        ->disk('public')
                        ->directory('photos')
                        ->required()
                        ->maxFiles(20)
                        ->panelLayout('grid')
                        ->imagePreviewHeight('150')
                        ->helperText('You can upload up to 20 photos at once'),
                ])
                ->action(function (array $data): void {
                    $count = 0;

                    foreach ($data['photos'] as $path) {
                        Photo::create([
                            'business_id' => $data['business_id'],
                            'path' => $path,
                        ]);
                        $count++;
                    }

                    Notification::make()
                        ->title("{$count} photos uploaded")
                        ->success()
                        ->send();
                })
                ->modalHeading('Upload Photos')
                ->modalSubmitActionLabel('Upload')
                ->modalWidth('lg'),
        ];
    }
}
