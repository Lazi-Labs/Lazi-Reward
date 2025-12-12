<div
  x-data="{
    reviewText: '',
    photoUrl: '',
    photoDownloaded: {{ $selectedReviewPair && $selectedReviewPair->photo ? 'false' : 'true' }},
    reviewCopied: false,
    showPhotoModal: false,
    isIOS: false,
    init() {
      this.reviewText = this.$refs.reviewTextContent?.innerText || '';
      this.photoUrl = '{{ $selectedReviewPair?->photo?->url ?? '' }}';
      // Detect iOS
      this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    },
    get canProceed() {
      return this.photoDownloaded && this.reviewCopied;
    },
    copyReview() {
      if (this.reviewText) {
        navigator.clipboard.writeText(this.reviewText);
        this.reviewCopied = true;
        $flux.toast({ heading: 'Review Copied!', text: 'Review text copied to clipboard', variant: 'success' });
      }
    },
    downloadPhoto() {
      if (!this.photoUrl) return;
      
      // On iOS, show modal with long-press instructions
      if (this.isIOS) {
        this.showPhotoModal = true;
        return;
      }
      
      // On other devices, try to download
      const link = document.createElement('a');
      link.href = this.photoUrl;
      link.download = 'review-photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.photoDownloaded = true;
      $flux.toast({ heading: 'Photo Saved!', text: 'Photo downloaded to your device', variant: 'success' });
    },
    confirmPhotoSaved() {
      this.showPhotoModal = false;
      this.photoDownloaded = true;
      $flux.toast({ heading: 'Photo Saved!', text: 'Photo saved to your device', variant: 'success' });
    }
  }"
  x-on:open-gmb-link.window="window.open($event.detail.url, '_blank'); window.location.href = $event.detail.uploadUrl;"
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
                  :location-id="$loc->id"
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

        {{-- Form content --}}
        <div class="space-y-6">
          <x-location-badge
            :name="$location->name"
            :avatar="$location->avatar"
          />

          @if ($selectedReviewPair && $selectedReviewPair->photo)
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Step 1: Save Photo</span>
                  <template x-if="photoDownloaded">
                    <span class="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <flux:icon.check-circle class="size-4" />
                      Saved
                    </span>
                  </template>
                </div>
              </div>
              <div class="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700" :class="photoDownloaded ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-zinc-900' : ''">
                <img
                  src="{{ $selectedReviewPair->photo->url }}"
                  alt="{{ $selectedReviewPair->photo->alt ?? 'Service photo from ' . $location->name }}"
                  class="w-full h-48 sm:h-64 object-cover"
                />
                <div class="absolute inset-0 bg-black/50 flex items-center justify-center" x-show="!photoDownloaded">
                  <flux:button
                    variant="filled"
                    icon="arrow-down-tray"
                    class="cursor-pointer"
                    @click="downloadPhoto()"
                  >
                    Save Photo to Device
                  </flux:button>
                </div>
                <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p class="text-white text-sm font-medium" x-show="!photoDownloaded">You'll upload this photo with your Google review</p>
                  <p class="text-white text-sm font-medium" x-show="photoDownloaded">Photo saved! You'll upload it to Google.</p>
                </div>
              </div>
            </div>
          @endif

          <x-review-box :review="$selectedReviewPair?->content ?? $location->review_template" :show-step="true"/>

          <form wire:submit="submit" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <flux:input wire:model.blur="name" label="Full Name" placeholder="John Doe" required :invalid="$errors->has('name')"/>
              <flux:input wire:model.blur="email" label="Email Address" type="email" placeholder="john@example.com" required :invalid="$errors->has('email')"/>
            </div>

            <flux:input wire:model.blur="phone" label="Phone Number" placeholder="(555) 123-4567" mask="(999) 999-9999" required :invalid="$errors->has('phone')"/>

            {{-- Gift Card Selector Carousel --}}
            <div class="mt-2">
              <livewire:gift-card-selector wire:model="giftCard" />
            </div>

            {{-- Progress checklist --}}
            <div x-show="!canProceed" class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div class="flex items-start gap-3">
                <flux:icon.exclamation-triangle class="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"/>
                <div>
                  <p class="text-sm font-medium text-amber-800 dark:text-amber-300">Complete these steps before continuing:</p>
                  <ul class="mt-2 space-y-1">
                    @if ($selectedReviewPair && $selectedReviewPair->photo)
                      <li class="flex items-center gap-2 text-sm" :class="photoDownloaded ? 'text-green-600 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'">
                        <flux:icon.check-circle x-show="photoDownloaded" class="size-4"/>
                        <flux:icon.x-circle x-show="!photoDownloaded" class="size-4"/>
                        <span>Save the photo</span>
                      </li>
                    @endif
                    <li class="flex items-center gap-2 text-sm" :class="reviewCopied ? 'text-green-600 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'">
                      <flux:icon.check-circle x-show="reviewCopied" class="size-4"/>
                      <flux:icon.x-circle x-show="!reviewCopied" class="size-4"/>
                      <span>Copy the review text</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {{-- Success state --}}
            <div x-show="canProceed" x-cloak class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div class="flex items-center gap-3">
                <flux:icon.check-circle class="size-5 text-green-600 dark:text-green-400"/>
                <p class="text-sm font-medium text-green-800 dark:text-green-300">Ready! Click continue to open Google Reviews. Paste the review and upload your saved photo.</p>
              </div>
            </div>

            <div class="pt-2">
              <flux:button
                icon:trailing="arrow-right"
                type="submit"
                variant="primary"
                class="w-full sm:w-auto px-8"
                ::class="canProceed ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'"
                ::disabled="!canProceed"
                :loading="false"
              >
                Continue to Google Reviews
              </flux:button>
            </div>
          </form>
        </div>
      </div>
    @endif
  </x-wizard.layout>

  {{-- iOS Photo Save Modal --}}
  <div
    x-show="showPhotoModal"
    x-transition:enter="transition ease-out duration-300"
    x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="opacity-100"
    x-transition:leave-end="opacity-0"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
    @click.self="showPhotoModal = false"
  >
    <div
      x-show="showPhotoModal"
      x-transition:enter="transition ease-out duration-300"
      x-transition:enter-start="opacity-0 scale-95"
      x-transition:enter-end="opacity-100 scale-100"
      x-transition:leave="transition ease-in duration-200"
      x-transition:leave-start="opacity-100 scale-100"
      x-transition:leave-end="opacity-0 scale-95"
      class="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
    >
      {{-- Header --}}
      <div class="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">Save Photo</h3>
          <button @click="showPhotoModal = false" class="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700">
            <flux:icon.x-mark class="size-5 text-zinc-500" />
          </button>
        </div>
      </div>

      {{-- Instructions --}}
      <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
        <div class="flex gap-3">
          <flux:icon.information-circle class="size-6 text-blue-600 dark:text-blue-400 shrink-0" />
          <div class="text-sm text-blue-800 dark:text-blue-300">
            <p class="font-medium mb-1">To save on iPhone/iPad:</p>
            <ol class="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
              <li><strong>Press and hold</strong> the photo below</li>
              <li>Tap <strong>"Add to Photos"</strong> or <strong>"Save Image"</strong></li>
              <li>Tap <strong>"I've Saved It"</strong> button</li>
            </ol>
          </div>
        </div>
      </div>

      {{-- Photo --}}
      <div class="p-4">
        <div class="rounded-xl overflow-hidden border-2 border-dashed border-zinc-300 dark:border-zinc-600">
          <img
            :src="photoUrl"
            alt="Press and hold to save"
            class="w-full h-auto"
          />
        </div>
      </div>

      {{-- Actions --}}
      <div class="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
        <flux:button
          variant="primary"
          class="w-full"
          icon="check-circle"
          @click="confirmPhotoSaved()"
        >
          I've Saved the Photo
        </flux:button>
        <flux:button
          variant="ghost"
          class="w-full"
          @click="showPhotoModal = false"
        >
          Cancel
        </flux:button>
      </div>
    </div>
  </div>
</div>
