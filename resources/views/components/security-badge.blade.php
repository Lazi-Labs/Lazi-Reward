{{-- Security Badge Component --}}
<div class="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
  <flux:badge size="lg" color="lime" class="w-full justify-center gap-2">
    <x-slot name="icon">
      <flux:icon.shield-check class="size-5"/>
    </x-slot>
    Your information is secure
  </flux:badge>
</div>
