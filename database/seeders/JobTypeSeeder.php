<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\JobType;
use Illuminate\Database\Seeder;

class JobTypeSeeder extends Seeder
{
    public function run(): void
    {
        // Get businesses by key
        $pools = Business::where('key', 'liv')->first();
        $electric = Business::where('key', 'electric')->first();

        // LIV Pools job types
        if ($pools) {
            $poolTypes = [
                ['name' => 'Pool Installation', 'description' => 'New pool construction', 'reward_amount' => 500.00, 'sort_order' => 1],
                ['name' => 'Pool Renovation', 'description' => 'Resurface, retile, or remodel', 'reward_amount' => 300.00, 'sort_order' => 2],
                ['name' => 'Weekly Pool Service', 'description' => 'Ongoing maintenance signup', 'reward_amount' => 100.00, 'sort_order' => 3],
                ['name' => 'Equipment Repair', 'description' => 'Pump, filter, or heater repair', 'reward_amount' => 75.00, 'sort_order' => 4],
                ['name' => 'Pool Cleaning', 'description' => 'One-time deep clean', 'reward_amount' => 50.00, 'sort_order' => 5],
            ];

            foreach ($poolTypes as $type) {
                JobType::updateOrCreate(
                    ['business_id' => $pools->id, 'name' => $type['name']],
                    [
                        'description' => $type['description'],
                        'reward_amount' => $type['reward_amount'],
                        'sort_order' => $type['sort_order'],
                        'is_active' => true,
                    ]
                );
            }

            $this->command->info("Created " . count($poolTypes) . " job types for {$pools->name}");
        }

        // Perfect Catch Electric job types
        if ($electric) {
            $electricTypes = [
                ['name' => 'Panel Upgrade', 'description' => 'Electrical panel replacement or upgrade', 'reward_amount' => 300.00, 'sort_order' => 1],
                ['name' => 'EV Charger Installation', 'description' => 'Electric vehicle charger install', 'reward_amount' => 200.00, 'sort_order' => 2],
                ['name' => 'Generator Installation', 'description' => 'Whole-home generator install', 'reward_amount' => 400.00, 'sort_order' => 3],
                ['name' => 'Lighting Installation', 'description' => 'Indoor or outdoor lighting', 'reward_amount' => 100.00, 'sort_order' => 4],
                ['name' => 'Electrical Repair', 'description' => 'Outlet, switch, or wiring repair', 'reward_amount' => 50.00, 'sort_order' => 5],
                ['name' => 'Smart Home Installation', 'description' => 'Smart switches, thermostats, etc.', 'reward_amount' => 75.00, 'sort_order' => 6],
            ];

            foreach ($electricTypes as $type) {
                JobType::updateOrCreate(
                    ['business_id' => $electric->id, 'name' => $type['name']],
                    [
                        'description' => $type['description'],
                        'reward_amount' => $type['reward_amount'],
                        'sort_order' => $type['sort_order'],
                        'is_active' => true,
                    ]
                );
            }

            $this->command->info("Created " . count($electricTypes) . " job types for {$electric->name}");
        }

        if (!$pools && !$electric) {
            $this->command->warn('No businesses found with keys "liv" or "electric". Please create businesses first.');
        }
    }
}
