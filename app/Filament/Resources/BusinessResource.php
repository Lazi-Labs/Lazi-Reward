<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BusinessResource\Pages;
use App\Models\Business;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class BusinessResource extends Resource
{
    protected static ?string $model = Business::class;

    protected static ?string $slug = 'businesses';

    protected static ?string $modelLabel = 'Business';

    protected static ?string $pluralModelLabel = 'Businesses';

    protected static ?string $navigationIcon = 'heroicon-o-building-storefront';

    protected static ?string $activeNavigationIcon = 'heroicon-s-building-storefront';

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?string $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Business Details')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('key')
                            ->required()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true)
                            ->helperText('Unique identifier (e.g., "electric", "pools")'),
                        Forms\Components\TextInput::make('description')
                            ->maxLength(255)
                            ->helperText('Short description shown to users'),
                        Forms\Components\TextInput::make('gmb_link')
                            ->label('Google My Business Link')
                            ->required()
                            ->url()
                            ->maxLength(255),
                    ])->columns(2),

                Forms\Components\Section::make('Review Template')
                    ->schema([
                        Forms\Components\Textarea::make('review_template')
                            ->required()
                            ->rows(4)
                            ->helperText('Pre-written review text for customers to copy'),
                    ]),

                Forms\Components\Section::make('Display Settings')
                    ->schema([
                        Forms\Components\FileUpload::make('avatar')
                            ->label('Avatar')
                            ->image()
                            ->disk('public')
                            ->directory('business-avatars')
                            ->imageEditor()
                            ->circleCropper()
                            ->helperText('Business logo or avatar image'),
                        Forms\Components\TextInput::make('icon')
                            ->required()
                            ->maxLength(255)
                            ->default('building-storefront')
                            ->helperText('Heroicon name (e.g., "bolt", "lifebuoy")'),
                        Forms\Components\TextInput::make('sort_order')
                            ->required()
                            ->numeric()
                            ->default(0),
                        Forms\Components\Toggle::make('is_active')
                            ->label('Active')
                            ->default(true),
                    ])->columns(4),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('avatar')
                    ->disk('public')
                    ->circular()
                    ->defaultImageUrl(fn (Business $record) => 'https://ui-avatars.com/api/?name='.urlencode($record->name).'&background=f4f4f5&color=71717a'),
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('description')
                    ->searchable()
                    ->limit(30),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),
                Tables\Columns\TextColumn::make('sort_order')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('submissions_count')
                    ->counts('submissions')
                    ->label('Submissions'),
            ])
            ->defaultSort('sort_order')
            ->reorderable('sort_order')
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Active'),
            ])
            ->actions([
                Tables\Actions\EditAction::make()
                    ->iconButton()
                    ->color('gray'),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
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
            'index' => Pages\ListBusinesses::route('/'),
            'create' => Pages\CreateBusiness::route('/create'),
            'edit' => Pages\EditBusiness::route('/{record}/edit'),
        ];
    }
}
