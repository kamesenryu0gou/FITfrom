/**
 * licenseCanvas.ts
 *
 * 免許メーカーのカードをCanvas上に描画する。
 * FIT WARSの cardCanvas.ts と同じ方式を採用:
 *   - 台紙画像のピクセルサイズ (1075×650) をそのまま座標空間として使用
 *   - ダウンロード時は ctx.scale(SCALE, SCALE) で高解像度化するだけ
 *
 * 座標は台紙画像 (license-card-base.png, 1075×650px) を
 * Pillow で精密に計測して確定した実測値。
 *
 * 実測結果:
 *   名前:     y=46-100   (h=54)
 *   長所:     y=105-135  (h=30)
 *   日付:     y=141-177  (h=36)
 *   約束:     y=228-510  (h=282)
 *   将来の夢: y=516-557  (h=41)
 *   発行:     y=563-602  (h=39)
 *   写真:     x=630-1030, y=46-602
 *   テキスト開始: x=160
 *
 * ユーザー指定mm調整:
 *   名前:     右に4mm(+50px) → x=210
 *   長所:     右に4mm(+50px) → x=210
 *   日付:     右に6mm(+75px) → x=235, 文字小さめ
 *   約束:     下に1mm(+12px) → y=240
 *   将来の夢: 右に2mm(+25px) → x=185
 *   免許メーカー: 右に2文字分(約30px) → x=190
 */

export interface LicenseData {
  name: string;
  strength: string;
  date: string;
  promise: string;
  dream: string;
  issuer: string;
  photoUrl: string | null;
}

// ── Layout constants (台紙 1075×650px 基準・Pillow実測値) ────────────────────

export const CARD_W = 1075;
export const CARD_H = 650;

// 写真エリア (実測値: x=630-1030, y=46-602)
export const PHOTO_L = 630;   // 写真左端
export const CARD_R  = 1030;  // 写真右端
export const PHOTO_Y1 = 46;   // 写真上端
export const PHOTO_Y2 = 602;  // 写真下端

// 名前入力エリア (実測: y=46-100, ユーザー調整: x=210)
export const NAME_X  = 210;
export const NAME_Y1 = 46;
export const NAME_Y2 = 100;

// 長所入力エリア (実測: y=105-135, ユーザー調整: x=210)
export const KYOSHO_X  = 210;
export const KYOSHO_Y1 = 105;
export const KYOSHO_Y2 = 135;

// 日付入力エリア (実測: y=141-177, ユーザー調整: x=235, 文字小さめ)
export const DATE_X  = 235;
export const DATE_Y1 = 141;
export const DATE_Y2 = 177;

// 約束テキストエリア (実測: y=228-510, ユーザー調整: 下に1mm → y=240, x=210)
export const YAKUSOKU_X  = 210;
export const YAKUSOKU_Y1 = 240;
export const YAKUSOKU_Y2 = 510;

// 将来の夢入力エリア (実測: y=516-557, ユーザー調整: x=185)
export const YUME_X  = 185;
export const YUME_Y1 = 516;
export const YUME_Y2 = 557;

// 発行入力エリア (実測: y=563-602, ユーザー調整: 右に2文字 → x=190)
export const HAKKO_X  = 190;
export const HAKKO_Y1 = 563;
export const HAKKO_Y2 = 602;

// ── Assets ────────────────────────────────────────────────────────────────
export const LICENSE_CARD_BASE_URL = "/manus-storage/license-card-base_65f89f3f.png";

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

/**
 * 写真を指定エリアに object-cover + object-top で描画する。
 */
function drawPhotoCover(
  ctx: CanvasRenderingContext2D,
  photoImg: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const photoAspect = photoImg.width / photoImg.height;
  const boxAspect = w / h;
  let dw: number, dh: number, dx: number, dy: number;

  if (photoAspect > boxAspect) {
    // 写真が横長 → 高さに合わせて横中央
    dh = h;
    dw = h * photoAspect;
    dx = x - (dw - w) / 2;
    dy = y;
  } else {
    // 写真が縦長 → 幅に合わせて上揃え (object-top)
    dw = w;
    dh = w / photoAspect;
    dx = x;
    dy = y;
  }

  ctx.drawImage(photoImg, dx, dy, dw, dh);
  ctx.restore();
}

