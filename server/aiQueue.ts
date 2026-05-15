/**
 * AI Request Queue — Semaphore-based concurrent processor
 *
 * 設計方針:
 * - 環境変数 MAX_CONCURRENT_AI_REQUESTS で同時実行数を制御（デフォルト10）
 * - セマフォ方式で同時実行数を超えたリクエストは待機
 * - AI_QUEUE_WAIT_LIMIT を超えた待機は即エラー
 * - キュー統計情報をリアルタイムで提供（管理画面用）
 * - getQueueDepth() は後方互換のため維持
 */

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_AI_REQUESTS ?? "10", 10);
const QUEUE_WAIT_LIMIT = parseInt(process.env.AI_QUEUE_WAIT_LIMIT ?? "120000", 10);
const JOB_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS ?? "90000", 10);

// ── 統計カウンター（管理画面用） ──────────────────────────────────────────
const stats = {
  queued: 0,
  running: 0,
  succeeded: 0,
  failed: 0,
  totalMs: 0,
  completedCount: 0,
};

export function getQueueStats() {
  return {
    queued: stats.queued,
    running: stats.running,
    succeeded: stats.succeeded,
    failed: stats.failed,
    avgProcessingMs: stats.completedCount > 0
      ? Math.round(stats.totalMs / stats.completedCount)
      : 0,
    maxConcurrent: MAX_CONCURRENT,
  };
}

/** 後方互換: 待機中 + 実行中の合計を返す */
export function getQueueDepth(): number {
  return stats.queued + stats.running;
}

// ── セマフォ実装 ──────────────────────────────────────────────────────────
let activeSlots = 0;
const waitQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (activeSlots < MAX_CONCURRENT) {
      activeSlots++;
      stats.running++;
      resolve();
      return;
    }

    // 待機キューに追加
    stats.queued++;
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      stats.queued = Math.max(0, stats.queued - 1);
      const idx = waitQueue.indexOf(tryAcquire);
      if (idx !== -1) waitQueue.splice(idx, 1);
      reject(new Error("QUEUE_TIMEOUT: 混雑しています。しばらく後にお試しください。"));
    }, QUEUE_WAIT_LIMIT);

    const tryAcquire = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      stats.queued = Math.max(0, stats.queued - 1);
      activeSlots++;
      stats.running++;
      resolve();
    };

    waitQueue.push(tryAcquire);
  });
}

function releaseSlot(): void {
  activeSlots = Math.max(0, activeSlots - 1);
  stats.running = Math.max(0, stats.running - 1);
  const next = waitQueue.shift();
  if (next) next();
}

// ── メインエントリ ────────────────────────────────────────────────────────
export async function enqueueAiTask<T>(task: () => Promise<T>): Promise<T> {
  await acquireSlot();
  const startMs = Date.now();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("AI処理がタイムアウトしました。再度お試しください。")),
      JOB_TIMEOUT_MS
    )
  );

  try {
    const result = await Promise.race([task(), timeoutPromise]);
    stats.succeeded++;
    stats.totalMs += Date.now() - startMs;
    stats.completedCount++;
    return result;
  } catch (err) {
    stats.failed++;
    throw err;
  } finally {
    releaseSlot();
  }
}
