/**
 * Config conversion and generation utilities
 */

import type {
  AIConfigResponse,
  ConfigPreferences,
  OrionCacheConfig,
  OrionCacheRule,
  AnalyzedSchema,
} from "../types.js";

/**
 * Converts AI response to Orion cache config format
 */
export function convertToOrionConfig(
  aiResponse: AIConfigResponse,
  preferences?: ConfigPreferences
): OrionCacheConfig {
  // Determine default TTL based on preferences
  let defaultMaxAge = 300; // 5 minutes default
  if (preferences?.defaultTtl === "short") {
    defaultMaxAge = 60;
  } else if (preferences?.defaultTtl === "long") {
    defaultMaxAge = 900;
  }

  // Convert AI rules to Orion format (strip reasoning)
  const rules: OrionCacheRule[] = aiResponse.rules.map((rule) => {
    const orionRule: OrionCacheRule = {
      types: rule.types,
    };

    if (rule.maxAge !== undefined) {
      orionRule.maxAge = rule.maxAge;
    }
    if (rule.staleWhileRevalidate !== undefined && rule.staleWhileRevalidate > 0) {
      orionRule.staleWhileRevalidate = rule.staleWhileRevalidate;
    }
    if (rule.staleIfError !== undefined && rule.staleIfError > 0) {
      orionRule.staleIfError = rule.staleIfError;
    }
    if (rule.scope) {
      orionRule.scope = rule.scope;
    }
    if (rule.passthrough) {
      orionRule.passthrough = true;
    }

    return orionRule;
  });

  return {
    version: "1.0",
    name: "orion",
    defaults: {
      maxAge: defaultMaxAge,
      staleWhileRevalidate: 0,
      staleIfError: 0,
    },
    rules,
    invalidations: aiResponse.invalidations,
  };
}

/**
 * Generates a basic cache configuration without AI.
 * Uses heuristics based on schema analysis.
 */
export function generateBasicConfig(schema: AnalyzedSchema): OrionCacheConfig {
  const rules: OrionCacheRule[] = [];

  // Group entities by characteristics
  const volatileTypes: string[] = [];
  const userSpecificTypes: string[] = [];
  const sensitiveTypes: string[] = [];
  const stableTypes: string[] = [];

  for (const entity of schema.entities) {
    if (entity.characteristics.isRootType) continue;

    if (entity.characteristics.hasSensitiveFields) {
      sensitiveTypes.push(entity.name);
    } else if (entity.characteristics.isUserSpecific) {
      userSpecificTypes.push(entity.name);
    } else if (entity.characteristics.isVolatile) {
      volatileTypes.push(entity.name);
    } else {
      stableTypes.push(entity.name);
    }
  }

  // Create rules for each group
  if (sensitiveTypes.length > 0) {
    rules.push({
      types: sensitiveTypes,
      scope: "private",
      maxAge: 60,
    });
  }

  if (userSpecificTypes.length > 0) {
    rules.push({
      types: userSpecificTypes,
      scope: "private",
      maxAge: 300,
      staleWhileRevalidate: 60,
    });
  }

  if (volatileTypes.length > 0) {
    rules.push({
      types: volatileTypes,
      maxAge: 60,
      staleWhileRevalidate: 30,
    });
  }

  if (stableTypes.length > 0) {
    rules.push({
      types: stableTypes,
      maxAge: 900,
      staleWhileRevalidate: 300,
      staleIfError: 3600,
    });
  }

  // Generate invalidation rules from mutations
  const invalidations: Record<string, string[]> = {};

  for (const mutation of schema.mutations) {
    if (mutation.affectedTypes.length > 0) {
      // Create pattern for each affected type
      const patterns = mutation.affectedTypes.map((type) => `${type}:*`);
      invalidations[mutation.name] = patterns;
    }
  }

  return {
    version: "1.0",
    name: "orion",
    defaults: {
      maxAge: 300,
      staleWhileRevalidate: 60,
      staleIfError: 0,
    },
    rules,
    invalidations,
  };
}
