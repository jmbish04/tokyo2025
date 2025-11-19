import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import type { AIProvider } from './ai-config';

interface Env {
  AI: any;
  OPENAI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
}

/**
 * Get AI model instance based on provider and model ID
 */
export function getAIModel(provider: AIProvider, modelId: string, env: Env) {
  switch (provider) {
    case 'workers-ai':
      return {
        provider: 'workers-ai',
        modelId,
        binding: env.AI,
      };

    case 'openai':
      if (!env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }
      return openai(modelId, {
        apiKey: env.OPENAI_API_KEY,
      });

    case 'gemini':
      if (!env.GOOGLE_API_KEY) {
        throw new Error('Google API key not configured');
      }
      return google(modelId, {
        apiKey: env.GOOGLE_API_KEY,
      });

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * System prompt for Tokyo travel assistant
 */
export const TOKYO_SYSTEM_PROMPT = `You are an expert Tokyo travel assistant for 2025. You help travelers discover the best of Tokyo including:
- Food markets (Tsukiji, Toyosu)
- Luxury shopping (Ginza, Omotesando)
- Street food and nightlife (Shibuya, Shinjuku)
- Cultural attractions (temples, museums, parks)
- Hidden gems and local favorites

You have access to a database of curated venues and can provide specific recommendations with:
- Venue names, categories, and districts
- Ratings and descriptions
- Google Maps links
- Personalized suggestions based on user preferences

When appropriate, use generative UI components to enhance responses:
- Weather cards for weather-related queries
- Subway maps for transportation questions
- Attraction cards for venue recommendations
- Image galleries for visual content

Be conversational, helpful, and enthusiastic about Tokyo!`;
