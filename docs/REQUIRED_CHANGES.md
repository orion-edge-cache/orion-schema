# Required Changes to @orion/schema

## Overview

To support the orion-console integration with only commercial AI providers (ChatGPT, Anthropic, Gemini, and Grok), the following changes are required to the @orion/schema package.

**Status:** Planning - Ready for Implementation

---

## Changes Required

### 1. Remove Free AI Providers

**Files to Modify:**
- `src/free-ai-providers.ts` - DELETE this file entirely
- `src/index.ts` - Remove export of free-ai-providers

**Rationale:**
- Ollama (local) - No longer needed
- Groq (free tier) - Removing free tier, may add paid Grok later
- Hugging Face - Removing free tier

**Impact:**
- Removes ~256 lines of code
- Simplifies provider management
- Reduces maintenance burden

---

### 2. Update AIProviderConfig Type

**File:** `src/ai-config-generator.ts`

**Current:**
```typescript
export interface AIProviderConfig {
  provider: "anthropic" | "openai" | "ollama" | "groq" | "huggingface";
  apiKey?: string | undefined;
  model?: string | undefined;
  endpoint?: string | undefined; // For Ollama custom endpoint
}

const DEFAULT_MODELS = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  ollama: "mistral",
  groq: "mixtral-8x7b-32768",
  huggingface: "mistralai/Mistral-7B-Instruct-v0.1",
};
```

**Updated:**
```typescript
export interface AIProviderConfig {
  provider: "anthropic" | "openai" | "gemini" | "grok";
  apiKey: string; // Now required (no local providers)
  model?: string | undefined;
}

const DEFAULT_MODELS = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  grok: "grok-2",
};
```

**Changes:**
- Remove "ollama", "groq", "huggingface" from provider union
- Add "gemini" and "grok"
- Make `apiKey` required (no local providers)
- Remove `endpoint` field (no custom endpoints needed)
- Update DEFAULT_MODELS with new providers

---

### 3. Update generateCacheConfig Function

**File:** `src/ai-config-generator.ts`

**Current Implementation:**
```typescript
export async function generateCacheConfig(
  schema: AnalyzedSchema,
  analysis: SchemaAnalysis,
  preferences?: ConfigPreferences,
  aiProvider?: AIProviderConfig
): Promise<OrionCacheConfig> {
  if (!aiProvider) {
    return generateBasicConfig(analysis, preferences);
  }

  // Calls free AI providers
  if (aiProvider.provider === "ollama" || aiProvider.provider === "groq" || aiProvider.provider === "huggingface") {
    const freeConfig: FreeAIConfig = {
      provider: aiProvider.provider,
      apiKey: aiProvider.apiKey,
      model: aiProvider.model,
      endpoint: aiProvider.endpoint,
    };
    const response = await callFreeAI(freeConfig, systemPrompt, userPrompt);
    // ... process response
  }

  // Calls paid providers
  if (aiProvider.provider === "anthropic") {
    // ... Anthropic implementation
  }
  if (aiProvider.provider === "openai") {
    // ... OpenAI implementation
  }
}
```

**Updated Implementation:**
```typescript
export async function generateCacheConfig(
  schema: AnalyzedSchema,
  analysis: SchemaAnalysis,
  preferences?: ConfigPreferences,
  aiProvider: AIProviderConfig
): Promise<OrionCacheConfig> {
  // AI provider is now required
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(schema, preferences);

  let response: string;

  switch (aiProvider.provider) {
    case "anthropic":
      response = await callAnthropic(aiProvider, systemPrompt, userPrompt);
      break;
    case "openai":
      response = await callOpenAI(aiProvider, systemPrompt, userPrompt);
      break;
    case "gemini":
      response = await callGemini(aiProvider, systemPrompt, userPrompt);
      break;
    case "grok":
      response = await callGrok(aiProvider, systemPrompt, userPrompt);
      break;
    default:
      throw new Error(`Unknown provider: ${aiProvider.provider}`);
  }

  // Parse and return config
  const parsed = JSON.parse(response);
  return buildCacheConfig(parsed, schema);
}
```

**Changes:**
- Make `aiProvider` parameter required (no longer optional)
- Remove free AI provider handling
- Add Gemini and Grok implementations
- Simplify switch statement

---

### 4. Add Paid Provider Implementations

**File:** `src/ai-config-generator.ts`

Add three new functions:

#### 4.1 Gemini Implementation

```typescript
async function callGemini(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const model = config.model || DEFAULT_MODELS.gemini;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: userPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return result.candidates[0].content.parts[0].text;
}
```

#### 4.2 Grok Implementation

```typescript
async function callGrok(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const model = config.model || DEFAULT_MODELS.grok;

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}
```

#### 4.3 Update Existing Implementations

Ensure Anthropic and OpenAI implementations exist and are properly formatted.

