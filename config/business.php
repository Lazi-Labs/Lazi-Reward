<?php

return [
    'locations' => [
        'electric' => [
            'name' => 'Perfect Catch Electric',
            'description' => 'Largo / Pinellas',
            'gmb' => 'https://g.page/r/XXXXX', // Placeholder, user to update
            'review' => "Perfect Catch Electric did an amazing job! The team was professional, on time, and fixed my electrical issue quickly. Highly recommend them for any electrical work in Pinellas County.",
            'icon' => 'bolt', // Flux icon name
            'color' => 'yellow',
        ],
        'pools' => [
            'name' => 'Perfect Catch Pools',
            'description' => 'Tampa Bay',
            'gmb' => 'https://g.page/r/YYYYY', // Placeholder
            'review' => "Perfect Catch Pools exceeded my expectations! They keep my pool sparkling clean and the service is always reliable. Best pool service in Tampa Bay!",
            'icon' => 'lifebuoy', // Flux icon name
            'color' => 'blue',
        ],
        'liv' => [
            'name' => 'LIV Pools',
            'description' => 'Custom Pool Builder',
            'gmb' => 'https://g.page/r/ZZZZZ', // Placeholder
            'review' => "LIV Pools created a stunning custom pool for our backyard. The design process was smooth and the craftsmanship is top-notch. We love our new oasis!",
            'icon' => 'sparkles', // Flux icon name
            'color' => 'indigo',
        ],
    ],
    'webhooks' => [
        'submission' => env('N8N_SUBMISSION_WEBHOOK', 'https://n8n.perfectcatchai.com/webhook/4842906c-4479-449f-a898-2de21be86cfa'),
        'upload' => env('N8N_UPLOAD_WEBHOOK', 'https://n8n.perfectcatchai.com/webhook/4842906c-4479-449f-a898-2de21be86cfa'),
    ],
    'gift_cards' => [
        'amazon' => 'Amazon',
        'visa' => 'Visa',
        'target' => 'Target',
        'starbucks' => 'Starbucks',
    ],
];
