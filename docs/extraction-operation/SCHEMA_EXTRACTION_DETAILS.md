# Schema Extraction - Detailed Technical Plan

## 1. Current File Dependencies Analysis

### orion-cli/src/schema/types.ts
**Exports:**
- `IntrospectionQuery`, `IntrospectionSchema`, `IntrospectionType`, etc.
- `AnalyzedSchema`, `EntityType`, `OperationType`
- `AIConfigResponse`, `GeneratedCacheRule`
- `OrionCacheConfig`, `OrionCacheRule`

**Dependencies:** None (pure TypeScript types)

### orion-cli/src/schema/introspection.ts
**Exports:**
- `fetchSchema(options)` - Fetches GraphQL schema
- `isIntrospectionEnabled(endpoint)` - Checks if introspection is available
- `IntrospectionOptions`, `IntrospectionResult`

**Dependencies:** None (uses fetch API)

### orion-cli/src/schema/analyzer.ts
**Exports:**
- `analyzeSchema(schema)` - Main analysis function
- `generateSchemaSummary(schema)` - Creates human-readable summary
- Helper functions (internal)

**Dependencies:**
- `./types.js` (for types)

### orion-cli/src/schema/ai-config-generator.ts
**Exports:**
- `generateCacheConfig(options)` - AI-powered config generation
- `generateBasicConfig(schema)` - Heuristic-based fallback
- `AIProviderConfig`, `GenerateConfigOptions`, `GenerateConfigResult`
- Re-exports from free-ai-providers

**Dependencies:**
- `./types.js`
- `./analyzer.js` (for generateSchemaSummary)
- `./free-ai-providers.js`

### orion-cli/src/schema/free-ai-providers.ts
**Exports:**
- `callFreeAI(config, systemPrompt, userPrompt)` - Unified interface
- `isOllamaAvailable()` - Checks if Ollama is running
- `getOllamaModels()` - Lists available Ollama models
- `PROVIDER_INFO` - Provider metadata
- `FreeAIConfig`, `FreeAIProvider`

**Dependencies:** None (uses fetch API)

### orion-cli/src/schema/index.ts
**Exports:** Re-exports everything from all modules

**Dependencies:**
- All other schema modules

## 2. Current Usage in orion-cli

### src/workflows/handlers/schema.ts
**Imports from schema:**
```typescript
import {
  fetchSchema,
  isIntrospectionEnabled,
  analyzeSchema,
  generateSchemaSummary,
  generateCacheConfig,
  generateBasicConfig,
  isOllamaAvailable,
  getOllamaModels,
  PROVIDER_INFO,
  type AIProviderConfig,
  type ConfigPreferences,
  type OrionCacheConfig,
} from "../../schema/index.js"
```

**Will become:**
```typescript
import {
  fetchSchema,
  isIntrospectionEnabled,
  analyzeSchema,
  generateSchemaSummary,
  generateCacheConfig,
  generateBasicConfig,
  isOllamaAvailable,
  getOllamaModels,
  PROVIDER_INFO,
  type AIProviderConfig,
  type ConfigPreferences,
  type OrionCacheConfig,
} from "@orion/schema"
```

### src/workflows/handlers/index.ts
**Current:**
```typescript
export {
  handleSchemaMenu,
  handleSchemaAnalysis,
  handleAIConfigGeneration,
  handleBasicConfigGeneration,
} from "./schema"
```

**No changes needed** - imports are internal

### src/workflows/menus/cache-menu.ts
**Current:**
```typescript
import { handleSchemaMenu } from "../handlers/schema"
```

**No changes needed** - imports are internal

### src/ui/prompts/existing-state.ts
**No schema imports** - no changes needed

## 3. New Repository Structure

```
orion-schema/
├── src/
│   ├── types.ts                    (140 lines)
│   ├── introspection.ts            (150 lines)
│   ├── analyzer.ts                 (400 lines)
│   ├── ai-config-generator.ts      (350 lines)
│   ├── free-ai-providers.ts        (200 lines)
│   └── index.ts                    (10 lines)
├── dist/                           (compiled output)
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
├── .gitignore
└── .git/
```

## 4. Package.json Configuration

### orion-schema/package.json
```json
{
  "name": "@orion/schema",
  "version": "1.0.0",
  "description": "GraphQL schema introspection, analysis, and AI-powered cache config generation",
  "license": "ISC",
  "author": "Preston Macy",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./introspection": {
      "import": "./dist/introspection.js",
      "types": "./dist/introspection.d.ts"
    },
    "./analyzer": {
      "import": "./dist/analyzer.js",
      "types": "./dist/analyzer.d.ts"
    },
    "./ai-config": {
      "import": "./dist/ai-config-generator.js",
      "types": "./dist/ai-config-generator.d.ts"
    },
    "./free-ai": {
      "import": "./dist/free-ai-providers.js",
      "types": "./dist/free-ai-providers.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  },
  "devDependencies": {
    "@types/node": "^24.10.1",
    "typescript": "^5.9.3"
  },
  "dependencies": {}
}
```

### orion-cli/package.json (updated)
```json
{
  "dependencies": {
    "@orion/schema": "github:orion-edge-cache/orion-schema#main",
    "@clack/prompts": "^0.11.0",
    "chalk": "^5.6.2",
    "configstore": "^7.1.0",
    "dotenv": "^17.2.3"
  }
}
```

