import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";

/**
 * AI Anime Conversion — Semi-chibi JRPG Style · 5-Class Random
 *
 * Strategy:
 * 1. GPT-4o (high detail) performs a "Likeness-First" analysis:
 *    face structure, hair, skin, body, clothing — with explicit instruction
 *    to prioritize facial identity markers above all else.
 * 2. DALL-E 3 (HD, style=natural) receives one of 5 character prompts
 *    (Hero / Priest / Mage / Demon Lord / Swordsman) randomly selected.
 *    Each prompt leads with the [IDENTITY PRESERVATION RULE] block,
 *    uses "Dragon Quest-style Cosplay/Outfit" (outfit only, not face),
 *    and "Semi-chibi" proportions to retain facial detail.
 */

// ── Shared Identity Preservation Rule ─────────────────────────────────────
const IDENTITY_RULE = `[IDENTITY PRESERVATION RULE]
Primary Goal: Create a "Stylized Anime Portrait" that is INSTANTLY RECOGNIZABLE as the specific person described below.

Face Mapping (HIGHEST PRIORITY):
- Maintain the EXACT eye shape, eyebrow thickness and arch, hairstyle, hair color, facial hair (if any), glasses (if any), and facial proportions of the original person.
- Do NOT replace the face with a generic anime face. Instead, CONVERT the actual face features into the target art style while keeping ALL personal identifiers intact.
- Caricature Approach: Amplify the most distinctive facial features (strong jaw, wide eyes, thick brows, etc.) to make the character MORE recognizable, not less.

Likeness Over Style: If there is any conflict between "anime style" and "facial likeness", ALWAYS prioritize facial likeness. The outfit and background follow the style; the face follows the person.`;

