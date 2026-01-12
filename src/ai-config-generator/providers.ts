/**
 * AI Provider configurations and metadata
 */

import type { AIProvider, ProviderInfo, AIProviderConfig } from "../types.js";

/**
 * Default models for each AI provider
 */
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  grok: "grok-2",
};

/**
 * Information about each AI provider
 */
export const PROVIDER_INFO: Record<AIProvider, ProviderInfo> = {
  anthropic: {
    name: "Anthropic Claude",
    description: "Claude 3 family of models - excellent reasoning and analysis",
    website: "https://www.anthropic.com",
    requiresApiKey: true,
    models: ["claude-opus-4-1", "claude-sonnet-4-20250514", "claude-haiku-3-5"],
    pricing: "Pay-as-you-go",
    setupUrl: "https://console.anthropic.com/",
  },
  openai: {
    name: "OpenAI GPT",
    description: "GPT-4 and GPT-4o models - state-of-the-art performance",
    website: "https://openai.com",
    requiresApiKey: true,
    models: ["gpt-4o", "gpt-4-turbo", "gpt-4"],
    pricing: "Pay-as-you-go",
    setupUrl: "https://platform.openai.com/account/api-keys",
  },
  gemini: {
    name: "Google Gemini",
    description: "Google's multimodal AI model - fast and capable",
    website: "https://ai.google.dev",
    requiresApiKey: true,
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    pricing: "Free tier + paid",
    setupUrl: "https://ai.google.dev/",
  },
  grok: {
    name: "xAI Grok",
    description: "Grok - X's AI model with real-time knowledge",
    website: "https://x.ai",
    requiresApiKey: true,
    models: ["grok-2", "grok-vision-beta"],
    pricing: "Pay-as-you-go",
    setupUrl: "https://console.x.ai/",
  },
};

/**
 * API configuration for each provider
 */
interface ProviderApiConfig {
  getEndpoint: (model: string, apiKey: string) => string;
  getHeaders: (apiKey: string) => Record<string, string>;
  buildBody: (model: string, systemPrompt: string, userPrompt: string) => object;
  extractResponse: (result: Record<string, unknown>) => string;
  errorPrefix: string;
}

const PROVIDER_API_CONFIGS: Record<AIProvider, ProviderApiConfig> = {
  anthropic: {
    getEndpoint: () => "https://api.anthropic.com/v1/messages",
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
    buildBody: (model, systemPrompt, userPrompt) => ({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
    extractResponse: (result) =>
      (result as { content: Array<{ text: string }> }).content[0]!.text,
    errorPrefix: "Anthropic",
  },
  openai: {
    getEndpoint: () => "https://api.openai.com/v1/chat/completions",
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildBody: (model, systemPrompt, userPrompt) => ({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    }),
    extractResponse: (result) =>
      (result as { choices: Array<{ message: { content: string } }> }).choices[0]!
        .message.content,
    errorPrefix: "OpenAI",
  },
  gemini: {
    getEndpoint: (model, apiKey) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    getHeaders: () => ({ "Content-Type": "application/json" }),
    buildBody: (_model, systemPrompt, userPrompt) => ({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
    extractResponse: (result) =>
      (
        result as {
          candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
        }
      ).candidates[0]!.content.parts[0]!.text,
    errorPrefix: "Gemini",
  },
  grok: {
    getEndpoint: () => "https://api.x.ai/v1/chat/completions",
    getHeaders: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    buildBody: (model, systemPrompt, userPrompt) => ({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    }),
    extractResponse: (result) =>
      (result as { choices: Array<{ message: { content: string } }> }).choices[0]!
        .message.content,
    errorPrefix: "Grok",
  },
};

/**
 * Call an AI provider's API with unified error handling
 */
export async function callAIProvider(
  provider: AIProvider,
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const providerConfig = PROVIDER_API_CONFIGS[provider];
  const model = config.model || DEFAULT_MODELS[provider];

  const response = await fetch(
    providerConfig.getEndpoint(model, config.apiKey),
    {
      method: "POST",
      headers: providerConfig.getHeaders(config.apiKey),
      body: JSON.stringify(
        providerConfig.buildBody(model, systemPrompt, userPrompt)
      ),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `${providerConfig.errorPrefix} API error: ${response.status} - ${error}`
    );
  }

  const result = await response.json();
  return providerConfig.extractResponse(result);
}

/**
 * Get the default model for a provider
 */
export function getDefaultModel(provider: AIProvider): string {
  return DEFAULT_MODELS[provider];
}

/**
 * Get all supported providers
 */
export function getSupportedProviders(): AIProvider[] {
  return ["anthropic", "openai", "gemini", "grok"];
}
