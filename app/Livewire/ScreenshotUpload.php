<?php

namespace App\Livewire;

use App\Models\Submission;
use Illuminate\Support\Facades\Http;
use Livewire\Component;
use Livewire\WithFileUploads;

class ScreenshotUpload extends Component
{
    use WithFileUploads;

    public $token;
    public $submission;
    public $photo;
    public $uploaded = false;

    public function mount($token)
    {
        $this->token = $token;
        $this->submission = Submission::where('token', $token)->firstOrFail();

        if ($this->submission->status === 'completed') {
            $this->uploaded = true;
        }
    }

    public function removePhoto()
    {
        $this->photo = null;
    }

    public function save()
    {
        $this->validate([
            'photo' => 'required|image|max:10240', // 10MB Max
        ]);

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
