import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { storagePut } from "./storage";

/**
 * AI Anime Conversion — DQ風チビキャラ変換 v5
 *
 * Pipeline:
 * Step 1 → GPT-4o Vision: 写真から人物特徴（顔・年齢・髪・服の色）を抽出
 * Step 2 → DALL-E 3 images/generations: 特徴を埋め込んだプロンプトで新規生成
 *
 * ※ gpt-image-1 editモードは廃止（APIエラー回避）
 * ※ 写真はビジュアルリファレンスとして使用（編集ではなく新規生成）
 */

// ── Character Job Definitions ─────────────────────────────────────────────

const JOBS = [
  { key: "Hero",      ja: "勇者",   outfit: "light armor, cape, sword, JRPG hero" },
  { key: "Priest",    ja: "僧侶",   outfit: "white robe, staff, holy symbol, JRPG healer" },
  { key: "Mage",      ja: "魔法使い", outfit: "pointed hat, magic robe, glowing staff, JRPG mage" },
  { key: "DemonLord", ja: "魔王",   outfit: "dark cloak, horns, magical aura, JRPG demon lord" },
  { key: "Swordsman", ja: "剣士",   outfit: "leather armor, dual blades, battle stance, JRPG warrior" },
];

// ── Step 1: GPT-4o Vision — 写真から人物特徴を抽出 ──────────────────────────

async function extractPersonFeatures(
  photoBase64: string,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You are a character artist assistant. Analyze the photo and output a concise English description of the person for use in an illustration prompt. Focus only on: age range (be specific, e.g. 'man in his 40s'), hair color and style, facial features (beard, glasses if any), body type, and dominant clothing colors. Output as a single paragraph, max 80 words. No bullet points.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${photoBase64}`,
                detail: "low",
              },
            },
            {
              type: "text",
              text: "Describe this person's appearance for an illustration reference.",
            },
          ],
        },
      ],
    }),
  });

  if (!visionRes.ok) {
    const err = await visionRes.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`GPT-4o vision error: ${err?.error?.message || visionRes.status}`);
  }

  const visionData = await visionRes.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return visionData.choices?.[0]?.message?.content?.trim() ?? "adult person";
}

// ── Step 2: DALL-E 3 新規生成 ─────────────────────────────────────────────

function buildDalle3Prompt(personDesc: string, outfit: string): string {
  return `Masterpiece, high-end TCG splash art, cinematic dramatic lighting, intricate hyper-detailed.
Semi-chibi character illustration, Dragon Quest-style cosplay outfit: ${outfit}.
Character based on this person: ${personDesc}.
Preserve exact facial structure, bone structure, age, hair, expression — do NOT rejuvenate or idealize.
Rich digital painting, thick paint texture, detailed fabric folds, soft global illumination, SSR game card quality.
Pure artwork only — NO text, NO letters, NO numbers, NO watermark, NO captions, NO descriptions anywhere in the image.
1:1 square composition, centered character, fantasy background.`.trim();
}

// ── Main Function ─────────────────────────────────────────────────────────

async function generateAnimeCharacter(options: {
  photoBase64: string;
  mimeType: string;
  element: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  // Step 1: 写真から人物特徴を抽出
  const personDesc = await extractPersonFeatures(
    options.photoBase64,
    options.mimeType,
    apiKey
  );

  // ランダムに職業を選択
  const job = JOBS[Math.floor(Math.random() * JOBS.length)];
  const prompt = buildDalle3Prompt(personDesc, job.outfit);

  // Step 2: DALL-E 3 新規生成（images/generations）
  const genRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural",
      response_format: "b64_json",
    }),
  });

  if (!genRes.ok) {
    const err = await genRes.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`DALL-E 3 generation error: ${err?.error?.message || genRes.status}`);
  }

  const genData = await genRes.json() as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };

  const b64 = genData.data?.[0]?.b64_json;
  const imageUrl = genData.data?.[0]?.url;

  if (b64) {
    const buffer = Buffer.from(b64, "base64");
    const { url } = await storagePut(
      `anime-converted/${Date.now()}.png`,
      buffer,
      "image/png"
    );
    return url;
  } else if (imageUrl) {
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

  throw new Error("No image data returned from DALL-E 3");
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
