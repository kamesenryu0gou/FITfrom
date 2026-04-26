import { describe, expect, it } from "vitest";
import * as dotenv from "dotenv";
import path from "path";

// Load .env file if present
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Validates that the OPENAI_API_KEY is set and valid
 * by calling the lightweight /v1/models endpoint.
 */
describe("OpenAI API Key Validation", () => {
  it("OPENAI_API_KEY is set in environment", () => {
    const key = process.env.OPENAI_API_KEY;
    expect(key).toBeTruthy();
    expect(key?.startsWith("sk-")).toBe(true);
  });

  it("OPENAI_API_KEY is valid (can reach OpenAI API)", async () => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });

    expect(response.status).toBe(200);
  }, 15000); // 15 second timeout for network call
});
