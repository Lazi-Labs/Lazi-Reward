<?php

namespace App\Livewire;

use Exception;
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
    public $verifying = false;
    public $verificationStatus = null; // null, 'pending', 'approved', 'rejected'
    public $verificationMessage = null;

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
            $this->verificationStatus = $this->submission->verification_status;
            $this->verificationMessage = $this->submission->verification_message;
            
            // If uploaded but no verification status yet, show verifying state
            if (!$this->verificationStatus) {
                $this->verifying = true;
            }
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

        // Send to n8n webhook
        $webhookUrl = config('business.webhooks.upload');
        if ($webhookUrl) {
            try {
                // Get screenshot file path
                $screenshotPath = storage_path('app/public/' . $path);
                $screenshotContents = file_get_contents($screenshotPath);

                // Send as multipart/form-data with screenshot as real file upload
                Http::attach(
                    'screenshot',
                    $screenshotContents,
                    'screenshot.jpg',
                    ['Content-Type' => 'image/jpeg']
                )->post($webhookUrl, [
                    'token' => $this->token,
                    'name' => $this->submission->name ?? '',
                    'email' => $this->submission->email ?? '',
                    'phone' => $this->submission->phone ?? '',
                    'business_name' => $this->submission->business?->name ?? '',
                    'gift_card_name' => $this->submission->giftCard?->name ?? '',
                    'gift_card_key' => $this->submission->gift_card_choice ?? '',
                    'review_content' => $this->submission->review_content ?? '',
                    'callback_url' => route('webhook.verification'),
                    'submitted_at' => $this->submission->created_at->toIso8601String(),
                    'completed_at' => now()->toIso8601String(),
                ]);
            } catch (Exception $e) {
                // Log error but continue
                report($e);
            }
        }

        $this->uploaded = true;
        $this->verifying = true;
    }

    /**
     * Poll for verification status (called from frontend)
     */
    public function checkVerificationStatus()
    {
        $this->submission->refresh();
        
        if ($this->submission->verification_status) {
            $this->verifying = false;
            $this->verificationStatus = $this->submission->verification_status;
            $this->verificationMessage = $this->submission->verification_message;
        }
    }

    public function render()
    {
        return view('livewire.screenshot-upload');
    }
}
