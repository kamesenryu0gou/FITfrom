/**
 * LicenseMaker.tsx
 * 子供向け免許証メーカー
 * - カーズ（Cars）風UI: 赤・チェッカーフラッグ・ポップなデザイン
 * - 2枚フォーム（タブ切り替え）
 * - 写真クロップ機能（5:4比率）
 * - 免許証カードデザイン（日本の運転免許証風）
 * - 2面付きダウンロード（100×148mm、上段1枚目・下段2枚目）
 */

import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Cropper from "react-easy-crop";

const LICENSE_LOGO_URL = "/manus-storage/license-maker-logo_d91648c0.png";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LicenseData {
  nickname: string;
  strength: string;
  date: string;
  promise: string;
  dream: string;
  photoUrl: string | null;
  photoFile: File | null;
}

const INITIAL_LICENSE: LicenseData = {
  nickname: "",
  strength: "",
  date: "",
  promise: "",
  dream: "",
  photoUrl: null,
  photoFile: null,
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
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
        zIndex: 9999, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff", borderRadius: "16px", overflow: "hidden",
          width: "min(90vw, 480px)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#1a1a2e" }}>写真を切り取る（5:4）</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#999" }}>✕</button>
        </div>
        <div style={{ position: "relative", width: "100%", height: "300px", background: "#333" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={5 / 4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div style={{ padding: "16px 20px" }}>
          <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "6px" }}>ズーム</label>
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", gap: "10px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "12px", border: "1px solid #ddd",
              borderRadius: "8px", background: "#fff", color: "#555",
              fontWeight: 600, fontSize: "14px", cursor: "pointer",
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleDone}
            style={{
              flex: 2, padding: "12px", border: "none",
              borderRadius: "8px", background: "#e63946", color: "#fff",
              fontWeight: 700, fontSize: "14px", cursor: "pointer",
            }}
          >
            この範囲で決定
          </button>
        </div>
      </div>
    </div>
  );
}

// ── License Card Preview ───────────────────────────────────────────────────────
function LicenseCardPreview({ data, cardNum }: { data: LicenseData; cardNum: number }) {
  return (
    <div
      style={{
        width: "320px",
        height: "202px",
        borderRadius: "12px",
        overflow: "hidden",
        background: "linear-gradient(135deg, #1a237e 0%, #283593 40%, #1565c0 100%)",
        border: "3px solid #ffd700",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        position: "relative",
        fontFamily: "'Noto Sans JP', sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Checker pattern top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "8px",
        background: "repeating-linear-gradient(90deg, #000 0px, #000 8px, #fff 8px, #fff 16px)",
        opacity: 0.7,
      }} />

      {/* Header bar */}
      <div style={{
        position: "absolute", top: "8px", left: 0, right: 0,
        background: "#ffd700", padding: "4px 10px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "9px", fontWeight: 900, color: "#1a1a2e", letterSpacing: "0.1em" }}>
          子供向け　CHILDREN'S DRIVING LICENSE
        </span>
        <span style={{ fontSize: "9px", fontWeight: 700, color: "#1a1a2e" }}>No.{cardNum}</span>
      </div>

      {/* Main content area */}
      <div style={{ position: "absolute", top: "32px", left: "10px", right: "10px", bottom: "20px", display: "flex", gap: "10px" }}>
        {/* Left: photo */}
        <div style={{
          width: "80px", height: "100px", flexShrink: 0,
          background: "#c8d8f0", borderRadius: "6px", overflow: "hidden",
          border: "2px solid #ffd700", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "28px" }}>👤</span>
          )}
        </div>

        {/* Right: info */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
          {/* Name */}
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "4px", padding: "3px 6px" }}>
            <span style={{ fontSize: "8px", color: "#ffd700", fontWeight: 700 }}>なまえ　</span>
            <span style={{ fontSize: "13px", color: "#fff", fontWeight: 900 }}>{data.nickname || "　"}</span>
          </div>
          {/* Date */}
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "4px", padding: "3px 6px" }}>
            <span style={{ fontSize: "8px", color: "#ffd700", fontWeight: 700 }}>こうふ　</span>
            <span style={{ fontSize: "10px", color: "#fff", fontWeight: 600 }}>{data.date || "　"}</span>
          </div>
          {/* Strength */}
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "4px", padding: "3px 6px" }}>
            <span style={{ fontSize: "8px", color: "#ffd700", fontWeight: 700 }}>とくい　</span>
            <span style={{ fontSize: "10px", color: "#fff", fontWeight: 600 }}>{data.strength || "　"}</span>
          </div>
          {/* Dream */}
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "4px", padding: "3px 6px" }}>
            <span style={{ fontSize: "8px", color: "#ffd700", fontWeight: 700 }}>ゆめ　</span>
            <span style={{ fontSize: "10px", color: "#fff", fontWeight: 600 }}>{data.dream || "　"}</span>
          </div>
          {/* Promise */}
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "4px", padding: "3px 6px" }}>
            <span style={{ fontSize: "8px", color: "#ffd700", fontWeight: 700 }}>やくそく　</span>
            <span style={{ fontSize: "10px", color: "#fff", fontWeight: 600 }}>{data.promise || "　"}</span>
          </div>
        </div>

        {/* Stamp */}
        <div style={{
          position: "absolute", right: "4px", bottom: "4px",
          width: "44px", height: "44px", borderRadius: "50%",
          border: "2px solid #e63946", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "rgba(230,57,70,0.1)",
        }}>
          <span style={{ fontSize: "7px", color: "#e63946", fontWeight: 900, lineHeight: 1.2, textAlign: "center" }}>安全<br/>認定</span>
        </div>
      </div>

      {/* Yellow bar */}
      <div style={{
        position: "absolute", bottom: "8px", left: 0, right: 0,
        background: "#ffd700", padding: "2px 10px",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: "8px", fontWeight: 900, color: "#1a1a2e", letterSpacing: "0.15em" }}>
          初心運転者標識免除　発行：免許メーカー
        </span>
      </div>

      {/* Checker pattern bottom */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "8px",
        background: "repeating-linear-gradient(90deg, #000 0px, #000 8px, #fff 8px, #fff 16px)",
        opacity: 0.7,
      }} />
    </div>
  );
}

