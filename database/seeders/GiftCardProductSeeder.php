<?php

namespace Database\Seeders;

use App\Models\GiftCardProduct;
use Illuminate\Database\Seeder;

class GiftCardProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'tremendous_product_id' => 'OKMHM2X2OHYV',
                'name' => 'Amazon.com',
                'description' => 'Shop millions of products on Amazon.com with this gift card.',
                'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png',
                'category' => 'merchant',
                'min_value' => 1,
                'max_value' => 2000,
                'currency_code' => 'USD',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'tremendous_product_id' => 'Q24BD9EZ332JT',
                'name' => 'Virtual Visa',
                'description' => 'A prepaid Visa card that can be used anywhere Visa is accepted.',
                'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/320px-Visa_Inc._logo.svg.png',
                'category' => 'visa',
                'min_value' => 5,
                'max_value' => 500,
                'currency_code' => 'USD',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'tremendous_product_id' => 'KV934TZ93NQM',
                'name' => 'PayPal',
                'description' => 'Receive funds directly to your PayPal account.',
                'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/320px-PayPal.svg.png',
                'category' => 'paypal',
                'min_value' => 1,
                'max_value' => 2000,
                'currency_code' => 'USD',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'tremendous_product_id' => 'T7V8GK9RPLMJ',
                'name' => 'Starbucks',
                'description' => 'Enjoy your favorite coffee and treats at Starbucks.',
                'image_url' => 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/200px-Starbucks_Corporation_Logo_2011.svg.png',
                'category' => 'merchant',
                'min_value' => 5,
                'max_value' => 100,
                'currency_code' => 'USD',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'tremendous_product_id' => 'WBMZG8RVPKD2',
                'name' => 'Target',
                'description' => 'Shop for everything you need at Target stores or online.',
                'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Target_Corporation_logo_%28vector%29.svg/200px-Target_Corporation_logo_%28vector%29.svg.png',
                'category' => 'merchant',
                'min_value' => 5,
                'max_value' => 500,
                'currency_code' => 'USD',
                'is_active' => true,
                'sort_order' => 5,
            ],
        ];

        foreach ($products as $product) {
            GiftCardProduct::updateOrCreate(
                ['tremendous_product_id' => $product['tremendous_product_id']],
                array_merge($product, ['last_synced_at' => now()])
            );
        }
    }
}
