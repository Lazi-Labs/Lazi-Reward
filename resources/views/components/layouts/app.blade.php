<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>{{ config('app.name', 'Perfect Catch Rewards') }}</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.bunny.net">
  <link href="https://fonts.bunny.net/css?family=inter:300,400,500,600,700,800&display=swap" rel="stylesheet"/>

  <!-- Scripts -->
  @vite(['resources/css/app.css', 'resources/js/app.js'])
  @fluxAppearance
</head>
<body class="font-sans antialiased bg-zinc-50 dark:bg-zinc-900 min-h-screen">
<div class="min-h-screen flex flex-col">
  <!-- Header with brand gradient accent -->
  <header class="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-50 shadow-sm">
    <div class="h-1 gradient-brand"></div>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
          <flux:icon.gift class="size-5 text-white"/>
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">Perfect Catch</span>
          <span class="text-xs text-zinc-500 dark:text-zinc-400 -mt-0.5">Rewards Program</span>
        </div>
      </a>

      <div class="flex items-center gap-4">
        @auth
          <a href="{{ route('dashboard') }}" class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Dashboard
          </a>
          <form action="{{ route('logout') }}" method="POST" class="inline">
            @csrf
            <button type="submit" class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Logout
            </button>
          </form>
        @else
          <a href="{{ route('login') }}" class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Login
          </a>
          <a href="{{ route('register') }}" class="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-[#1e3a5f] to-[#ff6b35] text-white hover:opacity-90 transition-opacity">
            Sign Up
          </a>
        @endauth
      </div>
    </div>
  </header>

  <!-- Hero Section with Gradient -->
  @if(!request()->is('login', 'register', 'upload/*'))
  <div class="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#2d5a8f] to-[#ff6b35]">
    <!-- Mesh gradient overlay -->
    <div class="absolute inset-0 mesh-gradient opacity-50"></div>

    <!-- Decorative blurs -->
    <div class="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

    <div class="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div class="text-center"
           x-data="{ show: false }"
           x-init="setTimeout(() => show = true, 100)"
           x-show="show"
           x-transition:enter="transition ease-out duration-700"
           x-transition:enter-start="opacity-0 transform translate-y-8"
           x-transition:enter-end="opacity-100 transform translate-y-0">

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
          Get Rewarded for Your Reviews
        </h1>

        <p class="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-8">
          Share your experience and earn gift cards from your favorite brands
        </p>

        <!-- Trust badges -->
        <div class="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm">
          <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <flux:icon.shield-check class="size-5 text-green-400"/>
            <span class="text-white/90">Secure & Verified</span>
          </div>
          <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <flux:icon.users class="size-5 text-blue-300"/>
            <span class="text-white/90">500+ Happy Customers</span>
          </div>
          <div class="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <flux:icon.gift class="size-5 text-orange-300"/>
            <span class="text-white/90">$50,000+ in Rewards</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  @endif

  <!-- Main Content -->
  <main class="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
    {{ $slot }}
  </main>

  <!-- Footer -->
  <footer class="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white border-t border-zinc-700">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <!-- Company Info -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <flux:icon.gift class="size-5 text-white"/>
            </div>
            <div>
              <h3 class="font-bold">Perfect Catch</h3>
              <p class="text-xs text-zinc-400">Rewards Program</p>
            </div>
          </div>
          <p class="text-sm text-zinc-400">
            Rewarding our valued customers for sharing their experiences.
          </p>
        </div>

        <!-- Partner Businesses -->
        <div class="space-y-4">
          <h4 class="text-sm font-semibold text-zinc-300">Our Businesses</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <a href="https://perfectcatchelectric.com" target="_blank" class="text-zinc-400 hover:text-[#ff6b35] transition-colors flex items-center gap-2">
                <flux:icon.bolt class="size-4"/>
                Perfect Catch Electric
              </a>
            </li>
            <li>
              <a href="https://livpoolsfl.com" target="_blank" class="text-zinc-400 hover:text-[#ff6b35] transition-colors flex items-center gap-2">
                {{-- Waves icon for LIV Pools --}}
                <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                </svg>
                LIV Pools Florida
              </a>
            </li>
          </ul>
        </div>

        <!-- Quick Links -->
        <div class="space-y-4">
          <h4 class="text-sm font-semibold text-zinc-300">Quick Links</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/" class="text-zinc-400 hover:text-[#ff6b35] transition-colors">Home</a></li>
            <li><a href="/faq" class="text-zinc-400 hover:text-[#ff6b35] transition-colors">FAQ</a></li>
            <li><a href="/contact" class="text-zinc-400 hover:text-[#ff6b35] transition-colors">Contact</a></li>
          </ul>
        </div>

        <!-- Trust & Security -->
        <div class="space-y-4">
          <h4 class="text-sm font-semibold text-zinc-300">Trust & Security</h4>
          <div class="space-y-3 text-sm text-zinc-400">
            <div class="flex items-center gap-2">
              <flux:icon.shield-check class="size-5 text-green-400 flex-shrink-0"/>
              <span>SSL Secured</span>
            </div>
            <div class="flex items-center gap-2">
              <flux:icon.check-badge class="size-5 text-blue-400 flex-shrink-0"/>
              <span>Verified Business</span>
            </div>
            <div class="flex items-center gap-2">
              <flux:icon.document-check class="size-5 text-orange-400 flex-shrink-0"/>
              <span>Licensed & Insured</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-8 border-t border-zinc-700 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-zinc-400">
        <p>&copy; {{ date('Y') }} Perfect Catch AI. All rights reserved.</p>
        <div class="flex items-center gap-6">
          <a href="/privacy" class="hover:text-[#ff6b35] transition-colors">Privacy Policy</a>
          <a href="/terms" class="hover:text-[#ff6b35] transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>
</div>

@persist('toast')
    <flux:toast />
@endpersist

@fluxScripts
</body>
</html>
