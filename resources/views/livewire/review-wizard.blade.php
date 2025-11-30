<div x-data x-on:open-gmb-link.window="window.open($event.detail.url, '_blank'); window.location.href = $event.detail.uploadUrl;">
  <x-wizard.layout :step="$step">
    @if ($step === 1)
      {{-- Step 1: Select Location --}}
      <div class="space-y-6">
        <x-page-header
          :step="1"
          title="Select Your Location"
          description="Choose the business you visited. This helps us direct your review to the right place."
        />

        {{-- Loading skeleton --}}
        <div wire:loading wire:target="selectLocation" class="mt-8 w-full">
          <x-skeletons.review-form/>
        </div>

        {{-- Location cards --}}
        <div wire:loading.remove wire:target="selectLocation" class="grid grid-cols-1 gap-4 mt-8">
          @foreach (config('business.locations') as $key => $business)
            <x-location-card
              :key="$key"
              :name="$business['name']"
              :description="$business['description']"
              :color="$business['color']"
            />
          @endforeach
        </div>
      </div>
    @elseif ($step === 2)
      {{-- Step 2: Post Review --}}
      @php
        $locationConfig = config("business.locations.{$location}");
      @endphp

      <div class="space-y-6">
        <x-page-header
          :step="2"
          title="Post Your Review"
          description="Copy the review below, fill in your details, and you'll be redirected to Google."
        />

        {{-- Loading skeleton for form submission --}}
        <div wire:loading wire:target="submit" class="w-full">
          <flux:skeleton.group animate="shimmer" class="space-y-4 w-full">
            <div class="flex items-center justify-center py-12">
              <div class="text-center space-y-4">
                <flux:icon.arrow-path class="size-8 text-accent animate-spin mx-auto"/>
                <p class="text-zinc-500 dark:text-zinc-400">Redirecting to Google Reviews...</p>
              </div>
            </div>
          </flux:skeleton.group>
        </div>

        {{-- Form content --}}
        <div wire:loading.remove wire:target="submit" class="space-y-6">
          <x-location-badge
            :name="$locationConfig['name']"
            :color="$locationConfig['color'] ?? 'zinc'"
          />

          <x-review-box :review="$locationConfig['review']"/>

          <form wire:submit="submit" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <flux:input wire:model="name" label="Full Name" placeholder="John Doe" required/>
              <flux:input wire:model="email" label="Email Address" type="email" placeholder="john@example.com" required/>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <flux:input wire:model="phone" type="phone" label="Phone Number" placeholder="(555) 123-4567" mask="(999) 999-9999" required/>
              <flux:select wire:model="giftCard" variant="listbox" label="Choose Your Reward" placeholder="Select a gift card..." class="cursor-pointer">
                @foreach (config('business.gift_cards') as $key => $label)
                  <flux:select.option value="{{ $key }}">{{ $label }}</flux:select.option>
                @endforeach
              </flux:select>
            </div>

            <x-alert type="warning" icon="camera" title="Important: Take a Screenshot!">
              After posting your review on Google, take a screenshot of it. You'll need to upload it to claim your gift card.
            </x-alert>

            <div class="pt-2">
              <flux:button icon:trailing="arrow-right" type="submit" variant="primary" class="w-full sm:w-auto px-8 cursor-pointer">
                <span wire:loading.remove wire:target="submit">Continue to Google Reviews</span>
                <span wire:loading wire:target="submit">Redirecting...</span>
              </flux:button>
            </div>
          </form>
        </div>
      </div>
    @endif
  </x-wizard.layout>
</div>
