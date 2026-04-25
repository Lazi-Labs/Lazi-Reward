<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referrers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('campaign_id')->constrained('referral_campaigns')->cascadeOnDelete();
            $table->string('referral_code', 8)->unique();
            $table->string('referral_link');
            $table->string('qr_code_path')->nullable();
            $table->unsignedInteger('total_reach')->default(0); // clicks
            $table->unsignedInteger('total_referrals')->default(0); // signups
            $table->unsignedInteger('converted_referrals')->default(0); // paid conversions
            $table->decimal('total_earnings', 10, 2)->default(0);
            $table->string('source')->default('direct'); // direct, referred, social
            $table->foreignUuid('referred_by_id')->nullable()->constrained('referrers')->nullOnDelete();
            $table->timestamp('qualified_at')->nullable(); // when they became eligible
            $table->string('preferred_payout_method')->nullable(); // paypal, venmo, gift_card, credit
            $table->string('payout_email')->nullable(); // PayPal/Venmo email
            $table->timestamps();
            
            $table->index('referral_code');
            $table->index('user_id');
            $table->index('campaign_id');
            $table->index('qualified_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrers');
    }
};
