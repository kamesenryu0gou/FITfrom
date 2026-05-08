/**
 * LicenseMaker.tsx
 * 子供向け免許証メーカー
 * - HTMLサンプル（!DOCTYPE.html）のデザインをベースに再構築
 * - マカロン風入力フィールド・キャンディ背景・左フォーム右プレビュー
 * - 「作成」ボタンで台紙ベースの2枚プレビュー表示
 * - ダウンロード機能（スマホ対応）
 */
import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import { trpc } from "@/lib/trpc";

const LICENSE_LOGO_URL = "/manus-storage/license-maker-logo-new2_eff90f28.png";
const LICENSE_CARD_BASE_URL = "/manus-storage/license-card-base_65f89f3f.png";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LicenseData {
  nickname: string;
  strength: string;
  date: string;
  promise: string;
  dream: string;
  photoUrl: string | null;
  photoFile: File | null;
  aiPhotoUrl: string | null;
}

const INITIAL_LICENSE: LicenseData = {
  nickname: "",
  strength: "",
  date: "",
  promise: "",
  dream: "",
  photoUrl: null,
  photoFile: null,
  aiPhotoUrl: null,
};

// ── Crop helpers ───────────────────────────────────────────────────────────────
interface CropArea { x: number; y: number; width: number; height: number; }

async function getCroppedImg(imageSrc: string, pixelCrop: CropArea): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height
  );
  return canvas.toDataURL("image/jpeg", 0.95);
}

// ── Crop Modal ─────────────────────────────────────────────────────────────────
function CropModal({
  imageSrc,
  onDone,
  onCancel,
}: {
  imageSrc: string;
  onDone: (croppedUrl: string) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedAreaPixels(pixels);
  }, []);
  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    const url = await getCroppedImg(imageSrc, croppedAreaPixels);
    onDone(url);
  };
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
      zIndex: 9999, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#11082f", borderRadius: "20px", overflow: "hidden",
        width: "min(92vw, 500px)", boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
        border: "4px solid #ff66b2",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "2px dashed #555", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#fff", fontFamily: "'DotGothic16', sans-serif" }}>写真を切り取る（3:4）</span>
          <button onClick={onCancel} style={{ background: "rgba(255,102,178,0.3)", border: "2px solid #ff66b2", cursor: "pointer", fontSize: "16px", color: "#fff", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ position: "relative", width: "100%", height: "320px", background: "#000" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div style={{ padding: "16px 24px" }}>
          <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", display: "block", marginBottom: "8px", fontFamily: "'DotGothic16', sans-serif" }}>ズーム</label>
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#ff66b2" }}
          />
        </div>
        <div style={{ padding: "0 24px 24px", display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "14px", border: "2px solid #555",
              borderRadius: "10px", background: "rgba(255,255,255,0.05)", color: "#fff",
              fontWeight: 600, fontSize: "14px", cursor: "pointer",
              fontFamily: "'DotGothic16', sans-serif",
            }}
          >キャンセル</button>
          <button
            onClick={handleDone}
            style={{
              flex: 2, padding: "14px", border: "2px solid #cc0066",
              borderRadius: "10px", background: "linear-gradient(to bottom, #ff66b2, #cc0066)", color: "#fff",
              fontWeight: 700, fontSize: "14px", cursor: "pointer",
              boxShadow: "0 4px 0 #880044",
              fontFamily: "'DotGothic16', sans-serif",
            }}
          >この範囲で決定</button>
        </div>
      </div>
    </div>
  );
}

