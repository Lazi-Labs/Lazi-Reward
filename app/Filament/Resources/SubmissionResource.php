<?php

namespace App\Filament\Resources;

use Filament\Schemas\Schema;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\ViewField;
use Filament\Forms\Components\Placeholder;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Components\ImageEntry;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Actions\ViewAction;
use Filament\Actions\EditAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use App\Filament\Resources\SubmissionResource\Pages\ListSubmissions;
use App\Filament\Resources\SubmissionResource\Pages\CreateSubmission;
use App\Filament\Resources\SubmissionResource\Pages\ViewSubmission;
use App\Filament\Resources\SubmissionResource\Pages\EditSubmission;
use App\Filament\Resources\BusinessResource;
use App\Filament\Resources\SubmissionResource\Pages;
use App\Models\Submission;
use Filament\Forms;
use Filament\Infolists;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SubmissionResource extends Resource
{
    protected static ?string $model = Submission::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-document-text';

    protected static string | \BackedEnum | null $activeNavigationIcon = 'heroicon-s-document-text';

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?int $navigationSort = 0;

    public static function getNavigationBadge(): ?string
    {
        $count = static::getModel()::where('status', 'pending')->count();

        return $count > 0 ? (string) $count : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Customer Information')
                    ->schema([
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('email')
                            ->email()
                            ->required()
                            ->maxLength(255),
                        TextInput::make('phone')
                            ->tel()
                            ->maxLength(255),
                    ])->columns(3),

                Section::make('Submission Details')
                    ->schema([
                        Select::make('business_id')
                            ->label('Business')
                            ->relationship('business', 'name')
                            ->searchable()
                            ->preload(),
                        Select::make('gift_card_id')
                            ->relationship('giftCard', 'name')
                            ->searchable()
                            ->preload(),
                        Select::make('status')
                            ->options([
                                'pending' => 'Pending',
                                'waiting_for_screenshot' => 'Waiting for Screenshot',
                                'completed' => 'Completed',
                            ])
                            ->required()
                            ->default('pending'),
                    ])->columns(3),

                Section::make('Uploaded Photos')
                    ->schema([
                        ViewField::make('service_photo_path')
                            ->label('Service Photo')
                            ->view('filament.forms.components.image-display'),
                        ViewField::make('screenshot_path')
                            ->label('Review Screenshot')
                            ->view('filament.forms.components.image-display'),
                    ])->columns(2)
                    ->visibleOn(['edit', 'view']),

                Section::make('System Information')
                    ->schema([
                        TextInput::make('token')
                            ->disabled()
                            ->dehydrated(false),
                        Placeholder::make('upload_link')
                            ->label('Upload Link')
                            ->content(fn ($record) => $record
                                ? route('upload', ['token' => $record->token])
                                : '-'),
                    ])->columns(2)
                    ->visibleOn(['edit', 'view'])
                    ->collapsed(),
            ]);
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Customer Information')
                    ->schema([
                        TextEntry::make('name'),
                        TextEntry::make('email')
                            ->copyable(),
                        TextEntry::make('phone'),
                    ])->columns(3),

                Section::make('Submission Details')
                    ->schema([
                        TextEntry::make('business.name')
                            ->label('Business')
                            ->badge(),
                        TextEntry::make('giftCard.name')
                            ->label('Gift Card'),
                        TextEntry::make('status')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'pending' => 'gray',
                                'waiting_for_screenshot' => 'warning',
                                'completed' => 'success',
                                default => 'gray',
                            }),
                    ])->columns(3),

                Section::make('Uploaded Photos')
                    ->schema([
                        ImageEntry::make('service_photo_path')
                            ->label('Service Photo')
                            ->disk('public')
                            ->height(300)
                            ->extraImgAttributes(['class' => 'rounded-lg']),
                        ImageEntry::make('screenshot_path')
                            ->label('Review Screenshot')
                            ->disk('public')
                            ->height(300)
                            ->extraImgAttributes(['class' => 'rounded-lg']),
                    ])->columns(2),

                Section::make('System Information')
                    ->schema([
                        TextEntry::make('token')
                            ->copyable(),
                        TextEntry::make('created_at')
                            ->dateTime(),
                        TextEntry::make('updated_at')
                            ->dateTime(),
                    ])->columns(3)
                    ->collapsed(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('email')
                    ->searchable()
                    ->copyable()
                    ->toggleable(),
                TextColumn::make('phone')
                    ->searchable()
                    ->toggleable(),
                ImageColumn::make('business.avatar')
                    ->label('Business')
                    ->disk('public')
                    ->circular()
                    ->defaultImageUrl(fn ($record) => $record->business ? 'https://ui-avatars.com/api/?name='.urlencode($record->business->name).'&background=f4f4f5&color=71717a' : null)
                    ->tooltip(fn ($record) => $record->business?->name)
                    ->alignCenter()
                    ->url(fn ($record) => $record->business ? BusinessResource::getUrl('edit', ['record' => $record->business]) : null),
                TextColumn::make('giftCard.name')
                    ->label('Gift Card')
                    ->sortable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'gray',
                        'waiting_for_screenshot' => 'warning',
                        'completed' => 'success',
                        default => 'gray',
                    }),
                ImageColumn::make('service_photo_path')
                    ->label('Photo')
                    ->disk('public')
                    ->circular()
                    ->defaultImageUrl(fn () => null),
                ImageColumn::make('screenshot_path')
                    ->label('Screenshot')
                    ->disk('public')
                    ->circular()
                    ->defaultImageUrl(fn () => null),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'waiting_for_screenshot' => 'Waiting for Screenshot',
                        'completed' => 'Completed',
                    ]),
                SelectFilter::make('business_id')
                    ->relationship('business', 'name')
                    ->label('Business')
                    ->preload(),
                SelectFilter::make('gift_card_id')
                    ->relationship('giftCard', 'name')
                    ->label('Gift Card')
                    ->preload(),
            ])
            ->recordActions([
                ViewAction::make()
                    ->iconButton()
                    ->color('gray')
                    ->tooltip('View'),
                EditAction::make()
                    ->iconButton()
                    ->color('gray')
                    ->tooltip('Edit'),
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
            'index' => ListSubmissions::route('/'),
            'create' => CreateSubmission::route('/create'),
            'view' => ViewSubmission::route('/{record}'),
            'edit' => EditSubmission::route('/{record}/edit'),
        ];
    }
}
