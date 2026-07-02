# Receipt Scanner — n8n Workflow Setup

## Overview

This directory contains n8n workflow exports for the receipt and mileage stack:

| Workflow | File | Webhook |
|----------|------|---------|
| Receipt Scanner (PWA upload) | `Receipt Scanner.json` | `POST /receipt` |
| Gmail Bill Scanner — Limit (50) | `Gmail Bill Scanner - Limit.json` | `POST /gmail-bills/limit` |
| Gmail Bill Scanner — All | `Gmail Bill Scanner - All.json` | `POST /gmail-bills/all` |
| Mileage Trip Record | `Mileage Trip Record.json` | `POST /mileage/trip` |
| Expense Record Delete | `Expense Record Delete.json` | `POST /expense/delete` |
| Email Record Delete | `Email Record Delete.json` | `POST /email/delete` |
| Mileage Record Delete | `Mileage Record Delete.json` | `POST /mileage/delete` |
| Receipt Getter | `Receipt Getter.json` | `POST /records/list` |

All webhooks use **Header Auth** (`x-api-key` header, same key as `RECEIPT_API_KEY`).

## Google Sheet tabs

One spreadsheet, three tabs by source:

| Tab | Workflows |
|-----|-----------|
| **Receipt** | Receipt Scanner, Expense Record Delete, Receipt Getter (`source=receipt`) |
| **Email** | Gmail Bill Scanner, Email Record Delete, Receipt Getter (`source=email`) |
| **Milage** | Mileage Trip Record, Mileage Record Delete, Receipt Getter (`source=mileage`) |

See [`credentials/README.md`](../credentials/README.md) for column headers and migration steps.

---

## Receipt Scanner

The `Receipt Scanner.json` workflow processes receipt images submitted from the PWA frontend.

### Flow

```
Webhook (POST /receipt)
  → OpenAI Vision (GPT-4o-mini) → Format Data → Google Sheets (Receipts tab) + Drive → Respond 200
```

### Setup

1. Import `Receipt Scanner.json`
2. Bind credentials: OpenAI, Google OAuth2 (Sheets + Drive), Header Auth
3. Confirm Sheet ID `16JLh3r3xC33bo3r6ksVBCEV9HR8iXdxWrm9vrL58yz0` and Drive folder `1_xZgUpeBfa4BOPBS-6289_nmcnpYOR9d` (or update to your own)
4. Ensure **Receipts** tab exists with correct headers
5. Set `RECEIPT_API_KEY` in n8n env vars
6. Activate and copy webhook URL to PWA `VITE_N8N_WEBHOOK_URL`

### Test

```bash
curl -X POST \
  https://your-n8n.example.com/webhook/receipt \
  -H "x-api-key: $RECEIPT_API_KEY" \
  -F "image=@receipt.jpg"
```

---

## Gmail Bill Scanner

Two workflows scan a **delegated Gmail mailbox** for messages in the **Purchases** category (`category:purchases`), dedupe by Gmail `internalDate`, analyze with OpenAI, upload PDFs to Drive, and append rows to the **Email** tab.

### Prerequisites

Complete **before** importing workflows — see [`credentials/README.md`](../credentials/README.md):

1. Google Service Account with **domain-wide delegation** and `gmail.readonly` scope
2. n8n credential: **Google Service Account API** (upload JSON key in UI — never in workflow JSON)
3. n8n env vars: `GMAIL_DELEGATED_USER`, `RECEIPT_API_KEY`
4. **Email** tab with `Email Timestamp` and `Transaction Type` headers

### Shared flow (both workflows)

```
Webhook
  → Read Email tab (Email Timestamp dedup)
  → List Gmail Purchases emails
  → Fetch metadata (internalDate) → filter already-recorded
  → [per email] Get full message → resolve PDF/image/text
  → OpenAI classify (purchase / refund / skip)
  → Drive upload + Sheets appendOrUpdate (Email tab)
```

**Refund rules:** `Transaction Type: Refund`, negative `Total`, `REFUND:` prefix in Items, `refund_` Drive filename.

### Workflow 1: Limit (50 recent)

**File:** `Gmail Bill Scanner - Limit.json`  
**Webhook:** `POST /gmail-bills/limit`

- Lists up to **50** newest `category:purchases` messages
- Waits for full processing, then returns summary JSON

### Workflow 2: All (paginated)

**File:** `Gmail Bill Scanner - All.json`  
**Webhook:** `POST /gmail-bills/all`

- Paginates **all** matching Purchases emails
- Responds immediately, then continues processing in background

