import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Env {
  CLOUDFLARE_ACCOUNT_ID: { get: () => Promise<string> };
  CLOUDFLARE_API_TOKEN: { get: () => Promise<string> };
  ADMIN_API_KEY?: { get: () => Promise<string> };
}

/**
 * Simple admin authentication check
 * Returns true if authenticated, false otherwise
 */
async function isAuthenticated(request: NextRequest, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedKey = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Check against ADMIN_API_KEY if configured
  if (env.ADMIN_API_KEY) {
    try {
      const adminKey = await env.ADMIN_API_KEY.get();
      return providedKey === adminKey;
    } catch (err) {
      console.error('[AUTH] Failed to get ADMIN_API_KEY:', err);
      return false;
    }
  }

  // If no ADMIN_API_KEY configured, deny access (secure by default)
  console.warn('[AUTH] ADMIN_API_KEY not configured - denying access');
  return false;
}

interface TransformOptions {
  width?: number;
  height?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  gravity?: 'auto' | 'left' | 'right' | 'top' | 'bottom' | 'center';
  quality?: number; // 1-100
  format?: 'auto' | 'avif' | 'webp' | 'json';
  blur?: number; // 1-250
  sharpen?: number; // 0-10
  brightness?: number; // 0-2 (1 is default)
  contrast?: number; // 0-2 (1 is default)
  gamma?: number; // 0-3 (1 is default)
  metadata?: 'keep' | 'copyright' | 'none';
  rotate?: 0 | 90 | 180 | 270;
}

/**
 * Helper function to get secrets from Secrets Store
 */
async function getSecretsWithLogging(env: Env) {
  const accountId = await env.CLOUDFLARE_ACCOUNT_ID.get();
  const apiToken = await env.CLOUDFLARE_API_TOKEN.get();

  console.log('[DEBUG] CLOUDFLARE_ACCOUNT_ID loaded:', accountId ? `${accountId.substring(0, 4)}...` : 'UNDEFINED');
  console.log('[DEBUG] CLOUDFLARE_API_TOKEN loaded:', apiToken ? `${apiToken.substring(0, 4)}...` : 'UNDEFINED');

  return { accountId, apiToken };
}

/**
 * POST /api/images/transform - Create transformed variant of image
 * Requires admin authentication via Authorization: Bearer <ADMIN_API_KEY> header
 */
export async function POST(request: NextRequest) {
  try {
    const env = (globalThis as any).env as Env;

    // Authenticate admin user
    const authenticated = await isAuthenticated(request, env);
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageId, variantName, options } = body as {
      imageId: string;
      variantName: string;
      options: TransformOptions;
    };

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    if (!variantName) {
      return NextResponse.json({ error: 'Variant name required' }, { status: 400 });
    }

    // Retrieve secrets from Secrets Store
    const { accountId, apiToken } = await getSecretsWithLogging(env);

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: 'Cloudflare Images not configured' },
        { status: 500 }
      );
    }

    // Create variant configuration
    const variantConfig: any = {
      id: variantName,
      options: {
        fit: options.fit || 'scale-down',
        metadata: options.metadata || 'none',
      },
    };

    if (options.width) variantConfig.options.width = options.width;
    if (options.height) variantConfig.options.height = options.height;
    if (options.quality) variantConfig.options.quality = options.quality;
    if (options.format) variantConfig.options.format = options.format;

    // Create the variant
    const createVariantUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/variants`;
    const createResponse = await fetch(createVariantUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(variantConfig),
    });

    if (!createResponse.ok && createResponse.status !== 409) {
      // 409 means variant already exists, which is fine
      const errorData = await createResponse.json().catch(() => ({}));
      console.error('Variant creation failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to create variant', details: errorData },
        { status: createResponse.status }
      );
    }

    // Build transformed image URL
    const transformedUrl = buildTransformedUrl(
      accountId,
      imageId,
      variantName,
      options
    );

    return NextResponse.json({
      success: true,
      imageId,
      variantName,
      url: transformedUrl,
      options,
    });
  } catch (error) {
    console.error('Image transform error:', error);
    return NextResponse.json(
      {
        error: 'Failed to transform image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/images/transform - Get transformed image URL
 */
export async function GET(request: NextRequest) {
  try {
    const env = (globalThis as any).env as Env;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    const width = searchParams.get('width');
    const height = searchParams.get('height');
    const fit = searchParams.get('fit') as TransformOptions['fit'];
    const quality = searchParams.get('quality');
    const format = searchParams.get('format') as TransformOptions['format'];
    const blur = searchParams.get('blur');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // Retrieve account ID from Secrets Store
    const accountId = await env.CLOUDFLARE_ACCOUNT_ID.get();
    console.log('[DEBUG] CLOUDFLARE_ACCOUNT_ID loaded:', accountId ? `${accountId.substring(0, 4)}...` : 'UNDEFINED');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Cloudflare Images not configured' },
        { status: 500 }
      );
    }

    // Build transformation options
    const options: TransformOptions = {};
    if (width) options.width = parseInt(width);
    if (height) options.height = parseInt(height);
    if (fit) options.fit = fit;
    if (quality) options.quality = parseInt(quality);
    if (format) options.format = format;
    if (blur) options.blur = parseInt(blur);

    // Build URL with transformations
    const baseUrl = `https://imagedelivery.net/${accountId}/${imageId}`;
    const params = new URLSearchParams();

    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.fit) params.append('fit', options.fit);
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.format) params.append('format', options.format);
    if (options.blur) params.append('blur', options.blur.toString());

    const transformedUrl = params.toString()
      ? `${baseUrl}/public?${params.toString()}`
      : `${baseUrl}/public`;

    return NextResponse.json({
      success: true,
      imageId,
      url: transformedUrl,
      options,
    });
  } catch (error) {
    console.error('Get transform error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get transformed image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper to build transformed image URL
 */
function buildTransformedUrl(
  accountId: string,
  imageId: string,
  variant: string,
  options: TransformOptions
): string {
  const baseUrl = `https://imagedelivery.net/${accountId}/${imageId}/${variant}`;
  const params = new URLSearchParams();

  if (options.blur) params.append('blur', options.blur.toString());
  if (options.sharpen) params.append('sharpen', options.sharpen.toString());
  if (options.brightness) params.append('brightness', options.brightness.toString());
  if (options.contrast) params.append('contrast', options.contrast.toString());
  if (options.gamma) params.append('gamma', options.gamma.toString());
  if (options.rotate) params.append('rotate', options.rotate.toString());

  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}

/**
 * Example usage:
 *
 * POST /api/images/transform
 * {
 *   "imageId": "abc123",
 *   "variantName": "thumbnail",
 *   "options": {
 *     "width": 300,
 *     "height": 300,
 *     "fit": "cover",
 *     "quality": 85
 *   }
 * }
 *
 * GET /api/images/transform?imageId=abc123&width=800&height=600&fit=contain
 */
