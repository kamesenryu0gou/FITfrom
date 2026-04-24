/**
 * FIT WARS Card Maker - Main Page
 * Design Philosophy: Trading Card Game aesthetic
 * - Dark background (#0a0a0f) with vivid element-specific accent colors
 * - Bold, impactful typography (Noto Sans JP for Japanese text)
 * - Mobile-first: card preview on top, form below
 * - Desktop: side-by-side layout with sticky card preview
 * - Signature elements: glowing card borders, dark panels with subtle borders
 */

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import CardPreview from "@/components/CardPreview";
import CardForm from "@/components/CardForm";

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
  const [cardData, setCardData] = useState<CardData>(INITIAL_CARD_DATA);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const cardPreviewRef = useRef<HTMLDivElement>(null);

  const updateCardData = useCallback((updates: Partial<CardData>) => {
    setCardData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleAIAnime = useCallback(async () => {
    if (!cardData.photoFile) {
      toast.error("写真をアップロードしてください");
      return;
    }

    const apiKey = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
    const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL;

    if (!apiKey || !apiUrl) {
      toast.error("APIキーが設定されていません");
      return;
    }

    setIsGeneratingAI(true);
    toast.info("AIがアニメ風に変換中です... しばらくお待ちください");

    try {
      const elementDescriptions: Record<ElementType, string> = {
        火: "fire element warrior, flames, volcanic power, intense red and orange colors",
        水: "water element warrior, ocean waves, ice crystals, cool blue and cyan colors",
        草: "grass element warrior, nature magic, forest vines, vibrant green colors",
        闇: "dark element warrior, shadows, mystical moon energy, deep purple and black colors",
      };

      const prompt = `Create an anime-style trading card character illustration.
      Style: Japanese anime art, vibrant colors, dynamic heroic pose, expressive face.
      Theme: ${elementDescriptions[cardData.element]} themed fighter character.
      The character should look powerful and ready for battle, suitable for a trading card game.
      Full body or upper body shot on a clean white or transparent background.
      High quality anime illustration with bold outlines and vivid colors.`;

      const response = await fetch(`${apiUrl}/v1/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

      if (imageUrl) {
        updateCardData({ photoUrl: imageUrl });
        toast.success("アニメ風変換が完了しました！");
      } else {
        throw new Error("画像URLが取得できませんでした");
      }
    } catch (error) {
      console.error("AI anime conversion error:", error);
      const msg = error instanceof Error ? error.message : "不明なエラー";
      toast.error(`変換に失敗しました: ${msg}`);
    } finally {
      setIsGeneratingAI(false);
    }
  }, [cardData.photoFile, cardData.element, updateCardData]);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      {/* Header */}
      <header
        className="w-full py-5 px-4"
        style={{
          background: "linear-gradient(180deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%)",
          borderBottom: "1px solid #1e1e2e",
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <img
            src="/manus-storage/fitwars-logo_890a85a0.png"
            alt="FIT WARS"
            style={{ height: "72px", objectFit: "contain" }}
          />
          <p
            style={{
              color: "#7a7a8a",
              fontSize: "11px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginTop: "6px",
              fontWeight: 500,
            }}
          >
            Card Maker
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-20">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-10 lg:justify-center">
          {/* Card Preview - top on mobile */}
          <div
            className="lg:sticky lg:top-6"
            style={{ flexShrink: 0 }}
          >
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
              カードプレビュー
            </p>
            <div ref={cardPreviewRef}>
              <CardPreview cardData={cardData} />
            </div>
          </div>

          {/* Form */}
          <div style={{ width: "100%", maxWidth: "520px" }}>
            <CardForm
              cardData={cardData}
              updateCardData={updateCardData}
              onAIAnime={handleAIAnime}
              isGeneratingAI={isGeneratingAI}
              cardPreviewRef={cardPreviewRef}
            />
          </div>
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
    </div>
  );
}
