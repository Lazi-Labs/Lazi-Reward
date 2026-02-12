<div class="min-h-screen bg-zinc-50 py-8">
    <div class="max-w-5xl mx-auto px-4">
        {{-- Header --}}
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-bold text-zinc-900">Welcome back, {{ $user->name }}</h1>
                <p class="text-zinc-600 mt-1">Track your referrals and rewards</p>
            </div>
            <div class="flex items-center gap-3">
                <form action="{{ route('logout') }}" method="POST">
                    @csrf
                    <flux:button type="submit" variant="ghost" size="sm">
                        Sign Out
                    </flux:button>
                </form>
            </div>
        </div>

        {{-- Total Earnings Card --}}
        <div class="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-green-100 text-sm font-medium">Total Earnings</p>
                    <p class="text-4xl font-bold mt-1">${{ number_format($this->referralStats['total_earned'], 2) }}</p>
                    @if($this->referralStats['pending_earnings'] > 0)
                        <p class="text-green-200 text-sm mt-2">
                            + ${{ number_format($this->referralStats['pending_earnings'], 2) }} pending
                        </p>
                    @endif
                </div>
                <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
        </div>

        {{-- Quick Actions --}}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <a href="{{ route('referrals.submit') }}" class="bg-white rounded-xl border border-zinc-200 p-6 hover:border-blue-300 hover:shadow-md transition-all group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 class="font-semibold text-zinc-900">Submit a Referral</h3>
                        <p class="text-sm text-zinc-500">Earn rewards for job referrals</p>
                    </div>
                </div>
            </a>

            <a href="{{ route('home') }}" class="bg-white rounded-xl border border-zinc-200 p-6 hover:border-amber-300 hover:shadow-md transition-all group">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                        <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </div>
                    <div>
                        <h3 class="font-semibold text-zinc-900">Leave a Review</h3>
                        <p class="text-sm text-zinc-500">Get a gift card for your review</p>
                    </div>
                </div>
            </a>
        </div>

        {{-- Stats Grid --}}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-xl border border-zinc-200 p-4">
                <p class="text-sm text-zinc-500">Total Referrals</p>
                <p class="text-2xl font-bold text-zinc-900">{{ $this->referralStats['total_referrals'] }}</p>
            </div>
            <div class="bg-white rounded-xl border border-zinc-200 p-4">
                <p class="text-sm text-zinc-500">Pending</p>
                <p class="text-2xl font-bold text-yellow-600">{{ $this->referralStats['pending'] }}</p>
            </div>
            <div class="bg-white rounded-xl border border-zinc-200 p-4">
                <p class="text-sm text-zinc-500">In Progress</p>
                <p class="text-2xl font-bold text-blue-600">{{ $this->referralStats['in_progress'] }}</p>
            </div>
            <div class="bg-white rounded-xl border border-zinc-200 p-4">
                <p class="text-sm text-zinc-500">Completed</p>
                <p class="text-2xl font-bold text-green-600">{{ $this->referralStats['completed'] }}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {{-- Recent Referrals --}}
            <div class="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                    <h2 class="font-semibold text-zinc-900">Recent Referrals</h2>
                    <a href="{{ route('referrals.dashboard') }}" class="text-sm text-blue-600 hover:text-blue-700">
                        View All
                    </a>
                </div>
                @if($this->recentReferrals->isEmpty())
                    <div class="p-6 text-center">
                        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 flex items-center justify-center">
                            <svg class="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p class="text-zinc-500 text-sm">No referrals yet</p>
                        <a href="{{ route('referrals.submit') }}" class="text-blue-600 text-sm hover:underline mt-1 inline-block">
                            Submit your first referral
                        </a>
                    </div>
                @else
                    <div class="divide-y divide-zinc-100">
                        @foreach($this->recentReferrals as $referral)
                            <div class="px-6 py-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="font-medium text-zinc-900">{{ $referral->referred_name }}</p>
                                        <p class="text-sm text-zinc-500">{{ $referral->business->name }} - {{ $referral->jobType->name }}</p>
                                    </div>
                                    <div class="text-right">
                                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                            @switch($referral->status)
                                                @case('pending') bg-gray-100 text-gray-700 @break
                                                @case('contacted') bg-blue-100 text-blue-700 @break
                                                @case('hired') bg-yellow-100 text-yellow-700 @break
                                                @case('completed') bg-green-100 text-green-700 @break
                                                @case('rejected') bg-red-100 text-red-700 @break
                                            @endswitch
                                        ">
                                            {{ ucfirst($referral->status) }}
                                        </span>
                                        <p class="text-sm font-medium {{ $referral->reward_status === 'sent' ? 'text-green-600' : 'text-zinc-400' }} mt-1">
                                            {{ $referral->formatted_reward }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>

            {{-- Recent Reviews --}}
            <div class="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div class="px-6 py-4 border-b border-zinc-100">
                    <h2 class="font-semibold text-zinc-900">Recent Reviews</h2>
                </div>
                @if($this->recentSubmissions->isEmpty())
                    <div class="p-6 text-center">
                        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 flex items-center justify-center">
                            <svg class="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </div>
                        <p class="text-zinc-500 text-sm">No reviews yet</p>
                        <a href="{{ route('home') }}" class="text-blue-600 text-sm hover:underline mt-1 inline-block">
                            Submit your first review
                        </a>
                    </div>
                @else
                    <div class="divide-y divide-zinc-100">
                        @foreach($this->recentSubmissions as $submission)
                            <div class="px-6 py-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="font-medium text-zinc-900">{{ $submission->business?->name ?? 'Review' }}</p>
                                        <p class="text-sm text-zinc-500">{{ $submission->created_at->diffForHumans() }}</p>
                                    </div>
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                        @if($submission->verification_status === 'verified')
                                            bg-green-100 text-green-700
                                        @elseif($submission->status === 'completed')
                                            bg-yellow-100 text-yellow-700
                                        @else
                                            bg-gray-100 text-gray-700
                                        @endif
                                    ">
                                        @if($submission->verification_status === 'verified')
                                            Verified
                                        @elseif($submission->status === 'completed')
                                            Pending Review
                                        @else
                                            {{ ucfirst($submission->status) }}
                                        @endif
                                    </span>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>
