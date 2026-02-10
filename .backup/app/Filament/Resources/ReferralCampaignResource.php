<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ReferralCampaignResource\Pages;
use App\Models\ReferralCampaign;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ReferralCampaignResource extends Resource
{
    protected static ?string $model = ReferralCampaign::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-megaphone';

    protected static ?string $navigationLabel = 'Campaigns';

    protected static string | \UnitEnum | null $navigationGroup = 'Referrals';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $form): Schema
    {
        return $form
            ->schema([
                Section::make('Campaign Details')
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('slug')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),
                        Toggle::make('active')
                            ->default(true),
                        Textarea::make('description')
                            ->rows(3),
                    ])->columns(2),

                Section::make('Reward Settings')
                    ->schema([
                        TextInput::make('reward_amount')
                            ->required()
                            ->numeric()
                            ->prefix('$')
                            ->default(200.00),
                        Select::make('reward_type')
                            ->required()
                            ->options([
                                'gift_card' => 'Gift Card (Tremendous)',
                                'cash' => 'Cash (PayPal/Venmo)',
                                'credit' => 'Account Credit',
                            ])
                            ->default('gift_card'),
                        Select::make('conversion_trigger')
                            ->required()
                            ->options([
                                'signup' => 'User Signup',
                                'job_completion' => 'Job Completion',
                                'payment' => 'Payment Received',
                            ])
                            ->default('job_completion'),
                    ])->columns(3),

                Section::make('Terms & Conditions')
                    ->schema([
                        Textarea::make('terms_conditions')
                            ->rows(5),
                    ])->collapsed(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                IconColumn::make('active')
                    ->boolean(),
                TextColumn::make('reward_amount')
                    ->money('usd')
                    ->sortable(),
                TextColumn::make('reward_type')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'gift_card' => 'success',
                        'cash' => 'info',
                        'credit' => 'warning',
                        default => 'gray',
                    }),
                TextColumn::make('referrers_count')
                    ->counts('referrers')
                    ->label('Referrers'),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('active'),
            ])
            ->actions([
                \Filament\Actions\EditAction::make(),
            ])
            ->bulkActions([
                \Filament\Actions\BulkActionGroup::make([
                    \Filament\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListReferralCampaigns::route('/'),
            'create' => Pages\CreateReferralCampaign::route('/create'),
            'edit' => Pages\EditReferralCampaign::route('/{record}/edit'),
        ];
    }
}
