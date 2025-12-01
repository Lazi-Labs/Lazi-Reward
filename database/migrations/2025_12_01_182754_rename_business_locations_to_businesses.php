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
        // Drop the foreign key constraint first
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropForeign(['business_location_id']);
        });

        // Rename the table
        Schema::rename('business_locations', 'businesses');

        // Rename the column in submissions
        Schema::table('submissions', function (Blueprint $table) {
            $table->renameColumn('business_location_id', 'business_id');
        });

        // Re-add the foreign key constraint with new names
        Schema::table('submissions', function (Blueprint $table) {
            $table->foreign('business_id')
                ->references('id')
                ->on('businesses')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the foreign key constraint
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropForeign(['business_id']);
        });

        // Rename the column back
        Schema::table('submissions', function (Blueprint $table) {
            $table->renameColumn('business_id', 'business_location_id');
        });

        // Rename the table back
        Schema::rename('businesses', 'business_locations');

        // Re-add the original foreign key constraint
        Schema::table('submissions', function (Blueprint $table) {
            $table->foreign('business_location_id')
                ->references('id')
                ->on('business_locations')
                ->nullOnDelete();
        });
    }
};