<?php

namespace App\Filament\Resources;

use Filament\Schemas\Schema;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Tables\Columns\Layout\Stack;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\Layout\Split;
use Filament\Tables\Filters\SelectFilter;
use Filament\Actions\Action;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use App\Filament\Resources\PhotoResource\Pages\ListPhotos;
use App\Filament\Resources\PhotoResource\Pages;
use App\Models\Photo;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PhotoResource extends Resource
{
    protected static ?string $model = Photo::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-photo';

    protected static string | \BackedEnum | null $activeNavigationIcon = 'heroicon-s-photo';

    protected static ?string $recordTitleAttribute = 'name';

    protected static string | \UnitEnum | null $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 4;

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
                        FileUpload::make('path')
                            ->label('Image')
                            ->image()
                            ->required()
                            ->disk('public')
                            ->directory('photos')
                            ->imageEditor()
                            ->columnSpanFull(),
                        TextInput::make('name')
                            ->maxLength(255)
                            ->helperText('Optional name for the photo'),
                        TextInput::make('alt')
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
                Stack::make([
                    ImageColumn::make('path')
                        ->disk('public')
                        ->height(200)
                        ->width('100%')
                        ->extraImgAttributes(['class' => 'rounded-lg object-cover w-full']),
                    Stack::make([
                        TextColumn::make('name')
                            ->weight('medium')
                            ->placeholder('Untitled')
                            ->searchable(),
                        Split::make([
                            ImageColumn::make('business.avatar')
                                ->disk('public')
                                ->circular()
                                ->size(20)
                                ->defaultImageUrl(fn ($record) => $record->business ? 'https://ui-avatars.com/api/?name='.urlencode($record->business->name).'&background=f4f4f5&color=71717a&size=20' : null)
                                ->grow(false),
                            TextColumn::make('business.name')
                                ->size('sm')
                                ->color('gray')
                                ->searchable(),
                        ]),
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
                SelectFilter::make('business')
                    ->relationship('business', 'name')
                    ->preload()
                    ->multiple()
                    ->placeholder('All businesses'),
            ])
            ->recordActions([
                Action::make('view')
                    ->icon('heroicon-o-eye')
                    ->iconButton()
                    ->color('gray')
                    ->url(fn (Photo $record) => $record->url)
                    ->openUrlInNewTab(),
                EditAction::make()
                    ->iconButton()
                    ->modalWidth('md')
                    ->schema([
                        Select::make('business_id')
                            ->label('Business')
                            ->relationship('business', 'name')
                            ->required()
                            ->searchable()
                            ->preload(),
                        TextInput::make('name')
                            ->maxLength(255),
                        TextInput::make('alt')
                            ->label('Alt Text')
                            ->maxLength(255),
                    ]),
                DeleteAction::make()
                    ->iconButton(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
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
            'index' => ListPhotos::route('/'),
        ];
    }
}
