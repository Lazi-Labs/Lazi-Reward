@props([
    'step' => 1,
    'completed' => false,
])

<div class="hidden lg:block bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-800/50 dark:to-zinc-900/50 rounded-2xl p-6 lg:p-8 lg:sticky lg:top-8">
  {{-- Steps --}}
  <div class="space-y-0">
    <x-wizard.step
      :step="1"
      :current="$step"
      :completed="$completed"
      title="Select Business"
      description="Choose which business serviced you."
      icon="map-pin"
      :show-line="true"
    />

    <x-wizard.step
      :step="2"
      :current="$step"
      :completed="$completed"
      title="Post Review"
      description="Copy the review and post on Google."
      icon="pencil-square"
      :show-line="true"
    />

    <x-wizard.step
      :step="3"
      :current="$step"
      :completed="$completed"
      title="Claim Reward"
      description="Upload screenshot & get your gift card!"
      icon="gift"
      :show-line="false"
    />
  </div>

  {{-- Security badge --}}
  <x-security-badge/>
</div>
