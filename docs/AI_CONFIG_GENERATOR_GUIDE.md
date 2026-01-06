# AI-Powered Cache Config Generator - Implementation Guide

## Overview

The AI-Powered Cache Config Generator is a feature that automatically analyzes your GraphQL schema and generates optimal caching configuration using AI. It supports both **free providers** (for demos) and **paid providers** (for production).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ User runs: orion > Cache Menu > Schema Analysis & AI Config         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Schema Introspection (introspection.ts)                          │
│    - Connects to GraphQL endpoint                                   │
│    - Executes introspection query                                   │
│    - Validates introspection is enabled                             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Schema Analysis (analyzer.ts)                                    │
│    - Extracts entity types (objects with ID fields)                 │
│    - Maps type relationships (User → Posts, Post → Author)          │
│    - Detects characteristics:                                       │
│      • Volatile (has updatedAt, viewCount, etc.)                    │
│      • User-specific (has userId, author, etc.)                     │
│      • Sensitive (has email, password, etc.)                        │
│    - Infers mutation effects                                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. AI Analysis (ai-config-generator.ts + free-ai-providers.ts)      │
│    - Sends schema analysis to LLM                                   │
│    - Provides caching best practices context                        │
│    - Requests cache config recommendations                          │
│    - Parses and validates AI response                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Config Generation (ai-config-generator.ts)                       │
│    - Converts AI response to Orion config format                    │
│    - Validates all required fields                                  │
│    - Presents to user for review                                    │
│    - Saves to ~/.orion/config.json                                  │
│    - Optionally deploys to Fastly                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Files Created

### Core Schema Module (`src/schema/`)

1. **types.ts** (140 lines)
   - GraphQL introspection types (from GraphQL spec)
   - Analyzed schema types (entities, operations, relationships)
   - AI config generation types
   - Orion cache config types

2. **introspection.ts** (150 lines)
   - `fetchSchema()` - Fetches schema from GraphQL endpoint
   - `isIntrospectionEnabled()` - Validates introspection availability
   - Handles timeouts, errors, and authentication

3. **analyzer.ts** (400 lines)
   - `analyzeSchema()` - Main analysis function
   - Entity extraction with ID field detection
   - Relationship mapping (one-to-many, nested)
   - Characteristic detection (volatile, user-specific, sensitive)
   - Mutation analysis and effect inference
   - `generateSchemaSummary()` - Creates human-readable summary for AI

4. **ai-config-generator.ts** (350 lines)
   - `generateCacheConfig()` - Main AI-powered generation
   - `generateBasicConfig()` - Fallback heuristic-based generation
   - Support for Anthropic, OpenAI, Ollama, Groq, HuggingFace
   - Smart prompt construction with caching best practices
   - Response parsing and validation

5. **free-ai-providers.ts** (200 lines)
   - `callFreeAI()` - Unified interface for free providers
   - Ollama support (local, no API key)
   - Groq support (free tier, 30 req/min)
   - Hugging Face Inference API support
   - Provider detection and model listing

### Workflow Integration (`src/workflows/handlers/`)

6. **schema.ts** (350 lines)
   - `handleSchemaAnalysis()` - Analyze and display schema
   - `handleAIConfigGeneration()` - Full AI-powered workflow
   - `handleBasicConfigGeneration()` - Heuristic-based workflow
   - `handleSchemaMenu()` - Sub-menu for schema operations
   - Interactive UI with provider selection and preferences

### Modified Files

- `src/schema/index.ts` - Module exports
- `src/workflows/handlers/index.ts` - Added schema handler exports
- `src/workflows/menus/cache-menu.ts` - Integrated schema menu
- `src/ui/prompts/existing-state.ts` - Added schema menu option

## Free AI Providers

### 1. Ollama (Recommended for Demo)

**Best for:** Local development, no internet required, no API key

```bash
# Installation
brew install ollama  # macOS
# or download from https://ollama.ai

# Start Ollama service
ollama serve

# In another terminal, pull a model
ollama pull mistral  # ~4GB, good balance of speed/quality
# or: ollama pull neural-chat  # Smaller, faster
# or: ollama pull dolphin-mixtral  # More capable

# Ollama runs on http://localhost:11434
```

**Pros:**
- Completely free
- No API key needed
- Works offline
- Fast for demos

**Cons:**
- Requires local resources (4-8GB RAM)
- Slower than cloud providers
- Model quality varies