// ── Download function ──────────────────────────────────────────────────────────
const DPI = 300;
const MM = DPI / 25.4;

const SHEET_W = Math.round(100 * MM);   // 1181 px
const SHEET_H = Math.round(148 * MM);   // 1748 px
const CARD_W  = Math.round(85.6 * MM);  // 1011 px
const CARD_H  = Math.round(54 * MM);    //  638 px
const MARGIN_L = Math.round(7.2 * MM);  //   85 px
const MARGIN_T = Math.round(18 * MM);   //  213 px
const GAP      = Math.round(4.5 * MM);  //   53 px

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function renderLicenseCard(
  ctx: CanvasRenderingContext2D,
  data: LicenseData,
  ox: number,
  oy: number
) {
  const W = CARD_W;
  const H = CARD_H;

  // Background gradient
  const grad = ctx.createLinearGradient(ox, oy, ox + W, oy + H);
  grad.addColorStop(0, "#1a237e");
  grad.addColorStop(0.4, "#283593");
  grad.addColorStop(1, "#1565c0");
  ctx.fillStyle = grad;
  roundRect(ctx, ox, oy, W, H, Math.round(10 * MM / 10));
  ctx.fill();

  // Gold border
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = Math.round(2.5 * MM / 10);
  roundRect(ctx, ox, oy, W, H, Math.round(10 * MM / 10));
  ctx.stroke();

  // Checker top
  const checkerH = Math.round(6 * MM / 10);
  for (let i = 0; i < Math.ceil(W / checkerH); i++) {
    ctx.fillStyle = i % 2 === 0 ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)";
    ctx.fillRect(ox + i * checkerH, oy, checkerH, checkerH);
  }

  // Yellow header bar
  const headerH = Math.round(16 * MM / 10);
  const headerY = oy + checkerH;
  ctx.fillStyle = "#ffd700";
  ctx.fillRect(ox, headerY, W, headerH);
  ctx.fillStyle = "#1a1a2e";
  ctx.font = `bold ${Math.round(7 * MM / 10)}px 'Noto Sans JP', sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("子供向け　CHILDREN'S DRIVING LICENSE", ox + Math.round(6 * MM / 10), headerY + headerH / 2);
  ctx.textAlign = "right";
  ctx.fillText(`No.${data.nickname ? data.nickname.slice(0, 1) : "?"}`, ox + W - Math.round(6 * MM / 10), headerY + headerH / 2);

  // Content area
  const contentY = headerY + headerH + Math.round(4 * MM / 10);
  const photoW = Math.round(22 * MM);
  const photoH = Math.round(28 * MM);
  const photoX = ox + Math.round(6 * MM / 10 * 2);

  // Photo box
  ctx.fillStyle = "#c8d8f0";
  roundRect(ctx, photoX, contentY, photoW, photoH, Math.round(4 * MM / 10));
  ctx.fill();
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = Math.round(1.5 * MM / 10);
  roundRect(ctx, photoX, contentY, photoW, photoH, Math.round(4 * MM / 10));
  ctx.stroke();

  if (data.photoUrl) {
    try {
      const photoImg = await loadImg(data.photoUrl);
      ctx.save();
      roundRect(ctx, photoX, contentY, photoW, photoH, Math.round(4 * MM / 10));
      ctx.clip();
      const pa = photoImg.width / photoImg.height;
      const ba = photoW / photoH;
      let dw: number, dh: number, dx: number, dy: number;
      if (pa > ba) { dh = photoH; dw = dh * pa; dx = photoX - (dw - photoW) / 2; dy = contentY; }
      else { dw = photoW; dh = dw / pa; dx = photoX; dy = contentY - (dh - photoH) / 2; }
      ctx.drawImage(photoImg, dx, dy, dw, dh);
      ctx.restore();
    } catch { /* skip */ }
  }

  // Info rows
  const infoX = photoX + photoW + Math.round(4 * MM / 10);
  const infoW = W - (infoX - ox) - Math.round(4 * MM / 10);
  const rowH = Math.round(10 * MM / 10);
  const rowGap = Math.round(3 * MM / 10);
  const labelSize = Math.round(6 * MM / 10);
  const valueSize = Math.round(8 * MM / 10);

  const rows = [
    { label: "なまえ", value: data.nickname },
    { label: "こうふ", value: data.date },
    { label: "とくい", value: data.strength },
    { label: "ゆめ", value: data.dream },
    { label: "やくそく", value: data.promise },
  ];

  rows.forEach((row, i) => {
    const ry = contentY + i * (rowH + rowGap);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(ctx, infoX, ry, infoW, rowH, Math.round(2 * MM / 10));
    ctx.fill();
    ctx.fillStyle = "#ffd700";
    ctx.font = `bold ${labelSize}px 'Noto Sans JP', sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(row.label, infoX + Math.round(2 * MM / 10), ry + rowH / 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${valueSize}px 'Noto Sans JP', sans-serif`;
    ctx.fillText(row.value || "", infoX + Math.round(14 * MM / 10), ry + rowH / 2);
  });

  // Stamp circle
  const stampR = Math.round(10 * MM / 10);
  const stampX = ox + W - Math.round(8 * MM / 10) - stampR;
  const stampY = contentY + photoH - stampR;
  ctx.beginPath();
  ctx.arc(stampX, stampY, stampR, 0, Math.PI * 2);
  ctx.strokeStyle = "#e63946";
  ctx.lineWidth = Math.round(1.5 * MM / 10);
  ctx.stroke();
  ctx.fillStyle = "rgba(230,57,70,0.1)";
  ctx.fill();
  ctx.fillStyle = "#e63946";
  ctx.font = `bold ${Math.round(5 * MM / 10)}px 'Noto Sans JP', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("安全", stampX, stampY - Math.round(2.5 * MM / 10));
  ctx.fillText("認定", stampX, stampY + Math.round(2.5 * MM / 10));

  // Yellow footer bar
  const footerH = Math.round(12 * MM / 10);
  const footerY = oy + H - checkerH - footerH;
  ctx.fillStyle = "#ffd700";
  ctx.fillRect(ox, footerY, W, footerH);
  ctx.fillStyle = "#1a1a2e";
  ctx.font = `bold ${Math.round(6 * MM / 10)}px 'Noto Sans JP', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("初心運転者標識免除　発行：免許メーカー", ox + W / 2, footerY + footerH / 2);

  // Checker bottom
  for (let i = 0; i < Math.ceil(W / checkerH); i++) {
    ctx.fillStyle = i % 2 === 0 ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)";
    ctx.fillRect(ox + i * checkerH, oy + H - checkerH, checkerH, checkerH);
  }
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

async function downloadLicenseSheet(card1: LicenseData, card2: LicenseData) {
  const canvas = document.createElement("canvas");
  canvas.width = SHEET_W;
  canvas.height = SHEET_H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);

  await renderLicenseCard(ctx, card1, MARGIN_L, MARGIN_T);
  await renderLicenseCard(ctx, card2, MARGIN_L, MARGIN_T + CARD_H + GAP);

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

// ── Form component ─────────────────────────────────────────────────────────────
function LicenseForm({
  data,
  onChange,
  cardNum,
}: {
  data: LicenseData;
  onChange: (updates: Partial<LicenseData>) => void;
  cardNum: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ photoFile: file });
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropDone = (croppedUrl: string) => {
    onChange({ photoUrl: croppedUrl });
    setCropSrc(null);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "2px solid #e0e0e0",
    fontSize: "14px",
    color: "#1a1a2e",
    background: "#fff",
    outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "'Noto Sans JP', sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 700,
    color: "#555",
    marginBottom: "4px",
    display: "block",
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

      {/* Photo upload */}
      <div>
        <label style={labelStyle}>📷 写真（5:4でトリミング）</label>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div
            style={{
              width: "80px", height: "64px", borderRadius: "8px",
              background: "#f0f0f0", border: "2px dashed #ccc",
              overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {data.photoUrl
              ? <img src={data.photoUrl} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: "24px" }}>👤</span>
            }
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "10px 20px", background: "#e63946", color: "#fff",
              border: "none", borderRadius: "8px", fontWeight: 700,
              fontSize: "13px", cursor: "pointer",
            }}
          >
            {data.photoUrl ? "写真を変更" : "写真を選択"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        </div>
      </div>

      {/* Nickname */}
      <div>
        <label style={labelStyle}>🏷️ ニックネーム</label>
        <input
          style={inputStyle}
          placeholder="例：たろう"
          value={data.nickname}
          onChange={(e) => onChange({ nickname: e.target.value })}
          onFocus={(e) => { e.target.style.borderColor = "#e63946"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e0e0e0"; }}
        />
      </div>

      {/* Strength */}
      <div>
        <label style={labelStyle}>⭐ 長所・とくい</label>
        <input
          style={inputStyle}
          placeholder="例：やさしいところ"
          value={data.strength}
          onChange={(e) => onChange({ strength: e.target.value })}
          onFocus={(e) => { e.target.style.borderColor = "#e63946"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e0e0e0"; }}
        />
      </div>

      {/* Date */}
      <div>
        <label style={labelStyle}>📅 日付（こうふ）</label>
        <input
          style={inputStyle}
          type="date"
          value={data.date}
          onChange={(e) => onChange({ date: e.target.value })}
          onFocus={(e) => { e.target.style.borderColor = "#e63946"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e0e0e0"; }}
        />
      </div>

      {/* Promise */}
      <div>
        <label style={labelStyle}>🤝 約束</label>
        <input
          style={inputStyle}
          placeholder="例：まいにちはみがきをする"
          value={data.promise}
          onChange={(e) => onChange({ promise: e.target.value })}
          onFocus={(e) => { e.target.style.borderColor = "#e63946"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e0e0e0"; }}
        />
      </div>

      {/* Dream */}
      <div>
        <label style={labelStyle}>🌟 将来の夢</label>
        <input
          style={inputStyle}
          placeholder="例：サッカーせんしゅ"
          value={data.dream}
          onChange={(e) => onChange({ dream: e.target.value })}
          onFocus={(e) => { e.target.style.borderColor = "#e63946"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e0e0e0"; }}
        />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function LicenseMaker() {
  const [, setLocation] = useLocation();
  const [card1, setCard1] = useState<LicenseData>({ ...INITIAL_LICENSE });
  const [card2, setCard2] = useState<LicenseData>({ ...INITIAL_LICENSE });
  const [activeCard, setActiveCard] = useState<1 | 2>(1);
  const [isDownloading, setIsDownloading] = useState(false);

  const updateCard1 = useCallback((u: Partial<LicenseData>) => setCard1((p) => ({ ...p, ...u })), []);
  const updateCard2 = useCallback((u: Partial<LicenseData>) => setCard2((p) => ({ ...p, ...u })), []);

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

  // Checker flag pattern
  const checkerBg = `repeating-conic-gradient(#e63946 0% 25%, #fff 0% 50%) 0 0 / 20px 20px`;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#f5f5f5",
        fontFamily: "'Noto Sans JP', sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#e63946",
          backgroundImage: checkerBg,
          backgroundBlendMode: "multiply",
          padding: "0 24px",
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 3px 12px rgba(230,57,70,0.4)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <button
          onClick={() => setLocation("/")}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", background: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.4)", borderRadius: "8px",
            color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer",
          }}
        >
          ← HOME
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={LICENSE_LOGO_URL}
            alt="免許メーカー"
            style={{ height: "52px", objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}
          />
        </div>

        <div style={{ width: "80px" }} />
      </header>

      {/* Main */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px 40px" }}>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "24px" }}>
          {[1, 2].map((n) => (
            <button
              key={n}
              onClick={() => setActiveCard(n as 1 | 2)}
              style={{
                padding: "12px 36px",
                borderRadius: "10px",
                border: `2px solid ${activeCard === n ? "#e63946" : "#ddd"}`,
                background: activeCard === n ? "#e63946" : "#fff",
                color: activeCard === n ? "#fff" : "#888",
                fontWeight: 700, fontSize: "15px", cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: activeCard === n ? "0 4px 16px rgba(230,57,70,0.35)" : "none",
              }}
            >
              {n === 1 ? "🚗 1枚目" : "🏎️ 2枚目"}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
          <div>
            <p style={{ textAlign: "center", fontSize: "11px", color: "#999", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px", fontWeight: 600 }}>
              {activeCard === 1 ? "1枚目 プレビュー" : "2枚目 プレビュー"}
            </p>
            <LicenseCardPreview data={activeData} cardNum={activeCard} />
          </div>
        </div>

        {/* Form */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            border: `2px solid ${activeCard === 1 ? "#e63946" : "#e63946"}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid #f0f0f0" }}>
            <span
              style={{
                background: "#e63946", color: "#fff",
                fontWeight: 900, fontSize: "13px",
                padding: "4px 14px", borderRadius: "99px",
              }}
            >
              {activeCard === 1 ? "1枚目" : "2枚目"}
            </span>
            <span style={{ fontSize: "13px", color: "#888" }}>
              {activeCard === 1 ? "1枚目の情報を入力" : "2枚目の情報を入力"}
            </span>
          </div>
          <LicenseForm
            data={activeData}
            onChange={activeUpdate}
            cardNum={activeCard}
          />
        </div>

        {/* Download section */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "6px" }}>
            用紙サイズ（100×148mm）に合わせた2面付き画像を生成します
          </p>
          <p style={{ fontSize: "11px", color: "#aaa", marginBottom: "20px" }}>
            上：1枚目カード　下：2枚目カード
          </p>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              width: "100%",
              padding: "18px",
              background: isDownloading ? "#ccc" : "linear-gradient(135deg, #e63946, #c1121f)",
              color: isDownloading ? "#888" : "#fff",
              fontWeight: 900, fontSize: "16px",
              borderRadius: "12px", border: "none",
              cursor: isDownloading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              boxShadow: isDownloading ? "none" : "0 4px 20px rgba(230,57,70,0.45)",
              transition: "all 0.15s",
              letterSpacing: "0.05em",
            }}
          >
            {isDownloading ? (
              <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> 生成中... しばらくお待ちください</>
            ) : (
              <>🪪 免許証シートをダウンロードする</>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "24px", borderTop: "1px solid #e0e0e0", background: "#fff" }}>
        <p style={{ fontSize: "12px", color: "#aaa" }}>© 2024 Makefrom1 — 免許メーカー</p>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
