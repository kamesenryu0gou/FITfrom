import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";

/**
 * AI Anime Conversion — 超精巧ファンタジーイラスト変換
 *
 * 5-Stage "Character Translation" Logic:
 * 1. Facial Expression Sync   — Extract exact smile shape, eye squint, lip curve as line art
 * 2. Object Translation       — Replace held items/background with class-appropriate fantasy props
 * 3. SSR Quality Standard     — High-end 2D game splash art, semi-realistic textures, digital painting
 * 4. Color Palette Inheritance — Inherit photo's warmth and clothing colors into costume palette
 * 5. Pose & Face Lock         — Pose, face angle, and expression are FROZEN from the photo (0 deviation)
 *
 * Pipeline:
 * Step 1 → GPT-4o (high detail) performs exhaustive Likeness-First + Expression + Object analysis
 * Step 2 → DALL-E 3 (HD, style=natural) receives class prompt with all 5 rules enforced
 */

// ── Shared Identity & Quality Rule ────────────────────────────────────────
const MASTER_RULE = `[ABSOLUTE RENDERING RULES — MUST FOLLOW ALL 5]

RULE 1 — FACIAL EXPRESSION SYNC (Highest Priority):
Do NOT create a "similar-looking" face. Instead, extract the EXACT smile shape, eye squint angle, lip corner height, and cheek raise from the photo description and reproduce them as precise line art. The sparkle in the eyes, the unique nuance of the person's happy expression — preserve these as the #1 priority. Not one pixel of the face, eye direction, or expression may deviate from the original photo.

RULE 2 — OBJECT TRANSLATION (Creative Fantasy Replacement):
Every real-world item the person holds or interacts with MUST be creatively replaced with a class-appropriate fantasy prop:
- Food/drink → Elemental energy crystal of the matching attribute
- Book/notebook → Ancient spellbook or tome with glowing runes
- Bench/chair → Throne of the holy knight or magical seat
- Phone/device → Crystal orb or magical communication artifact
- Bag/backpack → Enchanted satchel or adventurer's pack
- Sports equipment → Enchanted weapon or training artifact
Apply this translation to ALL visible objects and the background setting.

RULE 3 — SSR QUALITY STANDARD (No Cheap Line Art):
Render at the quality level of a Social Game SSR card illustration:
- High-end 2D game splash art quality
- Semi-chibi proportions WITH semi-realistic textures (NOT flat/simple)
- Detailed fabric folds, cloth weight, and material texture on every garment
- Soft global illumination with rim lighting and subsurface scattering on skin
- Rich, thick digital painting coloring (NOT flat cel shading)
- Dramatic but tasteful lighting that enhances the character's presence
- Every surface — armor, cloth, hair, skin — must have visible texture and depth

RULE 4 — COLOR PALETTE INHERITANCE:
The dominant colors of the person's clothing in the photo become the PRIMARY colors of the fantasy costume. Preserve the overall warmth or coolness of the photo's color temperature. Do NOT replace a warm-toned outfit with cold colors. The character's palette must feel like a natural fantasy extension of what they were wearing.

RULE 5 — POSE & FACE LOCK (Absolute Constraint):
The character's pose, body angle, face direction, and facial expression are LOCKED to the photo. They must be reproduced with zero deviation. If the person is looking slightly left, the character looks slightly left. If they are mid-laugh, the character is mid-laugh. This is non-negotiable.`;

