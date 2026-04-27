import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";

/**
 * AI Anime Conversion — 超精巧ファンタジーイラスト変換 v3
 *
 * 3 CRITICAL FIXES applied in this version:
 * FIX 1: STRICT NO TEXT — zero text/letters/numbers in generated image
 * FIX 2: STOP AGE REDUCTION — subject is a mature adult male (late 30s–50s), NOT a teenager
 * FIX 3: HIGH-END TCG THICK PAINT — rich digital painting, NOT cheap flat line art
 *
 * Pipeline:
 * Step 1 → GPT-4o (high detail, 1200 tokens) — 6-axis Likeness-First analysis
 *           with explicit age/maturity anchoring and object inventory
 * Step 2 → DALL-E 3 (HD, style=natural) — class prompt with all 3 critical fixes
 *           + NO-TEXT enforcement block prepended to every prompt
 */

// ── CRITICAL FIX 1: Strict No-Text Enforcement Block ─────────────────────
// Prepended to EVERY DALL-E prompt. DALL-E 3 does not support negative prompts
// natively, so we use strong positive exclusion language instead.
const NO_TEXT_BLOCK = `[CRITICAL OUTPUT RULE — PURE ARTWORK ONLY]
The output image MUST be a pure character illustration with ABSOLUTELY NO TEXT of any kind.
STRICTLY FORBIDDEN in the image:
- Any alphabet letters (A-Z, a-z)
- Any numbers (0-9)
- Any words, labels, captions, or descriptions
- Any watermarks, signatures, or UI elements
- Any speech bubbles, thought bubbles, or text boxes
- Any runes or symbols that resemble writing
- Any subtitles or annotations overlaid on the image
The image must contain ONLY the character illustration and background artwork. No text. No labels. No explanations. Pure visual art only.`;

// ── CRITICAL FIX 2: Age & Maturity Anchor Block ──────────────────────────
// Forces the AI to render a mature adult male, not a young/teenage character.
const AGE_ANCHOR_BLOCK = `[CRITICAL AGE & MATURITY RULE — ABSOLUTE CONSTRAINT]
The subject is a MATURE ADULT MALE, approximately late 30s to 50s in age.
MANDATORY physical maturity markers to render:
- Facial structure: Strong, settled adult bone structure — NOT a soft teenage face
- Eyes: Calm, experienced adult eyes with natural depth — NOT large sparkly young eyes
- Jaw: Defined adult jawline — do NOT slim down or sharpen the jaw beyond the original
- Facial hair: If described (stubble, beard, mustache), render it with FULL TEXTURE and WEIGHT — do NOT erase or soften it
- Skin: Adult skin with natural texture — do NOT smooth out to porcelain-like teenage skin
- Hair: Render the EXACT hairstyle described (spiky short black / voluminous wavy reddish-brown / etc.) — do NOT change to a generic anime hairstyle
- Body: Adult male proportions — NOT a slim teenage build
STRICTLY FORBIDDEN:
- Making the character look younger than the photo
- Enlarging the eyes beyond natural adult proportions
- Removing or softening facial hair
- Smoothing adult skin to look like a teenager
- Slimming the jaw or chin
- Changing the hairstyle to a generic anime style`;

// ── CRITICAL FIX 3: High-End TCG Thick Paint Style Block ─────────────────
const THICK_PAINT_BLOCK = `[CRITICAL ART QUALITY RULE — HIGH-END TCG DIGITAL PAINTING]
Render at the quality level of the HIGHEST RARITY card illustration in a major trading card game (equivalent to SSR/UR tier).
MANDATORY quality specifications:
- Style: Rich, thick digital painting (油絵のような厚塗り) — NOT flat anime cel shading
- Texture: Every surface must have visible material texture:
  * Skin: Subsurface scattering, pores, natural imperfections
  * Fabric: Visible weave, cloth weight, fold shadows, material sheen
  * Metal: Specular highlights, scratches, engraving details
  * Hair: Individual strand groupings, light reflection, volume
- Lighting: Dramatic but tasteful — soft global illumination + rim lighting + atmospheric depth
- Background: Grand fantasy landscape (castle, mystical sky, ancient ruins, etc.) that ENHANCES the character without competing — NO TEXT in background
- Color depth: Rich, saturated colors with proper value contrast — NOT washed out or flat
STRICTLY FORBIDDEN:
- Cheap flat line art
- Simple cel shading without texture
- Plain solid color backgrounds
- Any text, labels, or UI elements in the background`;

