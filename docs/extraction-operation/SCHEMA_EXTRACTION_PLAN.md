# Extraction Plan: @orion/schema Package

## Executive Summary

Extract the AI-powered cache config generator into a standalone, reusable `@orion/schema` package that can be consumed by both the CLI and console applications. This package will handle GraphQL schema introspection, analysis, and AI-powered cache configuration generation.

---

## Current State Analysis

### Files to Extract (from orion-cli/src/schema/)
```
orion-cli/src/schema/
├── types.ts                    (140 lines) - All TypeScript types
├── introspection.ts            (150 lines) - GraphQL schema fetching
├── analyzer.ts                 (400 lines) - Schema analysis engine
├── ai-config-generator.ts      (350 lines) - AI integration & config generation
├── free-ai-providers.ts        (200 lines) - Free provider implementations
└── index.ts                    (10 lines)  - Module exports
```

**Total: ~1,250 lines of core logic**

### Current Dependencies
- **No external dependencies** - Only uses built-in Node.js APIs (fetch, JSON)
- Uses TypeScript types from GraphQL spec (no graphql package needed)
- No UI framework dependencies (prompts, chalk, etc.)

### Current Usage in CLI
- `src/workflows/handlers/schema.ts` - Interactive CLI handlers
- `src/ui/prompts/existing-state.ts` - Menu integration
- `src/workflows/menus/cache-menu.ts` - Menu routing

---

## Proposed Architecture

### New Repository Structure

```
orion-schema/
├── src/
│   ├── types.ts                    # GraphQL & config types
│   ├── introspection.ts            # Schema fetching
│   ├── analyzer.ts                 # Schema analysis
│   ├── ai-config-generator.ts      # AI config generation
│   ├── free-ai-providers.ts        # Free AI provider implementations
│   └── index.ts                    # Main exports
├── dist/                           # Compiled output
├── package.json                    # Package metadata
├── tsconfig.json                   # TypeScript config
├── README.md                       # Usage documentation
├── LICENSE                         # ISC license
└── .gitignore
```

### Package.json Structure

```json
{
  "name": "@orion/schema",
  "version": "1.0.0",
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
  "dependencies": {}
}
```

**Key Points:**
- Zero dependencies (pure Node.js)
- Granular exports for tree-shaking
- Full TypeScript support with declaration files

---

## Implementation Steps

### Phase 1: Create New Repository

1. **Create directory structure**
   ```
   mkdir -p orion-schema/src
   ```

