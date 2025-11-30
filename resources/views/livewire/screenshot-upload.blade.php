<x-wizard.layout :step="3" :completed="$uploaded">
  @if ($uploaded)
    {{-- Success State --}}
    <x-success-card
      title="Thank You!"
      description="We've received your screenshot. Your gift card will be on its way shortly!"
    >
      <flux:button href="/" variant="ghost">Return Home</flux:button>
    </x-success-card>
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
          <flux:file-upload wire:model="photo" accept="image/*">
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

          <flux:button icon:trailing="gift" type="submit" variant="primary" class="w-full sm:w-auto px-8 mt-6 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" ::disabled="uploading || !uploaded" :loading="false">
            Submit & Claim Reward
          </flux:button>
        </form>
      </x-card>
    </div>
  @endif
</x-wizard.layout>
