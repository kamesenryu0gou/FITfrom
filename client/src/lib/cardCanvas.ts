/**
 * cardCanvas.ts
 *
 * Renders the FIT WARS trading card onto an HTML Canvas using the EXACT same
 * layout constants as CardPreview.tsx, so the downloaded image is pixel-perfect
 * identical to the on-screen preview.
 *
 * Export resolution: 3× the preview size for high-quality output.
 *
 * Download strategy:
 *   1. Web Share API with files (iOS Safari 15+ / Android Chrome 89+)
 *      → opens native share sheet → user can "Save to Photos"
 *   2. Fallback: <a download> for desktop / unsupported browsers
 */

import type { CardData, ElementType } from "@/pages/Home";

// ── Layout constants — MUST match CardPreview.tsx exactly ─────────────────
// CardPreview uses CARD_W=300, CARD_H=475 as the display coordinate space.
// We render at SCALE× that size for high resolution output.

const CARD_W = 300;
const CARD_H = Math.round(CARD_W * (1011 / 638)); // 475

const UPPER_BAR_TOP    = CARD_H * 0.100;
const UPPER_BAR_HEIGHT = CARD_H * 0.077;

const PHOTO_TOP    = CARD_H * 0.244;
const PHOTO_HEIGHT = CARD_H * 0.500;

const LOWER_BAR_TOP    = CARD_H * 0.800;
const LOWER_BAR_HEIGHT = CARD_H * 0.078;

const BAR_LEFT  = CARD_W * 0.091;
const BAR_WIDTH = CARD_W * 0.817;

const RARITY_ROW_TOP    = CARD_H * 0.177;
const RARITY_ROW_HEIGHT = CARD_H * 0.067;

// ── Assets ────────────────────────────────────────────────────────────────
const CARD_IMAGES: Record<ElementType, string> = {
  火: "/manus-storage/card-fire_a21758fe.png",
  水: "/manus-storage/card-water_41be0131.png",
  草: "/manus-storage/card-grass_a6a91d27.png",
  闇: "/manus-storage/card-dark_6f0fa171.png",
};

const ELEMENT_COLORS: Record<ElementType, { primary: string; glow: string }> = {
  火: { primary: "#ff6633", glow: "rgba(255,102,51,0.7)" },
  水: { primary: "#33bbff", glow: "rgba(51,187,255,0.7)" },
  草: { primary: "#55dd33", glow: "rgba(85,221,51,0.7)" },
  闇: { primary: "#cc55ff", glow: "rgba(204,85,255,0.7)" },
};

