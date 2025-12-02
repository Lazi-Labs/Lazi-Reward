<?php

namespace App\Notifications;

use App\Models\Submission;
use Filament\Notifications\Notification as FilamentNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewSubmissionNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Submission $submission
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return FilamentNotification::make()
            ->title('New Submission')
            ->icon('heroicon-o-document-text')
            ->body("{$this->submission->name} submitted a review for {$this->submission->business->name}")
            ->actions([
                \Filament\Notifications\Actions\Action::make('view')
                    ->label('View')
                    ->url(route('filament.admin.resources.submissions.view', $this->submission))
                    ->markAsRead(),
            ])
            ->getDatabaseMessage();
    }
}
