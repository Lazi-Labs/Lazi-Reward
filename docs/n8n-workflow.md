# n8n Workflow: Screenshot Validation & Gift Card Distribution

This document describes how to set up an n8n workflow that:
1. Receives screenshot uploads from the Laravel app
2. Validates screenshots using OCR to confirm they're legitimate Google reviews
3. Sends validated submissions to Tremendous to issue gift cards
4. Handles Tremendous webhooks to deliver gift card details to users

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Workflow Overview](#workflow-overview)
- [Step 1: Webhook - Receive Screenshot Upload](#step-1-webhook---receive-screenshot-upload)
- [Step 2: HTTP Request - Fetch Screenshot](#step-2-http-request---fetch-screenshot)
- [Step 3: OCR Validation](#step-3-ocr-validation)
- [Step 4: IF Node - Validation Check](#step-4-if-node---validation-check)
- [Step 5: HTTP Request - Create Tremendous Order](#step-5-http-request---create-tremendous-order)
- [Step 6: Webhook - Tremendous Callback](#step-6-webhook---tremendous-callback)
- [Step 7: Notify User](#step-7-notify-user)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. **n8n instance** (self-hosted or cloud)
2. **Tremendous account** with API access
3. **OCR service** (Google Cloud Vision, AWS Textract, or OpenAI Vision)
4. **Laravel app** configured with webhook URLs in `.env`

---

## Workflow Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Laravel App    │────▶│  n8n Webhook    │────▶│  Fetch Image    │
│  Upload Event   │     │  (Trigger)      │     │  (HTTP Request) │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Tremendous     │◀────│  IF: Valid?     │◀────│  OCR Analysis   │
│  Create Order   │     │                 │     │  (Vision API)   │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       ▼ (Invalid)
         │              ┌─────────────────┐
         │              │  Flag for       │
         │              │  Manual Review  │
         │              └─────────────────┘
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Tremendous     │────▶│  Notify User    │
│  Webhook        │     │  (Email/SMS)    │
└─────────────────┘     └─────────────────┘
```

---

## Step 1: Webhook - Receive Screenshot Upload

Create a **Webhook** node to receive data from Laravel when a user uploads their review screenshot.

### Configuration

| Setting | Value |
|---------|-------|
| HTTP Method | POST |
| Path | `screenshot-upload` |
| Authentication | None (or Header Auth) |
| Response Mode | Immediately |

### Incoming Data Structure

The webhook receives full submission data when a screenshot is uploaded:

```json
{
  "id": "uuid-submission-id",
  "token": "review_abc123xyz789ab",
  "screenshot_url": "https://your-domain.test/storage/screenshots/filename.png",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "business_name": "Acme Services",
  "business_key": "acme",
  "gift_card_name": "Amazon",
  "gift_card_key": "amazon"
}
```

### Access Data in Subsequent Nodes

```javascript
// Submission ID
{{ $json.id }}

// Screenshot URL
{{ $json.screenshot_url }}

// Customer info
{{ $json.name }}
{{ $json.email }}
{{ $json.phone }}

// Business info
{{ $json.business_name }}

// Gift card choice
{{ $json.gift_card_name }}
{{ $json.gift_card_key }}
```

---

## Step 2: HTTP Request - Fetch Screenshot

Use an **HTTP Request** node to download the screenshot image for OCR processing.

### Configuration

| Setting | Value |
|---------|-------|
| Method | GET |
| URL | `{{ $json.screenshot_url }}` |
| Response Format | File |

---

## Step 3: OCR Validation

Use one of these OCR options to extract text from the screenshot and validate it's a legitimate Google review.

### Option A: Google Cloud Vision API

**HTTP Request** node configuration:

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `https://vision.googleapis.com/v1/images:annotate?key={{ $credentials.googleApiKey }}` |
| Body Content Type | JSON |

**Request Body:**
```json
{
  "requests": [
    {
      "image": {
        "source": {
          "imageUri": "{{ $node['Webhook'].json.screenshot_url }}"
        }
      },
      "features": [
        {
          "type": "TEXT_DETECTION"
        }
      ]
    }
  ]
}
```

### Option B: OpenAI Vision API

**HTTP Request** node configuration:

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `https://api.openai.com/v1/chat/completions` |
| Authentication | Header Auth |
| Header Name | Authorization |
| Header Value | `Bearer {{ $credentials.openaiApiKey }}` |

**Request Body:**
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Analyze this screenshot and determine if it shows a legitimate Google review. Look for: 1) Google Maps or Google Business interface elements, 2) A star rating (1-5 stars), 3) Review text content, 4) User profile information. Respond with JSON: {\"is_valid\": true/false, \"confidence\": 0-100, \"detected_stars\": number or null, \"reason\": \"explanation\"}"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "{{ $node['Webhook'].json.screenshot_url }}"
          }
        }
      ]
    }
  ],
  "max_tokens": 300
}
```

### Option C: AWS Textract

**HTTP Request** node with AWS credentials to call Textract API.

---

## Step 4: IF Node - Validation Check

Add an **IF** node to branch based on OCR validation results.

### For OpenAI Vision Response

**Condition:**
```javascript
// Parse the response and check validity
{{ JSON.parse($json.choices[0].message.content).is_valid === true }}
```

**Alternative - Check for keywords in OCR text:**
```javascript
// Check if extracted text contains Google review indicators
{{
  $json.text.toLowerCase().includes('google') &&
  ($json.text.includes('★') || $json.text.match(/[1-5]\s*star/i))
}}
```

### Branches

- **True (Valid):** Continue to Tremendous order creation
- **False (Invalid):** Flag for manual review or reject

---

## Step 5: HTTP Request - Create Tremendous Order

When validation passes, create a gift card order via Tremendous API.

### Configuration

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `https://api.tremendous.com/api/v2/orders` |
| Authentication | Header Auth |
| Header Name | Authorization |
| Header Value | `Bearer {{ $credentials.tremendousApiKey }}` |

