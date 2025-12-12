<div class="w-full">
  <div class="mb-4">
    <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
      Choose Your Reward <span class="text-red-500">*</span>
    </label>
    @error('selectedGiftCard')
      <p class="text-sm text-red-500 mb-2">{{ $message }}</p>
    @enderror
  </div>

  @if (count($products) > 0)
    <div
      x-data="{
        currentIndex: 0,
        products: @js($products),
        selectedId: @entangle('selectedGiftCard'),
        autoplayInterval: null,
        itemsPerView: 3,
        
        init() {
          this.updateItemsPerView();
          window.addEventListener('resize', () => this.updateItemsPerView());
        },
        
        updateItemsPerView() {
          if (window.innerWidth < 640) {
            this.itemsPerView = 1;
          } else if (window.innerWidth < 768) {
            this.itemsPerView = 2;
          } else {
            this.itemsPerView = 3;
          }
        },
        
        get maxIndex() {
          return Math.max(0, this.products.length - this.itemsPerView);
        },
        
        next() {
          if (this.currentIndex < this.maxIndex) {
            this.currentIndex++;
          } else {
            this.currentIndex = 0;
          }
        },
        
        prev() {
          if (this.currentIndex > 0) {
            this.currentIndex--;
          } else {
            this.currentIndex = this.maxIndex;
          }
        },
        
        select(id) {
          this.selectedId = id;
        },
        
        get translateX() {
          const itemWidth = 100 / this.itemsPerView;
          return this.currentIndex * itemWidth;
        }
      }"
      class="relative"
    >
      {{-- Navigation Arrows --}}
      <button
        type="button"
        @click="prev()"
        class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <flux:icon.chevron-left class="size-4" />
      </button>
      
      <button
        type="button"
        @click="next()"
        class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <flux:icon.chevron-right class="size-4" />
      </button>

      {{-- Carousel Container --}}
      <div class="overflow-hidden mx-4">
        <div
          class="flex transition-transform duration-500 ease-out"
          :style="{ transform: `translateX(-${translateX}%)` }"
        >
          @foreach ($products as $product)
            <div
              class="flex-shrink-0 px-2"
              :style="{ width: `${100 / itemsPerView}%` }"
            >
              <button
                type="button"
                @click="select('{{ $product['id'] }}')"
                class="w-full group rounded-xl border-2 overflow-hidden transition-all duration-300 h-full text-left"
                :class="selectedId === '{{ $product['id'] }}' 
                  ? 'border-accent bg-accent/5 ring-2 ring-accent ring-offset-2 dark:ring-offset-zinc-900' 
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-accent/50 hover:shadow-lg'"
              >
                {{-- Product Image --}}
                <div class="relative aspect-[3/2] bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-700 dark:to-zinc-800 overflow-hidden flex items-center justify-center p-4">
                  @if ($product['image_url'])
                    <img
                      src="{{ $product['image_url'] }}"
                      alt="{{ $product['name'] }}"
                      class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  @else
                    <flux:icon.gift class="size-12 text-zinc-400 dark:text-zinc-500" />
                  @endif
                  
                  {{-- Selected Checkmark --}}
                  <div
                    x-show="selectedId === '{{ $product['id'] }}'"
                    x-transition
                    class="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center"
                  >
                    <flux:icon.check class="size-4 text-white" />
                  </div>
                </div>
                
                {{-- Product Info --}}
                <div class="p-3">
                  <h3 class="font-semibold text-zinc-900 dark:text-white text-sm line-clamp-1" :class="selectedId === '{{ $product['id'] }}' ? 'text-accent' : ''">
                    {{ $product['name'] }}
                  </h3>
                  <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {{ $product['value_range'] }}
                  </p>
                </div>
              </button>
            </div>
          @endforeach
        </div>
      </div>

      {{-- Pagination Dots --}}
      <div class="flex justify-center gap-1.5 mt-4">
        <template x-for="(_, index) in Math.ceil(products.length / itemsPerView)" :key="index">
          <button
            type="button"
            @click="currentIndex = index * itemsPerView"
            class="w-2 h-2 rounded-full transition-all duration-300"
            :class="Math.floor(currentIndex / itemsPerView) === index ? 'bg-accent w-4' : 'bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500'"
          ></button>
        </template>
      </div>
    </div>
  @else
    {{-- Fallback to simple select --}}
    <flux:select wire:model.live="selectedGiftCard" placeholder="Select a gift card...">
      @foreach ($products as $product)
        <flux:select.option value="{{ $product['id'] }}">{{ $product['name'] }}</flux:select.option>
      @endforeach
    </flux:select>
  @endif
</div>
