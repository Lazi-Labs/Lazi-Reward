<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_rewards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('referrer_id')->constrained('referrers')->cascadeOnDelete();
            $table->foreignUuid('referral_id')->constrained('referrals')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('type'); // cash, credit, gift_card
            $table->string('status')->default('pending'); // pending, processing, sent, failed
            $table->string('payment_method')->nullable(); // paypal, venmo, bank, gift_card, credit
            $table->string('payment_reference')->nullable(); // transaction ID
            $table->text('payment_details')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            
            $table->index('referrer_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_rewards');
    }
};
