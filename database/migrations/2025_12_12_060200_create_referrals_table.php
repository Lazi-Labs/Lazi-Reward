<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('referrer_id')->constrained('referrers')->cascadeOnDelete();
            $table->foreignId('referred_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('campaign_id')->constrained('referral_campaigns')->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending, converted, rewarded, cancelled
            $table->timestamp('clicked_at')->nullable();
            $table->timestamp('signed_up_at')->nullable();
            $table->timestamp('converted_at')->nullable(); // when they completed job
            $table->timestamp('rewarded_at')->nullable(); // when reward was sent
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('source')->nullable(); // direct, social, email, sms
            $table->json('metadata')->nullable(); // extra tracking data
            $table->timestamps();
            
            $table->index('referrer_id');
            $table->index('referred_user_id');
            $table->index('status');
            $table->index(['referrer_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
