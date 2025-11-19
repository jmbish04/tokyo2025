# Quick Start: Auto-Seeding Ginza & Osaka Venues

Get your Tokyo 2025 Travel Companion populated with real venue data in 5 minutes!

## What You'll Get

After seeding, your database will have:
- **Ginza**: 10-15 luxury shopping, dining, and cultural venues
- **Osaka**: 10-15 street food, shopping, and entertainment spots
- All with real ratings, addresses, and Google Maps links

## Prerequisites

- ✅ Tokyo 2025 app deployed or running locally
- ✅ Google Cloud account (free tier works!)
- ✅ 5 minutes of your time

## Step 1: Get Google Places API Key (2 minutes)

1. **Go to Google Cloud Console**: https://console.cloud.google.com

2. **Create/Select Project**:
   - Click project dropdown → "New Project"
   - Name it "tokyo2025" → Create

3. **Enable Places API**:
   - Go to "APIs & Services" → "Library"
   - Search "Places API"
   - Click "Places API" → Enable
   - Also enable "Places API (New)" → Enable

4. **Create API Key**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key (looks like: `AIzaSyC...`)

5. **Restrict Key (Optional but recommended)**:
   - Click on your API key
   - Under "API restrictions" → Select "Restrict key"
   - Choose "Places API"
   - Save

## Step 2: Add API Key to Your Worker (1 minute)

### For Production (Deployed Worker)

```bash
npx wrangler secret put GOOGLE_PLACES_API_KEY
# Paste your key when prompted: AIzaSyC...
```

### For Local Development

```bash
# Create .dev.vars file
echo "GOOGLE_PLACES_API_KEY=AIzaSyC_your_actual_key_here" > .dev.vars
```

**Replace `AIzaSyC_your_actual_key_here` with your real key!**

## Step 3: Start Worker (30 seconds)

### Local Development

```bash
npx wrangler dev
```

Keep this running in one terminal.

### Production

```bash
npx wrangler deploy
```

## Step 4: Seed the Database (2 minutes)

### Method A: Using npm Scripts (Easiest)

```bash
# Open a new terminal

# Seed both Ginza and Osaka
npm run seed:all

# Or seed individually:
npm run seed:ginza    # Just Ginza
npm run seed:osaka    # Just Osaka
```

### Method B: Using curl (Alternative)

```bash
# For local worker
curl -X POST http://localhost:8787/api/seed \
  -H "Content-Type: application/json" \
  -d '{"areas": ["ginza", "osaka"]}'

# For production worker
curl -X POST https://tokyo2025.YOUR-WORKER.workers.dev/api/seed \
  -H "Content-Type: application/json" \
  -d '{"areas": ["ginza", "osaka"]}'
```

### Method C: Using Web Browser (Simplest for non-technical users)

