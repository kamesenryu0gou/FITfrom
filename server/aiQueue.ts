/**
 * AI画像加工リクエスト制御 — セマフォ方式
 *
 * 複数人が同時にAI加工を要求した場合、OpenAI APIのレート制限に
 * 引っかからないよう、同時実行数を上限（MAX_CONCURRENT）に制限する。
 *
 * 設計：
 * - 同時実行数を最大 MAX_CONCURRENT 件に制限（セマフォ）
 * - 上限に達した場合は空きが出るまで待機キューに積む
 * - 各ジョブにタイムアウト（90秒）を設けて詰まりを防ぐ
 * - getQueueDepth() で「現在の待機人数」を返す（フロントエンド表示用）
 *
 * 例：MAX_CONCURRENT=3 の場合
 *   - 同時3人まで即座に処理開始
 *   - 4人目以降は1件完了次第すぐに処理開始
 *   - 10人が同時アクセスしても詰まらず順次さばける
 */

const MAX_CONCURRENT = 3; // OpenAI gpt-image-1 のレート制限に合わせた同時実行数
const QUEUE_TIMEOUT_MS = 90_000; // 1ジョブあたりの最大処理時間（90秒）

// 現在実行中のジョブ数
let _running = 0;

// 待機中のジョブ（resolve を呼ぶと実行許可が下りる）
const _waitQueue: Array<() => void> = [];

/**
 * 現在の待機人数を返す（実行中は含まない）
 */
export function getQueueDepth(): number {
  return _waitQueue.length;
}

/**
 * セマフォを取得する（空きがなければ待機）
 */
function acquireSemaphore(): Promise<void> {
  if (_running < MAX_CONCURRENT) {
    _running++;
    return Promise.resolve();
  }
  // 空きが出るまで待機キューに積む
  return new Promise<void>((resolve) => {
    _waitQueue.push(resolve);
  });
}

/**
 * セマフォを解放する（次の待機ジョブを起動）
 */
function releaseSemaphore(): void {
  const next = _waitQueue.shift();
  if (next) {
    // 待機中のジョブに実行許可を渡す（_running は変わらない）
    next();
  } else {
    _running = Math.max(0, _running - 1);
  }
}

/**
 * AI加工タスクをセマフォ制御下で実行する。
 * MAX_CONCURRENT 件まで同時実行し、超過分は待機させる。
 *
 * @param task - 実行する非同期関数
 * @returns タスクの戻り値
 */
export async function enqueueAiTask<T>(task: () => Promise<T>): Promise<T> {
  // セマフォ取得（空きがなければここで待機）
  await acquireSemaphore();

  // タイムアウト付きで実行
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("AI処理がタイムアウトしました。再度お試しください。")),
      QUEUE_TIMEOUT_MS
    )
  );

  try {
    const result = await Promise.race([task(), timeoutPromise]);
    return result;
  } finally {
    releaseSemaphore();
  }
}
