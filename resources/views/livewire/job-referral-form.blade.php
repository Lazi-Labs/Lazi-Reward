<div class="min-h-screen bg-zinc-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
        @if($submitted)
            {{-- Success State --}}
            <div class="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>

                <h2 class="text-2xl font-bold text-zinc-900 mb-2">Referral Submitted!</h2>
                <p class="text-zinc-600 mb-6">
                    Thank you for referring <strong>{{ $createdReferral->referred_name }}</strong>.
                    We'll reach out to them soon!
                </p>

                <div class="bg-zinc-50 rounded-lg p-4 mb-6 text-left">
                    <h3 class="font-medium text-zinc-900 mb-2">Referral Details</h3>
                    <dl class="space-y-1 text-sm">
                        <div class="flex justify-between">
                            <dt class="text-zinc-500">Business</dt>
                            <dd class="text-zinc-900">{{ $createdReferral->business->name }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-zinc-500">Job Type</dt>
                            <dd class="text-zinc-900">{{ $createdReferral->jobType->name }}</dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-zinc-500">Potential Reward</dt>
                            <dd class="text-green-600 font-semibold">{{ $createdReferral->formatted_reward }}</dd>
                        </div>
                    </dl>
                </div>

                <p class="text-sm text-zinc-500 mb-6">
                    You'll receive your reward once the job is completed. Track your referrals in your dashboard.
                </p>

                <div class="flex gap-3 justify-center">
                    <flux:button wire:click="submitAnother" variant="outline">
                        Submit Another Referral
                    </flux:button>
                    <flux:button href="{{ route('referrals.dashboard') }}" variant="primary">
                        View Dashboard
                    </flux:button>
                </div>
            </div>
        @else
            {{-- Form State --}}
            <div class="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <h1 class="text-xl font-bold text-white">Submit a Job Referral</h1>
                    <p class="text-blue-100 text-sm mt-1">Earn rewards when your referral leads to a completed job!</p>
                </div>

                <form wire:submit="submit" class="p-6 space-y-6">
                    {{-- Business Selection --}}
                    <div>
                        <flux:label for="business" required>Select Business</flux:label>
                        <div class="mt-2 grid gap-3">
                            @foreach($this->businesses as $business)
                                <label
                                    class="relative flex items-center p-4 border rounded-lg cursor-pointer transition-all
                                        {{ $businessId === $business->id
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                            : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50' }}"
                                >
                                    <input
                                        type="radio"
                                        wire:model.live="businessId"
                                        value="{{ $business->id }}"
                                        class="sr-only"
                                    >
                                    <div class="flex items-center gap-3 w-full">
                                        @if($business->icon)
                                            <span class="text-2xl">{{ $business->icon }}</span>
                                        @endif
                                        <div class="flex-1">
                                            <div class="font-medium text-zinc-900">{{ $business->name }}</div>
                                            @if($business->description)
                                                <div class="text-sm text-zinc-500">{{ $business->description }}</div>
                                            @endif
                                        </div>
                                        @if($businessId === $business->id)
                                            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                            </svg>
                                        @endif
                                    </div>
                                </label>
                            @endforeach
                        </div>
                        @error('businessId')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    {{-- Job Type Selection --}}
                    @if($businessId)
                        <div wire:transition>
                            <flux:label for="jobType" required>Select Job Type</flux:label>
                            <div class="mt-2 grid gap-2">
                                @foreach($this->jobTypes as $jobType)
                                    <label
                                        class="relative flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all
                                            {{ $jobTypeId === $jobType->id
                                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50' }}"
                                    >
                                        <input
                                            type="radio"
                                            wire:model.live="jobTypeId"
                                            value="{{ $jobType->id }}"
                                            class="sr-only"
                                        >
                                        <div class="flex-1">
                                            <div class="font-medium text-zinc-900">{{ $jobType->name }}</div>
                                            @if($jobType->description)
                                                <div class="text-xs text-zinc-500">{{ $jobType->description }}</div>
                                            @endif
                                        </div>
                                        <div class="ml-4 flex items-center gap-2">
                                            <span class="text-green-600 font-semibold">{{ $jobType->formatted_reward }}</span>
                                            @if($jobTypeId === $jobType->id)
                                                <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                                </svg>
                                            @endif
                                        </div>
                                    </label>
                                @endforeach
                            </div>
                            @error('jobTypeId')
                                <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>
                    @endif

                    {{-- Contact Details --}}
                    @if($jobTypeId)
                        <div wire:transition class="space-y-4">
                            <div class="border-t border-zinc-200 pt-6">
                                <h3 class="font-medium text-zinc-900 mb-4">Person You're Referring</h3>

                                <div class="space-y-4">
                                    <flux:input
                                        wire:model.blur="referredName"
                                        label="Full Name"
                                        placeholder="John Smith"
                                        required
                                    />

                                    <flux:input
                                        wire:model.blur="referredPhone"
                                        label="Phone Number"
                                        placeholder="(555) 123-4567"
                                        required
                                        x-data
                                        x-mask="(999) 999-9999"
                                    />

                                    <flux:input
                                        wire:model.blur="referredEmail"
                                        label="Email Address"
                                        type="email"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            {{-- Reward Preview --}}
                            @if($this->selectedJobType)
                                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div class="text-sm text-green-700">Your potential reward</div>
                                            <div class="text-2xl font-bold text-green-800">{{ $this->selectedJobType->formatted_reward }}</div>
                                        </div>
                                    </div>
                                    <p class="mt-2 text-xs text-green-600">
                                        You'll receive this reward when the job is completed.
                                    </p>
                                </div>
                            @endif

                            <flux:button type="submit" variant="primary" class="w-full">
                                Submit Referral
                            </flux:button>
                        </div>
                    @endif
                </form>
            </div>
        @endif
    </div>
</div>