// ── Helpers ───────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/** Draw text with a solid outline for readability on any background. */
function drawOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillColor: string,
  outlineWidth: number,
  outlineColor = "#000000"
) {
  ctx.save();
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineWidth;
  ctx.lineJoin = "round";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ── Main render function ──────────────────────────────────────────────────

/**
 * Renders the card to a canvas and returns it as a PNG Blob.
 * The canvas is drawn at SCALE× resolution for crisp output.
 * All coordinates use the same CARD_W/CARD_H space as CardPreview.tsx.
 */
export async function renderCardToBlob(cardData: CardData, scale = 3): Promise<Blob> {
  const W = CARD_W * scale;
  const H = CARD_H * scale;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Scale all drawing so we work in "preview" coordinates (CARD_W × CARD_H)
  ctx.scale(scale, scale);

  const colors = ELEMENT_COLORS[cardData.element];

  // ── Layer 1: Base card image ─────────────────────────────────────────────
  const cardImg = await loadImage(CARD_IMAGES[cardData.element]);
  ctx.drawImage(cardImg, 0, 0, CARD_W, CARD_H);

  // ── Layer 2: User photo clipped to white area ────────────────────────────
  if (cardData.photoUrl) {
    try {
      const photoImg = await loadImage(cardData.photoUrl);
      ctx.save();
      ctx.beginPath();
      ctx.rect(BAR_LEFT, PHOTO_TOP, BAR_WIDTH, PHOTO_HEIGHT);
      ctx.clip();

      // object-cover + object-top (same as CSS in CardPreview)
      const photoAspect = photoImg.width / photoImg.height;
      const boxAspect   = BAR_WIDTH / PHOTO_HEIGHT;
      let dw: number, dh: number, dx: number, dy: number;

      if (photoAspect > boxAspect) {
        // Photo is wider → fit height, center horizontally
        dh = PHOTO_HEIGHT;
        dw = PHOTO_HEIGHT * photoAspect;
        dx = BAR_LEFT - (dw - BAR_WIDTH) / 2;
        dy = PHOTO_TOP;
      } else {
        // Photo is taller → fit width, align to top (object-top)
        dw = BAR_WIDTH;
        dh = BAR_WIDTH / photoAspect;
        dx = BAR_LEFT;
        dy = PHOTO_TOP;
      }

      ctx.drawImage(photoImg, dx, dy, dw, dh);
      ctx.restore();
    } catch {
      // Photo failed to load — skip silently
    }
  }

  // ── Layer 3: Text overlays ───────────────────────────────────────────────
  ctx.textBaseline = "middle";

  // Card name — upper gray bar (centered)
  if (cardData.cardName) {
    const len = cardData.cardName.length;
    // Mirror CardPreview font sizes exactly
    const fontSize = len > 6 ? 14 : len > 4 ? 16 : 19;
    ctx.font = `900 ${fontSize}px 'Noto Sans JP', sans-serif`;
    ctx.textAlign = "center";
    drawOutlinedText(
      ctx,
      cardData.cardName,
      BAR_LEFT + BAR_WIDTH / 2,
      UPPER_BAR_TOP + UPPER_BAR_HEIGHT / 2,
      "#ffffff",
      3
    );
  }

  // Rarity — left side of rarity row
  if (cardData.rarity) {
    ctx.font = `900 14px 'Noto Sans JP', sans-serif`;
    ctx.textAlign = "left";
    drawOutlinedText(
      ctx,
      cardData.rarity,
      BAR_LEFT + 4,
      RARITY_ROW_TOP + RARITY_ROW_HEIGHT / 2,
      "#ffd700",
      2
    );
  }

  // Attack — right side of rarity row
  if (cardData.attack !== null) {
    const atkY = RARITY_ROW_TOP + RARITY_ROW_HEIGHT / 2;
    // "ATK" label (mirror CardPreview: 10px)
    ctx.font = `900 10px 'Noto Sans JP', sans-serif`;
    ctx.textAlign = "right";
    drawOutlinedText(ctx, "ATK", BAR_LEFT + BAR_WIDTH - 22, atkY, "#ffffff", 2);
    // Number (mirror CardPreview: 18px)
    ctx.font = `900 18px 'Noto Sans JP', sans-serif`;
    drawOutlinedText(ctx, String(cardData.attack), BAR_LEFT + BAR_WIDTH - 2, atkY, colors.primary, 3);
  }

  // Ability badge — just below photo area
  if (cardData.ability) {
    const badgeCY = PHOTO_TOP + PHOTO_HEIGHT + 4 + 7; // same offset as CardPreview
    const badgeCX = BAR_LEFT + BAR_WIDTH / 2;
    ctx.font = `700 10px 'Noto Sans JP', sans-serif`;
    ctx.textAlign = "center";

    const metrics = ctx.measureText(cardData.ability);
    const bw = metrics.width + 20;
    const bh = 14;

    ctx.fillStyle = colors.primary + "cc";
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeCX - bw / 2, badgeCY - bh / 2, bw, bh, 7);
    ctx.fill();
    ctx.stroke();

    drawOutlinedText(ctx, cardData.ability, badgeCX, badgeCY, "#ffffff", 1.5, "rgba(0,0,0,0.7)");
  }

  // Lower gray bar — special move (top) + description (bottom)
  const lowerMid = LOWER_BAR_TOP + LOWER_BAR_HEIGHT / 2;
  const hasMove  = Boolean(cardData.specialMove);
  const hasDesc  = Boolean(cardData.description);

  if (hasMove && hasDesc) {
    ctx.font = `900 12px 'Noto Sans JP', sans-serif`; // +2: 10→12px
    ctx.textAlign = "left";
    drawOutlinedText(
      ctx,
      `⚡ 必殺技：${cardData.specialMove}`,
      BAR_LEFT + 8,
      LOWER_BAR_TOP + LOWER_BAR_HEIGHT * 0.3,
      colors.primary,
      3 // アウトライン強化
    );
    ctx.font = `700 10px 'Noto Sans JP', sans-serif`; // +2: 8→10px, bold化
    drawOutlinedText(
      ctx,
      cardData.description,
      BAR_LEFT + 8,
      LOWER_BAR_TOP + LOWER_BAR_HEIGHT * 0.72,
      "#ffffff",
      3 // アウトライン強化
    );
  } else if (hasMove) {
    ctx.font = `900 12px 'Noto Sans JP', sans-serif`; // +2: 10→12px
    ctx.textAlign = "left";
    drawOutlinedText(
      ctx,
      `⚡ 必殺技：${cardData.specialMove}`,
      BAR_LEFT + 8,
      lowerMid,
      colors.primary,
      3 // アウトライン強化
    );
  } else if (hasDesc) {
    ctx.font = `700 10px 'Noto Sans JP', sans-serif`; // +2: 8→10px, bold化
    ctx.textAlign = "left";
    drawOutlinedText(ctx, cardData.description, BAR_LEFT + 8, lowerMid, "#ffffff", 3); // アウトライン強化
  }

  // ── Export ───────────────────────────────────────────────────────────────
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null"));
      },
      "image/png"
    );
  });
}

