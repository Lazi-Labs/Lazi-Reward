<?php

namespace App\Observers;

use App\Models\Submission;
use App\Models\User;
use App\Notifications\NewSubmissionNotification;
use App\Notifications\ScreenshotUploadedNotification;

class SubmissionObserver
{
    public function created(Submission $submission): void
    {
        // Notify all admin users about the new submission
        $users = User::all();

        foreach ($users as $user) {
            $user->notify(new NewSubmissionNotification($submission));
        }
    }

    public function updated(Submission $submission): void
    {
        // Check if screenshot was just uploaded
        if ($submission->isDirty('screenshot_path') && $submission->screenshot_path) {
            $users = User::all();

            foreach ($users as $user) {
                $user->notify(new ScreenshotUploadedNotification($submission));
            }
        }
    }
}
