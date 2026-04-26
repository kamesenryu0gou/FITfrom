import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";

/**
 * AI Anime Conversion — 王道ジャパニーズ・デジタルTCG風
 *
 * Strategy:
 * 1. GPT-4o (high detail) analyzes the photo and produces an exhaustive
 *    physical + clothing description to maximize resemblance.
 * 2. DALL-E 3 (HD quality) receives a tightly-structured prompt that:
 *    - Locks in every physical feature from the analysis
 *    - Applies the "Bold TCG / Yu-Gi-Oh! / Pokémon card" art style
 *    - Adds element-specific background effects
 */
async function generateAnimeCharacter(options: {
  photoBase64: string;
  mimeType: string;
  element: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  // ── Element-specific background effects ────────────────────────────────
  const elementEffects: Record<string, string> = {
    火: "blazing fire and lava eruption background, intense red-orange flame aura, volcanic sparks flying, fiery energy burst",
    水: "ocean wave and ice crystal background, cool blue water aura, aqua energy swirling, deep sea glow",
    草: "lush forest and giant leaf background, vibrant green nature aura, vines and flowers blooming, golden sunlight rays",
    闇: "dark crescent moon and cosmic void background, deep purple shadow aura, mystical dark energy, glowing arcane runes",
  };
  const bgEffect = elementEffects[options.element] || "powerful elemental energy background";

  // ── Step 1: GPT-4o detailed physical + clothing analysis ───────────────
  const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content:
            "You are an expert anime character designer specializing in Japanese trading card game art. " +
            "Analyze photos with extreme precision to capture every physical detail needed for a faithful anime likeness.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${options.mimeType};base64,${options.photoBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: `Analyze this person in exhaustive detail for creating a highly faithful anime trading card character.

Provide ALL of the following with maximum specificity:

FACE STRUCTURE:
- Face shape (oval / round / square / heart / diamond / oblong)
- Eye shape (almond / round / monolid / hooded / upturned / downturned) and color (be exact: dark brown / hazel green / light blue / etc.)
- Eyebrow thickness and arch (thin arched / thick straight / bushy / etc.)
- Nose shape (button / aquiline / flat / narrow / wide)
- Lip shape (thin / full / heart-shaped / wide)
- Distinctive facial features: dimples, freckles, strong jawline, high cheekbones, cleft chin, etc.
- Approximate age range and gender expression

HAIR:
- Exact color (jet black / dark brown / chestnut / auburn / dirty blonde / platinum / silver / etc.)
- Length (very short / short / medium / long / very long)
- Style in detail (straight and smooth / wavy / curly / spiky / undercut / side-swept / tied back in ponytail / bun / braids / bangs: yes/no and style)
- Texture (fine / thick / voluminous / flat)

SKIN:
- Tone (fair porcelain / light ivory / medium beige / warm tan / olive / deep brown / rich dark)
- Undertone if visible (warm / cool / neutral)

BODY:
- Build (slim / lean athletic / average / stocky / muscular / plus-size)
- Approximate height impression (petite / average / tall)

CLOTHING (describe every visible item):
- Top: exact color(s), garment type (t-shirt / hoodie / jacket / shirt / dress / etc.), any visible patterns, logos, graphics, or text
- Bottom if visible: color, type
- Outerwear if any
- Accessories: glasses (frame style and color), earrings, necklace, hat/cap (color and style), watch, etc.
- Overall style vibe (casual / sporty / formal / streetwear / etc.)

EXPRESSION & POSE:
- Current facial expression
- Any notable posture or gesture

Be extremely specific — every detail will be used to draw an anime character that is immediately recognizable as this person.`,
            },
          ],
        },
      ],
    }),
  });

  if (!visionResponse.ok) {
    const err = await visionResponse.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Vision API error: ${err?.error?.message || visionResponse.status}`);
  }

  const visionData = await visionResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
  const personDescription = visionData.choices?.[0]?.message?.content || "a person";

  // ── Step 2: DALL-E 3 HD generation ────────────────────────────────────
  const dallePrompt = `Create a Japanese trading card game character illustration in the style of Yu-Gi-Oh! and Pokémon card art.

The character MUST be a faithful anime likeness of this specific person:
${personDescription}

CRITICAL RESEMBLANCE RULES — these MUST be preserved exactly:
• Same hair color, hair length, and hair style as described above
• Same face shape, eye shape, and eye color as described above
• Same skin tone as described above
• Same clothing colors, garment types, and any distinctive patterns or accessories
• The character must be IMMEDIATELY RECOGNIZABLE as an anime version of this exact person

ART STYLE — Japanese Digital TCG (Yu-Gi-Oh! / Pokémon card quality):
• Bold, thick black cel-shading outlines on the character
• Vibrant, saturated digital coloring with clean gradients
• Strong, focused light source illuminating the character from above-front
• Flashy background effects: ${bgEffect}
• Large elemental symbol or energy burst behind the character
• Dynamic, heroic battle pose — upper body or 3/4 body shot
• High-gloss, polished digital illustration finish
• Professional trading card game artwork quality

COMPOSITION:
• Character centered and prominent, filling most of the frame
• Dramatic elemental background with depth and energy
• NO text, NO card borders, NO watermarks, NO logos in the image
• Portrait orientation, suitable for a trading card character slot`;

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
      quality: "hd",
      response_format: "b64_json",
    }),
  });

  if (!dalleResponse.ok) {
    const err = await dalleResponse.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`DALL-E 3 error: ${err?.error?.message || dalleResponse.status}`);
  }

  const dalleData = await dalleResponse.json() as { data?: Array<{ b64_json?: string }> };
  const b64 = dalleData.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data returned from DALL-E 3");

  // Upload to storage
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
      return { success: true } as const;
    }),
  }),

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
