<!--suppress PhpDeprecationInspection -->
<x-filament-panels::page>
  @php
    $tabs = [
      'overview' => 'Overview',
      'analytics' => 'Analytics',
      'activity' => 'Activity',
    ];
  @endphp

  <div class="fi-tabs">
    @foreach ($tabs as $key => $label)
      <button
        wire:click="setActiveTab('{{ $key }}')"
        type="button"
        @class(['fi-tab', 'active' => $activeTab === $key])
      >
        {{ $label }}
      </button>
    @endforeach
  </div>

  <x-filament-widgets::widgets
    :columns="$this->getColumns()"
    :widgets="$this->getWidgets()"
  />
</x-filament-panels::page>