// ── LicenseCardPreview ────────────────────────────────────────────────────────
// 台紙実測値（1075×650px）をそのまま%値に変換（精密計測済み・確定値）
//
// 確定した行構造（アノテーション画像で検証済み）:
//   行0: y=0〜41   (空白)
//   行1: y=41〜101  (「名前」ラベル + 名前入力エリア)
//   行2: y=101〜136 (空白行)
//   行3: y=136〜179 (「長所」ラベル + 長所入力エリア)
//   行4: y=179〜223 (「日付」ラベル + 日付入力エリア)
//   行5: y=223〜242 (「おとなになるまでまで有効」テキスト)
//   行6: y=242〜307 (続き + 「優良」ボックス)
//   行7: y=307〜362 (「優良」ボックス下部 + 空白)
//   行8: y=362〜511 (約束入力エリア)
//   行9: y=511〜536 (「将来の夢」ラベル行)
//   行10: y=536〜558 (「将来の夢」入力エリア)
//   行11: y=558〜604 (「発行」ラベル + 発行入力エリア)
//   行12: y=604〜650 (下部空白)
//
// ラベル右端: x=154（テキスト入力開始: x=160）
// 写真エリア: x=647〜1036, y=41〜604
// 安全認定スタンプ: x=527〜666, y=461〜600（写真はx=647から始まるので被らない）
//
// %値計算（台紙 1075×650px 基準）:
//   名前: top=6.3%(41/650), h=9.2%(60/650)
//   長所: top=20.9%(136/650), h=6.6%(43/650)
//   日付: top=27.5%(179/650), h=6.8%(44/650)
//   約束: top=55.7%(362/650), h=22.9%(149/650)
//   将来の夢: top=78.6%(511/650), h=7.2%(47/650) ← 行9+10合算
//   発行: top=85.8%(558/650), h=7.1%(46/650)
//   写真: left=60.2%(647/1075), top=6.3%(41/650), w=36.2%(389/1075), h=86.6%(563/650)
//   テキスト開始: left=14.9%(160/1075)
//   テキスト幅: 44.9%(483/1075)（647-160=487→487/1075=45.3%）
function LicenseCardPreview({ data }: { data: LicenseData }) {
  const displayPhoto = data.aiPhotoUrl || data.photoUrl;
  const formatDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
  };
  // 台紙確定値（1075×650px）基準の%値
  const TEXT_L = "14.9%";       // テキスト開始x（x=160/1075）
  const TEXT_W = "45.3%";       // テキスト幅（x=160〜647: 487px → 487/1075）
  const PHOTO_L = "60.2%";      // 写真左端（x=647/1075）
  const PHOTO_W = "36.2%";      // 写真幅（x=647〜1036: 389px → 389/1075）
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "520px", margin: "0 auto" }}>
      <img src={LICENSE_CARD_BASE_URL} alt="免許証台紙" style={{ width: "100%", display: "block", borderRadius: "12px" }} />

      {/* 名前 — y=41〜101 → top=6.3%, h=9.2% */}
      <div style={{ position: "absolute", top: "6.3%", left: TEXT_L, width: TEXT_W, height: "9.2%", display: "flex", alignItems: "center", padding: "0 6px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(12px, 3.0vw, 24px)", fontWeight: 700, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{data.nickname}</span>
      </div>

      {/* 長所 — y=136〜179 → top=20.9%, h=6.6% */}
      <div style={{ position: "absolute", top: "20.9%", left: TEXT_L, width: TEXT_W, height: "6.6%", display: "flex", alignItems: "center", padding: "0 6px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(9px, 2.0vw, 16px)", fontWeight: 600, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{data.strength}</span>
      </div>

      {/* 日付 — y=179〜223 → top=27.5%, h=6.8% */}
      <div style={{ position: "absolute", top: "27.5%", left: TEXT_L, width: TEXT_W, height: "6.8%", display: "flex", alignItems: "center", padding: "0 6px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(9px, 1.9vw, 15px)", fontWeight: 600, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", whiteSpace: "nowrap" }}>{formatDate(data.date)}</span>
      </div>

      {/* 約束 — y=362〜511 → top=55.7%, h=22.9% */}
      <div style={{ position: "absolute", top: "55.7%", left: TEXT_L, width: TEXT_W, height: "22.9%", display: "flex", alignItems: "flex-start", justifyContent: "flex-start", padding: "4px 6px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(8px, 1.8vw, 14px)", fontWeight: 600, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", lineHeight: 1.6, wordBreak: "break-all", display: "-webkit-box", WebkitLineClamp: 8, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{data.promise}</span>
      </div>

      {/* 将来の夢 — y=511〜558 → top=78.6%, h=7.2% (行9+10合算) */}
      <div style={{ position: "absolute", top: "78.6%", left: TEXT_L, width: TEXT_W, height: "7.2%", display: "flex", alignItems: "center", padding: "0 6px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(9px, 1.9vw, 15px)", fontWeight: 600, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{data.dream}</span>
      </div>

      {/* 発行 — y=558〜604 → top=85.8%, h=7.1% */}
      <div style={{ position: "absolute", top: "85.8%", left: TEXT_L, width: TEXT_W, height: "7.1%", display: "flex", alignItems: "center", padding: "0 6px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(8px, 1.7vw, 13px)", fontWeight: 600, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", whiteSpace: "nowrap" }}>免許メーカー</span>
      </div>

      {/* 写真 — x=647〜1036, y=41〜604 → left=60.2%, top=6.3%, w=36.2%, h=86.6% */}
      {/* 安全認定スタンプ(x=527〜666)より右(x=647〜)から始まるので被らない */}
      <div style={{ position: "absolute", top: "6.3%", left: PHOTO_L, width: PHOTO_W, height: "86.6%", overflow: "hidden", borderRadius: "2px" }}>
        {displayPhoto ? (
          <img src={displayPhoto} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "transparent" }} />
        )}
      </div>
    </div>
  );
}

// ── Download (Canvas) ───────────────────────────────────────────────────────────────────────────────────
// 台紙サイズ: 1075×650px をそのまま座標空間として使用（FIT WARSと同じ方式）
// ダウンロード時は ctx.scale(SCALE, SCALE) で拡大するだけ
const CARD_W  = 1075;  // 台紙幅（px）
const CARD_H  = 650;   // 台紙高（px）
const SCALE   = 3;     // 拡大倍率（3倍 = 3225×1950px）

// 各フィールドの座標（台紙1075×650px・アノテーション画像で確定した正確な値）
// ラベル右端 x=154（テキスト入力開始: x=160）
// 入力エリア: x=160〜647（写真左端）
// 写真エリア: x=647〜1036（安全認定スタンプ x=527〜666 より右なので被らない）
const LABEL_R = 160;   // テキスト入力開始位置（x=160）
const PHOTO_L = 647;   // 写真エリア左端（確定値: x=647）
const CARD_R  = 1036;  // カード右端（写真エリア右端）
const NAME_Y1 = 41;    // 名前行上端（行1: y=41〜101）
const NAME_Y2 = 101;   // 名前行下端
const KYOSHO_Y1 = 136; // 長所行上端（行3: y=136〜179）
const KYOSHO_Y2 = 179; // 長所行下端
const DATE_Y1 = 179;   // 日付行上端（行4: y=179〜223）
const DATE_Y2 = 223;   // 日付行下端
const YAKUSOKU_Y1 = 362; // 約束エリア上端（行8: y=362〜511）
const YAKUSOKU_Y2 = 511; // 約束エリア下端
const YUME_Y1 = 511;   // 将来の夢行上端（行9+10: y=511〜558）
const YUME_Y2 = 558;   // 将来の夢行下端
const HAKKO_Y1 = 558;  // 発行行上端（行11: y=558〜604）
const HAKKO_Y2 = 604;  // 発行行下端
const PHOTO_Y1 = 41;   // 写真エリア上端（y=41〜604）
const PHOTO_Y2 = 604;  // 写真エリア下端

// JP-ID03N用紙定数（はがきサイズ縦向き: 100×148.5mm）
// カードを横向き（85.6×54mm）で上下に2枚配置
const DPI = 300;
const MM = DPI / 25.4;
const SHEET_W = Math.round(100 * MM);    // 1181px（はがき幅100mm）
const SHEET_H = Math.round(148.5 * MM);  // 1754px（はがき高148.5mm）
// カードサイズ（85.6×54mm）を300dpiでpx変換
const CARD_PX_W = Math.round(85.6 * MM);  // 1011px
const CARD_PX_H = Math.round(54 * MM);    // 638px
// 台紙画像（1075×650px）をカードサイズ（1011×638px）にスケール
const FIT_SCALE = CARD_PX_W / CARD_W;  // 1011/1075 = 0.9405
// 実際のカード描画サイズ
const SCALED_W = Math.round(CARD_W * FIT_SCALE);  // = CARD_PX_W = 1011px
const SCALED_H = Math.round(CARD_H * FIT_SCALE);  // = CARD_PX_H = 638px
// 上下余白（13.5mm×300dpi = 159px）・間隔（13.5mm = 159px）
const MARGIN_TOP = Math.round(13.5 * MM);   // 159px
const MARGIN_L   = Math.round(7.2 * MM);    // 85px
const GAP        = Math.round(13.5 * MM);   // 159px

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function renderLicenseCardOnCanvas(
  ctx: CanvasRenderingContext2D,
  data: LicenseData,
  baseImg: HTMLImageElement
) {
  // FIT WARSと同じ方式: ctx.scale(SCALE, SCALE)で座標空間は1075×650のまま
  // 台紙画像を描画
  ctx.drawImage(baseImg, 0, 0, CARD_W, CARD_H);

  ctx.textBaseline = "middle";
  ctx.fillStyle = "#1a1a2e";
  ctx.textAlign = "left";

  const formatDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
  };

  // ── 名前: x=LABEL_R+10, y=中央 (NAME_Y1+NAME_Y2)/2 ──
  if (data.nickname) {
    const fs = data.nickname.length > 10 ? 18 : data.nickname.length > 6 ? 22 : 26;
    ctx.font = `bold ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(data.nickname, LABEL_R + 10, (NAME_Y1 + NAME_Y2) / 2, CARD_R - LABEL_R - 20);
  }

  // ── 長所: x=LABEL_R+10, y=中央 (KYOSHO_Y1+KYOSHO_Y2)/2 ──
  if (data.strength) {
    const fs = data.strength.length > 12 ? 14 : data.strength.length > 8 ? 16 : 18;
    ctx.font = `600 ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(data.strength, LABEL_R + 10, (KYOSHO_Y1 + KYOSHO_Y2) / 2, PHOTO_L - LABEL_R - 20);
  }

  // ── 日付: x=LABEL_R+10, y=中央 (DATE_Y1+DATE_Y2)/2 ──
  if (data.date) {
    ctx.font = `600 16px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(formatDate(data.date), LABEL_R + 10, (DATE_Y1 + DATE_Y2) / 2, PHOTO_L - LABEL_R - 20);
  }

  // ── 約束（複数行折り返し）: x=LABEL_R+10, y=YAKUSOKU_Y1〜──
  if (data.promise) {
    const areaW = PHOTO_L - LABEL_R - 20;
    const areaH = YAKUSOKU_Y2 - YAKUSOKU_Y1;
    const charCount = data.promise.length;
    const fs = charCount > 40 ? 14 : charCount > 20 ? 17 : 20;
    const lineH = fs * 1.6;
    const maxLines = Math.floor(areaH / lineH);
    ctx.font = `600 ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    let line = "";
    let lineCount = 0;
    for (const char of data.promise) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > areaW && line !== "") {
        ctx.fillText(line, LABEL_R + 10, YAKUSOKU_Y1 + fs * 0.8 + lineCount * lineH);
        line = char;
        lineCount++;
        if (lineCount >= maxLines) break;
      } else {
        line = testLine;
      }
    }
    if (lineCount < maxLines && line) {
      ctx.fillText(line, LABEL_R + 10, YAKUSOKU_Y1 + fs * 0.8 + lineCount * lineH);
    }
  }

  // ── 将来の夢: x=LABEL_R+10, y=中央 (YUME_Y1+YUME_Y2)/2 ──
  if (data.dream) {
    const fs = data.dream.length > 10 ? 14 : 16;
    ctx.font = `600 ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(data.dream, LABEL_R + 10, (YUME_Y1 + YUME_Y2) / 2, PHOTO_L - LABEL_R - 20);
  }

  // ── 発行: x=LABEL_R+10, y=中央 (HAKKO_Y1+HAKKO_Y2)/2 ──
  ctx.font = `600 13px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
  ctx.fillText("免許メーカー", LABEL_R + 10, (HAKKO_Y1 + HAKKO_Y2) / 2, PHOTO_L - LABEL_R - 20);

  // ── 写真: x=PHOTO_L(647), y=PHOTO_Y1(41), w=CARD_R-PHOTO_L(389px), h=PHOTO_Y2-PHOTO_Y1(563px) ──
  // 安全認定スタンプ(x=527〜666)より右(x=647〜)から始まるので被らない
  const photoX = PHOTO_L;
  const photoY = PHOTO_Y1;
  const photoW = CARD_R - PHOTO_L;  // 389px
  const photoH = PHOTO_Y2 - PHOTO_Y1;  // 563px
  const displayPhoto = data.aiPhotoUrl || data.photoUrl;
  if (displayPhoto) {
    try {
      const photoImg = await loadImg(displayPhoto);
      ctx.save();
      ctx.beginPath();
      ctx.rect(photoX, photoY, photoW, photoH);
      ctx.clip();
      // object-cover + object-top
      const pa = photoImg.width / photoImg.height;
      const ba = photoW / photoH;
      let dw: number, dh: number, dx: number, dy: number;
      if (pa > ba) {
        // 横長写真 → 高さに合わせて横中央
        dh = photoH; dw = dh * pa;
        dx = photoX - (dw - photoW) / 2; dy = photoY;
      } else {
        // 縦長写真 → 幅に合わせて上揃え（object-top）
        dw = photoW; dh = dw / pa;
        dx = photoX; dy = photoY;
      }
      ctx.drawImage(photoImg, dx, dy, dw, dh);
      ctx.restore();
    } catch { /* skip */ }
  }
}

async function downloadLicenseSheet(card1: LicenseData, card2: LicenseData) {
  const canvas = document.createElement("canvas");
  canvas.width = SHEET_W;
  canvas.height = SHEET_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  const baseImg = await loadImg(LICENSE_CARD_BASE_URL);

  // 1枚目: ctx.save → translate → scale → 描画 → restore
  // FIT_SCALEのみ使用（台紙画像1075×650をカードサイズ1011×638にスケール）
  ctx.save();
  ctx.translate(MARGIN_L, MARGIN_TOP);
  ctx.scale(FIT_SCALE, FIT_SCALE);
  await renderLicenseCardOnCanvas(ctx, card1, baseImg);
  ctx.restore();

  // 2枚目
  ctx.save();
  ctx.translate(MARGIN_L, MARGIN_TOP + SCALED_H + GAP);
  ctx.scale(FIT_SCALE, FIT_SCALE);
  await renderLicenseCardOnCanvas(ctx, card2, baseImg);
  ctx.restore();
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => b ? res(b) : rej(new Error("toBlob null")), "image/png")
  );
  const filename = "license-sheet.png";
  const file = new File([blob], filename, { type: "image/png" });
  if (typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "免許メーカー" }); return; }
    catch (e) { if ((e as Error).name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Form Component ─────────────────────────────────────────────────────────────
function LicenseForm({
  data,
  onChange,
}: {
  data: LicenseData;
  onChange: (u: Partial<LicenseData>) => void;
  cardNum: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const convertToCarStyle = trpc.license.convertToCarStyle.useMutation({
    onSuccess: (result) => {
      onChange({ aiPhotoUrl: result.imageUrl });
      toast.success("イラスト変換が完了しました！");
    },
    onError: (err) => {
      toast.error(`変換に失敗しました: ${err.message}`);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setCropSrc(ev.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const handleCropDone = (croppedUrl: string) => {
    setCropSrc(null);
    onChange({ photoUrl: croppedUrl, photoFile: null, aiPhotoUrl: null });
  };

  const handleAIConvert = async () => {
    if (!data.photoUrl) return;
    toast.info("AIでイラスト変換中...");
    // data.photoUrl is a data URL (data:image/jpeg;base64,...)
    const base64 = data.photoUrl.split(",")[1];
    if (!base64) { toast.error("写真データが無効です"); return; }
    convertToCarStyle.mutate({ photoBase64: base64 });
  };

  const macaronColors: Record<string, string> = {
    nickname: "#ff99cc",
    strength: "#ffee99",
    date: "#99ff99",
    promise: "#99ccff",
    dream: "#cc99ff",
  };

  const inputStyle = (colorKey: string): React.CSSProperties => ({
    width: "100%",
    padding: "12px 15px",
    border: "none",
    borderRadius: "25px",
    fontFamily: "'M PLUS Rounded 1c',sans-serif",
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#333",
    outline: "none",
    backgroundColor: macaronColors[colorKey] || "#f0f0f0",
    boxShadow: "inset 0 4px 6px rgba(255,255,255,0.8),inset 0 -4px 6px rgba(0,0,0,0.2),0 4px 0 rgba(0,0,0,0.3)",
    transition: "transform 0.1s",
    marginBottom: "5px",
    boxSizing: "border-box" as const,
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "5px",
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "'DotGothic16',sans-serif",
  };

  return (
    <>
      {cropSrc && (
        <CropModal imageSrc={cropSrc} onDone={handleCropDone} onCancel={() => setCropSrc(null)} />
      )}

      {/* ニックネーム */}
      <div style={{ marginBottom: "15px" }}>
        <label style={labelStyle}>ニックネーム</label>
        <input type="text" style={inputStyle("nickname")} placeholder="(例) サンプルたろう" value={data.nickname} onChange={(e) => onChange({ nickname: e.target.value })} />
      </div>

      {/* 長所 */}
      <div style={{ marginBottom: "15px" }}>
        <label style={labelStyle}>長所</label>
        <input type="text" style={inputStyle("strength")} placeholder="(例) たくさんたべる" value={data.strength} onChange={(e) => onChange({ strength: e.target.value })} />
      </div>

      {/* 日付 */}
      <div style={{ marginBottom: "15px" }}>
        <label style={labelStyle}>日付</label>
        <input type="date" style={inputStyle("date")} value={data.date} onChange={(e) => onChange({ date: e.target.value })} />
      </div>

      {/* 約束 */}
      <div style={{ marginBottom: "15px" }}>
        <label style={labelStyle}>約束</label>
        <input type="text" style={inputStyle("promise")} placeholder="(例) ゲームは1日1時間" value={data.promise} onChange={(e) => onChange({ promise: e.target.value })} />
      </div>

      {/* 将来の夢 */}
      <div style={{ marginBottom: "15px" }}>
        <label style={labelStyle}>将来の夢</label>
        <input type="text" style={inputStyle("dream")} placeholder="(例) けいさつかん" value={data.dream} onChange={(e) => onChange({ dream: e.target.value })} />
      </div>

      {/* 写真 */}
      <div style={{ marginBottom: "15px" }}>
        <label style={labelStyle}>写真</label>
        <label style={{ display: "block", width: "100%", background: "linear-gradient(to bottom,#4da6ff,#0066cc)", color: "white", textAlign: "center", padding: "15px", borderRadius: "10px", cursor: "pointer", border: "3px solid #003366", boxShadow: "inset 0 2px 5px rgba(255,255,255,0.5),0 4px 0 #002244", fontWeight: "bold", marginTop: "10px", fontFamily: "'DotGothic16',sans-serif", boxSizing: "border-box" as const }}>
          写真を選択
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        </label>

        {data.photoUrl && (
          <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
            <img src={data.aiPhotoUrl || data.photoUrl} alt="preview" style={{ width: "60px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "2px solid #ff66b2" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button
                onClick={handleAIConvert}
                disabled={convertToCarStyle.isPending}
                style={{ padding: "8px 14px", background: convertToCarStyle.isPending ? "rgba(255,255,255,0.1)" : "linear-gradient(to bottom,#ff99cc,#ff66b2)", color: convertToCarStyle.isPending ? "rgba(255,255,255,0.3)" : "#fff", border: "2px solid #cc0066", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: convertToCarStyle.isPending ? "not-allowed" : "pointer", boxShadow: convertToCarStyle.isPending ? "none" : "0 3px 0 #880044", fontFamily: "'DotGothic16',sans-serif" }}
              >
                {convertToCarStyle.isPending ? "変換中..." : "✨ AIでイラスト変換"}
              </button>
              {data.aiPhotoUrl && (
                <button onClick={() => onChange({ aiPhotoUrl: null })} style={{ padding: "6px 10px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontFamily: "'DotGothic16',sans-serif" }}>
                  元の写真に戻す
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function LicenseMaker() {
  const [, setLocation] = useLocation();
  const [card1, setCard1] = useState<LicenseData>({ ...INITIAL_LICENSE });
  const [card2, setCard2] = useState<LicenseData>({ ...INITIAL_LICENSE });
  const [activeCard, setActiveCard] = useState<1 | 2>(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const updateCard1 = useCallback((u: Partial<LicenseData>) => setCard1((p) => ({ ...p, ...u })), []);
  const updateCard2 = useCallback((u: Partial<LicenseData>) => setCard2((p) => ({ ...p, ...u })), []);

  const handleCreate = useCallback(() => {
    setShowPreview(true);
    setTimeout(() => {
      document.getElementById("preview-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    toast.info("免許証シートを生成中...");
    try {
      await downloadLicenseSheet(card1, card2);
      toast.success("免許証シートを保存しました！");
    } catch (err) {
      toast.error(`保存に失敗しました: ${err instanceof Error ? err.message : "不明なエラー"}`);
    } finally {
      setIsDownloading(false);
    }
  }, [card1, card2]);

  const activeData = activeCard === 1 ? card1 : card2;
  const activeUpdate = activeCard === 1 ? updateCard1 : updateCard2;

  const btnStyle = (color: string, shadow: string): React.CSSProperties => ({
    flex: 1,
    padding: "15px 5px",
    border: `2px solid ${shadow}`,
    borderRadius: "10px",
    fontFamily: "'DotGothic16',sans-serif",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
    boxShadow: `0 4px 0 rgba(0,0,0,0.4)`,
    backgroundColor: color,
    color: "white",
    textAlign: "center" as const,
    transition: "transform 0.1s",
  });

  return (
    <div style={{ fontFamily: "'M PLUS Rounded 1c',sans-serif", backgroundColor: "#2b1b4d", backgroundImage: "radial-gradient(circle at 20% 30%,rgba(255,102,178,0.15) 0%,transparent 50%),radial-gradient(circle at 80% 70%,rgba(51,204,255,0.15) 0%,transparent 50%)", color: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>

      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: "30px", marginTop: "20px", width: "100%", maxWidth: "1000px" }}>
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
          <button onClick={() => setLocation("/")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "rgba(255,102,178,0.2)", border: "2px solid #ff66b2", borderRadius: "20px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DotGothic16',sans-serif", boxShadow: "0 3px 0 #880044" }}>
            ← ホームに戻る
          </button>
        </div>
        <img src={LICENSE_LOGO_URL} alt="免許メーカー" style={{ width: "min(280px,70vw)", marginBottom: "10px" }} />
        <div style={{ fontFamily: "'DotGothic16',sans-serif", fontSize: "1rem", marginTop: "10px", lineHeight: 1.6 }}>
          君だけのオリジナルの免許を作ろう！<br />
          <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: "0.65em", color: "#33ccff" }}>MAKE YOUR OWN ORIGINAL LICENCE!</span>
        </div>
      </header>

      {/* Main layout */}
      <main style={{ display: "flex", flexWrap: "wrap", gap: "30px", justifyContent: "center", width: "100%", maxWidth: "1000px" }}>

        {/* Left: Input Form */}
        <div style={{ backgroundColor: "#11082f", border: "8px solid", borderImage: "linear-gradient(to bottom right,#ff66b2,#33ccff,#ffff66) 1", padding: "20px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", boxSizing: "border-box" as const }}>

          {/* カード切り替えタブ */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {([1, 2] as const).map((n) => (
              <button key={n} onClick={() => setActiveCard(n)} style={{ flex: 1, padding: "10px", border: "2px solid", borderColor: activeCard === n ? "#ff66b2" : "#555", borderRadius: "10px", background: activeCard === n ? "linear-gradient(to bottom,#ff66b2,#cc0066)" : "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "'DotGothic16',sans-serif", boxShadow: activeCard === n ? "0 3px 0 #880044" : "none", transition: "all 0.2s" }}>
                {n === 1 ? "🚗 1枚目" : "🏎️ 2枚目"}
              </button>
            ))}
          </div>

          <h2 style={{ textAlign: "center", fontSize: "1.5rem", marginBottom: "20px", borderBottom: "2px dashed #555", paddingBottom: "10px", fontFamily: "'DotGothic16',sans-serif" }}>
            入力フォーム<br />
            <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: "0.5em", color: "#ccc" }}>INPUT FORM</span>
          </h2>

          <LicenseForm data={activeData} onChange={activeUpdate} cardNum={activeCard} />

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button
              onClick={handleCreate}
              style={btnStyle("#33cc33", "#1a661a")}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 0 rgba(0,0,0,0.4)"; }}
            >
              <span>作成</span><br />
              <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: "0.5em" }}>CREATE</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              style={{ ...btnStyle(isDownloading ? "#555" : "#0088ff", "#004488"), cursor: isDownloading ? "not-allowed" : "pointer", boxShadow: isDownloading ? "none" : "0 4px 0 rgba(0,0,0,0.4)" }}
              onMouseDown={(e) => { if (!isDownloading) { (e.currentTarget as HTMLElement).style.transform = "translateY(4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; } }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 0 rgba(0,0,0,0.4)"; }}
            >
              {isDownloading ? "⚙️ 生成中..." : <><span>ダウンロード</span><br /><span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: "0.5em" }}>DOWNLOAD</span></>}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ width: "100%", maxWidth: "450px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: "15px", textAlign: "center", fontFamily: "'DotGothic16',sans-serif", fontSize: "1.1rem" }}>
            特別な自分の免許<br />作っちゃおう♪
          </div>
          <div style={{ backgroundColor: "#fff9f0", width: "100%", borderRadius: "20px", border: "6px solid #ff66b2", padding: "15px", boxShadow: "0 0 20px rgba(255,102,178,0.4)", backgroundImage: "radial-gradient(#ffccdd 10%,transparent 10%),radial-gradient(#ffccdd 10%,transparent 10%)", backgroundPosition: "0 0,20px 20px", backgroundSize: "40px 40px", boxSizing: "border-box" as const }}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "10px", padding: "15px", border: "2px solid #ffe6e6" }}>
              <div style={{ textAlign: "center", fontSize: "1.1rem", color: "#ff66b2", borderBottom: "2px solid #ff66b2", paddingBottom: "5px", marginBottom: "12px", fontFamily: "'DotGothic16',sans-serif", fontWeight: "bold" }}>
                {activeCard === 1 ? "🚗 1枚目プレビュー" : "🏎️ 2枚目プレビュー"}
              </div>
              <LicenseCardPreview data={activeData} />
            </div>
          </div>
        </div>
      </main>

      {/* 作成後：2枚並べたプレビューセクション */}
      {showPreview && (
        <section id="preview-section" style={{ width: "100%", maxWidth: "1000px", marginTop: "40px", backgroundColor: "#11082f", border: "8px solid", borderImage: "linear-gradient(to bottom right,#ff66b2,#33ccff,#ffff66) 1", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", boxSizing: "border-box" as const }}>
          <h2 style={{ textAlign: "center", fontSize: "1.4rem", marginBottom: "24px", borderBottom: "2px dashed #555", paddingBottom: "10px", fontFamily: "'DotGothic16',sans-serif" }}>
            🎉 完成プレビュー（2枚）<br />
            <span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: "0.45em", color: "#33ccff" }}>PREVIEW - 2 CARDS</span>
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", justifyContent: "center" }}>
            {/* 1枚目 */}
            <div style={{ width: "100%", maxWidth: "440px" }}>
              <p style={{ textAlign: "center", fontFamily: "'DotGothic16',sans-serif", fontSize: "1rem", marginBottom: "10px", color: "#ff99cc" }}>🚗 1枚目</p>
              <div style={{ backgroundColor: "#fff9f0", borderRadius: "16px", border: "4px solid #ff66b2", padding: "12px", boxShadow: "0 0 16px rgba(255,102,178,0.3)", backgroundImage: "radial-gradient(#ffccdd 10%,transparent 10%),radial-gradient(#ffccdd 10%,transparent 10%)", backgroundPosition: "0 0,20px 20px", backgroundSize: "40px 40px" }}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "10px", padding: "10px", border: "2px solid #ffe6e6" }}>
                  <LicenseCardPreview data={card1} />
                </div>
              </div>
            </div>
            {/* 2枚目 */}
            <div style={{ width: "100%", maxWidth: "440px" }}>
              <p style={{ textAlign: "center", fontFamily: "'DotGothic16',sans-serif", fontSize: "1rem", marginBottom: "10px", color: "#99ccff" }}>🏎️ 2枚目</p>
              <div style={{ backgroundColor: "#fff9f0", borderRadius: "16px", border: "4px solid #33ccff", padding: "12px", boxShadow: "0 0 16px rgba(51,204,255,0.3)", backgroundImage: "radial-gradient(#ccf0ff 10%,transparent 10%),radial-gradient(#ccf0ff 10%,transparent 10%)", backgroundPosition: "0 0,20px 20px", backgroundSize: "40px 40px" }}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: "10px", padding: "10px", border: "2px solid #cce6ff" }}>
                  <LicenseCardPreview data={card2} />
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "28px" }}>
            <p style={{ fontFamily: "'DotGothic16',sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
              A4用紙（210×297mm）に2枚並べた画像を生成します
            </p>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              style={{ padding: "18px 40px", border: "2px solid #004488", borderRadius: "12px", fontFamily: "'DotGothic16',sans-serif", fontWeight: "bold", fontSize: "1.1rem", cursor: isDownloading ? "not-allowed" : "pointer", boxShadow: isDownloading ? "none" : "0 5px 0 rgba(0,0,0,0.4)", backgroundColor: isDownloading ? "#555" : "#0088ff", color: "white", transition: "transform 0.1s" }}
              onMouseDown={(e) => { if (!isDownloading) { (e.currentTarget as HTMLElement).style.transform = "translateY(5px)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; } }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 5px 0 rgba(0,0,0,0.4)"; }}
            >
              {isDownloading ? "⚙️ 生成中..." : <><span>📥 スマホにダウンロードする</span><br /><span style={{ fontFamily: "'Press Start 2P',cursive", fontSize: "0.5em" }}>DOWNLOAD TO PHONE</span></>}
            </button>
          </div>
        </section>
      )}

      <footer style={{ textAlign: "center", padding: "24px", marginTop: "40px", borderTop: "2px dashed #555", width: "100%", maxWidth: "1000px" }}>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", fontFamily: "'DotGothic16',sans-serif" }}>© 2024 Makefrom1 — 免許メーカー</p>
      </footer>
    </div>
  );
}
