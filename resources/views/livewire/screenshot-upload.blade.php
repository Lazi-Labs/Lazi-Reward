<x-wizard.layout :step="3" :completed="$uploaded && $verificationStatus === 'approved'">
  @if ($uploaded)
    @if ($verifying)
      {{-- Verifying State - Spinning wheel with countdown --}}
      <div class="max-w-md mx-auto" wire:poll.3s="checkVerificationStatus">
        <x-card class="text-center py-12">
          {{-- Spinning wheel --}}
          <div class="mb-8">
            <div class="relative inline-flex">
              <div class="w-20 h-20 border-4 border-accent/20 rounded-full"></div>
              <div class="absolute top-0 left-0 w-20 h-20 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          
          <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
            Verifying Your Screenshot
          </h2>
          <p class="text-zinc-600 dark:text-zinc-400 mb-6">
            Please wait while we verify your review screenshot...
          </p>
          
          {{-- Countdown timer --}}
          <div x-data="{ seconds: 60 }" x-init="setInterval(() => { if (seconds > 0) seconds-- }, 1000)">
            <p class="text-sm text-zinc-500 dark:text-zinc-500">
              Estimated time: <span x-text="seconds" class="font-mono font-semibold text-accent"></span> seconds
            </p>
          </div>
        </x-card>
      </div>
    @elseif ($verificationStatus === 'approved')
      {{-- Approved State --}}
      <x-success-card
        title="You Have Been Approved!"
        description="Your gift card will be sent within 10 minutes."
      >
        <div class="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-4">
          <flux:icon.check-circle class="size-6" />
          <span class="font-medium">Verification Successful</span>
        </div>
        <flux:button href="/" variant="ghost">Return Home</flux:button>
      </x-success-card>
    @elseif ($verificationStatus === 'rejected')
      {{-- Rejected State --}}
      <div class="max-w-md mx-auto">
        <x-card class="text-center py-12">
          <div class="mb-6">
            <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <flux:icon.x-circle class="size-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
            Sorry, Please Try Again Later
          </h2>
          <p class="text-zinc-600 dark:text-zinc-400 mb-6">
            {{ $verificationMessage ?? 'We could not verify your screenshot at this time.' }}
          </p>
          
          <flux:button href="/" variant="ghost">Return Home</flux:button>
        </x-card>
      </div>
    @else
      {{-- Fallback Success State (no verification status yet but uploaded) --}}
      <x-success-card
        title="Thank You!"
        description="We've received your screenshot. Your gift card will be on its way shortly!"
      >
        <flux:button href="/" variant="ghost">Return Home</flux:button>
      </x-success-card>
    @endif
  @else
    {{-- Upload Form --}}
    <div class="space-y-6">
      <x-page-header
        :step="3"
        title="Claim Your Reward"
        description="Upload a screenshot of your posted Google review to receive your gift card."
      />

      {{-- Loading skeleton for form submission --}}
      <div wire:loading wire:target="save">
        <flux:skeleton.group animate="shimmer" class="space-y-4">
          <div class="flex items-center justify-center py-12">
            <div class="text-center space-y-4">
              <flux:icon.arrow-path class="size-8 text-accent animate-spin mx-auto"/>
              <p class="text-zinc-500 dark:text-zinc-400">Submitting your screenshot...</p>
            </div>
          </div>
        </flux:skeleton.group>
      </div>

      <x-card wire:loading.remove wire:target="save">
        <form wire:submit="save" x-data="{ uploading: false, uploaded: {{ $photo ? 'true' : 'false' }} }" x-on:livewire-upload-start="uploading = true" x-on:livewire-upload-finish="uploading = false; uploaded = true" x-on:livewire-upload-error="uploading = false">
          <flux:file-upload wire:model="photo" accept="image/*" :invalid="$errors->has('photo')">
            <flux:file-upload.dropzone class="cursor-pointer"
              heading="Drop your screenshot here or click to browse"
              text="JPG or PNG up to 10MB"
              with-progress
            />
          </flux:file-upload>

          @if ($photo)
            <flux:file-item
              :heading="$photo->getClientOriginalName()"
              :image="$photo->temporaryUrl()"
              :size="$photo->getSize()"
              class="mt-4"
            >
              <x-slot name="actions">
                <flux:file-item.remove wire:click="removePhoto" x-on:click="uploaded = false"/>
              </x-slot>
            </flux:file-item>
          @endif

          @error('photo')
            <flux:text class="text-sm text-red-500 mt-2">{{ $message }}</flux:text>
          @enderror

          <flux:button icon:trailing="gift" type="submit" variant="primary" class="w-full sm:w-auto px-8 mt-6 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" ::disabled="uploading || !uploaded" :loading="false">
            Submit & Claim Reward
          </flux:button>
        </form>
      </x-card>
    </div>
  @endif
</x-wizard.layout>
