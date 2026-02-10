<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\GiftCard;
use App\Models\Photo;
use App\Models\Review;
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
                'gmb_link' => 'https://g.page/r/CYPBjYPJMVLfEBM/review',
                'review_template' => "Perfect Catch Electric did an amazing job! The team was professional, on time, and fixed my electrical issue quickly. Highly recommend them for any electrical work in Pinellas County.",
                'icon' => 'bolt',
                'avatar' => 'yellow',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'key' => 'pools',
                'name' => 'Perfect Catch Pools',
                'description' => 'Tampa Bay',
                'gmb_link' => 'https://g.page/r/CYPBjYPJMVLfEBM/review',
                'review_template' => "Perfect Catch Pools exceeded my expectations! They keep my pool sparkling clean and the service is always reliable. Best pool service in Tampa Bay!",
                'icon' => 'lifebuoy',
                'avatar' => 'blue',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'key' => 'liv',
                'name' => 'LIV Pools',
                'description' => 'Custom Pool Builder',
                'gmb_link' => 'https://g.page/r/CYPBjYPJMVLfEBM/review',
                'review_template' => "LIV Pools created a stunning custom pool for our backyard. The design process was smooth and the craftsmanship is top-notch. We love our new oasis!",
                'icon' => 'sparkles',
                'avatar' => 'indigo',
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($locations as $location) {
            Business::updateOrCreate(
                ['key' => $location['key']],
                $location
            );
        }

        // Seed gift cards
        $giftCards = [
            ['key' => 'visa', 'name' => '$25 Visa Gift Card', 'is_active' => true, 'sort_order' => 1],
            ['key' => 'starbucks', 'name' => '$15 Starbucks Gift Card', 'is_active' => true, 'sort_order' => 2],
        ];

        foreach ($giftCards as $giftCard) {
            GiftCard::updateOrCreate(
                ['key' => $giftCard['key']],
                $giftCard
            );
        }

        // Seed sample photos and reviews for each business
        $businesses = Business::all();
        
        foreach ($businesses as $business) {
            // Create 3 sample photos per business
            for ($i = 1; $i <= 3; $i++) {
                $photo = Photo::updateOrCreate(
                    ['business_id' => $business->id, 'path' => "samples/{$business->key}-{$i}.jpg"],
                    [
                        'name' => "{$business->name} Photo {$i}",
                        'alt' => "{$business->name} service photo {$i}",
                        'is_used' => false,
                    ]
                );

                // Create a review linked to this photo
                Review::updateOrCreate(
                    ['business_id' => $business->id, 'photo_id' => $photo->id],
                    [
                        'content' => $this->getReviewContent($business->key, $i),
                    ]
                );
            }
        }
    }

    private function getReviewContent(string $businessKey, int $index): string
    {
        $reviews = [
            'electric' => [
                1 => "Perfect Catch Electric did an amazing job! The team was professional, on time, and fixed my electrical issue quickly. Highly recommend them for any electrical work in Pinellas County.",
                2 => "Called Perfect Catch Electric for an emergency repair and they came out same day. Fair pricing and excellent workmanship. Will definitely use them again!",
                3 => "Best electricians in the Tampa Bay area! They installed new outlets and a ceiling fan, and everything works perfectly. Very clean and respectful of our home.",
            ],
            'pools' => [
                1 => "Perfect Catch Pools exceeded my expectations! They keep my pool sparkling clean and the service is always reliable. Best pool service in Tampa Bay!",
                2 => "We've used Perfect Catch Pools for 2 years now. Always on time, always thorough. Our pool has never looked better. Highly recommend!",
                3 => "Switched to Perfect Catch Pools after a bad experience with another company. Night and day difference! Professional, knowledgeable, and great communication.",
            ],
            'liv' => [
                1 => "LIV Pools created a stunning custom pool for our backyard. The design process was smooth and the craftsmanship is top-notch. We love our new oasis!",
                2 => "From design to completion, LIV Pools was exceptional. They listened to our vision and delivered beyond our dreams. Worth every penny!",
                3 => "Our neighbors can't stop complimenting our new pool from LIV Pools. The attention to detail is incredible. Truly a work of art!",
            ],
        ];

        return $reviews[$businessKey][$index] ?? "Great service from {$businessKey}! Highly recommended.";
    }
}