// ── 5 Character Prompts — Ultra-Precision Fantasy Translation ─────────────
const CHARACTER_PROMPTS: Record<string, (description: string) => string> = {

  Hero: (description: string) => `${MASTER_RULE}

=== SUBJECT DESCRIPTION (Source of Truth — Reproduce Every Detail) ===
${description}

=== CHARACTER CLASS: FANTASY HERO ===

Identity:
This is NOT a generic hero. This IS the specific person described above, wearing a Dragon Quest-style Cosplay/Outfit as a fantasy hero. Their face, expression, and pose are locked to the description above.

Costume Design (Color Palette Inherited from Photo):
- Light fantasy armor with cape and sword
- Armor color = derived from the person's dominant clothing color in the photo
- Fabric folds on cape and tunic rendered with full digital painting texture
- Metal armor with engraved details, specular highlights, and scratches

Object Translation:
- Any held items in the description → transformed into a legendary sword, hero's shield, or glowing elemental artifact
- Background setting → transformed into a dramatic fantasy landscape (castle gate, glowing sky, epic battlefield) that matches the photo's spatial composition

Art Quality:
- SSR-tier 2D game splash art
- Semi-chibi body with semi-realistic face texture and detailed rendering
- Soft global illumination, rim lighting on armor edges
- Rich digital painting — NOT flat anime coloring

Output: 1:1 square, centered, portrait-oriented, trading card quality.
Absolutely no photorealism, 3D CGI, or western cartoon style.`,

  Priest: (description: string) => `${MASTER_RULE}

=== SUBJECT DESCRIPTION (Source of Truth — Reproduce Every Detail) ===
${description}

=== CHARACTER CLASS: FANTASY PRIEST / HEALER ===

Identity:
This is NOT a generic priest. This IS the specific person described above, wearing a Dragon Quest-style Cosplay/Outfit as a fantasy priest/healer. Their face, expression, and pose are locked to the description above.

Costume Design (Color Palette Inherited from Photo):
- Flowing holy robe with staff and sacred accessory
- Robe color = derived from the person's dominant clothing color in the photo
- Fabric folds on robe rendered with full weight and soft cloth texture
- Glowing holy symbols or light particles around the staff

Object Translation:
- Any held items → transformed into a holy staff, healing orb, or sacred tome with glowing pages
- Background setting → transformed into a serene fantasy sanctuary (cathedral light, floating petals, sacred grove) matching the photo's spatial composition

Art Quality:
- SSR-tier 2D game splash art
- Semi-chibi body with semi-realistic face texture and detailed rendering
- Soft global illumination with warm holy light emanating from the staff
- Rich digital painting — NOT flat anime coloring

Output: 1:1 square, centered, portrait-oriented, trading card quality.
Absolutely no photorealism, 3D CGI, or western cartoon style.`,

  Mage: (description: string) => `${MASTER_RULE}

=== SUBJECT DESCRIPTION (Source of Truth — Reproduce Every Detail) ===
${description}

=== CHARACTER CLASS: FANTASY MAGE ===

Identity:
This is NOT a generic mage. This IS the specific person described above, wearing a Dragon Quest-style Cosplay/Outfit as a fantasy mage. Their face, expression, and pose are locked to the description above.

Costume Design (Color Palette Inherited from Photo):
- Elaborate mage robe with pointed hat and magic staff
- Robe and hat color = derived from the person's dominant clothing color in the photo
- Fabric folds and layered robes rendered with full digital painting texture
- Magical runes glowing on the robe hem and staff crystal

Object Translation:
- Any held items → transformed into a magic staff, spell tome, or swirling elemental orb
- Background setting → transformed into a mystical fantasy environment (arcane library, floating islands, star-filled sky) matching the photo's spatial composition

Art Quality:
- SSR-tier 2D game splash art
- Semi-chibi body with semi-realistic face texture and detailed rendering
- Dramatic magical lighting — arcane glow from staff illuminating the character's face
- Rich digital painting — NOT flat anime coloring

Output: 1:1 square, centered, portrait-oriented, trading card quality.
Absolutely no photorealism, 3D CGI, or western cartoon style.`,

  DemonLord: (description: string) => `${MASTER_RULE}

=== SUBJECT DESCRIPTION (Source of Truth — Reproduce Every Detail) ===
${description}

=== CHARACTER CLASS: FANTASY DEMON LORD ===

Identity:
This is NOT a generic demon lord. This IS the specific person described above, wearing a Dragon Quest-style Cosplay/Outfit as a fantasy demon lord. Their face, expression, and pose are locked to the description above.

Costume Design (Color Palette Inherited from Photo):
- Dark royal cloak with decorative horns or crown and magical aura
- Cloak color = derived from the person's dominant clothing color in the photo (darkened/deepened version)
- Fabric folds on cloak rendered with heavy, dramatic weight and texture
- Dark magical energy particles or aura surrounding the character

Object Translation:
- Any held items → transformed into a dark scepter, cursed orb, or demonic artifact with glowing runes
- Background setting → transformed into a dramatic dark fantasy throne room or ominous sky, matching the photo's spatial composition

Art Quality:
- SSR-tier 2D game splash art
- Semi-chibi body with semi-realistic face texture and detailed rendering
- Dramatic rim lighting from below, dark atmospheric glow
- Rich digital painting — NOT flat anime coloring
- Intimidating but still stylized and cute — NOT grotesque

Output: 1:1 square, centered, portrait-oriented, trading card quality.
Absolutely no photorealism, 3D CGI, western cartoon style, or horror elements.`,

  Swordsman: (description: string) => `${MASTER_RULE}

=== SUBJECT DESCRIPTION (Source of Truth — Reproduce Every Detail) ===
${description}

=== CHARACTER CLASS: FANTASY SWORDSMAN ===

Identity:
This is NOT a generic swordsman. This IS the specific person described above, wearing a Dragon Quest-style Cosplay/Outfit as a fantasy swordsman. Their face, expression, and pose are locked to the description above.

Costume Design (Color Palette Inherited from Photo):
- Light battle armor with leather gear and sword (single or dual blades)
- Armor color = derived from the person's dominant clothing color in the photo
- Detailed fabric folds on leather straps and cloth undergarment
- Metal armor with realistic scratches, engravings, and specular highlights

Object Translation:
- Any held items → transformed into a legendary sword, dual blades, or battle-worn weapon with elemental glow
- Background setting → transformed into a dynamic fantasy battle scene or warrior's training ground, matching the photo's spatial composition

Art Quality:
- SSR-tier 2D game splash art
- Semi-chibi body with semi-realistic face texture and detailed rendering
- Dynamic lighting — sunlight or elemental glow reflecting off the blade
- Rich digital painting — NOT flat anime coloring

Output: 1:1 square, centered, portrait-oriented, trading card quality.
Absolutely no photorealism, 3D CGI, or western cartoon style.`,
};

