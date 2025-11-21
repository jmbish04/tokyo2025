# Cloudflare Pages Configuration

This document provides the correct build settings for deploying the Tokyo 2025 application on Cloudflare Pages.

## Required Build Settings

When setting up your Cloudflare Pages project, use these configuration values:

### Build Configuration

| Setting | Value |
|---------|-------|
| **Framework preset** | Next.js |
| **Build command** | `npx @cloudflare/next-on-pages` |
| **Build output directory** | `.vercel/output/static` |
| **Root directory** | `/` |
| **Node version** | `18.x` or higher |

### Environment Variables

Add these environment variables in Cloudflare Pages dashboard:

- `NODE_VERSION=18` (or higher)
- Any other secrets needed for your application

## Why These Settings?

### Build Command: `npx @cloudflare/next-on-pages`

This command:
1. Automatically runs `next build` to compile your Next.js application
2. Transforms the Next.js build output into Cloudflare Workers-compatible format
3. Generates the worker file at `.vercel/output/static/_worker.js/index.js`

**Important:** Run this command directly (not through npm scripts) to avoid recursive build issues.

### Build Output Directory: `.vercel/output/static`

This is where `@cloudflare/next-on-pages` places all static assets and the worker file.

## How to Update Settings

### In Cloudflare Dashboard

1. Go to **Workers & Pages** → Select your project → **Settings** → **Builds & deployments**
2. Update **Build command** to: `npx @cloudflare/next-on-pages`
3. Update **Build output directory** to: `.vercel/output/static`
4. Click **Save**

### For New Deployment

When connecting your repository:
1. Select **Next.js** framework preset
2. Override the build command with: `npx @cloudflare/next-on-pages`
3. Set build output directory to: `.vercel/output/static`

## Verifying Configuration

After deploying, you should see in the build logs:

```
⚡️ @cloudflare/next-on-pages CLI v.1.13.16
⚡️ Detected Package Manager: npm
⚡️ Preparing project...
⚡️ Project is ready
⚡️ Building project...
...
⚡️ Build Summary (@cloudflare/next-on-pages v1.13.16)
⚡️
⚡️ Middleware Functions (1)
⚡️ Edge Function Routes (18)
⚡️ Prerendered Routes (2)
⚡️ Other Static Assets (42)
⚡️
⚡️ Generated '.vercel/output/static/_worker.js/index.js'.
⚡️ Build completed in X.XXs
```

## Troubleshooting

### Error: "entry-point file at '.vercel/output/_worker.js' was not found"

This means the build command didn't run `@cloudflare/next-on-pages`.

**Solution**: Update the build command to `npx @cloudflare/next-on-pages`

### Error: "Build command completed but no output found"

Check that the build output directory is set to `.vercel/output/static` (not `.vercel/output`)

### Build takes too long or times out

Increase the build timeout in Cloudflare Pages settings (default is usually sufficient, but you can increase to 20-30 minutes if needed)

## Alternative: Deploy via Wrangler CLI

If you prefer not to use Cloudflare Pages automatic deployments, you can deploy manually using the deploy commands:

```bash
# Standard deploy (no migrations)
npm run deploy
```

For deployments with database migrations:

```bash
npm run deploy:with-migrations
```

Or build and deploy separately:

```bash
# Build for Cloudflare
npx @cloudflare/next-on-pages

# Then deploy
npx wrangler deploy
```

## GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically deploys on push to `main` or `claude/*` branches. It uses the correct build command (`npx @cloudflare/next-on-pages`).

Make sure these secrets are set in your GitHub repository:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
