<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_campaigns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // "Job Referral Program"
            $table->string('slug')->unique();
            $table->boolean('active')->default(true);
            $table->decimal('reward_amount', 10, 2)->default(200.00);
            $table->string('reward_type')->default('gift_card'); // cash, credit, gift_card
            $table->string('conversion_trigger')->default('job_completion'); // signup, job_completion, payment
            $table->text('description')->nullable();
            $table->text('terms_conditions')->nullable();
            $table->json('settings')->nullable(); // Custom settings
            $table->timestamps();
            
            $table->index('active');
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_campaigns');
    }
};
