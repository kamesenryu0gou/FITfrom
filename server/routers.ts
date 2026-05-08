import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";
import sharp from "sharp";

/**
 * AI Anime Conversion — DQ風チビキャラ変換 v4 (Clean Reset)
 *
 * 仕様書（pasted_content_2.txt）のプロンプトをそのまま使用。
 * これまでの追加ルールは全て削除。
 *
 * Pipeline:
 * Step 1 → DALL-E 3 with image edit (gpt-image-1) — 写真を直接参照してキャラクター生成
 *           ※ gpt-image-1はimages/editsエンドポイントで写真を直接入力として使用可能
 * Step 2 → Storage保存 → URL返却
 */

// ── 5 Character Prompts (仕様書そのまま) ──────────────────────────────────

const HERO_PROMPT = `Using the uploaded image as reference, generate an isekai anime–style chibi HERO
in a Dragon Quest–inspired illustration style with strong consistency.

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
  stance, and gesture from the uploaded image
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
and overall visual impression from the uploaded image.

Background:
Simple flat color or soft gradient,
derived from the dominant clothing color.

Output:
1:1 square format, centered character,
clean anime lineart, soft cel shading,
high-quality 2D Japanese RPG-style illustration.

Avoid photorealism, 3D, western cartoon style, painterly textures.`;

const PRIEST_PROMPT = `Using the uploaded image as reference, generate an isekai anime–style chibi PRIEST
in a Dragon Quest–inspired illustration style with strong consistency.

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
  arm position, and body direction from the uploaded image
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

Avoid realism, 3D rendering, dramatic lighting.`;

const MAGE_PROMPT = `Using the uploaded image as reference, generate an isekai anime–style chibi MAGE
in a Dragon Quest–inspired illustration style with strong consistency.

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
  hand position, and body orientation from the uploaded image
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

Avoid photorealism, 3D, painterly styles.`;

const DEMON_LORD_PROMPT = `Using the uploaded image as reference, generate an isekai anime–style chibi DEMON LORD
in a Dragon Quest–inspired illustration style with strong consistency.

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
  body direction, and gesture from the uploaded image
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

Avoid realism, 3D, grotesque or horror elements.`;

const SWORDSMAN_PROMPT = `Using the uploaded image as reference, generate an isekai anime–style chibi SWORDSMAN
in a Dragon Quest–inspired illustration style with strong consistency.

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
  body angle, arm position, and gesture from the uploaded image
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
and overall visual impression from the uploaded image.

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
complex or detailed backgrounds.`;

const CHARACTER_PROMPTS: Record<string, string> = {
  Hero: HERO_PROMPT,
  Priest: PRIEST_PROMPT,
  Mage: MAGE_PROMPT,
  DemonLord: DEMON_LORD_PROMPT,
  Swordsman: SWORDSMAN_PROMPT,
};

const CHARACTER_KEYS = Object.keys(CHARACTER_PROMPTS);

async function generateAnimeCharacter(options: {
  photoBase64: string;
  mimeType: string;
  element: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  // ランダムに職業を選択
  const randomKey = CHARACTER_KEYS[Math.floor(Math.random() * CHARACTER_KEYS.length)];
  const prompt = CHARACTER_PROMPTS[randomKey];

  // gpt-image-1 の images/edits エンドポイントを使用して写真を直接参照
  // 新しい JSON 形式（images 配列 + image_url に base64 データ URL）で送信

  // MPO・HEIC・TIFF など非対応フォーマットをsharpでJPEGに変換する
  // （MPOはJPEGヘッダーを持つが複数画像を含む特殊フォーマットでOpenAI APIが拒否する）
  let safeBase64 = options.photoBase64;
  let safeMimeType = "image/jpeg";
  try {
    const inputBuffer = Buffer.from(options.photoBase64, "base64");
    const jpegBuffer = await sharp(inputBuffer)
      .jpeg({ quality: 90 })
      .toBuffer();
    safeBase64 = jpegBuffer.toString("base64");
    safeMimeType = "image/jpeg";
  } catch (convErr) {
    // 変換失敗時は元のデータをそのまま使用（JPEG/PNG/WEBPは通常変換不要）
    const mimeType = options.mimeType || "image/jpeg";
    safeMimeType = ["image/jpeg", "image/png", "image/webp"].includes(mimeType)
      ? mimeType
      : "image/jpeg";
    safeBase64 = options.photoBase64;
  }

  // base64 データ URL 形式に変換
  const dataUrl = `data:${safeMimeType};base64,${safeBase64}`;

  const editResponse = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      images: [{ image_url: dataUrl }],
      n: 1,
      size: "1024x1024",
      quality: "high",
    }),
  });

  if (!editResponse.ok) {
    const err = await editResponse.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`gpt-image-1 edit error: ${err?.error?.message || editResponse.status}`);
  }

  const editData = await editResponse.json() as { data?: Array<{ b64_json?: string; url?: string }> };
  const b64 = editData.data?.[0]?.b64_json;
  const imageUrl = editData.data?.[0]?.url;

  if (b64) {
    const buffer = Buffer.from(b64, "base64");
    const { url } = await storagePut(
      `anime-converted/${Date.now()}.png`,
      buffer,
      "image/png"
    );
    return url;
  } else if (imageUrl) {
    // URLが返ってきた場合はダウンロードしてストレージに保存
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Failed to download generated image");
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const { url } = await storagePut(
      `anime-converted/${Date.now()}.png`,
      imgBuffer,
      "image/png"
    );
    return url;
  }

  throw new Error("No image data returned from gpt-image-1");
}

