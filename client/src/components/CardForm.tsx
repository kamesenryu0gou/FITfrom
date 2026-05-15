/**
 * CardForm Component
 * Input form for creating FIT WARS trading cards
 * Design: Dark panels with subtle borders, element-colored accents
 * Features: element selection, card name, rarity generator, photo upload,
 *           special move, attack generator, description, ability selection,
 *           AI anime conversion, and download functionality
 *
 * Download: Uses Canvas API directly to avoid html2canvas oklch issues.
 *           Draws card image + photo + text layers onto a canvas and exports as PNG.
 */

import { useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import type { CardData, ElementType } from "@/pages/Home";
import { downloadCard } from "@/lib/cardCanvas";

// ── Crop helpers ──────────────────────────────────────────────────────────────
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
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return canvas.toDataURL("image/jpeg", 0.95);
}

// ── Crop Modal ────────────────────────────────────────────────────────────────
function CropModal({ imageSrc, onDone, onCancel }: { imageSrc: string; onDone: (url: string) => void; onCancel: () => void; }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => { setCroppedAreaPixels(pixels); }, []);
  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    const url = await getCroppedImg(imageSrc, croppedAreaPixels);
    onDone(url);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0a0a1a", borderRadius: "20px", overflow: "hidden", width: "min(92vw, 500px)", boxShadow: "0 30px 80px rgba(0,0,0,0.8)", border: "3px solid #6a20cc" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a3a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#fff", fontFamily: "'Noto Sans JP', sans-serif" }}>✂️ 写真を切り取る（3:4）</span>
          <button onClick={onCancel} style={{ background: "rgba(106,32,204,0.3)", border: "2px solid #6a20cc", cursor: "pointer", fontSize: "16px", color: "#fff", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ position: "relative", width: "100%", height: "320px", background: "#000" }}>
          <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={3 / 4} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
        </div>
        <div style={{ padding: "16px 20px" }}>
          <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "8px" }}>ズーム</label>
          <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: "100%", accentColor: "#6a20cc" }} />
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", gap: "12px" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "13px", border: "1px solid #2a2a3a", borderRadius: "10px", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif" }}>キャンセル</button>
          <button onClick={handleDone} style={{ flex: 2, padding: "13px", border: "none", borderRadius: "10px", background: "linear-gradient(135deg, #6a20cc, #9b44ee)", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 12px rgba(106,32,204,0.5)", fontFamily: "'Noto Sans JP', sans-serif" }}>この範囲で決定</button>
        </div>
      </div>
    </div>
  );
}

const ABILITIES = [
  { value: "BOOST", label: "BOOST：同属性+20" },
  { value: "CURSE", label: "CURSE：相手攻撃力-10" },
  { value: "BREAK", label: "BREAK：属性効果無効" },
  { value: "VOID", label: "VOID：引き分け" },
  { value: "LOCK", label: "LOCK：特殊効果無効" },
];

const ELEMENT_OPTIONS: { value: ElementType; label: string; color: string; bg: string }[] = [
  { value: "火", label: "🔥 火", color: "#ff6633", bg: "rgba(255,102,51,0.12)" },
  { value: "水", label: "💧 水", color: "#33bbff", bg: "rgba(51,187,255,0.12)" },
  { value: "草", label: "🌿 草", color: "#55dd33", bg: "rgba(85,221,51,0.12)" },
  { value: "闇", label: "🌙 闇", color: "#cc55ff", bg: "rgba(204,85,255,0.12)" },
];

const CARD_IMAGES: Record<ElementType, string> = {
  火: "/manus-storage/card-fire_a21758fe.png",
  水: "/manus-storage/card-water_41be0131.png",
  草: "/manus-storage/card-grass_a6a91d27.png",
  闇: "/manus-storage/card-dark_6f0fa171.png",
};

const ELEMENT_COLORS: Record<ElementType, string> = {
  火: "#ff6633",
  水: "#33bbff",
  草: "#55dd33",
  闇: "#cc55ff",
};

const SECTION_STYLE = {
  background: "#111118",
  border: "1px solid #1e1e2e",
  borderRadius: "12px",
  padding: "16px",
};

