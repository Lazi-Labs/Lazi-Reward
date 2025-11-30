<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>{{ config('app.name', 'Lazi Rewards') }}</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.bunny.net">
  <link href="https://fonts.bunny.net/css?family=inter:400,500,600&display=swap" rel="stylesheet"/>

  <!-- Scripts -->
  @vite(['resources/css/app.css', 'resources/js/app.js'])
  @fluxAppearance
</head>
<body class="font-sans antialiased bg-zinc-50 dark:bg-zinc-900 min-h-screen">
<div class="min-h-screen flex flex-col">
  <!-- Header -->
  <header class="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <flux:icon.star class="size-6 text-primary" variant="solid"/>
        <span class="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">Lazi Rewards</span>
      </div>

      {{--      <x-dark-mode-toggle />--}}
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-4 py-4 sm:py-12">
    {{ $slot }}
  </main>

  <!-- Footer -->
  {{--  <footer class="w-full py-6">--}}
  {{--    <x-footer-badges/>--}}
  {{--  </footer>--}}
</div>

@persist('toast')
    <flux:toast />
@endpersist

@fluxScripts
</body>
</html>
