@props([
    'icon',
    'iconColor' => 'green',
    'title',
    'subtitle',
])

<div class="flex items-center gap-2">
  <flux:icon :icon="$icon" class="size-5 text-{{ $iconColor }}-600 dark:text-{{ $iconColor }}-500"/>
  <div class="text-left">
    <div class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{{ $title }}</div>
    <div class="text-[10px] text-zinc-500 dark:text-zinc-400">{{ $subtitle }}</div>
  </div>
</div>
