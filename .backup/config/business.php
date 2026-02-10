<?php

return [
	/*
	|--------------------------------------------------------------------------
	| Webhook Configuration
	|--------------------------------------------------------------------------
	|
	| Configure the n8n webhook URLs for submission and upload notifications.
	| These are triggered when a user submits the review form and uploads
	| their screenshot.
	|
	*/
	'webhooks' => [
		'submission' => env( 'N8N_SUBMISSION_WEBHOOK' ),
		'upload'     => env( 'N8N_UPLOAD_WEBHOOK' ),
	],
];
