# 🗼 Tokyo 2025 Travel Companion

AI-powered travel assistant for exploring Tokyo, built on Cloudflare Workers with Next.js 14.

## Features

- **AI Chat Assistant**: Powered by Cloudflare Workers AI (Llama 3 8B)
- **Auto-Seeding**: Populate database with real venues from Google Places API
- **Venue Database**: Curated collection of Tokyo's best spots (D1 Database)
- **Ginza & Osaka Focus**: Pre-configured for luxury shopping in Ginza and street food in Osaka
- **Image Upload**: Store and analyze travel photos (Cloudflare Images)
- **Chat Memory**: Short-term (KV) and long-term (D1) conversation storage
- **Weather Maps**: AI-generated weather visualizations
- **Generative UI**: Dynamic venue cards, timelines, and maps

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Runtime**: Cloudflare Workers (Edge)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare KV
- **AI**: Cloudflare Workers AI
- **Deployment**: Cloudflare Workers

## Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account
- Wrangler CLI

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Authenticate with Cloudflare

```bash
npm run cf:login
```

### 3. Create Cloudflare Resources

```bash
# Create D1 database
npx wrangler d1 create tokyo2025-db

# Create KV namespace
npx wrangler kv:namespace create MEMORY

# Update wrangler.toml with the IDs returned from above commands
```

Update `wrangler.toml` with the database and KV namespace IDs:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tokyo2025-db"
database_id = "YOUR_DATABASE_ID"  # Replace with actual ID

[[kv_namespaces]]
binding = "MEMORY"
id = "YOUR_KV_ID"  # Replace with actual ID
```

### 4. Run Database Migrations

```bash
# For production
npm run db:migrate

# For local development
npm run db:migrate:local
```

### 5. Development

```bash
# Start Next.js dev server
npm run dev

# Or use Wrangler for full edge simulation
npx wrangler dev
```

### 6. Build and Deploy

```bash
# Build the project
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

### 7. Auto-Seed Venues (Optional but Recommended!)

Populate your database with real Ginza and Osaka venues from Google Places API.

#### Quick Setup (5 minutes)

1. **Get Google Places API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create project → Enable "Places API"
   - Create API Key

2. **Set Secret**:
   ```bash
   npx wrangler secret put GOOGLE_PLACES_API_KEY
   # Paste your key when prompted
   ```

3. **Seed Database**:

   **Option A: Web Interface (Easiest!)**
   ```bash
   npx wrangler dev
   # Visit http://localhost:8787/seed in your browser
   # Click "Start Seeding" - done!
   ```

   **Option B: Command Line**
   ```bash
   # Seed both Ginza and Osaka
   npm run seed:all

   # Or individually:
   npm run seed:ginza
   npm run seed:osaka
   ```

**Result**: 25-30 real venues with ratings, addresses, and map links!

**See**: [QUICKSTART_SEEDING.md](QUICKSTART_SEEDING.md) for detailed instructions.

## Project Structure

```
tokyo2025/
├── public/              # Static assets
│   ├── styles.css
│   └── icons/
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/         # API routes
│   │       ├── chat/
│   │       ├── upload/
│   │       ├── memory/
│   │       └── weather/
│   └── worker.ts        # Cloudflare Worker entry point
├── migrations/          # D1 database migrations
│   ├── 001_init.sql
│   └── 002_seed.sql
├── schema.sql           # Database schema
├── agents.md            # Agent architecture docs
├── wrangler.toml        # Cloudflare configuration
├── package.json
├── tsconfig.json
└── next.config.js
```

## API Endpoints

### POST /api/chat
Chat with the AI travel assistant.

**Request**:
```json
{
  "message": "Where can I find the best sushi in Tokyo?"
}
```

**Response**:
```json
{
  "response": "Here are the top sushi spots in Tokyo...",
  "venues": [
    {
      "id": 1,
      "name": "Tsukiji Outer Market",
      "category": "Seafood Market",
      "district": "Chuo",
      "description": "Historic market with fresh sushi...",
      "map_url": "https://maps.google.com/...",
      "rating": 4.8
    }
  ]
}
```

### POST /api/upload
Upload travel photos.

**Request**: FormData with image file

