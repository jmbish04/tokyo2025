# Cloudflare Images Integration

Complete guide to using image upload, analysis, and transformation features in Tokyo 2025 Travel Companion.

## Features

- 📸 **Image Upload** - Upload images to Cloudflare Images with automatic optimization
- 🔍 **AI Vision Analysis** - Analyze images with GPT-4 Vision or Gemini 1.5 Pro
- 🎨 **Image Transformations** - Resize, crop, blur, and apply filters on-the-fly
- 💬 **Chat Integration** - Upload and analyze images directly in the AI chat interface

## Configuration

### Environment Variables

Add these to your `.dev.vars` file for local development:

```bash
# Cloudflare Images credentials
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# AI provider keys for vision models
OPENAI_API_KEY=your_openai_key      # For GPT-4 Vision
GOOGLE_API_KEY=your_google_key      # For Gemini 1.5 Pro
```

### Getting Cloudflare Images Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Account** → **Images**
3. Your Account ID is shown on the page
4. Create an API Token with "Cloudflare Images" permissions

### Production Secrets

Set production environment variables using Wrangler:

```bash
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put GOOGLE_API_KEY
```

## API Endpoints

### 1. Upload Image

**Endpoint:** `POST /api/images/upload`

Upload an image to Cloudflare Images.

**Request:**
```typescript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('metadata', JSON.stringify({ location: 'Tokyo' })); // optional
formData.append('requireSignedURLs', 'false'); // optional

const response = await fetch('/api/images/upload', {
  method: 'POST',
  body: formData,
});
```

**Response:**
```json
{
  "success": true,
  "image": {
    "id": "abc123-def456",
    "filename": "tokyo-street.jpg",
    "uploaded": "2025-01-15T10:30:00Z",
    "requireSignedURLs": false,
    "variants": [
      "https://imagedelivery.net/account-id/image-id/public",
      "https://imagedelivery.net/account-id/image-id/thumbnail"
    ]
  }
}
```

