/**
 * Schema summary generation for AI prompts
 */

import type { AnalyzedSchema } from "../types.js";

/**
 * Generates a human-readable summary of the analyzed schema.
 * This is useful for AI prompts and debugging.
 */
export function generateSchemaSummary(schema: AnalyzedSchema): string {
  const lines: string[] = [];

  lines.push("# GraphQL Schema Analysis\n");

  // Entities
  lines.push("## Entity Types\n");
  for (const entity of schema.entities) {
    if (entity.characteristics.isRootType) continue;

    lines.push(`### ${entity.name}`);
    if (entity.description) {
      lines.push(`Description: ${entity.description}`);
    }

    lines.push(`- Has ID: ${entity.hasId}`);
    lines.push(`- Fields: ${entity.fields.map((f) => f.name).join(", ")}`);

    if (entity.references.length > 0) {
      lines.push(`- References: ${entity.references.join(", ")}`);
    }
    if (entity.referencedBy.length > 0) {
      lines.push(`- Referenced by: ${entity.referencedBy.join(", ")}`);
    }

    const chars = entity.characteristics;
    const traits: string[] = [];
    if (chars.isVolatile) traits.push("volatile");
    if (chars.isUserSpecific) traits.push("user-specific");
    if (chars.hasSensitiveFields) traits.push("has-sensitive-data");
    if (chars.isCollection) traits.push("collection");

    if (traits.length > 0) {
      lines.push(`- Characteristics: ${traits.join(", ")}`);
    }

    lines.push("");
  }

  // Queries
  lines.push("## Query Operations\n");
  for (const query of schema.queries) {
    const args = query.arguments.map((a) => `${a.name}: ${a.typeName}`).join(", ");
    const returnStr = query.returnsList
      ? `[${query.returnType}]`
      : query.returnType;
    lines.push(`- ${query.name}(${args}): ${returnStr}`);
  }
  lines.push("");

  // Mutations
  if (schema.mutations.length > 0) {
    lines.push("## Mutation Operations\n");
    for (const mutation of schema.mutations) {
      const args = mutation.arguments
        .map((a) => `${a.name}: ${a.typeName}`)
        .join(", ");
      const returnStr = mutation.returnsList
        ? `[${mutation.returnType}]`
        : mutation.returnType;
      lines.push(`- ${mutation.name}(${args}): ${returnStr}`);
      if (mutation.affectedTypes.length > 0) {
        lines.push(`  Affects: ${mutation.affectedTypes.join(", ")}`);
      }
    }
    lines.push("");
  }

  // Relationships
  if (schema.relationships.length > 0) {
    lines.push("## Type Relationships\n");
    for (const rel of schema.relationships) {
      const arrow = rel.isList ? "->>" : "->";
      lines.push(`- ${rel.from} ${arrow} ${rel.to} (via ${rel.fieldName})`);
    }
  }

  return lines.join("\n");
}
