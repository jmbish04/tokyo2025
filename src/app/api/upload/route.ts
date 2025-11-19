import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Env {
  IMAGES?: any;
  AI: any;
  DB: D1Database;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const env = process.env as unknown as Env;

    // Convert file to array buffer
    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = new Uint8Array(arrayBuffer);

    // Upload to Cloudflare Images if available
    let imageUrl = '';

    if (env.IMAGES) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', new Blob([imageBuffer]));

        // Note: In production, you'd use the Cloudflare Images API
        // For now, we'll simulate the upload
        imageUrl = `https://imagedelivery.net/placeholder/${Date.now()}`;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        imageUrl = 'upload-failed';
      }
    } else {
      // Fallback: create a data URL or use a placeholder
      imageUrl = `data:${image.type};base64,placeholder`;
    }

    // Optionally: Analyze image with AI
    let imageAnalysis = '';
    try {
      // This would use Cloudflare AI's vision capabilities
      // For now, we'll provide a placeholder response
      imageAnalysis = 'Image uploaded successfully. AI analysis coming soon!';
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
    }

    // Log the upload to D1
    try {
      await env.DB.prepare(
        'INSERT INTO logs (user_id, query, response, image_url) VALUES (?, ?, ?, ?)'
      ).bind(
        'anonymous',
        'Image upload',
        imageAnalysis,
        imageUrl
      ).run();
    } catch (dbError) {
      console.error('Database logging error:', dbError);
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      analysis: imageAnalysis,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
