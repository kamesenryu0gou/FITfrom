/**
 * FIT WARS Card Maker - Create Page
 * 2カード作成対応版
 * - 1枚目・2枚目それぞれ独立したフォームとプレビュー
 * - 個別プレビュー切り替えタブ
 * - 用紙サイズ（100×148.5mm、2面付）に合わせた1枚のPNG出力
 * - ダウンロードボタンは最下部に1つのみ
 */

import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import CardPreview from "@/components/CardPreview";
import CardForm from "@/components/CardForm";
import { trpc } from "@/lib/trpc";
import { downloadDualCard } from "@/lib/cardCanvas";

export type ElementType = "火" | "水" | "草" | "闇";

export interface CardData {
  element: ElementType;
  cardName: string;
  rarity: string;
  photoUrl: string | null;
  photoFile: File | null;
  specialMove: string;
  attack: number | null;
  description: string;
  ability: string;
}

const INITIAL_CARD_DATA: CardData = {
  element: "火",
  cardName: "",
  rarity: "",
  photoUrl: null,
  photoFile: null,
  specialMove: "",
  attack: null,
  description: "",
  ability: "",
};

export default function Home() {
  const [, navigate] = useLocation();
  const [card1, setCard1] = useState<CardData>({ ...INITIAL_CARD_DATA });
  const [card2, setCard2] = useState<CardData>({ ...INITIAL_CARD_DATA, element: "水" });
  const [activeCard, setActiveCard] = useState<1 | 2>(1);
  const [isGeneratingAI1, setIsGeneratingAI1] = useState(false);
  const [isGeneratingAI2, setIsGeneratingAI2] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const convertToAnimeMutation = trpc.card.convertToAnime.useMutation();

  const updateCard1 = useCallback((updates: Partial<CardData>) => {
    setCard1((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateCard2 = useCallback((updates: Partial<CardData>) => {
    setCard2((prev) => ({ ...prev, ...updates }));
  }, []);

  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [header, base64] = result.split(",");
        const mimeType = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
        resolve({ base64, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAIAnime1 = useCallback(async () => {
    if (!card1.photoFile) {
      toast.error("1枚目の写真をアップロードしてください");
      return;
    }
    setIsGeneratingAI1(true);
    toast.info("1枚目：AIがDQ風チビキャラに変換中... 30～60秒ほどお待ちください");
    try {
      const { base64, mimeType } = await fileToBase64(card1.photoFile);
      const result = await convertToAnimeMutation.mutateAsync({
        photoBase64: base64,
        mimeType,
        element: card1.element,
      });
      if (result.imageUrl) {
        updateCard1({ photoUrl: result.imageUrl });
        toast.success("1枚目のアニメ風変換が完了しました！");
      } else {
        throw new Error("画像URLが取得できませんでした");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "不明なエラー";
      toast.error(`1枚目の変換に失敗しました: ${msg}`);
    } finally {
      setIsGeneratingAI1(false);
    }
  }, [card1.photoFile, card1.element, updateCard1, convertToAnimeMutation]);

  const handleAIAnime2 = useCallback(async () => {
    if (!card2.photoFile) {
      toast.error("2枚目の写真をアップロードしてください");
      return;
    }
    setIsGeneratingAI2(true);
    toast.info("2枚目：AIがDQ風チビキャラに変換中... 30～60秒ほどお待ちください");
    try {
      const { base64, mimeType } = await fileToBase64(card2.photoFile);
      const result = await convertToAnimeMutation.mutateAsync({
        photoBase64: base64,
        mimeType,
        element: card2.element,
      });
      if (result.imageUrl) {
        updateCard2({ photoUrl: result.imageUrl });
        toast.success("2枚目のアニメ風変換が完了しました！");
      } else {
        throw new Error("画像URLが取得できませんでした");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "不明なエラー";
      toast.error(`2枚目の変換に失敗しました: ${msg}`);
    } finally {
      setIsGeneratingAI2(false);
    }
  }, [card2.photoFile, card2.element, updateCard2, convertToAnimeMutation]);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    toast.info("用紙サイズに合わせた画像を生成中...");
    try {
      await downloadDualCard(card1, card2);
      toast.success("カードシートを保存しました！");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "不明なエラー";
      toast.error(`保存に失敗しました: ${msg}`);
    } finally {
      setIsDownloading(false);
    }
  }, [card1, card2]);

  const activeCardData = activeCard === 1 ? card1 : card2;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <header
        className="w-full py-4 px-4"
        style={{
          background: "linear-gradient(180deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%)",
          borderBottom: "1px solid #1e1e2e",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* HOME へ戻るボタン */}
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background: "transparent",
              border: "1px solid #2a2a3a",
              borderRadius: "8px",
              color: "#9a9aaa",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#5ab520";
              e.currentTarget.style.color = "#5ab520";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2a2a3a";
              e.currentTarget.style.color = "#9a9aaa";
            }}
          >
            ← HOME
          </button>

          {/* Logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img
              src="/manus-storage/fitwars-logo_890a85a0.png"
              alt="FIT WARS"
              style={{ height: "48px", objectFit: "contain" }}
            />
            <p
              style={{
                color: "#7a7a8a",
                fontSize: "10px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginTop: "2px",
                fontWeight: 500,
              }}
            >
              Card Maker
            </p>
          </div>

          {/* Spacer */}
          <div style={{ width: "80px" }} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-10">

        {/* Preview Tab Switcher */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {[1, 2].map((n) => (
            <button
              key={n}
              onClick={() => setActiveCard(n as 1 | 2)}
              style={{
                padding: "10px 32px",
                borderRadius: "10px",
                border: `2px solid ${activeCard === n ? "#5ab520" : "#2a2a3a"}`,
                background: activeCard === n ? "rgba(90,181,32,0.12)" : "transparent",
                color: activeCard === n ? "#7adb3a" : "#6a6a7a",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "'Noto Sans JP', sans-serif",
                boxShadow: activeCard === n ? "0 0 12px rgba(90,181,32,0.3)" : "none",
              }}
            >
              {n === 1 ? "＜1枚目＞" : "＜2枚目＞"}
            </button>
          ))}
        </div>

        {/* Card Preview (active card only) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <p
              style={{
                color: "#7a7a8a",
                fontSize: "11px",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                textAlign: "center",
                marginBottom: "12px",
                fontWeight: 500,
              }}
            >
              {activeCard === 1 ? "1枚目 プレビュー" : "2枚目 プレビュー"}
            </p>
            <CardPreview cardData={activeCardData} />
          </div>
        </div>

        {/* 1枚目フォーム */}
        <div
          style={{
            marginBottom: "24px",
            border: `2px solid ${activeCard === 1 ? "#5ab520" : "#1e1e2e"}`,
            borderRadius: "16px",
            padding: "20px",
            background: "#0d0d14",
            transition: "border-color 0.2s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "1px solid #1e1e2e",
            }}
          >
            <span
              style={{
                background: "linear-gradient(135deg, #5ab520, #7adb3a)",
                color: "#0a1500",
                fontWeight: 900,
                fontSize: "13px",
                padding: "4px 14px",
                borderRadius: "99px",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              1枚目
            </span>
            <button
              onClick={() => setActiveCard(1)}
              style={{
                marginLeft: "auto",
                padding: "4px 12px",
                background: activeCard === 1 ? "rgba(90,181,32,0.15)" : "transparent",
                border: `1px solid ${activeCard === 1 ? "#5ab520" : "#2a2a3a"}`,
                borderRadius: "6px",
                color: activeCard === 1 ? "#7adb3a" : "#6a6a7a",
                fontSize: "11px",
                cursor: "pointer",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              {activeCard === 1 ? "プレビュー表示中" : "プレビューを見る"}
            </button>
          </div>
          <CardForm
            cardData={card1}
            updateCardData={updateCard1}
            onAIAnime={handleAIAnime1}
            isGeneratingAI={isGeneratingAI1}
            hideDownload
          />
        </div>

        {/* 2枚目フォーム */}
        <div
          style={{
            marginBottom: "24px",
            border: `2px solid ${activeCard === 2 ? "#33bbff" : "#1e1e2e"}`,
            borderRadius: "16px",
            padding: "20px",
            background: "#0d0d14",
            transition: "border-color 0.2s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
              paddingBottom: "12px",
              borderBottom: "1px solid #1e1e2e",
            }}
          >
            <span
              style={{
                background: "linear-gradient(135deg, #1a88cc, #33bbff)",
                color: "#001520",
                fontWeight: 900,
                fontSize: "13px",
                padding: "4px 14px",
                borderRadius: "99px",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              2枚目
            </span>
            <button
              onClick={() => setActiveCard(2)}
              style={{
                marginLeft: "auto",
                padding: "4px 12px",
                background: activeCard === 2 ? "rgba(51,187,255,0.15)" : "transparent",
                border: `1px solid ${activeCard === 2 ? "#33bbff" : "#2a2a3a"}`,
                borderRadius: "6px",
                color: activeCard === 2 ? "#33bbff" : "#6a6a7a",
                fontSize: "11px",
                cursor: "pointer",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              {activeCard === 2 ? "プレビュー表示中" : "プレビューを見る"}
            </button>
          </div>
          <CardForm
            cardData={card2}
            updateCardData={updateCard2}
            onAIAnime={handleAIAnime2}
            isGeneratingAI={isGeneratingAI2}
            hideDownload
          />
        </div>

        {/* Download Button - 最下部に1つのみ */}
        <div
          style={{
            background: "#111118",
            border: "1px solid #2a2a3a",
            borderRadius: "16px",
            padding: "20px",
          }}
        >
          <p
            style={{
              color: "#7a7a8a",
              fontSize: "12px",
              textAlign: "center",
              marginBottom: "12px",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            用紙サイズ（100×148.5mm）に合わせた2面付き画像を生成します
            <br />
            <span style={{ color: "#5a5a6a", fontSize: "11px" }}>
              上：1枚目カード　下：2枚目カード
            </span>
          </p>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              width: "100%",
              padding: "18px",
              background: isDownloading
                ? "#1e1e2e"
                : "linear-gradient(135deg, #5ab520, #7adb3a)",
              color: isDownloading ? "#4a4a5a" : "#0a1500",
              fontWeight: 900,
              fontSize: "16px",
              borderRadius: "12px",
              border: "none",
              cursor: isDownloading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: isDownloading ? "none" : "0 4px 20px rgba(122,219,58,0.45)",
              transition: "all 0.15s ease",
              fontFamily: "'Noto Sans JP', sans-serif",
              letterSpacing: "0.05em",
            }}
            onMouseEnter={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = "0 6px 28px rgba(122,219,58,0.6)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = isDownloading
                ? "none"
                : "0 4px 20px rgba(122,219,58,0.45)";
            }}
          >
            {isDownloading ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>
                  ⚙️
                </span>
                生成中... しばらくお待ちください
              </>
            ) : (
              <>
                📥 カードシートをダウンロードする
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-6"
        style={{
          borderTop: "1px solid #1e1e2e",
          color: "#4a4a5a",
          fontSize: "12px",
        }}
      >
        FIT WARS Card Maker &copy; 2025
      </footer>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
