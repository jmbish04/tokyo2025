# Deployment Guide - Tokyo 2025 Travel Companion

Complete guide for deploying the Tokyo 2025 Travel Companion to Cloudflare Workers.

> **⚠️ Important**: If you're using Cloudflare Pages automatic deployments, see [CLOUDFLARE_PAGES_CONFIG.md](./CLOUDFLARE_PAGES_CONFIG.md) for the correct build settings.

## Prerequisites

1. **Cloudflare Account**
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Note your Account ID (found in dashboard)

2. **API Token**
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create token with permissions:
     - Workers Scripts: Edit
     - Account Settings: Read
     - D1: Edit
     - Workers KV Storage: Edit

3. **Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

## Initial Setup

### Step 1: Authenticate

```bash
npx wrangler login
```

This opens a browser to authorize Wrangler with your Cloudflare account.

### Step 2: Create D1 Database

```bash
npx wrangler d1 create tokyo2025-db
```

**Output**:
```
✅ Successfully created DB 'tokyo2025-db'
[[d1_databases]]
binding = "DB"
database_name = "tokyo2025-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy the `database_id` and update `wrangler.toml`.

### Step 3: Create KV Namespace

```bash
npx wrangler kv:namespace create MEMORY
```

**Output**:
```
✅ Successfully created KV namespace
[[kv_namespaces]]
binding = "MEMORY"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Copy the `id` and update `wrangler.toml`.

### Step 4: Update wrangler.toml

Replace placeholders in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tokyo2025-db"
database_id = "YOUR_ACTUAL_DATABASE_ID"  # Replace this

[[kv_namespaces]]
binding = "MEMORY"
id = "YOUR_ACTUAL_KV_ID"  # Replace this
```

### Step 5: Run Migrations

```bash
# Apply migrations to production database
npx wrangler d1 migrations apply tokyo2025-db --remote
```

Expected output:
```
🌀 Executing on remote database tokyo2025-db:
🌀 To execute on your local development database, pass the --local flag
🚣 Executed 2 migration(s) in 0.45 seconds
✅ Migration 001_init.sql applied successfully
✅ Migration 002_seed.sql applied successfully
```

### Step 6: Verify Database

```bash
npx wrangler d1 execute tokyo2025-db --remote --command "SELECT * FROM venues"
```

You should see the 6 seeded venues.

## Deployment

### Development Deployment

```bash
# Local development
npm run dev

# Test with Wrangler (simulates edge environment)
npx wrangler dev
```

### Production Deployment

```bash
# Build for Cloudflare Pages and deploy
npm run pages:build
npx wrangler deploy

# Or use the deploy script
npm run deploy
```

**Note**: For Cloudflare Pages automatic deployments, set the build command to:
```
npx @cloudflare/next-on-pages
```
This will automatically run `next build` and then package for Cloudflare Workers.

**Expected Output**:
```
⛅️ wrangler 3.57.0
------------------
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded tokyo2025 (x.xx sec)
Published tokyo2025 (x.xx sec)
  https://tokyo2025.YOUR_SUBDOMAIN.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## CI/CD Setup (GitHub Actions)

### Step 1: Add GitHub Secrets

In your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add these secrets:

   - **CLOUDFLARE_API_TOKEN**: Your Cloudflare API token
   - **CLOUDFLARE_ACCOUNT_ID**: Your Cloudflare account ID

### Step 2: Enable Workflows

The workflow is already configured in `.github/workflows/deploy.yml`.

Push to `main` or any `claude/*` branch to trigger deployment:

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### Step 3: Monitor Deployment

1. Go to GitHub → Actions tab
2. Watch the deployment progress
3. Check logs for any errors

## Post-Deployment

### Verify Deployment

```bash
# Check deployment status
npx wrangler deployments list

# Test the worker
curl https://tokyo2025.YOUR_SUBDOMAIN.workers.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-19T...",
  "services": {
    "d1": true,
    "kv": true,
    "ai": true
  }
}
```

### Test API Endpoints

```bash
# Test chat endpoint
curl -X POST https://tokyo2025.YOUR_SUBDOMAIN.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about Tokyo food markets"}'

# Test memory endpoint
curl https://tokyo2025.YOUR_SUBDOMAIN.workers.dev/api/memory?limit=5

# Test weather endpoint
curl https://tokyo2025.YOUR_SUBDOMAIN.workers.dev/api/weather?location=Tokyo
```

## Custom Domain (Optional)

### Step 1: Add Domain to Cloudflare

1. Add your domain to Cloudflare
2. Update nameservers
3. Wait for DNS to propagate

### Step 2: Configure Worker Route

In `wrangler.toml`, add:

```toml
routes = [
  { pattern = "tokyo2025.yourdomain.com", zone_name = "yourdomain.com" }
]
```

### Step 3: Deploy with Custom Domain

```bash
npx wrangler deploy
```

Your worker will now be available at `https://tokyo2025.yourdomain.com`.

