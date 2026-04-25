<?php

namespace App\Filament\Resources\SubmissionResource\Pages;

use Filament\Actions\DeleteAction;
use App\Filament\Resources\SubmissionResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSubmission extends EditRecord
{
    protected static string $resource = SubmissionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
