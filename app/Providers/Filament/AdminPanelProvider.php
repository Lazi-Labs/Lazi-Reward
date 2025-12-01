<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Support\Facades\FilamentView;
use Filament\View\PanelsRenderHook;
use Filament\Widgets;
use Illuminate\Support\Facades\Blade;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
	public function panel( Panel $panel ): Panel
	{
		return $panel
			->default()
			->id( 'admin' )
			->path( 'admin' )
			->login()
			->profile()
			->globalSearchKeyBindings( [ 'command+k', 'ctrl+k' ] )
			->databaseNotifications()
			->darkMode( true )
			->sidebarCollapsibleOnDesktop()
			->brandName( 'Lazi Rewards' )
			->colors( [
				'primary' => Color::hex( '#000' ),
				'gray'    => Color::Zinc,
			] )
			->font( 'Inter' )
			->discoverResources( in: app_path( 'Filament/Resources' ), for: 'App\\Filament\\Resources' )
			->discoverPages( in: app_path( 'Filament/Pages' ), for: 'App\\Filament\\Pages' )
			->pages( [] )
			->discoverWidgets( in: app_path( 'Filament/Widgets' ), for: 'App\\Filament\\Widgets' )
			->widgets( [] )
			->middleware( [
				EncryptCookies::class,
				AddQueuedCookiesToResponse::class,
				StartSession::class,
				AuthenticateSession::class,
				ShareErrorsFromSession::class,
				VerifyCsrfToken::class,
				SubstituteBindings::class,
				DisableBladeIconComponents::class,
				DispatchServingFilamentEvent::class,
			] )
			->authMiddleware( [
				Authenticate::class,
			] )
			->renderHook(
				PanelsRenderHook::HEAD_END,
				fn() => Blade::render( '
					<style>
						/* Table Header - inline search with heading */
						.fi-ta-header-ctn {
							display: flex;
							flex-wrap: wrap;
							align-items: center;
							justify-content: space-between;
							gap: 1rem;
							padding: 1rem 1rem 1rem 1.5rem;
						}
						.fi-ta-header-ctn > * { padding: 0 !important; }
						.fi-ta-header-toolbar { border-top: none !important; }

						/* Sidebar Toggle - custom icon */
						.fi-sidebar-header .fi-icon-btn .fi-icon-btn-icon { display: none !important; }
						.fi-sidebar-header .fi-icon-btn::after {
							content: "";
							display: block;
							width: 20px;
							height: 20px;
							background-image: url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M7.5 3.75V16.25M3.4375 16.25H16.5625C17.08 16.25 17.5 15.83 17.5 15.3125V4.6875C17.5 4.17 17.08 3.75 16.5625 3.75H3.4375C2.92 3.75 2.5 4.17 2.5 4.6875V15.3125C2.5 15.83 2.92 16.25 3.4375 16.25Z\' stroke=\'%2371717a\' stroke-width=\'1.25\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E");
							background-repeat: no-repeat;
							background-position: center;
						}
						.dark .fi-sidebar-header .fi-icon-btn::after {
							background-image: url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M7.5 3.75V16.25M3.4375 16.25H16.5625C17.08 16.25 17.5 15.83 17.5 15.3125V4.6875C17.5 4.17 17.08 3.75 16.5625 3.75H3.4375C2.92 3.75 2.5 4.17 2.5 4.6875V15.3125C2.5 15.83 2.92 16.25 3.4375 16.25Z\' stroke=\'%23a1a1aa\' stroke-width=\'1.25\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E");
						}
						.fi-sidebar-header .fi-icon-btn:hover {
							background-color: #f4f4f5;
							border-radius: 0.5rem;
						}
						.dark .fi-sidebar-header .fi-icon-btn:hover {
							background-color: rgba(255, 255, 255, 0.1);
						}

						/* Dashboard Tabs */
						.fi-tabs {
							display: flex;
							gap: 1.5rem;
							border-bottom: 1px solid #e4e4e7;
							margin-bottom: 1.5rem;
						}
						.dark .fi-tabs { border-bottom-color: rgba(255, 255, 255, 0.1); }
						.fi-tab {
							padding: 0.5rem 0rem;
							font-size: 0.875rem;
							font-weight: 500;
							color: #71717a;
							background: transparent;
							border-bottom: 2px solid transparent;
							margin-bottom: -1px;
							border-radius: 0.5rem 0.5rem 0 0;
							transition: all 150ms;
						}
						.fi-tab:hover { color: #52525b; }
						.dark .fi-tab { color: #a1a1aa; }
						.dark .fi-tab:hover { color: #d4d4d8; background-color: rgba(255, 255, 255, 0.05); }
						.fi-tab.active { color: #18181b; border-bottom-color: #71717a; }
						.dark .fi-tab.active { color: #fafafa; border-bottom-color: #a1a1aa; }

						/* Global Search - keyboard shortcut hint */
						.fi-global-search-field {
							position: relative;
						}
						.fi-global-search-field::after {
							content: "⌘K";
							position: absolute;
							right: 0.75rem;
							top: 50%;
							transform: translateY(-50%);
							font-size: 0.75rem;
							font-weight: 500;
							color: #a1a1aa;
							background: #f4f4f5;
							padding: 0.125rem 0.375rem;
							border-radius: 0.25rem;
							pointer-events: none;
						}
						.dark .fi-global-search-field::after {
							background: rgba(255, 255, 255, 0.1);
							color: #71717a;
						}
						.fi-global-search-field:focus-within::after {
							display: none;
						}
					</style>
				' ),
			);
	}
}
