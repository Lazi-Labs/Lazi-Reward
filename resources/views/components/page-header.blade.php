@props([
    'step' => null,
    'total' => 3,
    'title',
    'description' => null,
])

<div class="space-y-2">
  @if ($step)
    <x-step-indicator :current="$step" :total="$total"/>
  @endif
  <flux:heading size="xl" level="2">{{ $title }}</flux:heading>
  @if ($description)
    <p class="text-zinc-500 dark:text-zinc-400">{{ $description }}</p>
  @endif
</div>
