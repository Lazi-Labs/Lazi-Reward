<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PhotoResource\Pages;
use App\Models\Photo;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PhotoResource extends Resource
{
    protected static ?string $model = Photo::class;

    protected static ?string $navigationIcon = 'heroicon-o-photo';

    protected static ?string $activeNavigationIcon = 'heroicon-s-photo';

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?string $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 4;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make()
                    ->schema([
                        Forms\Components\Select::make('business_id')
                            ->label('Business')
                            ->relationship('business', 'name')
                            ->required()
                            ->searchable()
                            ->preload(),
                        Forms\Components\FileUpload::make('path')
                            ->label('Image')
                            ->image()
                            ->required()
                            ->disk('public')
                            ->directory('photos')
                            ->imageEditor()
                            ->columnSpanFull(),
                        Forms\Components\TextInput::make('name')
                            ->maxLength(255)
                            ->helperText('Optional name for the photo'),
                        Forms\Components\TextInput::make('alt')
                            ->label('Alt Text')
                            ->maxLength(255)
                            ->helperText('Description for accessibility'),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\Layout\Stack::make([
                    Tables\Columns\ImageColumn::make('path')
                        ->disk('public')
                        ->height(200)
                        ->width('100%')
                        ->extraImgAttributes(['class' => 'rounded-lg object-cover w-full']),
                    Tables\Columns\Layout\Stack::make([
                        Tables\Columns\TextColumn::make('name')
                            ->weight('medium')
                            ->placeholder('Untitled')
                            ->searchable(),
                        Tables\Columns\TextColumn::make('business.name')
                            ->size('sm')
                            ->color('gray')
                            ->icon('heroicon-m-building-storefront')
                            ->searchable(),
                    ])->space(1),
                ])->space(3),
            ])
            ->contentGrid([
                'md' => 2,
                'lg' => 3,
                'xl' => 4,
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('business')
                    ->relationship('business', 'name')
                    ->preload()
                    ->multiple()
                    ->placeholder('All businesses'),
            ])
            ->actions([
                Tables\Actions\Action::make('view')
                    ->icon('heroicon-o-eye')
                    ->iconButton()
                    ->color('gray')
                    ->url(fn (Photo $record) => $record->url)
                    ->openUrlInNewTab(),
                Tables\Actions\EditAction::make()
                    ->iconButton()
                    ->modalWidth('md')
                    ->form([
                        Forms\Components\Select::make('business_id')
                            ->label('Business')
                            ->relationship('business', 'name')
                            ->required()
                            ->searchable()
                            ->preload(),
                        Forms\Components\TextInput::make('name')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('alt')
                            ->label('Alt Text')
                            ->maxLength(255),
                    ]),
                Tables\Actions\DeleteAction::make()
                    ->iconButton(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->recordUrl(null)
            ->paginated([12, 24, 48]);
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
            'index' => Pages\ListPhotos::route('/'),
        ];
    }
}
