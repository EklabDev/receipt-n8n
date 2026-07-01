# Receipt Scanner 🧾

A mobile-first PWA for capturing receipt photos, analyzing them with AI, and organizing them in Google Sheets + Drive for tax records. Gmail Bill Scanner workflows extend the same sheet with automated Purchases-category email ingestion.

## Architecture

```
┌─────────────────────┐     HTTPS + API Key     ┌──────────────────────────────────┐
│   📱 PWA Frontend   │ ──────────────────────▶ │   ⚙️ n8n (Self-Hosted)           │
│  (GitHub Pages)     │                          │                                  │
│                     │                          │  • POST /receipt (camera upload) │
│  • PIN Lock Gate    │ ◀────── JSON Response ── │  • POST /gmail-bills/limit (50)  │
│  • Camera Capture   │                          │  • POST /gmail-bills/all         │
│  • Gmail Scan Panel │                          │  • OpenAI → Sheets + Drive       │
│  • Receipt History  │                          │  • Gmail via Service Account     │
└─────────────────────┘                          └──────────────────────────────────┘
```

**Gmail path:** Service account + domain-wide delegation reads `category:purchases` from `GMAIL_DELEGATED_USER`. Dedup uses Gmail `internalDate` stored as `Email Timestamp` in the sheet. Refunds are recorded with negative `Total` and `Transaction Type: Refund`.

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

1. Import workflows from `workflow/` into your n8n instance
2. Set up credentials per `credentials/README.md` (OAuth2, OpenAI, Service Account for Gmail)
3. Configure env vars: `RECEIPT_API_KEY`, `GMAIL_DELEGATED_USER`
4. Activate workflows and copy webhook URLs to `.env`

### 3. Deploy to GitHub Pages

1. Add these GitHub Secrets in your repo settings:
   - `VITE_APP_PIN` — Your unlock PIN
   - `VITE_N8N_WEBHOOK_URL` — Receipt webhook URL
   - `VITE_N8N_GMAIL_LIMIT_WEBHOOK_URL` — Gmail limit scan URL
   - `VITE_N8N_GMAIL_ALL_WEBHOOK_URL` — Gmail full scan URL
   - `VITE_N8N_API_KEY` — Your API key
2. Push to `main` branch — the GitHub Action will build and deploy

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_APP_PIN` | PWA `.env` / GitHub Secrets | PIN to unlock the PWA |
| `VITE_N8N_WEBHOOK_URL` | PWA `.env` / GitHub Secrets | Receipt upload webhook |
| `VITE_N8N_GMAIL_LIMIT_WEBHOOK_URL` | PWA `.env` / GitHub Secrets | Gmail scan (50 recent) |
| `VITE_N8N_GMAIL_ALL_WEBHOOK_URL` | PWA `.env` / GitHub Secrets | Gmail scan (all purchases) |
| `VITE_N8N_DELETE_WEBHOOK_URL` | PWA `.env` / GitHub Secrets | Delete expense row webhook |
| `VITE_N8N_API_KEY` | PWA `.env` / GitHub Secrets | `x-api-key` for all webhooks |
| `RECEIPT_API_KEY` | n8n env vars | Same API key, validated server-side |
| `GMAIL_DELEGATED_USER` | n8n env vars | Workspace mailbox for Gmail delegation |

## Tech Stack

- **Frontend**: Vite, React 19, TypeScript, shadcn/ui, Tailwind CSS v4
- **PWA**: vite-plugin-pwa with Workbox
- **Backend**: n8n (self-hosted)
- **AI**: OpenAI GPT-4o-mini (vision + text)
- **Storage**: Google Sheets + Google Drive
- **Gmail**: Google Service Account + domain-wide delegation
- **Deploy**: GitHub Pages via GitHub Actions

## License

Private — EKLab
