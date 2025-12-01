<?php

namespace Database\Seeders;

use App\Models\BusinessLocation;
use App\Models\GiftCard;
use Illuminate\Database\Seeder;

class BusinessDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seed business locations from config
        $locations = [
            [
                'key' => 'electric',
                'name' => 'Perfect Catch Electric',
                'description' => 'Largo / Pinellas',
                'gmb_link' => 'https://g.page/r/XXXXX',
                'review_template' => "Perfect Catch Electric did an amazing job! The team was professional, on time, and fixed my electrical issue quickly. Highly recommend them for any electrical work in Pinellas County.",
                'icon' => 'bolt',
                'color' => 'yellow',
                'sort_order' => 1,
            ],
            [
                'key' => 'pools',
                'name' => 'Perfect Catch Pools',
                'description' => 'Tampa Bay',
                'gmb_link' => 'https://g.page/r/YYYYY',
                'review_template' => "Perfect Catch Pools exceeded my expectations! They keep my pool sparkling clean and the service is always reliable. Best pool service in Tampa Bay!",
                'icon' => 'lifebuoy',
                'color' => 'blue',
                'sort_order' => 2,
            ],
            [
                'key' => 'liv',
                'name' => 'LIV Pools',
                'description' => 'Custom Pool Builder',
                'gmb_link' => 'https://g.page/r/ZZZZZ',
                'review_template' => "LIV Pools created a stunning custom pool for our backyard. The design process was smooth and the craftsmanship is top-notch. We love our new oasis!",
                'icon' => 'sparkles',
                'color' => 'indigo',
                'sort_order' => 3,
            ],
        ];

        foreach ($locations as $location) {
            BusinessLocation::updateOrCreate(
                ['key' => $location['key']],
                $location
            );
        }

        // Seed gift cards
        $giftCards = [
            ['key' => 'amazon', 'name' => 'Amazon', 'sort_order' => 1],
            ['key' => 'visa', 'name' => 'Visa', 'sort_order' => 2],
            ['key' => 'target', 'name' => 'Target', 'sort_order' => 3],
            ['key' => 'starbucks', 'name' => 'Starbucks', 'sort_order' => 4],
        ];

        foreach ($giftCards as $giftCard) {
            GiftCard::updateOrCreate(
                ['key' => $giftCard['key']],
                $giftCard
            );
        }
    }
}
