@php
    $state = $getState();
@endphp

@if ($state)
    <a href="{{ asset('storage/' . $state) }}" target="_blank" class="block">
        <img
            src="{{ asset('storage/' . $state) }}"
            alt="{{ $getLabel() }}"
            class="max-w-xs max-h-64 rounded-lg shadow-sm hover:shadow-md transition-shadow object-contain"
        >
    </a>
@else
    <div class="text-gray-400 text-sm italic">No image uploaded</div>
@endif
