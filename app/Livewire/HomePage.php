<?php

namespace App\Livewire;

use App\Models\Business;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.landing')]
class HomePage extends Component
{
    public function getBusinessesProperty()
    {
        return Business::active()->ordered()->get();
    }

    public function render()
    {
        return view('livewire.home-page');
    }
}