const CHARACTER_KEYS = Object.keys(CHARACTER_PROMPTS);

async function generateAnimeCharacter(options: {
  photoBase64: string;
  mimeType: string;
  element: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  // ── Step 1: GPT-4o — Ultra-Precision 5-Axis Analysis ──────────────────
  // Analyzes: Face/Expression, Held Objects, Color Temperature, Pose, Background
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
            "You are an elite forensic portrait artist, character designer, and fantasy art director. " +
            "Your job is to perform a 5-axis analysis of a photo so that a downstream AI can produce " +
            "a hyper-faithful fantasy illustration that is INSTANTLY RECOGNIZABLE as this specific person. " +
            "You must capture: (1) exact facial expression mechanics, (2) all held objects for fantasy translation, " +
            "(3) dominant color palette and warmth, (4) precise pose and body angle, (5) background context. " +
            "Be exhaustive. Vague descriptions produce generic results.",
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
              text: `Perform a 5-AXIS ULTRA-PRECISION analysis of this photo for fantasy character conversion.

=== AXIS 1: FACIAL EXPRESSION MECHANICS (Most Critical) ===
Describe the expression with surgical precision — not just "smiling" but HOW they are smiling:
- Smile shape: Is it wide/narrow? Are the teeth showing? Which teeth?
- Eye state: Are eyes fully open, slightly squinted, heavily squinted? Describe the exact degree.
- Eye sparkle: Describe the catchlight position and brightness
- Lip corners: Exact angle of lip corners (slightly up / strongly up / asymmetric)
- Cheek raise: Are the cheeks raised? How much? Dimples visible?
- Eyebrow position: Raised / neutral / furrowed — exact position
- Overall expression energy: Joyful / serene / confident / playful / intense — be specific
- Any micro-expressions or unique personal expression quirks

=== AXIS 2: FACE STRUCTURE & IDENTITY MARKERS ===
- Face shape (oval/round/square/heart/diamond/oblong)
- Eye shape and color (exact shade), double eyelid or monolid
- Eyebrow thickness, arch, and color
- Nose shape (button/aquiline/flat/narrow/wide/upturned)
- Lip shape (thin/medium/full; heart/wide/straight)
- Jaw and chin (strong/soft/pointed/square/rounded/cleft)
- Cheekbones (high/low/prominent/soft)
- DISTINCTIVE FEATURES: dimples, moles, freckles, scars, strong brow ridge — list ALL
- Facial hair: none / stubble / beard (color and exact style)
- Age impression and gender expression
- Glasses: frame shape, color, thickness (CRITICAL if present)

=== AXIS 3: HAIR ===
- Exact color (jet black/dark brown/chestnut/auburn/dirty blonde/platinum/silver/dyed)
- Length (very short/short/medium/long/very long)
- Precise style (straight/wavy/curly/spiky/undercut/side-swept/parted left or right/tied back/bangs: yes/no and exact style)
- Volume and texture (fine/thick/voluminous/flat/frizzy)

=== AXIS 4: HELD OBJECTS & BACKGROUND (For Fantasy Translation) ===
List EVERY object the person is holding, touching, or interacting with:
- Object 1: [describe exactly — shape, color, material]
- Object 2: [if any]
- What is the person doing with each object?
Background setting:
- Indoor or outdoor?
- What is visible in the background? (furniture, nature, architecture, etc.)
- Approximate spatial depth (close-up portrait / medium shot / full body)

=== AXIS 5: COLOR PALETTE & WARMTH ===
- Dominant clothing color(s): exact shade (e.g., "warm coral red", "dusty olive green", "navy blue with white trim")
- Secondary colors visible in outfit
- Overall photo warmth: warm-toned / cool-toned / neutral
- Skin tone: (fair porcelain/light ivory/medium beige/warm tan/olive/deep brown/rich dark)
- Skin undertone: warm/cool/neutral

=== AXIS 6: POSE & BODY ===
- Exact body position: standing/sitting/leaning/crouching
- Face direction: straight-on / turned left / turned right / tilted (specify degree)
- Body angle: frontal / 3/4 view / profile
- Arm and hand position: describe precisely
- Any notable gesture or posture
- Body build: slim/lean athletic/average/stocky/muscular/plus-size
- Clothing: top (exact color, garment type, patterns/logos), bottom if visible, accessories

REMINDER: Your description will be used to draw THIS EXACT PERSON in fantasy style. Every detail you capture makes the result more recognizable. Do not generalize or omit anything.`,
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
  // style="natural" prioritizes prompt faithfulness over artistic interpretation
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