/**
 * テキストを指定エリア内に収まるよう折り返して描画する。
 * 約束フィールドの複数行テキスト用。
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const chars = text.split("");
  let line = "";
  let lineCount = 0;

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = chars[i];
      lineCount++;
      if (lineCount >= maxLines) break;
    } else {
      line = testLine;
    }
  }
  if (lineCount < maxLines && line) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
  }
}

// ── Main render function ──────────────────────────────────────────────────

/**
 * 1枚のカードを Canvas に描画して PNG Blob を返す。
 * SCALE=3 で高解像度出力（3225×1950px）。
 * 座標は CARD_W/CARD_H (1075×650) 空間で指定し、ctx.scale(SCALE,SCALE) で拡大。
 */
export async function renderLicenseCardToBlob(
  data: LicenseData,
  scale = 3
): Promise<Blob> {
  const W = CARD_W * scale;
  const H = CARD_H * scale;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 以降の座標はすべて 1075×650 空間で記述
  ctx.scale(scale, scale);

  // ── Layer 1: 台紙画像 ────────────────────────────────────────────────────
  const baseImg = await loadImage(LICENSE_CARD_BASE_URL);
  ctx.drawImage(baseImg, 0, 0, CARD_W, CARD_H);

  // ── Layer 2: 写真 ────────────────────────────────────────────────────────
  if (data.photoUrl) {
    try {
      const photoImg = await loadImage(data.photoUrl);
      const pw = CARD_R - PHOTO_L;   // 400px
      const ph = PHOTO_Y2 - PHOTO_Y1; // 556px
      drawPhotoCover(ctx, photoImg, PHOTO_L, PHOTO_Y1, pw, ph);
    } catch {
      // 写真読み込み失敗は無視
    }
  }

  // ── Layer 3: テキスト ────────────────────────────────────────────────────
  ctx.fillStyle = "#222222";
  ctx.textBaseline = "middle";

  // 名前 (y=46-100, x=210)
  if (data.name) {
    const fontSize = data.name.length > 10 ? 18 : data.name.length > 6 ? 22 : 26;
    ctx.font = `bold ${fontSize}px 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif`;
    ctx.textAlign = "left";
    const nameY = (NAME_Y1 + NAME_Y2) / 2;
    ctx.fillText(data.name, NAME_X, nameY, PHOTO_L - NAME_X - 10);
  }

  // 長所 (y=105-135, x=210)
  if (data.strength) {
    const fontSize = data.strength.length > 12 ? 14 : data.strength.length > 8 ? 16 : 18;
    ctx.font = `normal ${fontSize}px 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif`;
    ctx.textAlign = "left";
    const kyoshoY = (KYOSHO_Y1 + KYOSHO_Y2) / 2;
    ctx.fillText(data.strength, KYOSHO_X, kyoshoY, PHOTO_L - KYOSHO_X - 10);
  }

  // 日付 (y=141-177, x=235, 文字小さめ)
  if (data.date) {
    const fontSize = 14; // 小さめ
    ctx.font = `normal ${fontSize}px 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif`;
    ctx.textAlign = "left";
    const dateY = (DATE_Y1 + DATE_Y2) / 2;
    ctx.fillText(data.date, DATE_X, dateY, PHOTO_L - DATE_X - 10);
  }

  // 約束（複数行折り返し, y=240-510, x=210）
  if (data.promise) {
    const areaW = PHOTO_L - YAKUSOKU_X - 10;
    const areaH = YAKUSOKU_Y2 - YAKUSOKU_Y1;
    const charCount = data.promise.length;
    const fontSize = charCount > 40 ? 16 : charCount > 20 ? 18 : 20;
    const lineHeight = fontSize * 1.6;
    const maxLines = Math.floor(areaH / lineHeight);
    ctx.font = `normal ${fontSize}px 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif`;
    ctx.textAlign = "left";
    drawWrappedText(
      ctx,
      data.promise,
      YAKUSOKU_X,
      YAKUSOKU_Y1 + fontSize * 0.8,
      areaW,
      lineHeight,
      maxLines
    );
  }

  // 将来の夢 (y=516-557, x=185)
  if (data.dream) {
    const fontSize = data.dream.length > 10 ? 14 : 16;
    ctx.font = `normal ${fontSize}px 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif`;
    ctx.textAlign = "left";
    const yumeY = (YUME_Y1 + YUME_Y2) / 2;
    ctx.fillText(data.dream, YUME_X, yumeY, PHOTO_L - YUME_X - 10);
  }

  // 発行 (y=563-602, x=190)
  if (data.issuer) {
    const fontSize = 14;
    ctx.font = `normal ${fontSize}px 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif`;
    ctx.textAlign = "left";
    const hakkoY = (HAKKO_Y1 + HAKKO_Y2) / 2;
    ctx.fillText(data.issuer, HAKKO_X, hakkoY, PHOTO_L - HAKKO_X - 10);
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
 * A4縦 (2480×3508px) に2枚のカードを上下に並べた印刷用シートを生成する。
 */
export async function renderLicenseSheetToBlob(
  data1: LicenseData,
  data2: LicenseData | null
): Promise<Blob> {
  // A4縦 @ 300dpi
  const SHEET_W = 2480;
  const SHEET_H = 3508;

  // カードを3倍スケールで描画 → 3225×1950px
  const SCALE = 3;
  const CARD_PX_W = CARD_W * SCALE; // 3225
  const CARD_PX_H = CARD_H * SCALE; // 1950

  // A4幅に対してカードを収める際のスケール
  const MARGIN = 100;
  const fitScale = (SHEET_W - MARGIN * 2) / CARD_PX_W;
  const scaledW = Math.round(CARD_PX_W * fitScale);
  const scaledH = Math.round(CARD_PX_H * fitScale);

  // 2枚の合計高さ + マージン
  const GAP = 60;
  const totalH = scaledH * 2 + GAP;
  const startY = Math.round((SHEET_H - totalH) / 2);
  const startX = Math.round((SHEET_W - scaledW) / 2);

  const sheet = document.createElement("canvas");
  sheet.width = SHEET_W;
  sheet.height = SHEET_H;
  const sCtx = sheet.getContext("2d")!;

  // 白背景
  sCtx.fillStyle = "#ffffff";
  sCtx.fillRect(0, 0, SHEET_W, SHEET_H);

  // 1枚目を描画
  const blob1 = await renderLicenseCardToBlob(data1, SCALE);
  const img1 = await loadImage(URL.createObjectURL(blob1));
  sCtx.drawImage(img1, startX, startY, scaledW, scaledH);

  // 2枚目を描画
  const data2Effective = data2 ?? data1;
  const blob2 = await renderLicenseCardToBlob(data2Effective, SCALE);
  const img2 = await loadImage(URL.createObjectURL(blob2));
  sCtx.drawImage(img2, startX, startY + scaledH + GAP, scaledW, scaledH);

  return new Promise<Blob>((resolve, reject) => {
    sheet.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Sheet toBlob returned null"));
      },
      "image/png"
    );
  });
}

/**
 * A4シートをデバイスに保存する。
 * iOS Safari: Web Share API → ネイティブ共有シート
 * その他: <a download> でダウンロード
 */
export async function downloadLicenseSheet(
  data1: LicenseData,
  data2: LicenseData | null,
  filename = "license-card.png"
): Promise<void> {
  const blob = await renderLicenseSheetToBlob(data1, data2);
  const file = new File([blob], filename, { type: "image/png" });

  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "免許メーカー",
        text: "オリジナル免許証",
      });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
