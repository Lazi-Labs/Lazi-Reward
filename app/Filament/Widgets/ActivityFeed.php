<?php

namespace App\Filament\Widgets;

use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Actions\Action;
use App\Filament\Resources\SubmissionResource;
use App\Models\Submission;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class ActivityFeed extends BaseWidget
{
    protected int|string|array $columnSpan = 'full';

    protected static ?string $heading = 'Recent Activity';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Submission::query()->latest('updated_at')->limit(20)
            )
            ->columns([
                TextColumn::make('updated_at')
                    ->label('Time')
                    ->dateTime('M j, g:i A')
                    ->sortable()
                    ->description(fn (Submission $record) => $record->updated_at->diffForHumans()),
                TextColumn::make('name')
                    ->searchable()
                    ->description(fn (Submission $record) => $record->email),
                TextColumn::make('businessLocation.name')
                    ->label('Business')
                    ->badge(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'gray',
                        'waiting_for_screenshot' => 'warning',
                        'completed' => 'success',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending' => 'Submitted',
                        'waiting_for_screenshot' => 'Awaiting Screenshot',
                        'completed' => 'Completed',
                        default => $state,
                    }),
                ImageColumn::make('service_photo_path')
                    ->label('Photo')
                    ->disk('public')
                    ->circular()
                    ->defaultImageUrl(fn () => null),
                ImageColumn::make('screenshot_path')
                    ->label('Screenshot')
                    ->disk('public')
                    ->circular()
                    ->defaultImageUrl(fn () => null),
            ])
            ->recordActions([
                Action::make('view')
                    ->url(fn (Submission $record): string => SubmissionResource::getUrl('view', ['record' => $record]))
                    ->icon('heroicon-m-eye'),
            ])
            ->paginated([10, 20, 50]);
    }
}
