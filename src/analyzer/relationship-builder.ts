/**
 * Relationship building between entity types
 */

import type {
  IntrospectionType,
  EntityType,
  TypeRelationship,
} from "../types.js";

import { unwrapType } from "./type-utils.js";

/**
 * Build relationships between entity types
 */
export function buildRelationships(
  entities: EntityType[],
  typeMap: Map<string, IntrospectionType>
): TypeRelationship[] {
  const relationships: TypeRelationship[] = [];
  const entityNames = new Set(entities.map((e) => e.name));

  for (const entity of entities) {
    const type = typeMap.get(entity.name);
    if (!type || !type.fields) continue;

    for (const field of type.fields) {
      const { typeName, isList } = unwrapType(field.type);

      // Check if this field references another entity
      if (entityNames.has(typeName) && typeName !== entity.name) {
        relationships.push({
          from: entity.name,
          to: typeName,
          fieldName: field.name,
          isList,
          direction: "outgoing",
        });
      }
    }
  }

  return relationships;
}

/**
 * Enrich entities with referencedBy information
 */
export function enrichEntitiesWithRelationships(
  entities: EntityType[],
  relationships: TypeRelationship[]
): void {
  const entityMap = new Map(entities.map((e) => [e.name, e]));

  for (const rel of relationships) {
    // Add to referencedBy for the target entity
    const targetEntity = entityMap.get(rel.to);
    if (targetEntity && !targetEntity.referencedBy.includes(rel.from)) {
      targetEntity.referencedBy.push(rel.from);
    }
  }
}
