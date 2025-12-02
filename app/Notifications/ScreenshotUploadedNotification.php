<?php

namespace App\Notifications;

use App\Models\Submission;
use Filament\Notifications\Notification as FilamentNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ScreenshotUploadedNotification extends Notification
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
            ->title('Screenshot Uploaded')
            ->icon('heroicon-o-camera')
            ->iconColor('success')
            ->body("{$this->submission->name} uploaded their review screenshot")
            ->actions([
                \Filament\Notifications\Actions\Action::make('view')
                    ->label('Review')
                    ->url(route('filament.admin.resources.submissions.view', $this->submission))
                    ->markAsRead(),
            ])
            ->getDatabaseMessage();
    }
}
