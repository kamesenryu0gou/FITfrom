/**
 * LicenseMaker.tsx
 * 子供向け免許証メーカー
 * - 台紙実測値（1075×650px）に基づく正確なレイアウト
 * - 写真がカードサイズを変動させない固定レイアウト
 * - プレビューとダウンロードCanvasの完全同期
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

// ── 台紙実測値（Pillow精密計測・確定値）────────────────────────────────────────
//
// 台紙サイズ: 1075 × 650 px
//
// 横方向の枠線（y座標）:
//   y=46:  名前欄の上端
//   y=100: 名前欄の下端
//   y=105: 長所・日付エリアの上端（外枠）
//   y=141: 長所欄の下端 / 日付欄の上端
//   y=183: 日付欄の下端 / 写真エリア上端
//   y=228: 「おとなになるまでまで有効」帯の下端 / 約束エリアの上端
//   y=516: 約束エリアの下端 / 将来の夢欄の上端
//   y=558: 将来の夢欄の下端 / 発行欄の上端
//   y=603: 発行欄の下端 / 写真エリア下端
//
// 縦方向の枠線（x座標）:
//   x=30:  カード左端（内側）
//   x=155: ラベル右端（「名前」「長所」「日付」「将来の夢」「発行」のラベル幅）
//   x=682: 写真エリアの左端（実測: x=652-681の範囲が枠線）
//   x=1011: 写真エリアの右端
//
// テキスト入力開始位置:
//   名前: x=165（ラベル右端+10px）
//   長所: x=165
//   日付: x=165
//   約束: x=35（左端+5px）
//   将来の夢: x=165
//   発行: x=165
//
// 写真エリア: x=682〜1011, y=183〜603
//   幅: 329px (682〜1011)
//   高: 420px (183〜603)
//   アスペクト比: 329:420 ≒ 0.78:1 (縦長)
//
// %値計算（1075×650px基準）:
//   名前:     top=7.1%(46/650),   h=8.3%(54/650),   left=15.3%(165/1075), w=47.9%(515/1075)
//   長所:     top=21.7%(141/650), h=6.5%(42/650),   left=15.3%(165/1075), w=47.9%(515/1075)
//   日付:     top=28.2%(183/650), h=6.9%(45/650),   left=15.3%(165/1075), w=47.9%(515/1075)
//   約束:     top=35.1%(228/650), h=44.3%(288/650), left=3.3%(35/1075),   w=59.3%(638/1075)
//   将来の夢: top=79.4%(516/650), h=6.5%(42/650),   left=15.3%(165/1075), w=47.9%(515/1075)
//   発行:     top=85.8%(558/650), h=6.9%(45/650),   left=15.3%(165/1075), w=47.9%(515/1075)
//   写真:     top=28.2%(183/650), h=64.6%(420/650), left=63.4%(682/1075), w=30.6%(329/1075)
//
// 注意: 約束エリアはラベルなし（左端から始まる）、写真エリアは y=183 から始まる

// ── LicenseCardPreview ────────────────────────────────────────────────────────
function LicenseCardPreview({ data }: { data: LicenseData }) {
  const displayPhoto = data.aiPhotoUrl || data.photoUrl;
  const formatDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
  };

  return (
    // カード全体を固定サイズコンテナで囲む
    // maxWidth: 520px に対して aspect-ratio で高さを固定
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "520px",
      margin: "0 auto",
      // アスペクト比を台紙と同じ 1075:650 に固定
      aspectRatio: "1075 / 650",
    }}>
      {/* 台紙画像: 親コンテナを100%埋める */}
      <img
        src={LICENSE_CARD_BASE_URL}
        alt="免許証台紙"
        style={{
          position: "absolute",
          top: 0, left: 0,
          width: "100%",
          height: "100%",
          display: "block",
          borderRadius: "12px",
        }}
      />

      {/* 写真エリア: 台紙の上に重ねる（固定サイズ）
          実測値: x=682〜1011, y=183〜603
          %値: left=63.4%, top=28.2%, w=30.6%, h=64.6%
          overflow:hidden で絶対に枠からはみ出さない */}
      <div style={{
        position: "absolute",
        top: "28.2%",
        left: "63.4%",
        width: "30.6%",
        height: "64.6%",
        overflow: "hidden",
        backgroundColor: "transparent",
      }}>
        {displayPhoto ? (
          <img
            src={displayPhoto}
            alt="photo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              display: "block",
            }}
          />
        ) : null}
      </div>

      {/* 名前: y=46〜100, x=165〜680
          top=7.1%, h=8.3%, left=15.3%, w=47.9% */}
      <div style={{
        position: "absolute",
        top: "7.1%",
        left: "15.3%",
        width: "47.9%",
        height: "8.3%",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        padding: "0 4px",
      }}>
        <span style={{
          fontSize: "clamp(10px, 2.8vw, 22px)",
          fontWeight: 700,
          color: "#1a1a2e",
          fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
          lineHeight: 1,
        }}>{data.nickname}</span>
      </div>

      {/* 長所: y=141〜183, x=165〜680
          top=21.7%, h=6.5%, left=15.3%, w=47.9% */}
      <div style={{
        position: "absolute",
        top: "21.7%",
        left: "15.3%",
        width: "47.9%",
        height: "6.5%",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        padding: "0 4px",
      }}>
        <span style={{
          fontSize: "clamp(8px, 2.0vw, 16px)",
          fontWeight: 600,
          color: "#1a1a2e",
          fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
          lineHeight: 1,
        }}>{data.strength}</span>
      </div>

      {/* 日付: y=183〜228, x=165〜680
          top=28.2%, h=6.9%, left=15.3%, w=47.9% */}
      <div style={{
        position: "absolute",
        top: "28.2%",
        left: "15.3%",
        width: "47.9%",
        height: "6.9%",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        padding: "0 4px",
      }}>
        <span style={{
          fontSize: "clamp(7px, 1.6vw, 13px)",
          fontWeight: 600,
          color: "#1a1a2e",
          fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}>{formatDate(data.date)}</span>
      </div>

      {/* 約束: y=290〜516（帯の下端y=286から）, x=220〜680（優良ボックスの右から）
          top=44.6%(290/650), h=34.8%(226/650), left=20.5%(220/1075), w=42.1%(452/1075)
          「おとなになるまでまで有効」帯(y=228〜286)の下・優良ボックス(x=30〜200)の右
          フォントサイズ: 名前と同じ大型（clamp(10px, 2.8vw, 22px)） */}
      <div style={{
        position: "absolute",
        top: "44.6%",
        left: "20.5%",
        width: "42.1%",
        height: "34.8%",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        overflow: "hidden",
        padding: "2px 2px 2px 2px",
      }}>
        <span style={{
          fontSize: "clamp(10px, 2.8vw, 22px)",
          fontWeight: 700,
          color: "#1a1a2e",
          fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif",
          lineHeight: 1.4,
          wordBreak: "break-all",
          display: "-webkit-box",
          WebkitLineClamp: 6,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        } as React.CSSProperties}>{data.promise}</span>
      </div>

      {/* 将来の夢: y=516〜558, x=165〜680
          top=79.4%, h=6.5%, left=15.3%, w=47.9% */}
      <div style={{
        position: "absolute",
        top: "79.4%",
        left: "15.3%",
        width: "47.9%",
        height: "6.5%",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        padding: "0 4px",
      }}>
        <span style={{
          fontSize: "clamp(8px, 1.9vw, 15px)",
          fontWeight: 600,
          color: "#1a1a2e",
          fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
          lineHeight: 1,
        }}>{data.dream}</span>
      </div>

      {/* 発行欄の背景に元から描かれている「免許メーカー」文字を白塗りで隠す
          発行ラベル右側: y=558〜603, x=165〜620
          top=85.8%, h=6.9%, left=15.3%, w=42.3% */}
      <div style={{
        position: "absolute",
        top: "85.8%",
        left: "15.3%",
        width: "42.3%",
        height: "6.9%",
        backgroundColor: "rgba(255,255,255,0.92)",
        zIndex: 1,
      }} />

      {/* 発行(免許メーカー)固定テキスト: 白塗りの上に重ねる
          top=85.8%, h=6.9%, left=15.3%, w=42.3% */}
      <div style={{
        position: "absolute",
        top: "85.8%",
        left: "15.3%",
        width: "42.3%",
        height: "6.9%",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        padding: "0 4px",
        zIndex: 2,
      }}>
        <span style={{
          fontSize: "clamp(7px, 1.6vw, 13px)",
          fontWeight: 600,
          color: "#1a1a2e",
          fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}>免許メーカー</span>
      </div>
    </div>
  );
}

