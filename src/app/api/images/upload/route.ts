import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Env {
  CLOUDFLARE_ACCOUNT_ID: { get: () => Promise<string> };
  CLOUDFLARE_API_TOKEN: { get: () => Promise<string> };
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
 * POST /api/images/upload - Upload image to Cloudflare Images
 */
export async function POST(request: NextRequest) {
  try {
    // Get env from globalThis (set by worker.ts)
    const env = (globalThis as any).env as Env;

    // Retrieve secrets from Secrets Store
    const { accountId, apiToken } = await getSecretsWithLogging(env);

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: 'Cloudflare Images not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB for Cloudflare Images)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Get optional metadata
    const metadata = formData.get('metadata') as string | null;
    const requireSignedURLs = formData.get('requireSignedURLs') === 'true';

    // Prepare upload to Cloudflare Images
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    if (metadata) {
      uploadFormData.append('metadata', metadata);
    }

    if (requireSignedURLs) {
      uploadFormData.append('requireSignedURLs', 'true');
    }

    // Upload to Cloudflare Images
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('Cloudflare Images upload failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to upload image', details: errorData },
        { status: uploadResponse.status }
      );
    }

    const data = await uploadResponse.json();

    if (!data.success) {
      return NextResponse.json(
        { error: 'Upload failed', details: data.errors },
        { status: 400 }
      );
    }

    // Return image details
    return NextResponse.json({
      success: true,
      image: {
        id: data.result.id,
        filename: data.result.filename,
        uploaded: data.result.uploaded,
        requireSignedURLs: data.result.requireSignedURLs,
        variants: data.result.variants,
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/images/upload - Get image by ID
 */
export async function GET(request: NextRequest) {
  try {
    const env = (globalThis as any).env as Env;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // Retrieve secrets from Secrets Store
    const { accountId, apiToken } = await getSecretsWithLogging(env);

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: 'Cloudflare Images not configured' },
        { status: 500 }
      );
    }

    // Get image details from Cloudflare Images
    const imageUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`;
    const imageResponse = await fetch(imageUrl, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: imageResponse.status }
      );
    }

    const data = await imageResponse.json();

    if (!data.success) {
      return NextResponse.json(
        { error: 'Failed to get image', details: data.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      image: data.result,
    });
  } catch (error) {
    console.error('Get image error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/images/upload - Delete image
 */
export async function DELETE(request: NextRequest) {
  try {
    const env = (globalThis as any).env as Env;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // Retrieve secrets from Secrets Store
    const { accountId, apiToken } = await getSecretsWithLogging(env);

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: 'Cloudflare Images not configured' },
        { status: 500 }
      );
    }

    // Delete image from Cloudflare Images
    const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`;
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!deleteResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: deleteResponse.status }
      );
    }

    const data = await deleteResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
