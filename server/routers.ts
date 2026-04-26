import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";

// OpenAI DALL-E 3 direct call using the user-provided OPENAI_API_KEY
async function generateAnimeCharacter(options: {
  photoBase64: string;
  mimeType: string;
  element: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const elementDescriptions: Record<string, string> = {
    火: "fire element fighter with flames, volcanic power, intense red and orange aura",
    水: "water element fighter with ocean waves, ice crystals, cool blue and cyan aura",
    草: "grass element fighter with nature magic, forest vines, vibrant green aura",
    闇: "dark element fighter with shadows, mystical moon energy, deep purple and black aura",
  };

  const elementDesc = elementDescriptions[options.element] || "powerful fighter";

  // Step 1: Use GPT-4o to analyze the uploaded photo and describe the person
  const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${options.mimeType};base64,${options.photoBase64}`,
                detail: "low",
              },
            },
            {
              type: "text",
              text: "Describe this person's key physical features (gender, hair color/style, face shape, skin tone, approximate age) in 2-3 sentences. Be concise and focus only on visual characteristics.",
            },
          ],
        },
      ],
    }),
  });

  if (!visionResponse.ok) {
    const err = await visionResponse.json().catch(() => ({}));
    throw new Error(`Vision API error: ${err?.error?.message || visionResponse.status}`);
  }

  const visionData = await visionResponse.json();
  const personDescription = visionData.choices?.[0]?.message?.content || "a person";

  // Step 2: Generate anime character with DALL-E 3
  const dallePrompt = `90s retro anime style trading card character illustration.
Style: Classic 1990s Japanese fighting game anime art (like Street Fighter, Dragon Ball Z, Fatal Fury).
Cell-shaded animation with bold black outlines, high contrast colors, dramatic lighting.
Strong halftone dot patterns, visible ink lines, slightly rough texture like hand-drawn cels.
Character based on: ${personDescription}
Theme: ${elementDesc}
Pose: Dynamic battle stance, full body or upper body, powerful and heroic.
Background: Clean white or simple gradient, suitable for a trading card.
DO NOT include any text or logos in the image.`;

  const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: dallePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    }),
  });

  if (!dalleResponse.ok) {
    const err = await dalleResponse.json().catch(() => ({}));
    throw new Error(`DALL-E 3 error: ${err?.error?.message || dalleResponse.status}`);
  }

  const dalleData = await dalleResponse.json();
  const b64 = dalleData.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("No image data returned from DALL-E 3");
  }

  // Upload to storage and return URL
  const buffer = Buffer.from(b64, "base64");
  const { url } = await storagePut(
    `anime-converted/${Date.now()}.png`,
    buffer,
    "image/png"
  );

  return url;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // AI anime conversion endpoint
  card: router({
    convertToAnime: publicProcedure
      .input(
        z.object({
          photoBase64: z.string().min(1),
          mimeType: z.string().default("image/jpeg"),
          element: z.enum(["火", "水", "草", "闇"]),
        })
      )
      .mutation(async ({ input }) => {
        const imageUrl = await generateAnimeCharacter({
          photoBase64: input.photoBase64,
          mimeType: input.mimeType,
          element: input.element,
        });
        return { imageUrl };
      }),
  }),
});

export type AppRouter = typeof appRouter;