2. **Copy files from orion-cli/src/schema/**
   - types.ts
   - introspection.ts
   - analyzer.ts
   - ai-config-generator.ts
   - free-ai-providers.ts
   - index.ts

3. **Create configuration files**
   - package.json (as shown above)
   - tsconfig.json (strict TypeScript config)
   - README.md (usage guide)
   - LICENSE (ISC)
   - .gitignore

4. **Initialize git repository**
   ```
   cd orion-schema
   git init
   git add .
   git commit -m "Initial commit: Extract schema analyzer"
   ```

### Phase 2: Update orion-cli

1. **Update package.json**
   ```json
   {
     "dependencies": {
       "@orion/schema": "github:orion-edge-cache/orion-schema#main"
     }
   }
   ```

2. **Remove local schema directory**
   ```
   rm -rf src/schema
   ```

3. **Update imports in schema.ts handler**
   ```typescript
   // Before
   import { ... } from "../../schema/index.js"
   
   // After
   import { ... } from "@orion/schema"
   ```

4. **Update imports in other files**
   - src/workflows/handlers/schema.ts
   - Any other files importing from schema module

5. **Run npm install**
   ```
   npm install
   ```

6. **Verify compilation**
   ```
   npm run build
   ```

### Phase 3: Update orion-console

1. **Add to packages/server/package.json**
   ```json
   {
     "dependencies": {
       "@orion/schema": "github:orion-edge-cache/orion-schema#main"
     }
   }
   ```

2. **Create new API endpoint for schema analysis**
   ```
   packages/server/src/routes/schema.ts
   ```
   
   This endpoint would:
   - Accept GraphQL endpoint URL
   - Call `@orion/schema` functions
   - Return analyzed schema and generated config

3. **Example endpoint structure**
   ```typescript
   // POST /api/schema/analyze
   // Body: { endpoint: string }
   // Response: { entities, queries, mutations, relationships }
   
   // POST /api/schema/generate-config
   // Body: { endpoint, aiProvider, preferences }
   // Response: { config, aiResponse, explanation }
   ```

4. **Update client to call new endpoints**
   - Create React components for schema analysis UI
   - Create form for AI provider selection
   - Display generated config

5. **Run npm install**
   ```
   npm install
   ```

6. **Verify compilation**
   ```
   npm run build
   ```

---

## Module Exports Strategy

### Main Export (`@orion/schema`)
```typescript
// Everything
export * from "./types.js"
export * from "./introspection.js"
export * from "./analyzer.js"
export * from "./ai-config-generator.js"
export * from "./free-ai-providers.js"
```

### Granular Exports
```typescript
// @orion/schema/introspection
export { fetchSchema, isIntrospectionEnabled }

// @orion/schema/analyzer
export { analyzeSchema, generateSchemaSummary }

// @orion/schema/ai-config
export { generateCacheConfig, generateBasicConfig }

// @orion/schema/free-ai
export { callFreeAI, isOllamaAvailable, PROVIDER_INFO }
```

**Benefits:**
- Consumers can import only what they need
- Better tree-shaking in bundlers
- Clear separation of concerns

---

## Usage Examples

### In CLI (orion-cli)
```typescript
import { 
  fetchSchema, 
  analyzeSchema, 
  generateCacheConfig 
} from "@orion/schema"

const schema = await fetchSchema({ endpoint: "..." })
const analyzed = analyzeSchema(schema)
const config = await generateCacheConfig({ schema: analyzed, aiConfig })
```

### In Console Server (orion-console/packages/server)
```typescript
import { 
  fetchSchema, 
  analyzeSchema, 
  generateCacheConfig 
} from "@orion/schema"

app.post("/api/schema/analyze", async (req, res) => {
  const { endpoint } = req.body
  const schema = await fetchSchema({ endpoint })
  const analyzed = analyzeSchema(schema)
  res.json(analyzed)
})
```

### In Console Client (orion-console/packages/client)
```typescript
// Call server endpoint
const response = await fetch("/api/schema/analyze", {
  method: "POST",
  body: JSON.stringify({ endpoint })
})
const analyzed = await response.json()
```

---

## Dependency Management

### orion-schema (Zero Dependencies)
- ✅ Pure Node.js APIs
- ✅ No external packages
- ✅ Minimal, focused scope

### orion-cli (Adds @orion/schema)
```json
{
  "dependencies": {
    "@orion/schema": "github:orion-edge-cache/orion-schema#main",
    "@clack/prompts": "^0.11.0",
    "chalk": "^5.6.2"
  }
}
```

### orion-console/packages/server (Adds @orion/schema)
```json
{
  "dependencies": {
    "@orion/schema": "github:orion-edge-cache/orion-schema#main",
    "express": "^4.18.2"
  }
}
```

---

## Testing Strategy

### Unit Tests (in orion-schema)
```
src/__tests__/
├── introspection.test.ts
├── analyzer.test.ts
├── ai-config-generator.test.ts
└── free-ai-providers.test.ts
```

### Integration Tests (in each consumer)
```
orion-cli/src/__tests__/schema-integration.test.ts
orion-console/packages/server/src/__tests__/schema-routes.test.ts
```

---

## Migration Checklist

### Step 1: Create orion-schema repo
- [ ] Create directory structure
- [ ] Copy source files
- [ ] Create package.json
- [ ] Create tsconfig.json
- [ ] Create README.md
- [ ] Create LICENSE
- [ ] Initialize git
- [ ] Push to GitHub

### Step 2: Update orion-cli
- [ ] Update package.json with @orion/schema dependency
- [ ] Remove src/schema directory
- [ ] Update all imports
- [ ] Run npm install
- [ ] Verify npm run build
- [ ] Test CLI functionality
- [ ] Commit changes

### Step 3: Update orion-console
- [ ] Update packages/server/package.json
- [ ] Create schema API routes
- [ ] Update client to use new endpoints
- [ ] Run npm install
- [ ] Verify npm run build
- [ ] Test console functionality
- [ ] Commit changes

### Step 4: Documentation
- [ ] Update orion-schema README
- [ ] Update orion-cli README
- [ ] Update orion-console README
- [ ] Update main Orion README
- [ ] Create migration guide

---

## Benefits of This Approach

### Separation of Concerns
- Schema analysis is independent of UI
- Can be used in any Node.js environment
- Easy to test in isolation

### Code Reuse
- Both CLI and console use same logic
- No duplication
- Single source of truth

### Scalability
- Easy to add new AI providers
- Easy to add new analysis features
- Can be used by future tools

### Maintainability
- Focused, single-purpose package
- Clear API surface
- Well-documented

### Flexibility
- Can be published to npm later
- Can be used in other projects
- Can be forked/customized independently

---

## Potential Challenges & Solutions

### Challenge 1: Circular Dependencies
**Problem:** If orion-schema needs types from orion-infra
**Solution:** Keep orion-schema independent; use generic types

### Challenge 2: Version Synchronization
**Problem:** Keeping versions in sync across repos
**Solution:** Use workspace or monorepo approach; or use semantic versioning

### Challenge 3: Development Workflow
**Problem:** Developing orion-schema while testing in CLI/console
**Solution:** Use npm link or local file: dependencies during development

### Challenge 4: Breaking Changes
**Problem:** Changes to orion-schema API break consumers
**Solution:** Semantic versioning; deprecation warnings; changelog

---

## Future Enhancements

### Short Term
1. Add unit tests to orion-schema
2. Add JSDoc comments for better IDE support
3. Create TypeScript declaration files

### Medium Term
1. Publish to npm (not just GitHub)
2. Add CLI tool to orion-schema for standalone use
3. Add caching for schema analysis results

### Long Term
1. Create web-based schema analyzer
2. Add schema comparison/diffing
3. Add schema versioning
4. Integrate with CI/CD pipelines

---

## File-by-File Checklist

### orion-schema/src/
- [ ] types.ts - Copy as-is, no changes needed
- [ ] introspection.ts - Copy as-is, no changes needed
- [ ] analyzer.ts - Copy as-is, no changes needed
- [ ] ai-config-generator.ts - Copy as-is, no changes needed
- [ ] free-ai-providers.ts - Copy as-is, no changes needed
- [ ] index.ts - Create new with proper exports

### orion-cli/src/
- [ ] Remove src/schema/ directory
- [ ] Update src/workflows/handlers/schema.ts imports
- [ ] Update src/workflows/handlers/index.ts imports
- [ ] Update src/workflows/menus/cache-menu.ts imports
- [ ] Update package.json with @orion/schema dependency

### orion-console/packages/server/src/
- [ ] Create routes/schema.ts with API endpoints
- [ ] Update package.json with @orion/schema dependency
- [ ] Update index.ts to register schema routes

---

## Summary

This extraction creates a **zero-dependency, reusable package** that:
- ✅ Handles all schema analysis logic
- ✅ Supports multiple AI providers
- ✅ Can be used by CLI, console, and future tools
- ✅ Maintains clean separation of concerns
- ✅ Enables independent development and testing
- ✅ Provides clear, granular exports
- ✅ Requires minimal changes to existing code

The migration is **straightforward** and can be done in phases without breaking existing functionality.
