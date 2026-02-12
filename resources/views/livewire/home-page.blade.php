<div>
  <!-- Hero Section -->
  <section class="relative pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#2d5a8f] to-[#ff6b35]"></div>
    <div class="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10"></div>

    <!-- Decorative elements -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Earn Rewards for<br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-yellow-300">Reviews & Referrals</span>
        </h1>
        <p class="text-xl text-white/90 max-w-2xl mx-auto mb-8">
          Get gift cards when you leave a review or refer someone to Perfect Catch Electric or LIV Pools
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="{{ route('register') }}" class="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full bg-white text-[#1e3a5f] hover:bg-zinc-100 transition-colors shadow-xl">
            <flux:icon.gift class="size-5 mr-2"/>
            Start Earning Now
          </a>
          <a href="#how-it-works" class="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full bg-white/10 text-white border border-white/30 hover:bg-white/20 transition-colors">
            Learn How It Works
          </a>
        </div>

        <!-- Stats -->
        <div class="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-bold text-white">$50K+</div>
            <div class="text-white/70 text-sm mt-1">Rewards Given</div>
          </div>
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-bold text-white">500+</div>
            <div class="text-white/70 text-sm mt-1">Happy Customers</div>
          </div>
          <div class="text-center">
            <div class="text-3xl sm:text-4xl font-bold text-white">$25</div>
            <div class="text-white/70 text-sm mt-1">Per Review</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Two Ways to Earn Section -->
  <section class="py-16 sm:py-24 bg-zinc-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">Two Ways to Earn</h2>
        <p class="text-lg text-zinc-600 max-w-2xl mx-auto">Choose how you want to earn rewards - leave a review or refer a friend</p>
      </div>

      <div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <!-- Reviews Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-zinc-200 hover:border-orange-300 transition-colors group">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <flux:icon.star class="size-8 text-white"/>
          </div>
          <h3 class="text-2xl font-bold text-zinc-900 mb-3">Leave a Review</h3>
          <p class="text-zinc-600 mb-6">Already a customer? Share your experience on Google and earn a $25 gift card.</p>

          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-3 text-sm text-zinc-600">
              <flux:icon.check-circle class="size-5 text-green-500 flex-shrink-0"/>
              <span>Write a Google review</span>
            </li>
            <li class="flex items-center gap-3 text-sm text-zinc-600">
              <flux:icon.check-circle class="size-5 text-green-500 flex-shrink-0"/>
              <span>Upload a screenshot</span>
            </li>
            <li class="flex items-center gap-3 text-sm text-zinc-600">
              <flux:icon.check-circle class="size-5 text-green-500 flex-shrink-0"/>
              <span>Get your gift card instantly</span>
            </li>
          </ul>

          <a href="{{ route('review.start') }}" class="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity">
            Leave a Review
            <flux:icon.arrow-right class="size-5 ml-2"/>
          </a>
        </div>

        <!-- Referrals Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-zinc-200 hover:border-blue-300 transition-colors group">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <flux:icon.user-group class="size-8 text-white"/>
          </div>
          <h3 class="text-2xl font-bold text-zinc-900 mb-3">Refer a Friend</h3>
          <p class="text-zinc-600 mb-6">Know someone who needs our services? Refer them and earn up to $500!</p>

          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-3 text-sm text-zinc-600">
              <flux:icon.check-circle class="size-5 text-green-500 flex-shrink-0"/>
              <span>Submit referral details</span>
            </li>
            <li class="flex items-center gap-3 text-sm text-zinc-600">
              <flux:icon.check-circle class="size-5 text-green-500 flex-shrink-0"/>
              <span>We contact them for the job</span>
            </li>
            <li class="flex items-center gap-3 text-sm text-zinc-600">
              <flux:icon.check-circle class="size-5 text-green-500 flex-shrink-0"/>
              <span>Get paid when job completes</span>
            </li>
          </ul>

          @auth
            <a href="{{ route('referrals.submit') }}" class="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity">
              Submit a Referral
              <flux:icon.arrow-right class="size-5 ml-2"/>
            </a>
          @else
            <a href="{{ route('register') }}" class="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity">
              Sign Up to Refer
              <flux:icon.arrow-right class="size-5 ml-2"/>
            </a>
          @endauth
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section id="how-it-works" class="py-16 sm:py-24 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">How It Works</h2>
        <p class="text-lg text-zinc-600">Simple steps to start earning rewards</p>
      </div>

      <div class="grid md:grid-cols-4 gap-8">
        <!-- Step 1 -->
        <div class="text-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
            1
          </div>
          <h3 class="text-lg font-semibold text-zinc-900 mb-2">Create Account</h3>
          <p class="text-zinc-600 text-sm">Sign up with your email to track your rewards and referrals</p>
        </div>

        <!-- Step 2 -->
        <div class="text-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#2d5a8f] to-[#4a7ab8] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
            2
          </div>
          <h3 class="text-lg font-semibold text-zinc-900 mb-2">Choose Your Reward</h3>
          <p class="text-zinc-600 text-sm">Leave a review for $25 or refer friends for up to $500 per job</p>
        </div>

        <!-- Step 3 -->
        <div class="text-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#4a7ab8] to-[#ff6b35] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
            3
          </div>
          <h3 class="text-lg font-semibold text-zinc-900 mb-2">Complete Action</h3>
          <p class="text-zinc-600 text-sm">Submit your review screenshot or referral information</p>
        </div>

        <!-- Step 4 -->
        <div class="text-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff8c5a] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
            4
          </div>
          <h3 class="text-lg font-semibold text-zinc-900 mb-2">Get Paid</h3>
          <p class="text-zinc-600 text-sm">Receive your gift card via email - choose from Amazon, Visa, and more</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Referral Rewards Section -->
  <section class="py-16 sm:py-24 bg-zinc-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">Referral Rewards by Job Type</h2>
        <p class="text-lg text-zinc-600">Earn more for bigger jobs</p>
      </div>

      <div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        @foreach($this->businesses as $business)
          <div class="bg-white rounded-2xl shadow-lg p-6 border border-zinc-200">
            <div class="flex items-center gap-3 mb-6">
              @if($business->icon)
                <span class="text-3xl">{{ $business->icon }}</span>
              @endif
              <h3 class="text-xl font-bold text-zinc-900">{{ $business->name }}</h3>
            </div>

            <div class="space-y-3">
              @foreach($business->jobTypes()->active()->ordered()->get() as $jobType)
                <div class="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                  <span class="text-zinc-700">{{ $jobType->name }}</span>
                  <span class="font-bold text-green-600">{{ $jobType->formatted_reward }}</span>
                </div>
              @endforeach
            </div>
          </div>
        @endforeach
      </div>
    </div>
  </section>

  <!-- Gift Card Options Section -->
  <section class="py-16 sm:py-24 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">Choose Your Gift Card</h2>
        <p class="text-lg text-zinc-600">Get rewarded with your favorite brands</p>
      </div>

      <div class="flex flex-wrap justify-center gap-6">
        <div class="w-32 h-20 bg-zinc-100 rounded-xl flex items-center justify-center p-4">
          <img src="https://logo.clearbit.com/amazon.com" alt="Amazon" class="max-h-10 max-w-full object-contain">
        </div>
        <div class="w-32 h-20 bg-zinc-100 rounded-xl flex items-center justify-center p-4">
          <img src="https://logo.clearbit.com/visa.com" alt="Visa" class="max-h-10 max-w-full object-contain">
        </div>
        <div class="w-32 h-20 bg-zinc-100 rounded-xl flex items-center justify-center p-4">
          <img src="https://logo.clearbit.com/paypal.com" alt="PayPal" class="max-h-10 max-w-full object-contain">
        </div>
        <div class="w-32 h-20 bg-zinc-100 rounded-xl flex items-center justify-center p-4">
          <img src="https://logo.clearbit.com/starbucks.com" alt="Starbucks" class="max-h-10 max-w-full object-contain">
        </div>
        <div class="w-32 h-20 bg-zinc-100 rounded-xl flex items-center justify-center p-4">
          <img src="https://logo.clearbit.com/target.com" alt="Target" class="max-h-10 max-w-full object-contain">
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-16 sm:py-24 bg-gradient-to-br from-[#1e3a5f] to-[#ff6b35]">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Start Earning?</h2>
      <p class="text-xl text-white/90 mb-8">Join hundreds of happy customers already earning rewards</p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="{{ route('register') }}" class="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full bg-white text-[#1e3a5f] hover:bg-zinc-100 transition-colors shadow-xl">
          Create Free Account
        </a>
        <a href="{{ route('login') }}" class="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full bg-transparent text-white border-2 border-white hover:bg-white/10 transition-colors">
          Sign In
        </a>
      </div>
    </div>
  </section>
</div>
