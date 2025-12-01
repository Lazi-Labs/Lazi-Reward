<div x-data x-show="! $store.sidebar.isOpen" class="flex items-center justify-center">
  {{-- Collapsed: Show brand icon/logo --}}
  <svg class="text-zinc-600 dark:text-zinc-300" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</div>
<div x-data x-show="$store.sidebar.isOpen" class="flex items-center gap-2">
  {{-- Expanded: Show full brand name --}}
  <span class="text-lg font-semibold text-zinc-800 dark:text-white">Lazi Rewards</span>
</div>
