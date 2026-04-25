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
        Schema::table('submissions', function (Blueprint $table) {
            $table->uuid('business_location_id')->nullable()->after('phone');
            $table->uuid('gift_card_id')->nullable()->after('business_location_id');

            $table->foreign('business_location_id')
                ->references('id')
                ->on('business_locations')
                ->nullOnDelete();

            $table->foreign('gift_card_id')
                ->references('id')
                ->on('gift_cards')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropForeign(['business_location_id']);
            $table->dropForeign(['gift_card_id']);
            $table->dropColumn(['business_location_id', 'gift_card_id']);
        });
    }
};
