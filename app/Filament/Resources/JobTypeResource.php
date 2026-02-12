<?php

namespace App\Filament\Resources;

use App\Filament\Resources\JobTypeResource\Pages;
use App\Models\Business;
use App\Models\JobType;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class JobTypeResource extends Resource
{
    protected static ?string $model = JobType::class;

    protected static ?string $slug = 'job-types';

    protected static ?string $modelLabel = 'Job Type';

    protected static ?string $pluralModelLabel = 'Job Types';

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-briefcase';

    protected static string|\BackedEnum|null $activeNavigationIcon = 'heroicon-s-briefcase';

    protected static ?string $recordTitleAttribute = 'name';

    protected static string|\UnitEnum|null $navigationGroup = 'Settings';

    protected static ?int $navigationSort = 2;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Job Type Details')
                    ->schema([
                        Select::make('business_id')
                            ->label('Business')
                            ->relationship('business', 'name')
                            ->required()
                            ->searchable()
                            ->preload(),
                        TextInput::make('name')
                            ->required()
                            ->maxLength(255)
                            ->helperText('e.g., "Pool Installation", "Panel Upgrade"'),
                        TextInput::make('slug')
                            ->maxLength(255)
                            ->unique(ignoreRecord: true)
                            ->helperText('Auto-generated if left empty'),
                        Textarea::make('description')
                            ->rows(2)
                            ->maxLength(500)
                            ->helperText('Brief description of this job type'),
                    ])->columns(2),

                Section::make('Reward Settings')
                    ->schema([
                        TextInput::make('reward_amount')
                            ->label('Reward Amount')
                            ->required()
                            ->numeric()
                            ->prefix('$')
                            ->minValue(0)
                            ->maxValue(10000)
                            ->default(100.00)
                            ->helperText('Amount paid to referrer when job is completed'),
                    ]),

                Section::make('Display Settings')
                    ->schema([
                        TextInput::make('sort_order')
                            ->required()
                            ->numeric()
                            ->default(0),
                        Toggle::make('is_active')
                            ->label('Active')
                            ->default(true)
                            ->helperText('Inactive job types will not appear in the referral form'),
                    ])->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('business.name')
                    ->label('Business')
                    ->sortable()
                    ->searchable(),
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('reward_amount')
                    ->label('Reward')
                    ->money('USD')
                    ->sortable(),
                TextColumn::make('job_referrals_count')
                    ->counts('jobReferrals')
                    ->label('Referrals'),
                IconColumn::make('is_active')
                    ->boolean()
                    ->label('Active'),
                TextColumn::make('sort_order')
                    ->numeric()
                    ->sortable(),
            ])
            ->defaultSort('business.name')
            ->reorderable('sort_order')
            ->filters([
                SelectFilter::make('business')
                    ->relationship('business', 'name'),
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
            'index' => Pages\ListJobTypes::route('/'),
            'create' => Pages\CreateJobType::route('/create'),
            'edit' => Pages\EditJobType::route('/{record}/edit'),
        ];
    }
}
