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

// ── License Card Preview（台紙ベース・正確な座標） ─────────────────────────────
function LicenseCardPreview({ data }: { data: LicenseData }) {
  const displayPhoto = data.aiPhotoUrl || data.photoUrl;
  const formatDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
  };
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "520px", margin: "0 auto" }}>
      <img src={LICENSE_CARD_BASE_URL} alt="免許証台紙" style={{ width: "100%", display: "block", borderRadius: "12px" }} />

      {/* 名前 — 名前ラベルの右横: left=17.2%, top=8.5%, w=43.3%, h=6.2% */}
      <div style={{ position: "absolute", top: "8.5%", left: "17.2%", width: "43.3%", height: "6.2%", display: "flex", alignItems: "center", padding: "0 8px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(11px, 2.2vw, 16px)", fontWeight: 700, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{data.nickname}</span>
      </div>

      {/* 長所 — left=17.2%, top=15.4%, w=43.3%, h=5.9% */}
      <div style={{ position: "absolute", top: "15.4%", left: "17.2%", width: "43.3%", height: "5.9%", display: "flex", alignItems: "center", padding: "0 8px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(10px, 1.9vw, 14px)", fontWeight: 600, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{data.strength}</span>
      </div>

      {/* 日付 — left=17.2%, top=21.9%, w=43.3%, h=5.9% */}
      <div style={{ position: "absolute", top: "21.9%", left: "17.2%", width: "43.3%", height: "5.9%", display: "flex", alignItems: "center", padding: "0 8px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(10px, 1.9vw, 13px)", fontWeight: 600, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", whiteSpace: "nowrap" }}>{formatDate(data.date)}</span>
      </div>

      {/* 約束 — 優良の下・左寄せ: left=2.3%, top=40%, w=56.7%, h=18.5% */}
      <div style={{ position: "absolute", top: "40%", left: "2.3%", width: "56.7%", height: "18.5%", display: "flex", alignItems: "center", justifyContent: "flex-start", padding: "6px 10px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(9px, 1.7vw, 12px)", fontWeight: 600, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", lineHeight: 1.5, wordBreak: "break-all", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{data.promise}</span>
      </div>

      {/* 将来の夢 — left=17.2%, top=75.4%, w=43.3%, h=5.9% */}
      <div style={{ position: "absolute", top: "75.4%", left: "17.2%", width: "43.3%", height: "5.9%", display: "flex", alignItems: "center", padding: "0 8px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(9px, 1.7vw, 13px)", fontWeight: 600, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{data.dream}</span>
      </div>

      {/* 発行 — left=17.2%, top=81.5%, w=43.3%, h=5.9% */}
      <div style={{ position: "absolute", top: "81.5%", left: "17.2%", width: "43.3%", height: "5.9%", display: "flex", alignItems: "center", padding: "0 8px", overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(9px, 1.7vw, 12px)", fontWeight: 600, color: "#1a1a2e", fontFamily: "'M PLUS Rounded 1c','Noto Sans JP',sans-serif", whiteSpace: "nowrap" }}>免許メーカー</span>
      </div>

      {/* 写真 — 右側縦長: left=62.7%, top=8.0%, w=34.1%, h=85.2% */}
      <div style={{ position: "absolute", top: "8.0%", left: "62.7%", width: "34.1%", height: "85.2%", overflow: "hidden", borderRadius: "4px" }}>
        {displayPhoto ? (
          <img src={displayPhoto} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg,#87ceeb 0%,#87ceeb 60%,#4caf50 60%,#4caf50 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "clamp(20px,4vw,32px)", opacity: 0.5 }}>👤</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Download (Canvas) ──────────────────────────────────────────────────────────
const DPI = 300;
const MM = DPI / 25.4;
const SHEET_W = Math.round(100 * MM);
const SHEET_H = Math.round(148 * MM);
const CARD_W  = Math.round(85.6 * MM);
const CARD_H  = Math.round(54 * MM);
const MARGIN_L = Math.round(7.2 * MM);
const MARGIN_T = Math.round(18 * MM);
const GAP      = Math.round(4.5 * MM);

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
  ox: number,
  oy: number,
  baseImg: HTMLImageElement
) {
  const W = CARD_W;
  const H = CARD_H;
  ctx.drawImage(baseImg, ox, oy, W, H);

  const fontSize = (mm: number) => Math.round(mm * MM / 10);
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#1a1a2e";

  const formatDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length !== 3) return d;
    return `${parts[0]}年${parseInt(parts[1])}月${parseInt(parts[2])}日`;
  };

  // 名前
  ctx.font = `bold ${fontSize(3.2)}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(data.nickname || "", ox + W * 0.172, oy + H * 0.116);

  // 長所
  ctx.font = `600 ${fontSize(2.7)}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
  ctx.fillText(data.strength || "", ox + W * 0.172, oy + H * 0.183);

  // 日付
  ctx.font = `600 ${fontSize(2.5)}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
  ctx.fillText(formatDate(data.date), ox + W * 0.172, oy + H * 0.248);

  // 約束（複数行）
  ctx.font = `600 ${fontSize(2.3)}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
  const promiseText = data.promise || "";
  const maxW = W * 0.55;
  const lineH = fontSize(2.3) * 1.6;
  let line = "";
  let lineY = oy + H * 0.42;
  for (const char of promiseText) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxW && line !== "") {
      ctx.fillText(line, ox + W * 0.023, lineY);
      line = char;
      lineY += lineH;
      if (lineY > oy + H * 0.575) break;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, ox + W * 0.023, lineY);

  // 将来の夢
  ctx.font = `600 ${fontSize(2.5)}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
  ctx.fillText(data.dream || "", ox + W * 0.172, oy + H * 0.783);

  // 発行
  ctx.font = `600 ${fontSize(2.3)}px 'M PLUS Rounded 1c','Noto Sans JP',sans-serif`;
  ctx.fillText("免許メーカー", ox + W * 0.172, oy + H * 0.845);

  // 写真
  const photoX = ox + W * 0.627;
  const photoY = oy + H * 0.080;
  const photoW = W * 0.341;
  const photoH = H * 0.852;
  const displayPhoto = data.aiPhotoUrl || data.photoUrl;
  if (displayPhoto) {
    try {
      const photoImg = await loadImg(displayPhoto);
      ctx.save();
      roundRect(ctx, photoX, photoY, photoW, photoH, 4);
      ctx.clip();
      const pa = photoImg.width / photoImg.height;
      const ba = photoW / photoH;
      let dw: number, dh: number, dx: number, dy: number;
      if (pa > ba) {
        dh = photoH; dw = dh * pa;
        dx = photoX - (dw - photoW) / 2; dy = photoY;
      } else {
        dw = photoW; dh = dw / pa;
        dx = photoX; dy = photoY - (dh - photoH) / 2;
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
  await renderLicenseCardOnCanvas(ctx, card1, MARGIN_L, MARGIN_T, baseImg);
  await renderLicenseCardOnCanvas(ctx, card2, MARGIN_L, MARGIN_T + CARD_H + GAP, baseImg);
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
              用紙サイズ（100×148mm）に合わせた2面付き画像を生成します
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
