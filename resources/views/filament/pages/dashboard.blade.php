<x-filament-panels::page>
  <div class="fi-tabs">
    <button wire:click="setActiveTab('overview')" type="button" @class(['fi-tab', 'active' => $activeTab === 'overview'])>
      Overview
    </button>
    <button wire:click="setActiveTab('analytics')" type="button" @class(['fi-tab', 'active' => $activeTab === 'analytics'])>
      Analytics
    </button>
    <button wire:click="setActiveTab('activity')" type="button" @class(['fi-tab', 'active' => $activeTab === 'activity'])>
      Activity
    </button>
  </div>

  <x-filament-widgets::widgets
    :columns="$this->getColumns()"
    :widgets="$this->getVisibleWidgets()"
  />
</x-filament-panels::page>
