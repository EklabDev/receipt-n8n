# Receipt Scanner 🧾

A mobile-first PWA for capturing receipt photos, tracking business car mileage, and organizing records in Google Sheets + Drive for tax purposes. Gmail Bill Scanner workflows populate the Email tab; GPS mileage tracking populates the Mileage tab.

## Architecture

```
┌─────────────────────┐     HTTPS + API Key     ┌──────────────────────────────────┐
│   📱 PWA Frontend   │ ──────────────────────▶ │   ⚙️ n8n (Self-Hosted)           │
│  (GitHub Pages)     │                          │                                  │
│                     │                          │  • POST /receipt (camera)        │
│  • PIN Lock Gate    │ ◀────── JSON Response ── │  • POST /gmail-bills/*         │
│  • Camera Capture   │                          │  • POST /mileage/trip          │
│  • GPS Mileage      │                          │  • DELETE /expense|email|mileage │
│  • Gmail Scan Panel │                          │  • OpenAI → Sheets + Drive     │
└─────────────────────┘                          └──────────────────────────────────┘
                                                          │
                              ┌───────────────────────────┼───────────────────────────┐
                              ▼                           ▼                           ▼
                        Receipts tab                 Email tab                   Mileage tab
```

**Gmail path:** Service account + domain-wide delegation reads `category:purchases` from `GMAIL_DELEGATED_USER`. Dedup uses Gmail `internalDate` stored as `Email Timestamp`.

**Mileage path:** PWA GPS start/stop (or manual entry) → distance calculation → Mileage tab with CRA deduction amount.

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `receipt-app/` | Vite + React + TypeScript PWA frontend |
| `workflow/` | n8n workflow JSON exports + setup docs |
| `credentials/` | Credential templates + setup guide |
| `scripts/` | Workflow generators (Gmail Bill Scanner) |
| `.github/workflows/` | GitHub Actions for Pages deployment |

## Quick Start

### 1. Frontend Development

```bash
cd receipt-app
cp .env.example .env   # Edit with your values
npm install
npm run dev
```

### 2. n8n Workflow Setup

1. Create Google Sheet tabs: **Receipts**, **Email**, **Mileage** (see `credentials/README.md`)
2. Import workflows from `workflow/` into your n8n instance
3. Set up credentials per `credentials/README.md` (OAuth2, OpenAI, Service Account for Gmail)
4. Configure env vars: `RECEIPT_API_KEY`, `GMAIL_DELEGATED_USER`, `MILEAGE_RATE_CAD`
5. Activate workflows and copy webhook URLs to `.env`

### 3. Deploy to GitHub Pages

1. Add GitHub Secrets (see Environment Variables below)
2. Push to `main` branch — the GitHub Action will build and deploy

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_APP_PIN` | PWA `.env` / GitHub Secrets | PIN to unlock the PWA |
| `VITE_N8N_WEBHOOK_URL` | PWA `.env` / GitHub Secrets | Receipt upload webhook |
| `VITE_N8N_GMAIL_LIMIT_WEBHOOK_URL` | PWA `.env` / GitHub Secrets | Gmail scan (50 recent) |
| `VITE_N8N_GMAIL_ALL_WEBHOOK_URL` | PWA `.env` / GitHub Secrets | Gmail scan (all purchases) |
| `VITE_N8N_DELETE_WEBHOOK_URL` | PWA `.env` / GitHub Secrets | Delete Receipts tab row |
| `VITE_N8N_EMAIL_DELETE_WEBHOOK_URL` | PWA `.env` / GitHub Secrets | Delete Email tab row |
| `VITE_N8N_MILEAGE_WEBHOOK_URL` | PWA `.env` / GitHub Secrets | Submit mileage trip |
| `VITE_N8N_RECORDS_LIST_WEBHOOK_URL` | PWA `.env` / GitHub Secrets | List records from Google Sheets |
| `VITE_N8N_API_KEY` | PWA `.env` / GitHub Secrets | `x-api-key` for all webhooks |
| `RECEIPT_API_KEY` | n8n env vars | Same API key, validated server-side |
| `GMAIL_DELEGATED_USER` | n8n env vars | Workspace mailbox for Gmail delegation |
| `MILEAGE_RATE_CAD` | n8n env vars | CRA per-km rate (e.g. `0.72`) |

## Tech Stack

- **Frontend**: Vite, React 19, TypeScript, shadcn/ui, Tailwind CSS v4
- **PWA**: vite-plugin-pwa with Workbox
- **Backend**: n8n (self-hosted)
- **AI**: OpenAI GPT-4o-mini (vision + text)
- **Storage**: Google Sheets + Google Drive (three tabs)
- **Gmail**: Google Service Account + domain-wide delegation
- **Mileage**: Browser Geolocation API + Haversine distance
- **Deploy**: GitHub Pages via GitHub Actions

## License

Private — EKLab
