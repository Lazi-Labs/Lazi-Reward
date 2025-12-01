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
        <div wire:loading.remove wire:target="selectLocation" class="mt-8">
          @if ($locations->isEmpty())
            {{-- Empty state --}}
            <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div class="size-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <flux:icon.map-pin class="size-8 text-zinc-400 dark:text-zinc-500"/>
              </div>
              <flux:heading size="lg" class="text-zinc-700 dark:text-zinc-300">No Businesses Available</flux:heading>
              <flux:text class="text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
                There are no businesses set up yet. Please check back later or contact support.
              </flux:text>
            </div>
          @else
            <div class="grid grid-cols-1 gap-4">
              @foreach ($locations as $loc)
                <x-location-card
                  :key="$loc->id"
                  :name="$loc->name"
                  :description="$loc->description"
                  :color="$loc->color"
                />
              @endforeach
            </div>
          @endif
        </div>
      </div>
    @elseif ($step === 2)
      {{-- Step 2: Post Review --}}
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
            :name="$location->name"
            :color="$location->color ?? 'zinc'"
          />

          {{-- Service Photo Upload --}}
          <x-card>
            <div class="space-y-3">
              <flux:heading size="sm">Upload a Photo of Your Service</flux:heading>
              <flux:text class="text-sm text-zinc-500">Please upload a photo showing the service that was completed.</flux:text>

              <div x-data="{ uploading: false, uploaded: {{ $servicePhoto ? 'true' : 'false' }} }"
                   x-on:livewire-upload-start="uploading = true"
                   x-on:livewire-upload-finish="uploading = false; uploaded = true"
                   x-on:livewire-upload-error="uploading = false">
                <flux:file-upload wire:model="servicePhoto" accept="image/*" :invalid="$errors->has('servicePhoto')">
                  <flux:file-upload.dropzone class="cursor-pointer"
                    heading="Drop your photo here or click to browse"
                    text="JPG or PNG up to 10MB"
                    with-progress
                  />
                </flux:file-upload>

                @if ($servicePhoto)
                  <flux:file-item
                    :heading="$servicePhoto->getClientOriginalName()"
                    :image="$servicePhoto->temporaryUrl()"
                    :size="$servicePhoto->getSize()"
                    class="mt-4"
                  >
                    <x-slot name="actions">
                      <flux:file-item.remove wire:click="removeServicePhoto" x-on:click="uploaded = false"/>
                    </x-slot>
                  </flux:file-item>
                @endif

                @error('servicePhoto')
                  <flux:text class="text-sm text-red-500 mt-2">{{ $message }}</flux:text>
                @enderror
              </div>
            </div>
          </x-card>

          <x-review-box :review="$location->review_template"/>

          <form wire:submit="submit" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <flux:input wire:model.blur="name" label="Full Name" placeholder="John Doe" required :invalid="$errors->has('name')"/>
              <flux:input wire:model.blur="email" label="Email Address" type="email" placeholder="john@example.com" required :invalid="$errors->has('email')"/>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <flux:input wire:model.blur="phone" label="Phone Number" placeholder="(555) 123-4567" mask="(999) 999-9999" required :invalid="$errors->has('phone')"/>
              <flux:select wire:model.live="giftCard" variant="listbox" label="Choose Your Reward" placeholder="Select a gift card..." class="cursor-pointer" :invalid="$errors->has('giftCard')">
                @foreach ($giftCards as $card)
                  <flux:select.option value="{{ $card->id }}">{{ $card->name }}</flux:select.option>
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