**Validation:**
- Max file size: 10MB
- Accepted types: image/* (JPEG, PNG, GIF, WebP, etc.)

### 2. Analyze Image with AI

**Endpoint:** `POST /api/images/analyze`

Analyze an image using GPT-4 Vision or Gemini 1.5 Pro.

**Request:**
```typescript
const response = await fetch('/api/images/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageId: 'abc123-def456',  // Or use imageUrl
    prompt: 'What Tokyo neighborhood is this? What can you tell me about it?',
    model: 'gpt-4-turbo'  // or 'gemini-1.5-pro'
  }),
});
```

**Response:**
```json
{
  "success": true,
  "analysis": "This appears to be Shibuya Crossing in Tokyo...",
  "model": "gpt-4-turbo",
  "imageUrl": "https://imagedelivery.net/...",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 200,
    "totalTokens": 350
  }
}
```

**Supported Models:**
- `gpt-4-turbo` - OpenAI GPT-4 with vision (most detailed)
- `gemini-1.5-pro` - Google Gemini 1.5 Pro (fast, multimodal)

### 3. Transform Image

**Endpoint:** `GET /api/images/transform`

Get a transformed version of an uploaded image.

**Request:**
```typescript
const params = new URLSearchParams({
  imageId: 'abc123-def456',
  width: '800',
  height: '600',
  fit: 'cover',
  quality: '85',
  blur: '5',  // optional
});

const response = await fetch(`/api/images/transform?${params}`);
```

**Response:**
```json
{
  "success": true,
  "imageId": "abc123-def456",
  "url": "https://imagedelivery.net/account-id/image-id/public?width=800&height=600&fit=cover&quality=85",
  "options": {
    "width": 800,
    "height": 600,
    "fit": "cover",
    "quality": 85
  }
}
```

**Transform Options:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `width` | number | Target width in pixels | - |
| `height` | number | Target height in pixels | - |
| `fit` | string | Resize mode: `scale-down`, `contain`, `cover`, `crop`, `pad` | `scale-down` |
| `quality` | number | JPEG/WebP quality (1-100) | 85 |
| `format` | string | Output format: `auto`, `avif`, `webp`, `json` | `auto` |
| `blur` | number | Blur radius (1-250) | - |
| `sharpen` | number | Sharpen amount (0-10) | - |
| `brightness` | number | Brightness (0-2, 1=default) | 1 |
| `contrast` | number | Contrast (0-2, 1=default) | 1 |
| `gamma` | number | Gamma correction (0-3, 1=default) | 1 |
| `rotate` | number | Rotation: `0`, `90`, `180`, `270` | 0 |

### 4. Get Image Details

**Endpoint:** `GET /api/images/upload?imageId={id}`

Retrieve metadata for an uploaded image.

### 5. Delete Image

**Endpoint:** `DELETE /api/images/upload?imageId={id}`

Permanently delete an uploaded image.

## UI Components

### ImageUpload Component

Use the pre-built `ImageUpload` component in your React pages:

```tsx
import { ImageUpload } from '@/components/image-upload';

function MyPage() {
  const handleImageUploaded = (imageUrl: string, imageId: string, analysis?: string) => {
    console.log('Image uploaded:', imageUrl);
    console.log('AI analysis:', analysis);
  };

  return (
    <ImageUpload
      onImageUploaded={handleImageUploaded}
      showAnalysis={true}
      analysisModel="gpt-4-turbo"
      analysisPrompt="What do you see in this Tokyo image?"
      maxSizeMB={10}
    />
  );
}
```

**Props:**

- `onImageUploaded` - Callback when image is uploaded
- `onError` - Callback when upload fails
- `showAnalysis` - Enable AI analysis (default: false)
- `analysisModel` - Which vision model to use (default: 'gpt-4-turbo')
- `analysisPrompt` - Custom prompt for analysis
- `buttonText` - Custom button text (default: '📸 Upload Image')
- `acceptedTypes` - File types (default: 'image/*')
- `maxSizeMB` - Max file size in MB (default: 10)

## Chat Integration

Images can be uploaded and analyzed directly in the `/chat` interface:

1. Click the **📸 Upload Image** button below the message input
2. Select an image file
3. AI automatically analyzes the image
4. Analysis is added to your chat input
5. Send the message to continue the conversation with context

## Use Cases

### 1. Restaurant Identification

Upload a photo of a restaurant sign or menu:
```typescript
const response = await fetch('/api/images/analyze', {
  method: 'POST',
  body: JSON.stringify({
    imageId: 'restaurant-photo',
    prompt: 'What restaurant is this? What type of cuisine? Any menu recommendations?',
    model: 'gpt-4-turbo',
  }),
});
```

### 2. Location Recognition

Upload a photo of a Tokyo landmark:
```typescript
const response = await fetch('/api/images/analyze', {
  method: 'POST',
  body: JSON.stringify({
    imageId: 'landmark-photo',
    prompt: 'Where is this in Tokyo? What attractions are nearby?',
    model: 'gemini-1.5-pro',
  }),
});
```

### 3. Menu Translation

Upload a Japanese menu:
```typescript
const response = await fetch('/api/images/analyze', {
  method: 'POST',
  body: JSON.stringify({
    imageId: 'menu-photo',
    prompt: 'Translate this menu to English and recommend the best dishes.',
    model: 'gpt-4-turbo',
  }),
});
```

### 4. Image Optimization

Generate optimized thumbnails for venue photos:
```typescript
// Create thumbnail variant
const thumbnail = await fetch('/api/images/transform?imageId=venue-photo&width=300&height=300&fit=cover&quality=85');

// Create hero image variant
const hero = await fetch('/api/images/transform?imageId=venue-photo&width=1200&height=600&fit=cover&quality=90');
```

## Best Practices

### 1. Image Size Optimization

Always request appropriately sized images:

```typescript
// Thumbnail (list views)
width=300&height=300&fit=cover

// Card images (grid views)
width=600&height=400&fit=cover

// Hero images (detail pages)
width=1200&height=600&fit=cover

// Full resolution (lightbox)
width=2000&fit=scale-down
```

### 2. Format Selection

Use modern formats for better compression:

```typescript
// WebP for modern browsers (smaller file size)
format=webp&quality=85

// AVIF for cutting-edge compression
format=avif&quality=80

// Auto for best browser support
format=auto
```

### 3. Vision Model Selection

- **GPT-4 Turbo**: More detailed analysis, better for complex scenes, OCR, and detailed descriptions
- **Gemini 1.5 Pro**: Faster, good for general analysis, location recognition

### 4. Error Handling

Always handle upload and analysis errors:

```typescript
try {
  const response = await fetch('/api/images/upload', { method: 'POST', body: formData });

  if (!response.ok) {
    const error = await response.json();
    console.error('Upload failed:', error.details);
    alert(error.error);
    return;
  }

  const data = await response.json();
  // Process successful upload
} catch (err) {
  console.error('Network error:', err);
  alert('Failed to upload image. Please try again.');
}
```

## Pricing

### Cloudflare Images

- **Storage**: $5/month per 100,000 images stored
- **Delivery**: $1 per 100,000 images delivered
- **Free tier**: First 100,000 images delivered per month are free

### Vision Models

- **GPT-4 Turbo**: ~$0.01 per image analysis (varies by detail level)
- **Gemini 1.5 Pro**: ~$0.0025 per image analysis

## Limits

- **Upload size**: 10MB per image
- **Upload rate**: 1000 images per minute
- **Storage**: Unlimited images (subject to pricing)
- **Transformations**: Unlimited variants per image
- **Vision analysis**: Subject to API rate limits

## Troubleshooting

### Upload fails with "not configured"

**Solution:** Set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` environment variables.

### Vision analysis fails

**Solution:** Ensure `OPENAI_API_KEY` or `GOOGLE_API_KEY` is set, depending on the model.

### Images not loading

**Solution:** Check that the account ID in URLs matches your Cloudflare account.

### Transformation not applied

**Solution:** Verify the variant name exists or use URL parameters for on-the-fly transforms.

## Resources

- [Cloudflare Images Docs](https://developers.cloudflare.com/images/)
- [Transform Images](https://developers.cloudflare.com/images/transform-images/)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [Google Gemini Vision](https://ai.google.dev/gemini-api/docs/vision)