**Response**:
```json
{
  "success": true,
  "url": "https://imagedelivery.net/...",
  "analysis": "AI analysis of the image"
}
```

### GET /api/memory?limit=10
Retrieve conversation history.

**Response**:
```json
{
  "history": [...],
  "count": 10
}
```

### GET /api/weather?location=Tokyo
Get weather information and generated maps.

**Response**:
```json
{
  "weather": {
    "location": "Tokyo",
    "temperature": 18,
    "condition": "Partly Cloudy",
    "forecast": "Pleasant weather..."
  },
  "mapUrl": "..."
}
```

### POST /api/seed
Auto-seed database with real venues from Google Places API.

**Request**:
```json
{
  "areas": ["ginza", "osaka"]  // or ["ginza"] or ["osaka"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Seeded 27 venues in 18.34s",
  "results": {
    "ginza": 15,
    "osaka": 12,
    "total": 27
  },
  "stats": {
    "total": 33,
    "byCategory": [...],
    "byDistrict": [...]
  }
}
```

**Note**: Requires `GOOGLE_PLACES_API_KEY` secret to be set.

## Database Schema

### logs
```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  query TEXT,
  response TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### venues
```sql
CREATE TABLE venues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  category TEXT,
  district TEXT,
  description TEXT,
  map_url TEXT,
  rating REAL DEFAULT 0
);
```

## Development

### Local Testing

```bash
# Test with Wrangler local mode
npx wrangler dev --local

# Test D1 migrations locally
npx wrangler d1 migrations apply tokyo2025-db --local

# Execute SQL queries locally
npx wrangler d1 execute tokyo2025-db --local --command "SELECT * FROM venues"
```

### Environment Variables

Create a `.dev.vars` file for local development:

```env
# Add any API keys or secrets here
# These will be available as env variables in local dev
```

## Deployment

### Automated Deployment (GitHub Actions)

The project includes a CI/CD workflow that automatically deploys on push to main.

See `.github/workflows/deploy.yml` for configuration.

### Manual Deployment

```bash
# Deploy to production
npx wrangler deploy

# Deploy with specific environment
npx wrangler deploy --env production
```

### Post-Deployment

After deployment, update your bindings if needed:

```bash
# Check deployment status
npx wrangler deployments list

# View logs
npx wrangler tail
```

## Configuration

### wrangler.toml

Main configuration file for Cloudflare Workers:

- **D1 Database**: SQLite database for venues and logs
- **KV Namespace**: Key-value storage for chat memory
- **AI Binding**: Access to Cloudflare Workers AI
- **Assets**: Static file serving

### next.config.js

Next.js configuration optimized for Cloudflare Workers:

- Edge runtime enabled
- Image optimization disabled (use Cloudflare Images)
- Webpack configured for Workers environment

## Monitoring

### View Logs

```bash
npx wrangler tail
```

### Check Database

```bash
npx wrangler d1 execute tokyo2025-db --command "SELECT COUNT(*) FROM logs"
```

### Analytics

Access analytics in the Cloudflare dashboard:
- Request volume
- Response times
- Error rates
- AI model usage

## Troubleshooting

### Database Issues

```bash
# Reset database (WARNING: deletes all data)
npx wrangler d1 execute tokyo2025-db --command "DROP TABLE IF EXISTS logs; DROP TABLE IF EXISTS venues;"
npm run db:migrate
```

### KV Issues

```bash
# List KV namespaces
npx wrangler kv:namespace list

# List keys
npx wrangler kv:key list --namespace-id=YOUR_KV_ID
```

### Build Issues

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Deploy to preview: `npx wrangler deploy --env preview`
6. Submit a pull request

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [jmbish04/tokyo2025](https://github.com/jmbish04/tokyo2025/issues)
- Cloudflare Docs: [workers.cloudflare.com](https://workers.cloudflare.com)

## Roadmap

- [ ] Live web search integration
- [ ] Vision AI for image analysis
- [ ] Multi-language support (Japanese, English)
- [ ] Trip itinerary planning
- [ ] Real-time event updates
- [ ] AR navigation features
- [ ] Social sharing capabilities

---

Built with ❤️ using Cloudflare Workers and Next.js
