# Secrets Management Guide

Complete guide for managing API keys and secrets in your Tokyo 2025 Travel Companion.

## Overview

The application uses **Wrangler Secrets** to securely store sensitive data like API keys. Secrets are encrypted and only available in the Worker runtime.

## Required Secrets

### GOOGLE_PLACES_API_KEY

Required for auto-seeding venue data from Google Places API.

**Get your API key:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Places API** and **Places API (New)**
4. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → API Key**
6. Restrict the key (recommended):
   - Application restrictions: HTTP referrers or IP addresses
   - API restrictions: Places API
7. Copy your API key

## Setting Secrets

### Production (Cloudflare Workers)

```bash
# Set the Google Places API key
npx wrangler secret put GOOGLE_PLACES_API_KEY
# Paste your API key when prompted

# Verify secrets are set
npx wrangler secret list
```

**Expected output:**
```
┌──────────────────────────┬────────────┐
│ Name                     │ Value      │
├──────────────────────────┼────────────┤
│ GOOGLE_PLACES_API_KEY    │ ********** │
└──────────────────────────┴────────────┘
```

### Local Development

#### Option 1: .dev.vars file (Recommended)

Create `.dev.vars` in project root:

```bash
# Copy example file
cp .dev.vars.example .dev.vars

# Edit and add your key
echo "GOOGLE_PLACES_API_KEY=AIzaSyC..." >> .dev.vars
```

Your `.dev.vars` file:
```env
GOOGLE_PLACES_API_KEY=AIzaSyC_your_actual_key_here
```

**Important**: `.dev.vars` is in `.gitignore` - never commit it!

#### Option 2: Environment Variables

```bash
# Set for current session
export GOOGLE_PLACES_API_KEY=AIzaSyC_your_key_here

# Or add to your shell profile (~/.bashrc, ~/.zshrc)
echo 'export GOOGLE_PLACES_API_KEY=AIzaSyC_your_key_here' >> ~/.zshrc
source ~/.zshrc
```

#### Option 3: Pass directly in API request

```bash
curl -X POST http://localhost:8787/api/seed \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "AIzaSyC_your_key_here", "areas": ["ginza"]}'
```

## Using the Seeding System

### 1. Check Status

```bash
# Check if API key is configured
curl http://localhost:8787/api/seed

# Or if deployed
curl https://tokyo2025.your-subdomain.workers.dev/api/seed
```

### 2. Seed Database

#### Via npm scripts (Local)

```bash
# Setup instructions
npm run seed:setup

# Seed Ginza only
npm run seed:ginza

# Seed Osaka only
npm run seed:osaka

# Seed both areas
npm run seed:all
```

#### Via API (Production)

```bash
# Seed both Ginza and Osaka
curl -X POST https://tokyo2025.your-worker.workers.dev/api/seed \
  -H "Content-Type: application/json" \
  -d '{"areas": ["ginza", "osaka"]}'

# Seed only Ginza
curl -X POST https://tokyo2025.your-worker.workers.dev/api/seed \
  -H "Content-Type: application/json" \
  -d '{"areas": ["ginza"]}'

# Seed only Osaka
curl -X POST https://tokyo2025.your-worker.workers.dev/api/seed \
  -H "Content-Type: application/json" \
  -d '{"areas": ["osaka"]}'
```

#### Response Example

```json
{
  "success": true,
  "message": "Seeded 24 venues in 12.45s",
  "results": {
    "ginza": 15,
    "osaka": 9,
    "total": 24
  },
  "stats": {
    "total": 30,
    "byCategory": [
      {"category": "Shopping Mall", "count": 8},
      {"category": "Restaurant", "count": 7},
      {"category": "Department Store", "count": 5}
    ],
    "byDistrict": [
      {"district": "Ginza", "count": 15},
      {"district": "Namba", "count": 6},
      {"district": "Dotonbori", "count": 3}
    ]
  },
  "duration": "12.45s"
}
```

## Complete Setup Workflow

### Step 1: Get Google Places API Key

```bash
# 1. Go to Google Cloud Console
# 2. Enable Places API
# 3. Create API Key
# 4. Copy the key
```

### Step 2: Set Secret (Production)

