<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\ActivityFeed;
use App\Filament\Widgets\BusinessBreakdown;
use App\Filament\Widgets\GiftCardPopularity;
use App\Filament\Widgets\LatestSubmissions;
use App\Filament\Widgets\StatsOverview;
use App\Filament\Widgets\SubmissionsChart;
use Filament\Pages\Dashboard as BaseDashboard;
use Filament\Pages\Dashboard\Concerns\HasFiltersForm;
use Illuminate\Contracts\Support\Htmlable;
use Illuminate\Routing\Route;

class Dashboard extends BaseDashboard
{
	use HasFiltersForm;

	protected static ?string $navigationIcon = 'heroicon-o-chart-bar';

	protected static ?string $activeNavigationIcon = 'heroicon-s-chart-bar';

	protected static string $view = 'filament.pages.dashboard';

	public string $activeTab = 'overview';

	public static function routes( \Filament\Panel $panel ): void
	{
		// Route for /admin (overview)
		\Illuminate\Support\Facades\Route::get( '/', static::class )
																		 ->middleware( static::getRouteMiddleware( $panel ) )
																		 ->withoutMiddleware( static::getWithoutRouteMiddleware( $panel ) )
																		 ->name( 'dashboard' );

		// Routes for /admin/{tab}
		\Illuminate\Support\Facades\Route::get( '/{tab}', static::class )
																		 ->middleware( static::getRouteMiddleware( $panel ) )
																		 ->withoutMiddleware( static::getWithoutRouteMiddleware( $panel ) )
																		 ->where( 'tab', 'analytics|activity' )
																		 ->name( 'dashboard.tab' );
	}

	public function mount(): void
	{
		$tab             = request()->route( 'tab' );
		$this->activeTab = in_array( $tab, [ 'analytics', 'activity' ] ) ? $tab : 'overview';
	}

	public function getTitle(): string|Htmlable
	{
		return 'Dashboard';
	}

	public function getColumns(): int|string|array
	{
		return 2;
	}

	public function getWidgets(): array
	{
		return match ( $this->activeTab ) {
			'analytics' => [
				SubmissionsChart::class,
				BusinessBreakdown::class,
				GiftCardPopularity::class,
			],
			'activity' => [
				ActivityFeed::class,
			],
			default => [
				StatsOverview::class,
				LatestSubmissions::class,
			],
		};
	}

	public function setActiveTab( string $tab ): void
	{
		$url = $tab === 'overview' ? '/admin' : "/admin/$tab";
		$this->redirect( $url );
	}
}
