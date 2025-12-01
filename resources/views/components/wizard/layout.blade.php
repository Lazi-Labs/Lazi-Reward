@props([
    'step' => 1,
    'completed' => false,
])

<div>
  <div class="max-w-5xl mx-auto">
    <div class="py-8 lg:pb-16">
      <flux:heading size="xl" level="1" class="text-center text-3xl">Get your gift card in 3 easy steps</flux:heading>
      <flux:text size="lg" class="text-center text-zinc-500 dark:text-zinc-400">Fill out the form, post a review, and claim your reward.</flux:text>
    </div>

    <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {{-- Left Sidebar (Desktop) --}}
      <div class="lg:w-80 shrink-0">
        <x-wizard.sidebar :step="$step" :completed="$completed"/>
      </div>

      {{-- Right Content Area --}}
      <div class="flex-1 min-w-0 pb-24 lg:pb-0">
        {{ $slot }}
      </div>
    </div>
  </div>

  {{-- Mobile Bottom Nav --}}
  <x-wizard.mobile-nav :step="$step" :completed="$completed"/>
</div>