### orion-console/packages/server/package.json (updated)
```json
{
  "dependencies": {
    "@orion/schema": "github:orion-edge-cache/orion-schema#main",
    "@orion-console/shared": "*",
    "@orion/infra": "github:orion-edge-cache/orion-infra#main",
    "express": "^4.18.2"
  }
}
```

## 5. Import Changes Required

### orion-cli Changes

**File: src/workflows/handlers/schema.ts**
```diff
- import { ... } from "../../schema/index.js"
+ import { ... } from "@orion/schema"
```

**File: src/workflows/handlers/index.ts**
- No changes (internal imports)

**File: src/workflows/menus/cache-menu.ts**
- No changes (internal imports)

**File: package.json**
- Add `"@orion/schema": "github:orion-edge-cache/orion-schema#main"`

### orion-console Changes

**File: packages/server/src/routes/schema.ts** (new file)
```typescript
import { 
  fetchSchema, 
  analyzeSchema, 
  generateCacheConfig 
} from "@orion/schema"

export function setupSchemaRoutes(app: Express) {
  app.post("/api/schema/analyze", async (req, res) => {
    // Implementation
  })
  
  app.post("/api/schema/generate-config", async (req, res) => {
    // Implementation
  })
}
```

**File: packages/server/src/index.ts**
```typescript
import { setupSchemaRoutes } from "./routes/schema.js"

// In main setup:
setupSchemaRoutes(app)
```

**File: packages/server/package.json**
- Add `"@orion/schema": "github:orion-edge-cache/orion-schema#main"`

## 6. API Endpoints for Console

### POST /api/schema/analyze
**Request:**
```json
{
  "endpoint": "https://api.example.com/graphql"
}
```

**Response:**
```json
{
  "entities": [...],
  "queries": [...],
  "mutations": [...],
  "relationships": [...]
}
```

### POST /api/schema/generate-config
**Request:**
```json
{
  "endpoint": "https://api.example.com/graphql",
  "aiProvider": "ollama",
  "preferences": {
    "defaultTtl": "medium",
    "aggressiveCaching": false
  }
}
```

**Response:**
```json
{
  "config": {
    "version": "1.0",
    "rules": [...],
    "invalidations": {...}
  },
  "aiResponse": {
    "explanation": "...",
    "confidence": 0.85,
    "warnings": [...]
  }
}
```

## 7. Development Workflow

### During Development (before publishing)

**Option A: npm link**
```bash
cd orion-schema
npm link

cd ../orion-cli
npm link @orion/schema

cd ../orion-console
npm link @orion/schema
```

**Option B: Local file path**
```json
{
  "dependencies": {
    "@orion/schema": "file:../orion-schema"
  }
}
```

### After Publishing to npm

```json
{
  "dependencies": {
    "@orion/schema": "^1.0.0"
  }
}
```

## 8. Testing Strategy

### Unit Tests (in orion-schema)
```
src/__tests__/
├── types.test.ts
├── introspection.test.ts
├── analyzer.test.ts
├── ai-config-generator.test.ts
└── free-ai-providers.test.ts
```

### Integration Tests (in consumers)
```
orion-cli/src/__tests__/
└── schema-integration.test.ts

orion-console/packages/server/src/__tests__/
└── schema-routes.test.ts
```

## 9. Migration Checklist

### Step 1: Create orion-schema
- [ ] Create directory: `mkdir -p orion-schema/src`
- [ ] Copy files from orion-cli/src/schema/
- [ ] Create package.json
- [ ] Create tsconfig.json
- [ ] Create README.md
- [ ] Create LICENSE
- [ ] Create .gitignore
- [ ] Initialize git: `git init`
- [ ] Create initial commit
- [ ] Push to GitHub

### Step 2: Update orion-cli
- [ ] Update package.json
- [ ] Run `npm install`
- [ ] Update src/workflows/handlers/schema.ts imports
- [ ] Delete src/schema/ directory
- [ ] Run `npm run build`
- [ ] Test: `npm start`
- [ ] Verify schema menu works
- [ ] Commit changes

### Step 3: Update orion-console
- [ ] Update packages/server/package.json
- [ ] Run `npm install`
- [ ] Create packages/server/src/routes/schema.ts
- [ ] Update packages/server/src/index.ts
- [ ] Create React components for schema UI
- [ ] Run `npm run build`
- [ ] Test: `npm run dev`
- [ ] Verify schema endpoints work
- [ ] Commit changes

### Step 4: Documentation
- [ ] Update orion-schema README
- [ ] Update orion-cli README
- [ ] Update orion-console README
- [ ] Create migration guide
- [ ] Update main Orion README

## 10. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Import path errors | Low | High | Test thoroughly before commit |
| Circular dependencies | Very Low | High | Keep orion-schema independent |
| Version conflicts | Low | Medium | Use semantic versioning |
| Breaking changes | Low | High | Maintain backward compatibility |

## 11. Success Criteria

- [ ] orion-schema builds without errors
- [ ] orion-cli builds and runs without errors
- [ ] orion-console builds and runs without errors
- [ ] Schema menu works in CLI
- [ ] Schema endpoints work in console
- [ ] All imports resolve correctly
- [ ] TypeScript compilation passes
- [ ] No circular dependencies
- [ ] Documentation is complete

## 12. Rollback Plan

If something goes wrong:

1. Keep original orion-cli/src/schema/ directory in git history
2. If needed, revert: `git revert <commit>`
3. Restore original imports
4. Delete orion-schema repository

---

**Total Effort:** ~2 hours
**Complexity:** Low
**Risk:** Low
**Value:** High (code reuse, maintainability)
