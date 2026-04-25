<?php

namespace App\Filament\Pages;

use App\Models\Business;
use App\Models\Photo;
use App\Models\Review;
use Filament\Forms\Components\Select;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Schema;
use Illuminate\Support\Collection;
use Livewire\Attributes\Url;

class PairReviewsPhotos extends Page implements HasForms
{
    use InteractsWithForms;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-link';

    protected string $view = 'filament.pages.pair-reviews-photos';

    protected static ?string $navigationLabel = 'Pair Reviews & Photos';

    protected static ?string $title = 'Pair Reviews & Photos';

    protected static string | \UnitEnum | null $navigationGroup = 'Content';

    protected static ?int $navigationSort = 0;

    #[Url]
    public ?string $selectedBusinessId = null;

    public ?string $selectedReviewId = null;

    public ?string $selectedPhotoId = null;

    public function mount(): void
    {
        // Default to first business if none selected
        if (!$this->selectedBusinessId) {
            $this->selectedBusinessId = Business::active()->first()?->id;
        }
    }

    public function form(Schema $form): Schema
    {
        return $form
            ->schema([
                Select::make('selectedBusinessId')
                    ->label('Select Business')
                    ->options(Business::active()->pluck('name', 'id'))
                    ->live()
                    ->afterStateUpdated(function () {
                        $this->selectedReviewId = null;
                        $this->selectedPhotoId = null;
                    }),
            ]);
    }

    public function getUnpairedReviews(): Collection
    {
        if (!$this->selectedBusinessId) {
            return collect();
        }

        return Review::where('business_id', $this->selectedBusinessId)
            ->whereNull('photo_id')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getUnpairedPhotos(): Collection
    {
        if (!$this->selectedBusinessId) {
            return collect();
        }

        return Photo::where('business_id', $this->selectedBusinessId)
            ->whereDoesntHave('review')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getPairedItems(): Collection
    {
        if (!$this->selectedBusinessId) {
            return collect();
        }

        return Review::where('business_id', $this->selectedBusinessId)
            ->whereNotNull('photo_id')
            ->with('photo')
            ->orderBy('updated_at', 'desc')
            ->get();
    }

    public function selectReview(string $reviewId): void
    {
        $this->selectedReviewId = $this->selectedReviewId === $reviewId ? null : $reviewId;
        $this->tryPair();
    }

    public function selectPhoto(string $photoId): void
    {
        $this->selectedPhotoId = $this->selectedPhotoId === $photoId ? null : $photoId;
        $this->tryPair();
    }

    protected function tryPair(): void
    {
        if ($this->selectedReviewId && $this->selectedPhotoId) {
            $review = Review::find($this->selectedReviewId);
            $photo = Photo::find($this->selectedPhotoId);

            if ($review && $photo) {
                $review->update(['photo_id' => $photo->id]);

                Notification::make()
                    ->title('Paired successfully!')
                    ->body('Review and photo have been paired.')
                    ->success()
                    ->send();

                $this->selectedReviewId = null;
                $this->selectedPhotoId = null;
            }
        }
    }

    public function unpair(string $reviewId): void
    {
        $review = Review::find($reviewId);
        if ($review) {
            $review->update(['photo_id' => null]);

            Notification::make()
                ->title('Unpaired')
                ->body('Review and photo have been unpaired.')
                ->success()
                ->send();
        }
    }
}
