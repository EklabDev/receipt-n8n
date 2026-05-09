# Receipt Scanner — Credentials Setup

## Required Credentials

The n8n workflow requires the following credentials. **Never commit actual credentials to git.**

### 1. OpenAI API Key

- **n8n Credential Type**: `OpenAI API`
- **Required**: API key with access to `gpt-4o` (vision model)
- **Create at**: https://platform.openai.com/api-keys

### 2. Google OAuth2

- **n8n Credential Type**: `Google OAuth2 API`
- **Required Scopes**:
  - `https://www.googleapis.com/auth/spreadsheets` (Google Sheets read/write)
  - `https://www.googleapis.com/auth/drive.file` (Google Drive file upload)
- **Setup**: Follow [n8n Google OAuth2 guide](https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/)

### 3. Environment Variables

Set in your n8n instance (Settings → Environment Variables):

| Variable | Value |
|----------|-------|
| `RECEIPT_API_KEY` | A strong, random API key (e.g., generate with `openssl rand -hex 32`) |

## Credential Template

See `credentials.example.json` for the structure reference. This file contains **no secrets** — it only shows the expected credential shape.

## Security Notes

- ⚠️ Never store API keys or OAuth tokens in workflow JSON files
- ⚠️ Never commit `.env` files containing real credentials
- ✅ Use n8n's built-in credential storage (encrypted at rest)
- ✅ Use environment variables for API keys validated in workflow logic
