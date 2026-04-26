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
    ctx.font = `900 10px 'Noto Sans JP', sans-serif`;
    ctx.textAlign = "left";
    drawOutlinedText(
      ctx,
      `⚡ 必殺技：${cardData.specialMove}`,
      BAR_LEFT + 8,
      LOWER_BAR_TOP + LOWER_BAR_HEIGHT * 0.3,
      colors.primary,
      2
    );
    ctx.font = `400 8px 'Noto Sans JP', sans-serif`;
    drawOutlinedText(
      ctx,
      cardData.description,
      BAR_LEFT + 8,
      LOWER_BAR_TOP + LOWER_BAR_HEIGHT * 0.72,
      "#ffffff",
      2
    );
  } else if (hasMove) {
    ctx.font = `900 10px 'Noto Sans JP', sans-serif`;
    ctx.textAlign = "left";
    drawOutlinedText(
      ctx,
      `⚡ 必殺技：${cardData.specialMove}`,
      BAR_LEFT + 8,
      lowerMid,
      colors.primary,
      2
    );
  } else if (hasDesc) {
    ctx.font = `400 8px 'Noto Sans JP', sans-serif`;
    ctx.textAlign = "left";
    drawOutlinedText(ctx, cardData.description, BAR_LEFT + 8, lowerMid, "#ffffff", 2);
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
  const file = new File([blob], filename, { type: "image/png" });

  // ── Strategy 1: Web Share API with files ─────────────────────────────
  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "FIT WARS カード",
        text: `${cardData.cardName || "マイカード"} — FIT WARS Card Maker`,
      });
      return;
    } catch (err) {
      // User cancelled → treat as success (no error)
      if ((err as Error).name === "AbortError") return;
      // Other error → fall through to download
    }
  }

  // ── Strategy 2: Fallback anchor download ─────────────────────────────
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
