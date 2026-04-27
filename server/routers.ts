import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";

/**
 * AI Anime Conversion — DQ風チビキャラ・5職業ランダム選択
 *
 * Strategy:
 * 1. GPT-4o (high detail) analyzes the photo and produces an exhaustive
 *    physical + clothing description to maximize resemblance.
 * 2. DALL-E 3 (HD quality) receives one of 5 character prompts (Hero / Priest /
 *    Mage / Demon Lord / Swordsman) randomly selected, in Dragon Quest–inspired
 *    chibi JRPG style.
 */

// ── 5 Character Prompts (from pasted_content.txt) ─────────────────────────
const CHARACTER_PROMPTS: Record<string, (description: string) => string> = {
  Hero: (description: string) => `Using the following character description as reference, generate an isekai anime–style chibi HERO in a Dragon Quest–inspired illustration style with strong consistency.

Character description (faithfully preserve ALL physical features, hair, skin tone, clothing colors):
${description}

Art Style:
Dragon Quest–inspired anime illustration style (classic JRPG fantasy look),
clean and bold anime lineart, clear outlines,
simple and readable shapes,
soft cel shading with minimal gradients,
bright but natural fantasy color tones,
highly consistent and repeatable Japanese RPG character illustration style.

NOT copying or referencing any specific Dragon Quest character.
No parody, no direct character resemblance.
Original character design only, inspired by classic JRPG aesthetics.

IMPORTANT – Style Consistency Rules:
Use the exact same illustration style, line thickness, eye design,
face proportions, and cel-shading method as all other character generations.
Avoid stylistic randomness.

Pose & Structure:
– Faithfully preserve the original pose, body angle, arm position,
  stance, and gesture from the description
– Only adjust proportions to chibi scale without changing the pose

Character Design:
– Slightly large head, small body (chibi proportion)
– Do NOT over-exaggerate or deform the face
– Preserve facial structure, expression, eye shape, and mouth shape
– Maintain strong resemblance to the original person

Outfit & Theme:
Fantasy hero outfit inspired by classic JRPG / Dragon Quest–style heroes
(light armor, cape, sword),
while strictly preserving the original clothing color palette
and overall visual impression from the description.

Background:
Simple flat color or soft gradient,
derived from the dominant clothing color.

Output:
1:1 square format, centered character,
clean anime lineart, soft cel shading,
high-quality 2D Japanese RPG-style illustration.

Avoid photorealism, 3D, western cartoon style, painterly textures.`,

  Priest: (description: string) => `Using the following character description as reference, generate an isekai anime–style chibi PRIEST in a Dragon Quest–inspired illustration style with strong consistency.

Character description (faithfully preserve ALL physical features, hair, skin tone, clothing colors):
${description}

Art Style:
Dragon Quest–inspired anime illustration style (classic JRPG fantasy look),
clean and bold anime lineart, clear outlines,
simple and readable shapes,
soft cel shading with minimal gradients,
bright but natural fantasy color tones,
highly consistent and repeatable Japanese RPG character illustration style.

NOT copying or referencing any specific Dragon Quest character.
No parody, no direct character resemblance.
Original character design only, inspired by classic JRPG aesthetics.

IMPORTANT – Style Consistency Rules:
Use the exact same illustration style, facial proportions,
eye design, and shading method as previous generations.

Pose & Structure:
– Accurately preserve the original pose, posture,
  arm position, and body direction from the description
– Convert only into chibi proportions without altering the pose

Character Design:
– Chibi proportions with restrained deformation
– Preserve facial expression and likeness as closely as possible
– Gentle and calm impression while matching the original face

Outfit & Theme:
Fantasy priest / healer outfit (robe, staff, holy accessory),
in classic JRPG / Dragon Quest–style design,
while preserving the original clothing colors and balance.

Background:
Minimal flat or soft gradient background,
color derived from the dominant clothing color.

Output:
1:1 square, centered,
clean anime lineart, soft cel shading,
consistent JRPG game-icon quality.

Avoid realism, 3D rendering, dramatic lighting.`,

  Mage: (description: string) => `Using the following character description as reference, generate an isekai anime–style chibi MAGE in a Dragon Quest–inspired illustration style with strong consistency.

Character description (faithfully preserve ALL physical features, hair, skin tone, clothing colors):
${description}

Art Style:
Dragon Quest–inspired anime illustration style (classic JRPG fantasy look),
clean and bold anime lineart, clear outlines,
simple and readable shapes,
soft cel shading with minimal gradients,
bright but natural fantasy color tones,
highly consistent and repeatable Japanese RPG character illustration style.

NOT copying or referencing any specific Dragon Quest character.
No parody, no direct character resemblance.
Original character design only, inspired by classic JRPG aesthetics.

IMPORTANT – Style Consistency Rules:
Use the same drawing style, line weight,
eye design, and shading method every time.

Pose & Structure:
– Maintain the original pose, silhouette,
  hand position, and body orientation from the description
– Apply chibi proportions without changing the pose

Character Design:
– Slightly large head, small body
– Do NOT distort or exaggerate facial features
– Preserve eye shape, mouth shape, and expression

Outfit & Theme:
Fantasy mage outfit (robe, hat, magic staff, subtle magic effects),
in a classic JRPG / Dragon Quest–inspired design,
while keeping the original clothing color palette and impression.

Background:
Simple, clean flat or gradient background,
derived from the dominant clothing color.

Output:
1:1 square, centered composition,
soft cel shading, polished 2D anime illustration.

Avoid photorealism, 3D, painterly styles.`,

  DemonLord: (description: string) => `Using the following character description as reference, generate an isekai anime–style chibi DEMON LORD in a Dragon Quest–inspired illustration style with strong consistency.

Character description (faithfully preserve ALL physical features, hair, skin tone, clothing colors):
${description}

IMPORTANT – Style Consistency Rules:
Use the exact same illustration style,
face proportions, eye design,
and shading method as previous generations.

Art Style:
Dragon Quest–inspired anime illustration style (classic JRPG fantasy look),
clean and bold anime lineart, clear outlines,
simple and readable shapes,
soft cel shading with minimal gradients,
bright but natural fantasy color tones,
highly consistent and repeatable Japanese RPG character illustration style.

NOT copying or referencing any specific Dragon Quest character.
No parody, no direct character resemblance.
Original character design only, inspired by classic JRPG aesthetics.

Pose & Structure:
– Preserve the original pose, stance,
  body direction, and gesture from the description
– Convert into chibi proportions without altering pose dynamics

Character Design:
– Chibi proportions with controlled deformation
– Preserve facial structure and expression
– Slightly intimidating but still cute and stylized

Outfit & Theme:
Fantasy demon lord outfit
(dark cloak, horns or crown, subtle magical aura),
classic JRPG / Dragon Quest–style fantasy design,
while retaining the original clothing color palette
and overall impression.

Background:
Simple flat or gradient background,
derived from the dominant clothing color.

Output:
1:1 square, centered,
clean anime lineart, soft cel shading,
polished 2D Japanese RPG illustration.

Avoid realism, 3D, grotesque or horror elements.`,

  Swordsman: (description: string) => `Using the following character description as reference, generate an isekai anime–style chibi SWORDSMAN in a Dragon Quest–inspired illustration style with strong consistency.

Character description (faithfully preserve ALL physical features, hair, skin tone, clothing colors):
${description}

Art Style:
Dragon Quest–inspired anime illustration style (classic JRPG fantasy look),
clean and bold anime lineart, clear outlines,
simple and readable shapes,
soft cel shading with minimal gradients,
bright but natural fantasy color tones,
highly consistent and repeatable Japanese RPG character illustration style.

NOT copying or referencing any specific Dragon Quest character.
No parody, no direct character resemblance.
Original character design only, inspired by classic JRPG aesthetics.

IMPORTANT – Style Consistency Rules:
Use the exact same illustration style, line thickness,
face proportions, eye design,
and cel-shading method as previous character generations
Avoid stylistic randomness.

Pose & Structure:
– Faithfully preserve the original pose, stance,
  body angle, arm position, and gesture from the description
– Convert only into chibi proportions without changing the pose dynamics

Character Design:
– Slightly large head, small body (chibi proportion)
– Controlled deformation: do NOT exaggerate or distort the face
– Preserve facial structure, eye shape, mouth shape, and expression
– Maintain strong resemblance to the original person

Outfit & Theme:
Fantasy swordsman outfit inspired by classic JRPG / Dragon Quest–style warriors
(light armor, leather gear, sword or dual blades),
while strictly preserving the original clothing color palette
and overall visual impression from the description.

Background:
Simple flat color or soft gradient background,
derived from and harmonized with the dominant clothing color.

Output:
1:1 square composition, centered character,
clean anime lineart, soft cel shading,
high-quality 2D Japanese RPG chibi illustration
suitable for icons or character sets.

Avoid photorealism, 3D rendering,
painterly textures, western cartoon styles,
complex or detailed backgrounds.`,
};

const CHARACTER_KEYS = Object.keys(CHARACTER_PROMPTS);

async function generateAnimeCharacter(options: {
  photoBase64: string;
  mimeType: string;
  element: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

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

  // ── Step 2: Randomly select one of 5 character types ──────────────────
  const randomKey = CHARACTER_KEYS[Math.floor(Math.random() * CHARACTER_KEYS.length)];
  const dallePrompt = CHARACTER_PROMPTS[randomKey](personDescription);

  // ── Step 3: DALL-E 3 HD generation ────────────────────────────────────
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
