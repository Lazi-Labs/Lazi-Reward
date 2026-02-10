<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add deployment tracking to reviews
        Schema::table('reviews', function (Blueprint $table) {
            $table->unsignedTinyInteger('rating')->nullable()->after('content');
            $table->boolean('is_deployed')->default(false)->after('photo_id');
            $table->timestamp('deployed_at')->nullable()->after('is_deployed');
            
            $table->index('is_deployed');
        });

        // Add deployment tracking to photos
        Schema::table('photos', function (Blueprint $table) {
            $table->boolean('is_deployed')->default(false)->after('is_used');
            $table->timestamp('deployed_at')->nullable()->after('is_deployed');
            
            $table->index('is_deployed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['is_deployed']);
            $table->dropColumn(['rating', 'is_deployed', 'deployed_at']);
        });

        Schema::table('photos', function (Blueprint $table) {
            $table->dropIndex(['is_deployed']);
            $table->dropColumn(['is_deployed', 'deployed_at']);
        });
    }
};
