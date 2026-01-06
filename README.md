# @orion/schema

GraphQL schema introspection, analysis, and AI-powered cache configuration generation.

## Features

- **Schema Introspection** - Fetch GraphQL schemas from any endpoint
- **Schema Analysis** - Analyze types, relationships, and characteristics
- **AI-Powered Config Generation** - Generate optimal cache configs using AI
- **Free AI Providers** - Support for Ollama, Groq, and Hugging Face
- **Zero Dependencies** - Only uses Node.js built-in APIs

## Installation

```bash
npm install @orion/schema
```

## Usage

### Schema Introspection

```typescript
import { fetchSchema, isIntrospectionEnabled } from "@orion/schema"

// Check if introspection is enabled
const enabled = await isIntrospectionEnabled("https://api.example.com/graphql")

// Fetch schema
const result = await fetchSchema({ 
  endpoint: "https://api.example.com/graphql" 
})

if (result.success) {
  console.log(result.schema)
}
```

### Schema Analysis

```typescript
import { analyzeSchema, generateSchemaSummary } from "@orion/schema"

const analyzed = analyzeSchema(schema)

// Get human-readable summary
const summary = generateSchemaSummary(analyzed)
console.log(summary)

// Access analyzed data
console.log(analyzed.entities)      // Entity types
console.log(analyzed.queries)       // Query operations
console.log(analyzed.mutations)     // Mutation operations
console.log(analyzed.relationships) // Type relationships
```

### AI-Powered Config Generation

```typescript
import { generateCacheConfig } from "@orion/schema"

const config = await generateCacheConfig({
  schema: analyzed,
  aiConfig: {
    provider: "ollama",  // or "groq", "huggingface", "anthropic", "openai"
    apiKey: "...",       // Optional for Ollama
  },
  preferences: {
    defaultTtl: "medium",
    aggressiveCaching: false,
  }
})

if (config.success) {
  console.log(config.config)      // Generated Orion config
  console.log(config.aiResponse)  // AI analysis and reasoning
}
```

### Basic Config Generation (No AI)

```typescript
import { generateBasicConfig } from "@orion/schema"

const config = generateBasicConfig(analyzed)
console.log(config) // Heuristic-based config
```

## Granular Imports

```typescript
// Import specific modules
import { fetchSchema } from "@orion/schema/introspection"
import { analyzeSchema } from "@orion/schema/analyzer"
import { generateCacheConfig } from "@orion/schema/ai-config"
import { callFreeAI, PROVIDER_INFO } from "@orion/schema/free-ai"
```

## Free AI Providers

### Ollama (Local, No API Key)

```bash
# Install Ollama
brew install ollama

# Pull a model
ollama pull mistral

# Start Ollama
ollama serve
```

```typescript
const config = await generateCacheConfig({
  schema: analyzed,
  aiConfig: {
    provider: "ollama",
    model: "mistral",
  }
})
```

### Groq (Free Cloud)

Sign up at https://console.groq.com (no credit card required)

```typescript
const config = await generateCacheConfig({
  schema: analyzed,
  aiConfig: {
    provider: "groq",
    apiKey: "gsk_...",
    model: "mixtral-8x7b-32768",
  }
})
```

### Hugging Face

Get free API token at https://huggingface.co/settings/tokens

```typescript
const config = await generateCacheConfig({
  schema: analyzed,
  aiConfig: {
    provider: "huggingface",
    apiKey: "hf_...",
  }
})
```

## API Reference

See [docs/](./docs/) for detailed API documentation.

## License

ISC