### Gmail workflow setup

1. Import both JSON files
2. Bind credentials on each workflow (Header Auth, Service Account, OpenAI, Google OAuth2)
3. Set **Delegated User** on the service account credential to `{{$env.GMAIL_DELEGATED_USER}}`
4. Activate both workflows
5. Copy webhook URLs to PWA env vars

### Testing Gmail workflows

```bash
curl -X POST "$N8N_URL/webhook/gmail-bills/limit" \
  -H "x-api-key: $RECEIPT_API_KEY"
```

---

## Receipt Getter

**File:** `Receipt Getter.json`  
**Webhook:** `POST /records/list`

Paginated read from Google Sheets for the PWA (infinite scroll). Maps each tab's columns to API-friendly JSON.

### Request

```bash
curl -X POST "$N8N_URL/webhook/records/list" \
  -H "x-api-key: $RECEIPT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source":"receipt","offset":0,"limit":20}'
```

| Field | Values |
|-------|--------|
| `source` | `receipt`, `email`, or `mileage` |
| `offset` | Row offset (default `0`) |
| `limit` | Page size 1–50 (default `20`) |

### Response

```json
{
  "success": true,
  "source": "receipt",
  "items": [],
  "total": 59,
  "offset": 0,
  "limit": 20,
  "hasMore": true,
  "nextOffset": 20
}
```

PWA env: `VITE_N8N_RECORDS_LIST_WEBHOOK_URL`

---

**File:** `Mileage Trip Record.json`  
**Webhook:** `POST /mileage/trip`

Records business car trips from the PWA GPS tracker or manual entry to the **Mileage** tab.

### Flow

```
Webhook → Parse/Validate → Google Sheets append (Mileage tab) → Respond 200
```

### Request

```bash
curl -X POST "$N8N_URL/webhook/mileage/trip" \
  -H "x-api-key: $RECEIPT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "submittedAt": "2026-07-01T14:30:00.000Z",
    "startTime": "2026-07-01T14:00:00.000Z",
    "endTime": "2026-07-01T14:30:00.000Z",
    "startLat": 43.6532,
    "startLng": -79.3832,
    "endLat": 43.6622,
    "endLng": -79.3832,
    "distanceKm": 12.5,
    "businessPurpose": "Client site visit",
    "trackingMode": "GPS",
    "gpsPointCount": 42
  }'
```

### Setup

1. Create **Mileage** tab with headers (see credentials README)
2. Set n8n env `MILEAGE_RATE_CAD=0.72` (update annually per CRA)
3. Import workflow, bind Google Sheets OAuth2 + Header Auth
4. Activate; copy URL to PWA `VITE_N8N_MILEAGE_WEBHOOK_URL`

---

## Delete workflows

Three focused delete workflows — one per tab, no shared branching.

### Expense Record Delete (Receipts tab)

**Webhook:** `POST /expense/delete`

```bash
curl -X POST "$N8N_URL/webhook/expense/delete" \
  -H "x-api-key: $RECEIPT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"submittedAt":"2026-05-11T04:46:19.578Z"}'
```

PWA: `VITE_N8N_DELETE_WEBHOOK_URL`

### Email Record Delete (Email tab)

**Webhook:** `POST /email/delete`

```bash
curl -X POST "$N8N_URL/webhook/email/delete" \
  -H "x-api-key: $RECEIPT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"emailTimestamp":"1735689600000"}'
```

PWA: `VITE_N8N_EMAIL_DELETE_WEBHOOK_URL`

### Mileage Record Delete (Mileage tab)

**Webhook:** `POST /mileage/delete`

```bash
curl -X POST "$N8N_URL/webhook/mileage/delete" \
  -H "x-api-key: $RECEIPT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"submittedAt":"2026-07-01T14:30:00.000Z"}'
```

PWA: `VITE_N8N_MILEAGE_DELETE_WEBHOOK_URL`

### Responses (all delete workflows)

- `200` — `{ success: true, deleted: true, rowNumber, matchedBy }`
- `404` — row not found
- `400` — missing required key

---

## General troubleshooting

- **401 errors**: `RECEIPT_API_KEY` must match PWA `VITE_N8N_API_KEY`
- **OpenAI errors**: API key needs `gpt-4o-mini` access
- **Google OAuth errors**: Scopes include `spreadsheets` and `drive.file`
- **Sheet not found**: Tab names must be exactly `Receipts`, `Email`, `Mileage`
- **Binary data issues** (Receipt Scanner): Webhook must receive file as `image` field
