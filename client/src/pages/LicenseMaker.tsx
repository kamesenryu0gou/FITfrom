/**
 * LicenseMaker.tsx
 * 子供向け免許証メーカー - Premium Edition
 * - Disney+風プレミアムUI（ダークグラデーション、映画的レイアウト）
 * - カーズ（Wreck-It Ralph Sugar Rush）風AI写真加工
 * - こども免許証台紙デザイン
 * - 2枚フォーム（タブ切り替え）
 * - 写真クロップ機能（5:4比率）
 * - 2面付きダウンロード（100×148mm、上段1枚目・下段2枚目）
 */

import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import { trpc } from "@/lib/trpc";

const LICENSE_LOGO_URL = "/manus-storage/license-maker-logo_d91648c0.png";
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
        background: "#1a1a2e", borderRadius: "20px", overflow: "hidden",
        width: "min(92vw, 500px)", boxShadow: "0 30px 80px rgba(0,0,0,0.8)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#fff" }}>写真を切り取る（5:4）</span>
          <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", fontSize: "16px", color: "#fff", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ position: "relative", width: "100%", height: "320px", background: "#000" }}>
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
        <div style={{ padding: "16px 24px" }}>
          <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "8px" }}>ズーム</label>
          <input
            type="range" min={1} max={3} step={0.05}
            value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#e63946" }}
          />
        </div>
        <div style={{ padding: "0 24px 24px", display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "14px", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "10px", background: "rgba(255,255,255,0.05)", color: "#fff",
              fontWeight: 600, fontSize: "14px", cursor: "pointer",
            }}
          >キャンセル</button>
          <button
            onClick={handleDone}
            style={{
              flex: 2, padding: "14px", border: "none",
              borderRadius: "10px", background: "linear-gradient(135deg, #e63946, #c1121f)", color: "#fff",
              fontWeight: 700, fontSize: "14px", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(230,57,70,0.4)",
            }}
          >この範囲で決定</button>
        </div>
      </div>
    </div>
  );
}

