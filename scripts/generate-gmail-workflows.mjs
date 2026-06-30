#!/usr/bin/env node
/**
 * Generates Gmail Bill Scanner n8n workflow JSON exports.
 * Run: node scripts/generate-gmail-workflows.mjs
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const CREDS = {
  httpHeaderAuth: { id: 'o90kkLJZ1Wsqy6bT', name: 'Header Auth account' },
  openAiApi: { id: 'B3kN1v1cXyyY0yhI', name: 'OpenAi account' },
  googleSheetsOAuth2Api: { id: 'qjcRKIDLVJUxwBME', name: 'Google Sheets account' },
  googleDriveOAuth2Api: { id: 'A8Dr9s98enWRLW98', name: 'Google Drive account' },
  googleApi: { id: 'gSaGmailCred01', name: 'Google Service Account - Gmail' },
};

const SHEET_ID = '16JLh3r3xC33bo3r6ksVBCEV9HR8iXdxWrm9vrL58yz0';
const DRIVE_FOLDER = '1_xZgUpeBfa4BOPBS-6289_nmcnpYOR9d';

const OPENAI_VISION_PROMPT = `You are a receipt and purchase-email analysis assistant. Analyze the bill/receipt image and extract:

1. vendor_name: The store/business name
2. date: Transaction date in ISO 8601 format (YYYY-MM-DD)
3. total: Total amount (number only, no currency symbol). For refunds, use the refunded amount as a positive number.
4. tax: Tax amount (number, 0 if not visible)
5. currency: Currency code (e.g., CAD, USD)
6. category: Best-fit from: ["Office Supplies", "Travel", "Meals & Entertainment", "Software & Subscriptions", "Hardware & Equipment", "Professional Services", "Utilities", "Transportation", "Other"]
7. items: Array of {description, amount, quantity}
8. confidence: 0.0 to 1.0
9. transaction_type: "purchase" | "refund" | "skip"

Rules:
- "purchase" for order confirmations, invoices, receipts, charges
- "refund" for refund/credit/return/charge-reversal confirmations
- "skip" for non-financial emails (shipping-only updates, marketing, newsletters)
- For refunds, category is usually "Other" unless clearly another expense category

Return ONLY valid JSON with these exact field names.`;

const OPENAI_TEXT_PROMPT = `You are a purchase/refund email analysis assistant. Analyze the email text and extract the same JSON fields as a receipt analyzer:

1. vendor_name 2. date (YYYY-MM-DD) 3. total (positive number) 4. tax 5. currency 6. category 7. items[] 8. confidence 9. transaction_type ("purchase"|"refund"|"skip")

Classify refunds vs purchases vs skip per the same rules. Return ONLY valid JSON.`;

const CODE_EXPAND_IDS = `// Expand Gmail list response into one item per message ID
const list = $('HTTP - Gmail List').first().json;
const messages = list.messages || [];
if (messages.length === 0) {
  return [{ json: { emptyList: true, totalListed: 0 } }];
}
return messages.map((m) => ({ json: { messageId: m.id } }));`;

const CODE_FILTER_NEW = `// Drop messages already recorded by Gmail internalDate (Email Timestamp column)
const sheetRows = $('Google Sheets - Read Timestamps').all();
const known = new Set(
  sheetRows
    .map((r) => String(r.json['Email Timestamp'] ?? r.json.emailTimestamp ?? '').trim())
    .filter(Boolean)
);

const items = $input.all();
const newMessages = [];
let skippedExisting = 0;

for (const item of items) {
  const msg = item.json;
  const internalDate = String(msg.internalDate ?? '');
  const messageId = msg.id ?? msg.messageId;
  if (!internalDate || !messageId) continue;
  if (known.has(internalDate)) {
    skippedExisting++;
    continue;
  }
  newMessages.push({ json: { messageId, internalDate, skippedExisting } });
}

if (newMessages.length === 0) {
  return [{ json: { noNew: true, skippedExisting, toProcess: 0 } }];
}

// Carry skippedExisting on first item for response builder
newMessages[0].json.skippedExisting = skippedExisting;
return newMessages;`;

const CODE_RESOLVE_BINARY = `// Parse Gmail MIME: prefer PDF/image attachment; else extract body text for OpenAI text path
const message = $input.first().json;
const batch = $('Split In Batches').item.json;

function decodeBase64Url(data) {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64');
}

function walkParts(parts, acc = []) {
  if (!parts) return acc;
  for (const part of parts) {
    if (part.parts) walkParts(part.parts, acc);
    else acc.push(part);
  }
  return acc;
}

const payload = message.payload || {};
const parts = walkParts(payload.parts || [payload]);
const headers = payload.headers || message.payload?.headers || [];
const subject = (headers.find((h) => h.name?.toLowerCase() === 'subject') || {}).value || 'Email Bill';

let billBinary = null;
let textBody = '';

for (const part of parts) {
  if (part.mimeType === 'application/pdf' && part.body?.data) {
    billBinary = {
      data: decodeBase64Url(part.body.data).toString('base64'),
      mimeType: 'application/pdf',
      fileExtension: 'pdf',
      fileName: part.filename || 'bill.pdf',
    };
    break;
  }
}

if (!billBinary) {
  for (const part of parts) {
    const mime = part.mimeType || '';
    if (mime.startsWith('image/') && part.body?.data) {
      const ext = mime.split('/')[1] || 'jpg';
      billBinary = {
        data: decodeBase64Url(part.body.data).toString('base64'),
        mimeType: mime,
        fileExtension: ext,
        fileName: part.filename || \`bill.\${ext}\`,
      };
      break;
    }
  }
}

function partText(part) {
  if (!part.body?.data) return '';
  const raw = decodeBase64Url(part.body.data).toString('utf-8');
  if ((part.mimeType || '') === 'text/html') {
    return raw.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();
  }
  return raw;
}

if (!billBinary) {
  for (const part of parts) {
    const mime = part.mimeType || '';
    if (mime === 'text/plain' || mime === 'text/html') {
      textBody += partText(part) + '\\n';
    }
  }
  if (!textBody && payload.body?.data) {
    textBody = decodeBase64Url(payload.body.data).toString('utf-8');
  }
}

const item = {
  json: {
    messageId: batch.messageId || message.id,
    internalDate: String(batch.internalDate || message.internalDate),
    gmailMessageId: message.id,
    subject,
    textOnly: !billBinary,
    emailBody: textBody.slice(0, 12000),
  },
};

if (billBinary) {
  item.binary = { bill: billBinary };
}

return [item];`;

const CODE_FORMAT_DATA = `// Parse OpenAI response and format for Sheets + Drive (Gmail bills + refunds)
const openAiResponse = $input.first().json;
const source = $('Code - Resolve Bill Binary').first().json;

let parsed;
try {
  const content = openAiResponse.content || openAiResponse.text || JSON.stringify(openAiResponse);
  const jsonMatch = content.match(/\\\`\\\`\\\`json?\\n?([\\s\\S]*?)\\n?\\\`\\\`\\\`/) || [null, content];
  parsed = JSON.parse(jsonMatch[1].trim());
} catch (e) {
  throw new Error(\`Failed to parse OpenAI response: \${e.message}\`);
}

const txRaw = String(parsed.transaction_type || 'purchase').toLowerCase();
if (txRaw === 'skip') {
  return [{ json: { skip: true, messageId: source.messageId, internalDate: source.internalDate } }];
}

const isRefund = txRaw === 'refund';
const transactionType = isRefund ? 'Refund' : 'Purchase';
const totalRaw = Number(parsed.total) || 0;
const total = isRefund ? -Math.abs(totalRaw) : Math.abs(totalRaw);

const itemsSummary = (parsed.items || [])
  .map((item) => {
    const qty = item.quantity && item.quantity > 1 ? \`\${item.quantity}× \` : '';
    return \`\${qty}\${item.description}: $\${item.amount}\`;
  })
  .join('; ');

const vendor = (parsed.vendor_name || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
const date = parsed.date || new Date().toISOString().split('T')[0];
const prefix = isRefund ? 'refund' : 'bill';
const filename = \`\${prefix}_\${vendor}_\${date}_\${source.internalDate}.pdf\`;

const itemsForSheet = isRefund ? \`REFUND: \${itemsSummary}\` : itemsSummary;

const binaryItem = $('Code - Resolve Bill Binary').first();
const out = {
  json: {
    skip: false,
    sheetData: {
      date: parsed.date,
      vendor: parsed.vendor_name,
      category: parsed.category || 'Other',
      total,
      tax: parsed.tax || 0,
      currency: parsed.currency,
      items: itemsForSheet,
      confidence: parsed.confidence,
      submittedAt: new Date().toISOString(),
      emailTimestamp: source.internalDate,
      transactionType,
      source: 'gmail',
      gmailMessageId: source.gmailMessageId || source.messageId,
    },
    driveFilename: filename,
    resultType: isRefund ? 'refund' : 'purchase',
    messageId: source.messageId,
    internalDate: source.internalDate,
  },
};

if (binaryItem.binary?.bill) {
  out.binary = { bill: binaryItem.binary.bill };
} else if (source.emailBody) {
  out.binary = {
    bill: {
      data: Buffer.from(source.emailBody, 'utf-8').toString('base64'),
      mimeType: 'text/plain',
      fileExtension: 'txt',
      fileName: filename.replace(/\\.pdf$/, '.txt'),
    },
  };
}

return [out];`;

const CODE_TRACK_LOOP = `// Tag each loop iteration for final aggregation
const fmt = $input.first().json;
if (fmt.skip) {
  return [{ json: { result: 'skipped', reason: 'openai_skip', messageId: fmt.messageId } }];
}
const tx = fmt.resultType || 'purchase';
return [{ json: { result: tx, messageId: fmt.messageId, internalDate: fmt.internalDate } }];`;

const CODE_BUILD_RESPONSE_LIMIT = `// Aggregate loop results into webhook response (limit mode)
const filterNode = $('Code - Filter New Messages').first().json;
const skippedExisting = filterNode.skippedExisting || 0;

if (filterNode.noNew) {
  return [{
    json: {
      success: true,
      mode: 'limit',
      processed: 0,
      purchases: 0,
      refunds: 0,
      skipped: skippedExisting,
      errors: [],
    },
  }];
}

const loopItems = $('Code - Track Loop Result').all().map((i) => i.json);
let purchases = 0;
let refunds = 0;
let skipped = skippedExisting;
const errors = [];

for (const item of loopItems) {
  if (item.result === 'purchase') purchases++;
  else if (item.result === 'refund') refunds++;
  else if (item.result === 'skipped') skipped++;
  else if (item.result === 'error') errors.push(item.error || 'Unknown error');
}

return [{
  json: {
    success: true,
    mode: 'limit',
    processed: purchases + refunds,
    purchases,
    refunds,
    skipped,
    errors,
  },
}];`;

const CODE_BUILD_RESPONSE_EMPTY = `// Empty / no-new response for limit mode
const expand = $('Code - Expand Message IDs').first()?.json;
const filter = $('Code - Filter New Messages').first()?.json;
let skipped = 0;
if (filter?.noNew) {
  skipped = filter.skippedExisting || 0;
}
return [{
  json: {
    success: true,
    mode: 'limit',
    processed: 0,
    purchases: 0,
    refunds: 0,
    skipped,
    errors: [],
    totalListed: expand?.totalListed ?? undefined,
  },
}];`;

const CODE_PAGINATE = `// Paginate all Gmail Purchases-category messages via service account
const delegatedUser = $env.GMAIL_DELEGATED_USER;
if (!delegatedUser) {
  throw new Error('GMAIL_DELEGATED_USER environment variable is not set');
}

const allMessages = [];
let pageToken;

do {
  const qs = { q: 'category:purchases', maxResults: 500 };
  if (pageToken) qs.pageToken = pageToken;
  const response = await this.helpers.httpRequestWithAuthentication.call(this, 'googleApi', {
    method: 'GET',
    url: \`https://gmail.googleapis.com/gmail/v1/users/\${delegatedUser}/messages\`,
    qs,
    json: true,
  });
  if (response.messages?.length) allMessages.push(...response.messages);
  pageToken = response.nextPageToken;
} while (pageToken);

return [{ json: { messages: allMessages, totalListed: allMessages.length } }];`;

const CODE_EXPAND_PAGINATED = `const data = $input.first().json;
const messages = data.messages || [];
if (messages.length === 0) {
  return [{ json: { emptyList: true, totalListed: 0 } }];
}
return messages.map((m) => ({ json: { messageId: m.id } }));`;

const CODE_BUILD_EARLY_RESPONSE = `const filter = $('Code - Filter New Messages').first().json;
const skipped = filter.skippedExisting || 0;
const allFiltered = $('Code - Filter New Messages').all();
const toProcess = filter.noNew ? 0 : allFiltered.length;

return [{
  json: {
    success: true,
    mode: 'all',
    accepted: true,
    toProcess,
    skipped,
    message: 'Scan started; processing in background',
  },
}];`;

const CODE_BUILD_EMPTY_ALL = `const filter = $('Code - Filter New Messages').first()?.json;
return [{
  json: {
    success: true,
    mode: 'all',
    accepted: true,
    toProcess: 0,
    skipped: filter?.skippedExisting || 0,
    message: 'No new purchase emails to process',
  },
}];`;

function sheetDoc() {
  return {
    __rl: true,
    value: SHEET_ID,
    mode: 'list',
    cachedResultName: 'Receipt',
    cachedResultUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=drivesdk`,
  };
}

function sheetName() {
  return {
    __rl: true,
    value: 'gid=0',
    mode: 'list',
    cachedResultName: 'Sheet1',
    cachedResultUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=0`,
  };
}

function driveFolder() {
  return {
    __rl: true,
    value: DRIVE_FOLDER,
    mode: 'list',
    cachedResultName: '2026',
    cachedResultUrl: `https://drive.google.com/drive/folders/${DRIVE_FOLDER}`,
  };
}

function httpGmailList(id, name, x, y) {
  return {
    parameters: {
      method: 'GET',
      url: "={{ 'https://gmail.googleapis.com/gmail/v1/users/' + $env.GMAIL_DELEGATED_USER + '/messages' }}",
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      sendQuery: true,
      queryParameters: {
        parameters: [
          { name: 'q', value: 'category:purchases' },
          { name: 'maxResults', value: '50' },
        ],
      },
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [x, y],
    credentials: { googleApi: CREDS.googleApi },
  };
}

function httpGmailMetadata(id, name, x, y) {
  return {
    parameters: {
      method: 'GET',
      url: "={{ 'https://gmail.googleapis.com/gmail/v1/users/' + $env.GMAIL_DELEGATED_USER + '/messages/' + $json.messageId }}",
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      sendQuery: true,
      queryParameters: {
        parameters: [{ name: 'format', value: 'metadata' }],
      },
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [x, y],
    credentials: { googleApi: CREDS.googleApi },
  };
}

function httpGmailFull(id, name, x, y) {
  return {
    parameters: {
      method: 'GET',
      url: "={{ 'https://gmail.googleapis.com/gmail/v1/users/' + $env.GMAIL_DELEGATED_USER + '/messages/' + $('Split In Batches').item.json.messageId }}",
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleApi',
      sendQuery: true,
      queryParameters: {
        parameters: [{ name: 'format', value: 'full' }],
      },
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [x, y],
    credentials: { googleApi: CREDS.googleApi },
  };
}

function sheetsRead(id, name, x, y) {
  return {
    parameters: {
      operation: 'read',
      documentId: sheetDoc(),
      sheetName: sheetName(),
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.googleSheets',
    typeVersion: 4.5,
    position: [x, y],
    credentials: { googleSheetsOAuth2Api: CREDS.googleSheetsOAuth2Api },
  };
}

function sheetsAppend(id, name, x, y) {
  return {
    parameters: {
      operation: 'appendOrUpdate',
      documentId: sheetDoc(),
      sheetName: sheetName(),
      columns: {
        mappingMode: 'defineBelow',
        value: {
          Date: "={{ $('Code - Format Data').item.json.sheetData.date }}",
          Vendor: "={{ $('Code - Format Data').item.json.sheetData.vendor }}",
          Category: "={{ $('Code - Format Data').item.json.sheetData.category }}",
          Total: "={{ $('Code - Format Data').item.json.sheetData.total }}",
          Tax: "={{ $('Code - Format Data').item.json.sheetData.tax }}",
          Currency: "={{ $('Code - Format Data').item.json.sheetData.currency }}",
          Items: "={{ $('Code - Format Data').item.json.sheetData.items }}",
          Confidence: "={{ $('Code - Format Data').item.json.sheetData.confidence }}",
          'Submitted At': "={{ $('Code - Format Data').item.json.sheetData.submittedAt }}",
          'Email Timestamp': "={{ $('Code - Format Data').item.json.sheetData.emailTimestamp }}",
          'Transaction Type': "={{ $('Code - Format Data').item.json.sheetData.transactionType }}",
          link: "={{ $('Google Drive - Upload Bill').item.json.webViewLink }}",
        },
        matchingColumns: ['Email Timestamp'],
        schema: [
          { id: 'Date', displayName: 'Date', type: 'string', canBeUsedToMatch: true },
          { id: 'Vendor', displayName: 'Vendor', type: 'string', canBeUsedToMatch: true },
          { id: 'Category', displayName: 'Category', type: 'string', canBeUsedToMatch: true },
          { id: 'Total', displayName: 'Total', type: 'string', canBeUsedToMatch: true },
          { id: 'Tax', displayName: 'Tax', type: 'string', canBeUsedToMatch: true },
          { id: 'Currency', displayName: 'Currency', type: 'string', canBeUsedToMatch: true },
          { id: 'Items', displayName: 'Items', type: 'string', canBeUsedToMatch: true },
          { id: 'Confidence', displayName: 'Confidence', type: 'string', canBeUsedToMatch: true },
          { id: 'Submitted At', displayName: 'Submitted At', type: 'string', canBeUsedToMatch: true },
          { id: 'Email Timestamp', displayName: 'Email Timestamp', type: 'string', canBeUsedToMatch: true },
          { id: 'Transaction Type', displayName: 'Transaction Type', type: 'string', canBeUsedToMatch: true },
          { id: 'link', displayName: 'link', type: 'string', canBeUsedToMatch: true },
        ],
      },
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.googleSheets',
    typeVersion: 4.5,
    position: [x, y],
    credentials: { googleSheetsOAuth2Api: CREDS.googleSheetsOAuth2Api },
  };
}

function driveUpload(id, name, x, y) {
  return {
    parameters: {
      inputDataFieldName: 'bill',
      name: "={{ $('Code - Format Data').item.json.driveFilename }}",
      driveId: { __rl: true, mode: 'list', value: 'My Drive' },
      folderId: driveFolder(),
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.googleDrive',
    typeVersion: 3,
    position: [x, y],
    continueOnFail: true,
    credentials: { googleDriveOAuth2Api: CREDS.googleDriveOAuth2Api },
  };
}

function openAiVision(id, name, x, y) {
  return {
    parameters: {
      resource: 'image',
      operation: 'analyze',
      modelId: { __rl: true, value: 'gpt-4o-mini', mode: 'list', cachedResultName: 'GPT-4O-MINI' },
      text: OPENAI_VISION_PROMPT,
      inputType: 'base64',
      binaryPropertyName: 'bill',
      options: {},
    },
    id,
    name,
    type: '@n8n/n8n-nodes-langchain.openAi',
    typeVersion: 1.8,
    position: [x, y],
    continueOnFail: true,
    credentials: { openAiApi: CREDS.openAiApi },
  };
}

function openAiText(id, name, x, y) {
  return {
    parameters: {
      resource: 'text',
      operation: 'message',
      modelId: { __rl: true, value: 'gpt-4o-mini', mode: 'list', cachedResultName: 'GPT-4O-MINI' },
      messages: {
        values: [
          {
            content: `=${OPENAI_TEXT_PROMPT}\n\nSubject: {{ $('Code - Resolve Bill Binary').item.json.subject }}\n\nBody:\n{{ $('Code - Resolve Bill Binary').item.json.emailBody }}`,
          },
        ],
      },
      options: {},
    },
    id,
    name,
    type: '@n8n/n8n-nodes-langchain.openAi',
    typeVersion: 1.8,
    position: [x, y],
    continueOnFail: true,
    credentials: { openAiApi: CREDS.openAiApi },
  };
}

function code(id, name, x, y, jsCode) {
  return {
    parameters: { jsCode },
    id,
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [x, y],
  };
}

function ifNotEquals(id, name, x, y, left, right = 'true') {
  return {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [
          {
            id: id + '-cond',
            leftValue: left,
            rightValue: right,
            operator: { type: 'string', operation: 'notEquals' },
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.if',
    typeVersion: 2.2,
    position: [x, y],
  };
}

function ifEquals(id, name, x, y, left, right = 'true') {
  return {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [
          {
            id: id + '-cond',
            leftValue: left,
            rightValue: right,
            operator: { type: 'string', operation: 'equals' },
          },
        ],
        combinator: 'and',
      },
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.if',
    typeVersion: 2.2,
    position: [x, y],
  };
}

function webhook(id, name, path, x, y, webhookId) {
  return {
    parameters: {
      httpMethod: 'POST',
      path,
      authentication: 'headerAuth',
      responseMode: 'responseNode',
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: [x, y],
    webhookId,
    credentials: { httpHeaderAuth: CREDS.httpHeaderAuth },
  };
}

function respond(id, name, x, y) {
  return {
    parameters: {
      respondWith: 'json',
      responseBody: '={{ JSON.stringify($json) }}',
      options: { responseCode: 200 },
    },
    id,
    name,
    type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1.1,
    position: [x, y],
  };
}

function splitBatches(id, name, x, y) {
  return {
    parameters: { batchSize: 1, options: {} },
    id,
    name,
    type: 'n8n-nodes-base.splitInBatches',
    typeVersion: 3,
    position: [x, y],
  };
}

function sharedProcessingNodes(mode) {
  const yBase = mode === 'limit' ? 400 : 600;
  return [
    splitBatches('split-batches', 'Split In Batches', 1200, yBase),
    httpGmailFull('gmail-full', 'HTTP - Gmail Get Full Message', 1420, yBase),
    code('resolve-binary', 'Code - Resolve Bill Binary', 1640, yBase, CODE_RESOLVE_BINARY),
    ifNotEquals('if-binary', 'IF - Has Binary', 1860, yBase, "={{ String($json.textOnly) }}", 'true'),
    openAiVision('openai-vision', 'OpenAI - Analyze Bill', 2080, yBase - 80),
    openAiText('openai-text', 'OpenAI - Analyze Bill Text', 2080, yBase + 80),
    code('format-data', 'Code - Format Data', 2300, yBase, CODE_FORMAT_DATA),
    ifEquals('if-skip', 'IF - Is Skip', 2520, yBase, "={{ String($json.skip) }}", 'true'),
    driveUpload('drive-upload', 'Google Drive - Upload Bill', 2740, yBase - 40),
    sheetsAppend('sheets-append', 'Google Sheets - Append Row', 2740, yBase + 80),
    code('track-loop', 'Code - Track Loop Result', 2960, yBase, CODE_TRACK_LOOP),
  ];
}

function buildLimitWorkflow() {
  const nodes = [
    webhook('wh-limit', 'Webhook - Gmail Bills Limit', 'gmail-bills/limit', -200, 200, 'gmail-bills-limit'),
    httpGmailList('gmail-list', 'HTTP - Gmail List', 20, 120),
    sheetsRead('sheets-read', 'Google Sheets - Read Timestamps', 20, 280),
    code('expand-ids', 'Code - Expand Message IDs', 240, 120, CODE_EXPAND_IDS),
    ifNotEquals('if-empty-list', 'IF - Has Messages', 460, 120, "={{ String($json.emptyList) }}", 'true'),
    httpGmailMetadata('gmail-meta', 'HTTP - Gmail Get Metadata', 680, 120),
    code('filter-new', 'Code - Filter New Messages', 900, 200, CODE_FILTER_NEW),
    ifNotEquals('if-new', 'IF - Has New Messages', 1120, 200, "={{ String($json.noNew) }}", 'true'),
    code('empty-response', 'Code - Build Empty Response', 1340, 80, CODE_BUILD_RESPONSE_EMPTY),
    ...sharedProcessingNodes('limit'),
    code('build-response', 'Code - Build Response', 3180, 200, CODE_BUILD_RESPONSE_LIMIT),
    respond('respond', 'Respond 200', 3400, 200),
    respond('respond-empty', 'Respond 200 Empty', 1560, 80),
  ];

  const connections = {
    'Webhook - Gmail Bills Limit': { main: [[{ node: 'Google Sheets - Read Timestamps', type: 'main', index: 0 }]] },
    'Google Sheets - Read Timestamps': { main: [[{ node: 'HTTP - Gmail List', type: 'main', index: 0 }]] },
    'HTTP - Gmail List': { main: [[{ node: 'Code - Expand Message IDs', type: 'main', index: 0 }]] },
    'Code - Expand Message IDs': { main: [[{ node: 'IF - Has Messages', type: 'main', index: 0 }]] },
    'IF - Has Messages': {
      main: [
        [{ node: 'HTTP - Gmail Get Metadata', type: 'main', index: 0 }],
        [{ node: 'Code - Build Empty Response', type: 'main', index: 0 }],
      ],
    },
    'HTTP - Gmail Get Metadata': { main: [[{ node: 'Code - Filter New Messages', type: 'main', index: 0 }]] },
    'Code - Filter New Messages': { main: [[{ node: 'IF - Has New Messages', type: 'main', index: 0 }]] },
    'IF - Has New Messages': {
      main: [
        [{ node: 'Split In Batches', type: 'main', index: 0 }],
        [{ node: 'Code - Build Empty Response', type: 'main', index: 0 }],
      ],
    },
    'Code - Build Empty Response': { main: [[{ node: 'Respond 200 Empty', type: 'main', index: 0 }]] },
    'Split In Batches': {
      main: [
        [{ node: 'Code - Build Response', type: 'main', index: 0 }],
        [{ node: 'HTTP - Gmail Get Full Message', type: 'main', index: 0 }],
      ],
    },
    'HTTP - Gmail Get Full Message': { main: [[{ node: 'Code - Resolve Bill Binary', type: 'main', index: 0 }]] },
    'Code - Resolve Bill Binary': { main: [[{ node: 'IF - Has Binary', type: 'main', index: 0 }]] },
    'IF - Has Binary': {
      main: [
        [{ node: 'OpenAI - Analyze Bill', type: 'main', index: 0 }],
        [{ node: 'OpenAI - Analyze Bill Text', type: 'main', index: 0 }],
      ],
    },
    'OpenAI - Analyze Bill': { main: [[{ node: 'Code - Format Data', type: 'main', index: 0 }]] },
    'OpenAI - Analyze Bill Text': { main: [[{ node: 'Code - Format Data', type: 'main', index: 0 }]] },
    'Code - Format Data': { main: [[{ node: 'IF - Is Skip', type: 'main', index: 0 }]] },
    'IF - Is Skip': {
      main: [
        [{ node: 'Code - Track Loop Result', type: 'main', index: 0 }],
        [{ node: 'Google Drive - Upload Bill', type: 'main', index: 0 }],
      ],
    },
    'Google Drive - Upload Bill': { main: [[{ node: 'Google Sheets - Append Row', type: 'main', index: 0 }]] },
    'Google Sheets - Append Row': { main: [[{ node: 'Code - Track Loop Result', type: 'main', index: 0 }]] },
    'Code - Track Loop Result': { main: [[{ node: 'Split In Batches', type: 'main', index: 0 }]] },
    'Code - Build Response': { main: [[{ node: 'Respond 200', type: 'main', index: 0 }]] },
  };

  return {
    name: 'Gmail Bill Scanner - Limit',
    nodes,
    connections,
    active: false,
    settings: { executionOrder: 'v1' },
    meta: { templateCredsSetupCompleted: false },
    tags: [{ name: 'gmail-bill-scanner' }],
  };
}

function buildAllWorkflow() {
  const nodes = [
    webhook('wh-all', 'Webhook - Gmail Bills All', 'gmail-bills/all', -200, 300, 'gmail-bills-all'),
    code('paginate', 'Code - Paginate Gmail List', 20, 200, CODE_PAGINATE),
    sheetsRead('sheets-read', 'Google Sheets - Read Timestamps', 20, 400),
    code('expand-ids', 'Code - Expand Message IDs', 240, 200, CODE_EXPAND_PAGINATED),
    ifNotEquals('if-empty-list', 'IF - Has Messages', 460, 200, "={{ String($json.emptyList) }}", 'true'),
    httpGmailMetadata('gmail-meta', 'HTTP - Gmail Get Metadata', 680, 200),
    code('filter-new', 'Code - Filter New Messages', 900, 300, CODE_FILTER_NEW),
    ifNotEquals('if-new', 'IF - Has New Messages', 1120, 300, "={{ String($json.noNew) }}", 'true'),
    code('early-response', 'Code - Build Early Response', 1340, 200, CODE_BUILD_EARLY_RESPONSE),
    respond('respond-early', 'Respond 200 Early', 1560, 200),
    code('empty-response', 'Code - Build Empty Response', 1340, 420, CODE_BUILD_EMPTY_ALL),
    ...sharedProcessingNodes('all'),
    respond('respond-empty', 'Respond 200 Empty', 1560, 420),
  ];

  const connections = {
    'Webhook - Gmail Bills All': { main: [[{ node: 'Google Sheets - Read Timestamps', type: 'main', index: 0 }]] },
    'Google Sheets - Read Timestamps': { main: [[{ node: 'Code - Paginate Gmail List', type: 'main', index: 0 }]] },
    'Code - Paginate Gmail List': { main: [[{ node: 'Code - Expand Message IDs', type: 'main', index: 0 }]] },
    'Code - Expand Message IDs': { main: [[{ node: 'IF - Has Messages', type: 'main', index: 0 }]] },
    'IF - Has Messages': {
      main: [
        [{ node: 'HTTP - Gmail Get Metadata', type: 'main', index: 0 }],
        [{ node: 'Code - Build Empty Response', type: 'main', index: 0 }],
      ],
    },
    'HTTP - Gmail Get Metadata': { main: [[{ node: 'Code - Filter New Messages', type: 'main', index: 0 }]] },
    'Code - Filter New Messages': { main: [[{ node: 'IF - Has New Messages', type: 'main', index: 0 }]] },
    'IF - Has New Messages': {
      main: [
        [{ node: 'Code - Build Early Response', type: 'main', index: 0 }, { node: 'Split In Batches', type: 'main', index: 0 }],
        [{ node: 'Code - Build Empty Response', type: 'main', index: 0 }],
      ],
    },
    'Code - Build Early Response': { main: [[{ node: 'Respond 200 Early', type: 'main', index: 0 }]] },
    'Code - Build Empty Response': { main: [[{ node: 'Respond 200 Empty', type: 'main', index: 0 }]] },
    'Split In Batches': {
      main: [
        [],
        [{ node: 'HTTP - Gmail Get Full Message', type: 'main', index: 0 }],
      ],
    },
    'HTTP - Gmail Get Full Message': { main: [[{ node: 'Code - Resolve Bill Binary', type: 'main', index: 0 }]] },
    'Code - Resolve Bill Binary': { main: [[{ node: 'IF - Has Binary', type: 'main', index: 0 }]] },
    'IF - Has Binary': {
      main: [
        [{ node: 'OpenAI - Analyze Bill', type: 'main', index: 0 }],
        [{ node: 'OpenAI - Analyze Bill Text', type: 'main', index: 0 }],
      ],
    },
    'OpenAI - Analyze Bill': { main: [[{ node: 'Code - Format Data', type: 'main', index: 0 }]] },
    'OpenAI - Analyze Bill Text': { main: [[{ node: 'Code - Format Data', type: 'main', index: 0 }]] },
    'Code - Format Data': { main: [[{ node: 'IF - Is Skip', type: 'main', index: 0 }]] },
    'IF - Is Skip': {
      main: [
        [{ node: 'Code - Track Loop Result', type: 'main', index: 0 }],
        [{ node: 'Google Drive - Upload Bill', type: 'main', index: 0 }],
      ],
    },
    'Google Drive - Upload Bill': { main: [[{ node: 'Google Sheets - Append Row', type: 'main', index: 0 }]] },
    'Google Sheets - Append Row': { main: [[{ node: 'Code - Track Loop Result', type: 'main', index: 0 }]] },
    'Code - Track Loop Result': { main: [[{ node: 'Split In Batches', type: 'main', index: 0 }]] },
  };

  return {
    name: 'Gmail Bill Scanner - All',
    nodes,
    connections,
    active: false,
    settings: { executionOrder: 'v1' },
    meta: { templateCredsSetupCompleted: false },
    tags: [{ name: 'gmail-bill-scanner' }],
  };
}

const limitPath = join(root, 'workflow', 'Gmail Bill Scanner - Limit.json');
const allPath = join(root, 'workflow', 'Gmail Bill Scanner - All.json');

writeFileSync(limitPath, JSON.stringify(buildLimitWorkflow(), null, 2) + '\n');
writeFileSync(allPath, JSON.stringify(buildAllWorkflow(), null, 2) + '\n');

console.log('Wrote:', limitPath);
console.log('Wrote:', allPath);
