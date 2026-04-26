/**
 * FIT WARS Card Maker - Main Page
 * Design Philosophy: Trading Card Game aesthetic
 * - Dark background (#0a0a0f) with vivid element-specific accent colors
 * - Bold, impactful typography (Noto Sans JP for Japanese text)
 * - Mobile-first: card preview on top, form below
 * - Desktop: side-by-side layout with sticky card preview
 */

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import CardPreview from "@/components/CardPreview";
import CardForm from "@/components/CardForm";
import { trpc } from "@/lib/trpc";

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

  const convertToAnimeMutation = trpc.card.convertToAnime.useMutation();

  const updateCardData = useCallback((updates: Partial<CardData>) => {
    setCardData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Convert File to base64 string
  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // result is "data:image/jpeg;base64,XXXXX"
        const [header, base64] = result.split(",");
        const mimeType = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
        resolve({ base64, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAIAnime = useCallback(async () => {
    if (!cardData.photoFile) {
      toast.error("写真をアップロードしてください");
      return;
    }

    setIsGeneratingAI(true);
    toast.info("AIが90sレトロアニメ風に変換中... 30秒ほどお待ちください");

    try {
      const { base64, mimeType } = await fileToBase64(cardData.photoFile);

      const result = await convertToAnimeMutation.mutateAsync({
        photoBase64: base64,
        mimeType,
        element: cardData.element,
      });

      if (result.imageUrl) {
        updateCardData({ photoUrl: result.imageUrl });
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
  }, [cardData.photoFile, cardData.element, updateCardData, convertToAnimeMutation]);

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
