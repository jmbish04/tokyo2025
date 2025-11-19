# Tokyo 2025 Travel Companion - Agent Architecture

## Overview

The Tokyo 2025 Travel Companion is an AI-powered travel assistant built on Cloudflare Workers, leveraging multiple Cloudflare services to provide intelligent, context-aware travel recommendations for Tokyo.

## Core AI

### Model
- **Primary**: `@cf/meta/llama-3-8b-instruct`
- **Runtime**: Cloudflare Workers AI
- **Fallback**: Context-based responses using venue database

### Capabilities
- Natural language understanding of travel queries
- Contextual recommendations based on user preferences
- Multi-turn conversations with memory
- Image analysis (future enhancement)

## Tools & Bindings

### queryD1(sql)
Run SQL queries against the D1 database to retrieve venue information, logs, and structured data.

**Usage**:
```typescript
const results = await env.DB.prepare('SELECT * FROM venues WHERE category = ?')
  .bind('Seafood Market')
  .all();
```

### kvGet / kvPut
Use KV namespace for short-term chat memory and session data.

**Usage**:
```typescript
// Store
await env.MEMORY.put(key, JSON.stringify(data), { expirationTtl: 86400 });

// Retrieve
const data = await env.MEMORY.get(key, 'json');
```

### browser.search(query)
Enrich responses with live web information (future enhancement).

**Usage**:
```typescript
const searchResults = await env.BROWSER.search('best sushi in Tokyo 2025');
```

### images.upload(blob)
Store traveler photos in Cloudflare Images.

**Usage**:
```typescript
const uploadResult = await fetch('https://api.cloudflare.com/client/v4/accounts/{account_id}/images/v1', {
  method: 'POST',
  body: formData,
});
```

### generateWeatherMap(location)
Render weather map overlay images using generative AI.

**Usage**:
```typescript
const mapImage = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
  prompt: `Weather map of ${location}`,
});
```

## Memory Flow

### 1. Short-term Memory (KV)
- Stores conversation context for 24 hours
- Enables multi-turn conversations
- Quick access for recent interactions

### 2. Long-term Storage (D1)
- Logs all interactions in the `logs` table
- Persistent venue database
- Analytics and user preference tracking

### 3. Context Building
1. User asks about Tokyo
2. System retrieves relevant venues from D1
3. Builds context from venue data
4. Queries AI with enriched context
5. Returns personalized recommendations

## Generative UI Components

### WeatherMap
AI-generated weather overlay images showing current conditions and forecasts.

**Implementation**:
```tsx
<WeatherMap location="Tokyo" condition="partly-cloudy" />
```

### VenueCard
Dynamic cards displaying venue information from D1 database.

**Data Flow**:
```
D1 Query → Venue Data → React Component → Rendered Card
```

### MemoryTimeline
Visual timeline of past conversations and visited places.

**Features**:
- Chronological display
- Image attachments
- Venue associations

## Lifecycle

### Request Flow
```
User Input
    ↓
Next.js API Route (/api/chat)
    ↓
Context Enrichment (D1 Query)
    ↓
AI Processing (Cloudflare AI)
    ↓
Response Generation
    ↓
Logging (D1 + KV)
    ↓
UI Rendering (React)
```

### 1. User Query
User submits a question about Tokyo via the chat interface.

### 2. Context Gathering
- Search D1 for relevant venues
- Retrieve recent conversation history from KV
- Build enriched context

### 3. AI Processing
- Combine context with user query
- Call Cloudflare Workers AI
- Generate personalized response

### 4. Response Assembly
- Format AI response
- Attach relevant venue cards
- Include map links

### 5. Persistence
- Log interaction to D1
- Store in KV for session memory
- Update user preferences

## Database Schema

### logs
Tracks all user interactions.

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
Stores Tokyo venues and attractions.

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

## API Endpoints

### POST /api/chat
Main conversation endpoint.

**Request**:
```json
{
  "message": "Where can I find the best sushi in Tokyo?"
}
```

**Response**:
```json
{
  "response": "Here are the top sushi spots...",
  "venues": [...]
}
```

### POST /api/upload
Image upload and analysis.

**Request**: FormData with image file

**Response**:
```json
{
  "url": "https://imagedelivery.net/...",
  "analysis": "AI analysis of the image"
}
```

### GET /api/memory
Retrieve conversation history.

**Query Params**:
- `limit`: Number of entries (default: 10)

**Response**:
```json
{
  "history": [...],
  "count": 10
}
```

### GET /api/weather
Get weather information and maps.

**Query Params**:
- `location`: Location name (default: Tokyo)

**Response**:
```json
{
  "weather": {...},
  "mapUrl": "..."
}
```

## Future Enhancements

1. **Live Web Search**: Integrate browser API for real-time information
2. **Vision AI**: Analyze uploaded images of landmarks, food, etc.
3. **Personalization**: Learn user preferences over time
4. **Multi-language**: Support Japanese, English, and other languages
5. **Trip Planning**: Create and save multi-day itineraries
6. **Real-time Updates**: Events, crowd levels, wait times
7. **AR Features**: Augmented reality navigation and information overlays

## Performance Considerations

- **Edge Computing**: All requests served from Cloudflare's global network
- **D1 Queries**: Optimized with indexes on frequently queried fields
- **KV Caching**: Reduce database load for frequently accessed data
- **AI Response Time**: ~1-2 seconds with Llama 3 8B
- **Static Assets**: Cached at edge locations worldwide

## Security

- Input validation on all API endpoints
- Rate limiting on chat and upload endpoints
- SQL injection prevention with prepared statements
- CORS headers configured for production domain
- Environment variables for sensitive data

## Monitoring

- Log all errors to Cloudflare Analytics
- Track API response times
- Monitor D1 query performance
- Alert on AI service failures

---

**Version**: 1.0.0
**Last Updated**: 2025-11-19
**Built with**: Cloudflare Workers, Next.js 14, D1, KV, Workers AI
