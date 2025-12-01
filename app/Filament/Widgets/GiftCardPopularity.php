<?php

namespace App\Filament\Widgets;

use App\Models\GiftCard;
use Filament\Widgets\ChartWidget;

class GiftCardPopularity extends ChartWidget
{
    protected static ?string $heading = 'Gift Card Popularity';

    protected static ?string $maxHeight = '300px';

    protected function getData(): array
    {
        $giftCards = GiftCard::withCount('submissions')
            ->orderByDesc('submissions_count')
            ->get();

        return [
            'datasets' => [
                [
                    'label' => 'Requests',
                    'data' => $giftCards->pluck('submissions_count')->toArray(),
                    'backgroundColor' => 'rgb(113, 113, 122)',
                    'borderWidth' => 0,
                    'borderRadius' => 4,
                    'barThickness' => 20,
                ],
            ],
            'labels' => $giftCards->pluck('name')->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }

    protected function getOptions(): array
    {
        return [
            'indexAxis' => 'y',
            'plugins' => [
                'legend' => [
                    'display' => false,
                ],
            ],
            'scales' => [
                'x' => [
                    'beginAtZero' => true,
                    'ticks' => [
                        'stepSize' => 1,
                    ],
                ],
            ],
        ];
    }
}
