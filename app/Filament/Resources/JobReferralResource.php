<?php

namespace App\Filament\Resources;

use App\Filament\Resources\JobReferralResource\Pages;
use App\Models\JobReferral;
use App\Services\JobReferralService;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class JobReferralResource extends Resource
{
    protected static ?string $model = JobReferral::class;

    protected static ?string $slug = 'job-referrals';

    protected static ?string $modelLabel = 'Job Referral';

    protected static ?string $pluralModelLabel = 'Job Referrals';

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-user-group';

    protected static string|\BackedEnum|null $activeNavigationIcon = 'heroicon-s-user-group';

    protected static ?string $recordTitleAttribute = 'referred_name';

    protected static string|\UnitEnum|null $navigationGroup = 'Referrals';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Referral Details')
                    ->schema([
                        TextInput::make('referred_name')
                            ->label('Referred Person')
                            ->disabled(),
                        TextInput::make('referred_phone')
                            ->label('Phone')
                            ->disabled(),
                        TextInput::make('referred_email')
                            ->label('Email')
                            ->disabled(),
                    ])->columns(3),

                Section::make('Assignment')
                    ->schema([
                        Select::make('business_id')
                            ->label('Business')
                            ->relationship('business', 'name')
                            ->disabled(),
                        Select::make('job_type_id')
                            ->label('Job Type')
                            ->relationship('jobType', 'name')
                            ->disabled(),
                        Select::make('user_id')
                            ->label('Submitted By')
                            ->relationship('user', 'name')
                            ->disabled(),
                    ])->columns(3),

                Section::make('Status & Reward')
                    ->schema([
                        Select::make('status')
                            ->options(JobReferral::getStatuses())
                            ->required(),
                        TextInput::make('reward_amount')
                            ->label('Reward Amount')
                            ->prefix('$')
                            ->numeric()
                            ->disabled(),
                        Select::make('reward_status')
                            ->options(JobReferral::getRewardStatuses())
                            ->placeholder('Not set'),
                        TextInput::make('reward_reference')
                            ->label('Reward Reference')
                            ->disabled(),
                    ])->columns(2),

                Section::make('Notes')
                    ->schema([
                        Textarea::make('admin_notes')
                            ->label('Admin Notes')
                            ->rows(3),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('referred_name')
                    ->label('Referred Person')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('user.name')
                    ->label('Submitted By')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('business.name')
                    ->label('Business')
                    ->sortable(),
                TextColumn::make('jobType.name')
                    ->label('Job Type')
                    ->sortable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'gray',
                        'contacted' => 'info',
                        'hired' => 'warning',
                        'completed' => 'success',
                        'rejected' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('reward_amount')
                    ->label('Reward')
                    ->money('USD')
                    ->sortable(),
                TextColumn::make('reward_status')
                    ->label('Paid')
                    ->badge()
                    ->color(fn (?string $state): string => match ($state) {
                        'sent' => 'success',
                        'failed' => 'danger',
                        'pending' => 'warning',
                        default => 'gray',
                    }),
                TextColumn::make('created_at')
                    ->label('Submitted')
                    ->dateTime('M j, Y')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('status')
                    ->options(JobReferral::getStatuses()),
                SelectFilter::make('business')
                    ->relationship('business', 'name'),
                SelectFilter::make('reward_status')
                    ->options(JobReferral::getRewardStatuses()),
            ])
            ->recordActions([
                Action::make('mark_contacted')
                    ->label('Contacted')
                    ->icon('heroicon-o-phone')
                    ->color('info')
                    ->visible(fn (JobReferral $record) => $record->status === 'pending')
                    ->requiresConfirmation()
                    ->action(fn (JobReferral $record) => $record->markAsContacted()),

                Action::make('mark_hired')
                    ->label('Hired')
                    ->icon('heroicon-o-check-badge')
                    ->color('warning')
                    ->visible(fn (JobReferral $record) => $record->status === 'contacted')
                    ->requiresConfirmation()
                    ->action(fn (JobReferral $record) => $record->markAsHired()),

                Action::make('mark_completed')
                    ->label('Complete')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn (JobReferral $record) => $record->status === 'hired')
                    ->requiresConfirmation()
                    ->action(fn (JobReferral $record) => $record->markAsCompleted()),

                Action::make('send_reward')
                    ->label('Send Reward')
                    ->icon('heroicon-o-gift')
                    ->color('success')
                    ->visible(fn (JobReferral $record) => $record->isRewardable())
                    ->requiresConfirmation()
                    ->modalHeading('Send Reward')
                    ->modalDescription(fn (JobReferral $record) => "Send {$record->formatted_reward} gift card to {$record->user->name} ({$record->user->email})?")
                    ->action(function (JobReferral $record) {
                        $service = new JobReferralService();
                        $result = $service->sendReward($record);

                        if ($result['success']) {
                            Notification::make()
                                ->title('Reward Sent!')
                                ->body("Order #{$result['order_id']}")
                                ->success()
                                ->send();
                        } else {
                            Notification::make()
                                ->title('Failed to Send Reward')
                                ->body($result['error'])
                                ->danger()
                                ->send();
                        }
                    }),

                Action::make('reject')
                    ->label('Reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn (JobReferral $record) => !in_array($record->status, ['completed', 'rejected']))
                    ->requiresConfirmation()
                    ->action(fn (JobReferral $record) => $record->markAsRejected()),

                ViewAction::make()
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
            'index' => Pages\ListJobReferrals::route('/'),
            'view' => Pages\ViewJobReferral::route('/{record}'),
            'edit' => Pages\EditJobReferral::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', 'pending')->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }
}
