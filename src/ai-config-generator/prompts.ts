/**
 * Prompt construction for AI cache config generation
 */

import type { AnalyzedSchema, ConfigPreferences } from "../types.js";
import { generateSchemaSummary } from "../analyzer.js";

/**
 * Build the system prompt for cache config generation
 */
export function buildSystemPrompt(): string {
  return `You are an expert in GraphQL caching strategies and CDN configuration. Your task is to analyze a GraphQL schema and recommend optimal caching rules for an edge caching layer.

## Caching Concepts

1. **maxAge**: How long (in seconds) a response can be served from cache before it's considered stale.
   - Short (60-300s): For frequently changing data
   - Medium (300-900s): For moderately stable data
   - Long (900-3600s): For rarely changing data

2. **staleWhileRevalidate**: Time (in seconds) during which stale content can be served while fresh content is fetched in the background.
   - Improves perceived performance
   - Good for data that's acceptable to be slightly outdated

3. **staleIfError**: Time (in seconds) during which stale content can be served if the origin returns an error.
   - Improves reliability
   - Good for critical data that should always be available

4. **scope**:
   - "public": Can be cached by shared caches (CDN). Use for data that's the same for all users.
   - "private": Can only be cached by user's browser. Use for user-specific data.

5. **passthrough**: When true, bypasses cache entirely. Use for:
   - Real-time data that must always be fresh
   - Highly sensitive data
   - Data that changes on every request

## Guidelines

1. **Entity Types with ID fields** are good candidates for caching with surrogate keys
2. **User-specific data** (containing userId, author, etc.) should typically be "private"
3. **Volatile data** (with updatedAt, viewCount, etc.) needs shorter TTLs
4. **Sensitive data** (email, password, etc.) should be "private" or passthrough
5. **List queries** benefit from staleWhileRevalidate for pagination
6. **Mutations** should always invalidate related cache entries

## Output Format

Respond with a JSON object containing:
- rules: Array of cache rules with types, maxAge, staleWhileRevalidate, staleIfError, scope, passthrough, and reasoning
- invalidations: Object mapping mutation names to arrays of type patterns to invalidate
- explanation: Overall explanation of the caching strategy
- confidence: Number 0-1 indicating confidence in recommendations
- warnings: Array of potential issues or considerations

Be specific and practical. Consider real-world usage patterns.`;
}

/**
 * Build the user prompt with schema analysis and preferences
 */
export function buildUserPrompt(
  schema: AnalyzedSchema,
  preferences?: ConfigPreferences
): string {
  const summary = generateSchemaSummary(schema);

  let prompt = `Analyze the following GraphQL schema and generate caching configuration:\n\n${summary}\n`;

  if (preferences) {
    prompt += "\n## User Preferences\n\n";

    if (preferences.defaultTtl) {
      const ttlMap = { short: "60-300s", medium: "300-900s", long: "900-3600s" };
      prompt += `- Preferred default TTL: ${preferences.defaultTtl} (${ttlMap[preferences.defaultTtl]})\n`;
    }

    if (preferences.aggressiveCaching !== undefined) {
      prompt += `- Aggressive caching: ${preferences.aggressiveCaching ? "Yes, prioritize performance" : "No, prioritize freshness"}\n`;
    }

    if (preferences.noCacheTypes && preferences.noCacheTypes.length > 0) {
      prompt += `- Types that should never be cached: ${preferences.noCacheTypes.join(", ")}\n`;
    }

    if (preferences.privateTypes && preferences.privateTypes.length > 0) {
      prompt += `- Types that should be private (user-specific): ${preferences.privateTypes.join(", ")}\n`;
    }

    if (preferences.customHints) {
      prompt += `- Additional context: ${preferences.customHints}\n`;
    }
  }

  prompt += `
Generate a comprehensive caching configuration. Consider:
1. Which types should be cached and for how long
2. Which types need private scope
3. Which types should bypass cache entirely
4. What invalidation rules should apply when mutations occur

Respond with valid JSON only.`;

  return prompt;
}