> **Note:** Use `https://testflight.tremendous.com/api/v2/orders` for sandbox testing.

### Request Body

```json
{
  "payment": {
    "funding_source_id": "BALANCE"
  },
  "reward": {
    "value": {
      "denomination": 25,
      "currency_code": "USD"
    },
    "delivery": {
      "method": "LINK"
    },
    "recipient": {
      "name": "{{ $node['Webhook'].json.name }}",
      "email": "{{ $node['Webhook'].json.email }}"
    },
    "products": [
      "YOUR-PRODUCT-ID"
    ],
    "custom_fields": [
      {
        "id": "submission_id",
        "value": "{{ $node['Webhook'].json.id }}"
      },
      {
        "id": "business_name",
        "value": "{{ $node['Webhook'].json.business_name }}"
      },
      {
        "id": "gift_card_choice",
        "value": "{{ $node['Webhook'].json.gift_card_name }}"
      }
    ]
  },
  "external_id": "{{ $node['Webhook'].json.id }}"
}
```

> **Tip:** Use `gift_card_key` to map to Tremendous product IDs dynamically.

### Common Tremendous Product IDs

| Product | ID |
|---------|-----|
| Amazon | `OKMHM2X2OHYV` |
| Visa Prepaid | `Q24BD9EZ332JT` |
| Starbucks | `ET0ZVETV5ILN` |
| Target | `KV934TZ93NQM` |

> Get your available products via: `GET https://api.tremendous.com/api/v2/products`

### Response Example

```json
{
  "order": {
    "id": "ORD_ABC123",
    "status": "EXECUTED",
    "rewards": [
      {
        "id": "RWD_XYZ789",
        "delivery": {
          "method": "LINK",
          "status": "PENDING"
        },
        "recipient": {
          "email": "user@example.com",
          "name": "John Doe"
        }
      }
    ]
  }
}
```

---

## Step 6: Webhook - Tremendous Callback

Create a **separate workflow** with a Webhook node to receive Tremendous delivery notifications.

### Webhook Configuration

| Setting | Value |
|---------|-------|
| HTTP Method | POST |
| Path | `tremendous-callback` |
| Response Mode | Immediately |

