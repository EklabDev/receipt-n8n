# Receipt Scanner — n8n Workflow Setup

## Overview

The `receipt-scanner.json` workflow processes receipt images submitted from the PWA frontend.

## Flow

```
Webhook (POST /receipt)
  → Check API Key (x-api-key header)
    → ✅ Valid: OpenAI Vision (GPT-4o) → Format Data → Google Sheets + Google Drive → Respond 200
    → ❌ Invalid: Respond 401
```

## Setup Instructions

### 1. Import the Workflow

1. Open your n8n instance
2. Go to **Workflows → Import from File**
3. Select `receipt-scanner.json`
4. The workflow will be imported in inactive state

### 2. Configure Environment Variables

In your n8n instance, set the following environment variable:

| Variable | Purpose |
|----------|---------|
| `RECEIPT_API_KEY` | API key that the PWA sends in the `x-api-key` header |

### 3. Setup Credentials

You need to create the following credentials in n8n:

#### OpenAI API
- Type: `OpenAI API`
- Add your OpenAI API key
- Assign to the "OpenAI - Analyze Receipt" node

#### Google OAuth2
- Type: `Google OAuth2 API`
- Scopes needed:
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive.file`
- Assign to both "Google Sheets" and "Google Drive" nodes

### 4. Configure Google Sheet

1. Create a new Google Sheet for tax receipts
2. Add these column headers in Row 1:
   - A: `Date`
   - B: `Vendor`
   - C: `Category`
   - D: `Total`
   - E: `Tax`
   - F: `Currency`
   - G: `Items`
   - H: `Image Link`
   - I: `Confidence`
   - J: `Submitted At`
3. Copy the Sheet ID from the URL
4. Update the "Google Sheets - Append Row" node with your Sheet ID

### 5. Configure Google Drive

1. Create a folder in Google Drive for receipt images
2. Copy the folder ID from the URL
3. Update the "Google Drive - Upload Image" node with your folder ID

### 6. Activate the Workflow

1. Set the webhook to production mode
2. Activate the workflow
3. Copy the webhook URL for your PWA `.env` file

## Testing

Send a test request:

```bash
curl -X POST \
  https://your-n8n.example.com/webhook/receipt \
  -H "x-api-key: your-api-key" \
  -F "image=@receipt.jpg" \
  -F 'metadata={"submittedAt":"2026-05-08T12:00:00Z","deviceInfo":"test"}'
```

## Troubleshooting

- **401 errors**: Check that `RECEIPT_API_KEY` env var matches the key in your PWA `.env`
- **OpenAI errors**: Verify your API key has access to GPT-4o with vision
- **Google errors**: Ensure OAuth2 credentials have the correct scopes
- **Binary data issues**: Make sure the webhook is receiving the file as `image` field