// ── Canvas定数（台紙1075×650px・実測値）──────────────────────────────────────
const CARD_W  = 1075;
const CARD_H  = 650;

// 各フィールドの座標（実測値）
const NAME_X    = 165;   // 名前入力開始 x
const NAME_Y1   = 46;    // 名前行上端
const NAME_Y2   = 100;   // 名前行下端

const KYOSHO_X  = 165;   // 長所入力開始 x
const KYOSHO_Y1 = 141;   // 長所行上端
const KYOSHO_Y2 = 183;   // 長所行下端

const DATE_X    = 165;   // 日付入力開始 x
const DATE_Y1   = 183;   // 日付行上端
const DATE_Y2   = 228;   // 日付行下端

const YAKUSOKU_X  = 220; // 約束入力開始 x（優良ボックスの右: x=220）
const YAKUSOKU_Y1 = 290; // 約束エリア上端（帯下端 y=286の下）
const YAKUSOKU_Y2 = 516; // 約束エリア下端

const YUME_X    = 165;   // 将来の夢入力開始 x
const YUME_Y1   = 516;   // 将来の夢行上端
const YUME_Y2   = 558;   // 将来の夢行下端

const HAKKO_X   = 165;   // 発行入力開始 x
const HAKKO_Y1  = 558;   // 発行行上端
const HAKKO_Y2  = 603;   // 発行行下端