// ── Shared Identity & All-Rules Block ─────────────────────────────────────
const MASTER_RULE = `${NO_TEXT_BLOCK}

${AGE_ANCHOR_BLOCK}

${THICK_PAINT_BLOCK}

[IDENTITY & EXPRESSION RULES]

RULE 1 — FACIAL EXPRESSION SYNC (Highest Priority):
Extract the EXACT smile shape, eye squint angle, lip corner height, and cheek raise from the description and reproduce them as precise painted strokes. The sparkle in the eyes, the unique nuance of the person's expression — preserve these as the #1 priority. Not one pixel of the face, eye direction, or expression may deviate from the original photo.

RULE 2 — OBJECT TRANSLATION (Creative Fantasy Replacement):
Every real-world item the person holds MUST be creatively replaced with a class-appropriate fantasy prop:
- Food/drink → Elemental energy crystal of the matching attribute
- Book/notebook → Ancient spellbook or tome with glowing runes
- Bench/chair → Throne of the holy knight or magical seat
- Phone/device → Crystal orb or magical communication artifact
- Bag/backpack → Enchanted satchel or adventurer's pack

RULE 3 — COLOR PALETTE INHERITANCE:
The dominant colors of the person's clothing become the PRIMARY colors of the fantasy costume. Preserve the overall warmth or coolness of the photo's color temperature.

RULE 4 — POSE & FACE LOCK (Absolute Constraint):
The character's pose, body angle, face direction, and facial expression are LOCKED to the photo description. Zero deviation. Non-negotiable.`;

