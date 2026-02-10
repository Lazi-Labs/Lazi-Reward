<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Referral Dashboard</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="antialiased">
    <div class="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto">
            {{-- Header --}}
            <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 class="text-3xl font-bold text-zinc-900 dark:text-white">Your Referral Dashboard</h1>
                        <p class="text-zinc-600 dark:text-zinc-400 mt-1">Share your link and earn ${{ number_format($referrer->campaign->reward_amount, 0) }} for each friend who completes a job!</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            Active Referrer
                        </span>
                    </div>
                </div>
            </div>

            {{-- Stats Grid --}}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {{-- Total Reach --}}
                <div class="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-5">
                    <div class="flex items-center gap-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Reach</p>
                            <p class="text-2xl font-bold text-zinc-900 dark:text-white">{{ number_format($stats['total_reach']) }}</p>
                        </div>
                    </div>
                </div>

                {{-- Total Signups --}}
                <div class="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-5">
                    <div class="flex items-center gap-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Signups</p>
                            <p class="text-2xl font-bold text-zinc-900 dark:text-white">{{ number_format($stats['total_referrals']) }}</p>
                        </div>
                    </div>
                </div>

                {{-- Conversions --}}
                <div class="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-5">
                    <div class="flex items-center gap-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-zinc-500 dark:text-zinc-400">Conversions</p>
                            <p class="text-2xl font-bold text-zinc-900 dark:text-white">{{ number_format($stats['converted_referrals']) }}</p>
                        </div>
                    </div>
                </div>

                {{-- Total Earnings --}}
                <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-sm p-5">
                    <div class="flex items-center gap-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-white/80">Total Earnings</p>
                            <p class="text-2xl font-bold text-white">{{ $stats['formatted_earnings'] }}</p>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Referral Link Section --}}
            <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
                <h2 class="text-xl font-bold text-zinc-900 dark:text-white mb-4">Your Referral Link</h2>
                
                <div class="flex flex-col lg:flex-row gap-6">
                    {{-- Link Input & Copy --}}
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-4">
                            <input 
                                type="text" 
                                value="{{ $stats['referral_link'] }}" 
                                readonly
                                id="referral-link"
                                class="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                            <button 
                                onclick="copyLink()"
                                id="copy-btn"
                                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                </svg>
                                <span id="copy-text">Copy</span>
                            </button>
                        </div>

                        {{-- Share Buttons --}}
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button onclick="shareViaText()" class="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                </svg>
                                <span class="hidden sm:inline">Text</span>
                            </button>
                            <button onclick="shareViaEmail()" class="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                </svg>
                                <span class="hidden sm:inline">Email</span>
                            </button>
                            <button onclick="shareViaWhatsApp()" class="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-xl transition-colors">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                <span class="hidden sm:inline">WhatsApp</span>
                            </button>
                            <button onclick="shareViaFacebook()" class="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl transition-colors">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                <span class="hidden sm:inline">Facebook</span>
                            </button>
                        </div>
                    </div>

                    {{-- QR Code --}}
                    <div class="flex flex-col items-center lg:border-l lg:border-zinc-200 lg:dark:border-zinc-700 lg:pl-6">
                        @if($stats['qr_code_url'])
                            <img src="{{ $stats['qr_code_url'] }}" alt="QR Code" class="w-32 h-32 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white p-2">
                            <a href="{{ route('referrals.qr-download') }}" class="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                </svg>
                                Download QR
                            </a>
                        @else
                            <div class="w-32 h-32 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                                <span class="text-zinc-400 text-sm">No QR</span>
                            </div>
                        @endif
                    </div>
                </div>
            </div>

            {{-- Conversion Rate & Recent Referrals --}}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {{-- Conversion Funnel --}}
                <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6">
                    <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">Conversion Funnel</h3>
                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-zinc-600 dark:text-zinc-400">Clicks</span>
                                <span class="font-medium text-zinc-900 dark:text-white">{{ $stats['total_reach'] }}</span>
                            </div>
                            <div class="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500 rounded-full" style="width: 100%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-zinc-600 dark:text-zinc-400">Signups</span>
                                <span class="font-medium text-zinc-900 dark:text-white">{{ $stats['total_referrals'] }}</span>
                            </div>
                            <div class="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                @php $signupRate = $stats['total_reach'] > 0 ? ($stats['total_referrals'] / $stats['total_reach']) * 100 : 0; @endphp
                                <div class="h-full bg-purple-500 rounded-full" style="width: {{ min($signupRate, 100) }}%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-zinc-600 dark:text-zinc-400">Conversions</span>
                                <span class="font-medium text-zinc-900 dark:text-white">{{ $stats['converted_referrals'] }}</span>
                            </div>
                            <div class="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                @php $conversionRate = $stats['total_referrals'] > 0 ? ($stats['converted_referrals'] / $stats['total_referrals']) * 100 : 0; @endphp
                                <div class="h-full bg-green-500 rounded-full" style="width: {{ min($conversionRate, 100) }}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-zinc-600 dark:text-zinc-400">Conversion Rate</span>
                            <span class="text-lg font-bold text-green-600 dark:text-green-400">{{ $stats['conversion_rate'] }}%</span>
                        </div>
                    </div>
                </div>

                {{-- Recent Referrals --}}
                <div class="lg:col-span-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-6">
                    <h3 class="text-lg font-bold text-zinc-900 dark:text-white mb-4">Recent Referrals</h3>
                    
                    @if(count($stats['recent_referrals']) > 0)
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="border-b border-zinc-200 dark:border-zinc-700">
                                        <th class="text-left py-3 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Name</th>
                                        <th class="text-left py-3 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                                        <th class="text-left py-3 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Signed Up</th>
                                        <th class="text-left py-3 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Converted</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-zinc-200 dark:divide-zinc-700">
                                    @foreach($stats['recent_referrals'] as $referral)
                                        <tr>
                                            <td class="py-3 px-2">
                                                <div class="font-medium text-zinc-900 dark:text-white">{{ $referral['name'] }}</div>
                                                <div class="text-xs text-zinc-500">{{ $referral['email'] }}</div>
                                            </td>
                                            <td class="py-3 px-2">
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    {{ $referral['status'] === 'rewarded' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : '' }}
                                                    {{ $referral['status'] === 'converted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : '' }}
                                                    {{ $referral['status'] === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : '' }}
                                                ">
                                                    {{ ucfirst($referral['status']) }}
                                                </span>
                                            </td>
                                            <td class="py-3 px-2 text-sm text-zinc-600 dark:text-zinc-400">{{ $referral['signed_up_at'] }}</td>
                                            <td class="py-3 px-2 text-sm text-zinc-600 dark:text-zinc-400">{{ $referral['converted_at'] ?? '-' }}</td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                    @else
                        <div class="text-center py-8">
                            <svg class="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                            <p class="text-zinc-500 dark:text-zinc-400">No referrals yet. Start sharing your link!</p>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>

    <script>
        const referralLink = '{{ $stats['referral_link'] }}';
        const rewardAmount = '{{ number_format($referrer->campaign->reward_amount, 0) }}';

        function copyLink() {
            const input = document.getElementById('referral-link');
            input.select();
            input.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(input.value);
            
            const btn = document.getElementById('copy-btn');
            const text = document.getElementById('copy-text');
            text.textContent = 'Copied!';
            btn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            btn.classList.add('bg-green-600');
            
            setTimeout(() => {
                text.textContent = 'Copy';
                btn.classList.remove('bg-green-600');
                btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            }, 2000);
        }

        function shareViaText() {
            const message = `Hey! I've been using this awesome service and thought you'd love it too. Sign up using my link and we both benefit: ${referralLink}`;
            window.location.href = `sms:?body=${encodeURIComponent(message)}`;
        }

        function shareViaEmail() {
            const subject = 'Check out this awesome service!';
            const body = `Hey!\n\nI've been using this service and thought you'd love it too. Sign up using my link and I'll earn $${rewardAmount} when you complete your first job:\n\n${referralLink}\n\nThanks!`;
            window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }

        function shareViaWhatsApp() {
            const message = `Hey! Check out this service. Use my link to sign up: ${referralLink}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        }

        function shareViaFacebook() {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank', 'width=600,height=400');
        }
    </script>
</body>
</html>