/**
 * Save the card PNG to the user's device.
 *
 * Mobile (iOS Safari 15+ / Android Chrome 89+):
 *   Opens native share sheet → user taps "Save to Photos" / "Save Image"
 *
 * Desktop / unsupported browsers:
 *   Triggers a standard file download
 */
export async function downloadCard(cardData: CardData): Promise<void> {
  const blob = await renderCardToBlob(cardData);
  const filename = `fitwars-card-${cardData.cardName || "my-card"}.png`;

  // iOS検出：User Agentに iPhone/iPad が含まれるかチェック
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (isIOS) {
    // iOS: 新しいタブで画像を開く→ユーザーが長押しで「写真に保存」できる
    const url = URL.createObjectURL(blob);
    const newTab = window.open(url, "_blank");
    if (!newTab) {
      // ポップアップブロック時はアンカーフォールバック
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return;
  }

  // Android / デスクトップ: <a download> でダウンロード
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Dual-card sheet download ──────────────────────────────────────────────
//
// 用紙仕様（JP-ID03N はがきサイズ 2面付き）:
//   シートサイズ: 100 × 148.5 mm @ 300dpi → 1181 × 1754 px
//   カードサイズ: 85.6 × 54 mm（横向き・ランドスケープ）→ 1011 × 638 px
//   カードテンプレートは縦向き（300×475）なので、90°回転してから配置する
//
// 配置計算（横向きカードを用紙に2枚縦に並べる）:
//   カード幅 = 85.6mm → 1011px
//   カード高 = 54mm  →  638px
//   左余白 = (100 - 85.6) / 2 = 7.2mm → 85px
//   上余白 = 18mm → 213px（JP-ID03N実測値）
//   カード間隔 = 4.5mm → 53px（JP-ID03N実測値）
//   カード1 top = 213px
//   カード2 top = 213 + 638 + 53 = 904px
//
// 90°回転の方法:
//   縦向きカード(CARD_W=300, CARD_H=475)を時計回り90°回転
//   → 回転後: 幅=475相当, 高さ=300相当
//   スケール = 1011/475 ≈ 2.128（縦横ほぼ同率で縦横比が保たれる）

const DPI = 300;
const MM_TO_PX = DPI / 25.4;

// 用紙: 100mm × 148.5mm @ 300dpi（縦向きハガキサイズ）JP-ID03N仕様
const SHEET_W_PX = Math.round(100 * MM_TO_PX);    // 1181 px
const SHEET_H_PX = Math.round(148.5 * MM_TO_PX);  // 1754 px

// カードは横向き（landscape）で配置: 85.6mm幅 × 54mm高さ
const CARD_SHEET_W = Math.round(85.6 * MM_TO_PX); // 1011 px（カードの幅）
const CARD_SHEET_H = Math.round(54 * MM_TO_PX);   //  638 px（カードの高さ）

// 左余白: 7.2mm（JP-ID03N実測値）
const MARGIN_LEFT = Math.round(7.2 * MM_TO_PX);   //  85 px
// 上余白: 16mm（JP-ID03N実測値 18mm から印刷ズレ補正 -2mm）
const MARGIN_TOP  = Math.round(16.0 * MM_TO_PX);  // 189 px
// カード間隔: 4.5mm（JP-ID03N実測値）
const CARD_GAP    = Math.round(4.5 * MM_TO_PX);   //  53 px

/**
 * Renders a single card at the exact pixel dimensions needed for the sheet.
 * カードテンプレートは縦向き（CARD_W=300, CARD_H=475）。
 * JP-ID03Nカードは横向き（85.6×54mm）なので、90°時計回りに回転して配置する。
 * 回転後スケール = CARD_SHEET_W / CARD_H ≈ 2.128（縦横比が保たれる）
 */
async function renderCardForSheet(
  cardData: CardData,
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number
): Promise<void> {
  // 縦向きカード(CARD_W=300, CARD_H=475)を90°回転してから描画
  // 回転後: 幅=CARD_SHEET_W=1011px, 高さ=CARD_SHEET_H=638px
  // スケール = CARD_SHEET_W / CARD_H = 1011/475 ≈ 2.128
  const SCALE = CARD_SHEET_W / CARD_H; // 2.128

  // まず縦向きカードを通常サイズで描画する一時キャンバス
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = CARD_W;   // 300
  tmpCanvas.height = CARD_H;  // 475
  const tmpCtx = tmpCanvas.getContext("2d")!;

  // スケールなし（1:1）で描画
  const scaleX = 1;
  const scaleY = 1;
  tmpCtx.scale(scaleX, scaleY);

  const colors = ELEMENT_COLORS[cardData.element];

  // Layer 1: Base card image
  const cardImg = await loadImage(CARD_IMAGES[cardData.element]);
  tmpCtx.drawImage(cardImg, 0, 0, CARD_W, CARD_H);

  // Layer 2: User photo
  if (cardData.photoUrl) {
    try {
      const photoImg = await loadImage(cardData.photoUrl);
      tmpCtx.save();
      tmpCtx.beginPath();
      tmpCtx.rect(BAR_LEFT, PHOTO_TOP, BAR_WIDTH, PHOTO_HEIGHT);
      tmpCtx.clip();

      const photoAspect = photoImg.width / photoImg.height;
      const boxAspect   = BAR_WIDTH / PHOTO_HEIGHT;
      let dw: number, dh: number, dx: number, dy: number;

      if (photoAspect > boxAspect) {
        dh = PHOTO_HEIGHT;
        dw = PHOTO_HEIGHT * photoAspect;
        dx = BAR_LEFT - (dw - BAR_WIDTH) / 2;
        dy = PHOTO_TOP;
      } else {
        dw = BAR_WIDTH;
        dh = BAR_WIDTH / photoAspect;
        dx = BAR_LEFT;
        dy = PHOTO_TOP;
      }
      tmpCtx.drawImage(photoImg, dx, dy, dw, dh);
      tmpCtx.restore();
    } catch {
      // skip
    }
  }

  // Layer 3: Text overlays (same as renderCardToBlob)
  tmpCtx.textBaseline = "middle";

  if (cardData.cardName) {
    const len = cardData.cardName.length;
    const fontSize = len > 6 ? 14 : len > 4 ? 16 : 19;
    tmpCtx.font = `900 ${fontSize}px 'Noto Sans JP', sans-serif`;
    tmpCtx.textAlign = "center";
    drawOutlinedText(tmpCtx, cardData.cardName, BAR_LEFT + BAR_WIDTH / 2, UPPER_BAR_TOP + UPPER_BAR_HEIGHT / 2, "#ffffff", 3);
  }

  if (cardData.rarity) {
    tmpCtx.font = `900 14px 'Noto Sans JP', sans-serif`;
    tmpCtx.textAlign = "left";
    drawOutlinedText(tmpCtx, cardData.rarity, BAR_LEFT + 4, RARITY_ROW_TOP + RARITY_ROW_HEIGHT / 2, "#ffd700", 2);
  }

  if (cardData.attack !== null) {
    const atkY = RARITY_ROW_TOP + RARITY_ROW_HEIGHT / 2;
    tmpCtx.font = `900 10px 'Noto Sans JP', sans-serif`;
    tmpCtx.textAlign = "right";
    drawOutlinedText(tmpCtx, "ATK", BAR_LEFT + BAR_WIDTH - 22, atkY, "#ffffff", 2);
    tmpCtx.font = `900 18px 'Noto Sans JP', sans-serif`;
    drawOutlinedText(tmpCtx, String(cardData.attack), BAR_LEFT + BAR_WIDTH - 2, atkY, colors.primary, 3);
  }

  if (cardData.ability) {
    const badgeCY = PHOTO_TOP + PHOTO_HEIGHT + 4 + 7;
    const badgeCX = BAR_LEFT + BAR_WIDTH / 2;
    tmpCtx.font = `700 10px 'Noto Sans JP', sans-serif`;
    tmpCtx.textAlign = "center";
    const metrics = tmpCtx.measureText(cardData.ability);
    const bw = metrics.width + 20;
    const bh = 14;
    tmpCtx.fillStyle = colors.primary + "cc";
    tmpCtx.strokeStyle = colors.primary;
    tmpCtx.lineWidth = 1;
    tmpCtx.beginPath();
    tmpCtx.roundRect(badgeCX - bw / 2, badgeCY - bh / 2, bw, bh, 7);
    tmpCtx.fill();
    tmpCtx.stroke();
    drawOutlinedText(tmpCtx, cardData.ability, badgeCX, badgeCY, "#ffffff", 1.5, "rgba(0,0,0,0.7)");
  }

  const lowerMid = LOWER_BAR_TOP + LOWER_BAR_HEIGHT / 2;
  const hasMove  = Boolean(cardData.specialMove);
  const hasDesc  = Boolean(cardData.description);

  if (hasMove && hasDesc) {
    tmpCtx.font = `900 12px 'Noto Sans JP', sans-serif`; // +2: 10→12px
    tmpCtx.textAlign = "left";
    drawOutlinedText(tmpCtx, `⚡ 必殺技：${cardData.specialMove}`, BAR_LEFT + 8, LOWER_BAR_TOP + LOWER_BAR_HEIGHT * 0.3, colors.primary, 3);
    tmpCtx.font = `700 10px 'Noto Sans JP', sans-serif`; // +2: 8→10px, bold化
    drawOutlinedText(tmpCtx, cardData.description, BAR_LEFT + 8, LOWER_BAR_TOP + LOWER_BAR_HEIGHT * 0.72, "#ffffff", 3);
  } else if (hasMove) {
    tmpCtx.font = `900 12px 'Noto Sans JP', sans-serif`; // +2: 10→12px
    tmpCtx.textAlign = "left";
    drawOutlinedText(tmpCtx, `⚡ 必殺技：${cardData.specialMove}`, BAR_LEFT + 8, lowerMid, colors.primary, 3);
  } else if (hasDesc) {
    tmpCtx.font = `700 10px 'Noto Sans JP', sans-serif`; // +2: 8→10px, bold化
    tmpCtx.textAlign = "left";
    drawOutlinedText(tmpCtx, cardData.description, BAR_LEFT + 8, lowerMid, "#ffffff", 3);
  }

  // 縦向きカードを90°時計回りに回転してシートに貼り付ける
  // 回転後: 幅=CARD_SHEET_W(1011px), 高さ=CARD_SHEET_H(638px)
  ctx.save();
  ctx.translate(offsetX + CARD_SHEET_W, offsetY);
  ctx.rotate(Math.PI / 2); // 90°時計回り
  ctx.drawImage(tmpCanvas, 0, 0, CARD_W * SCALE, CARD_H * SCALE);
  ctx.restore();
}

/**
 * Generates a 2-up card sheet image (用紙サイズ 100×148.5mm @ 300dpi)
 * and saves it to the user's device.
 *
 * Layout:
 *   Top slot:    card1 (1枚目)
 *   Bottom slot: card2 (2枚目)
 */
export async function downloadDualCard(card1: CardData, card2: CardData): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width  = SHEET_W_PX;
  canvas.height = SHEET_H_PX;
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SHEET_W_PX, SHEET_H_PX);

  // Card 1 (top)
  // 1枚目は元の18mm位置（213px）に戻す：MARGIN_TOP(189px) + 2mm(24px) = 213px
  const card1Top = MARGIN_TOP + Math.round(2.0 * (300 / 25.4)); // 213 px = 18mm
  await renderCardForSheet(card1, ctx, MARGIN_LEFT, card1Top);

  // Card 2 (bottom)
  // 2枚目は固定値880px（前回修正済みの位置）を維持
  const card2Top = 880; // 固定: 16mm上余白 + 638pxカード高 + 53px間隔 = 880px
  await renderCardForSheet(card2, ctx, MARGIN_LEFT, card2Top);

  // Export as PNG
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => { if (b) resolve(b); else reject(new Error("Canvas toBlob returned null")); },
      "image/jpeg",
      0.9
    );
  });

  const filename = "fitwars-card-sheet.jpg";

  // 全デバイス統一: <a download> でダウンロード（iOS/Android/PC共通）
  // iOS Chromeでは「a》タグのdownload属性が機能し、ファイルアプリまたは写真アプリに保存される
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
