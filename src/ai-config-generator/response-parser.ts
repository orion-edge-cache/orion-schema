/**
 * AI response parsing utilities
 */

import type { AIConfigResponse, GeneratedCacheRule } from "../types.js";

/**
 * Parse an AI provider's response text into structured config
 */
export function parseAIResponse(responseText: string): AIConfigResponse {
  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = responseText;

  // Try to extract from code block
  const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!Array.isArray(parsed.rules)) {
      throw new Error("Missing or invalid 'rules' array");
    }

    // Ensure all rules have required fields
    const rules: GeneratedCacheRule[] = parsed.rules.map(
      (rule: Partial<GeneratedCacheRule>) => ({
        types: rule.types || [],
        maxAge: rule.maxAge ?? 300,
        staleWhileRevalidate: rule.staleWhileRevalidate,
        staleIfError: rule.staleIfError,
        scope: rule.scope,
        passthrough: rule.passthrough,
        reasoning: rule.reasoning || "No reasoning provided",
      })
    );

    return {
      rules,
      invalidations: parsed.invalidations || {},
      explanation: parsed.explanation || "No explanation provided",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };
  } catch (error) {
    throw new Error(
      `Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
