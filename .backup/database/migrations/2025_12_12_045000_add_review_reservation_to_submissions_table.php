<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            // Link submission to specific review (prevents duplicate usage)
            $table->foreignUuid('review_id')->nullable()->after('business_id')
                ->constrained('reviews')->nullOnDelete();
            
            // Index for quick lookups
            $table->index('review_id');
        });

        // Add reservation tracking to reviews table
        Schema::table('reviews', function (Blueprint $table) {
            $table->timestamp('reserved_at')->nullable()->after('deployed_at');
            $table->string('reserved_by_ip')->nullable()->after('reserved_at');
            $table->index('reserved_at');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropForeign(['review_id']);
            $table->dropColumn('review_id');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn(['reserved_at', 'reserved_by_ip']);
        });
    }
};
