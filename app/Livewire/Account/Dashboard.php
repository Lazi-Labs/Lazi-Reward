<?php

namespace App\Livewire\Account;

use App\Models\JobReferral;
use App\Models\Submission;
use App\Services\JobReferralService;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.app')]
class Dashboard extends Component
{
    public function getReferralStatsProperty(): array
    {
        $service = new JobReferralService();
        return $service->getUserStats(Auth::user());
    }

    public function getRecentReferralsProperty()
    {
        return Auth::user()->jobReferrals()
            ->with(['business', 'jobType'])
            ->latest()
            ->take(5)
            ->get();
    }

    public function getRecentSubmissionsProperty()
    {
        // Match submissions by email
        return Submission::where('email', Auth::user()->email)
            ->with('business')
            ->latest()
            ->take(5)
            ->get();
    }

    public function render()
    {
        return view('livewire.account.dashboard', [
            'user' => Auth::user(),
        ]);
    }
}
