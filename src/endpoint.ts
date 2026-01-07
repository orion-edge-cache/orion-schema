/**
 * Endpoint Discovery
 *
 * Functions for discovering GraphQL endpoint from terraform state
 */

import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import type { EndpointReachabilityResult } from "./types.js";

// =============================================================================
// CONSTANTS
// =============================================================================

const ORION_CONFIG_DIR = path.join(os.homedir(), ".config/orion");
const TFSTATE_PATH = path.join(ORION_CONFIG_DIR, "terraform.tfstate");

// =============================================================================
// ENDPOINT FUNCTIONS
// =============================================================================

/**
 * Check if terraform state file exists
 */
export function terraformStateExists(): boolean {
  return existsSync(TFSTATE_PATH);
}

/**
 * Get the terraform state file path
 */
export function getTerraformStatePath(): string {
  return TFSTATE_PATH;
}

/**
 * Get GraphQL endpoint from terraform state
 * Always uses: outputs.compute_service.value.backend_domain
 */
export async function getGraphQLEndpointFromTerraform(): Promise<
  string | null
> {
  try {
    if (!existsSync(TFSTATE_PATH)) {
      return null;
    }

    const content = await readFile(TFSTATE_PATH, "utf-8");
    const tfstate = JSON.parse(content);

    // Specific path driven by @orion-infra package
    const computeDomain =
      tfstate.outputs?.compute_service?.value?.backend_domain;
    const protocol = tfstate.outputs?.compute_service?.value?.backend_protocol;
    const graphqlEndpoint = `${protocol}://${computeDomain}/graphql`;

    return graphqlEndpoint || null;
  } catch (error) {
    console.error("Failed to read terraform state:", error);
    return null;
  }
}

/**
 * Test if GraphQL endpoint is reachable
 * Uses a simple introspection query with 5 second timeout
 */
export async function testEndpointReachability(
  endpoint: string,
): Promise<EndpointReachabilityResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query {
            __schema {
              types {
                name
              }
            }
          }
        `,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        reachable: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      // Check if it's just introspection disabled (endpoint is still reachable)
      const firstError = data.errors[0];
      if (
        firstError.message &&
        firstError.message.toLowerCase().includes("introspection")
      ) {
        // Endpoint is reachable but introspection is disabled
        return {
          reachable: true,
        };
      }

      return {
        reachable: false,
        error: `GraphQL error: ${firstError.message}`,
      };
    }

    return { reachable: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          reachable: false,
          error: "Request timed out (5 seconds)",
        };
      }
      return {
        reachable: false,
        error: error.message,
      };
    }
    return {
      reachable: false,
      error: "Unknown error",
    };
  }
}
