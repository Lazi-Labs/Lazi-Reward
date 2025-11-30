@props([
    'current' => 1,
    'total' => 3,
])

<flux:badge size="sm" variant="pill" class="bg-primary text-zinc-50">Step {{ $current }} of {{ $total }}</flux:badge>
