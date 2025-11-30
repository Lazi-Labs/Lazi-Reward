<flux:skeleton.group animate="shimmer" class="grid grid-cols-1 gap-4">
    @for ($i = 0; $i < 3; $i++)
        <div class="flex items-center gap-4 p-5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <flux:skeleton class="size-12 rounded-xl" />
            <div class="flex-1 space-y-2">
                <flux:skeleton.line class="w-1/3" />
                <flux:skeleton.line class="w-1/2" />
            </div>
            <flux:skeleton class="size-5 rounded" />
        </div>
    @endfor
</flux:skeleton.group>
