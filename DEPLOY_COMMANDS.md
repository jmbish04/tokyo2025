# Deployment Commands Quick Reference

## Main Deployment Commands

### Cloudflare Pages CI/CD (Primary Method)
```bash
npm run deploy
```

**What it does:**
1. ✓ Type checks the code (shows errors but doesn't fail)
2. ✓ Builds for Cloudflare Workers using `@cloudflare/next-on-pages`
3. ✓ Applies database migrations to production D1

**This is used by Cloudflare Pages automatic deployments.**
Cloudflare Pages handles the actual deployment after the build completes.

---

### Manual Deployment (Local)
```bash
npm run deploy:manual
```

**What it does:**
1. ✓ Type checks the code
2. ✓ Builds for Cloudflare Workers
3. ✓ Applies database migrations to production D1
4. ✓ Deploys to Cloudflare Workers via wrangler

**Use this when:** Deploying manually from your local machine.

---

### Quick Local Deployment
```bash
npm run deploy:local
```

**What it does:**
1. ✓ Builds for Cloudflare Workers
2. ✓ Deploys immediately via wrangler
3. ✗ Skips type checking
4. ✗ Skips migrations

**Use this when:** Quick local testing deployments without migrations.

---

## Individual Build Commands

### Type Check Only
```bash
npm run typecheck
```
Runs TypeScript compiler in check mode (no output, just validation).

### Build Next.js
```bash
npm run build
```
Builds the Next.js application only (doesn't transform for Cloudflare).

### Build for Cloudflare Workers
```bash
npx @cloudflare/next-on-pages
```
Runs the complete Cloudflare Workers build:
- Executes `next build` automatically
- Transforms output for Cloudflare Workers
- Generates `.vercel/output/static/_worker.js/index.js`

**This is the command used by Cloudflare Pages automatic deployments.**

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
npm run deploy
```

**Build output directory:**
```
.vercel/output/static
```

**Framework preset:**
```
Next.js
```

**What happens:**
- Cloudflare Pages runs `npm run deploy` which builds and applies migrations
- Cloudflare Pages then automatically deploys the built output

For detailed Cloudflare Pages configuration, see [CLOUDFLARE_PAGES_CONFIG.md](./CLOUDFLARE_PAGES_CONFIG.md).

---

## Deployment Checklist

### First Time Setup
- [ ] Run `npm run cf:login`
- [ ] Run `npm run cf:init` (create DB and KV)
- [ ] Update `wrangler.toml` with database_id and KV id
- [ ] Set required secrets (OPENAI_API_KEY, etc.) in Cloudflare dashboard
- [ ] Connect repository to Cloudflare Pages
- [ ] Set build command: `npm run deploy`
- [ ] Set output directory: `.vercel/output/static`

### Regular Deployments (Cloudflare Pages)
- [ ] Make your code changes
- [ ] Test locally with `npm run dev`
- [ ] Push to your repository
- [ ] Cloudflare Pages automatically builds and deploys

### Manual Deployments (Local)
- [ ] Make your code changes
- [ ] Test locally with `npm run dev`
- [ ] Run `npm run deploy:manual`

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
| `deploy` (CF Pages) | ✓ (warn) | ✓ (Cloudflare) | ✓ | Auto (CF Pages) |
| `deploy:manual` | ✓ (warn) | ✓ (Cloudflare) | ✓ | ✓ (wrangler) |
| `deploy:local` | ✗ | ✓ (Cloudflare) | ✗ | ✓ (wrangler) |
| `build` | ✗ | ✓ (Next.js only) | ✗ | ✗ |
| `npx @cloudflare/next-on-pages` | ✗ | ✓ (Cloudflare) | ✗ | ✗ |

---

For more details:
- Full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Cloudflare Pages config: [CLOUDFLARE_PAGES_CONFIG.md](./CLOUDFLARE_PAGES_CONFIG.md)
- Project overview: [README.md](./README.md)
