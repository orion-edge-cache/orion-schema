/**
 * AI-Powered Cache Config Generator
 *
 * Uses LLM to analyze GraphQL schema and generate optimal caching configuration.
 * Supports commercial providers: Anthropic, OpenAI, Gemini, and Grok.
 *
 * @module ai-config-generator
 */

export {
  // Main generation function
  generateCacheConfig,
  type GenerateConfigOptions,
  type GenerateConfigResult,

  // Provider info and utilities
  PROVIDER_INFO,
  DEFAULT_MODELS,
  getDefaultModel,
  getSupportedProviders,

  // Basic config generation (no AI)
  generateBasicConfig,
} from "./ai-config-generator/index.js";
