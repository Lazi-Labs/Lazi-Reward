<div class="w-full">
  @if (count($products) > 0)
    <div
      x-data="{
        currentIndex: 0,
        products: @js($products),
        autoplayInterval: null,
        itemsPerView: 5,
        
        init() {
          this.updateItemsPerView();
          window.addEventListener('resize', () => this.updateItemsPerView());
          this.startAutoplay();
        },
        
        updateItemsPerView() {
          if (window.innerWidth < 640) {
            this.itemsPerView = 1;
          } else if (window.innerWidth < 768) {
            this.itemsPerView = 2;
          } else if (window.innerWidth < 1024) {
            this.itemsPerView = 3;
          } else if (window.innerWidth < 1280) {
            this.itemsPerView = 4;
          } else {
            this.itemsPerView = 5;
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
        
        goTo(index) {
          this.currentIndex = Math.min(index, this.maxIndex);
        },
        
        startAutoplay() {
          this.autoplayInterval = setInterval(() => this.next(), 4000);
        },
        
        stopAutoplay() {
          if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
          }
        },
        
        get translateX() {
          const itemWidth = 100 / this.itemsPerView;
          return this.currentIndex * itemWidth;
        }
      }"
      @mouseenter="stopAutoplay()"
      @mouseleave="startAutoplay()"
      class="relative"
    >
      {{-- Navigation Arrows --}}
      <button
        @click="prev()"
        class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        :class="{ 'opacity-50': currentIndex === 0 && maxIndex === 0 }"
      >
        <flux:icon.chevron-left class="size-5" />
      </button>
      
      <button
        @click="next()"
        class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        :class="{ 'opacity-50': currentIndex === maxIndex && maxIndex === 0 }"
      >
        <flux:icon.chevron-right class="size-5" />
      </button>

      {{-- Carousel Container --}}
      <div class="overflow-hidden mx-6">
        <div
          class="flex transition-transform duration-500 ease-out"
          :style="{ transform: `translateX(-${translateX}%)` }"
        >
          @foreach ($products as $product)
            <div
              class="flex-shrink-0 px-2"
              :style="{ width: `${100 / itemsPerView}%` }"
            >
              <div class="group bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm hover:shadow-xl hover:border-accent/50 transition-all duration-300 h-full">
                {{-- Product Image --}}
                <div class="relative aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 overflow-hidden">
                  @if ($product['image_url'])
                    <img
                      src="{{ $product['image_url'] }}"
                      alt="{{ $product['name'] }}"
                      class="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  @else
                    <div class="w-full h-full flex items-center justify-center">
                      <flux:icon.gift class="size-16 text-zinc-400 dark:text-zinc-500" />
                    </div>
                  @endif
                  
                  {{-- Category Badge --}}
                  @if ($product['category'])
                    <div class="absolute top-3 left-3">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                        {{ ucfirst($product['category']) }}
                      </span>
                    </div>
                  @endif
                </div>
                
                {{-- Product Info --}}
                <div class="p-4">
                  <h3 class="font-semibold text-zinc-900 dark:text-white text-sm sm:text-base line-clamp-1 group-hover:text-accent transition-colors">
                    {{ $product['name'] }}
                  </h3>
                  
                  @if ($product['description'])
                    <p class="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {{ Str::limit($product['description'], 80) }}
                    </p>
                  @endif
                  
                  <div class="mt-3 flex items-center justify-between">
                    <span class="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      {{ $product['value_range'] }}
                    </span>
                    <span class="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <flux:icon.check-circle class="size-3.5" />
                      Available
                    </span>
                  </div>
                </div>
              </div>
            </div>
          @endforeach
        </div>
      </div>

      {{-- Pagination Dots --}}
      <div class="flex justify-center gap-2 mt-6">
        <template x-for="(_, index) in Math.ceil(products.length / itemsPerView)" :key="index">
          <button
            @click="goTo(index * itemsPerView)"
            class="w-2 h-2 rounded-full transition-all duration-300"
            :class="Math.floor(currentIndex / itemsPerView) === index ? 'bg-accent w-6' : 'bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500'"
          ></button>
        </template>
      </div>
    </div>
  @else
    {{-- Empty State --}}
    <div class="text-center py-12 px-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
      <flux:icon.gift class="size-12 text-zinc-400 dark:text-zinc-500 mx-auto mb-4" />
      <p class="text-zinc-600 dark:text-zinc-400">Gift card catalog is loading...</p>
    </div>
  @endif
</div>
