# Auto-Seeding Quick Reference

One-page reference for seeding your Tokyo 2025 database with Ginza & Osaka venues.

## 🚀 Quick Start (3 Commands)

```bash
# 1. Set your API key
npx wrangler secret put GOOGLE_PLACES_API_KEY

# 2. Start worker
npx wrangler dev

# 3. Seed database
npm run seed:all
```

## 📋 All Commands

### Secret Management

```bash
# Set API key (production)
npx wrangler secret put GOOGLE_PLACES_API_KEY

# List secrets
npx wrangler secret list

# For local development, create .dev.vars:
echo "GOOGLE_PLACES_API_KEY=your_key_here" > .dev.vars
```

### Seeding

```bash
# Seed both Ginza and Osaka
npm run seed:all

# Seed only Ginza (luxury shopping)
npm run seed:ginza

# Seed only Osaka (street food)
npm run seed:osaka

# Check seeding status
npm run seed:status
```

### Database Queries

```bash
# Count venues
npm run db:query "SELECT COUNT(*) FROM venues"

# List Ginza venues
npm run db:query "SELECT name, category FROM venues WHERE district = 'Ginza'"

# List all districts
npm run db:query "SELECT DISTINCT district FROM venues"

# Get venue stats
npm run db:query "SELECT category, COUNT(*) as count FROM venues GROUP BY category"
```

## 📍 What Gets Seeded

### Ginza (Luxury Shopping District)
- **Department Stores**: Mitsukoshi, Ginza Six, Wako
- **Designer Boutiques**: Louis Vuitton, Hermès, Chanel
- **Restaurants**: High-end sushi, fine dining
- **Art & Culture**: Galleries, museums
- **Jewelry**: Luxury watch and jewelry stores

### Osaka (Street Food & Entertainment)
- **Dotonbori**: Takoyaki, okonomiyaki, street food
- **Namba**: Shopping, entertainment, nightlife
- **Shinsaibashi**: Fashion boutiques, shopping arcade
- **Kuromon Market**: Fresh seafood, local food
- **Cultural**: Osaka Castle area

## 🌐 API Endpoints

```bash
# Get seeding status
curl http://localhost:8787/api/seed

# Seed both areas
curl -X POST http://localhost:8787/api/seed \
  -H "Content-Type: application/json" \
  -d '{"areas": ["ginza", "osaka"]}'

# Seed Ginza only
curl -X POST http://localhost:8787/api/seed \
  -H "Content-Type: application/json" \
  -d '{"areas": ["ginza"]}'

# Seed Osaka only
curl -X POST http://localhost:8787/api/seed \
  -H "Content-Type: application/json" \
  -d '{"areas": ["osaka"]}'
```

## 📊 Expected Results

```
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

   By district:
      Ginza: 15
      Namba: 7
      Dotonbori: 5
```

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "API key required" | `npx wrangler secret put GOOGLE_PLACES_API_KEY` |
| "REQUEST_DENIED" | Enable Places API in Google Cloud Console |
| "OVER_QUERY_LIMIT" | You've hit API quota - wait or upgrade |
| Worker not responding | Start it: `npx wrangler dev` |
| No venues found | Check response for errors, verify API key |

## 💰 Cost

**Free Tier**: $200/month credit ≈ 40,000 requests

**Per seeding run**:
- Text searches: ~$0.38
- Place details: ~$1.02
- **Total: ~$1.40**

**Tip**: Seed once, query forever!

## 📚 Full Documentation

- [QUICKSTART_SEEDING.md](QUICKSTART_SEEDING.md) - Detailed 5-minute guide
- [SECRETS.md](SECRETS.md) - Complete secrets management
- [README.md](README.md) - Full project docs

## 🎯 Common Workflows

### First-Time Setup

```bash
# 1. Get API key from console.cloud.google.com
# 2. Set secret
npx wrangler secret put GOOGLE_PLACES_API_KEY

# 3. Deploy
npx wrangler deploy

# 4. Seed
curl -X POST https://YOUR-WORKER.workers.dev/api/seed \
  -d '{"areas": ["ginza", "osaka"]}'
```

### Local Development

```bash
# 1. Create .dev.vars
echo "GOOGLE_PLACES_API_KEY=your_key" > .dev.vars

# 2. Start worker
npx wrangler dev

# 3. Seed in another terminal
npm run seed:all
```

### Production Re-seeding

```bash
# Check current count
npm run db:query "SELECT COUNT(*) FROM venues"

# Clear if needed
npm run db:query "DELETE FROM venues"

# Re-seed
curl -X POST https://YOUR-WORKER.workers.dev/api/seed \
  -d '{"areas": ["ginza", "osaka"]}'
```

### Testing AI with Seeded Data

Ask your AI assistant:
- "Where should I shop in Ginza?"
- "Best street food in Osaka?"
- "Luxury department stores in Tokyo?"
- "Show me Dotonbori restaurants"
- "High-end sushi spots in Ginza"

## 🔗 Get Google Places API Key

1. **Go to**: https://console.cloud.google.com
2. **Create project**: "tokyo2025"
3. **Enable APIs**:
   - Places API ✓
   - Places API (New) ✓
4. **Create credentials**: API Key
5. **Restrict (optional)**:
   - API restrictions: Places API only
   - Application restrictions: HTTP referrers
6. **Copy key**: `AIzaSyC...`

## ⚡ Pro Tips

1. **Seed early**: Get real data before testing AI
2. **Re-seed sparingly**: ~$1.40 per run, data doesn't change often
3. **Check venue count**: `npm run db:query "SELECT COUNT(*) FROM venues"`
4. **Explore by district**: Query by Ginza, Namba, Dotonbori
5. **Add custom venues**: Insert your own favorites manually
6. **Backup before re-seed**: Export venues first if needed

---

**Need help?** See detailed guides:
- [QUICKSTART_SEEDING.md](QUICKSTART_SEEDING.md)
- [SECRETS.md](SECRETS.md)
- [GitHub Issues](https://github.com/jmbish04/tokyo2025/issues)