// 写真エリア（実測値: x=682〜1011, y=183〜603）
const PHOTO_L   = 682;   // 写真エリア左端
const PHOTO_R   = 1011;  // 写真エリア右端
const PHOTO_Y1  = 183;   // 写真エリア上端
const PHOTO_Y2  = 603;   // 写真エリア下端

// テキスト最大幅（写真左端まで）
const TEXT_MAX_W = PHOTO_L - 10; // 672px

// はがきサイズ（100×148.5mm @ 300dpi）
const DPI = 300;
const MM = DPI / 25.4;
const SHEET_W = Math.round(100 * MM);    // 1181px
const SHEET_H = Math.round(148.5 * MM);  // 1754px
// カードサイズ（85.6×54mm @ 300dpi）
const CARD_PX_W = Math.round(85.6 * MM);  // 1011px
const CARD_PX_H = Math.round(54 * MM);    // 638px
// 台紙画像をカードサイズにスケール
const FIT_SCALE = CARD_PX_W / CARD_W;  // 1011/1075 ≈ 0.9405
const SCALED_W = Math.round(CARD_W * FIT_SCALE);
const SCALED_H = Math.round(CARD_H * FIT_SCALE);
const MARGIN_TOP = Math.round(13.5 * MM);
const MARGIN_L   = Math.round(7.2 * MM);
const GAP        = Math.round(13.5 * MM);

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function renderLicenseCardOnCanvas(
  ctx: CanvasRenderingContext2D,
  data: LicenseData,
  baseImg: HTMLImageElement
) {
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

  // ── 写真（テキストより先に描画してテキストが上に来るようにする）──
  const photoW = PHOTO_R - PHOTO_L;  // 329px
  const photoH = PHOTO_Y2 - PHOTO_Y1; // 420px
  const displayPhoto = data.aiPhotoUrl || data.photoUrl;
  if (displayPhoto) {
    try {
      const photoImg = await loadImg(displayPhoto);
      ctx.save();
      ctx.beginPath();
      ctx.rect(PHOTO_L, PHOTO_Y1, photoW, photoH);
      ctx.clip();
      // object-cover + object-top
      const pa = photoImg.width / photoImg.height;
      const ba = photoW / photoH;
      let dw: number, dh: number, dx: number, dy: number;
      if (pa > ba) {
        dh = photoH; dw = dh * pa;
        dx = PHOTO_L - (dw - photoW) / 2; dy = PHOTO_Y1;
      } else {
        dw = photoW; dh = dw / pa;
        dx = PHOTO_L; dy = PHOTO_Y1;
      }
      ctx.drawImage(photoImg, dx, dy, dw, dh);
      ctx.restore();
    } catch { /* skip */ }
  }

  // ── 名前 ──
  if (data.nickname) {
    const fs = data.nickname.length > 10 ? 18 : data.nickname.length > 6 ? 22 : 26;
    ctx.font = `bold ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(data.nickname, NAME_X, (NAME_Y1 + NAME_Y2) / 2, TEXT_MAX_W - NAME_X);
  }

  // ── 長所 ──
  if (data.strength) {
    const fs = data.strength.length > 12 ? 14 : data.strength.length > 8 ? 16 : 18;
    ctx.font = `600 ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(data.strength, KYOSHO_X, (KYOSHO_Y1 + KYOSHO_Y2) / 2, TEXT_MAX_W - KYOSHO_X);
  }

  // ── 日付 ──
  if (data.date) {
    ctx.font = `600 13px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(formatDate(data.date), DATE_X, (DATE_Y1 + DATE_Y2) / 2, TEXT_MAX_W - DATE_X);
  }

  // ── 約束（複数行折り返し・名前と同じ大型フォント）──
  if (data.promise) {
    const areaW = TEXT_MAX_W - YAKUSOKU_X;
    const areaH = YAKUSOKU_Y2 - YAKUSOKU_Y1;
    const charCount = data.promise.length;
    // 名前と同じ大型フォント（文字数に応じて自動調整）
    const fs = charCount > 20 ? 18 : charCount > 10 ? 22 : 26;
    const lineH = fs * 1.4;
    const maxLines = Math.floor(areaH / lineH);
    ctx.font = `bold ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    let line = "";
    let lineCount = 0;
    for (const char of data.promise) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > areaW && line !== "") {
        ctx.fillText(line, YAKUSOKU_X, YAKUSOKU_Y1 + fs * 0.8 + lineCount * lineH);
        line = char;
        lineCount++;
        if (lineCount >= maxLines) break;
      } else {
        line = testLine;
      }
    }
    if (lineCount < maxLines && line) {
      ctx.fillText(line, YAKUSOKU_X, YAKUSOKU_Y1 + fs * 0.8 + lineCount * lineH);
    }
  }

  // ── 将来の夢 ──
  if (data.dream) {
    const fs = data.dream.length > 10 ? 14 : 16;
    ctx.font = `600 ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(data.dream, YUME_X, (YUME_Y1 + YUME_Y2) / 2, TEXT_MAX_W - YUME_X);
  }

  // ── 発行欄の背景「免許メーカー」文字を白塗りで隠す ──
  // 発行ラベル右側の白塗りエリア: x=HAKKO_X〜620, y=HAKKO_Y1〜HAKKO_Y2
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillRect(HAKKO_X, HAKKO_Y1, 620 - HAKKO_X, HAKKO_Y2 - HAKKO_Y1);
  ctx.fillStyle = "#1a1a2e";

  // ── 発行(免許メーカー)固定テキスト ──
  ctx.font = `600 13px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
  ctx.fillText("免許メーカー", HAKKO_X, (HAKKO_Y1 + HAKKO_Y2) / 2, 620 - HAKKO_X);
}

