<div class="flex min-h-[60vh] items-center justify-center">
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
      <div class="text-center mb-8">
        <flux:icon.user-plus class="size-12 text-primary mx-auto mb-4" />
        <flux:heading size="xl">Create Account</flux:heading>
        <flux:text class="text-zinc-500 dark:text-zinc-400 mt-2">
          Sign up to track your reviews and rewards
        </flux:text>
      </div>

      <form wire:submit="register" class="space-y-5">
        <flux:input
          wire:model.blur="name"
          label="Full Name"
          placeholder="John Doe"
          required
          :invalid="$errors->has('name')"
        />
        @error('name')
          <p class="text-sm text-red-600 dark:text-red-400 -mt-3">{{ $message }}</p>
        @enderror

        <flux:input
          wire:model.blur="email"
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          required
          :invalid="$errors->has('email')"
        />
        @error('email')
          <p class="text-sm text-red-600 dark:text-red-400 -mt-3">{{ $message }}</p>
        @enderror

        <flux:input
          wire:model.blur="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          required
          :invalid="$errors->has('password')"
        />
        @error('password')
          <p class="text-sm text-red-600 dark:text-red-400 -mt-3">{{ $message }}</p>
        @enderror

        <flux:input
          wire:model.blur="password_confirmation"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          required
        />

        <flux:button
          type="submit"
          variant="primary"
          class="w-full"
          wire:loading.attr="disabled"
        >
          <span wire:loading.remove wire:target="register">Create Account</span>
          <span wire:loading wire:target="register">Creating...</span>
        </flux:button>
      </form>

      <div class="mt-6 text-center">
        <flux:text class="text-zinc-500 dark:text-zinc-400">
          Already have an account?
          <a href="{{ route('login') }}" class="text-primary hover:underline font-medium" wire:navigate>
            Sign in
          </a>
        </flux:text>
      </div>
    </div>
  </div>
</div>
