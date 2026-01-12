/**
 * Type utilities for schema analysis
 */

import type { IntrospectionTypeRef } from "../types.js";

/**
 * Result of unwrapping a GraphQL type reference
 */
export interface UnwrappedType {
  typeName: string;
  isNonNull: boolean;
  isList: boolean;
}

/**
 * Unwrap NON_NULL and LIST wrappers from a type reference
 */
export function unwrapType(typeRef: IntrospectionTypeRef): UnwrappedType {
  let isNonNull = false;
  let isList = false;
  let current = typeRef;

  // Unwrap NON_NULL and LIST wrappers
  while (current.ofType) {
    if (current.kind === "NON_NULL") {
      isNonNull = true;
    } else if (current.kind === "LIST") {
      isList = true;
    }
    current = current.ofType;
  }

  return {
    typeName: current.name || "Unknown",
    isNonNull,
    isList,
  };
}
