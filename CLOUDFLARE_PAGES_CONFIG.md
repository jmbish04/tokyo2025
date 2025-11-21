# Cloudflare Pages Configuration

This document provides the correct build settings for deploying the Tokyo 2025 application on Cloudflare Pages.

## Required Build Settings

When setting up your Cloudflare Pages project, use these configuration values:

### Build Configuration

| Setting | Value |
|---------|-------|
| **Framework preset** | Next.js |
| **Build command** | `npm run deploy` |
| **Build output directory** | `.vercel/output/static` |
| **Root directory** | `/` |
| **Node version** | `18.x` or higher |

### Environment Variables

Add these environment variables in Cloudflare Pages dashboard:

- `NODE_VERSION=18` (or higher)
- Any other secrets needed for your application

## Why These Settings?

### Build Command: `npm run deploy`

This command runs the complete deployment pipeline:
1. Type checks the code (shows errors but doesn't fail)
2. Runs `npx @cloudflare/next-on-pages` which:
   - Automatically runs `next build` to compile your Next.js application
   - Transforms the Next.js build output into Cloudflare Workers-compatible format
   - Generates the worker file at `.vercel/output/static/_worker.js/index.js`
3. Applies database migrations to production D1

**Note:** Cloudflare Pages handles the actual deployment after the build completes.

### Build Output Directory: `.vercel/output/static`

This is where `@cloudflare/next-on-pages` places all static assets and the worker file.

## How to Update Settings

### In Cloudflare Dashboard

1. Go to **Workers & Pages** → Select your project → **Settings** → **Builds & deployments**
2. Update **Build command** to: `npm run deploy`
3. Update **Build output directory** to: `.vercel/output/static`
4. Click **Save**

### For New Deployment

When connecting your repository:
1. Select **Next.js** framework preset
2. Override the build command with: `npm run deploy`
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

This means the build command didn't run properly.

**Solution**: Update the build command to `npm run deploy`

### Error: "Build command completed but no output found"

Check that the build output directory is set to `.vercel/output/static` (not `.vercel/output`)

### Build takes too long or times out

Increase the build timeout in Cloudflare Pages settings (default is usually sufficient, but you can increase to 20-30 minutes if needed)

## Manual Deployments

If you need to deploy manually from your local machine:

```bash
# Full deployment with migrations
npm run deploy:manual
```

For quick deployments without migrations:

```bash
npm run deploy:local
```

Or build and deploy separately:

```bash
# Build for Cloudflare
npx @cloudflare/next-on-pages

# Then deploy
npx wrangler deploy
```
