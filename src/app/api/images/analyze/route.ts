import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

export const runtime = 'edge';

interface Env {
  OPENAI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
}

/**
 * POST /api/images/analyze - Analyze image with vision models
 */
export async function POST(request: NextRequest) {
  try {
    const env = process.env as unknown as Env;
    const body = await request.json();
    const {
      imageUrl,
      imageId,
      prompt = 'Analyze this image in the context of Tokyo travel. What do you see? Is this a restaurant, attraction, or venue? Provide details.',
      model = 'gpt-4-turbo',
    } = body;

    if (!imageUrl && !imageId) {
      return NextResponse.json(
        { error: 'Either imageUrl or imageId is required' },
        { status: 400 }
      );
    }

    // Determine which vision model to use
    let visionModel: any;
    let modelProvider: 'openai' | 'gemini';

    if (model.startsWith('gpt-4')) {
      if (!env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }
      visionModel = openai('gpt-4-turbo', { apiKey: env.OPENAI_API_KEY });
      modelProvider = 'openai';
    } else if (model.startsWith('gemini')) {
      if (!env.GOOGLE_API_KEY) {
        return NextResponse.json(
          { error: 'Google API key not configured' },
          { status: 500 }
        );
      }
      visionModel = google('gemini-1.5-pro-latest', { apiKey: env.GOOGLE_API_KEY });
      modelProvider = 'gemini';
    } else {
      return NextResponse.json(
        { error: 'Unsupported model. Use gpt-4-turbo or gemini-1.5-pro' },
        { status: 400 }
      );
    }

    // Construct the final image URL
    let finalImageUrl = imageUrl;
    if (imageId && env.CLOUDFLARE_ACCOUNT_ID) {
      // Use Cloudflare Images URL with imageId
      finalImageUrl = `https://imagedelivery.net/${env.CLOUDFLARE_ACCOUNT_ID}/${imageId}/public`;
    }

    if (!finalImageUrl) {
      return NextResponse.json(
        { error: 'Could not determine image URL' },
        { status: 400 }
      );
    }

    // Analyze image with vision model
    const result = await generateText({
      model: visionModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: finalImageUrl },
          ],
        },
      ],
      maxTokens: 1000,
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      analysis: result.text,
      model: model,
      imageUrl: finalImageUrl,
      usage: {
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      },
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Example request body:
 * {
 *   "imageUrl": "https://example.com/image.jpg",
 *   "prompt": "What Tokyo neighborhood is this? What can you tell me about it?",
 *   "model": "gpt-4-turbo"
 * }
 *
 * Or with Cloudflare Images:
 * {
 *   "imageId": "abc123-def456",
 *   "prompt": "Is this a good restaurant? What cuisine?",
 *   "model": "gemini-1.5-pro"
 * }
 */
