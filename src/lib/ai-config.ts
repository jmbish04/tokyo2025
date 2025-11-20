/**
 * AI Model Configuration
 * Supports multiple AI providers: Workers AI, OpenAI, and Google Gemini
 */

export type AIProvider = 'workers-ai' | 'openai' | 'gemini';

export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  capabilities: {
    chat: boolean;
    streaming: boolean;
    vision: boolean;
    reasoning: boolean;
    imageGeneration?: boolean;
  };
  maxTokens?: number;
}

export const AI_MODELS: Record<string, ModelConfig> = {
  // Cloudflare Workers AI (Default)
  'workers-ai-reasoning': {
    id: '@cf/openai/gpt-4o-mini',
    name: 'GPT-4o Mini (Workers AI)',
    provider: 'workers-ai',
    description: 'Fast reasoning model optimized for complex queries',
    capabilities: {
      chat: true,
      streaming: true,
      vision: false,
      reasoning: true,
    },
    maxTokens: 4096,
  },
  'workers-ai-llama': {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B (Workers AI)',
    provider: 'workers-ai',
    description: 'Open source model, great for general conversations',
    capabilities: {
      chat: true,
      streaming: true,
      vision: false,
      reasoning: false,
    },
    maxTokens: 8192,
  },

  // OpenAI
  'openai-gpt4': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Most capable OpenAI model with vision support',
    capabilities: {
      chat: true,
      streaming: true,
      vision: true,
      reasoning: true,
    },
    maxTokens: 4096,
  },
  'openai-gpt35': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast and cost-effective',
    capabilities: {
      chat: true,
      streaming: true,
      vision: false,
      reasoning: false,
    },
    maxTokens: 4096,
  },

  // Google Gemini
  'gemini-pro': {
    id: 'gemini-2.5-pro-latest',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    description: 'Most advanced Gemini model with superior reasoning and multimodal capabilities',
    capabilities: {
      chat: true,
      streaming: true,
      vision: true,
      reasoning: true,
    },
    maxTokens: 8192,
  },
  'gemini-flash': {
    id: 'gemini-2.5-flash-latest',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    description: 'Fast and efficient Gemini 2.5 model optimized for speed',
    capabilities: {
      chat: true,
      streaming: true,
      vision: true,
      reasoning: true,
    },
    maxTokens: 8192,
  },
};

export const DEFAULT_MODEL = 'workers-ai-reasoning';

export function getModelConfig(modelId: string): ModelConfig {
  return AI_MODELS[modelId] || AI_MODELS[DEFAULT_MODEL];
}

export function getModelsByProvider(provider: AIProvider): ModelConfig[] {
  return Object.values(AI_MODELS).filter(m => m.provider === provider);
}

export function getAllModels(): ModelConfig[] {
  return Object.values(AI_MODELS);
}
