<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            // Verification tracking (verified_at may already exist)
            if (!Schema::hasColumn('submissions', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('verification_status');
            }
            
            // Tremendous tracking
            $table->string('tremendous_order_id')->nullable()->after('verification_message');
            $table->string('tremendous_reward_id')->nullable()->after('tremendous_order_id');
            $table->string('tremendous_campaign_id')->nullable()->after('tremendous_reward_id');
            $table->decimal('reward_amount', 10, 2)->nullable()->after('tremendous_campaign_id');
            $table->string('reward_currency', 3)->default('USD')->after('reward_amount');
            $table->string('reward_status')->nullable()->after('reward_currency')
                ->comment('pending, sent, delivered, failed, rejected');
            $table->timestamp('reward_sent_at')->nullable()->after('reward_status');
            $table->timestamp('reward_delivered_at')->nullable()->after('reward_sent_at');
            $table->text('verification_notes')->nullable()->after('reward_delivered_at');
            
            // Indexes for performance
            $table->index('tremendous_order_id');
            $table->index('tremendous_reward_id');
            $table->index('reward_status');
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropIndex(['tremendous_order_id']);
            $table->dropIndex(['tremendous_reward_id']);
            $table->dropIndex(['reward_status']);
            
            $table->dropColumn([
                'verified_at',
                'tremendous_order_id',
                'tremendous_reward_id',
                'tremendous_campaign_id',
                'reward_amount',
                'reward_currency',
                'reward_status',
                'reward_sent_at',
                'reward_delivered_at',
                'verification_notes',
            ]);
        });
    }
};