// ── License Maker: Sugar Rush anime-style character conversion ────────────────────────────────────
const LICENSE_CARS_PROMPT = `Transform the person in this photo into a vibrant 3D animated character inspired by the Disney movie "Wreck-It Ralph" (Sugar Rush world), rendered in a high-quality Pixar/Disney 3D animation style.

FACIAL PRESERVATION (CRITICAL):
- Strictly preserve the person's unique facial structure, bone structure, eye shape, nose shape, and mouth shape so they remain immediately recognizable
- Maintain their exact age appearance — do NOT make them younger, smoother, or more idealized
- Keep their specific eye characteristics (shape, color, expression)
- Preserve their hair color, style, and texture as closely as possible
- Maintain their facial expression from the original photo

CHARACTER STYLE:
- Convert to high-quality Pixar/Disney 3D animation style — NOT flat 2D anime, NOT sketch, NOT watercolor
- Slightly exaggerated proportions typical of Sugar Rush characters: large expressive eyes, smooth skin with subtle stylization
- Rich, vibrant candy-themed color palette: glossy surfaces, saturated pastels, warm candy tones
- Clothing: replace with a stylized candy-themed outfit (racing suit with candy stripes, icing details, donut-shaped accessories)
- Keep the same pose and body orientation as the original photo

BACKGROUND:
- Candy-themed Sugar Rush race track environment
- Colorful candy architecture, lollipop trees, chocolate rivers
- Bright, cheerful lighting with soft rim light on the character

IMPORTANT RESTRICTIONS:
- Do NOT include any text, letters, numbers, watermarks, captions, or UI elements in the image
- Do NOT change the person's gender
- Do NOT make the person look significantly younger or older
- Output: pure character illustration only, no text overlay whatsoever`;

async function generateLicenseCharacter(options: {
  photoBase64: string;
  mimeType: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  let safeBase64 = options.photoBase64;
  let safeMimeType = "image/jpeg";
  try {
    const inputBuffer = Buffer.from(options.photoBase64, "base64");
    const jpegBuffer = await sharp(inputBuffer).jpeg({ quality: 90 }).toBuffer();
    safeBase64 = jpegBuffer.toString("base64");
    safeMimeType = "image/jpeg";
  } catch {
    const mimeType = options.mimeType || "image/jpeg";
    safeMimeType = ["image/jpeg", "image/png", "image/webp"].includes(mimeType) ? mimeType : "image/jpeg";
    safeBase64 = options.photoBase64;
  }

  const dataUrl = `data:${safeMimeType};base64,${safeBase64}`;

  const editResponse = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: LICENSE_CARS_PROMPT,
      images: [{ image_url: dataUrl }],
      n: 1,
      size: "1024x1024",
      quality: "high",
    }),
  });

  if (!editResponse.ok) {
    const err = await editResponse.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`gpt-image-1 edit error: ${err?.error?.message || editResponse.status}`);
  }

  const editData = await editResponse.json() as { data?: Array<{ b64_json?: string; url?: string }> };
  const b64 = editData.data?.[0]?.b64_json;
  const imageUrl = editData.data?.[0]?.url;

  if (b64) {
    const buffer = Buffer.from(b64, "base64");
    const { url } = await storagePut(`license-converted/${Date.now()}.png`, buffer, "image/png");
    return url;
  } else if (imageUrl) {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Failed to download generated image");
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const { url } = await storagePut(`license-converted/${Date.now()}.png`, imgBuffer, "image/png");
    return url;
  }

  throw new Error("No image data returned from gpt-image-1");
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

  license: router({
    convertToCarStyle: publicProcedure
      .input(
        z.object({
          photoBase64: z.string().min(1),
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ input }) => {
        const imageUrl = await generateLicenseCharacter({
          photoBase64: input.photoBase64,
          mimeType: input.mimeType,
        });
        return { imageUrl };
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
