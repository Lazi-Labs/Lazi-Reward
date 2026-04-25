<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ReferrerResource\Pages;
use App\Models\Referrer;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Infolists\Components\ImageEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section as InfoSection;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ReferrerResource extends Resource
{
    protected static ?string $model = Referrer::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationLabel = 'Referrers';

    protected static string | \UnitEnum | null $navigationGroup = 'Referrals';

    protected static ?int $navigationSort = 2;

    public static function form(Schema $form): Schema
    {
        return $form
            ->schema([
                Section::make('Referrer Details')
                    ->schema([
                        Select::make('user_id')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Select::make('campaign_id')
                            ->relationship('campaign', 'name')
                            ->required(),
                        TextInput::make('referral_code')
                            ->required()
                            ->maxLength(8)
                            ->unique(ignoreRecord: true),
                        TextInput::make('referral_link')
                            ->required()
                            ->url(),
                    ])->columns(2),

                Section::make('Payout Settings')
                    ->schema([
                        Select::make('preferred_payout_method')
                            ->options([
                                'paypal' => 'PayPal',
                                'venmo' => 'Venmo',
                                'gift_card' => 'Gift Card',
                                'credit' => 'Account Credit',
                            ]),
                        TextInput::make('payout_email')
                            ->email(),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user.name')
                    ->label('Customer')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('user.email')
                    ->label('Email')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('referral_code')
                    ->searchable()
                    ->copyable()
                    ->copyMessage('Code copied!'),
                TextColumn::make('total_reach')
                    ->label('Clicks')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('total_referrals')
                    ->label('Signups')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('converted_referrals')
                    ->label('Conversions')
                    ->badge()
                    ->color('success')
                    ->sortable()
                    ->alignCenter(),
                TextColumn::make('total_earnings')
                    ->label('Earnings')
                    ->money('usd')
                    ->sortable(),
                TextColumn::make('qualified_at')
                    ->label('Qualified')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('total_earnings', 'desc')
            ->filters([
                Tables\Filters\Filter::make('has_conversions')
                    ->label('Has Conversions')
                    ->query(fn($query) => $query->where('converted_referrals', '>', 0)),
                Tables\Filters\Filter::make('qualified')
                    ->label('Qualified Only')
                    ->query(fn($query) => $query->whereNotNull('qualified_at')),
            ])
            ->actions([
                \Filament\Actions\ViewAction::make(),
                \Filament\Actions\EditAction::make(),
            ])
            ->bulkActions([
                \Filament\Actions\BulkActionGroup::make([
                    \Filament\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                InfoSection::make('Referrer Info')
                    ->schema([
                        TextEntry::make('user.name')
                            ->label('Customer'),
                        TextEntry::make('user.email')
                            ->label('Email')
                            ->copyable(),
                        TextEntry::make('referral_code')
                            ->copyable(),
                        TextEntry::make('referral_link')
                            ->copyable()
                            ->url(fn($record) => $record->referral_link, true),
                    ])->columns(2),

                InfoSection::make('Statistics')
                    ->schema([
                        TextEntry::make('total_reach')
                            ->label('Total Clicks'),
                        TextEntry::make('total_referrals')
                            ->label('Total Signups'),
                        TextEntry::make('converted_referrals')
                            ->label('Conversions')
                            ->badge()
                            ->color('success'),
                        TextEntry::make('total_earnings')
                            ->money('usd'),
                        TextEntry::make('conversion_rate')
                            ->suffix('%'),
                    ])->columns(5),

                InfoSection::make('QR Code')
                    ->schema([
                        ImageEntry::make('qr_code_path')
                            ->disk('public')
                            ->height(200),
                    ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            // Can add ReferralsRelationManager here
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListReferrers::route('/'),
            'create' => Pages\CreateReferrer::route('/create'),
            'view' => Pages\ViewReferrer::route('/{record}'),
            'edit' => Pages\EditReferrer::route('/{record}/edit'),
        ];
    }
}
