<?php

namespace App\Filament\Widgets;

use App\Models\Business;
use App\Models\GiftCard;
use App\Models\Submission;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends BaseWidget
{
	protected function getStats(): array
	{
		return [
			Stat::make( 'Total Submissions', Submission::count() )
					->description( 'All time' )
					->descriptionIcon( 'heroicon-m-document-text' )
					->extraAttributes( [
						'class' => 'bg-zinc-200 dark:bg-zinc-800 rounded-full text-sm',
					] )
					->color( 'primary' ),

			Stat::make( 'Pending', Submission::where( 'status', 'pending' )->count() )
					->description( 'Awaiting action' )
					->descriptionIcon( 'heroicon-m-clock' )
					->color( 'gray' ),

			Stat::make( 'Waiting for Screenshot', Submission::where( 'status', 'waiting_for_screenshot' )->count() )
					->description( 'Review posted' )
					->descriptionIcon( 'heroicon-m-camera' )
					->color( 'warning' ),

			Stat::make( 'Completed', Submission::where( 'status', 'completed' )->count() )
					->description( 'Gift card ready' )
					->descriptionIcon( 'heroicon-m-check-circle' )
					->color( 'success' ),
		];
	}
}
