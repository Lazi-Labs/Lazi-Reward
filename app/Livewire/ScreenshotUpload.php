<?php

namespace App\Livewire;

use App\Models\Submission;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Validate;
use Livewire\Component;
use Livewire\WithFileUploads;

class ScreenshotUpload extends Component
{
    use WithFileUploads;

    public $token;
    public $submission;

    #[Validate('required|image|mimes:jpeg,png,webp|max:10240', message: 'Please upload a screenshot (JPEG, PNG, or WebP, max 10MB).', onUpdate: false)]
    public $photo;

    public $uploaded = false;

    public function mount($token)
    {
        // Validate token format (review_ + 16 alphanumeric chars)
        if (!preg_match('/^review_[a-zA-Z0-9]{16}$/', $token)) {
            abort(404);
        }

        $this->token = $token;
        $this->submission = Submission::where('token', $token)->firstOrFail();

        if ($this->submission->status === 'completed') {
            $this->uploaded = true;
        }
    }

    public function removePhoto()
    {
        $this->photo = null;
        $this->resetValidation('photo');
    }

    public function updatedPhoto()
    {
        $this->validateOnly('photo');
    }

    public function save()
    {
        // Rate limit: 10 uploads per hour per IP
        $key = 'upload:' . request()->ip();
        if (RateLimiter::tooManyAttempts($key, 10)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'photo' => "Too many upload attempts. Please try again in {$seconds} seconds.",
            ]);
        }
        RateLimiter::hit($key, 3600);

        $this->validate();

        $path = $this->photo->store('screenshots', 'public');

        $this->submission->update([
            'screenshot_path' => $path,
            'status' => 'completed',
        ]);

        // Send to n8n
        try {
            Http::post(config('business.webhooks.upload'), [
                'id' => $this->submission->id,
                'token' => $this->token,
                'screenshot_url' => asset('storage/' . $path),
            ]);
        } catch (\Exception $e) {
            // Log error
        }

        $this->uploaded = true;
    }

    public function render()
    {
        return view('livewire.screenshot-upload');
    }
}
