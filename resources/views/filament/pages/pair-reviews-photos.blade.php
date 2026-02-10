<x-filament-panels::page>
    <div class="space-y-6">
        {{-- Business Selector --}}
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            {{ $this->form }}
        </div>

        @if($selectedBusinessId)
            {{-- Instructions --}}
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div class="flex items-start gap-3">
                    <x-heroicon-o-information-circle class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div class="text-sm text-blue-800 dark:text-blue-300">
                        <p class="font-medium">How to pair:</p>
                        <p>Click a review on the left, then click a photo on the right. They will be paired automatically.</p>
                    </div>
                </div>
            </div>

            {{-- Side by Side Pairing Interface --}}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {{-- Unpaired Reviews Column --}}
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <x-heroicon-o-chat-bubble-left-right class="w-5 h-5" />
                            Unpaired Reviews
                            <span class="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium px-2 py-1 rounded-full">
                                {{ $this->getUnpairedReviews()->count() }}
                            </span>
                        </h3>
                    </div>
                    <div class="divide-y divide-gray-200 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
                        @forelse($this->getUnpairedReviews() as $review)
                            <button
                                wire:click="selectReview('{{ $review->id }}')"
                                class="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors {{ $selectedReviewId === $review->id ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500 ring-inset' : '' }}"
                            >
                                <div class="flex items-start gap-3">
                                    @if($selectedReviewId === $review->id)
                                        <div class="shrink-0 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                            <x-heroicon-s-check class="w-4 h-4 text-white" />
                                        </div>
                                    @else
                                        <div class="shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                                    @endif
                                    <div class="flex-1 min-w-0">
                                        @if($review->rating)
                                            <div class="flex items-center gap-1 mb-1">
                                                @for($i = 1; $i <= 5; $i++)
                                                    <x-heroicon-s-star class="w-3 h-3 {{ $i <= $review->rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600' }}" />
                                                @endfor
                                            </div>
                                        @endif
                                        <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{{ $review->content }}</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">{{ $review->created_at->format('M j, Y') }}</p>
                                    </div>
                                </div>
                            </button>
                        @empty
                            <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                                <x-heroicon-o-chat-bubble-left-right class="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No unpaired reviews</p>
                            </div>
                        @endforelse
                    </div>
                </div>

                {{-- Unpaired Photos Column --}}
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <x-heroicon-o-photo class="w-5 h-5" />
                            Unpaired Photos
                            <span class="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium px-2 py-1 rounded-full">
                                {{ $this->getUnpairedPhotos()->count() }}
                            </span>
                        </h3>
                    </div>
                    <div class="grid grid-cols-2 gap-2 p-2 max-h-[500px] overflow-y-auto">
                        @forelse($this->getUnpairedPhotos() as $photo)
                            <button
                                wire:click="selectPhoto('{{ $photo->id }}')"
                                class="relative aspect-square rounded-lg overflow-hidden group {{ $selectedPhotoId === $photo->id ? 'ring-4 ring-primary-500' : 'ring-1 ring-gray-200 dark:ring-gray-700' }}"
                            >
                                <img
                                    src="{{ $photo->url }}"
                                    alt="{{ $photo->name ?: 'Photo' }}"
                                    class="w-full h-full object-cover"
                                />
                                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                                @if($selectedPhotoId === $photo->id)
                                    <div class="absolute inset-0 bg-primary-500/30 flex items-center justify-center">
                                        <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                                            <x-heroicon-s-check class="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                @endif
                            </button>
                        @empty
                            <div class="col-span-2 p-8 text-center text-gray-500 dark:text-gray-400">
                                <x-heroicon-o-photo class="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No unpaired photos</p>
                            </div>
                        @endforelse
                    </div>
                </div>
            </div>

            {{-- Paired Items Section --}}
            @if($this->getPairedItems()->count() > 0)
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div class="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-green-200 dark:border-green-800">
                        <h3 class="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                            <x-heroicon-o-link class="w-5 h-5" />
                            Paired Items
                            <span class="ml-auto bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs font-medium px-2 py-1 rounded-full">
                                {{ $this->getPairedItems()->count() }}
                            </span>
                        </h3>
                    </div>
                    <div class="divide-y divide-gray-200 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
                        @foreach($this->getPairedItems() as $review)
                            <div class="p-4 flex items-start gap-4">
                                {{-- Photo Thumbnail --}}
                                <div class="shrink-0">
                                    <img
                                        src="{{ $review->photo->url }}"
                                        alt=""
                                        class="w-20 h-20 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                                    />
                                </div>
                                {{-- Review Content --}}
                                <div class="flex-1 min-w-0">
                                    @if($review->rating)
                                        <div class="flex items-center gap-1 mb-1">
                                            @for($i = 1; $i <= 5; $i++)
                                                <x-heroicon-s-star class="w-3 h-3 {{ $i <= $review->rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600' }}" />
                                            @endfor
                                        </div>
                                    @endif
                                    <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{{ $review->content }}</p>
                                    <div class="flex items-center gap-3 mt-2">
                                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ $review->updated_at->format('M j, Y g:i A') }}</span>
                                        @if($review->is_deployed)
                                            <span class="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                                                <x-heroicon-s-check-circle class="w-3.5 h-3.5" />
                                                Deployed
                                            </span>
                                        @endif
                                    </div>
                                </div>
                                {{-- Unpair Button --}}
                                <button
                                    wire:click="unpair('{{ $review->id }}')"
                                    wire:confirm="Are you sure you want to unpair this review and photo?"
                                    class="shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Unpair"
                                >
                                    <x-heroicon-o-x-mark class="w-5 h-5" />
                                </button>
                            </div>
                        @endforeach
                    </div>
                </div>
            @endif
        @else
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center">
                <x-heroicon-o-building-storefront class="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p class="text-gray-600 dark:text-gray-400">Select a business to start pairing reviews and photos</p>
            </div>
        @endif
    </div>
</x-filament-panels::page>