---

### 5. Update PROVIDER_INFO

**File:** `src/ai-config-generator.ts` or new `src/providers.ts`

**Current:**
```typescript
export const PROVIDER_INFO = {
  ollama: { ... },
  groq: { ... },
  huggingface: { ... },
};
```

**Updated:**
```typescript
export const PROVIDER_INFO = {
  anthropic: {
    name: "Anthropic Claude",
    description: "Claude 3 family of models - excellent reasoning and analysis",
    website: "https://www.anthropic.com",
    requiresApiKey: true,
    models: [
      "claude-opus-4-1",
      "claude-sonnet-4-20250514",
      "claude-haiku-3-5",
    ],
    pricing: "Pay-as-you-go",
    setupUrl: "https://console.anthropic.com/",
  },
  openai: {
    name: "OpenAI GPT",
    description: "GPT-4 and GPT-4o models - state-of-the-art performance",
    website: "https://openai.com",
    requiresApiKey: true,
    models: [
      "gpt-4o",
      "gpt-4-turbo",
      "gpt-4",
    ],
    pricing: "Pay-as-you-go",
    setupUrl: "https://platform.openai.com/account/api-keys",
  },
  gemini: {
    name: "Google Gemini",
    description: "Google's multimodal AI model - fast and capable",
    website: "https://ai.google.dev",
    requiresApiKey: true,
    models: [
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
    pricing: "Free tier + paid",
    setupUrl: "https://ai.google.dev/",
  },
  grok: {
    name: "xAI Grok",
    description: "Grok - X's AI model with real-time knowledge",
    website: "https://x.ai",
    requiresApiKey: true,
    models: [
      "grok-2",
      "grok-vision-beta",
    ],
    pricing: "Pay-as-you-go",
    setupUrl: "https://console.x.ai/",
  },
};
```

---

### 6. Update Types

**File:** `src/types.ts`

Add/update provider-related types:

```typescript
export type AIProvider = "anthropic" | "openai" | "gemini" | "grok";

export interface ProviderInfo {
  name: string;
  description: string;
  website: string;
  requiresApiKey: boolean;
  models: string[];
  pricing: string;
  setupUrl: string;
}

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string; // Required
  model?: string;
}
```

---

### 7. Remove Exports

**File:** `src/index.ts`

**Current:**
```typescript
export * from "./types.js";
export * from "./introspection.js";
export * from "./analyzer.js";
export * from "./ai-config-generator.js";
export * from "./free-ai-providers.js"; // REMOVE THIS
```

**Updated:**
```typescript
export * from "./types.js";
export * from "./introspection.js";
export * from "./analyzer.js";
export * from "./ai-config-generator.js";
```

---

### 8. Add Credential Management Functions

**File:** `src/credentials.ts` (NEW FILE)

Add functions to manage AI provider credentials stored in `~/.config/orion/credentials.json`:

```typescript
import { readFile, writeFile, chmod, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

const ORION_CONFIG_DIR = path.join(os.homedir(), '.config/orion');
const CREDENTIALS_PATH = path.join(ORION_CONFIG_DIR, 'credentials.json');

export interface SavedCredentials {
  aws?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  fastly?: {
    apiToken: string;
  };
  ai?: {
    anthropic?: string;
    openai?: string;
    gemini?: string;
    grok?: string;
  };
  savedAt: string;
}

// Environment variable priority for each provider
const ENV_VAR_PRIORITY: Record<AIProvider, string[]> = {
  anthropic: ['ANTHROPIC_API_KEY'],
  openai: ['OPENAI_API_KEY'],
  gemini: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'], // GEMINI_API_KEY first
  grok: ['XAI_API_KEY', 'GROK_API_KEY'] // XAI_API_KEY first
};

/**
 * Get saved credentials from ~/.config/orion/credentials.json
 */
export async function getSavedCredentials(): Promise<SavedCredentials | null> {
  try {
    if (!existsSync(CREDENTIALS_PATH)) return null;
    const content = await readFile(CREDENTIALS_PATH, 'utf-8');
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
 * Always overwrites existing key, no backup
 */
export async function saveAIKeyToCredentials(
  provider: AIProvider,
  apiKey: string
): Promise<void> {
  // Ensure config directory exists
  await mkdir(ORION_CONFIG_DIR, { recursive: true });
  
  // Load existing credentials or create new
  const credentials = await getSavedCredentials() || {
    savedAt: new Date().toISOString()
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
 * Validate API key format
 */
export function validateAPIKey(provider: AIProvider, apiKey: string): {
  valid: boolean;
  error?: string;
} {
  const rules: Record<AIProvider, { pattern: RegExp; minLength: number; description: string }> = {
    anthropic: {
      pattern: /^sk-ant-/,
      minLength: 20,
      description: "Anthropic keys start with 'sk-ant-'"
    },
    openai: {
      pattern: /^sk-/,
      minLength: 20,
      description: "OpenAI keys start with 'sk-'"
    },
    gemini: {
      pattern: /^AIza/,
      minLength: 30,
      description: "Gemini keys start with 'AIza'"
    },
    grok: {
      pattern: /^xai-/,
      minLength: 20,
      description: "Grok keys start with 'xai-'"
    }
  };
  
  const rule = rules[provider];
  
  if (apiKey.length < rule.minLength) {
    return {
      valid: false,
      error: `Key too short (minimum ${rule.minLength} characters)`
    };
  }
  
  if (!rule.pattern.test(apiKey)) {
    return {
      valid: false,
      error: rule.description
    };
  }
  
  return { valid: true };
}

/**
 * Mask API key for display (show first 8 + last 4 chars)
 */
export function maskAPIKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return "***" + apiKey.slice(-4);
  }
  
  const first = apiKey.slice(0, 8);
  const last = apiKey.slice(-4);
  return `${first}...${last}`;
}
```

