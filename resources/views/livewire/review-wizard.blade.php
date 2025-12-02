<div
  x-data="{
    reviewText: '',
    photoUrl: '',
    init() {
      this.reviewText = this.$refs.reviewTextContent?.innerText || '';
      this.photoUrl = '{{ $selectedPhoto?->url ?? '' }}';
    },
    async copyAndSubmit() {
      // Copy review text to clipboard
      if (this.reviewText) {
        await navigator.clipboard.writeText(this.reviewText);
        $flux.toast({ heading: 'Review Copied!', text: 'Review text copied to clipboard', variant: 'success' });
      }
    },
    downloadPhoto() {
      if (!this.photoUrl) return;
      const link = document.createElement('a');
      link.href = this.photoUrl;
      link.download = 'review-photo.jpg';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }"
  x-on:open-gmb-link.window="copyAndSubmit().then(() => { window.open($event.detail.url, '_blank'); window.location.href = $event.detail.uploadUrl; })"
>
  <x-wizard.layout :step="$step">
    @if ($step === 1)
      {{-- Step 1: Select Business --}}
      <div class="space-y-6">
        <x-page-header
          :step="1"
          title="Select Your Business"
          description="Choose the business you visited. This helps us direct your review to the right place."
        />

        {{-- Loading skeleton --}}
        <div wire:loading wire:target="selectLocation" class="mt-8 w-full">
          <x-skeletons.review-form/>
        </div>

        {{-- Business cards --}}
        <div wire:loading.remove wire:target="selectLocation" class="mt-8">
          @if ($locations->isEmpty())
            {{-- Empty state --}}
            <div class="flex flex-col items-center justify-center py-12 px-6 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
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
                  :avatar="$loc->avatar"
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
          description="Save the photo, fill in your details, and we'll copy the review text and open Google for you."
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
            :avatar="$location->avatar"
          />

          @if ($selectedPhoto)
            <div class="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 group">
              <img
                src="{{ $selectedPhoto->url }}"
                alt="{{ $selectedPhoto->alt ?? 'Service photo from ' . $location->name }}"
                class="w-full h-48 sm:h-64 object-cover"
              />
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <flux:button
                  size="sm"
                  variant="filled"
                  icon="arrow-down-tray"
                  class="cursor-pointer"
                  @click="downloadPhoto()"
                >
                  Save Photo
                </flux:button>
              </div>
              <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex items-center justify-between">
                <p class="text-white text-sm font-medium">Upload this photo with your review</p>
                <flux:button
                  size="xs"
                  variant="ghost"
                  icon="arrow-down-tray"
                  class="cursor-pointer text-white hover:bg-white/20 sm:hidden"
                  @click="downloadPhoto()"
                />
              </div>
            </div>
          @endif

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

            <x-alert type="info" icon="clipboard-document-list" title="How it works">
              <ol class="list-decimal list-inside space-y-1 mt-1">
                <li><strong>Save the photo</strong> above (hover and click "Save Photo")</li>
                <li>Click "Continue" — we'll copy the review text for you</li>
                <li>On Google: <strong>paste the review</strong> and <strong>upload the photo</strong></li>
                <li><strong>Take a screenshot</strong> of your posted review</li>
                <li>Return here to upload your screenshot and claim your gift card</li>
              </ol>
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