// ── 5 Character Prompts — Likeness First ──────────────────────────────────
const CHARACTER_PROMPTS: Record<string, (description: string) => string> = {

  Hero: (description: string) => `${IDENTITY_RULE}

Character Description (extract and faithfully reproduce EVERY physical feature listed below):
${description}

Art Direction:
- Style: Semi-chibi (stylized proportions but keeping full facial detail — NOT over-deformed)
- Outfit: Dragon Quest-style Cosplay/Outfit — fantasy hero costume (light armor, cape, sword) applied ON TOP of the person's body. The OUTFIT follows the JRPG theme; the FACE follows the person.
- Line art: Clean bold anime outlines, clear cel shading, minimal gradients
- Color: Bright natural fantasy tones; preserve original clothing color palette exactly
- Background: Simple flat color or soft gradient derived from dominant clothing color

Pose & Proportions:
- Slightly enlarged head relative to body (semi-chibi scale), but facial features remain detailed and true to the person
- Preserve original pose, stance, and gesture from the description
- Do NOT distort or over-simplify the face

Style Consistency:
- Consistent JRPG illustration style across all generations
- Same line thickness, eye rendering method, and cel-shading approach
- Original character design only — NOT copying any existing Dragon Quest character

Output: 1:1 square, centered, high-quality 2D anime illustration suitable for a trading card.
Avoid photorealism, 3D rendering, western cartoon style, painterly textures, complex backgrounds.`,

  Priest: (description: string) => `${IDENTITY_RULE}

Character Description (extract and faithfully reproduce EVERY physical feature listed below):
${description}

Art Direction:
- Style: Semi-chibi (stylized proportions but keeping full facial detail — NOT over-deformed)
- Outfit: Dragon Quest-style Cosplay/Outfit — fantasy priest/healer costume (robe, staff, holy accessory) applied ON TOP of the person's body. The OUTFIT follows the JRPG theme; the FACE follows the person.
- Line art: Clean bold anime outlines, clear cel shading, minimal gradients
- Color: Bright natural fantasy tones; preserve original clothing color palette exactly
- Background: Simple flat color or soft gradient derived from dominant clothing color

Pose & Proportions:
- Slightly enlarged head relative to body (semi-chibi scale), but facial features remain detailed and true to the person
- Preserve original pose, posture, and calm expression from the description
- Gentle and warm impression while matching the original face exactly

Style Consistency:
- Consistent JRPG illustration style across all generations
- Same line thickness, eye rendering method, and cel-shading approach
- Original character design only — NOT copying any existing Dragon Quest character

Output: 1:1 square, centered, consistent JRPG game-icon quality.
Avoid realism, 3D rendering, dramatic lighting, over-simplified faces.`,

  Mage: (description: string) => `${IDENTITY_RULE}

Character Description (extract and faithfully reproduce EVERY physical feature listed below):
${description}

Art Direction:
- Style: Semi-chibi (stylized proportions but keeping full facial detail — NOT over-deformed)
- Outfit: Dragon Quest-style Cosplay/Outfit — fantasy mage costume (robe, pointed hat, magic staff, subtle magic effects) applied ON TOP of the person's body. The OUTFIT follows the JRPG theme; the FACE follows the person.
- Line art: Clean bold anime outlines, clear cel shading, minimal gradients
- Color: Bright natural fantasy tones; preserve original clothing color palette exactly
- Background: Simple flat color or soft gradient derived from dominant clothing color

Pose & Proportions:
- Slightly enlarged head relative to body (semi-chibi scale), but facial features remain detailed and true to the person
- Maintain original pose, silhouette, hand position, and body orientation from the description
- Do NOT distort or over-simplify the face

Style Consistency:
- Consistent JRPG illustration style across all generations
- Same line thickness, eye rendering method, and cel-shading approach
- Original character design only — NOT copying any existing Dragon Quest character

Output: 1:1 square, centered, polished 2D anime illustration.
Avoid photorealism, 3D, painterly styles, generic anime faces.`,

  DemonLord: (description: string) => `${IDENTITY_RULE}

Character Description (extract and faithfully reproduce EVERY physical feature listed below):
${description}

Art Direction:
- Style: Semi-chibi (stylized proportions but keeping full facial detail — NOT over-deformed)
- Outfit: Dragon Quest-style Cosplay/Outfit — fantasy demon lord costume (dark cloak, decorative horns or crown, subtle magical aura) applied ON TOP of the person's body. The OUTFIT follows the JRPG theme; the FACE follows the person.
- Line art: Clean bold anime outlines, clear cel shading, minimal gradients
- Color: Bright natural fantasy tones with dark accents; preserve original clothing color palette exactly
- Background: Simple flat color or soft gradient derived from dominant clothing color

Pose & Proportions:
- Slightly enlarged head relative to body (semi-chibi scale), but facial features remain detailed and true to the person
- Preserve original pose, stance, and gesture; slightly confident or intense expression
- Slightly intimidating but still cute and stylized — do NOT make grotesque

Style Consistency:
- Consistent JRPG illustration style across all generations
- Same line thickness, eye rendering method, and cel-shading approach
- Original character design only — NOT copying any existing Dragon Quest character

Output: 1:1 square, centered, polished 2D Japanese RPG illustration.
Avoid realism, 3D, grotesque or horror elements, over-simplified faces.`,

  Swordsman: (description: string) => `${IDENTITY_RULE}

Character Description (extract and faithfully reproduce EVERY physical feature listed below):
${description}

Art Direction:
- Style: Semi-chibi (stylized proportions but keeping full facial detail — NOT over-deformed)
- Outfit: Dragon Quest-style Cosplay/Outfit — fantasy swordsman costume (light armor, leather gear, sword or dual blades) applied ON TOP of the person's body. The OUTFIT follows the JRPG theme; the FACE follows the person.
- Line art: Clean bold anime outlines, clear cel shading, minimal gradients
- Color: Bright natural fantasy tones; preserve original clothing color palette exactly
- Background: Simple flat color or soft gradient derived from dominant clothing color

Pose & Proportions:
- Slightly enlarged head relative to body (semi-chibi scale), but facial features remain detailed and true to the person
- Faithfully preserve original pose, stance, body angle, arm position, and gesture from the description
- Maintain strong resemblance to the original person — do NOT replace face with generic anime face

Style Consistency:
- Consistent JRPG illustration style across all generations
- Same line thickness, eye rendering method, and cel-shading approach
- Original character design only — NOT copying any existing Dragon Quest character

Output: 1:1 square, centered, high-quality 2D Japanese RPG semi-chibi illustration suitable for trading card icons.
Avoid photorealism, 3D rendering, painterly textures, western cartoon styles, complex backgrounds.`,
};

