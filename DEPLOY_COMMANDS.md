# Deployment Commands Quick Reference

## Main Deployment Commands

### Full Deployment (Recommended)
```bash
npm run deploy
```

**What it does:**
1. ✓ Type checks the code (shows errors but doesn't fail)
2. ✓ Builds Next.js application
3. ✓ Transforms for Cloudflare Workers using `@cloudflare/next-on-pages`
4. ✓ Applies database migrations to production D1
5. ✓ Deploys to Cloudflare Workers

**Use this when:** You want to deploy with all checks and migrations.

---

### Quick Deployment (Skip Migrations)
```bash
npm run deploy:skip-migrations
```

**What it does:**
1. ✓ Builds for Cloudflare Pages
2. ✓ Deploys to Cloudflare Workers
3. ✗ Skips type checking
4. ✗ Skips database migrations

**Use this when:** You're deploying code changes without database schema changes.

---

### Force Deployment
```bash
npm run deploy:force
```

**What it does:**
- Same as `deploy:skip-migrations`
- No type checking, no migrations
- Just build and deploy

**Use this when:** You need to deploy quickly and you've already validated everything.

---

## Individual Build Commands

### Type Check Only
```bash
npm run typecheck
```
Runs TypeScript compiler in check mode (no output, just validation).

### Build Next.js Only
```bash
npm run build
```
Builds the Next.js application (doesn't transform for Cloudflare).

### Build for Cloudflare Pages
```bash
npm run pages:build
```
Runs the complete Cloudflare Pages build:
- Executes `next build` automatically
- Transforms output for Cloudflare Workers
- Generates `.vercel/output/static/_worker.js/index.js`

---

## Database Commands

### Apply Migrations (Production)
```bash
npm run db:migrate
```
Applies pending migrations to the production D1 database.

### Apply Migrations (Local)
```bash
npm run db:migrate:local
```
Applies migrations to local development database.

### Query Database (Production)
```bash
npm run db:query "SELECT * FROM venues"
```

### Query Database (Local)
```bash
npm run db:query:local "SELECT * FROM venues"
```

---

## Development Commands

### Local Development (Next.js)
```bash
npm run dev
```
Runs Wrangler dev server with Next.js.

### Preview Build Locally
```bash
npm run preview
```
Builds the project and runs it locally with Wrangler (simulates production environment).

---

## Cloudflare Setup Commands

### Login to Cloudflare
```bash
npm run cf:login
```

### Create Database
```bash
npm run db:create
```

### Create KV Namespace
```bash
npm run kv:create
```

### Initialize Everything
```bash
npm run cf:init
```
Creates both D1 database and KV namespace.

---

## Secrets Management

### Set a Secret
```bash
npm run secret:set SECRET_NAME
# Then enter the secret value when prompted
```

### List All Secrets
```bash
npm run secret:list
```

---

## Cloudflare Pages Automatic Deployments

If you're using Cloudflare Pages automatic deployments (recommended), configure:

**Build command:**
```
npx @cloudflare/next-on-pages
```

**Build output directory:**
```
.vercel/output/static
```

**Framework preset:**
```
Next.js
```

For detailed Cloudflare Pages configuration, see [CLOUDFLARE_PAGES_CONFIG.md](./CLOUDFLARE_PAGES_CONFIG.md).

---

## GitHub Actions

The project includes automatic deployments via GitHub Actions (`.github/workflows/deploy.yml`).

**Triggers:**
- Push to `main` branch
- Push to `claude/*` branches

**Required secrets:**
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The workflow automatically:
1. Checks types (non-blocking)
2. Builds for Cloudflare Pages
3. Applies database migrations
4. Deploys to Cloudflare Workers

---

## Deployment Checklist

### First Time Deployment
- [ ] Run `npm run cf:login`
- [ ] Run `npm run cf:init` (create DB and KV)
- [ ] Update `wrangler.toml` with database_id and KV id
- [ ] Set required secrets (OPENAI_API_KEY, etc.)
- [ ] Run `npm run db:migrate`
- [ ] Run `npm run deploy`

### Regular Deployments
- [ ] Make your code changes
- [ ] Test locally with `npm run dev`
- [ ] Run `npm run deploy`

### If Using Cloudflare Pages
- [ ] Set build command: `npx @cloudflare/next-on-pages`
- [ ] Set output directory: `.vercel/output/static`
- [ ] Push to GitHub (automatic deployment)

---

## Troubleshooting

### Build fails with type errors
- Type errors are informational only in `npm run deploy`
- They won't stop the deployment
- Fix them when you can, but they won't block you

### Migration errors
- If migrations are already applied, the error is harmless
- Use `deploy:skip-migrations` if you don't have new migrations

### Deployment takes too long
- Check Cloudflare dashboard for build logs
- Increase timeout in Cloudflare Pages settings if needed

### Worker file not found
- Make sure you're using `npm run pages:build` not just `npm run build`
- Check that `wrangler.toml` points to `.vercel/output/static/_worker.js/index.js`

---

## Command Comparison

| Command | Type Check | Build | Migrate | Deploy |
|---------|-----------|-------|---------|--------|
| `deploy` | ✓ (warn) | ✓ | ✓ | ✓ |
| `deploy:skip-migrations` | ✗ | ✓ | ✗ | ✓ |
| `deploy:force` | ✗ | ✓ | ✗ | ✓ |
| `pages:build` | ✗ | ✓ | ✗ | ✗ |
| `build` | ✗ | ✓ (Next.js only) | ✗ | ✗ |

---

For more details:
- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Cloudflare Pages config: [CLOUDFLARE_PAGES_CONFIG.md](./CLOUDFLARE_PAGES_CONFIG.md)
- Project overview: [README.md](./README.md)
