<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GiftCardProductResource\Pages;
use App\Models\GiftCardProduct;
use App\Services\TremendousService;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Actions\BulkAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Collection;

class GiftCardProductResource extends Resource
{
    protected static ?string $model = GiftCardProduct::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-credit-card';

    protected static string|\BackedEnum|null $activeNavigationIcon = 'heroicon-s-credit-card';

    protected static ?string $recordTitleAttribute = 'name';

    protected static string|\UnitEnum|null $navigationGroup = 'Settings';

    protected static ?string $navigationLabel = 'Gift Card Catalog';

    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Product Information')
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('tremendous_product_id')
                            ->label('Tremendous Product ID')
                            ->disabled()
                            ->dehydrated(false),
                        Textarea::make('description')
                            ->rows(3)
                            ->maxLength(1000),
                        TextInput::make('image_url')
                            ->label('Image URL')
                            ->url()
                            ->maxLength(500),
                        TextInput::make('category')
                            ->maxLength(100),
                    ])->columns(2),

                Section::make('Value Range')
                    ->schema([
                        TextInput::make('min_value')
                            ->label('Minimum Value')
                            ->numeric()
                            ->prefix('$')
                            ->default(0),
                        TextInput::make('max_value')
                            ->label('Maximum Value')
                            ->numeric()
                            ->prefix('$')
                            ->default(0),
                        TextInput::make('currency_code')
                            ->label('Currency')
                            ->default('USD')
                            ->maxLength(3),
                    ])->columns(3),

                Section::make('Display Settings')
                    ->schema([
                        TextInput::make('sort_order')
                            ->numeric()
                            ->default(0),
                        Toggle::make('is_active')
                            ->label('Show in Catalog')
                            ->default(true),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('image_url')
                    ->label('Image')
                    ->circular()
                    ->defaultImageUrl(fn() => 'https://ui-avatars.com/api/?name=GC&background=random')
                    ->size(40),
                TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('tremendous_product_id')
                    ->label('Product ID')
                    ->badge()
                    ->color('gray')
                    ->copyable()
                    ->toggleable(),
                TextColumn::make('category')
                    ->badge()
                    ->color('info')
                    ->toggleable(),
                TextColumn::make('min_value')
                    ->label('Min')
                    ->money('USD')
                    ->sortable(),
                TextColumn::make('max_value')
                    ->label('Max')
                    ->money('USD')
                    ->sortable(),
                IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),
                TextColumn::make('sort_order')
                    ->numeric()
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('last_synced_at')
                    ->label('Last Sync')
                    ->dateTime('M j, Y g:i A')
                    ->sortable()
                    ->toggleable(),
            ])
            ->defaultSort('sort_order')
            ->reorderable('sort_order')
            ->filters([
                TernaryFilter::make('is_active')
                    ->label('Active'),
            ])
            ->recordActions([
                EditAction::make()
                    ->iconButton()
                    ->color('gray'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    BulkAction::make('activate')
                        ->label('Activate Selected')
                        ->icon('heroicon-o-check-circle')
                        ->color('success')
                        ->action(fn(Collection $records) => $records->each->update(['is_active' => true]))
                        ->deselectRecordsAfterCompletion(),
                    BulkAction::make('deactivate')
                        ->label('Deactivate Selected')
                        ->icon('heroicon-o-x-circle')
                        ->color('danger')
                        ->action(fn(Collection $records) => $records->each->update(['is_active' => false]))
                        ->deselectRecordsAfterCompletion(),
                    DeleteBulkAction::make(),
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
            'index' => Pages\ListGiftCardProducts::route('/'),
            'create' => Pages\CreateGiftCardProduct::route('/create'),
            'edit' => Pages\EditGiftCardProduct::route('/{record}/edit'),
        ];
    }
}
