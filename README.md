# Receipt Scanner 🧾

A mobile-first PWA for capturing receipt photos, analyzing them with AI, and organizing them in Google Sheets + Drive for tax records.

## Architecture

```
┌─────────────────────┐     HTTPS + API Key     ┌──────────────────────┐
│   📱 PWA Frontend   │ ──────────────────────▶ │   ⚙️ n8n Workflow    │
│  (GitHub Pages)     │                          │  (Self-Hosted)       │
│                     │                          │                      │
│  • PIN Lock Gate    │ ◀────── JSON Response ── │  • Webhook Trigger   │
│  • Camera Capture   │                          │  • API Key Check     │
│  • Receipt History  │                          │  • OpenAI Vision     │
│  • Local Storage    │                          │  • Google Sheets     │
└─────────────────────┘                          │  • Google Drive      │
                                                 └──────────────────────┘
```

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `receipt-app/` | Vite + React + TypeScript PWA frontend |
| `workflow/` | n8n workflow JSON export + setup docs |
| `credentials/` | Credential templates + setup guide |
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

1. Import `workflow/receipt-scanner.json` into your n8n instance
2. Set up credentials per `credentials/README.md`
3. Configure Google Sheet ID and Drive folder ID in the workflow nodes
4. Activate the workflow and copy the webhook URL

### 3. Deploy to GitHub Pages

1. Add these GitHub Secrets in your repo settings:
   - `VITE_APP_PIN` — Your unlock PIN
   - `VITE_N8N_WEBHOOK_URL` — Your n8n webhook URL
   - `VITE_N8N_API_KEY` — Your API key
2. Push to `main` branch — the GitHub Action will build and deploy

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_APP_PIN` | `.env` / GitHub Secrets | PIN to unlock the PWA |
| `VITE_N8N_WEBHOOK_URL` | `.env` / GitHub Secrets | n8n webhook endpoint |
| `VITE_N8N_API_KEY` | `.env` / GitHub Secrets | API key for webhook auth |
| `RECEIPT_API_KEY` | n8n env vars | Same API key, validated server-side |

## Tech Stack

- **Frontend**: Vite, React 19, TypeScript, shadcn/ui, Tailwind CSS v4
- **PWA**: vite-plugin-pwa with Workbox
- **Backend**: n8n (self-hosted)
- **AI**: OpenAI GPT-4o Vision
- **Storage**: Google Sheets + Google Drive
- **Deploy**: GitHub Pages via GitHub Actions

## License

Private — EKLab