## Monitoring & Logs

### Real-time Logs

```bash
npx wrangler tail
```

This shows live requests and logs.

### View Specific Logs

```bash
# Filter by status code
npx wrangler tail --status 500

# Filter by method
npx wrangler tail --method POST
```

### Analytics Dashboard

Visit Cloudflare Dashboard → Workers & Pages → tokyo2025 → Metrics

View:
- Request volume
- Success rate
- Response time
- Errors
- CPU time

## Database Management

### Query Database

```bash
# Production
npx wrangler d1 execute tokyo2025-db --remote --command "SELECT COUNT(*) FROM logs"

# Local
npx wrangler d1 execute tokyo2025-db --local --command "SELECT * FROM venues"
```

### Export Data

```bash
# Export venues
npx wrangler d1 execute tokyo2025-db --remote --command "SELECT * FROM venues" --json > venues_backup.json

# Export logs
npx wrangler d1 execute tokyo2025-db --remote --command "SELECT * FROM logs" --json > logs_backup.json
```

### Import Data

```bash
# Create SQL file with INSERT statements
npx wrangler d1 execute tokyo2025-db --remote --file import_data.sql
```

## KV Storage Management

### List Keys

```bash
npx wrangler kv:key list --namespace-id=YOUR_KV_ID
```

### Get Value

```bash
npx wrangler kv:key get "chat:1234567890" --namespace-id=YOUR_KV_ID
```

### Put Value

```bash
npx wrangler kv:key put "test:key" "test value" --namespace-id=YOUR_KV_ID
```

### Delete Key

```bash
npx wrangler kv:key delete "test:key" --namespace-id=YOUR_KV_ID
```

## Rollback

### List Deployments

```bash
npx wrangler deployments list
```

### Rollback to Previous Version

```bash
npx wrangler rollback --message "Rolling back due to issues"
```

Or rollback to specific deployment:

```bash
npx wrangler rollback [DEPLOYMENT_ID]
```

## Troubleshooting

### Issue: Database Not Found

```bash
# Verify database exists
npx wrangler d1 list

# Check wrangler.toml has correct database_id
```

### Issue: KV Namespace Not Found

```bash
# List namespaces
npx wrangler kv:namespace list

# Verify ID matches wrangler.toml
```

### Issue: Build Fails

```bash
# Clear cache
rm -rf .next .vercel node_modules

# Reinstall
npm install

# Rebuild for Next.js only
npm run build

# Or rebuild for Cloudflare Pages
npm run pages:build
```

### Issue: AI Binding Not Working

Workers AI requires a paid Workers plan. Check your Cloudflare plan:

```bash
npx wrangler whoami
```

### Issue: Deployment Timeout

Increase timeout in `wrangler.toml`:

```toml
[build]
command = "npm run build"
[build.upload]
timeout = 300  # 5 minutes
```

## Performance Optimization

### Enable Caching

Add caching headers in API routes:

```typescript
return new Response(data, {
  headers: {
    'Cache-Control': 'public, max-age=3600',
  },
});
```

### Database Indexes

Add indexes for frequently queried fields:

```sql
CREATE INDEX idx_venues_category ON venues(category);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_created_at ON logs(created_at);
```

### KV Optimization

- Use longer TTLs for static data
- Batch operations when possible
- Use list operations sparingly

## Cost Estimation

**Free Tier Limits**:
- 100,000 requests/day
- 10 GB-seconds CPU time/day
- D1: 5 GB storage, 5M rows read/day
- KV: 100,000 reads/day, 1,000 writes/day

**Estimated Costs** (Paid Plan):
- Workers: $5/month + $0.50 per million requests
- D1: Included in Workers plan
- KV: $0.50 per million reads
- AI: $0.01 per 1,000 neurons

## Security Best Practices

1. **Never commit secrets**
   - Use `.env.local` for development
   - Use Wrangler secrets for production

2. **Rate limiting**
   ```typescript
   // Implement in API routes
   const rateLimiter = new RateLimit({ limit: 100, window: 60 });
   ```

3. **Input validation**
   - Sanitize all user inputs
   - Use prepared statements for SQL

4. **CORS configuration**
   ```typescript
   headers: {
     'Access-Control-Allow-Origin': 'https://yourdomain.com',
   }
   ```

## Next Steps

1. ✅ Deploy to production
2. ✅ Test all endpoints
3. ✅ Set up monitoring
4. ✅ Configure custom domain (optional)
5. ✅ Enable GitHub Actions CI/CD
6. ⬜ Add custom venues to database
7. ⬜ Implement user authentication
8. ⬜ Add analytics tracking

---

For support:
- Cloudflare Docs: [developers.cloudflare.com](https://developers.cloudflare.com)
- Discord: [Cloudflare Developers](https://discord.gg/cloudflaredev)
- GitHub Issues: [jmbish04/tokyo2025](https://github.com/jmbish04/tokyo2025)
