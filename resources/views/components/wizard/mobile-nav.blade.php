@props([
    'step' => 1,
    'completed' => false,
])

@php
    $steps = [
        1 => ['title' => 'Select Business', 'icon' => 'map-pin'],
        2 => ['title' => 'Post Review', 'icon' => 'pencil-square'],
        3 => ['title' => 'Claim Reward', 'icon' => 'gift'],
    ];
    $currentStep = $steps[$step] ?? $steps[1];
@endphp

<div x-data="{ open: false }" class="lg:hidden fixed bottom-0 left-0 right-0 z-50">
    {{-- Expandable Panel --}}
    <div
        x-show="open"
        x-transition:enter="transition ease-out duration-200"
        x-transition:enter-start="opacity-0 translate-y-4"
        x-transition:enter-end="opacity-100 translate-y-0"
        x-transition:leave="transition ease-in duration-150"
        x-transition:leave-start="opacity-100 translate-y-0"
        x-transition:leave-end="opacity-0 translate-y-4"
        @click.away="open = false"
        class="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 shadow-lg p-4 space-y-3"
    >
        @foreach ($steps as $num => $s)
            @php
                $isCompleted = $completed || $step > $num;
                $isActive = $step === $num;
            @endphp
            <div class="flex items-center gap-3 p-2 rounded-lg {{ $isActive ? 'bg-accent/10' : '' }}">
                <div class="w-8 h-8 rounded-full flex items-center justify-center {{ $isCompleted || $isActive ? 'bg-accent text-white dark:text-zinc-800' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400' }}">
                    @if ($isCompleted && !$isActive)
                        <flux:icon.check class="size-4" />
                    @else
                        <span class="text-sm font-semibold">{{ $num }}</span>
                    @endif
                </div>
                <span class="font-medium {{ $isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400' }}">
                    {{ $s['title'] }}
                </span>
                @if ($isActive)
                    <flux:icon.chevron-right class="size-4 text-accent ml-auto" />
                @endif
            </div>
        @endforeach
    </div>

    {{-- Bottom Bar --}}
    <div class="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700 shadow-lg">
        <button
            @click="open = !open"
            class="w-full flex items-center justify-between px-4 py-3"
        >
            <div class="flex items-center gap-3">
                {{-- Step Indicators --}}
                <div class="flex items-center gap-1.5">
                    @foreach ([1, 2, 3] as $num)
                        @php
                            $isCompleted = $completed || $step > $num;
                            $isActive = $step === $num;
                        @endphp
                        <div class="w-2.5 h-2.5 rounded-full {{ $isCompleted || $isActive ? 'bg-accent' : 'bg-zinc-300 dark:bg-zinc-600' }}"></div>
                    @endforeach
                </div>

                <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-700"></div>

                {{-- Current Step --}}
                <div class="flex items-center gap-2">
                    <span class="text-sm text-zinc-500 dark:text-zinc-400">Step {{ $step }}:</span>
                    <span class="text-sm font-medium text-zinc-900 dark:text-white">{{ $currentStep['title'] }}</span>
                </div>
            </div>

            {{-- Expand Icon --}}
            <flux:icon.chevron-up
                class="size-5 text-zinc-400 transition-transform"
                ::class="{ 'rotate-180': open }"
            />
        </button>
    </div>
</div>
