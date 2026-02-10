<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ReferralRewardResource\Pages;
use App\Models\ReferralReward;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ReferralRewardResource extends Resource
{
    protected static ?string $model = ReferralReward::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-gift';

    protected static ?string $navigationLabel = 'Rewards';

    protected static string | \UnitEnum | null $navigationGroup = 'Referrals';

    protected static ?int $navigationSort = 4;

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('referrer.user.name')
                    ->label('Referrer')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('referral.referredUser.name')
                    ->label('For Referral')
                    ->searchable(),
                TextColumn::make('amount')
                    ->money('usd')
                    ->sortable(),
                TextColumn::make('type')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'gift_card' => 'success',
                        'cash' => 'info',
                        'credit' => 'warning',
                        default => 'gray',
                    }),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'pending' => 'warning',
                        'processing' => 'info',
                        'sent' => 'success',
                        'failed' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('payment_method')
                    ->toggleable(),
                TextColumn::make('payment_reference')
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->copyable(),
                TextColumn::make('sent_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'processing' => 'Processing',
                        'sent' => 'Sent',
                        'failed' => 'Failed',
                    ]),
                Tables\Filters\SelectFilter::make('type')
                    ->options([
                        'gift_card' => 'Gift Card',
                        'cash' => 'Cash',
                        'credit' => 'Credit',
                    ]),
            ])
            ->actions([
                \Filament\Actions\Action::make('retry')
                    ->label('Retry')
                    ->icon('heroicon-o-arrow-path')
                    ->color('warning')
                    ->visible(fn($record) => $record->status === 'failed')
                    ->requiresConfirmation()
                    ->action(function ($record) {
                        // Reset status to pending for retry
                        $record->update([
                            'status' => 'pending',
                            'failure_reason' => null,
                        ]);
                    }),
            ])
            ->bulkActions([]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListReferralRewards::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        return false; // Rewards are created automatically
    }
}
