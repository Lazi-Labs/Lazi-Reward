@props([
    'padding' => 'p-6',
])

<div {{ $attributes->merge(['class' => "bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 {$padding}"]) }}>
    {{ $slot }}
</div>
