# Tokyo 2025 Deployment Guide

Complete guide to deploying the Tokyo 2025 Travel Companion to production.

## Prerequisites

Before deploying, ensure you have:

- ✅ Cloudflare account with Workers enabled
- ✅ D1 database created: `tokyo2025` (ID: 6aa1da38-15f9-42d1-9195-a6dd0f56a58e)
- ✅ KV namespace created: `MEMORY` (ID: 0ba9fd878f4f4600aeeb9e4905a095e6)
- ✅ Cloudflare Images enabled on your account
- ✅ API keys for OpenAI (optional, for GPT models)
- ✅ API keys for Google Gemini (optional, for Gemini models)
- ✅ Google Places API key (optional, for auto-seeding)

## Step 1: Set Environment Variables

### Production Secrets

Set all required secrets using Wrangler CLI:

```bash
# Required for multi-model AI chat
npx wrangler secret put OPENAI_API_KEY
# Paste your OpenAI key when prompted

npx wrangler secret put GOOGLE_API_KEY
# Paste your Google API key when prompted

# Required for Cloudflare Images
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
# Paste your Cloudflare account ID

npx wrangler secret put CLOUDFLARE_API_TOKEN
# Paste your Cloudflare API token (with Images permissions)

# Optional: For auto-seeding venues
npx wrangler secret put GOOGLE_PLACES_API_KEY
# Paste your Google Places API key
```

### Verify Secrets

List all configured secrets:

```bash
npx wrangler secret list
```

Expected output:
```
OPENAI_API_KEY
GOOGLE_API_KEY
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
GOOGLE_PLACES_API_KEY (optional)
```

## Step 2: Run Database Migrations

Apply all database migrations to your production D1 database:

### Migration 1: Initial Schema

Create venues and logs tables:

```bash
npx wrangler d1 execute tokyo2025 --remote --file=migrations/001_init.sql
```

### Migration 2: Seed Data

Insert initial venue data for Ginza:

```bash
npx wrangler d1 execute tokyo2025 --remote --file=migrations/002_seed.sql
```

### Migration 3: Chat History

Create chats and messages tables:

```bash
npx wrangler d1 execute tokyo2025 --remote --file=migrations/003_chat_history.sql
```

### Verify Migrations

Check that all tables were created:

```bash
npx wrangler d1 execute tokyo2025 --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

Expected tables:
- `venues`
- `logs`
- `chats`
- `messages`

## Step 3: Deploy to Production

### Deploy the Worker

Deploy your application to Cloudflare Workers:

```bash
npm run deploy
```

Or using Wrangler directly:

```bash
npx wrangler deploy
```

### Verify Deployment

After deployment, you'll see output like:

```
Uploaded tokyo2025 (2.34 MB)
Published tokyo2025 (3.21 sec)
  https://tokyo2025.your-subdomain.workers.dev
```

Visit your worker URL to verify it's running.

## Step 4: Configure Custom Domain (Optional)

### Add Custom Domain

```bash
npx wrangler domains add tokyo2025.yourdomain.com
```

### Update Routes

Edit `wrangler.toml` to add your domain:

```toml
routes = [
  { pattern = "tokyo2025.yourdomain.com", custom_domain = true }
]
```

Redeploy:

```bash
npm run deploy
```

## Step 5: Test All Features

### 1. Test Basic Chat

Visit: `https://your-worker.workers.dev/`

- Send a message in the simple chat interface
- Verify you get a response

### 2. Test Advanced Chat

Visit: `https://your-worker.workers.dev/chat`

- Create a new conversation
- Test model switching (Workers AI, OpenAI, Gemini)
- Verify chat history persists
- Test streaming responses

### 3. Test Image Upload

In the `/chat` interface:

- Click "📸 Upload Image"
- Upload a photo
- Verify AI analysis appears
- Check image URL works

### 4. Test Venue Management

Visit: `https://your-worker.workers.dev/seed`

- View recent venues
- Try auto-seed (if Google Places API configured)
- Add a manual venue
- Verify venue appears in database

### 5. Test Database Queries

```bash
# Check venue count
npx wrangler d1 execute tokyo2025 --remote --command="SELECT COUNT(*) as count FROM venues"

# Check chat count
npx wrangler d1 execute tokyo2025 --remote --command="SELECT COUNT(*) as count FROM chats"

# View recent messages
npx wrangler d1 execute tokyo2025 --remote --command="SELECT * FROM messages ORDER BY created_at DESC LIMIT 5"
```

## Step 6: Monitor and Optimize

### View Logs

Stream real-time logs:

```bash
npx wrangler tail
```

### Check Analytics

View analytics in Cloudflare Dashboard:

1. Go to **Workers & Pages** → **tokyo2025**
2. Click **Analytics** tab
3. Monitor:
   - Request volume
   - Error rate
   - CPU time
   - Duration

### Optimize Performance

#### Enable Caching

Add caching headers to static assets in `worker.ts`:

