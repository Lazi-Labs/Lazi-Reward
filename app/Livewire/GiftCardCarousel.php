<?php

namespace App\Livewire;

use App\Models\GiftCardProduct;
use Livewire\Component;

class GiftCardCarousel extends Component
{
    public array $products = [];

    public function mount()
    {
        $this->loadProducts();
    }

    public function loadProducts()
    {
        $this->products = GiftCardProduct::active()
            ->ordered()
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'image_url' => $product->image_url,
                    'category' => $product->category,
                    'value_range' => $product->formatted_value_range,
                ];
            })
            ->toArray();
    }

    public function render()
    {
        return view('livewire.gift-card-carousel');
    }
}