### 2. Groq (Best Free Cloud Option)

**Best for:** Fast cloud inference, generous free tier

```bash
# Sign up at https://console.groq.com (no credit card required)
# Get API key from console
# Free tier: 30 requests/minute
```

**Pros:**
- Very fast inference
- Generous free tier
- No credit card required
- Cloud-based (no local resources)

**Cons:**
- Rate limited (30 req/min)
- Requires internet
- Requires API key

### 3. Hugging Face Inference API

**Best for:** Variety of models, free tier available

```bash
# Sign up at https://huggingface.co
# Get API token from https://huggingface.co/settings/tokens
# Free tier is rate limited but sufficient for demos
```

**Pros:**
- Many model options
- Free tier available
- Good for experimentation

**Cons:**
- Rate limited
- Slower than Groq
- Requires API key

## Usage Examples

### Example 1: Using Ollama (Local, No API Key)

```
$ orion
> Cache Menu
> 6. Schema Analysis & AI Config
> Generate Config with AI
> Enter GraphQL endpoint: https://api.example.com/graphql
> Select AI provider: Free Providers
> Select free provider: Ollama (Local) ✓ Running locally
> Preferred default cache duration: Medium (5-15 minutes)
> Prioritize caching performance: No
> Additional context: (optional)

[Fetching schema...]
[Analyzing schema...]
[Generating config with AI...]

AI Analysis:
  The schema contains 5 entity types (User, Post, Comment, Like, Tag)
  and 8 mutations. Based on the characteristics detected:
  
  - User: Private scope (user-specific), 5 min TTL
  - Post: Public scope, 10 min TTL with 5 min SWR
  - Comment: Public scope, 2 min TTL (volatile)
  - Like: Private scope, 1 min TTL (very volatile)
  - Tag: Public scope, 1 hour TTL (stable)

Confidence: 85%

Save this configuration? Yes
Deploy the configuration now? Yes

[Config deployed to Fastly]
```

### Example 2: Using Groq (Cloud, Free Tier)

```
$ orion
> Cache Menu
> 6. Schema Analysis & AI Config
> Generate Config with AI
> Enter GraphQL endpoint: https://api.example.com/graphql
> Select AI provider: Free Providers
> Select free provider: Groq (Cloud)
> Enter your Groq API key: gsk_...

[Same flow as above, but using Groq's cloud inference]
```

### Example 3: Basic Config (No AI)

```
$ orion
> Cache Menu
> 6. Schema Analysis & AI Config
> Generate Basic Config
> Enter GraphQL endpoint: https://api.example.com/graphql

[Fetching schema...]
[Analyzing schema...]
[Generating config...]

Generated heuristic-based configuration:
  - Sensitive types (email, password): Private, 1 min TTL
  - User-specific types: Private, 5 min TTL
  - Volatile types (updatedAt, viewCount): 1 min TTL
  - Stable types: 15 min TTL with 5 min SWR

Save this configuration? Yes
```

## Generated Config Example

```json
{
  "version": "1.0",
  "name": "orion",
  "defaults": {
    "maxAge": 300,
    "staleWhileRevalidate": 60,
    "staleIfError": 0
  },
  "rules": [
    {
      "types": ["User"],
      "maxAge": 300,
      "staleWhileRevalidate": 60,
      "scope": "private",
      "reasoning": "User data is user-specific and should not be shared across users"
    },
    {
      "types": ["Post"],
      "maxAge": 600,
      "staleWhileRevalidate": 120,
      "staleIfError": 3600,
      "reasoning": "Posts are moderately stable but benefit from SWR for pagination"
    },
    {
      "types": ["Comment"],
      "maxAge": 60,
      "staleWhileRevalidate": 30,
      "reasoning": "Comments are volatile and change frequently"
    }
  ],
  "invalidations": {
    "createPost": ["Post:*", "User:*"],
    "updatePost": ["Post:*"],
    "deletePost": ["Post:*"],
    "createComment": ["Comment:*", "Post:*"]
  }
}
```

## How It Works: The AI Prompt

The system sends the AI a detailed prompt with:

1. **Caching Concepts** - Explanation of maxAge, SWR, SIE, scope, passthrough
2. **Guidelines** - Best practices for GraphQL caching
3. **Schema Analysis** - Detailed breakdown of:
   - All entity types and their fields
   - Query and mutation operations
   - Type relationships
   - Detected characteristics (volatile, user-specific, sensitive)
