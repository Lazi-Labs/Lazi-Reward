<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_clicks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('referrer_id')->constrained('referrers')->cascadeOnDelete();
            $table->string('ip_address');
            $table->text('user_agent')->nullable();
            $table->string('referer_url')->nullable();
            $table->string('country', 2)->nullable();
            $table->string('city')->nullable();
            $table->string('device_type')->nullable(); // mobile, desktop, tablet
            $table->string('browser')->nullable();
            $table->string('os')->nullable();
            $table->boolean('converted')->default(false);
            $table->timestamps();
            
            $table->index(['referrer_id', 'created_at']);
            $table->index('ip_address');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_clicks');
    }
};
