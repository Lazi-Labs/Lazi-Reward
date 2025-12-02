@props([
    'review',
])

<x-card padding="p-0" class="overflow-hidden" x-init="reviewText = $refs.reviewTextContent?.innerText || '{{ addslashes($review) }}'">
  <div class="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
    <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Review to copy</span>
    <flux:button
      class="cursor-pointer"
      size="sm"
      icon="clipboard"
      @click="navigator.clipboard.writeText($refs.reviewTextContent.innerText); $flux.toast({ heading: 'Copied!', text: 'Review copied to clipboard', variant: 'success' })"
    >
      Copy
    </flux:button>
  </div>
  <div x-ref="reviewTextContent" class="p-4 text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
    {{ $review }}
  </div>
</x-card>
