<?php

namespace App\Filament\AvatarProviders;

use Filament\AvatarProviders\Contracts\AvatarProvider;
use Filament\Facades\Filament;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;

class BoringAvatarsProvider implements AvatarProvider
{
	public function get( Model|Authenticatable $record ): string
	{
		$name = Filament::getNameForDefaultAvatar( $record );

		// DiceBear API - "shapes" style for abstract geometric avatars
		return 'https://api.dicebear.com/9.x/shapes/svg?seed=' . urlencode( $name );
	}
}