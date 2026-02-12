<?php

namespace App\Livewire;

use App\Models\Business;
use App\Models\JobReferral;
use App\Models\JobType;
use App\Services\JobReferralService;
use Illuminate\Support\Facades\Auth;
use Livewire\Component;

class JobReferralForm extends Component
{
    public ?string $businessId = null;
    public ?string $jobTypeId = null;
    public string $referredName = '';
    public string $referredPhone = '';
    public string $referredEmail = '';

    public bool $submitted = false;
    public ?JobReferral $createdReferral = null;

    protected $rules = [
        'businessId' => 'required|exists:businesses,id',
        'jobTypeId' => 'required|exists:job_types,id',
        'referredName' => 'required|string|min:2|max:100',
        'referredPhone' => 'required|regex:/^\(\d{3}\) \d{3}-\d{4}$/',
        'referredEmail' => 'required|email|max:255',
    ];

    protected $messages = [
        'businessId.required' => 'Please select a business.',
        'jobTypeId.required' => 'Please select a job type.',
        'referredName.required' => 'Please enter the referred person\'s name.',
        'referredName.min' => 'Name must be at least 2 characters.',
        'referredPhone.required' => 'Please enter a phone number.',
        'referredPhone.regex' => 'Please enter a valid phone number in format (555) 123-4567.',
        'referredEmail.required' => 'Please enter an email address.',
        'referredEmail.email' => 'Please enter a valid email address.',
    ];

    public function updatedBusinessId(): void
    {
        $this->jobTypeId = null;
    }

    public function getBusinessesProperty()
    {
        return Business::active()
            ->withCount(['jobTypes' => fn ($q) => $q->active()])
            ->having('job_types_count', '>', 0)
            ->ordered()
            ->get();
    }

    public function getJobTypesProperty()
    {
        if (!$this->businessId) {
            return collect();
        }

        return JobType::where('business_id', $this->businessId)
            ->active()
            ->ordered()
            ->get();
    }

    public function getSelectedJobTypeProperty(): ?JobType
    {
        if (!$this->jobTypeId) {
            return null;
        }

        return JobType::find($this->jobTypeId);
    }

    public function submit(): void
    {
        $this->validate();

        $jobType = JobType::findOrFail($this->jobTypeId);
        $service = new JobReferralService();

        $this->createdReferral = $service->createReferral(
            Auth::user(),
            $jobType,
            $this->referredName,
            $this->referredPhone,
            $this->referredEmail
        );

        $this->submitted = true;
    }

    public function submitAnother(): void
    {
        $this->reset(['jobTypeId', 'referredName', 'referredPhone', 'referredEmail', 'submitted', 'createdReferral']);
    }

    public function render()
    {
        return view('livewire.job-referral-form');
    }
}
