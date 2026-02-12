<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_referrals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('job_type_id')->constrained('job_types')->cascadeOnDelete();

            // Referred person details
            $table->string('referred_name');
            $table->string('referred_phone');
            $table->string('referred_email');

            // Status tracking
            $table->string('status')->default('pending');
            $table->timestamp('contacted_at')->nullable();
            $table->timestamp('hired_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('rewarded_at')->nullable();

            // Reward tracking
            $table->decimal('reward_amount', 10, 2)->nullable();
            $table->string('reward_status')->nullable();
            $table->string('reward_reference')->nullable();

            // Admin notes
            $table->text('admin_notes')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['business_id', 'status']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_referrals');
    }
};
