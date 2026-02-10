<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Referral Program</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="antialiased">
    <div class="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full">
            <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 p-8 text-center">
                {{-- Icon --}}
                <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <svg class="w-10 h-10 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                </div>

                {{-- Title --}}
                <h1 class="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                    Referral Program Locked
                </h1>

                {{-- Message --}}
                <p class="text-zinc-600 dark:text-zinc-400 mb-6">
                    {{ $message ?? 'Complete your first job to unlock your referral dashboard and start earning rewards!' }}
                </p>

                {{-- How it works --}}
                <div class="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 mb-6 text-left">
                    <h3 class="font-semibold text-zinc-900 dark:text-white mb-3">How it works:</h3>
                    <ol class="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <li class="flex items-start gap-2">
                            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                            <span>Complete your first job with us</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                            <span>Get your unique referral link</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                            <span>Share with friends & family</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">$</span>
                            <span>Earn <strong>$200</strong> for each friend who completes a job!</span>
                        </li>
                    </ol>
                </div>

                {{-- CTA --}}
                <a href="{{ route('dashboard') }}" class="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
                    Go to Dashboard
                </a>
            </div>
        </div>
    </div>
</body>
</html>
