@props([
    'review',
    'showStep' => false,
])

<div class="space-y-3">
  @if ($showStep)
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Step 2: Copy Review</span>
        <template x-if="reviewCopied">
          <span class="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
            <flux:icon.check-circle class="size-4" />
            Copied
          </span>
        </template>
      </div>
    </div>
    <x-card padding="p-0" class="overflow-hidden" x-init="reviewText = $refs.reviewTextContent?.innerText || '{{ addslashes($review) }}'" x-bind:class="reviewCopied ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-zinc-900' : ''">
      <div class="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Review to copy</span>
        <flux:button
          class="cursor-pointer"
          size="sm"
          ::icon="reviewCopied ? 'check' : 'clipboard'"
          ::variant="reviewCopied ? 'primary' : 'ghost'"
          @click="copyReview()"
        >
          <span x-text="reviewCopied ? 'Copied!' : 'Copy Review'"></span>
        </flux:button>
      </div>
      <div x-ref="reviewTextContent" class="p-4 text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
        {{ $review }}
      </div>
    </x-card>
  @else
    <x-card padding="p-0" class="overflow-hidden" x-data="{ copied: false }" x-init="reviewText = $refs.reviewTextContent?.innerText || '{{ addslashes($review) }}'">
      <div class="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Review to copy</span>
        <flux:button
          class="cursor-pointer"
          size="sm"
          icon="clipboard"
          @click="navigator.clipboard.writeText($refs.reviewTextContent.innerText); copied = true; $flux.toast({ heading: 'Copied!', text: 'Review copied to clipboard', variant: 'success' })"
        >
          <span x-text="copied ? 'Copied!' : 'Copy'"></span>
        </flux:button>
      </div>
      <div x-ref="reviewTextContent" class="p-4 text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
        {{ $review }}
      </div>
    </x-card>
  @endif
</div>