```bash
# Set the secret in Cloudflare Workers
npx wrangler secret put GOOGLE_PLACES_API_KEY
# Paste your key: AIzaSyC_your_actual_key_here

# Verify
npx wrangler secret list
```

### Step 3: Set Local Development Key

```bash
# Create .dev.vars file
echo "GOOGLE_PLACES_API_KEY=AIzaSyC_your_key_here" > .dev.vars
```

### Step 4: Test Locally

```bash
# Start the worker
npx wrangler dev

# In another terminal, check status
curl http://localhost:8787/api/seed

# Seed Ginza
GOOGLE_PLACES_API_KEY=your_key npm run seed:ginza
```

### Step 5: Seed Production

```bash
# Deploy first
npx wrangler deploy

# Seed via API (secret is already set)
curl -X POST https://tokyo2025.your-worker.workers.dev/api/seed \
  -H "Content-Type: application/json" \
  -d '{"areas": ["ginza", "osaka"]}'
```

## Managing Secrets

### List All Secrets

```bash
npx wrangler secret list
```

### Update a Secret

```bash
# Same command as creating - it overwrites
npx wrangler secret put GOOGLE_PLACES_API_KEY
```

### Delete a Secret

```bash
npx wrangler secret delete GOOGLE_PLACES_API_KEY
```

### Bulk Secret Management

```bash
# Export secrets (values hidden)
npx wrangler secret list --json > secrets.json

# Set multiple secrets
npx wrangler secret bulk secrets.txt
```

Format for `secrets.txt`:
```
SECRET_NAME=secret_value
ANOTHER_SECRET=another_value
```

## Security Best Practices

### ✅ Do

- Use Wrangler secrets for production
- Use `.dev.vars` for local development
- Add `.dev.vars` to `.gitignore` (already done)
- Restrict API keys to specific APIs and domains
- Rotate API keys periodically
- Use different keys for dev/prod

### ❌ Don't

- Commit API keys to Git
- Share API keys in plain text
- Use production keys in development
- Store keys in code or environment variables in CI/CD
- Give API keys more permissions than needed

## Troubleshooting

### Error: "API key required"

```bash
# Check if secret is set
npx wrangler secret list

# If not listed, set it
npx wrangler secret put GOOGLE_PLACES_API_KEY
```

### Error: "Google Places API error: REQUEST_DENIED"

- Your API key may not have Places API enabled
- Check [Google Cloud Console](https://console.cloud.google.com)
- Enable "Places API" under APIs & Services

### Error: "OVER_QUERY_LIMIT"

- You've exceeded the free tier quota
- Check your [Google Cloud billing](https://console.cloud.google.com/billing)
- Consider reducing the number of queries or upgrading

### Local development not finding key

```bash
# Check .dev.vars exists
cat .dev.vars

# Should show:
# GOOGLE_PLACES_API_KEY=AIzaSyC...

# If not, create it
echo "GOOGLE_PLACES_API_KEY=your_key" > .dev.vars
```

## Alternative: Yelp Fusion API

If you prefer Yelp instead of Google Places:

### 1. Get Yelp API Key

1. Go to [Yelp Fusion](https://fusion.yelp.com)
2. Create an app
3. Copy your API Key

### 2. Set Secret

```bash
npx wrangler secret put YELP_API_KEY
```

### 3. Modify init-seed.ts

Update the script to use Yelp API instead of Google Places (implementation left as exercise).

## Cost Estimation

### Google Places API Pricing

**Free Tier**: $200/month credit (≈ 40,000 requests)

**Costs per 1,000 requests**:
- Text Search: $32
- Place Details: $17
- Find Place: $17

**Estimated cost for seeding**:
- ~12 text searches (Ginza + Osaka queries)
- ~60 place details (5 places × 12 queries)
- Total: ~$1.40 per full seed

**Tip**: Run seeding sparingly, cache results!

## Support

For issues:
- Google Places API: [Google Cloud Support](https://cloud.google.com/support)
- Wrangler Secrets: [Cloudflare Docs](https://developers.cloudflare.com/workers/configuration/secrets/)
- This project: [GitHub Issues](https://github.com/jmbish04/tokyo2025/issues)

---

**Last Updated**: 2025-11-19
**Related**: [DEPLOYMENT.md](DEPLOYMENT.md), [SETUP.md](SETUP.md)
