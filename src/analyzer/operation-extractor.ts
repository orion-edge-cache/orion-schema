/**
 * Operation (query/mutation) extraction from GraphQL schema
 */

import type {
  IntrospectionType,
  OperationType,
  ArgumentInfo,
} from "../types.js";

import { BUILT_IN_TYPES, MUTATION_PATTERNS } from "./constants.js";
import { unwrapType } from "./type-utils.js";

/**
 * Extract operations from a root type (Query or Mutation)
 */
export function extractOperations(
  rootType: IntrospectionType | undefined,
  typeMap: Map<string, IntrospectionType>,
  operationType: "query" | "mutation"
): OperationType[] {
  if (!rootType || !rootType.fields) {
    return [];
  }

  return rootType.fields.map((field) => {
    const { typeName, isList } = unwrapType(field.type);

    const args: ArgumentInfo[] = field.args.map((arg) => {
      const argType = unwrapType(arg.type);
      return {
        name: arg.name,
        typeName: argType.typeName,
        isRequired: argType.isNonNull,
        description: arg.description,
      };
    });

    // For mutations, try to infer affected types
    const affectedTypes =
      operationType === "mutation"
        ? inferAffectedTypes(field.name, typeName, typeMap)
        : [];

    return {
      name: field.name,
      description: field.description,
      returnType: typeName,
      returnsList: isList,
      arguments: args,
      affectedTypes,
    };
  });
}

/**
 * Infer which types a mutation affects based on name and return type
 */
function inferAffectedTypes(
  mutationName: string,
  returnType: string,
  typeMap: Map<string, IntrospectionType>
): string[] {
  const affected = new Set<string>();

  // Add return type if it's an entity
  const returnTypeInfo = typeMap.get(returnType);
  if (
    returnTypeInfo &&
    returnTypeInfo.kind === "OBJECT" &&
    !BUILT_IN_TYPES.has(returnType)
  ) {
    affected.add(returnType);
  }

  // Try to infer from mutation name patterns
  const lowerName = mutationName.toLowerCase();
  for (const [pattern, extractor] of Object.entries(MUTATION_PATTERNS)) {
    if (lowerName.startsWith(pattern)) {
      const types = extractor(mutationName);
      for (const type of types) {
        if (type && typeMap.has(type)) {
          affected.add(type);
        }
      }
    }
  }

  return [...affected];
}
