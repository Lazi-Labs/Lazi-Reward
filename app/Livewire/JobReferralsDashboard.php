<?php

namespace App\Livewire;

use App\Models\JobReferral;
use App\Services\JobReferralService;
use Illuminate\Support\Facades\Auth;
use Livewire\Component;
use Livewire\WithPagination;

class JobReferralsDashboard extends Component
{
    use WithPagination;

    public string $statusFilter = '';

    public function updatedStatusFilter(): void
    {
        $this->resetPage();
    }

    public function getStatsProperty(): array
    {
        $service = new JobReferralService();
        return $service->getUserStats(Auth::user());
    }

    public function getReferralsProperty()
    {
        $query = JobReferral::forUser(Auth::id())
            ->with(['business', 'jobType'])
            ->latest();

        if ($this->statusFilter) {
            $query->where('status', $this->statusFilter);
        }

        return $query->paginate(10);
    }

    public function render()
    {
        return view('livewire.job-referrals-dashboard', [
            'statuses' => JobReferral::getStatuses(),
        ]);
    }
}
