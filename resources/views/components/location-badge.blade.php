@props([
    'name',
    'avatar' => null,
    'dismissable' => true,
])

<div class="flex items-center gap-3 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit">
  <img
    src="{{ $avatar && str_contains($avatar, '/') ? Storage::url($avatar) : 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=e4e4e7&color=71717a' }}"
    alt="{{ $name }}"
    class="size-6 rounded-full object-cover"
  />
  <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ $name }}</span>
  @if ($dismissable)
    <button wire:click="back" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer">
      <flux:icon.x-mark class="size-4"/>
    </button>
  @endif
</div>
