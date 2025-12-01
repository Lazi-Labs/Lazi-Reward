<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SubmissionResource\Pages;
use App\Models\Submission;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SubmissionResource extends Resource
{
    protected static ?string $model = Submission::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $activeNavigationIcon = 'heroicon-s-document-text';

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?int $navigationSort = 0;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Customer Information')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('email')
                            ->email()
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('phone')
                            ->tel()
                            ->maxLength(255),
                    ])->columns(3),

                Forms\Components\Section::make('Submission Details')
                    ->schema([
                        Forms\Components\Select::make('business_location_id')
                            ->label('Business')
                            ->relationship('businessLocation', 'name')
                            ->searchable()
                            ->preload(),
                        Forms\Components\Select::make('gift_card_id')
                            ->relationship('giftCard', 'name')
                            ->searchable()
                            ->preload(),
                        Forms\Components\Select::make('status')
                            ->options([
                                'pending' => 'Pending',
                                'waiting_for_screenshot' => 'Waiting for Screenshot',
                                'completed' => 'Completed',
                            ])
                            ->required()
                            ->default('pending'),
                    ])->columns(3),

                Forms\Components\Section::make('Uploaded Photos')
                    ->schema([
                        Forms\Components\ViewField::make('service_photo_path')
                            ->label('Service Photo')
                            ->view('filament.forms.components.image-display'),
                        Forms\Components\ViewField::make('screenshot_path')
                            ->label('Review Screenshot')
                            ->view('filament.forms.components.image-display'),
                    ])->columns(2)
                    ->visibleOn(['edit', 'view']),

                Forms\Components\Section::make('System Information')
                    ->schema([
                        Forms\Components\TextInput::make('token')
                            ->disabled()
                            ->dehydrated(false),
                        Forms\Components\Placeholder::make('upload_link')
                            ->label('Upload Link')
                            ->content(fn ($record) => $record
                                ? route('upload', ['token' => $record->token])
                                : '-'),
                    ])->columns(2)
                    ->visibleOn(['edit', 'view'])
                    ->collapsed(),
            ]);
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Customer Information')
                    ->schema([
                        Infolists\Components\TextEntry::make('name'),
                        Infolists\Components\TextEntry::make('email')
                            ->copyable(),
                        Infolists\Components\TextEntry::make('phone'),
                    ])->columns(3),

                Infolists\Components\Section::make('Submission Details')
                    ->schema([
                        Infolists\Components\TextEntry::make('businessLocation.name')
                            ->label('Business')
                            ->badge(),
                        Infolists\Components\TextEntry::make('giftCard.name')
                            ->label('Gift Card'),
                        Infolists\Components\TextEntry::make('status')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'pending' => 'gray',
                                'waiting_for_screenshot' => 'warning',
                                'completed' => 'success',
                                default => 'gray',
                            }),
                    ])->columns(3),

                Infolists\Components\Section::make('Uploaded Photos')
                    ->schema([
                        Infolists\Components\ImageEntry::make('service_photo_path')
                            ->label('Service Photo')
                            ->disk('public')
                            ->height(300)
                            ->extraImgAttributes(['class' => 'rounded-lg']),
                        Infolists\Components\ImageEntry::make('screenshot_path')
                            ->label('Review Screenshot')
                            ->disk('public')
                            ->height(300)
                            ->extraImgAttributes(['class' => 'rounded-lg']),
                    ])->columns(2),

                Infolists\Components\Section::make('System Information')
                    ->schema([
                        Infolists\Components\TextEntry::make('token')
                            ->copyable(),
                        Infolists\Components\TextEntry::make('created_at')
                            ->dateTime(),
                        Infolists\Components\TextEntry::make('updated_at')
                            ->dateTime(),
                    ])->columns(3)
                    ->collapsed(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('email')
                    ->searchable()
                    ->copyable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('phone')
                    ->searchable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('businessLocation.name')
                    ->label('Business')
                    ->sortable()
                    ->badge(),
                Tables\Columns\TextColumn::make('giftCard.name')
                    ->label('Gift Card')
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'gray',
                        'waiting_for_screenshot' => 'warning',
                        'completed' => 'success',
                        default => 'gray',
                    }),
                Tables\Columns\ImageColumn::make('service_photo_path')
                    ->label('Photo')
                    ->disk('public')
                    ->circular()
                    ->defaultImageUrl(fn () => null),
                Tables\Columns\ImageColumn::make('screenshot_path')
                    ->label('Screenshot')
                    ->disk('public')
                    ->circular()
                    ->defaultImageUrl(fn () => null),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'waiting_for_screenshot' => 'Waiting for Screenshot',
                        'completed' => 'Completed',
                    ]),
                Tables\Filters\SelectFilter::make('business_location_id')
                    ->relationship('businessLocation', 'name')
                    ->label('Business')
                    ->preload(),
                Tables\Filters\SelectFilter::make('gift_card_id')
                    ->relationship('giftCard', 'name')
                    ->label('Gift Card')
                    ->preload(),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()
                    ->iconButton()
                    ->color('gray'),
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
            'index' => Pages\ListSubmissions::route('/'),
            'create' => Pages\CreateSubmission::route('/create'),
            'view' => Pages\ViewSubmission::route('/{record}'),
            'edit' => Pages\EditSubmission::route('/{record}/edit'),
        ];
    }
}
