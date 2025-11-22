# Tokyo2025 Configuration Summary

## Secrets Store Bindings ✅

All required secrets store bindings are configured in `wrangler.toml` using store ID `8c42fa70938644e0a8a109744467375f`:

### Configured Bindings

1. **OPENAI_API_KEY**
   - Binding: `OPENAI_API_KEY`
   - Secret Name: `OPENAI_API_KEY`
   - Used for: OpenAI GPT-4 and GPT-3.5 models

2. **GOOGLE_API_KEY** (Gemini)
   - Binding: `GOOGLE_API_KEY`
   - Secret Name: `GOOGLE_API_KEY`
   - Used for: Google Gemini 1.5 Pro and Flash models

3. **CLOUDFLARE_ACCOUNT_ID**
   - Binding: `CLOUDFLARE_ACCOUNT_ID`
   - Secret Name: `CLOUDFLARE_ACCOUNT_ID`
   - Used for: Cloudflare Images and other account-specific features

4. **CLOUDFLARE_API_TOKEN**
   - Binding: `CLOUDFLARE_API_TOKEN`
   - Secret Name: `CLOUDFLARE_API_TOKEN`
   - Used for: Cloudflare API access for Images and other services

### Configuration Format

The secrets are configured using TOML array-of-tables syntax:

```toml
[[secrets_store_secrets]]
binding = "OPENAI_API_KEY"
store_id = "8c42fa70938644e0a8a109744467375f"
secret_name = "OPENAI_API_KEY"
```

This syntax is correct for Wrangler 3.x and 4.x, though older Wrangler versions may show a warning that can be safely ignored.

### Accessing Secrets in Code

In your Worker code, secrets are accessed via the `env` object:

```typescript
const openaiKey = await env.OPENAI_API_KEY.get();
const googleKey = await env.GOOGLE_API_KEY.get();
const accountId = await env.CLOUDFLARE_ACCOUNT_ID.get();
const apiToken = await env.CLOUDFLARE_API_TOKEN.get();
```

Note: Secrets Store bindings require `.get()` to retrieve the value asynchronously.

## Static Assets Handling ✅

The Next.js application uses `@cloudflare/next-on-pages` which handles static assets automatically.

### How It Works

The `@cloudflare/next-on-pages` adapter:
- Generates a worker file at `.vercel/output/static/_worker.js/index.js`
- Bundles all static assets (CSS, JS, images) into the worker
- Handles serving these assets internally

**Important:** Do NOT add a separate `[assets]` configuration in wrangler.toml. The adapter already manages all static files within the worker itself. Adding an assets binding pointing to the same directory will cause conflicts and internal server errors.

### Configuration

The correct wrangler.toml configuration is:

```toml
name = "tokyo2025"
main = ".vercel/output/static/_worker.js/index.js"
compatibility_date = "2025-11-21"
compatibility_flags = ["nodejs_compat"]
```

This is all that's needed - the worker at the `main` path handles everything, including:
- ✅ Serving CSS stylesheets
- ✅ Serving JavaScript bundles
- ✅ Serving images and static assets
- ✅ Routing and API endpoints

## Complete Bindings List

The worker has access to these bindings:

1. **DB** - D1 Database for data persistence
2. **MEMORY** - KV Namespace for caching
3. **AI** - Cloudflare AI for Workers AI models
4. **ANALYTICS** - Analytics Engine for tracking
5. **OPENAI_API_KEY** - OpenAI API access (Secrets Store)
6. **GOOGLE_API_KEY** - Google Gemini API access (Secrets Store)
7. **CLOUDFLARE_ACCOUNT_ID** - Account ID (Secrets Store)
8. **CLOUDFLARE_API_TOKEN** - API Token (Secrets Store)

## Deployment

### Prerequisites

Before deploying, ensure all secrets exist in the Secrets Store:

```bash
# Check if secrets exist
npx wrangler secrets-store secret list 8c42fa70938644e0a8a109744467375f --remote

# If secrets don't exist, create them
npx wrangler secrets-store secret create 8c42fa70938644e0a8a109744467375f --name OPENAI_API_KEY --scopes workers --remote
npx wrangler secrets-store secret create 8c42fa70938644e0a8a109744467375f --name GOOGLE_API_KEY --scopes workers --remote
npx wrangler secrets-store secret create 8c42fa70938644e0a8a109744467375f --name CLOUDFLARE_ACCOUNT_ID --scopes workers --remote
npx wrangler secrets-store secret create 8c42fa70938644e0a8a109744467375f --name CLOUDFLARE_API_TOKEN --scopes workers --remote
```

### Deploy Command

```bash
# Full deployment with migrations
npm run deploy:manual

# Or just build and deploy
npm run deploy:local
```

### Verify Deployment

After deployment, check that:
1. The application loads with proper styling
2. CSS and JavaScript files are served correctly
3. All API endpoints work (especially those using AI models)
4. Images and other static assets display

## Troubleshooting

### "Unexpected secrets_store_secrets" Warning

This warning appears with Wrangler 3.x but doesn't affect functionality. To remove it, upgrade to Wrangler 4.x:

```bash
npm install --save-dev wrangler@4
```

### Internal Server Error

If you see an internal server error:
1. **Remove any `[assets]` configuration** - @cloudflare/next-on-pages handles assets internally
2. Ensure only `main = ".vercel/output/static/_worker.js/index.js"` is specified
3. Rebuild: `npm run deploy`
4. Redeploy

### Unstyled HTML After Deployment

If the site loads but without styling:
1. Ensure the build completed successfully
2. Verify the build output exists at `.vercel/output/static/`
3. Check that `main` points to `.vercel/output/static/_worker.js/index.js`
4. Rebuild and redeploy

### Secrets Not Working

If API calls fail due to missing keys:
1. Verify secrets exist in the store
2. Check the store_id matches in wrangler.toml
3. Ensure secret names match exactly (case-sensitive)
4. Redeploy after creating secrets

## Local Development

For local development, use `.dev.vars` file:

```env
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

Local dev uses plain environment variables, not Secrets Store. Secrets Store is only used for production deployments.

## References

- [Cloudflare Secrets Store Documentation](https://developers.cloudflare.com/secrets-store/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Static Assets in Workers](https://developers.cloudflare.com/workers/static-assets/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