// ── License Card Preview (台紙ベース) ──────────────────────────────────────────
function LicenseCardPreview({ data }: { data: LicenseData }) {
  const displayPhoto = data.aiPhotoUrl || data.photoUrl;

  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "520px",
      margin: "0 auto",
    }}>
      {/* 台紙画像 */}
      <img
        src={LICENSE_CARD_BASE_URL}
        alt="免許証台紙"
        style={{ width: "100%", display: "block", borderRadius: "12px" }}
      />

      {/* 名前フィールド */}
      <div style={{
        position: "absolute",
        top: "7%",
        left: "32%",
        right: "4%",
        height: "9%",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
      }}>
        <span style={{
          fontSize: "clamp(12px, 2.5vw, 18px)",
          fontWeight: 700,
          color: "#1a1a2e",
          fontFamily: "'Noto Sans JP', sans-serif",
        }}>{data.nickname || ""}</span>
      </div>

      {/* 長所フィールド */}
      <div style={{
        position: "absolute",
        top: "22%",
        left: "32%",
        right: "42%",
        height: "7%",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
      }}>
        <span style={{
          fontSize: "clamp(10px, 2vw, 14px)",
          fontWeight: 600,
          color: "#1a1a2e",
          fontFamily: "'Noto Sans JP', sans-serif",
        }}>{data.strength || ""}</span>
      </div>

      {/* 日付フィールド */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "32%",
        right: "42%",
        height: "7%",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
      }}>
        <span style={{
          fontSize: "clamp(10px, 2vw, 13px)",
          fontWeight: 600,
          color: "#1a1a2e",
          fontFamily: "'Noto Sans JP', sans-serif",
        }}>{data.date || ""}</span>
      </div>

      {/* 約束フィールド（優良の下のエリア） */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "4%",
        right: "44%",
        height: "18%",
        display: "flex",
        alignItems: "flex-start",
        padding: "8px",
      }}>
        <span style={{
          fontSize: "clamp(9px, 1.8vw, 13px)",
          fontWeight: 600,
          color: "#1a1a2e",
          fontFamily: "'Noto Sans JP', sans-serif",
          lineHeight: 1.4,
          wordBreak: "break-all",
        }}>{data.promise || ""}</span>
      </div>

      {/* 将来の夢フィールド */}
      <div style={{
        position: "absolute",
        bottom: "11%",
        left: "22%",
        right: "44%",
        height: "7%",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
      }}>
        <span style={{
          fontSize: "clamp(9px, 1.8vw, 13px)",
          fontWeight: 600,
          color: "#1a1a2e",
          fontFamily: "'Noto Sans JP', sans-serif",
        }}>{data.dream || ""}</span>
      </div>

      {/* 発行フィールド */}
      <div style={{
        position: "absolute",
        bottom: "4%",
        left: "22%",
        right: "44%",
        height: "7%",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
      }}>
        <span style={{
          fontSize: "clamp(9px, 1.8vw, 12px)",
          fontWeight: 600,
          color: "#1a1a2e",
          fontFamily: "'Noto Sans JP', sans-serif",
        }}>免許メーカー</span>
      </div>

      {/* 写真エリア（右側の山・空の箇所） */}
      <div style={{
        position: "absolute",
        top: "22%",
        right: "3%",
        width: "38%",
        height: "62%",
        overflow: "hidden",
        borderRadius: "4px",
      }}>
        {displayPhoto ? (
          <img
            src={displayPhoto}
            alt="photo"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(180deg, #87ceeb 0%, #87ceeb 60%, #4caf50 60%, #4caf50 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "32px", opacity: 0.5 }}>👤</span>
          </div>
        )}
      </div>
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

  // 台紙画像を描画
  ctx.drawImage(baseImg, ox, oy, W, H);

  const fontSize = (mm: number) => Math.round(mm * MM / 10);

  ctx.textBaseline = "middle";
  ctx.fillStyle = "#1a1a2e";

  // 名前
  ctx.font = `bold ${fontSize(3.5)}px 'Noto Sans JP', sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(data.nickname || "", ox + W * 0.32, oy + H * 0.115);

  // 長所
  ctx.font = `600 ${fontSize(2.8)}px 'Noto Sans JP', sans-serif`;
  ctx.fillText(data.strength || "", ox + W * 0.32, oy + H * 0.255);

  // 日付
  ctx.font = `600 ${fontSize(2.5)}px 'Noto Sans JP', sans-serif`;
  ctx.fillText(data.date || "", ox + W * 0.32, oy + H * 0.335);

  // 約束（複数行対応）
  ctx.font = `600 ${fontSize(2.5)}px 'Noto Sans JP', sans-serif`;
  const promiseText = data.promise || "";
  const maxW = W * 0.52;
  const lineH = fontSize(2.5) * 1.5;
  let line = "";
  let lineY = oy + H * 0.52;
  for (const char of promiseText) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxW && line !== "") {
      ctx.fillText(line, ox + W * 0.04, lineY);
      line = char;
      lineY += lineH;
      if (lineY > oy + H * 0.68) break;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, ox + W * 0.04, lineY);

  // 将来の夢
  ctx.font = `600 ${fontSize(2.5)}px 'Noto Sans JP', sans-serif`;
  ctx.fillText(data.dream || "", ox + W * 0.22, oy + H * 0.875);

  // 発行
  ctx.font = `600 ${fontSize(2.3)}px 'Noto Sans JP', sans-serif`;
  ctx.fillText("免許メーカー", ox + W * 0.22, oy + H * 0.945);

  // 写真エリア（右側）
  const photoX = ox + W * 0.585;
  const photoY = oy + H * 0.22;
  const photoW = W * 0.38;
  const photoH = H * 0.62;

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
  const convertToCarStyle = trpc.license.convertToCarStyle.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ photoFile: file, aiPhotoUrl: null });
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropDone = (croppedUrl: string) => {
    onChange({ photoUrl: croppedUrl });
    setCropSrc(null);
  };

  const handleAIConvert = async () => {
    if (!data.photoFile && !data.photoUrl) {
      toast.error("先に写真を選択してください");
      return;
    }
    toast.info("AIでイラスト変換中... 少々お待ちください（約20秒）");
    try {
      const src = data.photoUrl || data.photoFile;
      let base64 = "";
      let mimeType = "image/jpeg";
      if (data.photoUrl && data.photoUrl.startsWith("data:")) {
        const parts = data.photoUrl.split(",");
        base64 = parts[1];
        mimeType = parts[0].split(":")[1].split(";")[0];
      } else if (data.photoFile) {
        const ab = await data.photoFile.arrayBuffer();
        const uint8 = new Uint8Array(ab);
        let binary = "";
        for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
        base64 = btoa(binary);
        mimeType = data.photoFile.type || "image/jpeg";
      }
      if (!base64) throw new Error("写真データを読み込めませんでした");
      const result = await convertToCarStyle.mutateAsync({ photoBase64: base64, mimeType });
      onChange({ aiPhotoUrl: result.imageUrl });
      toast.success("AIイラスト変換完了！");
    } catch (err) {
      toast.error(`変換失敗: ${err instanceof Error ? err.message : "不明なエラー"}`);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    fontSize: "14px",
    color: "#fff",
    background: "rgba(255,255,255,0.07)",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    fontFamily: "'Noto Sans JP', sans-serif",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.5)",
    marginBottom: "6px",
    display: "block",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onDone={handleCropDone}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Photo upload */}
      <div>
        <label style={labelStyle}>写真（5:4でトリミング）</label>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{
            width: "80px", height: "64px", borderRadius: "10px",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
            overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {(data.aiPhotoUrl || data.photoUrl)
              ? <img src={data.aiPhotoUrl || data.photoUrl!} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: "24px", opacity: 0.4 }}>👤</span>
            }
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "10px 16px", background: "rgba(255,255,255,0.1)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", fontWeight: 600,
                fontSize: "13px", cursor: "pointer", transition: "background 0.2s",
              }}
            >
              {data.photoUrl ? "写真を変更" : "写真を選択"}
            </button>
            {data.photoUrl && (
              <button
                onClick={handleAIConvert}
                disabled={convertToCarStyle.isPending}
                style={{
                  padding: "10px 16px",
                  background: convertToCarStyle.isPending
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #ff6b35, #f7c59f)",
                  color: convertToCarStyle.isPending ? "rgba(255,255,255,0.3)" : "#1a1a2e",
                  border: "none", borderRadius: "8px", fontWeight: 700,
                  fontSize: "13px", cursor: convertToCarStyle.isPending ? "not-allowed" : "pointer",
                  boxShadow: convertToCarStyle.isPending ? "none" : "0 4px 16px rgba(255,107,53,0.4)",
                  transition: "all 0.2s",
                }}
              >
                {convertToCarStyle.isPending ? "⚙️ 変換中..." : "✨ AIでイラスト変換"}
              </button>
            )}
            {data.aiPhotoUrl && (
              <button
                onClick={() => onChange({ aiPhotoUrl: null })}
                style={{
                  padding: "6px 12px", background: "transparent", color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", fontWeight: 500,
                  fontSize: "11px", cursor: "pointer",
                }}
              >
                元の写真に戻す
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        </div>
      </div>

      {/* Nickname */}
      <div>
        <label style={labelStyle}>名前（ニックネーム）</label>
        <input
          style={inputStyle}
          placeholder="例：たろう"
          value={data.nickname}
          onChange={(e) => onChange({ nickname: e.target.value })}
          onFocus={(e) => { e.target.style.borderColor = "rgba(230,57,70,0.6)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
        />
      </div>

      {/* Strength */}
      <div>
        <label style={labelStyle}>長所・とくいなこと</label>
        <input
          style={inputStyle}
          placeholder="例：やさしいところ"
          value={data.strength}
          onChange={(e) => onChange({ strength: e.target.value })}
          onFocus={(e) => { e.target.style.borderColor = "rgba(230,57,70,0.6)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
        />
      </div>

      {/* Date */}
      <div>
        <label style={labelStyle}>日付（こうふ）</label>
        <input
          style={inputStyle}
          type="date"
          value={data.date}
          onChange={(e) => onChange({ date: e.target.value })}
          onFocus={(e) => { e.target.style.borderColor = "rgba(230,57,70,0.6)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
        />
      </div>

      {/* Promise */}
      <div>
        <label style={labelStyle}>約束</label>
        <input
          style={inputStyle}
          placeholder="例：まいにちはみがきをする"
          value={data.promise}
          onChange={(e) => onChange({ promise: e.target.value })}
          onFocus={(e) => { e.target.style.borderColor = "rgba(230,57,70,0.6)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
        />
      </div>

      {/* Dream */}
      <div>
        <label style={labelStyle}>将来の夢</label>
        <input
          style={inputStyle}
          placeholder="例：サッカーせんしゅ"
          value={data.dream}
          onChange={(e) => onChange({ dream: e.target.value })}
          onFocus={(e) => { e.target.style.borderColor = "rgba(230,57,70,0.6)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
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

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #0d0d1a 0%, #1a0a0a 50%, #0d0d1a 100%)",
        fontFamily: "'Noto Sans JP', sans-serif",
        color: "#fff",
      }}
    >
      {/* Animated background particles */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at 20% 50%, rgba(230,57,70,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,107,53,0.06) 0%, transparent 50%)",
      }} />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(13,13,26,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(230,57,70,0.2)",
        padding: "0 24px",
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <button
          onClick={() => setLocation("/")}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 16px", background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px",
            color: "rgba(255,255,255,0.8)", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        >
          ← HOME
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={LICENSE_LOGO_URL}
            alt="免許メーカー"
            style={{ height: "48px", objectFit: "contain", filter: "drop-shadow(0 2px 12px rgba(230,57,70,0.5))" }}
          />
        </div>

        <div style={{ width: "80px" }} />
      </header>

      {/* Hero section */}
      <div style={{
        textAlign: "center",
        padding: "48px 24px 32px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          display: "inline-block",
          background: "linear-gradient(135deg, rgba(230,57,70,0.15), rgba(255,107,53,0.1))",
          border: "1px solid rgba(230,57,70,0.3)",
          borderRadius: "99px",
          padding: "6px 20px",
          fontSize: "12px",
          fontWeight: 700,
          color: "#ff6b35",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}>
          子供向け免許証メーカー
        </div>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 48px)",
          fontWeight: 900,
          background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: "0 0 12px",
          lineHeight: 1.2,
        }}>
          こどもの免許証を<br />つくろう！
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
          写真をAIでイラスト変換して、オリジナルの免許証を作れます
        </p>
      </div>

      {/* Main content */}
      <main style={{
        maxWidth: "1000px", margin: "0 auto", padding: "0 16px 60px",
        position: "relative", zIndex: 1,
      }}>

        {/* Tab switcher */}
        <div style={{
          display: "flex", gap: "8px", justifyContent: "center", marginBottom: "32px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          padding: "6px",
          maxWidth: "360px",
          margin: "0 auto 32px",
        }}>
          {[1, 2].map((n) => (
            <button
              key={n}
              onClick={() => setActiveCard(n as 1 | 2)}
              style={{
                flex: 1,
                padding: "12px 24px",
                borderRadius: "10px",
                border: "none",
                background: activeCard === n
                  ? "linear-gradient(135deg, #e63946, #c1121f)"
                  : "transparent",
                color: activeCard === n ? "#fff" : "rgba(255,255,255,0.4)",
                fontWeight: 700, fontSize: "14px", cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: activeCard === n ? "0 4px 16px rgba(230,57,70,0.4)" : "none",
              }}
            >
              {n === 1 ? "🚗 1枚目" : "🏎️ 2枚目"}
            </button>
          ))}
        </div>

        {/* Two-column layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
          className="license-grid"
        >
          {/* Left: Preview */}
          <div>
            <p style={{
              textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px", fontWeight: 600,
            }}>
              {activeCard === 1 ? "1枚目 プレビュー" : "2枚目 プレビュー"}
            </p>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "20px",
            }}>
              <LicenseCardPreview data={activeData} />
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "24px",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                marginBottom: "20px", paddingBottom: "16px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}>
                <span style={{
                  background: "linear-gradient(135deg, #e63946, #c1121f)",
                  color: "#fff", fontWeight: 900, fontSize: "12px",
                  padding: "4px 14px", borderRadius: "99px",
                  boxShadow: "0 2px 8px rgba(230,57,70,0.4)",
                }}>
                  {activeCard === 1 ? "1枚目" : "2枚目"}
                </span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                  情報を入力してください
                </span>
              </div>
              <LicenseForm
                data={activeData}
                onChange={activeUpdate}
                cardNum={activeCard}
              />
            </div>
          </div>
        </div>

        {/* Download section */}
        <div style={{
          marginTop: "32px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "28px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>
            用紙サイズ（100×148mm）に合わせた2面付き画像を生成します
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginBottom: "24px" }}>
            上：1枚目カード　下：2枚目カード
          </p>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "18px 32px",
              background: isDownloading
                ? "rgba(255,255,255,0.05)"
                : "linear-gradient(135deg, #e63946, #c1121f)",
              color: isDownloading ? "rgba(255,255,255,0.3)" : "#fff",
              fontWeight: 900, fontSize: "16px",
              borderRadius: "14px", border: "none",
              cursor: isDownloading ? "not-allowed" : "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "10px",
              boxShadow: isDownloading ? "none" : "0 8px 32px rgba(230,57,70,0.5)",
              transition: "all 0.2s",
              letterSpacing: "0.05em",
            }}
          >
            {isDownloading ? (
              <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> 生成中...</>
            ) : (
              <>🪪 免許証シートをダウンロード</>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "24px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.3)",
        position: "relative", zIndex: 1,
      }}>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>© 2024 Makefrom1 — 免許メーカー</p>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .license-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
