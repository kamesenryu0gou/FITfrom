import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the card.convertToAnime tRPC procedure.
 * Validates that the procedure exists and handles invalid inputs correctly.
 * (Actual DALL-E generation is not tested here to avoid API costs.)
 */

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("card.convertToAnime", () => {
  it("procedure exists in the router", () => {
    const caller = appRouter.createCaller(createPublicContext());
    expect(typeof caller.card.convertToAnime).toBe("function");
  });

  it("rejects empty photoBase64", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.card.convertToAnime({
        photoBase64: "",
        mimeType: "image/jpeg",
        element: "火",
      })
    ).rejects.toThrow();
  });

  it("rejects invalid element", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.card.convertToAnime({
        photoBase64: "dGVzdA==",
        mimeType: "image/jpeg",
        // @ts-expect-error intentionally invalid
        element: "無効",
      })
    ).rejects.toThrow();
  });
});
