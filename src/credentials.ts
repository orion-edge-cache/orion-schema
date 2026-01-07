/**
 * Credential Management
 *
 * Functions for managing AI provider credentials stored in ~/.config/orion/credentials.json
 */

import { readFile, writeFile, chmod, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import type {
  AIProvider,
  SavedCredentials,
  KeyValidationResult,
} from "./types.js";

// =============================================================================
// CONSTANTS
// =============================================================================

const ORION_CONFIG_DIR = path.join(os.homedir(), ".config/orion");
const CREDENTIALS_PATH = path.join(ORION_CONFIG_DIR, "credentials.json");

/**
 * Environment variable names for each provider (in priority order)
 */
const ENV_VAR_PRIORITY: Record<AIProvider, string[]> = {
  anthropic: ["ANTHROPIC_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  gemini: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
  grok: ["XAI_API_KEY", "GROK_API_KEY"],
};

/**
 * Validation rules for API key formats
 */
const KEY_VALIDATION_RULES: Record<
  AIProvider,
  { pattern: RegExp; minLength: number; description: string }
> = {
  anthropic: {
    pattern: /^sk-ant-/,
    minLength: 20,
    description: "Anthropic keys start with 'sk-ant-'",
  },
  openai: {
    pattern: /^sk-/,
    minLength: 20,
    description: "OpenAI keys start with 'sk-'",
  },
  gemini: {
    pattern: /^AIza/,
    minLength: 30,
    description: "Gemini keys start with 'AIza'",
  },
  grok: {
    pattern: /^xai-/,
    minLength: 20,
    description: "Grok keys start with 'xai-'",
  },
};

// =============================================================================
// CREDENTIAL FUNCTIONS
// =============================================================================

/**
 * Get saved credentials from ~/.config/orion/credentials.json
 */
export async function getSavedCredentials(): Promise<SavedCredentials | null> {
  try {
    if (!existsSync(CREDENTIALS_PATH)) {
      return null;
    }
    const content = await readFile(CREDENTIALS_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Get AI API key from credentials.json
 */
export async function getAIKeyFromCredentials(
  provider: AIProvider
): Promise<string | null> {
  const credentials = await getSavedCredentials();
  return credentials?.ai?.[provider] || null;
}

/**
 * Get AI API key from environment variables
 * Checks variables in priority order for each provider
 */
export function getAIKeyFromEnv(provider: AIProvider): string | null {
  const envVars = ENV_VAR_PRIORITY[provider];

  for (const envVar of envVars) {
    const value = process.env[envVar];
    if (value) {
      return value;
    }
  }

  return null;
}

/**
 * Save AI API key to credentials.json
 * Always overwrites existing key, sets file permissions to 0600
 */
export async function saveAIKeyToCredentials(
  provider: AIProvider,
  apiKey: string
): Promise<void> {
  // Ensure config directory exists
  await mkdir(ORION_CONFIG_DIR, { recursive: true });

  // Load existing credentials or create new
  const credentials: SavedCredentials = (await getSavedCredentials()) || {
    savedAt: new Date().toISOString(),
  };

  // Add/update AI key
  if (!credentials.ai) {
    credentials.ai = {};
  }
  credentials.ai[provider] = apiKey;
  credentials.savedAt = new Date().toISOString();

  // Write file
  await writeFile(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));

  // Set restrictive permissions: 0600 (rw-------)
  await chmod(CREDENTIALS_PATH, 0o600);
}

/**
 * Validate API key format for a provider
 */
export function validateAPIKey(
  provider: AIProvider,
  apiKey: string
): KeyValidationResult {
  const rule = KEY_VALIDATION_RULES[provider];

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      valid: false,
      error: "API key is required",
    };
  }

  if (apiKey.length < rule.minLength) {
    return {
      valid: false,
      error: `Key too short (minimum ${rule.minLength} characters)`,
    };
  }

  if (!rule.pattern.test(apiKey)) {
    return {
      valid: false,
      error: rule.description,
    };
  }

  return { valid: true };
}

/**
 * Mask API key for display (show first 8 + last 4 chars)
 */
export function maskAPIKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 12) {
    return "***" + (apiKey ? apiKey.slice(-4) : "");
  }

  const first = apiKey.slice(0, 8);
  const last = apiKey.slice(-4);
  return `${first}...${last}`;
}

/**
 * Get the environment variable names for a provider
 */
export function getEnvVarNames(provider: AIProvider): string[] {
  return ENV_VAR_PRIORITY[provider];
}
