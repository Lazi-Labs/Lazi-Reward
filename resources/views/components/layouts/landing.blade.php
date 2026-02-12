<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>{{ config('app.name', 'Perfect Catch Rewards') }} - Earn Rewards for Reviews & Referrals</title>
  <meta name="description" content="Earn gift cards for leaving reviews and referring friends to Perfect Catch Electric and LIV Pools.">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.bunny.net">
  <link href="https://fonts.bunny.net/css?family=inter:300,400,500,600,700,800&display=swap" rel="stylesheet"/>

  <!-- Scripts -->
  @vite(['resources/css/app.css', 'resources/js/app.js'])
  @fluxAppearance
</head>
<body class="font-sans antialiased bg-white min-h-screen">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <a href="/" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#ff6b35] flex items-center justify-center shadow-md">
            <flux:icon.gift class="size-5 text-white"/>
          </div>
          <div class="hidden sm:block">
            <span class="font-bold text-lg text-zinc-900">Perfect Catch</span>
            <span class="text-zinc-500 text-sm ml-1">Rewards</span>
          </div>
        </a>

        <div class="flex items-center gap-4">
          @auth
            <a href="{{ route('dashboard') }}" class="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Dashboard
            </a>
            <form action="{{ route('logout') }}" method="POST" class="inline">
              @csrf
              <button type="submit" class="text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
                Logout
              </button>
            </form>
          @else
            <a href="{{ route('login') }}" class="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Login
            </a>
            <a href="{{ route('register') }}" class="text-sm font-medium px-4 py-2 rounded-full bg-gradient-to-r from-[#1e3a5f] to-[#ff6b35] text-white hover:opacity-90 transition-opacity shadow-md">
              Get Started
            </a>
          @endauth
        </div>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <main>
    {{ $slot }}
  </main>

  <!-- Footer -->
  <footer class="bg-zinc-900 text-white py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#ff6b35] flex items-center justify-center">
              <flux:icon.gift class="size-5 text-white"/>
            </div>
            <span class="font-bold text-lg">Perfect Catch Rewards</span>
          </div>
          <p class="text-zinc-400 text-sm">
            Rewarding our valued customers for sharing their experiences and referring friends.
          </p>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Our Businesses</h4>
          <ul class="space-y-2 text-sm text-zinc-400">
            <li><a href="https://perfectcatchelectric.com" target="_blank" class="hover:text-white transition-colors">Perfect Catch Electric</a></li>
            <li><a href="https://livpoolsfl.com" target="_blank" class="hover:text-white transition-colors">LIV Pools Florida</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Contact</h4>
          <p class="text-sm text-zinc-400">Questions? Email us at<br><a href="mailto:rewards@perfectcatchai.com" class="text-white hover:underline">rewards@perfectcatchai.com</a></p>
        </div>
      </div>
      <div class="mt-8 pt-8 border-t border-zinc-800 text-center text-sm text-zinc-500">
        &copy; {{ date('Y') }} Perfect Catch AI. All rights reserved.
      </div>
    </div>
  </footer>

@persist('toast')
  <flux:toast />
@endpersist

@fluxScripts
</body>
</html>
