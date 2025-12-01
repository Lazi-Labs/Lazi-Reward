<?php

namespace App\Filament\Widgets;

use App\Models\Business;
use Filament\Widgets\ChartWidget;

class BusinessBreakdown extends ChartWidget
{
    protected static ?string $heading = 'Submissions by Business';

    protected static ?string $maxHeight = '300px';

    protected function getData(): array
    {
        $businesses = Business::withCount('submissions')
            ->orderByDesc('submissions_count')
            ->get();

        $colorMap = [
            'zinc' => '#71717a',
            'red' => '#ef4444',
            'orange' => '#f97316',
            'yellow' => '#eab308',
            'green' => '#22c55e',
            'blue' => '#3b82f6',
            'indigo' => '#6366f1',
            'purple' => '#a855f7',
            'pink' => '#ec4899',
        ];

        $colors = $businesses->map(fn ($b) => $colorMap[$b->color] ?? '#71717a')->toArray();

        return [
            'datasets' => [
                [
                    'label' => 'Submissions',
                    'data' => $businesses->pluck('submissions_count')->toArray(),
                    'backgroundColor' => $colors,
                    'borderWidth' => 0,
                    'spacing' => 2,
                ],
            ],
            'labels' => $businesses->pluck('name')->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'doughnut';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'position' => 'bottom',
                ],
            ],
        ];
    }
}
