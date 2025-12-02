<?php

namespace App\Livewire;

use Exception;
use App\Models\Business;
use App\Models\GiftCard;
use App\Models\Photo;
use App\Models\Submission;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Validate;
use Livewire\Component;

class ReviewWizard extends Component
{
    public $step = 1;

    public $locationId = '';

    public $location = null; // Will hold the Business model

    public $selectedPhoto = null; // Will hold the randomly selected Photo

    #[Validate('required|string|min:2|max:100', message: 'Please enter your full name (2-100 characters).')]
    public $name = '';

    #[Validate('required|email|max:255', message: 'Please enter a valid email address.')]
    public $email = '';

    #[Validate('required|regex:/^\(\d{3}\) \d{3}-\d{4}$/', message: 'Please enter a valid phone number.')]
    public $phone = '';

    #[Validate('required', message: 'Please select a gift card reward.')]
    public $giftCard = '';

    public function selectLocation($id)
    {
        $this->locationId = $id;
        $this->location = Business::find($id);

        // Randomly select an available (unused) photo from the business's photos
        $this->selectedPhoto = Photo::where('business_id', $id)
            ->available()
            ->inRandomOrder()
            ->first();

        $this->step = 2;
    }

    public function back()
    {
        $this->step = 1;
        $this->locationId = '';
        $this->location = null;
        $this->selectedPhoto = null;
    }

    public function updated($property)
    {
        $this->validateOnly($property);
    }

    public function submit()
    {
        // Rate limit: 5 submissions per hour per IP
        $key = 'submission:'.request()->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => "Too many submissions. Please try again in {$seconds} seconds.",
            ]);
        }
        RateLimiter::hit($key, 3600);

        $this->validate();

        $token = 'review_'.Str::random(16);

        // Use the randomly selected photo from the business
        $servicePhotoPath = $this->selectedPhoto?->path;

        // Get the gift card model
        $giftCardModel = GiftCard::find($this->giftCard);

        $submission = Submission::create([
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'business_id' => $this->locationId,
            'gift_card_id' => $this->giftCard,
            'business_key' => $this->location->key,
            'gift_card_choice' => $giftCardModel?->key ?? '',
            'token' => $token,
            'status' => 'waiting_for_screenshot',
            'service_photo_path' => $servicePhotoPath,
        ]);

        // Mark the photo as used so it won't be selected again
        $this->selectedPhoto?->markAsUsed();

        // Send to n8n (if webhook URL is configured)
        $webhookUrl = config('business.webhooks.submission');
        if ($webhookUrl) {
            try {
                Http::post($webhookUrl, [
                    'id' => $submission->id,
                    'name' => $this->name,
                    'email' => $this->email,
                    'phone' => $this->phone,
                    'business_name' => $this->location->name,
                    'business_key' => $this->location->key,
                    'gift_card_name' => $giftCardModel?->name ?? '',
                    'gift_card_choice' => $giftCardModel?->key ?? '',
                    'token' => $token,
                    'upload_url' => route('upload', ['token' => $token]),
                    'service_photo_url' => $servicePhotoPath ? asset('storage/'.$servicePhotoPath) : null,
                ]);
            } catch (Exception $e) {
                // Log error but continue
                report($e);
            }
        }

        $uploadUrl = route('upload', ['token' => $token]);

        // Open GMB in new tab and redirect current tab to upload page
        $this->dispatch('open-gmb-link', url: $this->location->gmb_link, uploadUrl: $uploadUrl);
    }

    public function render()
    {
        return view('livewire.review-wizard', [
            'locations' => Business::active()->ordered()->get(),
            'giftCards' => GiftCard::active()->ordered()->get(),
        ]);
    }
}
