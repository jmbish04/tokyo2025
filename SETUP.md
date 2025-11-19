# Quick Setup Guide - Tokyo 2025 Travel Companion

Follow these steps to get your Tokyo 2025 Travel Companion up and running in under 10 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Cloudflare account created
- [ ] Git installed

## Step-by-Step Setup

### 1. Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/jmbish04/tokyo2025.git
cd tokyo2025

# Install dependencies
npm install
```

### 2. Cloudflare Authentication (1 minute)

```bash
# Login to Cloudflare
npx wrangler login
```

A browser window will open. Authorize Wrangler to access your Cloudflare account.

### 3. Create Resources (3 minutes)

```bash
# Create D1 database
npx wrangler d1 create tokyo2025-db
```

**Copy the output** - you'll need the `database_id`.

```bash
# Create KV namespace
npx wrangler kv:namespace create MEMORY
```

**Copy the output** - you'll need the KV `id`.

### 4. Update Configuration (1 minute)

Open `wrangler.toml` and update these lines with the IDs from step 3:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tokyo2025-db"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"

[[kv_namespaces]]
binding = "MEMORY"
id = "PASTE_YOUR_KV_ID_HERE"
```

### 5. Initialize Database (1 minute)

```bash
# Run migrations to create tables and seed data
npx wrangler d1 migrations apply tokyo2025-db --remote
```

You should see:
```
✅ Migration 001_init.sql applied successfully
✅ Migration 002_seed.sql applied successfully
```

### 6. Test Locally (30 seconds)

```bash
# Start development server
npx wrangler dev
```

Open your browser to the URL shown (usually `http://localhost:8787`).

### 7. Deploy to Production (1 minute)

```bash
# Deploy to Cloudflare Workers
npx wrangler deploy
```

Copy the deployment URL shown - this is your live site!

## Verification

### Test Health Endpoint

```bash
curl https://YOUR-WORKER-URL.workers.dev/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "d1": true,
    "kv": true,
    "ai": true
  }
}
```

### Test Chat Endpoint

```bash
curl -X POST https://YOUR-WORKER-URL.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about Tokyo"}'
```

### Verify Database

```bash
npx wrangler d1 execute tokyo2025-db --remote \
  --command "SELECT COUNT(*) as count FROM venues"
```

Should return: `{"count": 6}`

## Optional: GitHub Actions CI/CD

If you want automatic deployments on every commit:

### 1. Get API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Create API Token
3. Use "Edit Cloudflare Workers" template
4. Copy the token

### 2. Add GitHub Secrets

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - `CLOUDFLARE_API_TOKEN`: Paste your API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

### 3. Push to Deploy

```bash
git add .
git commit -m "Enable CI/CD"
git push origin main
```

GitHub Actions will automatically deploy on every push!

## Troubleshooting

### "Database not found"
- Check that you updated `wrangler.toml` with correct `database_id`
- Run `npx wrangler d1 list` to verify database exists

### "KV namespace not found"
- Check that you updated `wrangler.toml` with correct KV `id`
- Run `npx wrangler kv:namespace list` to verify

### "No tables found"
- Run migrations again: `npx wrangler d1 migrations apply tokyo2025-db --remote`

### "Build failed"
- Delete `node_modules` and `.next`: `rm -rf node_modules .next`
- Reinstall: `npm install`
- Try again: `npm run build`

### "Workers AI not available"
- Workers AI requires a paid Workers plan ($5/month)
- The app will work with fallback responses if AI is unavailable

## Next Steps

Now that your Tokyo 2025 Travel Companion is running:

1. **Customize the venues**: Add your own favorite Tokyo spots to the database
2. **Add features**: Implement custom API integrations
3. **Improve AI**: Fine-tune prompts for better recommendations
4. **Add authentication**: Implement user accounts
5. **Custom domain**: Set up your own domain name

## Quick Commands Reference

```bash
# Development
npm run dev              # Next.js dev server
npx wrangler dev        # Wrangler dev (edge simulation)

# Database
npm run db:migrate      # Run migrations (production)
npm run db:migrate:local # Run migrations (local)

# Deployment
npm run build           # Build the project
npm run deploy          # Deploy to Cloudflare

# Monitoring
npx wrangler tail       # View live logs
npx wrangler deployments list  # List deployments

# Database queries
npx wrangler d1 execute tokyo2025-db --remote --command "SQL_HERE"

# KV operations
npx wrangler kv:key list --namespace-id=YOUR_KV_ID
npx wrangler kv:key get KEY_NAME --namespace-id=YOUR_KV_ID
```

## Resources

- **Full Documentation**: See [README.md](README.md)
- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Agent Architecture**: See [agents.md](agents.md)
- **Cloudflare Docs**: [developers.cloudflare.com](https://developers.cloudflare.com)

## Support

Having issues? Try these:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
3. Check Cloudflare status: [cloudflarestatus.com](https://cloudflarestatus.com)
4. Open an issue: [GitHub Issues](https://github.com/jmbish04/tokyo2025/issues)

---

**Estimated Setup Time**: 10 minutes
**Difficulty**: Beginner-friendly
**Cost**: Free tier available (AI features require paid plan)

Happy traveling! 🗼
