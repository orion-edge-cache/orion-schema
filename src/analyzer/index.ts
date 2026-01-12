/**
 * Schema Analyzer
 *
 * Analyzes a GraphQL schema to extract types, relationships, and characteristics
 * that inform caching decisions.
 */

import type { IntrospectionSchema, IntrospectionType, AnalyzedSchema } from "../types.js";

import { extractEntities } from "./entity-extractor.js";
import { extractOperations } from "./operation-extractor.js";
import { buildRelationships, enrichEntitiesWithRelationships } from "./relationship-builder.js";

// Re-exports
export { generateSchemaSummary } from "./summary-generator.js";

/**
 * Analyzes a GraphQL schema and extracts information useful for caching decisions.
 *
 * @param schema - The introspection schema to analyze
 * @returns Analyzed schema with entities, operations, and relationships
 */
export function analyzeSchema(schema: IntrospectionSchema): AnalyzedSchema {
  // Build type map for quick lookups
  const typeMap = new Map<string, IntrospectionType>();
  for (const type of schema.types) {
    typeMap.set(type.name, type);
  }

  // Extract entities (object types with ID fields)
  const entities = extractEntities(schema.types, typeMap);

  // Extract query operations
  const queries = schema.queryType
    ? extractOperations(typeMap.get(schema.queryType.name), typeMap, "query")
    : [];

  // Extract mutation operations
  const mutations = schema.mutationType
    ? extractOperations(
        typeMap.get(schema.mutationType.name),
        typeMap,
        "mutation"
      )
    : [];

  // Build relationship graph
  const relationships = buildRelationships(entities, typeMap);

  // Enrich entities with relationship info
  enrichEntitiesWithRelationships(entities, relationships);

  return {
    entities,
    queries,
    mutations,
    relationships,
    typeMap,
  };
}
