@props([
    'type' => 'warning',
    'icon' => null,
    'title' => null,
])

@php
  $styles = match($type) {
      'warning' => [
          'bg' => 'bg-amber-50 dark:bg-amber-900/20',
          'border' => 'border-amber-200 dark:border-amber-800',
          'icon' => 'text-amber-600 dark:text-amber-400',
          'title' => 'text-amber-800 dark:text-amber-300',
          'text' => 'text-amber-700 dark:text-amber-400',
      ],
      'info' => [
          'bg' => 'bg-blue-50 dark:bg-blue-900/20',
          'border' => 'border-blue-200 dark:border-blue-800',
          'icon' => 'text-blue-600 dark:text-blue-400',
          'title' => 'text-blue-800 dark:text-blue-300',
          'text' => 'text-blue-700 dark:text-blue-400',
      ],
      'success' => [
          'bg' => 'bg-green-50 dark:bg-green-900/20',
          'border' => 'border-green-200 dark:border-green-800',
          'icon' => 'text-green-600 dark:text-green-400',
          'title' => 'text-green-800 dark:text-green-300',
          'text' => 'text-green-700 dark:text-green-400',
      ],
      default => [
          'bg' => 'bg-zinc-50 dark:bg-zinc-900/20',
          'border' => 'border-zinc-200 dark:border-zinc-800',
          'icon' => 'text-zinc-600 dark:text-zinc-400',
          'title' => 'text-zinc-800 dark:text-zinc-300',
          'text' => 'text-zinc-700 dark:text-zinc-400',
      ],
  };
@endphp

<div class="p-4 {{ $styles['bg'] }} border {{ $styles['border'] }} rounded-xl">
  <div class="flex gap-3">
    @if ($icon)
      <div class="shrink-0">
        <flux:icon :icon="$icon" class="size-5 {{ $styles['icon'] }}"/>
      </div>
    @endif
    <div>
      @if ($title)
        <h4 class="font-medium {{ $styles['title'] }} text-sm">{{ $title }}</h4>
      @endif
      <p class="text-sm {{ $styles['text'] }} {{ $title ? 'mt-1' : '' }}">{{ $slot }}</p>
    </div>
  </div>
</div>