async function downloadLicenseSheet(card1: LicenseData, card2: LicenseData) {
  const canvas = document.createElement("canvas");
  canvas.width = SHEET_W;
  canvas.height = SHEET_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  const baseImg = await loadImg(LICENSE_CARD_BASE_URL);

  ctx.save();
  ctx.translate(MARGIN_L, MARGIN_TOP);
  ctx.scale(FIT_SCALE, FIT_SCALE);
  await renderLicenseCardOnCanvas(ctx, card1, baseImg);
  ctx.restore();

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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const convertToCarStyle = trpc.license.convertToCarStyle.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setCropSrc(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropDone = (croppedUrl: string) => {
    onChange({ photoUrl: croppedUrl, photoFile: null, aiPhotoUrl: null });
    setCropSrc(null);
  };

  const handleGenerateAI = async () => {
    if (!data.photoUrl) {
      toast.error("まず写真を選択してください");
      return;
    }
    setIsGeneratingAI(true);
    try {
      // base64に変換してAPIに送る
      const base64 = data.photoUrl.split(",")[1] || data.photoUrl;
      const mimeMatch = data.photoUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const result = await convertToCarStyle.mutateAsync({ photoBase64: base64, mimeType });
      onChange({ aiPhotoUrl: result.imageUrl });
      toast.success("AIイラスト生成完了！");
    } catch {
      toast.error("AI生成に失敗しました");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "16px",
    border: "3px solid transparent",
    fontSize: "16px",
    fontFamily: "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* ニックネーム */}
      <div>
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "13px", color: "#fff", fontFamily: "'DotGothic16', sans-serif", letterSpacing: "1px" }}>ニックネーム</label>
        <input
          type="text"
          placeholder="(例) サンプルたろう"
          value={data.nickname}
          onChange={(e) => onChange({ nickname: e.target.value })}
          style={{ ...inputStyle, background: "linear-gradient(135deg, #ffe0f0, #ffd6e8)", color: "#1a1a2e" }}
        />
      </div>

      {/* 長所 */}
      <div>
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "13px", color: "#fff", fontFamily: "'DotGothic16', sans-serif", letterSpacing: "1px" }}>長所</label>
        <input
          type="text"
          placeholder="(例) たくさんたべる"
          value={data.strength}
          onChange={(e) => onChange({ strength: e.target.value })}
          style={{ ...inputStyle, background: "linear-gradient(135deg, #fff0d0, #ffe8b0)", color: "#1a1a2e" }}
        />
      </div>

      {/* 日付 */}
      <div>
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "13px", color: "#fff", fontFamily: "'DotGothic16', sans-serif", letterSpacing: "1px" }}>日付</label>
        <input
          type="date"
          value={data.date}
          onChange={(e) => onChange({ date: e.target.value })}
          style={{ ...inputStyle, background: "linear-gradient(135deg, #d0f0ff, #b8e8ff)", color: "#1a1a2e" }}
        />
      </div>

      {/* 約束 */}
      <div>
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "13px", color: "#fff", fontFamily: "'DotGothic16', sans-serif", letterSpacing: "1px" }}>約束</label>
        <input
          type="text"
          placeholder="(例) ゲームは1日1時間"
          value={data.promise}
          onChange={(e) => onChange({ promise: e.target.value })}
          style={{ ...inputStyle, background: "linear-gradient(135deg, #d0ffd8, #b8f0c0)", color: "#1a1a2e" }}
        />
      </div>

      {/* 将来の夢 */}
      <div>
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "13px", color: "#fff", fontFamily: "'DotGothic16', sans-serif", letterSpacing: "1px" }}>将来の夢</label>
        <input
          type="text"
          placeholder="(例) けいさつかん"
          value={data.dream}
          onChange={(e) => onChange({ dream: e.target.value })}
          style={{ ...inputStyle, background: "linear-gradient(135deg, #e8d0ff, #d8b8ff)", color: "#1a1a2e" }}
        />
      </div>

      {/* 写真 */}
      <div>
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, fontSize: "13px", color: "#fff", fontFamily: "'DotGothic16', sans-serif", letterSpacing: "1px" }}>写真</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 1, minWidth: "120px", padding: "12px 16px",
              background: "linear-gradient(135deg, #ff66b2, #cc0066)",
              border: "none", borderRadius: "16px", color: "#fff",
              fontWeight: 700, fontSize: "14px", cursor: "pointer",
              fontFamily: "'DotGothic16', sans-serif",
              boxShadow: "0 4px 0 #880044",
            }}
          >
            {data.photoUrl ? "写真を変更" : "写真を選択"}
          </button>
          {data.photoUrl && (
            <button
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              style={{
                flex: 1, minWidth: "120px", padding: "12px 16px",
                background: isGeneratingAI
                  ? "rgba(255,255,255,0.2)"
                  : "linear-gradient(135deg, #00d4ff, #0088cc)",
                border: "none", borderRadius: "16px", color: "#fff",
                fontWeight: 700, fontSize: "13px", cursor: isGeneratingAI ? "not-allowed" : "pointer",
                fontFamily: "'DotGothic16', sans-serif",
                boxShadow: isGeneratingAI ? "none" : "0 4px 0 #005588",
              }}
            >
              {isGeneratingAI ? "生成中..." : "AIイラスト化"}
            </button>
          )}
        </div>
        {data.photoUrl && (
          <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
            <img
              src={data.aiPhotoUrl || data.photoUrl}
              alt="preview"
              style={{ width: "60px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "2px solid rgba(255,255,255,0.3)" }}
            />
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontFamily: "'DotGothic16', sans-serif" }}>
              {data.aiPhotoUrl ? "AIイラスト使用中" : "写真選択済み"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function LicenseMaker() {
  const [, setLocation] = useLocation();
  const [card1, setCard1] = useState<LicenseData>(INITIAL_LICENSE);
  const [card2, setCard2] = useState<LicenseData>(INITIAL_LICENSE);
  const [activeCard, setActiveCard] = useState<1 | 2>(1);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const activeData = activeCard === 1 ? card1 : card2;
  const setActiveData = (u: Partial<LicenseData>) => {
    if (activeCard === 1) setCard1((prev) => ({ ...prev, ...u }));
    else setCard2((prev) => ({ ...prev, ...u }));
  };

  const handleCreate = () => {
    if (!activeData.nickname) {
      toast.error("ニックネームを入力してください");
      return;
    }
    setShowPreview(true);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadLicenseSheet(card1, card2.nickname ? card2 : card1);
    } catch (e) {
      toast.error("ダウンロードに失敗しました");
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a0533 0%, #0d1b4a 50%, #0a2a1a 100%)",
      fontFamily: "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
    }}>
      {/* ヘッダー */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={() => setLocation("/")}
          style={{
            background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.3)",
            borderRadius: "12px", color: "#fff", padding: "8px 16px",
            fontSize: "14px", cursor: "pointer", fontFamily: "'DotGothic16', sans-serif",
          }}
        >← ホームに戻る</button>
      </div>

      {/* ロゴ */}
      <div style={{ textAlign: "center", padding: "0 20px 20px" }}>
        <img src={LICENSE_LOGO_URL} alt="免許メーカー" style={{ maxWidth: "200px", height: "auto" }} />
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px", margin: "8px 0 0", fontFamily: "'DotGothic16', sans-serif" }}>
          君だけのオリジナルの免許を作ろう！
        </p>
        <p style={{ color: "#00d4ff", fontSize: "12px", margin: "4px 0 0", fontFamily: "'DotGothic16', sans-serif", letterSpacing: "2px" }}>
          MAKE YOUR OWN ORIGINAL LICENCE!
        </p>
      </div>

      {/* メインコンテンツ */}
      <div style={{
        maxWidth: "1100px", margin: "0 auto", padding: "0 16px 40px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px",
      }}
        className="license-grid"
      >
        {/* 左: 入力フォーム */}
        <div style={{
          background: "rgba(255,255,255,0.05)", borderRadius: "20px",
          border: "2px solid rgba(255,255,255,0.15)", padding: "24px",
          backdropFilter: "blur(10px)",
        }}>
          {/* カード切り替えタブ */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {([1, 2] as const).map((num) => (
              <button
                key={num}
                onClick={() => setActiveCard(num)}
                style={{
                  flex: 1, padding: "10px",
                  background: activeCard === num
                    ? "linear-gradient(135deg, #ff66b2, #cc0066)"
                    : "rgba(255,255,255,0.1)",
                  border: activeCard === num ? "2px solid #ff66b2" : "2px dashed rgba(255,255,255,0.3)",
                  borderRadius: "12px", color: "#fff",
                  fontWeight: 700, fontSize: "14px", cursor: "pointer",
                  fontFamily: "'DotGothic16', sans-serif",
                  boxShadow: activeCard === num ? "0 4px 0 #880044" : "none",
                }}
              >
                {num === 1 ? "🚗 1枚目" : "🏎️ 2枚目"}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "8px" }}>
            <h2 style={{ color: "#fff", fontSize: "18px", margin: "0 0 4px", fontFamily: "'DotGothic16', sans-serif" }}>入力フォーム</h2>
            <p style={{ color: "#00d4ff", fontSize: "11px", margin: 0, fontFamily: "'DotGothic16', sans-serif", letterSpacing: "2px" }}>INPUT FORM</p>
          </div>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.2)", margin: "12px 0 16px" }} />

          <LicenseForm
            data={activeData}
            onChange={setActiveData}
            cardNum={activeCard}
          />

          <button
            onClick={handleCreate}
            style={{
              width: "100%", marginTop: "20px", padding: "16px",
              background: "linear-gradient(135deg, #00d4ff, #0088cc)",
              border: "none", borderRadius: "16px", color: "#fff",
              fontWeight: 700, fontSize: "16px", cursor: "pointer",
              fontFamily: "'DotGothic16', sans-serif",
              boxShadow: "0 6px 0 #005588",
              letterSpacing: "1px",
            }}
          >
            作成 CREATE
          </button>
        </div>

        {/* 右: プレビュー */}
        <div style={{
          background: "rgba(255,255,255,0.05)", borderRadius: "20px",
          border: "2px solid rgba(255,255,255,0.15)", padding: "24px",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ marginBottom: "8px" }}>
            <h2 style={{ color: "#fff", fontSize: "18px", margin: "0 0 4px", fontFamily: "'DotGothic16', sans-serif" }}>
              {activeCard === 1 ? "🚗 1枚目プレビュー" : "🏎️ 2枚目プレビュー"}
            </h2>
            <p style={{ color: "#00d4ff", fontSize: "11px", margin: 0, fontFamily: "'DotGothic16', sans-serif", letterSpacing: "2px" }}>PREVIEW</p>
          </div>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.2)", margin: "12px 0 16px" }} />

          <LicenseCardPreview data={activeData} />

          {!showPreview && (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "13px", marginTop: "16px", fontFamily: "'DotGothic16', sans-serif" }}>
              特別な自分の免許<br />作っちゃおう♪
            </p>
          )}
        </div>
      </div>

      {/* 完成プレビュー（作成ボタン後） */}
      {showPreview && (
        <div style={{
          maxWidth: "1100px", margin: "0 auto 40px", padding: "0 16px",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.05)", borderRadius: "20px",
            border: "2px solid rgba(0,212,255,0.4)", padding: "24px",
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ color: "#fff", fontSize: "20px", margin: "0 0 4px", fontFamily: "'DotGothic16', sans-serif" }}>
                🎉 完成プレビュー（2枚）
              </h2>
              <p style={{ color: "#00d4ff", fontSize: "11px", margin: 0, fontFamily: "'DotGothic16', sans-serif", letterSpacing: "2px" }}>
                PREVIEW - 2 CARDS
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div>
                <p style={{ textAlign: "center", color: "#ff66b2", fontSize: "13px", marginBottom: "8px", fontFamily: "'DotGothic16', sans-serif" }}>🚗 1枚目</p>
                <LicenseCardPreview data={card1} />
              </div>
              <div>
                <p style={{ textAlign: "center", color: "#00d4ff", fontSize: "13px", marginBottom: "8px", fontFamily: "'DotGothic16', sans-serif" }}>🏎️ 2枚目</p>
                <LicenseCardPreview data={card2.nickname ? card2 : card1} />
              </div>
            </div>

            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "12px", marginBottom: "16px", fontFamily: "'DotGothic16', sans-serif" }}>
              A4用紙（210×297mm）に2枚並べた画像を生成します
            </p>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              style={{
                display: "block", width: "100%", maxWidth: "400px", margin: "0 auto",
                padding: "18px",
                background: isDownloading
                  ? "rgba(255,255,255,0.2)"
                  : "linear-gradient(135deg, #00d4ff, #0088cc)",
                border: "none", borderRadius: "16px", color: "#fff",
                fontWeight: 700, fontSize: "18px", cursor: isDownloading ? "not-allowed" : "pointer",
                fontFamily: "'DotGothic16', sans-serif",
                boxShadow: isDownloading ? "none" : "0 6px 0 #005588",
                letterSpacing: "1px",
              }}
            >
              {isDownloading ? "生成中..." : "📱 スマホにダウンロードする"}
              <br />
              <span style={{ fontSize: "11px", letterSpacing: "2px", opacity: 0.8 }}>DOWNLOAD TO PHONE</span>
            </button>
          </div>
        </div>
      )}

      {/* レスポンシブ対応 */}
      <style>{`
        @media (max-width: 700px) {
          .license-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