4. **User Preferences** - TTL preference, aggressiveness, custom hints
5. **Output Format** - Exact JSON structure expected

The AI then generates:
- Cache rules for each type with reasoning
- Invalidation mappings for mutations
- Overall explanation of the strategy
- Confidence score
- Warnings about edge cases

## Fallback: Basic Config (No AI)

If AI generation fails or no API key is available, the system falls back to heuristic-based generation:

```typescript
// Groups types by characteristics
- Sensitive types → Private, 1 min TTL
- User-specific types → Private, 5 min TTL
- Volatile types → 1 min TTL, 30s SWR
- Stable types → 15 min TTL, 5 min SWR, 1 hour SIE

// Generates invalidation rules from mutations
- createPost → invalidates Post:*
- updateUser → invalidates User:*
- etc.
```

## Future Improvements

### Short Term
1. Add support for more free providers (Together.ai, Replicate, etc.)
2. Implement caching of schema analysis to avoid re-fetching
3. Add config templates for common patterns (e-commerce, social media, etc.)

### Medium Term
1. Integrate with Anthropic/OpenAI for production use
2. Add config versioning and history
3. Implement A/B testing framework for cache rules
4. Add metrics-based optimization (analyze actual cache hit rates)

### Long Term
1. Machine learning model trained on real cache patterns
2. Automatic config optimization based on production metrics
3. Integration with observability platforms (Datadog, New Relic, etc.)
4. Collaborative config management (team-based)

## Troubleshooting

### "Introspection is not enabled"
- Enable introspection on your GraphQL server
- Some servers disable it in production for security

### "Ollama error: Is Ollama running?"
- Make sure Ollama service is running: `ollama serve`
- Check endpoint is correct: `http://localhost:11434`
- Pull a model: `ollama pull mistral`

### "Groq API error: 401"
- Check API key is correct
- Make sure key has not expired
- Verify at https://console.groq.com

### "Failed to parse AI response"
- AI response format was unexpected
- Try again (sometimes LLMs are inconsistent)
- Use basic config as fallback

## Testing the Feature

```bash
# Build the CLI
cd orion-cli
npm run build

# Run locally
npm start

# Or use the bundled version
npm run cli:bundle
```

## Architecture Decisions

### Why Multiple Providers?
- **Ollama**: Best for demos (no API key, works offline)
- **Groq**: Best for free cloud (fast, generous limits)
- **Hugging Face**: Best for variety (many models)
- **Anthropic/OpenAI**: Best for production (highest quality)

### Why Heuristic Fallback?
- Ensures feature works even without AI
- Provides reasonable defaults
- Useful for testing and development

### Why Separate Free Provider Module?
- Keeps code organized
- Easy to add new providers
- Can be replaced with paid providers later
- No breaking changes to existing code

## Performance Considerations

- **Schema Introspection**: ~1-2 seconds (network dependent)
- **Schema Analysis**: ~100-500ms (depends on schema size)
- **AI Generation**: 5-30 seconds (depends on provider and schema size)
- **Total Time**: ~10-35 seconds for full workflow

## Security Considerations

- API keys are not stored (only used in-memory)
- Schema is only sent to AI provider (not stored locally)
- Config is stored in `~/.orion/config.json` (user's home directory)
- No telemetry or tracking

## Contributing

To add a new AI provider:

1. Add provider type to `FreeAIProvider` in `free-ai-providers.ts`
2. Implement `call<Provider>()` function
3. Add case to `callFreeAI()` switch statement
4. Add provider info to `PROVIDER_INFO`
5. Update this guide

Example:

```typescript
async function callMyProvider(
  config: FreeAIConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  // Implementation
}

// Add to switch statement
case "myprovider":
  return callMyProvider(config, systemPrompt, userPrompt);

// Add to PROVIDER_INFO
myprovider: {
  name: "My Provider",
  description: "...",
  setup: "...",
  requiresApiKey: true,
  requiresInternet: true,
  cost: "...",
  models: ["model1", "model2"],
}
```

## References

- [GraphQL Introspection](https://graphql.org/learn/introspection/)
- [Ollama](https://ollama.ai)
- [Groq API](https://console.groq.com)
- [Hugging Face Inference API](https://huggingface.co/inference-api)
- [Anthropic API](https://www.anthropic.com)
- [OpenAI API](https://openai.com/api)
