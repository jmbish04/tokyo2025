# Setting Up Cloudflare Pages Deployment

## Overview

This guide will help you create a Cloudflare Pages deployment for your Tokyo 2025 application.

## Prerequisites

- GitHub repository: `jmbish04/tokyo2025`
- Cloudflare account
- Access to your repository

## Step-by-Step Setup

### 1. Create Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** in the left sidebar
3. Click **Create application**
4. Select **Pages** tab
5. Click **Connect to Git**

### 2. Connect Your Repository

1. Choose **GitHub** as your Git provider
2. Authorize Cloudflare to access your GitHub account (if not already done)
3. Select the repository: **jmbish04/tokyo2025**
4. Click **Begin setup**

### 3. Configure Build Settings

On the build configuration page, enter these exact values:

```
Project name: tokyo2025
Production branch: main (or your default branch)
```

**Build settings:**
```
Framework preset: Next.js
Build command: npm run deploy
Build output directory: .vercel/output/static
Root directory: (leave empty or /)
```

**Environment variables:** (click "Add variable" for each)
```
NODE_VERSION = 18
```

Additional secrets can be added later in Settings → Environment variables

### 4. Deploy

1. Click **Save and Deploy**
2. Cloudflare will automatically:
   - Clone your repository
   - Install dependencies
   - Run `npm run deploy`
   - Deploy the built application
3. Wait for the build to complete (usually 2-5 minutes)

### 5. Configure Bindings

After the first deployment, you need to add the Cloudflare bindings:

1. Go to **Workers & Pages** → **tokyo2025** → **Settings** → **Functions**
2. Scroll down to **Bindings**

**Add these bindings:**

#### D1 Database
- Click **Add binding**
- Type: **D1 database**
- Variable name: `DB`
- D1 database: Select or create `tokyo2025` database
- Click **Save**

#### KV Namespace
- Click **Add binding**
- Type: **KV namespace**
- Variable name: `MEMORY`
- KV namespace: Select or create your KV namespace
- Click **Save**

#### Cloudflare AI
- Click **Add binding**
- Type: **AI**
- Variable name: `AI`
- Click **Save**

#### Analytics Engine
- Click **Add binding**
- Type: **Analytics Engine**
- Variable name: `ANALYTICS`
- Dataset: Select or create a dataset
- Click **Save**

#### Secrets Store (for API keys)
For each secret, go to **Settings** → **Environment variables**:
1. Click **Add variable**
2. Choose **Secret** type
3. Add these secrets:
   - `OPENAI_API_KEY`
   - `GOOGLE_API_KEY`
   - `ADMIN_API_KEY`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`

### 6. Trigger Redeploy

After adding all bindings:
1. Go to **Deployments** tab
2. Click **Retry deployment** on the latest deployment
3. This will rebuild with all bindings configured

### 7. Access Your Application

Once deployed, your application will be available at:
```
https://tokyo2025.pages.dev
```

Or your custom domain if configured.

## Alternative: Manual Deployment via Wrangler

If you prefer to deploy manually from your local machine instead of using Pages:

```bash
# Build the application
npm run deploy:local

# Or use the full deployment with migrations
npm run deploy:manual
```

This will deploy directly to Cloudflare Workers (not Pages) using your wrangler.toml configuration.

## Troubleshooting

### Build fails with "command not found"
- Verify the build command is exactly: `npm run deploy`
- Check that package.json has the `deploy` script defined

### Build succeeds but shows default message
- Check that build output directory is `.vercel/output/static` (with the dot)
- Verify bindings are configured correctly
- Try a manual retry of the deployment

### Bindings not working
- Make sure you added bindings in the Functions settings (not just environment variables)
- Redeploy after adding bindings
- Check that variable names match exactly: `DB`, `MEMORY`, `AI`, `ANALYTICS`

## Next Steps

After successful deployment:

1. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

2. **Seed the Database** (optional)
   - Visit `https://your-app.pages.dev/seed`
   - Click "Seed Database" buttons for each district

3. **Test the Application**
   - Visit the home page
   - Try the chat interface at `/chat`
   - Check system logs at `/logs`

## Automatic Deployments

Once set up, Cloudflare Pages will automatically deploy:
- **Production**: Every push to your main branch
- **Preview**: Every push to other branches and pull requests

Each deployment gets its own URL for testing.
