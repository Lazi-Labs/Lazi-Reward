@props([
    'key',
    'name',
    'description',
    'color',
])

<button
  wire:click="selectLocation('{{ $key }}')"
  class="group flex items-center gap-4 p-5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-accent transition-all hover:shadow-md text-left w-full cursor-pointer"
>
  <div class="size-6 rounded bg-{{ $color }}-500 group-hover:scale-110 transition-transform"></div>
  <div class="flex-1">
    <h3 class="font-semibold text-zinc-900 dark:text-white">{{ $name }}</h3>
    <p class="text-sm text-zinc-500">{{ $description }}</p>
  </div>
  <flux:icon.chevron-right class="size-5 text-zinc-400 group-hover:text-accent group-hover:translate-x-1 transition-all"/>
</button>