// ── 5 Character Prompts ────────────────────────────────────────────────────
const CHARACTER_PROMPTS: Record<string, (description: string) => string> = {

  Hero: (description: string) => `${MASTER_RULE}

=== SUBJECT DESCRIPTION (Source of Truth) ===
${description}

=== CHARACTER CLASS: FANTASY HERO ===

This is the SPECIFIC MATURE ADULT MALE described above, wearing a Dragon Quest-style Cosplay/Outfit as a fantasy hero. His face, age, expression, and pose are LOCKED to the description. He is NOT a teenager. He is a seasoned adult warrior.

Costume: Light fantasy armor with cape and sword. Armor color derived from the person's dominant clothing color. Detailed fabric folds, metal engravings, specular highlights on armor edges.

Background: Grand fantasy landscape — castle gate, glowing epic sky, dramatic battlefield. NO TEXT anywhere in the image.

Output: 1:1 square, centered portrait. Pure character illustration. Absolutely no text, labels, or UI elements. No photorealism, no 3D CGI.`,

  Priest: (description: string) => `${MASTER_RULE}

=== SUBJECT DESCRIPTION (Source of Truth) ===
${description}

=== CHARACTER CLASS: FANTASY PRIEST / HEALER ===

This is the SPECIFIC MATURE ADULT MALE described above, wearing a Dragon Quest-style Cosplay/Outfit as a fantasy priest/healer. His face, age, expression, and pose are LOCKED to the description. He is NOT a teenager. He is a wise adult healer.

Costume: Flowing holy robe with staff and sacred accessory. Robe color derived from the person's dominant clothing color. Soft cloth folds, glowing holy symbols, warm divine light.

Background: Serene fantasy sanctuary — cathedral light rays, floating petals, sacred grove. NO TEXT anywhere in the image.

Output: 1:1 square, centered portrait. Pure character illustration. Absolutely no text, labels, or UI elements. No photorealism, no 3D CGI.`,

  Mage: (description: string) => `${MASTER_RULE}

=== SUBJECT DESCRIPTION (Source of Truth) ===
${description}

=== CHARACTER CLASS: FANTASY MAGE ===

This is the SPECIFIC MATURE ADULT MALE described above, wearing a Dragon Quest-style Cosplay/Outfit as a fantasy mage. His face, age, expression, and pose are LOCKED to the description. He is NOT a teenager. He is a powerful adult archmage.

Costume: Elaborate mage robe with pointed hat and magic staff. Robe color derived from the person's dominant clothing color. Layered fabric folds, glowing runes on hem, arcane crystal staff.

Background: Mystical fantasy environment — arcane library, floating islands, star-filled sky. NO TEXT anywhere in the image.

Output: 1:1 square, centered portrait. Pure character illustration. Absolutely no text, labels, or UI elements. No photorealism, no 3D CGI.`,

  DemonLord: (description: string) => `${MASTER_RULE}

=== SUBJECT DESCRIPTION (Source of Truth) ===
${description}

=== CHARACTER CLASS: FANTASY DEMON LORD ===

This is the SPECIFIC MATURE ADULT MALE described above, wearing a Dragon Quest-style Cosplay/Outfit as a fantasy demon lord. His face, age, expression, and pose are LOCKED to the description. He is NOT a teenager. He is a commanding adult dark lord.

Costume: Dark royal cloak with decorative horns or crown and magical aura. Cloak color derived from the person's dominant clothing color (darkened version). Heavy dramatic fabric folds, dark magical energy particles.

Background: Dramatic dark fantasy throne room or ominous sky with aurora. NO TEXT anywhere in the image.

Output: 1:1 square, centered portrait. Pure character illustration. Absolutely no text, labels, or UI elements. No photorealism, no 3D CGI, no horror elements.`,

  Swordsman: (description: string) => `${MASTER_RULE}

=== SUBJECT DESCRIPTION (Source of Truth) ===
${description}

=== CHARACTER CLASS: FANTASY SWORDSMAN ===

This is the SPECIFIC MATURE ADULT MALE described above, wearing a Dragon Quest-style Cosplay/Outfit as a fantasy swordsman. His face, age, expression, and pose are LOCKED to the description. He is NOT a teenager. He is a battle-hardened adult warrior.

Costume: Light battle armor with leather gear and sword. Armor color derived from the person's dominant clothing color. Detailed leather straps, metal scratches, elemental glow on blade.

Background: Dynamic fantasy battle scene or warrior's training ground with dramatic sky. NO TEXT anywhere in the image.

Output: 1:1 square, centered portrait. Pure character illustration. Absolutely no text, labels, or UI elements. No photorealism, no 3D CGI.`,
};

const CHARACTER_KEYS = Object.keys(CHARACTER_PROMPTS);

