<div class="space-y-8">
  {{-- Header --}}
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <flux:heading size="xl">My Reviews</flux:heading>
      <flux:text class="text-zinc-500 dark:text-zinc-400 mt-1">
        Welcome back, {{ $user->name }}
      </flux:text>
    </div>
    <form action="{{ route('logout') }}" method="POST">
      @csrf
      <flux:button type="submit" variant="ghost" icon="arrow-right-start-on-rectangle">
        Sign Out
      </flux:button>
    </form>
  </div>

  {{-- Reviews List --}}
  @if ($reviews->isEmpty())
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
      <div class="size-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <flux:icon.document-text class="size-8 text-zinc-400 dark:text-zinc-500" />
      </div>
      <flux:heading size="lg" class="text-zinc-700 dark:text-zinc-300">No Reviews Yet</flux:heading>
      <flux:text class="text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">
        You haven't submitted any reviews yet. Start by leaving a review for one of our partner businesses!
      </flux:text>
      <a href="{{ route('home') }}" class="mt-6" wire:navigate>
        <flux:button variant="primary" icon="plus">
          Submit a Review
        </flux:button>
      </a>
    </div>
  @else
    <div class="grid gap-4">
      @foreach ($reviews as $review)
        <div class="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div class="flex-1 min-w-0">
              {{-- Business & Platform --}}
              <div class="flex flex-wrap items-center gap-2 mb-3">
                @if ($review->business)
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                    <flux:icon.building-storefront class="size-3.5" />
                    {{ $review->business->name }}
                  </span>
                @endif
                @if ($review->review_platform)
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    <flux:icon.globe-alt class="size-3.5" />
                    {{ $review->review_platform }}
                  </span>
                @endif
              </div>

              {{-- Rating --}}
              @if ($review->rating)
                <div class="flex items-center gap-1 mb-3">
                  @for ($i = 1; $i <= 5; $i++)
                    <flux:icon.star
                      class="size-5 {{ $i <= $review->rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-600' }}"
                      variant="{{ $i <= $review->rating ? 'solid' : 'outline' }}"
                    />
                  @endfor
                  <span class="ml-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {{ $review->rating }}/5
                  </span>
                </div>
              @endif

              {{-- Review Text --}}
              @if ($review->review_text)
                <p class="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
                  {{ Str::limit($review->review_text, 300) }}
                </p>
              @else
                <p class="text-zinc-400 dark:text-zinc-500 text-sm italic">
                  No review text provided
                </p>
              @endif
            </div>

            {{-- Date --}}
            <div class="text-right shrink-0">
              <flux:text class="text-xs text-zinc-500 dark:text-zinc-400">
                {{ $review->created_at->format('M j, Y') }}
              </flux:text>
              <flux:text class="text-xs text-zinc-400 dark:text-zinc-500">
                {{ $review->created_at->format('g:i A') }}
              </flux:text>
            </div>
          </div>
        </div>
      @endforeach
    </div>
  @endif
</div>
