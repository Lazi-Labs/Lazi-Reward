<div class="min-h-screen bg-zinc-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
        {{-- Header --}}
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-2xl font-bold text-zinc-900">My Referrals</h1>
                <p class="text-zinc-600 mt-1">Track your job referrals and earnings</p>
            </div>
            <flux:button href="{{ route('referrals.submit') }}" variant="primary">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                New Referral
            </flux:button>
        </div>

        {{-- Stats Cards --}}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
                <div class="text-sm text-zinc-500">Total Referrals</div>
                <div class="text-2xl font-bold text-zinc-900">{{ $this->stats['total_referrals'] }}</div>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
                <div class="text-sm text-zinc-500">In Progress</div>
                <div class="text-2xl font-bold text-blue-600">{{ $this->stats['pending'] + $this->stats['in_progress'] }}</div>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
                <div class="text-sm text-zinc-500">Completed</div>
                <div class="text-2xl font-bold text-green-600">{{ $this->stats['completed'] }}</div>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
                <div class="text-sm text-zinc-500">Total Earned</div>
                <div class="text-2xl font-bold text-green-600">${{ number_format($this->stats['total_earned'], 2) }}</div>
            </div>
        </div>

        {{-- Pending Earnings Notice --}}
        @if($this->stats['pending_earnings'] > 0)
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                <svg class="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <div class="text-sm font-medium text-yellow-800">
                        You have ${{ number_format($this->stats['pending_earnings'], 2) }} in pending earnings
                    </div>
                    <div class="text-xs text-yellow-600">
                        These rewards will be sent once processed by the admin team.
                    </div>
                </div>
            </div>
        @endif

        {{-- Filter --}}
        <div class="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
                <h2 class="font-medium text-zinc-900">Referral History</h2>
                <div class="flex items-center gap-2">
                    <label class="text-sm text-zinc-500">Filter:</label>
                    <select
                        wire:model.live="statusFilter"
                        class="text-sm border-zinc-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All Statuses</option>
                        @foreach($statuses as $value => $label)
                            <option value="{{ $value }}">{{ $label }}</option>
                        @endforeach
                    </select>
                </div>
            </div>

            {{-- Referral List --}}
            @if($this->referrals->isEmpty())
                <div class="p-8 text-center">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 flex items-center justify-center">
                        <svg class="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-medium text-zinc-900 mb-1">No referrals yet</h3>
                    <p class="text-zinc-500 mb-4">Start earning by submitting your first referral!</p>
                    <flux:button href="{{ route('referrals.submit') }}" variant="primary">
                        Submit a Referral
                    </flux:button>
                </div>
            @else
                <div class="divide-y divide-zinc-100">
                    @foreach($this->referrals as $referral)
                        <div class="p-4 hover:bg-zinc-50 transition-colors">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium text-zinc-900">{{ $referral->referred_name }}</span>
                                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
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
                                    </div>
                                    <div class="text-sm text-zinc-500 mt-1">
                                        {{ $referral->business->name }} &bull; {{ $referral->jobType->name }}
                                    </div>
                                    <div class="text-xs text-zinc-400 mt-1">
                                        Submitted {{ $referral->created_at->diffForHumans() }}
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-semibold {{ $referral->reward_status === 'sent' ? 'text-green-600' : 'text-zinc-400' }}">
                                        {{ $referral->formatted_reward }}
                                    </div>
                                    @if($referral->reward_status === 'sent')
                                        <div class="text-xs text-green-600">Paid</div>
                                    @elseif($referral->status === 'completed')
                                        <div class="text-xs text-yellow-600">Pending payment</div>
                                    @endif
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>

                {{-- Pagination --}}
                @if($this->referrals->hasPages())
                    <div class="px-4 py-3 border-t border-zinc-200">
                        {{ $this->referrals->links() }}
                    </div>
                @endif
            @endif
        </div>
    </div>
</div>
