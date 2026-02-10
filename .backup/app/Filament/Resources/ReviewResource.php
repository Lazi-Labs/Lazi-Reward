<?php

namespace App\Filament\Resources;

use Filament\Schemas\Schema;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Actions\EditAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use App\Filament\Resources\ReviewResource\Pages\ListReviews;
use App\Filament\Resources\ReviewResource\Pages\CreateReview;
use App\Filament\Resources\ReviewResource\Pages\EditReview;
use App\Filament\Resources\BusinessResource;
use App\Filament\Resources\ReviewResource\Pages;
use App\Models\Review;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ReviewResource extends Resource
{
    protected static ?string $model = Review::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-chat-bubble-left-right';

    protected static string | \BackedEnum | null $activeNavigationIcon = 'heroicon-s-chat-bubble-left-right';

    protected static ?string $recordTitleAttribute = 'id';

    protected static string | \UnitEnum | null $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make()
                    ->schema([
                        Select::make('business_id')
                            ->label('Business')
                            ->relationship('business', 'name')
                            ->required()
                            ->searchable()
                            ->preload(),
                        Textarea::make('content')
                            ->required()
                            ->rows(6)
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('business.avatar')
                    ->label('Business')
                    ->disk('public')
                    ->circular()
                    ->defaultImageUrl(fn ($record) => $record->business ? 'https://ui-avatars.com/api/?name='.urlencode($record->business->name).'&background=f4f4f5&color=71717a' : null)
                    ->tooltip(fn ($record) => $record->business?->name)
                    ->alignCenter()
                    ->url(fn ($record) => $record->business ? BusinessResource::getUrl('edit', ['record' => $record->business]) : null),
                TextColumn::make('content')
                    ->searchable()
                    ->limit(50)
                    ->wrap(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('business')
                    ->relationship('business', 'name'),
            ])
            ->recordActions([
                EditAction::make()
                    ->iconButton()
                    ->color('gray'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListReviews::route('/'),
            'create' => CreateReview::route('/create'),
            'edit' => EditReview::route('/{record}/edit'),
        ];
    }
}