### Configure Tremendous Webhook

1. Go to **Tremendous Dashboard** → **Settings** → **Webhooks**
2. Add your n8n webhook URL: `https://your-n8n.url/webhook/tremendous-callback`
3. Select events: `REWARDS.DELIVERY.SUCCEEDED`

### Tremendous Webhook Payload

```json
{
  "event": "REWARDS.DELIVERY.SUCCEEDED",
  "data": {
    "reward": {
      "id": "RWD_XYZ789",
      "order_id": "ORD_ABC123",
      "value": {
        "denomination": 25,
        "currency_code": "USD"
      },
      "recipient": {
        "name": "John Doe",
        "email": "user@example.com"
      },
      "delivery": {
        "method": "LINK",
        "status": "DELIVERED",
        "link": "https://www.tremendous.com/rewards/REWARD_LINK_HERE"
      }
    }
  }
}
```

---

## Step 7: Notify User

After receiving the Tremendous callback, notify the user with their gift card details.

### Option A: Update Laravel App via API

**HTTP Request** node:

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `https://your-laravel-app.com/api/gift-card-delivered` |

**Body:**
```json
{
  "submission_id": "{{ $json.data.reward.order_id }}",
  "reward_link": "{{ $json.data.reward.delivery.link }}",
  "status": "delivered"
}
```

### Option B: Send Email Directly

Use the **Send Email** node or **Gmail/SMTP** node:

| Setting | Value |
|---------|-------|
| To | `{{ $json.data.reward.recipient.email }}` |
| Subject | `Your Gift Card is Ready!` |
| Body | See template below |

**Email Template:**
```html
Hi {{ $json.data.reward.recipient.name }},

Thank you for your Google review! Your ${{ $json.data.reward.value.denomination }} gift card is ready.

Click here to claim your reward:
{{ $json.data.reward.delivery.link }}

This link is unique to you - please don't share it.

Thanks,
The Team
```

### Option C: Send SMS via Twilio

**Twilio** node configuration:

| Setting | Value |
|---------|-------|
| To | `{{ $node['Get Submission'].json.phone }}` |
| Message | `Your gift card is ready! Claim it here: {{ $json.data.reward.delivery.link }}` |

---

## Environment Variables

Add these to your n8n environment or credentials:

```env
# Tremendous API
TREMENDOUS_API_KEY=your-api-key
TREMENDOUS_FUNDING_SOURCE_ID=your-funding-source-id

# Google Cloud Vision (if using)
GOOGLE_CLOUD_API_KEY=your-google-api-key

# OpenAI (if using)
OPENAI_API_KEY=your-openai-api-key

# Laravel App
LARAVEL_APP_URL=https://your-app.com
LARAVEL_API_TOKEN=your-api-token
```

---

## Complete Workflow JSON

Import this JSON into n8n to get started:

```json
{
  "name": "Screenshot Validation & Gift Card",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "screenshot-upload",
        "responseMode": "onReceived",
        "responseData": "allEntries"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "={{ $json.screenshot_url }}",
        "options": {}
      },
      "name": "Fetch Screenshot",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    },
    {
      "parameters": {
        "url": "https://api.openai.com/v1/chat/completions",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "model",
              "value": "gpt-4o"
            },
            {
              "name": "messages",
              "value": "={{ JSON.stringify([{role: 'user', content: [{type: 'text', text: 'Analyze this screenshot and determine if it shows a legitimate Google review. Respond with JSON: {is_valid: boolean, confidence: number, reason: string}'}, {type: 'image_url', image_url: {url: $node['Webhook'].json.screenshot_url}}]}]) }}"
            }
          ]
        }
      },
      "name": "OCR Validation",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ JSON.parse($json.choices[0].message.content).is_valid }}",
              "value2": true
            }
          ]
        }
      },
      "name": "Is Valid?",
      "type": "n8n-nodes-base.if",
      "position": [850, 300]
    },
    {
      "parameters": {
        "url": "https://api.tremendous.com/api/v2/orders",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({payment: {funding_source_id: 'BALANCE'}, reward: {value: {denomination: 25, currency_code: 'USD'}, delivery: {method: 'LINK'}, recipient: {name: $node['Webhook'].json.name, email: $node['Webhook'].json.email}, products: ['YOUR-PRODUCT-ID']}, external_id: $node['Webhook'].json.id}) }}"
      },
      "name": "Create Tremendous Order",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1050, 200]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Fetch Screenshot", "type": "main", "index": 0}]]
    },
    "Fetch Screenshot": {
      "main": [[{"node": "OCR Validation", "type": "main", "index": 0}]]
    },
    "OCR Validation": {
      "main": [[{"node": "Is Valid?", "type": "main", "index": 0}]]
    },
    "Is Valid?": {
      "main": [
        [{"node": "Create Tremendous Order", "type": "main", "index": 0}],
        [{"node": "Flag for Review", "type": "main", "index": 0}]
      ]
    }
  }
}
```

