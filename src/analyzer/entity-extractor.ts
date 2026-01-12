/**
 * Entity extraction from GraphQL schema
 */

import type {
  IntrospectionType,
  IntrospectionField,
  EntityType,
  FieldInfo,
  EntityCharacteristics,
} from "../types.js";

import {
  BUILT_IN_TYPES,
  VOLATILE_FIELD_PATTERNS,
  USER_SPECIFIC_PATTERNS,
  SENSITIVE_FIELD_PATTERNS,
} from "./constants.js";
import { unwrapType } from "./type-utils.js";

/**
 * Extract entity types from schema types
 */
export function extractEntities(
  types: IntrospectionType[],
  typeMap: Map<string, IntrospectionType>
): EntityType[] {
  const entities: EntityType[] = [];

  for (const type of types) {
    // Skip built-in types and non-object types
    if (BUILT_IN_TYPES.has(type.name) || type.name.startsWith("__")) {
      continue;
    }

    if (type.kind !== "OBJECT" || !type.fields) {
      continue;
    }

    // Check if this type has an ID field (makes it an entity)
    const hasId = type.fields.some(
      (f) => f.name === "id" || f.name === "_id" || f.name === "ID"
    );

    // Extract field information
    const fields = type.fields.map((f) => extractFieldInfo(f));

    // Find referenced types
    const references = findReferencedTypes(type.fields, typeMap);

    // Analyze characteristics
    const characteristics = analyzeCharacteristics(type, fields);

    entities.push({
      name: type.name,
      description: type.description,
      hasId,
      fields,
      references,
      referencedBy: [], // Will be filled in later
      characteristics,
    });
  }

  return entities;
}

/**
 * Extract field information from an introspection field
 */
function extractFieldInfo(field: IntrospectionField): FieldInfo {
  const { typeName, isNonNull, isList } = unwrapType(field.type);

  return {
    name: field.name,
    typeName,
    isNonNull,
    isList,
    description: field.description,
  };
}

/**
 * Find types referenced by fields
 */
function findReferencedTypes(
  fields: IntrospectionField[],
  typeMap: Map<string, IntrospectionType>
): string[] {
  const references = new Set<string>();

  for (const field of fields) {
    const { typeName } = unwrapType(field.type);

    // Check if this is a reference to another object type
    const referencedType = typeMap.get(typeName);
    if (
      referencedType &&
      referencedType.kind === "OBJECT" &&
      !BUILT_IN_TYPES.has(typeName) &&
      !typeName.startsWith("__")
    ) {
      references.add(typeName);
    }
  }

  return [...references];
}

/**
 * Analyze entity characteristics for caching decisions
 */
function analyzeCharacteristics(
  type: IntrospectionType,
  fields: FieldInfo[]
): EntityCharacteristics {
  const fieldNames = fields.map((f) => f.name.toLowerCase());

  const isVolatile = VOLATILE_FIELD_PATTERNS.some((pattern) =>
    fieldNames.some((name) => name.includes(pattern.toLowerCase()))
  );

  const isUserSpecific = USER_SPECIFIC_PATTERNS.some((pattern) =>
    fieldNames.some((name) => name.includes(pattern.toLowerCase()))
  );

  const hasSensitiveFields = SENSITIVE_FIELD_PATTERNS.some((pattern) =>
    fieldNames.some((name) => name.includes(pattern.toLowerCase()))
  );

  const isCollection =
    type.name.endsWith("Connection") ||
    type.name.endsWith("Edge") ||
    type.name.endsWith("List") ||
    type.name.endsWith("Page");

  const isRootType =
    type.name === "Query" ||
    type.name === "Mutation" ||
    type.name === "Subscription";

  return {
    isVolatile,
    isUserSpecific,
    isCollection,
    hasSensitiveFields,
    isRootType,
  };
}