```typescript
// Cache static assets for 1 hour
if (pathname.startsWith('/_next/static/')) {
  response.headers.set('Cache-Control', 'public, max-age=3600, immutable');
}
```

#### Monitor D1 Usage

Check D1 metrics:

```bash
npx wrangler d1 info tokyo2025
```

#### Optimize Images

Use Cloudflare Images transformations:

```typescript
// Request optimized thumbnails
const thumbnailUrl = `${imageUrl}?width=300&height=300&fit=cover&quality=85&format=webp`;

// Request hero images
const heroUrl = `${imageUrl}?width=1200&height=600&fit=cover&quality=90&format=webp`;
```

## Troubleshooting

### Issue: "Database not configured" error

**Cause:** D1 binding not set up correctly

**Solution:**
1. Verify `wrangler.toml` has correct database ID
2. Ensure migrations have been run
3. Check D1 is enabled in your Cloudflare plan

### Issue: "API key not configured" for AI models

**Cause:** Missing or incorrect secrets

**Solution:**
```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put GOOGLE_API_KEY
```

### Issue: Images not uploading

**Cause:** Cloudflare Images credentials missing

**Solution:**
```bash
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN
```

### Issue: Chat history not persisting

**Cause:** Migration 003 not applied

**Solution:**
```bash
npx wrangler d1 execute tokyo2025 --remote --file=migrations/003_chat_history.sql
```

### Issue: Auto-seed not working

**Cause:** Google Places API key missing or invalid

**Solution:**
1. Get API key from [Google Cloud Console](https://console.cloud.google.com)
2. Enable Places API
3. Set secret:
   ```bash
   npx wrangler secret put GOOGLE_PLACES_API_KEY
   ```

### Issue: High latency

**Possible causes:**
- Database queries not optimized
- Missing indexes
- Large image uploads

**Solutions:**
1. Add database indexes:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_venues_category ON venues(category);
   CREATE INDEX IF NOT EXISTS idx_venues_district ON venues(district);
   ```

2. Use Cloudflare Images transformations to reduce image size

3. Enable request caching for static content

## Rollback Plan

### Rollback Code Deployment

If a deployment causes issues:

```bash
# View deployment history
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback --version <version-id>
```

### Rollback Database Migration

D1 doesn't support automatic rollback. To undo a migration:

1. Create a rollback SQL file
2. Execute it manually

Example rollback for migration 003:

```sql
-- rollback_003.sql
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chats;
```

```bash
npx wrangler d1 execute tokyo2025 --remote --file=rollback_003.sql
```

## Production Checklist

Before going live, verify:

- [ ] All database migrations applied successfully
- [ ] Environment secrets configured (API keys)
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled
- [ ] Error tracking set up
- [ ] All features tested in production
- [ ] Image upload and analysis working
- [ ] Multi-model chat working
- [ ] Chat history persisting
- [ ] Venue search working
- [ ] Logs monitored for errors
- [ ] Performance optimized
- [ ] Security headers configured
- [ ] Rate limiting considered

## Continuous Deployment (CI/CD)

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

### Configure GitHub Secrets

In GitHub repository settings:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secret: `CLOUDFLARE_API_TOKEN`

## Monitoring and Alerts

### Set Up Alerts

Configure alerts in Cloudflare Dashboard:

1. Go to **Notifications**
2. Create alerts for:
   - High error rate (> 5%)
   - Low success rate (< 95%)
   - High CPU time (> 50ms average)
   - D1 query errors

### Log Analysis

Use Logpush to send logs to external services:

```bash
npx wrangler logpush create --destination-conf <config>
```

Supported destinations:
- Datadog
- New Relic
- Splunk
- S3
- Google Cloud Storage

## Cost Estimation

### Cloudflare Workers

- **Free tier**: 100,000 requests/day
- **Paid tier**: $5/month + $0.50 per million requests

### D1 Database

- **Free tier**: 5 GB storage, 5 million row reads/day
- **Paid tier**: $5 per 10 GB storage + usage-based billing

### Cloudflare Images

- **Storage**: $5/month per 100,000 images
- **Delivery**: $1 per 100,000 images (first 100k free)

### AI Provider Costs

- **Workers AI**: Free (included with Workers)
- **OpenAI GPT-4**: ~$0.01-0.03 per 1K tokens
- **Google Gemini Pro**: ~$0.0025-0.01 per 1K tokens

### Estimated Monthly Cost

For moderate usage (10K daily users):

- Workers: $5-20/month
- D1: Free tier or $5-10/month
- Images: $10-30/month (if using)
- AI APIs: $50-200/month (if using OpenAI/Gemini)

**Total: $70-260/month** (or $5-10/month with Workers AI only)

## Support

For issues and questions:

- **Cloudflare Docs**: https://developers.cloudflare.com
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler
- **D1 Docs**: https://developers.cloudflare.com/d1
- **Community**: https://discord.gg/cloudflaredev
