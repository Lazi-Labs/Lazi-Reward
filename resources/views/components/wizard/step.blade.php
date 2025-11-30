@props([
    'step',
    'current',
    'completed' => false,
    'title',
    'description',
    'icon',
    'showLine' => true,
])

@php
  $isCompleted = $completed || $current > $step;
  $isActive = $current === $step;
  $isPending = $current < $step;

  $circleClasses = match(true) {
      $completed && $step === 3 => 'bg-green-500 text-white',
      $isCompleted || $isActive => 'bg-accent text-white dark:text-zinc-800',
      default => 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400',
  };

  $titleClasses = $isActive
      ? 'text-zinc-900 dark:text-white'
      : 'text-zinc-500 dark:text-zinc-100';

  $lineClasses = $isCompleted
      ? 'bg-accent'
      : 'bg-zinc-200 dark:bg-zinc-700';
@endphp

<div class="flex gap-4">
  <div class="flex flex-col items-center">
    <div class="w-10 h-10 rounded-full flex items-center justify-center {{ $circleClasses }} transition-colors">
      @if ($isCompleted)
        <flux:icon.check class="size-5"/>
      @else
        <flux:icon :icon="$icon" class="size-5"/>
      @endif
    </div>
    @if ($showLine)
      <div class="w-0.5 flex-1 min-h-[3rem] mt-2 {{ $lineClasses }} transition-colors"></div>
    @endif
  </div>
  <div class="{{ $showLine ? 'pb-6' : '' }}">
    <h3 class="font-semibold {{ $titleClasses }}">{{ $title }}</h3>
    <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{{ $description }}</p>
  </div>
</div>
