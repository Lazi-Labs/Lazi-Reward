@props([
    'title',
    'description' => null,
    'icon' => 'check',
    'iconColor' => 'green',
])

@php
    $iconBgClass = "bg-{$iconColor}-100 dark:bg-{$iconColor}-900/30";
    $iconTextClass = "text-{$iconColor}-600 dark:text-{$iconColor}-400";
@endphp

<x-card padding="p-8" class="text-center">
    <div class="mx-auto w-16 h-16 {{ $iconBgClass }} rounded-full flex items-center justify-center {{ $iconTextClass }} mb-6">
        <flux:icon :icon="$icon" class="size-8" />
    </div>
    <flux:heading size="xl" level="1">{{ $title }}</flux:heading>
    @if ($description)
        <p class="text-zinc-500 dark:text-zinc-400 mt-2 mb-6">{{ $description }}</p>
    @endif
    {{ $slot }}
</x-card>
