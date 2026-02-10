<div class="flex min-h-[60vh] items-center justify-center">
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-8">
      <div class="text-center mb-8">
        <flux:icon.arrow-right-end-on-rectangle class="size-12 text-primary mx-auto mb-4" />
        <flux:heading size="xl">Welcome Back</flux:heading>
        <flux:text class="text-zinc-500 dark:text-zinc-400 mt-2">
          Sign in to your account
        </flux:text>
      </div>

      <form wire:submit="login" class="space-y-5">
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

        <div class="flex items-center justify-between">
          <flux:checkbox wire:model="remember" label="Remember me" />
        </div>

        <flux:button
          type="submit"
          variant="primary"
          class="w-full"
          wire:loading.attr="disabled"
        >
          <span wire:loading.remove wire:target="login">Sign In</span>
          <span wire:loading wire:target="login">Signing in...</span>
        </flux:button>
      </form>

      <div class="mt-6 text-center">
        <flux:text class="text-zinc-500 dark:text-zinc-400">
          Don't have an account?
          <a href="{{ route('register') }}" class="text-primary hover:underline font-medium" wire:navigate>
            Create one
          </a>
        </flux:text>
      </div>
    </div>
  </div>
</div>
