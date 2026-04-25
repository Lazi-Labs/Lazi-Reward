<?php

namespace App\Livewire\Account;

use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.app')]
class Dashboard extends Component
{
    public function render()
    {
        $reviews = Auth::user()->customerReviews()
            ->with('business')
            ->latest()
            ->get();

        return view('livewire.account.dashboard', [
            'reviews' => $reviews,
            'user' => Auth::user(),
        ]);
    }
}