1. Go to your worker URL: `https://tokyo2025.YOUR-WORKER.workers.dev/api/seed`
2. You'll see seeding instructions
3. Use a tool like [Postman](https://postman.com) or [Hoppscotch](https://hoppscotch.io)
4. Make a POST request with body: `{"areas": ["ginza", "osaka"]}`

## Expected Output

```
🌱 Seeding ginza, osaka area(s)...
📍 Worker URL: http://localhost:8787

✅ Seeding completed successfully!

📊 Results:
   Ginza venues: 15
   Osaka venues: 12
   Total: 27
   Duration: 18.34s

📈 Database Stats:
   Total venues: 33

   By category:
      Shopping Mall: 8
      Restaurant: 7
      Department Store: 4
      Bar: 3
      Tourist Attraction: 3
      Fashion Boutique: 3
      Cafe: 2
      Nightlife: 2
      Jewelry & Luxury: 1

   By district:
      Ginza: 15
      Namba: 7
      Dotonbori: 5
```

## What Gets Seeded

### Ginza (Luxury Shopping District)

The script searches for:
- Luxury department stores (Mitsukoshi, Ginza Six, Wako)
- Designer boutiques (Louis Vuitton, Hermès, Chanel)
- High-end restaurants and sushi spots
- Art galleries and cultural venues
- Jewelry stores

### Osaka (Street Food & Entertainment)

The script searches for:
- Dotonbori restaurants and street food
- Namba shopping and entertainment
- Shinsaibashi boutiques
- Kuromon Market
- Takoyaki and okonomiyaki spots
- Nightlife venues

## Verify Success

### Check in Chat UI

1. Go to your app: http://localhost:8787 (or your deployed URL)
2. Ask: "Show me luxury shopping in Ginza"
3. You should see venue cards with real data!

### Check Database Directly

```bash
# Count venues
npx wrangler d1 execute tokyo2025-db --remote \
  --command "SELECT COUNT(*) as count FROM venues"

# See Ginza venues
npx wrangler d1 execute tokyo2025-db --remote \
  --command "SELECT name, category FROM venues WHERE district = 'Ginza'"

# See Osaka venues
npx wrangler d1 execute tokyo2025-db --remote \
  --command "SELECT name, category FROM venues WHERE district LIKE '%Osaka%' OR district IN ('Namba', 'Dotonbori')"
```

## Troubleshooting

### "API key required"

```bash
# Make sure secret is set
npx wrangler secret list

# Should show GOOGLE_PLACES_API_KEY

# If not, set it again
npx wrangler secret put GOOGLE_PLACES_API_KEY
```

### "Google Places API error: REQUEST_DENIED"

Your API key doesn't have Places API enabled.

**Fix**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Library
3. Enable "Places API"

### "Worker not responding"

```bash
# Make sure worker is running
npx wrangler dev

# Or check your deployed worker URL
curl https://tokyo2025.YOUR-WORKER.workers.dev/health
```

### Seeding is slow

This is normal! The script:
- Makes 12 search queries (6 for Ginza, 6 for Osaka)
- Gets details for top 5 places each
- Waits 100ms between requests (rate limiting)
- **Total time: 15-30 seconds**

### No venues found for Osaka

Check the response - it might be under different district names:
- "Osaka" (generic)
- "Namba"
- "Dotonbori"
- "Chuo" (Osaka Chuo ward)

## Re-seeding

Want to refresh the data?

### Add More Venues

Just run the seed command again - it won't duplicate existing venues:

```bash
npm run seed:all
```

### Clear and Re-seed

```bash
# Delete all venues
npx wrangler d1 execute tokyo2025-db --remote \
  --command "DELETE FROM venues"

# Seed fresh data
npm run seed:all
```

## Cost Information

**Google Places API Free Tier**: $200/month credit

**Cost per seeding run**:
- ~12 text searches × $0.032 = $0.38
- ~60 place details × $0.017 = $1.02
- **Total: ~$1.40 per run**

**Tip**: Seed once, enjoy forever! Only re-seed when you want fresh data.

## Next Steps

Now that your database is populated:

1. **Test the Chat**:
   ```
   Ask: "Where should I shop in Ginza?"
   Ask: "Best street food in Osaka?"
   Ask: "Luxury department stores near me"
   ```

2. **Add Custom Venues**:
   ```bash
   npx wrangler d1 execute tokyo2025-db --remote --file custom-venues.sql
   ```

3. **Build More Features**:
   - User favorites
   - Trip planning
   - Reservations
   - Photo sharing

## Support

**Detailed Documentation**:
- [SECRETS.md](SECRETS.md) - Complete secrets management guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment instructions
- [README.md](README.md) - Project overview

**Issues**:
- Google Places API: [Google Cloud Support](https://cloud.google.com/support)
- Project bugs: [GitHub Issues](https://github.com/jmbish04/tokyo2025/issues)

---

**Time to complete**: ~5 minutes
**Cost**: $1.40 per seeding (Free tier: $200 credit)
**Result**: 25-30 real venues with ratings and maps!

Happy exploring Ginza and Osaka! 🗼🛍️🍜
