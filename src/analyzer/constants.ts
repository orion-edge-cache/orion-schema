/**
 * Constants for schema analysis
 */

/** Built-in GraphQL types to ignore */
export const BUILT_IN_TYPES = new Set([
  "String",
  "Int",
  "Float",
  "Boolean",
  "ID",
  "__Schema",
  "__Type",
  "__TypeKind",
  "__Field",
  "__InputValue",
  "__EnumValue",
  "__Directive",
  "__DirectiveLocation",
]);

/** Field names that suggest volatility (frequent updates) */
export const VOLATILE_FIELD_PATTERNS = [
  "updatedAt",
  "modifiedAt",
  "lastModified",
  "lastUpdated",
  "lastSeen",
  "lastActive",
  "viewCount",
  "likeCount",
  "commentCount",
  "score",
  "rating",
  "status",
  "state",
];

/** Field names that suggest user-specific data */
export const USER_SPECIFIC_PATTERNS = [
  "userId",
  "ownerId",
  "authorId",
  "creatorId",
  "user",
  "owner",
  "author",
  "creator",
  "me",
  "currentUser",
  "viewer",
  "myProfile",
];

/** Field names that suggest sensitive data */
export const SENSITIVE_FIELD_PATTERNS = [
  "email",
  "password",
  "passwordHash",
  "token",
  "secret",
  "apiKey",
  "privateKey",
  "ssn",
  "creditCard",
  "phone",
  "address",
  "salary",
  "balance",
];

/**
 * Extract type name from mutation name
 * e.g., "createUser" -> "User", "updatePost" -> "Post"
 */
export function extractTypeFromMutation(mutationName: string, prefix: string): string {
  const withoutPrefix = mutationName.slice(prefix.length);
  return withoutPrefix.charAt(0).toUpperCase() + withoutPrefix.slice(1);
}

/** Mutation name patterns and their likely affected types */
export const MUTATION_PATTERNS: Record<string, (name: string) => string[]> = {
  create: (name) => [extractTypeFromMutation(name, "create")],
  add: (name) => [extractTypeFromMutation(name, "add")],
  insert: (name) => [extractTypeFromMutation(name, "insert")],
  update: (name) => [extractTypeFromMutation(name, "update")],
  edit: (name) => [extractTypeFromMutation(name, "edit")],
  modify: (name) => [extractTypeFromMutation(name, "modify")],
  delete: (name) => [extractTypeFromMutation(name, "delete")],
  remove: (name) => [extractTypeFromMutation(name, "remove")],
  destroy: (name) => [extractTypeFromMutation(name, "destroy")],
};