async function generateAnimeCharacter(options: {
  photoBase64: string;
  mimeType: string;
  element: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  // ── Step 1: GPT-4o — 6-Axis Likeness-First Analysis with Age Anchoring ──
  const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are an elite forensic portrait artist and fantasy art director. " +
            "Your job is to perform a 6-axis analysis of a photo so that a downstream AI can produce " +
            "a hyper-faithful fantasy illustration that is INSTANTLY RECOGNIZABLE as this specific person. " +
            "CRITICAL: The subject is a MATURE ADULT MALE (late 30s to 50s). " +
            "You MUST explicitly state and emphasize all markers of adult maturity: " +
            "facial hair texture, settled bone structure, adult eye depth, natural skin texture. " +
            "Do NOT describe them as young, teenage, or youthful. " +
            "Capture every facial identity marker with maximum precision.",
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
              text: `Perform a 6-AXIS ULTRA-PRECISION analysis of this MATURE ADULT MALE for fantasy character conversion.

IMPORTANT: This person is a MATURE ADULT MALE in their late 30s to 50s. Describe ALL markers of adult maturity explicitly. Do NOT soften or youthify the description.

=== AXIS 1: FACIAL EXPRESSION MECHANICS (Most Critical) ===
Describe the expression with surgical precision:
- Smile shape: Wide/narrow? Teeth showing? Which teeth?
- Eye state: Fully open / slightly squinted / heavily squinted — exact degree
- Eye sparkle: Catchlight position and brightness
- Lip corners: Exact angle (slightly up / strongly up / asymmetric)
- Cheek raise: Raised? How much? Dimples visible?
- Eyebrow position: Raised / neutral / furrowed
- Overall expression energy: Joyful / serene / confident / playful / intense
- Any unique personal expression quirks

=== AXIS 2: ADULT FACE STRUCTURE & IDENTITY MARKERS ===
- Face shape (oval/round/square/heart/diamond/oblong)
- Eye shape and color (exact shade), double eyelid or monolid
- Adult eye depth and character (calm / intense / warm / sharp)
- Eyebrow thickness, arch, and color
- Nose shape (button/aquiline/flat/narrow/wide/upturned)
- Lip shape (thin/medium/full; heart/wide/straight)
- ADULT JAW AND CHIN: Describe the jaw strength and chin shape in detail — do NOT soften
- Cheekbones (high/low/prominent/soft)
- DISTINCTIVE FEATURES: dimples, moles, freckles, scars, strong brow ridge — list ALL
- FACIAL HAIR (CRITICAL): Describe in maximum detail — none / stubble (density, length, color) / beard (style, coverage, color, texture) / mustache
- Age impression: State explicitly "mature adult male, approximately [X]s" — do NOT say young or teenage
- Glasses: frame shape, color, thickness (CRITICAL if present)

=== AXIS 3: HAIR ===
- Exact color (jet black / dark brown / chestnut / auburn / reddish-brown / silver / salt-and-pepper)
- Length (very short / short / medium / long)
- PRECISE STYLE in maximum detail (spiky short / voluminous wavy / undercut / side-swept / etc.)
- Volume and texture (fine / thick / voluminous / flat)

=== AXIS 4: HELD OBJECTS & BACKGROUND (For Fantasy Translation) ===
List EVERY object the person holds or interacts with:
- Object 1: [exact shape, color, material, what they are doing with it]
- Object 2: [if any]
Background setting: Indoor or outdoor? What is visible? Approximate shot distance?

=== AXIS 5: COLOR PALETTE & WARMTH ===
- Dominant clothing color(s): exact shade (e.g., "warm coral red", "dusty olive green")
- Secondary colors in outfit
- Overall photo warmth: warm-toned / cool-toned / neutral
- Skin tone: (fair / light / medium / warm tan / olive / deep brown)

=== AXIS 6: POSE & BODY ===
- Body position: standing / sitting / leaning
- Face direction: straight-on / turned left / turned right / tilted (degree)
- Body angle: frontal / 3/4 view / profile
- Arm and hand position: describe precisely
- Body build: slim / lean athletic / average / stocky / muscular
- Clothing: exact description of every visible garment

REMINDER: Emphasize adult maturity in every axis. This is a mature adult male — describe him as such.`,
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
  const personDescription = visionData.choices?.[0]?.message?.content || "a mature adult male";

  // ── Step 2: Randomly select one of 5 character types ──────────────────
  const randomKey = CHARACTER_KEYS[Math.floor(Math.random() * CHARACTER_KEYS.length)];
  const dallePrompt = CHARACTER_PROMPTS[randomKey](personDescription);

  // ── Step 3: DALL-E 3 HD — style=natural for maximum likeness ──────────
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
      style: "natural",
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