const CHARACTER_KEYS = Object.keys(CHARACTER_PROMPTS);

async function generateAnimeCharacter(options: {
  photoBase64: string;
  mimeType: string;
  element: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  // ── Step 1: GPT-4o Likeness-First facial + physical analysis ──────────
  const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "You are an expert forensic portrait artist and anime character designer. " +
            "Your PRIMARY job is to extract every facial identity marker from a photo with maximum precision, " +
            "so that a downstream image AI can recreate the person's face in anime style while keeping them INSTANTLY RECOGNIZABLE. " +
            "Prioritize face and hair details above all else. Never omit or generalize facial features.",
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
              text: `Perform a LIKENESS-FIRST analysis of this person for anime character conversion.

Your output will be used directly as a reference for an AI image generator. Be EXTREMELY specific — vague descriptions produce generic faces. Every detail you capture increases the chance the result looks like this specific person.

=== FACE (HIGHEST PRIORITY) ===
1. Face shape: (oval / round / square / heart / diamond / oblong — be precise)
2. Eyes:
   - Shape: (almond / round / monolid / hooded / upturned / downturned / deep-set)
   - Size: (small / medium / large relative to face)
   - Color: (exact shade — jet black / dark brown / warm hazel / green / light blue / etc.)
   - Double eyelid or monolid?
   - Any distinctive features (droopy, sharp corners, etc.)
3. Eyebrows:
   - Thickness: (thin / medium / thick / very thick)
   - Shape: (straight / arched / curved / angular)
   - Color relative to hair
4. Nose: (button / aquiline / flat / narrow / wide / upturned — be specific)
5. Lips: (thin / medium / full; shape: heart / wide / straight)
6. Jaw & chin: (strong / soft / pointed / square / rounded / cleft chin)
7. Cheekbones: (high / low / prominent / soft)
8. DISTINCTIVE FEATURES (critical — list ALL): dimples, moles, freckles, scars, strong brow ridge, deep-set eyes, prominent ears, etc.
9. Facial hair: (none / stubble / beard — color and style)
10. Age impression and gender expression

=== HAIR (HIGH PRIORITY) ===
- Exact color (jet black / dark brown / chestnut / auburn / dirty blonde / platinum / silver / dyed color)
- Length (very short / short / medium / long / very long)
- Style in precise detail (straight / wavy / curly / spiky / undercut / side-swept / parted left/right / tied back / bangs: yes/no and exact style)
- Volume and texture (fine / thick / voluminous / flat / frizzy)

=== SKIN ===
- Tone (fair porcelain / light ivory / medium beige / warm tan / olive / deep brown / rich dark)
- Undertone (warm / cool / neutral)

=== BODY ===
- Build (slim / lean athletic / average / stocky / muscular / plus-size)
- Height impression (petite / average / tall)

=== CLOTHING (describe every visible item precisely) ===
- Top: exact color(s), garment type, any patterns/logos/graphics
- Bottom if visible: color, type
- Outerwear if any
- Accessories: glasses (frame shape and color — CRITICAL if present), earrings, necklace, hat/cap, watch, etc.
- Overall style vibe (casual / sporty / formal / streetwear / etc.)

=== EXPRESSION & POSE ===
- Current facial expression (neutral / smiling / serious / etc.)
- Notable posture or gesture

REMINDER: The goal is that someone reading your description can draw this EXACT person in anime style and it will be immediately recognizable as them. Do not generalize. Do not omit.`,
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

  // ── Step 2: Randomly select one of 5 character types ──────────────────
  const randomKey = CHARACTER_KEYS[Math.floor(Math.random() * CHARACTER_KEYS.length)];
  const dallePrompt = CHARACTER_PROMPTS[randomKey](personDescription);

  // ── Step 3: DALL-E 3 HD generation (style=natural for max likeness) ───
  // style="natural" prioritizes faithfulness to the prompt description
  // over artistic interpretation, which improves facial resemblance.
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
      style: "natural",        // "natural" > "vivid" for facial likeness
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