const LABEL_STYLE = {
  color: "#9a9aaa",
  fontSize: "12px",
  fontWeight: 600,
  display: "block",
  marginBottom: "6px",
};

const INPUT_STYLE = {
  width: "100%",
  background: "#0a0a0f",
  border: "1px solid #2a2a3a",
  borderRadius: "8px",
  padding: "10px 12px",
  color: "#ffffff",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "'Noto Sans JP', sans-serif",
};

const SECTION_TITLE_STYLE = {
  color: "#7a7a8a",
  fontSize: "11px",
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  fontWeight: 600,
  borderBottom: "1px solid #1e1e2e",
  paddingBottom: "8px",
  marginBottom: "14px",
};

interface CardFormProps {
  cardData: CardData;
  updateCardData: (updates: Partial<CardData>) => void;
  onAIAnime: () => void;
  isGeneratingAI: boolean;
  queueWaiting?: number;
  cardPreviewRef?: React.RefObject<HTMLDivElement | null>;
  hideDownload?: boolean;
}

// Load an image from URL and return HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Draw text with outline (stroke) for readability
function drawTextWithOutline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillColor: string,
  strokeColor: string,
  strokeWidth: number
) {
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}

export default function CardForm({
  cardData,
  updateCardData,
  onAIAnime,
  isGeneratingAI,
  queueWaiting = 0,
  cardPreviewRef,
  hideDownload = false,
}: CardFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalSrc, setCropModalSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handlePhotoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("画像ファイルを選択してください");
        return;
      }
      const url = URL.createObjectURL(file);
      setPendingFile(file);
      setCropModalSrc(url);
      // reset input so same file can be re-selected
      e.target.value = "";
    },
    []
  );

  const handleCropDone = useCallback((croppedUrl: string) => {
    updateCardData({ photoUrl: croppedUrl, photoFile: pendingFile });
    setCropModalSrc(null);
    setPendingFile(null);
    toast.success("写真をトリミングしました！");
  }, [updateCardData, pendingFile]);

  const handleCropCancel = useCallback(() => {
    setCropModalSrc(null);
    setPendingFile(null);
  }, []);

  const generateRarity = useCallback(() => {
    const rarities = ["★", "★★", "★★★"];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    updateCardData({ rarity });
    toast.success(`レアリティ: ${rarity}`);
  }, [updateCardData]);

  const generateAttack = useCallback(() => {
    const attack = Math.floor(Math.random() * 80) + 20;
    updateCardData({ attack });
    toast.success(`攻撃力: ${attack} が決定しました！`);
  }, [updateCardData]);

  // Download using cardCanvas utility (pixel-perfect match with preview, Web Share API for mobile)
  const handleDownload = useCallback(async () => {
    toast.info("カードを生成中...");
    try {
      await downloadCard(cardData);
      toast.success("カードを保存しました！");
    } catch (error) {
      console.error("Download error:", error);
      const msg = error instanceof Error ? error.message : "不明なエラー";
      toast.error(`保存に失敗しました: ${msg}`);
    }
  }, [cardData]);

  const selectedElement = ELEMENT_OPTIONS.find((e) => e.value === cardData.element)!;

  return (
    <>
      {cropModalSrc && (
        <CropModal imageSrc={cropModalSrc} onDone={handleCropDone} onCancel={handleCropCancel} />
      )}
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Section: 基本情報 */}
      <div style={SECTION_STYLE}>
        <p style={SECTION_TITLE_STYLE}>基本情報</p>

        {/* Element Selection */}
        <div style={{ marginBottom: "14px" }}>
          <label style={LABEL_STYLE}>属性</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
            {ELEMENT_OPTIONS.map((opt) => {
              const isSelected = cardData.element === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => updateCardData({ element: opt.value })}
                  style={{
                    padding: "10px 4px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                    border: `2px solid ${isSelected ? opt.color : "#2a2a3a"}`,
                    background: isSelected ? opt.bg : "transparent",
                    color: isSelected ? opt.color : "#6a6a7a",
                    transform: isSelected ? "scale(1.04)" : "scale(1)",
                    boxShadow: isSelected ? `0 0 14px ${opt.color}44` : "none",
                    transition: "all 0.15s ease",
                    cursor: "pointer",
                    fontFamily: "'Noto Sans JP', sans-serif",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Name */}
        <div style={{ marginBottom: "14px" }}>
          <label style={LABEL_STYLE}>
            カード名{" "}
            <span style={{ color: "#5a5a6a", fontWeight: 400 }}>（最大8文字）</span>
          </label>
          <input
            type="text"
            value={cardData.cardName}
            onChange={(e) => updateCardData({ cardName: e.target.value.slice(0, 8) })}
            maxLength={8}
            placeholder="例：マッスルキング"
            style={INPUT_STYLE}
          />
          <div style={{ textAlign: "right", color: "#4a4a5a", fontSize: "11px", marginTop: "4px" }}>
            {cardData.cardName.length}/8
          </div>
        </div>

        {/* Rarity */}
        <div>
          <label style={LABEL_STYLE}>レアリティ</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div
              style={{
                flex: 1,
                background: "#0a0a0f",
                border: "1px solid #2a2a3a",
                borderRadius: "8px",
                padding: "10px 12px",
                minHeight: "42px",
                display: "flex",
                alignItems: "center",
                color: cardData.rarity ? "#ffd700" : "#4a4a5a",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              {cardData.rarity || "未設定"}
            </div>
            <button
              onClick={generateRarity}
              style={{
                padding: "10px 18px",
                background: "linear-gradient(135deg, #d4a017, #f0c040)",
                color: "#1a1000",
                fontWeight: 800,
                fontSize: "14px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "'Noto Sans JP', sans-serif",
                boxShadow: "0 2px 8px rgba(212,160,23,0.4)",
              }}
            >
              生成
            </button>
          </div>
        </div>
      </div>

      {/* Section: キャラクター写真 */}
      <div style={SECTION_STYLE}>
        <p style={SECTION_TITLE_STYLE}>キャラクター写真</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: "none" }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "100%",
            padding: "14px",
            border: "2px dashed #2a2a3a",
            borderRadius: "10px",
            background: "transparent",
            color: "#7a7a8a",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "10px",
            transition: "all 0.15s ease",
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#4a4a5a";
            e.currentTarget.style.color = "#aaaaaa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#2a2a3a";
            e.currentTarget.style.color = "#7a7a8a";
          }}
        >
          <span style={{ fontSize: "20px" }}>📷</span>
          {cardData.photoUrl ? "写真を変更する" : "写真を選択する"}
        </button>

        {cardData.photoUrl && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
              padding: "8px",
              background: "#0a0a0f",
              borderRadius: "8px",
              border: "1px solid #2a2a3a",
            }}
          >
            <img
              src={cardData.photoUrl}
              alt="preview"
              style={{
                width: "48px",
                height: "48px",
                objectFit: "cover",
                borderRadius: "6px",
                border: "1px solid #2a2a3a",
              }}
            />
            <span style={{ color: "#7a7a8a", fontSize: "12px" }}>
              写真がアップロードされました ✓
            </span>
          </div>
        )}

        {/* AI Anime Button */}
        <button
          onClick={onAIAnime}
          disabled={isGeneratingAI || !cardData.photoFile}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "10px",
            border: "none",
            fontWeight: 700,
            fontSize: "14px",
            cursor: isGeneratingAI || !cardData.photoFile ? "not-allowed" : "pointer",
            background:
              isGeneratingAI || !cardData.photoFile
                ? "#1e1e2e"
                : "linear-gradient(135deg, #6a20cc, #9b44ee)",
            color: isGeneratingAI || !cardData.photoFile ? "#4a4a5a" : "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.15s ease",
            boxShadow:
              isGeneratingAI || !cardData.photoFile
                ? "none"
                : "0 2px 12px rgba(106,32,204,0.4)",
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          {isGeneratingAI ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>
                ⚙️
              </span>
              {queueWaiting > 0
                ? `AI加工待機中... あなたの前に${queueWaiting}人待ちです`
                : "DQ風チビキャラ変換中... しばらくお待ちください"}
            </>
          ) : (
            <>
              <span>✨</span>
              写真をDQ風チビキャラに変換（AI変換）
            </>
          )}
        </button>

        {!cardData.photoFile && (
          <p style={{ color: "#4a4a5a", fontSize: "11px", textAlign: "center", marginTop: "6px" }}>
            ※ 写真をアップロードするとAI変換が使えます
          </p>
        )}
      </div>

      {/* Section: 戦闘情報 */}
      <div style={SECTION_STYLE}>
        <p style={SECTION_TITLE_STYLE}>戦闘情報</p>

        {/* Special Move */}
        <div style={{ marginBottom: "14px" }}>
          <label style={LABEL_STYLE}>
            必殺技{" "}
            <span style={{ color: "#5a5a6a", fontWeight: 400 }}>（全角8文字以内）</span>
          </label>
          <input
            type="text"
            value={cardData.specialMove}
            onChange={(e) => updateCardData({ specialMove: e.target.value.slice(0, 8) })}
            maxLength={8}
            placeholder="例：炎の拳"
            style={INPUT_STYLE}
          />
          <div style={{ textAlign: "right", color: "#4a4a5a", fontSize: "11px", marginTop: "4px" }}>
            {cardData.specialMove.length}/8
          </div>
        </div>

        {/* Attack */}
        <div style={{ marginBottom: "14px" }}>
          <label style={LABEL_STYLE}>攻撃力</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div
              style={{
                flex: 1,
                background: "#0a0a0f",
                border: "1px solid #2a2a3a",
                borderRadius: "8px",
                padding: "10px 12px",
                minHeight: "42px",
                display: "flex",
                alignItems: "center",
                color: cardData.attack !== null ? selectedElement.color : "#4a4a5a",
                fontSize: cardData.attack !== null ? "22px" : "14px",
                fontWeight: 900,
                textShadow:
                  cardData.attack !== null ? `0 0 10px ${selectedElement.color}88` : "none",
              }}
            >
              {cardData.attack !== null ? cardData.attack : "未設定"}
            </div>
            <button
              onClick={generateAttack}
              style={{
                padding: "10px 18px",
                background: "linear-gradient(135deg, #cc2200, #ff4422)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "14px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "'Noto Sans JP', sans-serif",
                boxShadow: "0 2px 8px rgba(204,34,0,0.4)",
              }}
            >
              生成
            </button>
          </div>
        </div>

        {/* Ability */}
        <div>
          <label style={LABEL_STYLE}>アビリティ</label>
          <select
            value={cardData.ability}
            onChange={(e) => updateCardData({ ability: e.target.value })}
            style={{
              ...INPUT_STYLE,
              appearance: "none",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236a6a7a' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: "36px",
            }}
          >
            <option value="">アビリティを選択...</option>
            {ABILITIES.map((ability) => (
              <option key={ability.value} value={ability.value}>
                {ability.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section: 紹介文 */}
      <div style={SECTION_STYLE}>
        <p style={SECTION_TITLE_STYLE}>紹介文</p>
        <textarea
          value={cardData.description}
          onChange={(e) => updateCardData({ description: e.target.value.slice(0, 30) })}
          maxLength={30}
          placeholder="例：最強の戦士として現れた..."
          rows={2}
          style={{
            ...INPUT_STYLE,
            resize: "none",
            lineHeight: "1.5",
          }}
        />
        <div style={{ textAlign: "right", color: "#4a4a5a", fontSize: "11px", marginTop: "4px" }}>
          {cardData.description.length}/30
        </div>
      </div>

      {/* Download Button - hideDownload=trueの場合は非表示 */}
      {!hideDownload && <button
        onClick={handleDownload}
        style={{
          width: "100%",
          padding: "16px",
          background: "linear-gradient(135deg, #5ab520, #7adb3a)",
          color: "#0a1500",
          fontWeight: 900,
          fontSize: "16px",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: "0 4px 20px rgba(122,219,58,0.45)",
          transition: "all 0.15s ease",
          fontFamily: "'Noto Sans JP', sans-serif",
          letterSpacing: "0.05em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.02)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(122,219,58,0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(122,219,58,0.45)";
        }}
      >
        📥 ダウンロードする
      </button>}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder, textarea::placeholder {
          color: #4a4a5a;
        }
        input:focus, textarea:focus, select:focus {
          border-color: #4a4a6a !important;
        }
        select option {
          background: #111118;
          color: #ffffff;
        }
      `}</style>
    </div>
    </>
  );
}