**Rationale:**
- Store AI keys alongside AWS/Fastly credentials
- Lookup flow: credentials.json → env vars → prompt user
- Format validation catches typos early
- File permissions (0600) protect sensitive keys
- No backup files to avoid clutter

---

### 9. Add Endpoint Discovery Functions

**File:** `src/endpoint.ts` (NEW FILE)

Add functions to discover GraphQL endpoint from terraform state:

```typescript
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

const ORION_CONFIG_DIR = path.join(os.homedir(), '.config/orion');
const TFSTATE_PATH = path.join(ORION_CONFIG_DIR, 'terraform.tfstate');

/**
 * Get GraphQL endpoint from terraform state
 * Always uses: outputs.compute_service.value.backend_domain
 */
export async function getGraphQLEndpointFromTerraform(): Promise<string | null> {
  try {
    if (!existsSync(TFSTATE_PATH)) {
      return null;
    }
    
    const tfstate = JSON.parse(await readFile(TFSTATE_PATH, 'utf-8'));
    
    // Specific path driven by @orion-infra package
    const endpoint = tfstate.outputs?.compute_service?.value?.backend_domain;
    
    return endpoint || null;
  } catch (error) {
    console.error('Failed to read terraform state:', error);
    return null;
  }
}

/**
 * Test if GraphQL endpoint is reachable
 */
export async function testEndpointReachability(endpoint: string): Promise<{
  reachable: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            __schema {
              types {
                name
              }
            }
          }
        `
      }),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      return {
        reachable: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    if (data.errors) {
      return {
        reachable: false,
        error: `GraphQL error: ${data.errors[0].message}`
      };
    }

    return { reachable: true };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

**Rationale:**
- Endpoint is always from terraform state (no manual override)
- Path is `outputs.compute_service.value.backend_domain` (driven by @orion-infra)
- Reachability test validates endpoint is working GraphQL server
- Simple error if terraform state missing (no complex menu hiding)

---

### 10. Update Exports

**File:** `src/index.ts`

**Current:**
```typescript
export * from "./types.js";
export * from "./introspection.js";
export * from "./analyzer.js";
export * from "./ai-config-generator.js";
export * from "./free-ai-providers.js"; // REMOVE THIS
```

**Updated:**
```typescript
export * from "./types.js";
export * from "./introspection.js";
export * from "./analyzer.js";
export * from "./ai-config-generator.js";
export * from "./credentials.js"; // NEW
export * from "./endpoint.js"; // NEW
```

---

### 11. Update Documentation

**Files to Update:**
- `README.md` - Remove free provider references, add credential/endpoint docs
- `docs/` - Update any provider-related documentation

**Changes:**
- Remove Ollama setup instructions
- Remove Groq free tier information
- Remove Hugging Face information
- Add Gemini setup instructions
- Add Grok setup instructions
- Add credential management documentation
- Add endpoint discovery documentation
- Update pricing information
- Update API key requirements

---

## Summary of Changes

| Item | Change | Impact |
|------|--------|--------|
| Free AI Providers | Remove entirely | -256 lines, simpler codebase |
| AIProviderConfig | Update union type | Requires code changes in consumers |
| generateCacheConfig | Make AI required | Removes heuristic-only option |
| New Providers | Add Gemini, Grok | +~200 lines |
| PROVIDER_INFO | Update structure | Better provider metadata |
| Credential Management | Add 5 new functions | +~150 lines |
| Endpoint Discovery | Add 2 new functions | +~80 lines |
| Exports | Update exports | Cleaner API surface |
| Documentation | Update all references | Clearer setup instructions |

---

## Files to Delete

- `src/free-ai-providers.ts` (256 lines)

## Files to Create

- `src/credentials.ts` (~150 lines) - Credential management functions
- `src/endpoint.ts` (~80 lines) - Endpoint discovery functions

## Files to Modify

- `src/ai-config-generator.ts` - Update types, add Gemini/Grok, remove free AI
- `src/types.ts` - Update AIProvider union, add ProviderInfo type
- `src/index.ts` - Update exports (remove free-ai, add credentials/endpoint)
- `README.md` - Update documentation
- `package.json` - No changes needed

---

## Implementation Order

1. Update `src/types.ts` - Define new types
2. Create `src/credentials.ts` - Add credential management functions
3. Create `src/endpoint.ts` - Add endpoint discovery functions
4. Update `src/ai-config-generator.ts` - Add Gemini/Grok implementations
5. Delete `src/free-ai-providers.ts`
6. Update `src/index.ts` - Update exports
7. Update `README.md` - Update documentation
8. Test all providers and credential flow
9. Update version in `package.json` to 2.0.0

---

## Testing Checklist

### AI Providers
- [ ] Anthropic provider works with API key
- [ ] OpenAI provider works with API key
- [ ] Gemini provider works with API key
- [ ] Grok provider works with API key
- [ ] Error handling for invalid API keys
- [ ] Error handling for missing API keys

### Credential Management
- [ ] Can read credentials from credentials.json
- [ ] Can read credentials from environment variables
- [ ] Can save credentials to credentials.json
- [ ] File permissions set to 0600
- [ ] API key validation works for all providers
- [ ] API key masking works correctly
- [ ] Environment variable priority order correct

### Endpoint Discovery
- [ ] Can read endpoint from terraform.tfstate
- [ ] Correct path: outputs.compute_service.value.backend_domain
- [ ] Endpoint reachability test works
- [ ] Error handling for missing terraform state
- [ ] Error handling for unreachable endpoint

### General
- [ ] PROVIDER_INFO exports correctly
- [ ] TypeScript compilation passes
- [ ] No unused imports
- [ ] All exports work correctly
- [ ] All tests pass

---

## Migration Guide for Consumers

### Before (with free providers):
```typescript
import { generateCacheConfig, isOllamaAvailable } from '@orion/schema';

// Check if Ollama is available
if (await isOllamaAvailable()) {
  const config = await generateCacheConfig(schema, analysis, prefs, {
    provider: 'ollama',
    model: 'mistral',
  });
}

// Or use heuristics
const config = generateBasicConfig(analysis, prefs);
```

### After (paid providers with credential management):
```typescript
import {
  generateCacheConfig,
  getAIKeyFromCredentials,
  getAIKeyFromEnv,
  saveAIKeyToCredentials,
  getGraphQLEndpointFromTerraform
} from '@orion/schema';

// Get API key with fallback chain
let apiKey = await getAIKeyFromCredentials('anthropic');
if (!apiKey) {
  apiKey = getAIKeyFromEnv('anthropic');
}
if (!apiKey) {
  // Prompt user for API key
  apiKey = await promptUserForAPIKey();
  // Save for future use
  await saveAIKeyToCredentials('anthropic', apiKey);
}

// Get endpoint from terraform state
const endpoint = await getGraphQLEndpointFromTerraform();

// Generate config
const config = await generateCacheConfig(schema, analysis, prefs, {
  provider: 'anthropic',
  apiKey,
  model: 'claude-sonnet-4-20250514',
});

// Or use heuristics (still available)
const config = generateBasicConfig(analysis, prefs);
```

---

## Breaking Changes

⚠️ **This is a breaking change** for consumers of @orion/schema:

### Removed Functions
1. `callFreeAI` - Free AI provider support removed
2. `isOllamaAvailable` - Ollama detection removed
3. `getOllamaModels` - Ollama model listing removed

### Removed Types
1. `FreeAIProvider` - Free provider union type removed
2. `FreeAIConfig` - Free provider config interface removed

### Changed Functions
1. `generateCacheConfig` - `aiProvider` parameter now required (was optional)

### New Functions (Non-Breaking)
1. `getAIKeyFromCredentials` - Get key from credentials.json
2. `getAIKeyFromEnv` - Get key from environment variables
3. `saveAIKeyToCredentials` - Save key to credentials.json
4. `validateAPIKey` - Validate API key format
5. `maskAPIKey` - Mask key for display
6. `getGraphQLEndpointFromTerraform` - Get endpoint from tfstate
7. `testEndpointReachability` - Test if endpoint is reachable

**Migration Path:**
- Consumers using free providers must switch to paid providers
- Consumers using heuristics can continue using `generateBasicConfig`
- Consumers using paid providers need to update provider names (add Gemini/Grok)
- Use new credential management functions for better UX

---

## Version Bump

Recommend bumping to **2.0.0** due to breaking changes.

---

**Document Version:** 1.0  
**Last Updated:** January 6, 2026  
**Status:** Ready for Review
