# Receipt Scanner — n8n Workflow Setup

## Overview

This directory contains n8n workflow exports for the receipt stack:

| Workflow | File | Webhook |
|----------|------|---------|
| Receipt Scanner (PWA upload) | `Receipt Scanner.json` | `POST /receipt` |
| Gmail Bill Scanner — Limit (50) | `Gmail Bill Scanner - Limit.json` | `POST /gmail-bills/limit` |
| Gmail Bill Scanner — All | `Gmail Bill Scanner - All.json` | `POST /gmail-bills/all` |
| Expense Record Delete | `Expense Record Delete.json` | `POST /expense/delete` |

All webhooks use **Header Auth** (`x-api-key` header, same key as `RECEIPT_API_KEY`).

---

## Receipt Scanner

The `Receipt Scanner.json` workflow processes receipt images submitted from the PWA frontend.

### Flow

```
Webhook (POST /receipt)
  → OpenAI Vision (GPT-4o-mini) → Format Data → Google Sheets + Google Drive → Respond 200
```

### Setup

1. Import `Receipt Scanner.json`
2. Bind credentials: OpenAI, Google OAuth2 (Sheets + Drive), Header Auth
3. Confirm Sheet ID `16JLh3r3xC33bo3r6ksVBCEV9HR8iXdxWrm9vrL58yz0` and Drive folder `1_xZgUpeBfa4BOPBS-6289_nmcnpYOR9d` (or update to your own)
4. Set `RECEIPT_API_KEY` in n8n env vars
5. Activate and copy webhook URL to PWA `VITE_N8N_WEBHOOK_URL`

### Test

```bash
curl -X POST \
  https://your-n8n.example.com/webhook/receipt \
  -H "x-api-key: $RECEIPT_API_KEY" \
  -F "image=@receipt.jpg"
```

---

## Gmail Bill Scanner

Two workflows scan a **delegated Gmail mailbox** for messages in the **Purchases** category (`category:purchases`), dedupe by Gmail `internalDate`, analyze with OpenAI, upload PDFs to Drive, and append rows to the same expense sheet as Receipt Scanner.

### Prerequisites

Complete **before** importing workflows — see [`credentials/README.md`](../credentials/README.md):

1. Google Service Account with **domain-wide delegation** and `gmail.readonly` scope
2. n8n credential: **Google Service Account API** (upload JSON key in UI — never in workflow JSON)
3. n8n env vars: `GMAIL_DELEGATED_USER`, `RECEIPT_API_KEY`
4. Google Sheet columns: add `Email Timestamp` and `Transaction Type` headers (see credentials README)

### Shared flow (both workflows)

```
Webhook
  → Read sheet (Email Timestamp dedup)
  → List Gmail Purchases emails
  → Fetch metadata (internalDate) → filter already-recorded
  → [per email] Get full message → resolve PDF/image/text
  → OpenAI classify (purchase / refund / skip)
  → Drive upload + Sheets appendOrUpdate
```

**Refund rules:** `Transaction Type: Refund`, negative `Total`, `REFUND:` prefix in Items, `refund_` Drive filename.

### Workflow 1: Limit (50 recent)

**File:** `Gmail Bill Scanner - Limit.json`  
**Webhook:** `POST /gmail-bills/limit`

- Lists up to **50** newest `category:purchases` messages
- Waits for full processing, then returns:

```json
{
  "success": true,
  "mode": "limit",
  "processed": 12,
  "purchases": 10,
  "refunds": 2,
  "skipped": 38,
  "errors": []
}
```

### Workflow 2: All (paginated)

**File:** `Gmail Bill Scanner - All.json`  
**Webhook:** `POST /gmail-bills/all`

- Paginates **all** matching Purchases emails
- Responds immediately, then continues processing in background:

```json
{
  "success": true,
  "mode": "all",
  "accepted": true,
  "toProcess": 142,
  "skipped": 58,
  "message": "Scan started; processing in background"
}
```

### Gmail workflow setup

1. Import both JSON files
2. Bind credentials on each workflow:
   - **Header Auth** — same as Receipt Scanner (`o90kkLJZ1Wsqy6bT` placeholder)
   - **Google Service Account API** — all Gmail HTTP Request nodes
   - **OpenAI API** — vision + text analyze nodes
   - **Google OAuth2** — Sheets + Drive nodes (same as Receipt Scanner)
3. Set **Delegated User** on the service account credential to `{{$env.GMAIL_DELEGATED_USER}}`
4. Activate both workflows
5. Copy webhook URLs to PWA:
   - `VITE_N8N_GMAIL_LIMIT_WEBHOOK_URL`
   - `VITE_N8N_GMAIL_ALL_WEBHOOK_URL`

### Testing Gmail workflows

```bash
# Credential smoke test — list 1 Purchases message
curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://gmail.googleapis.com/gmail/v1/users/$GMAIL_DELEGATED_USER/messages?q=category:purchases&maxResults=1"

# Limit scan (50)
curl -X POST "$N8N_URL/webhook/gmail-bills/limit" \
  -H "x-api-key: $RECEIPT_API_KEY"

# Full scan (async)
curl -X POST "$N8N_URL/webhook/gmail-bills/all" \
  -H "x-api-key: $RECEIPT_API_KEY"
```

### Gmail troubleshooting

| Issue | Check |
|-------|-------|
| Gmail 403 / delegation error | Domain-wide delegation scope `gmail.readonly`; delegated user is Workspace mailbox |
| `GMAIL_DELEGATED_USER` not set | n8n env var must match mailbox email |
| Duplicate rows | `Email Timestamp` column exists; `appendOrUpdate` matches on that column |
| OpenAI skip count high | Non-financial Purchases emails (shipping-only) are intentionally skipped |
| All workflow timeout | Large mailboxes may hit n8n execution limits; use Limit workflow or schedule smaller batches |

---

## Sheet columns (standard)

| Column | Used by |
|--------|---------|
| Date, Vendor, Category, Total, Tax, Currency, Items, Confidence, Submitted At | Receipt + Gmail |
| Image Link / link | Drive `webViewLink` |
| Email Timestamp | Gmail dedup key (`internalDate` ms string) |
| Transaction Type | `Purchase` or `Refund` |

---

## Expense Record Delete

**File:** `Expense Record Delete.json`  
**Webhook:** `POST /expense/delete`

Deletes one row from the expense Google Sheet by matching `Submitted At` (camera receipts) or `Email Timestamp` (Gmail imports).

### Request

```bash
curl -X POST "$N8N_URL/webhook/expense/delete" \
  -H "x-api-key: $RECEIPT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"submittedAt":"2026-05-11T04:46:19.578Z"}'
```

Gmail row:

```bash
curl -X POST "$N8N_URL/webhook/expense/delete" \
  -H "x-api-key: $RECEIPT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"emailTimestamp":"1735689600000"}'
```

### Responses

- `200` — `{ success: true, deleted: true, rowNumber, matchedBy }`
- `404` — row not found
- `400` — missing both `submittedAt` and `emailTimestamp`

PWA: set `VITE_N8N_DELETE_WEBHOOK_URL` and use the trash icon on each history card (two-step confirm).

---

## General troubleshooting

- **401 errors**: `RECEIPT_API_KEY` must match PWA `VITE_N8N_API_KEY`
- **OpenAI errors**: API key needs `gpt-4o-mini` access
- **Google OAuth errors**: Scopes include `spreadsheets` and `drive.file`
- **Binary data issues** (Receipt Scanner): Webhook must receive file as `image` field
