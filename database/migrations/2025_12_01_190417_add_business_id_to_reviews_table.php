<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Clear existing reviews without business_id
        DB::table('reviews')->truncate();

        if (! Schema::hasColumn('reviews', 'business_id')) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->foreignUuid('business_id')->constrained()->cascadeOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropConstrainedForeignId('business_id');
        });
    }
};