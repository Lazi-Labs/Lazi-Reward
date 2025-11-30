<flux:skeleton.group animate="shimmer" class="space-y-6">
    {{-- Location Badge --}}
    <flux:skeleton class="h-10 w-48 rounded-lg" />

    {{-- Review Box --}}
    <div class="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
            <flux:skeleton.line class="w-24" />
            <flux:skeleton class="h-8 w-16 rounded-md" />
        </div>
        <div class="p-4 space-y-2">
            <flux:skeleton.line />
            <flux:skeleton.line />
            <flux:skeleton.line class="w-3/4" />
        </div>
    </div>

    {{-- Form Fields --}}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
            <flux:skeleton.line class="w-20" />
            <flux:skeleton class="h-10 w-full rounded-md" />
        </div>
        <div class="space-y-2">
            <flux:skeleton.line class="w-24" />
            <flux:skeleton class="h-10 w-full rounded-md" />
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
            <flux:skeleton.line class="w-32" />
            <flux:skeleton class="h-10 w-full rounded-md" />
        </div>
        <div class="space-y-2">
            <flux:skeleton.line class="w-28" />
            <flux:skeleton class="h-10 w-full rounded-md" />
        </div>
    </div>

    {{-- Alert --}}
    <flux:skeleton class="h-20 w-full rounded-xl" />

    {{-- Button --}}
    <flux:skeleton class="h-10 w-48 rounded-md" />
</flux:skeleton.group>
