# Schema Extraction Plan - Quick Summary

## What We're Extracting

The **AI-powered cache config generator** from `orion-cli/src/schema/` into a standalone `@orion/schema` package.

```
Current Structure:
orion-cli/src/schema/ → @orion/schema (new repo)
```

## Why Extract?

✅ **Code Reuse** - Both CLI and console can use the same logic
✅ **Separation of Concerns** - Schema analysis independent from UI
✅ **Scalability** - Easy to add new features/providers
✅ **Testability** - Can be tested in isolation
✅ **Flexibility** - Can be published to npm later

## What Gets Extracted

| File | Lines | Purpose |
|------|-------|---------|
| types.ts | 140 | GraphQL & config types |
| introspection.ts | 150 | Schema fetching from GraphQL endpoints |
| analyzer.ts | 400 | Schema analysis engine |
| ai-config-generator.ts | 350 | AI integration & config generation |
| free-ai-providers.ts | 200 | Free AI provider implementations |
| **Total** | **1,250** | **Core logic** |

## Key Characteristics

- **Zero Dependencies** - Only uses Node.js built-in APIs
- **Pure Logic** - No UI framework dependencies
- **TypeScript** - Full type safety
- **Modular** - Granular exports for tree-shaking

## Three Phases

### Phase 1: Create orion-schema Repository
```
orion-schema/
├── src/
│   ├── types.ts
│   ├── introspection.ts
│   ├── analyzer.ts
│   ├── ai-config-generator.ts
│   ├── free-ai-providers.ts
│   └── index.ts
├── package.json (zero dependencies)
├── tsconfig.json
├── README.md
└── LICENSE
```

### Phase 2: Update orion-cli
```
1. Add @orion/schema to dependencies
2. Remove src/schema/ directory
3. Update imports: "../../schema" → "@orion/schema"
4. Run npm install & npm run build
```

### Phase 3: Update orion-console
```
1. Add @orion/schema to packages/server/package.json
2. Create packages/server/src/routes/schema.ts
3. Add API endpoints:
   - POST /api/schema/analyze
   - POST /api/schema/generate-config
4. Update client to call new endpoints
5. Run npm install & npm run build
```

## Module Exports

### Main Export
```typescript
import { 
  fetchSchema, 
  analyzeSchema, 
  generateCacheConfig 
} from "@orion/schema"
```

### Granular Exports
```typescript
import { fetchSchema } from "@orion/schema/introspection"
import { analyzeSchema } from "@orion/schema/analyzer"
import { generateCacheConfig } from "@orion/schema/ai-config"
import { callFreeAI } from "@orion/schema/free-ai"
```

## Usage Examples

### CLI Usage
```typescript
const schema = await fetchSchema({ endpoint: "..." })
const analyzed = analyzeSchema(schema)
const config = await generateCacheConfig({ 
  schema: analyzed, 
  aiConfig: { provider: "ollama" }
})
```

### Console Server Usage
```typescript
app.post("/api/schema/analyze", async (req, res) => {
  const { endpoint } = req.body
  const schema = await fetchSchema({ endpoint })
  const analyzed = analyzeSchema(schema)
  res.json(analyzed)
})
```

### Console Client Usage
```typescript
const response = await fetch("/api/schema/analyze", {
  method: "POST",
  body: JSON.stringify({ endpoint })
})
const analyzed = await response.json()
```

## Files That Need Updates

### orion-cli
- [ ] package.json - Add @orion/schema dependency
- [ ] src/workflows/handlers/schema.ts - Update imports
- [ ] src/workflows/handlers/index.ts - Update imports
- [ ] src/workflows/menus/cache-menu.ts - Update imports

### orion-console/packages/server
- [ ] package.json - Add @orion/schema dependency
- [ ] src/routes/schema.ts - Create new file with endpoints
- [ ] src/index.ts - Register schema routes

## Benefits

| Aspect | Benefit |
|--------|---------|
| **Reusability** | Both CLI and console use same logic |
| **Maintainability** | Single source of truth |
| **Testability** | Can test independently |
| **Scalability** | Easy to add new providers/features |
| **Flexibility** | Can publish to npm later |
| **Independence** | Can be used by other projects |

## Potential Challenges

| Challenge | Solution |
|-----------|----------|
| Circular dependencies | Keep orion-schema independent |
| Version sync | Use semantic versioning |
| Development workflow | Use npm link during development |
| Breaking changes | Deprecation warnings + changelog |

## Timeline

- **Phase 1** (Create repo): 30 minutes
- **Phase 2** (Update CLI): 15 minutes
- **Phase 3** (Update console): 45 minutes
- **Testing**: 30 minutes
- **Total**: ~2 hours

## Next Steps

1. Review this plan
2. Create orion-schema repository
3. Copy files from orion-cli/src/schema/
4. Create configuration files
5. Update orion-cli imports
6. Update orion-console imports
7. Test both applications
8. Commit changes

## Questions to Consider

1. Should orion-schema be published to npm?
2. Should it have its own GitHub repository?
3. Should it have unit tests?
4. Should it have a CLI tool?
5. Should it support other AI providers?

---

**Status:** Plan Ready for Implementation
**Complexity:** Low (straightforward refactoring)
**Risk:** Low (no breaking changes to existing code)
**Effort:** ~2 hours
