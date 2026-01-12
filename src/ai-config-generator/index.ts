/**
 * AI-Powered Cache Config Generator
 *
 * Uses LLM to analyze GraphQL schema and generate optimal caching configuration.
 * Supports commercial providers: Anthropic, OpenAI, Gemini, and Grok.
 */

import type {
  AnalyzedSchema,
  ConfigPreferences,
  AIProviderConfig,
  OrionCacheConfig,
  AIConfigResponse,
} from "../types.js";

import { callAIProvider } from "./providers.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";
import { parseAIResponse } from "./response-parser.js";
import { convertToOrionConfig } from "./config-converter.js";

// Re-exports
export {
  PROVIDER_INFO,
  DEFAULT_MODELS,
  getDefaultModel,
  getSupportedProviders,
} from "./providers.js";
export { generateBasicConfig } from "./config-converter.js";

/**
 * Options for generating cache configuration
 */
export interface GenerateConfigOptions {
  schema: AnalyzedSchema;
  aiConfig: AIProviderConfig;
  preferences?: ConfigPreferences;
}

/**
 * Result of cache config generation
 */
export interface GenerateConfigResult {
  success: boolean;
  config?: OrionCacheConfig;
  aiResponse?: AIConfigResponse;
  error?: string;
}

/**
 * Generates an Orion cache configuration using AI analysis.
 *
 * @param options - Generation options including schema and AI config
 * @returns Generated configuration or error
 */
export async function generateCacheConfig(
  options: GenerateConfigOptions
): Promise<GenerateConfigResult> {
  const { schema, aiConfig, preferences } = options;

  try {
    // Validate API key
    if (!aiConfig.apiKey) {
      throw new Error(`${aiConfig.provider} API key is required`);
    }

    // Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(schema, preferences);

    // Call AI provider
    const responseText = await callAIProvider(
      aiConfig.provider,
      aiConfig,
      systemPrompt,
      userPrompt
    );

    // Parse AI response
    const aiResponse = parseAIResponse(responseText);

    // Convert to Orion config format
    const config = convertToOrionConfig(aiResponse, preferences);

    return {
      success: true,
      config,
      aiResponse,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
