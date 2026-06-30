# Receipt Scanner — Credentials Setup

## Required Credentials

The n8n workflows require the following credentials. **Never commit actual credentials to git.**

### 1. OpenAI API Key

- **n8n Credential Type**: `OpenAI API`
- **Required**: API key with access to `gpt-4o-mini` (vision + text)
- **Create at**: https://platform.openai.com/api-keys

### 2. Google OAuth2 (Sheets + Drive)

- **n8n Credential Type**: `Google OAuth2 API`
- **Required Scopes**:
  - `https://www.googleapis.com/auth/spreadsheets` (Google Sheets read/write)
  - `https://www.googleapis.com/auth/drive.file` (Google Drive file upload)
- **Setup**: Follow [n8n Google OAuth2 guide](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/)
- **Used by**: Receipt Scanner, Gmail Bill Scanner (Sheets append + Drive upload)

### 3. Google Service Account (Gmail — domain-wide delegation)

Gmail Bill Scanner workflows read a delegated mailbox via a **Google Service Account** with **domain-wide delegation**.

#### Prerequisites (Google Workspace Admin)

1. Create or use a service account in [Google Cloud Console](https://console.cloud.google.com/) for your project.
2. Enable the **Gmail API** for the project.
3. Download the service account JSON key — store it locally only (e.g. `credentials/your-sa-key.json`). **Do not commit.**
4. In **Admin Console → Security → API Controls → Domain-wide delegation**, authorize the service account **Client ID** with scope:
   - `https://www.googleapis.com/auth/gmail.readonly`
5. The delegated mailbox must be a user in your Workspace domain (e.g. `you@yourdomain.com`).

#### n8n credential

- **n8n Credential Type**: `Google Service Account API` (`googleApi`)
- Upload the JSON key in the n8n credential UI (never embed the private key in workflow JSON)
- Set **Delegated User** to `{{$env.GMAIL_DELEGATED_USER}}` or bind the mailbox email after import
- Assign to all Gmail HTTP Request nodes in both Gmail Bill Scanner workflows

### 4. Header Auth (webhook API key)

- **n8n Credential Type**: `Header Auth`
- Header name: `x-api-key`
- Value: same secret as `RECEIPT_API_KEY` / PWA `VITE_N8N_API_KEY`

### 5. Environment Variables

Set in your n8n instance (Settings → Environment Variables):

| Variable | Value |
|----------|-------|
| `RECEIPT_API_KEY` | A strong, random API key (e.g., generate with `openssl rand -hex 32`) |
| `GMAIL_DELEGATED_USER` | Workspace mailbox to impersonate (e.g. `you@yourdomain.com`) |

## Google Sheet columns

The standard expense sheet (same ID as Receipt Scanner) needs these **row 1 headers**:

| Column | Header | Notes |
|--------|--------|-------|
| A–J | Date, Vendor, Category, Total, Tax, Currency, Items, Image Link, Confidence, Submitted At | Same as Receipt Scanner |
| K | `Email Timestamp` | Gmail `internalDate` (ms string) — **dedup key** |
| L | `Transaction Type` | `Purchase` or `Refund` |
| M | `link` | Drive `webViewLink` (if not already present) |

Optional debugging columns: `Source` (`gmail`), `Gmail Message ID`.

### Refund accounting rules

When OpenAI classifies an email as a refund:

| Field | Rule |
|-------|------|
| `Transaction Type` | `Refund` |
| `Total` | **Negative** number (e.g. `-49.99`) so column sums net correctly |
| `Items` | Prefix with `REFUND: ` |
| Drive filename | `refund_{vendor}_{date}_{internalDate}.pdf` (not `bill_`) |

Purchases use positive `Total`, `Transaction Type: Purchase`, and `bill_` Drive filenames.

## Credential Template

See `credentials.example.json` for the structure reference. This file contains **no secrets** — it only shows the expected credential shape.

## Security Notes

- ⚠️ Never store API keys, OAuth tokens, or service account private keys in workflow JSON files
- ⚠️ Never commit `.env` files or `credentials/*.json` key files containing real credentials
- ✅ Use n8n's built-in credential storage (encrypted at rest)
- ✅ Use environment variables for API keys and delegated mailbox identity
- ✅ Gmail scope is **readonly** — workflows do not modify or delete emails
