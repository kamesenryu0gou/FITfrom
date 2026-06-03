/**
 * LicenseMaker.tsx
 * 子供向け免許証メーカー
 * - 台紙実測値（1075×650px）に基づく正確なレイアウト
 * - 写真がカードサイズを変動させない固定レイアウト
 * - プレビューとダウンロードCanvasの完全同期
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import { trpc } from "@/lib/trpc";
import AIPasswordModal from "@/components/AIPasswordModal";

const LICENSE_LOGO_URL = "/manus-storage/license-maker-logo-v3_378adfe6.png";
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
  // 全デバイス共通: トリミング後に最大1024pxにリサイズしJPEG 80%に圧縮
  const MAX_SIZE = 1024;
  let outW = pixelCrop.width;
  let outH = pixelCrop.height;
  if (outW > MAX_SIZE || outH > MAX_SIZE) {
    if (outW > outH) { outH = Math.round((outH * MAX_SIZE) / outW); outW = MAX_SIZE; }
    else { outW = Math.round((outW * MAX_SIZE) / outH); outH = MAX_SIZE; }
  }
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    outW, outH
  );
  return canvas.toDataURL("image/jpeg", 0.8);
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

// ── TwoCardPreview: 2枚並べサムネイル（ResizeObserverで動的スケール）────────────
// 個別カードのスケール縮小表示コンポーネント
function ScaledCardThumb({ data, label, color }: { data: LicenseData; label: string; color: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const CARD_NATURAL_W = 520;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? CARD_NATURAL_W;
      setScale(Math.min(1, w / CARD_NATURAL_W));
    });
    obs.observe(el);
    // 初回計算
    const w = el.getBoundingClientRect().width || CARD_NATURAL_W;
    setScale(Math.min(1, w / CARD_NATURAL_W));
    return () => obs.disconnect();
  }, []);

  const cardH = CARD_NATURAL_W * (650 / 1075) * scale;

  return (
    <div style={{ marginBottom: "16px" }}>
      <p style={{ textAlign: "center", color, fontSize: "15px", marginBottom: "8px", fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 800 }}>{label}</p>
      <div ref={containerRef} style={{ overflow: "hidden", width: "100%", height: `${cardH}px` }}>
        <div style={{ width: `${CARD_NATURAL_W}px`, transformOrigin: "top left", transform: `scale(${scale})` }}>
          <LicenseCardPreview data={data} />
        </div>
      </div>
    </div>
  );
}

function TwoCardPreview({ card1, card2 }: { card1: LicenseData; card2: LicenseData }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <ScaledCardThumb data={card1} label="🎀 1まいめ" color="#d63384" />
      <ScaledCardThumb data={card2} label="⭐ 2まいめ" color="#0088cc" />
    </div>
  );
}

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

      {/* 名前: y=46〜100, x=343〜680（328+15px）
          top=7.1%, h=8.3%, left=31.9%(343/1075), w=31.3%(337/1075) */}
      <div style={{
        position: "absolute",
        top: "7.1%",
        left: "31.9%",
        width: "31.3%",
        height: "8.3%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
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

      {/* 長所: y=141〜183, x=343〜680（328+15px）
          top=21.7%, h=6.5%, left=31.9%(343/1075), w=31.3%(337/1075) */}
      <div style={{
        position: "absolute",
        top: "21.7%",
        left: "31.9%",
        width: "31.3%",
        height: "6.5%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
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

      {/* 日付: y=183〜228, x=343〜680（328+15px）
          top=28.2%, h=6.9%, left=31.9%(343/1075), w=31.3%(337/1075) */}
      <div style={{
        position: "absolute",
        top: "28.2%",
        left: "31.9%",
        width: "31.3%",
        height: "6.9%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
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

      {/* 約束: y=370〜516（優良ボックス下端y=366の下）, x=30〜680（左端から）
          top=56.9%(370/650), h=22.5%(146/650), left=2.8%(30/1075), w=59.3%(638/1075)
          「優良」ボックス(y=307〜366)の下・ニックネームと同じフォントサイズ・左揃え */}
      <div style={{
        position: "absolute",
        top: "56.9%",
        left: "2.8%",
        width: "59.3%",
        height: "22.5%",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        overflow: "hidden",
        padding: "4px 4px 2px 8px",
      }}>
        <span style={{
          fontSize: "clamp(10px, 2.8vw, 22px)",
          fontWeight: 700,
          color: "#1a1a2e",
          fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif",
          lineHeight: 1.4,
          wordBreak: "break-all",
          display: "-webkit-box",
          WebkitLineClamp: 5,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        } as React.CSSProperties}>{data.promise}</span>
      </div>

      {/* 将来の夢: y=516〜558, x=225〜680（215+10px）
          top=79.4%, h=6.5%, left=20.9%(225/1075), w=42.3%(455/1075) */}
      <div style={{
        position: "absolute",
        top: "79.4%",
        left: "20.9%",
        width: "42.3%",
        height: "6.5%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
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

      {/* 発行(免許メーカー): 将来の夢と同じ横軸(x=225)、発行行の縦軸(y=558〜603)
          top=85.8%(558/650), h=6.9%(45/650), left=20.9%(225/1075), w=42.3%(455/1075)
          将来の夢と同じフォントサイズ・固定テキスト「免許メーカー」 */}
      <div style={{
        position: "absolute",
        top: "85.8%",
        left: "20.9%",
        width: "42.3%",
        height: "6.9%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
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
        }}>免許メーカー</span>
      </div>
    </div>
  );
}

// ── Canvas定数（台紙1075×650px・実測値）──────────────────────────────────────
const CARD_W  = 1075;
const CARD_H  = 650;

// 各フィールドの座標（実測値）
const NAME_X    = 343;   // 名前入力開始 x（328+15px）
const NAME_Y1   = 46;    // 名前行上端
const NAME_Y2   = 100;   // 名前行下端

const KYOSHO_X  = 343;   // 長所入力開始 x（328+15px）
const KYOSHO_Y1 = 141;   // 長所行上端
const KYOSHO_Y2 = 183;   // 長所行下端

const DATE_X    = 343;   // 日付入力開始 x（328+15px）
const DATE_Y1   = 183;   // 日付行上端
const DATE_Y2   = 228;   // 日付行下端

const YAKUSOKU_X  = 30;  // 約束入力開始 x（左端から）
const YAKUSOKU_Y1 = 370; // 約束エリア上端（優良ボックス下端 y=366の下）
const YAKUSOKU_Y2 = 516; // 約束エリア下端

const YUME_X    = 225;   // 将来の夢入力開始 x（215+10px）
const YUME_Y1   = 516;   // 将来の夢行上端
const YUME_Y2   = 558;   // 将来の夢行下端

const HAKKO_X   = 225;   // 発行入力開始 x（215+10px）
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
const MARGIN_TOP = Math.round(18.0 * MM);  // 213px（JP-ID03N実測値）
const MARGIN_L   = Math.round(7.2 * MM);   //  85px
const GAP        = Math.round(4.5 * MM);   //  53px（JP-ID03N実測値）

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
  ctx.fillStyle = "#000000"; // 視認性向上: #1a1a2e→#000000
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
    const fs = data.nickname.length > 10 ? 21 : data.nickname.length > 6 ? 25 : 29;
    ctx.font = `bold ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(data.nickname, NAME_X, (NAME_Y1 + NAME_Y2) / 2, TEXT_MAX_W - NAME_X);
  }

  // ── 長所 (+3pxフォント) ──
  if (data.strength) {
    const fs = data.strength.length > 12 ? 19 : data.strength.length > 8 ? 21 : 23;
    ctx.font = `600 ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(data.strength, KYOSHO_X, (KYOSHO_Y1 + KYOSHO_Y2) / 2, TEXT_MAX_W - KYOSHO_X);
  }

  // ── 日付 (+3pxフォント) ──
  if (data.date) {
    ctx.font = `600 18px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(formatDate(data.date), DATE_X, (DATE_Y1 + DATE_Y2) / 2, TEXT_MAX_W - DATE_X);
  }

  // ── 約束（複数行折り返し）+30px右 ──
  if (data.promise) {
    const yakusokuX = YAKUSOKU_X + 30; // +30px右
    const areaW = TEXT_MAX_W - yakusokuX;
    const areaH = YAKUSOKU_Y2 - YAKUSOKU_Y1;
    const charCount = data.promise.length;
    // ニックネームと同じ大型フォント
    const fs = charCount > 20 ? 23 : charCount > 10 ? 27 : 29;
    const lineH = fs * 1.4;
    const maxLines = Math.floor(areaH / lineH);
    ctx.font = `600 ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    let line = "";
    let lineCount = 0;
    for (const char of data.promise) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > areaW && line !== "") {
        ctx.fillText(line, yakusokuX, YAKUSOKU_Y1 + fs * 0.8 + lineCount * lineH);
        line = char;
        lineCount++;
        if (lineCount >= maxLines) break;
      } else {
        line = testLine;
      }
    }
    if (lineCount < maxLines && line) {
      ctx.fillText(line, yakusokuX, YAKUSOKU_Y1 + fs * 0.8 + lineCount * lineH);
    }
  }

  // ── 将来の夢 (+3pxフォント・+20px右) ──
  if (data.dream) {
    const yumeX = YUME_X + 20; // +20px右
    const fs = data.dream.length > 10 ? 19 : 21;
    ctx.font = `600 ${fs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
    ctx.fillText(data.dream, yumeX, (YUME_Y1 + YUME_Y2) / 2, TEXT_MAX_W - yumeX);
  }

  // ── 発行(免許メーカー) (+3pxフォント・+20px右) ──
  const hakkoX = HAKKO_X + 20; // +20px右
  const dreamFs = (data.dream?.length ?? 0) > 10 ? 19 : 21;
  ctx.font = `600 ${dreamFs}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
  ctx.fillText("免許メーカー", hakkoX, (HAKKO_Y1 + HAKKO_Y2) / 2, TEXT_MAX_W - hakkoX);
}

async function downloadLicenseSheet(card1: LicenseData, card2: LicenseData) {
  const canvas = document.createElement("canvas");
  canvas.width = SHEET_W;
  canvas.height = SHEET_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  const baseImg = await loadImg(LICENSE_CARD_BASE_URL);

  // 1枚目: MARGIN_TOP(213px=18mm) + 2mm(24px) = 237px（2mm中央寄せ）
  const card1Top = MARGIN_TOP + Math.round(2.0 * MM); // 237px = 20mm
  ctx.save();
  ctx.translate(MARGIN_L, card1Top);
  ctx.scale(FIT_SCALE, FIT_SCALE);
  await renderLicenseCardOnCanvas(ctx, card1, baseImg);
  ctx.restore();

  // 2枚目: 固定値904px（変更しない）
  const card2Top = 904; // 固定: 18mm上余白(213px) + 638pxカード高 + 53px間隔 = 904px
  ctx.save();
  ctx.translate(MARGIN_L, card2Top);
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const convertToCarStyle = trpc.license.convertToCarStyle.useMutation();
  const { data: queueStatus } = trpc.ai.queueStatus.useQuery(undefined, {
    refetchInterval: isGeneratingAI ? 2000 : false,
  });
  const queueWaiting = queueStatus?.waiting ?? 0;

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

  // AIボタン押下時: パスワードモーダルを表示する
  const handleAIButtonClick = () => {
    if (!data.photoUrl) {
      toast.error("まず写真を選択してください");
      return;
    }
    setShowPasswordModal(true);
  };

  // パスワード認証成功後に実際のAI加工を実行する
  const handleGenerateAI = async () => {
    setShowPasswordModal(false);
    if (!data.photoUrl) {
      toast.error("まず写真を選択してください");
      return;
    }
    setIsGeneratingAI(true);
    try {
      // Canvas APIで最大1024pxにリサイズ・JPEG 80%に圧縮してから送信（iPhoneの大容量写真対応）
      const { base64, mimeType } = await new Promise<{ base64: string; mimeType: string }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const MAX_SIZE = 1024;
          let { width, height } = img;
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE; }
            else { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas error")); return; }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.8);
          const [, b64] = compressed.split(",");
          resolve({ base64: b64, mimeType: "image/jpeg" });
        };
        img.onerror = reject;
        img.src = data.photoUrl!;
      });
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
    borderRadius: "20px",
    border: "3px solid rgba(255,105,180,0.35)",
    fontSize: "16px",
    fontFamily: "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
    fontWeight: 700,
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
    boxShadow: "0 3px 0 rgba(255,105,180,0.2)",
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
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 900, fontSize: "14px", color: "#d63384", fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: "1px", textShadow: "1px 1px 0 #fff" }}>🎀 ニックネーム</label>
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
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 900, fontSize: "14px", color: "#e67e00", fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: "1px", textShadow: "1px 1px 0 #fff" }}>⭐ 長所</label>
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
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 900, fontSize: "14px", color: "#0088cc", fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: "1px", textShadow: "1px 1px 0 #fff" }}>📅 日付</label>
        <input
          type="date"
          value={data.date}
          onChange={(e) => onChange({ date: e.target.value })}
          style={{ ...inputStyle, background: "linear-gradient(135deg, #d0f0ff, #b8e8ff)", color: "#1a1a2e" }}
        />
      </div>

      {/* 約束 */}
      <div>
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 900, fontSize: "14px", color: "#2e7d32", fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: "1px", textShadow: "1px 1px 0 #fff" }}>🌟 約束</label>
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
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 900, fontSize: "14px", color: "#7b1fa2", fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: "1px", textShadow: "1px 1px 0 #fff" }}>💫 将来の夢</label>
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
        <label style={{ display: "block", marginBottom: "6px", fontWeight: 900, fontSize: "14px", color: "#c62828", fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: "1px", textShadow: "1px 1px 0 #fff" }}>📸 写真</label>
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
              background: "linear-gradient(135deg, #ff69b4, #d63384)",
              border: "none", borderRadius: "50px", color: "#fff",
              fontWeight: 900, fontSize: "14px", cursor: "pointer",
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              boxShadow: "0 4px 0 #a0005a",
            }}
          >
            {data.photoUrl ? "📸 写真を変更" : "📸 写真を選択"}
          </button>
          {data.photoUrl && (
            <button
              onClick={handleAIButtonClick}
              disabled={isGeneratingAI}
              style={{
                flex: 1, minWidth: "120px", padding: "12px 16px",
                background: isGeneratingAI
                  ? "#ccc"
                  : "linear-gradient(135deg, #00c6ff, #0072ff)",
                border: "none", borderRadius: "50px", color: "#fff",
                fontWeight: 900, fontSize: "13px", cursor: isGeneratingAI ? "not-allowed" : "pointer",
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                boxShadow: isGeneratingAI ? "none" : "0 4px 0 #004bb5",
              }}
            >
              {isGeneratingAI
        ? queueWaiting > 0
          ? `AI加工待機中... ${queueWaiting}人待ち`
          : "AI加工中..."
        : "AIイラスト化"}
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
            <span style={{ fontSize: "12px", color: isGeneratingAI ? "#ff6b35" : "#d63384", fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 700 }}>
              {isGeneratingAI
                ? queueWaiting > 0
                  ? `✨ AI加工待機中... あなたの前に${queueWaiting}人待ちです`
                  : "✨ AI加工中... しばらくお待ちください"
                : data.aiPhotoUrl ? "AIイラスト使用中" : "写真選択済み"}
            </span>
          </div>
        )}
      </div>

      {/* パスワードモーダル */}
      <AIPasswordModal
        open={showPasswordModal}
        onSuccess={handleGenerateAI}
        onCancel={() => setShowPasswordModal(false)}
      />
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
      toast.success("免許シートを保存しました！");
    } catch (e) {
      toast.error("ダウンロードに失敗しました");
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Sugar Rush POP スタイル定数 ──
  const panelStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.88)",
    borderRadius: "28px",
    border: "4px solid #fff",
    padding: "24px",
    boxShadow: "0 8px 32px rgba(255,120,200,0.2), 0 2px 0 #fff inset",
  };
  const headingStyle: React.CSSProperties = {
    fontFamily: "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
    fontWeight: 900,
    fontSize: "20px",
    color: "#d63384",
    textShadow: "2px 2px 0 #fff, 3px 3px 0 #ff9de2",
    margin: "0 0 2px",
    letterSpacing: "1px",
  };
  const subHeadingStyle: React.CSSProperties = {
    fontFamily: "'M PLUS Rounded 1c', sans-serif",
    fontWeight: 700,
    fontSize: "11px",
    color: "#ff69b4",
    letterSpacing: "3px",
    margin: 0,
  };
  const dividerStyle: React.CSSProperties = {
    height: "3px",
    background: "linear-gradient(90deg, #ff9de2, #ffd6a5, #fffb96, #a0f4a0, #96d9ff)",
    borderRadius: "4px",
    margin: "12px 0 16px",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #ff9de2 0%, #ffd6a5 25%, #fffb96 50%, #a0f4a0 75%, #96d9ff 100%)",
      fontFamily: "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* 背景デコレーション */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {["⭐","🍬","🌟","💖","🍭","✨","🎀","🌈","🍡","💫"].map((emoji, i) => (
          <span key={i} style={{
            position: "absolute",
            fontSize: `${18 + (i % 3) * 10}px`,
            opacity: 0.15,
            top: `${(i * 11 + 5) % 90}%`,
            left: `${(i * 13 + 3) % 95}%`,
            transform: `rotate(${i * 37}deg)`,
            userSelect: "none",
          }}>{emoji}</span>
        ))}
      </div>

      {/* ヘッダー */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
        <button
          onClick={() => setLocation("/")}
          style={{
            background: "#fff",
            border: "3px solid #ff69b4",
            borderRadius: "50px",
            color: "#d63384",
            padding: "8px 20px",
            fontSize: "14px",
            cursor: "pointer",
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
            fontWeight: 800,
            boxShadow: "0 4px 0 #ff9de2",
          }}
        >← ホームへもどる</button>
      </div>

      {/* ロゴ */}
      <div style={{ textAlign: "center", padding: "0 20px 24px", position: "relative", zIndex: 1 }}>
        <div style={{
          display: "inline-block",
          background: "#fff",
          borderRadius: "24px",
          padding: "12px 24px",
          boxShadow: "0 6px 0 #ff9de2, 0 0 0 4px #ffd6a5",
          marginBottom: "12px",
        }}>
          <img src={LICENSE_LOGO_URL} alt="免許メーカー" style={{ maxWidth: "180px", height: "auto", display: "block" }} />
        </div>
        <p style={{
          color: "#d63384",
          fontSize: "18px",
          margin: "0 0 4px",
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
          fontWeight: 900,
          textShadow: "2px 2px 0 #fff",
        }}>
          🎉 きみだけのオリジナル免許をつくろう！
        </p>
        <p style={{
          color: "#c2185b",
          fontSize: "12px",
          margin: 0,
          fontFamily: "'M PLUS Rounded 1c', sans-serif",
          fontWeight: 700,
          letterSpacing: "3px",
        }}>
          ✨ MAKE YOUR OWN ORIGINAL LICENCE! ✨
        </p>
      </div>

      {/* メインコンテンツ */}
      <div style={{
        maxWidth: "1100px", margin: "0 auto", padding: "0 16px 40px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px",
        position: "relative", zIndex: 1,
      }}
        className="license-grid"
      >
        {/* 左: 入力フォーム */}
        <div style={panelStyle}>
          {/* カード切り替えタブ */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {([1, 2] as const).map((num) => (
              <button
                key={num}
                onClick={() => setActiveCard(num)}
                style={{
                  flex: 1, padding: "12px",
                  background: activeCard === num
                    ? "linear-gradient(135deg, #ff69b4, #d63384)"
                    : "#f8f0ff",
                  border: activeCard === num ? "3px solid #d63384" : "3px dashed #ffb3d9",
                  borderRadius: "18px",
                  color: activeCard === num ? "#fff" : "#d63384",
                  fontWeight: 900,
                  fontSize: "15px",
                  cursor: "pointer",
                  fontFamily: "'M PLUS Rounded 1c', sans-serif",
                  boxShadow: activeCard === num ? "0 5px 0 #a0005a" : "0 3px 0 #ffb3d9",
                }}
              >
                {num === 1 ? "🎀 1まいめ" : "⭐ 2まいめ"}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "8px" }}>
            <h2 style={headingStyle}>📝 にゅうりょくフォーム</h2>
            <p style={subHeadingStyle}>INPUT FORM</p>
          </div>
          <div style={dividerStyle} />

          <LicenseForm
            key={activeCard}
            data={activeData}
            onChange={setActiveData}
            cardNum={activeCard}
          />

          <button
            onClick={handleCreate}
            style={{
              width: "100%", marginTop: "20px", padding: "16px",
              background: "linear-gradient(135deg, #ff69b4, #d63384)",
              border: "none", borderRadius: "50px", color: "#fff",
              fontWeight: 900, fontSize: "18px", cursor: "pointer",
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              boxShadow: "0 6px 0 #a0005a",
              letterSpacing: "2px",
            }}
          >
            🌟 つくる！ CREATE
          </button>
        </div>

        {/* 右: プレビュー */}
        <div style={panelStyle}>
          <div style={{ marginBottom: "8px" }}>
            <h2 style={headingStyle}>
              {activeCard === 1 ? "🎀 1まいめプレビュー" : "⭐ 2まいめプレビュー"}
            </h2>
            <p style={subHeadingStyle}>PREVIEW</p>
          </div>
          <div style={dividerStyle} />

          <LicenseCardPreview data={activeData} />

          {!showPreview && (
            <p style={{ textAlign: "center", color: "#d63384", fontSize: "14px", marginTop: "16px", fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 700 }}>
              ✨ とくべつな自分の免許<br />つくっちゃおう♪
            </p>
          )}
        </div>
      </div>

      {/* 完成プレビュー（作成ボタン後） */}
      {showPreview && (
        <div style={{
          maxWidth: "1100px", margin: "0 auto 40px", padding: "0 16px",
          position: "relative", zIndex: 1,
        }}>
          <div style={{
            ...panelStyle,
            border: "4px solid #ff69b4",
            boxShadow: "0 8px 32px rgba(255,105,180,0.3), 0 2px 0 #fff inset",
          }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ ...headingStyle, fontSize: "24px" }}>
                🎉 かんせいプレビュー（2まい）
              </h2>
              <p style={subHeadingStyle}>
                ✨ PREVIEW - 2 CARDS ✨
              </p>
            </div>

            <TwoCardPreview card1={card1} card2={card2.nickname ? card2 : card1} />

            <p style={{ textAlign: "center", color: "#d63384", fontSize: "13px", marginBottom: "16px", fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 700 }}>
              📄 JP-ID03Nはがき用紙（100×148.5mm）に2枚並べた画像を生成します
            </p>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              style={{
                display: "block", width: "100%", maxWidth: "400px", margin: "0 auto",
                padding: "18px",
                background: isDownloading
                  ? "#ccc"
                  : "linear-gradient(135deg, #00c6ff, #0072ff)",
                border: "none", borderRadius: "50px", color: "#fff",
                fontWeight: 900, fontSize: "18px", cursor: isDownloading ? "not-allowed" : "pointer",
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                boxShadow: isDownloading ? "none" : "0 6px 0 #004bb5",
                letterSpacing: "2px",
              }}
            >
              {isDownloading ? "✨ 生成中..." : "📱 ダウンロードする！"}
              <br />
              <span style={{ fontSize: "11px", letterSpacing: "3px", opacity: 0.85 }}>DOWNLOAD TO PHONE</span>
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
        @keyframes pop-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
