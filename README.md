# 🗼 Tokyo 2025 Travel Companion

AI-powered travel assistant for exploring Tokyo, built on Cloudflare Workers with Next.js 14.

## ✨ Features

### 🤖 Multi-Model AI Chat
- **6 AI Models**: Choose from Workers AI, OpenAI (GPT-4, GPT-3.5), or Google Gemini (1.5 Pro, 1.5 Flash)
- **Streaming Responses**: Real-time AI responses with Vercel AI SDK
- **Chat History**: Persistent conversations stored in D1 with full history
- **Tool Calling**: AI can invoke weather, subway, and venue search tools
- **Model Switching**: Change AI models mid-conversation

### 📸 Image Analysis
- **Upload Photos**: Cloudflare Images integration with automatic optimization
- **AI Vision**: Analyze images with GPT-4 Vision or Gemini 1.5 Pro
- **Auto-Identification**: Identify restaurants, landmarks, and venues from photos
- **Image Transformations**: Resize, crop, blur, and apply filters on-the-fly
- **Chat Integration**: Upload and analyze images directly in conversations

### 🎨 Generative UI Components
- **Weather Cards**: Real-time weather data with visual displays
- **Subway Maps**: Interactive Tokyo Metro route visualization
- **Attraction Cards**: Rich venue cards with ratings, hours, and photos
- **Dynamic Rendering**: AI-generated UI components based on context

### 🗺️ Venue Management
- **Auto-Seeding**: Populate database from Google Places API
- **Manual Entry**: Add venues through web interface
- **Smart Search**: AI-powered venue search and recommendations
- **Database Preview**: View and manage venue collection
- **Ginza & Osaka Focus**: Pre-configured categories and districts

### 💬 Advanced Chat Features
- **Conversation Management**: Create, list, and delete chat sessions
- **Message Count**: Track conversation length and activity
- **Sidebar History**: Quick access to recent conversations
- **Auto-Save**: Messages automatically persisted to database
- **Export Ready**: Structured data for conversation export

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Runtime**: Cloudflare Workers (Edge)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare KV, Cloudflare Images
- **AI SDKs**: Vercel AI SDK, OpenAI SDK, Google AI SDK
- **AI Models**:
  - Workers AI (@cf/openai/gpt-4o-mini, @cf/meta/llama-3.1-8b-instruct)
  - OpenAI (gpt-4-turbo, gpt-3.5-turbo)
  - Google Gemini (gemini-1.5-pro, gemini-1.5-flash)
- **UI**: React Server Components, Streaming
- **Styling**: CSS-in-JS with CSS variables
- **Deployment**: Cloudflare Workers with CI/CD

## 🌐 Pages & Routes

### User-Facing Pages
- `/` - Home page with feature overview and navigation
- `/chat` - Advanced AI chat interface with multi-model support
- `/seed` - Venue management (auto-seed and manual entry)

### API Routes

#### Chat & AI
- `POST /api/ai-chat` - Streaming chat with tool calling
- `GET /api/ai-chat?chatId={id}` - Get chat messages
- `GET /api/chats` - List all conversations
- `POST /api/chats` - Create new conversation
- `PATCH /api/chats` - Update conversation
- `DELETE /api/chats?chatId={id}` - Delete conversation

#### Images
- `POST /api/images/upload` - Upload to Cloudflare Images
- `POST /api/images/analyze` - AI vision analysis (GPT-4/Gemini)
- `GET /api/images/transform` - Get transformed image URL
- `GET /api/images/upload?imageId={id}` - Get image details
- `DELETE /api/images/upload?imageId={id}` - Delete image

#### Venues
- `GET /api/venues` - Search and list venues
- `POST /api/venues` - Add manual venue
- `DELETE /api/venues?id={id}` - Delete venue

#### Utilities
- `POST /api/seed` - Auto-seed from Google Places
- `POST /api/chat` - Legacy simple chat endpoint
- `POST /api/upload` - Legacy file upload

## Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account
- Wrangler CLI

## 🔑 API Keys & Configuration

### Required for Production
- **Cloudflare Account** - For Workers, D1, KV, and Images

### Optional (Enable specific features)
- **OpenAI API Key** - For GPT-4 and GPT-3.5 Turbo models ([Get key](https://platform.openai.com))
- **Google API Key** - For Gemini 1.5 Pro/Flash models ([Get key](https://aistudio.google.com/app/apikey))
- **Cloudflare Images** - Account ID and API Token ([Dashboard](https://dash.cloudflare.com))
- **Google Places API** - For auto-seeding venues ([Console](https://console.cloud.google.com))

### Local Development

Copy `.dev.vars.example` to `.dev.vars`:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and add your API keys:

```bash
# AI Provider Keys (optional - enables specific models)
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...

# Cloudflare Images (optional - enables image upload/analysis)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Google Places (optional - enables auto-seeding)
GOOGLE_PLACES_API_KEY=AIza...
```

### Production Secrets

Set production secrets using Wrangler:

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put GOOGLE_API_KEY
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put GOOGLE_PLACES_API_KEY
```

**Note:** Workers AI is always available (no API key needed) and is the default model.

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

## 📁 Project Structure

```
tokyo2025/
├── public/              # Static assets
│   └── styles.css
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx     # Home page
│   │   ├── globals.css
│   │   ├── chat/        # Advanced AI chat interface
│   │   │   └── page.tsx
│   │   ├── seed/        # Venue management
│   │   │   └── page.tsx
│   │   └── api/         # API routes
│   │       ├── ai-chat/      # Streaming chat with tools
│   │       ├── chats/        # Conversation management
│   │       ├── images/       # Image upload & analysis
│   │       │   ├── upload/
│   │       │   ├── analyze/
│   │       │   └── transform/
│   │       ├── venues/       # Venue CRUD
│   │       ├── seed/         # Auto-seeding
│   │       ├── chat/         # Legacy chat
│   │       └── upload/       # Legacy upload
│   ├── components/      # React components
│   │   ├── generative/  # Generative UI components
│   │   │   ├── weather-card.tsx
│   │   │   ├── subway-map.tsx
│   │   │   └── attraction-card.tsx
│   │   └── image-upload.tsx
│   ├── lib/             # Utilities and configs
│   │   ├── ai-config.ts      # Multi-model configuration
│   │   ├── ai-provider.ts    # AI model factory
│   │   └── chat-history.ts   # Chat persistence layer
│   └── worker.ts        # Cloudflare Worker entry point
├── migrations/          # D1 database migrations
│   ├── 001_init.sql     # Venues and logs tables
│   ├── 002_seed.sql     # Initial venue data
│   └── 003_chat_history.sql  # Chat and messages tables
├── docs/                # Documentation
│   ├── CLOUDFLARE_IMAGES.md  # Image features guide
│   └── DEPLOYMENT_GUIDE.md   # Production deployment
├── wrangler.toml        # Cloudflare configuration
├── package.json
├── tsconfig.json
└── next.config.js
```

## 📚 Documentation

Comprehensive guides for all features:

- **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Complete production deployment guide
  - Environment setup and secrets
  - Database migrations
  - Custom domains
  - Monitoring and optimization
  - Troubleshooting

- **[CLOUDFLARE_IMAGES.md](docs/CLOUDFLARE_IMAGES.md)** - Image upload and AI vision analysis
  - Upload API documentation
  - Vision analysis with GPT-4/Gemini
  - Image transformations and filters
  - UI component usage
  - Best practices

- **[QUICKSTART_SEEDING.md](QUICKSTART_SEEDING.md)** - Auto-seed database with Google Places
  - Quick setup guide
  - Web interface usage
  - Command line options

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
