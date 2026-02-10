<?php

namespace App\Filament\Widgets;

use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Actions\Action;
use App\Filament\Resources\BusinessResource;
use App\Filament\Resources\SubmissionResource;
use App\Models\Submission;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class LatestSubmissions extends BaseWidget
{
	protected int|string|array $columnSpan = 'full';

	public function table( Table $table ): Table
	{
		return $table
			->heading( 'Latest Submissions' )
			->query(
				Submission::query()->latest()->limit( 5 ),
			)
			->searchable()
			->persistSearchInSession()
			->searchPlaceholder( 'Search...' )
			->columns( [
				TextColumn::make( 'name' )
																 ->searchable(),
				TextColumn::make( 'email' )
																 ->searchable(),
				ImageColumn::make( 'business.avatar' )
																 ->label( 'Business' )
																 ->disk( 'public' )
																 ->circular()
																 ->defaultImageUrl( fn( $record ) => $record->business ? 'https://ui-avatars.com/api/?name=' . urlencode( $record->business->name ) . '&background=f4f4f5&color=71717a' : null )
																 ->tooltip( fn( $record ) => $record->business?->name )
																 ->alignCenter()
																 ->url( fn( $record ) => $record->business ? BusinessResource::getUrl( 'edit', [ 'record' => $record->business ] ) : null ),
				TextColumn::make( 'giftCard.name' )
																 ->label( 'Gift Card' ),
				TextColumn::make( 'status' )
																 ->badge()
																 ->color( fn( string $state ): string => match ( $state ) {
																	 'pending' => 'gray',
																	 'waiting_for_screenshot' => 'warning',
																	 'completed' => 'success',
																	 default => 'gray',
																 } ),
				TextColumn::make( 'created_at' )
																 ->dateTime()
																 ->sortable(),
			] )
			->recordActions( [
				Action::make( 'view' )
														 ->url( fn( Submission $record ): string => SubmissionResource::getUrl( 'view', [ 'record' => $record ] ) )
														 ->icon( 'heroicon-m-eye' ),
			] )
			->paginated( false );
	}
}
