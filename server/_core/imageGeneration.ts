/**
 * Image generation helper using internal ImageService
 *
 * ── 同時実行数制限（Concurrency Limit / Queue処理） ──────────────────────────
 * イベント時の複数拠点からの同時アクセス（100件以上）に耐えるため、
 * 外部 ImageService API への同時リクエスト数を最大 IMAGE_CONCURRENCY 件に制限する。
 * 制限を超えたリクエストはインメモリキューで順番待ちし、前の処理完了後に自動実行される。
 * Base64→Buffer 変換も同一キュー内で行い、OOM（メモリ枯渇）を防止する。
 * ファイル名には crypto.randomUUID() を付与し、ミリ秒重複による上書きを防ぐ。
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 *
 * For editing:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "Add a rainbow to this landscape",
 *     originalImages: [{
 *       url: "https://example.com/original.jpg",
 *       mimeType: "image/jpeg"
 *     }]
 *   });
 */
import { randomUUID } from "crypto";
import { storagePut } from "server/storage";
import { ENV } from "./env";

// ── 同時実行数制限（インメモリセマフォ） ─────────────────────────────────────
// 外部 ImageService への同時リクエスト数を最大 2 件に制限する。
// 制限を超えたリクエストはキューで順番待ちし、前の処理完了後に自動実行される。
const IMAGE_CONCURRENCY = 2;
let _activeCount = 0;
const _waitQueue: Array<() => void> = [];

/**
 * セマフォを取得する。空きがなければ空きが出るまで await で待機する。
 */
function acquireSemaphore(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (_activeCount < IMAGE_CONCURRENCY) {
      _activeCount++;
      resolve();
    } else {
      _waitQueue.push(() => {
        _activeCount++;
        resolve();
      });
    }
  });
}

/**
 * セマフォを解放する。キューに待機中のリクエストがあれば次を起動する。
 */
function releaseSemaphore(): void {
  _activeCount = Math.max(0, _activeCount - 1);
  if (_waitQueue.length > 0) {
    const next = _waitQueue.shift()!;
    next();
  }
}

// ── 型定義 ───────────────────────────────────────────────────────────────────

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

// ── メイン関数 ───────────────────────────────────────────────────────────────

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  // セマフォ取得（同時実行数が上限に達している場合はここで await 待機）
  await acquireSemaphore();

  try {
    // Build the full URL by appending the service path to the base URL
    const baseUrl = ENV.forgeApiUrl.endsWith("/")
      ? ENV.forgeApiUrl
      : `${ENV.forgeApiUrl}/`;
    const fullUrl = new URL(
      "images.v1.ImageService/GenerateImage",
      baseUrl
    ).toString();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "connect-protocol-version": "1",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify({
        prompt: options.prompt,
        original_images: options.originalImages || [],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
    }

    const result = (await response.json()) as {
      image: {
        b64Json: string;
        mimeType: string;
      };
    };

    // Base64 → Buffer 変換（セマフォ内で実行することで同時大量変換によるOOMを防止）
    const base64Data = result.image.b64Json;
    const buffer = Buffer.from(base64Data, "base64");

    // ファイル名に UUID を付与してミリ秒重複による上書きを防止
    const uuid = randomUUID();
    const fileKey = `generated/${Date.now()}-${uuid}.png`;

    // Save to S3
    const { url } = await storagePut(
      fileKey,
      buffer,
      result.image.mimeType
    );

    return { url };
  } finally {
    // 成功・失敗どちらの場合もセマフォを解放し、次の待機リクエストを起動する
    releaseSemaphore();
  }
}
