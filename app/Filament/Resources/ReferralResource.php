<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ReferralResource\Pages;
use App\Models\Referral;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ReferralResource extends Resource
{
    protected static ?string $model = Referral::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-arrow-path';

    protected static ?string $navigationLabel = 'Referrals';

    protected static string | \UnitEnum | null $navigationGroup = 'Referrals';

    protected static ?int $navigationSort = 3;

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('referrer.user.name')
                    ->label('Referrer')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('referredUser.name')
                    ->label('Referred User')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('referredUser.email')
                    ->label('Email')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'pending' => 'warning',
                        'converted' => 'info',
                        'rewarded' => 'success',
                        'cancelled' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('source')
                    ->badge()
                    ->color('gray'),
                TextColumn::make('signed_up_at')
                    ->label('Signed Up')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('converted_at')
                    ->label('Converted')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('rewarded_at')
                    ->label('Rewarded')
                    ->dateTime()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'converted' => 'Converted',
                        'rewarded' => 'Rewarded',
                        'cancelled' => 'Cancelled',
                    ]),
            ])
            ->actions([
                \Filament\Actions\ViewAction::make(),
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
            'index' => Pages\ListReferrals::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        return false; // Referrals are created automatically
    }
}
