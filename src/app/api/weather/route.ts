import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Env {
  AI: any;
}

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  forecast: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || 'Tokyo';

    const env = process.env as unknown as Env;

    // In production, you'd fetch real weather data from an API
    // For now, we'll return mock data and generate a weather map image

    const weatherData: WeatherData = {
      location,
      temperature: 18,
      condition: 'Partly Cloudy',
      forecast: 'Pleasant weather expected. Perfect for exploring outdoor markets and shrines!',
    };

    // Generate weather map using AI (simulated)
    let mapImageUrl = '';
    try {
      // This would use Cloudflare AI's image generation
      // const imageResult = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      //   prompt: `Weather map of ${location}, showing ${weatherData.condition.toLowerCase()} conditions`,
      // });

      // For now, use a placeholder
      mapImageUrl = `https://via.placeholder.com/800x400?text=Weather+Map+${location}`;
    } catch (aiError) {
      console.error('AI image generation error:', aiError);
    }

    return NextResponse.json({
      weather: weatherData,
      mapUrl: mapImageUrl,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to get weather data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { location, generateMap } = (await request.json()) as {
      location: string;
      generateMap?: boolean;
    };

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    const env = process.env as unknown as Env;

    // Mock weather data
    const weatherData: WeatherData = {
      location,
      temperature: Math.floor(Math.random() * 15) + 10, // 10-25°C
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
      forecast: 'Check back for detailed forecast information.',
    };

    let mapImageUrl = '';

    if (generateMap) {
      // Generate AI-powered weather map overlay
      try {
        // Placeholder for AI image generation
        mapImageUrl = `https://via.placeholder.com/800x400?text=AI+Weather+Map+${location}`;
      } catch (aiError) {
        console.error('Map generation error:', aiError);
      }
    }

    return NextResponse.json({
      weather: weatherData,
      mapUrl: mapImageUrl,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Weather POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate weather data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