---

## Testing

### 1. Test Webhook Endpoint

```bash
curl -X POST https://your-n8n.url/webhook/screenshot-upload \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-uuid-123",
    "token": "review_test12345678",
    "screenshot_url": "https://your-app.test/storage/screenshots/test.png",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "business_name": "Acme Services",
    "business_key": "acme",
    "gift_card_name": "Amazon",
    "gift_card_key": "amazon"
  }'
```

### 2. Test Tremendous API (Sandbox)

```bash
curl -X POST https://testflight.tremendous.com/api/v2/orders \
  -H "Authorization: Bearer YOUR-SANDBOX-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "payment": {"funding_source_id": "BALANCE"},
    "reward": {
      "value": {"denomination": 10, "currency_code": "USD"},
      "delivery": {"method": "LINK"},
      "recipient": {"name": "Test User", "email": "test@example.com"},
      "products": ["OKMHM2X2OHYV"]
    }
  }'
```

### 3. Simulate Tremendous Webhook

```bash
curl -X POST https://your-n8n.url/webhook/tremendous-callback \
  -H "Content-Type: application/json" \
  -d '{
    "event": "REWARDS.DELIVERY.SUCCEEDED",
    "data": {
      "reward": {
        "id": "RWD_TEST123",
        "delivery": {
          "link": "https://tremendous.com/rewards/TEST_LINK"
        },
        "recipient": {
          "email": "test@example.com",
          "name": "Test User"
        }
      }
    }
  }'
```

---

## Troubleshooting

### Webhook Not Receiving Data

1. Ensure n8n workflow is **activated**
2. Check webhook URL in Laravel `.env` matches n8n URL
3. Verify firewall/network allows incoming connections
4. Check n8n logs for errors

### OCR Validation Failing

1. Ensure image URL is publicly accessible
2. Check API credentials are valid
3. Review OCR response in n8n execution log
4. Adjust validation criteria if too strict

### Tremendous Order Failing

1. Verify API key is correct (sandbox vs production)
2. Check funding source has sufficient balance
3. Ensure product ID is valid
4. Review error response in n8n execution log

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check API key |
| 402 | Insufficient funds | Add funds to Tremendous |
| 422 | Invalid request | Check request body format |
| 429 | Rate limited | Add delays between requests |

---

## Laravel Integration

Update your Laravel `.env` with the n8n webhook URL:

```env
N8N_UPLOAD_WEBHOOK=https://your-n8n.url/webhook/screenshot-upload
```

The upload webhook is called from `app/Livewire/ScreenshotUpload.php` with the full submission data:

```php
Http::post($webhookUrl, [
    'id' => $this->submission->id,
    'token' => $this->token,
    'screenshot_url' => asset('storage/' . $path),
    'name' => $this->submission->name,
    'email' => $this->submission->email,
    'phone' => $this->submission->phone,
    'business_name' => $this->submission->business?->name,
    'business_key' => $this->submission->business_key,
    'gift_card_name' => $this->submission->giftCard?->name,
    'gift_card_key' => $this->submission->gift_card_choice,
]);
```

This payload includes all the data needed for OCR validation and Tremendous order creation without requiring a separate API lookup.