<?php

namespace App\Livewire;

use App\Models\Submission;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Livewire\Component;

class ReviewWizard extends Component
{
    public $step = 1;
    public $location = '';
    public $name = '';
    public $email = '';
    public $phone = '';
    public $giftCard = '';

    public function selectLocation($key)
    {
        \Log::info("Select Location called with: " . $key);
        $this->location = $key;
        $this->step = 2;
    }

    public function back()
    {
        $this->step = 1;
        $this->location = '';
    }

    public function submit()
    {
        $this->validate([
            'name' => 'required',
            'email' => 'required|email',
            'phone' => 'required',
            'giftCard' => 'required',
        ]);

        $token = 'review_' . Str::random(16);

        $submission = Submission::create([
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'business_key' => $this->location,
            'gift_card_choice' => $this->giftCard,
            'token' => $token,
            'status' => 'waiting_for_screenshot',
        ]);

        // Send to n8n
        try {
            Http::post(config('business.webhooks.submission'), [
                'id' => $submission->id,
                'name' => $this->name,
                'email' => $this->email,
                'phone' => $this->phone,
                'business_key' => $this->location,
                'gift_card_choice' => $this->giftCard,
                'token' => $token,
                'upload_url' => route('upload', ['token' => $token]),
            ]);
        } catch (\Exception $e) {
            // Log error but continue
            report($e);
        }

        $gmbLink = config("business.locations.{$this->location}.gmb");
        $uploadUrl = route('upload', ['token' => $token]);

        // Open GMB in new tab and redirect current tab to upload page
        $this->dispatch('open-gmb-link', url: $gmbLink, uploadUrl: $uploadUrl);
    }

    public function render()
    {
        \Log::info("Render called. Step: {$this->step}, Location: {$this->location}");
        return view('livewire.review-wizard');
    }
}
