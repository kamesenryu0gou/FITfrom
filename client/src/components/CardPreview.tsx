/**
 * CardPreview Component
 * Renders the trading card with layered structure:
 * 
 * Card image analysis (638x1011px):
 * - Upper gray bar: y=101 to y=179 (10.0% to 17.7%) → name area
 * - Element icon: y=179 to y=247 (17.7% to 24.4%) → between bars
 * - White photo area: y=247 to y=752 (24.4% to 74.4%)
 * - Lower area (below photo): y=752 to y=888 (74.4% to 87.8%)
 * - Lower gray bar: y=809 to y=856 (80.0% to 84.7%) → special move & description
 * 
 * X-axis: gray bars span x=58 to x=579 (9.1% to 90.8%)
 * 
 * Layer 1: Base card image (element-specific)
 * Layer 2: User photo clipped to white area
 * Layer 3: Text overlays
 */

import type { CardData, ElementType } from "@/pages/Home";

const CARD_IMAGES: Record<ElementType, string> = {
  火: "/manus-storage/card-fire_a21758fe.png",
  水: "/manus-storage/card-water_41be0131.png",
  草: "/manus-storage/card-grass_a6a91d27.png",
  闇: "/manus-storage/card-dark_6f0fa171.png",
};

const ELEMENT_COLORS: Record<ElementType, { primary: string; glow: string; shadow: string }> = {
  火: { primary: "#ff6633", glow: "rgba(255,102,51,0.7)", shadow: "0 0 30px rgba(255,102,51,0.6), 0 0 60px rgba(255,102,51,0.3)" },
  水: { primary: "#33bbff", glow: "rgba(51,187,255,0.7)", shadow: "0 0 30px rgba(51,187,255,0.6), 0 0 60px rgba(51,187,255,0.3)" },
  草: { primary: "#55dd33", glow: "rgba(85,221,51,0.7)", shadow: "0 0 30px rgba(85,221,51,0.6), 0 0 60px rgba(85,221,51,0.3)" },
  闇: { primary: "#cc55ff", glow: "rgba(204,85,255,0.7)", shadow: "0 0 30px rgba(204,85,255,0.6), 0 0 60px rgba(204,85,255,0.3)" },
};

interface CardPreviewProps {
  cardData: CardData;
}

// Card display dimensions
// Original: 638x1011 → aspect ratio = 1.585
// Display width: 300px → height = 300 * (1011/638) = 475px
const CARD_W = 300;
const CARD_H = Math.round(CARD_W * (1011 / 638)); // = 475

// Precise positions based on pixel analysis
// Upper gray bar: 10.0% to 17.7%
const UPPER_BAR_TOP = CARD_H * 0.100;
const UPPER_BAR_HEIGHT = CARD_H * 0.077; // 17.7% - 10.0%

// White photo area: 24.4% to 74.4%
const PHOTO_TOP = CARD_H * 0.244;
const PHOTO_HEIGHT = CARD_H * 0.500; // 74.4% - 24.4%

// Lower gray bar: 80.0% to 87.8%
const LOWER_BAR_TOP = CARD_H * 0.800;
const LOWER_BAR_HEIGHT = CARD_H * 0.078; // 87.8% - 80.0%

// X margins: 9.1% to 90.8%
const BAR_LEFT = CARD_W * 0.091;
const BAR_WIDTH = CARD_W * 0.817; // 90.8% - 9.1%

// Rarity & Attack row: between upper bar and photo (17.7% to 24.4%)
const RARITY_ROW_TOP = CARD_H * 0.177;
const RARITY_ROW_HEIGHT = CARD_H * 0.067;

export default function CardPreview({ cardData }: CardPreviewProps) {
  const { element, cardName, rarity, photoUrl, specialMove, attack, description, ability } = cardData;
  const colors = ELEMENT_COLORS[element];

  return (
    <div
      id="card-preview"
      className="relative select-none"
      style={{
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        filter: `drop-shadow(0 0 20px ${colors.glow})`,
        flexShrink: 0,
      }}
    >
      {/* Layer 1: Base card image */}
      <img
        src={CARD_IMAGES[element]}
        alt={`${element}属性カード`}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1, objectFit: "fill" }}
        crossOrigin="anonymous"
      />

      {/* Layer 2: User photo clipped to white area */}
      {photoUrl && (
        <div
          className="absolute overflow-hidden"
          style={{
            zIndex: 2,
            top: `${PHOTO_TOP}px`,
            left: `${BAR_LEFT}px`,
            width: `${BAR_WIDTH}px`,
            height: `${PHOTO_HEIGHT}px`,
          }}
        >
          <img
            src={photoUrl}
            alt="キャラクター"
            className="w-full h-full object-cover object-top"
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Layer 3: Text overlays */}

      {/* Card name - upper gray bar */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          zIndex: 3,
          top: `${UPPER_BAR_TOP}px`,
          left: `${BAR_LEFT}px`,
          width: `${BAR_WIDTH}px`,
          height: `${UPPER_BAR_HEIGHT}px`,
          paddingLeft: "8px",
          paddingRight: "8px",
        }}
      >
        {cardName && (
          <span
            className="font-black text-white text-center leading-tight"
            style={{
              fontSize: cardName.length > 6 ? "14px" : cardName.length > 4 ? "16px" : "19px",
              textShadow:
                "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 8px rgba(0,0,0,0.9)",
              letterSpacing: "0.05em",
              fontFamily: "'Noto Sans JP', sans-serif",
              maxWidth: "100%",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {cardName}
          </span>
        )}
      </div>

      {/* Rarity (left) & Attack (right) - between upper bar and photo */}
      <div
        className="absolute flex items-center justify-between"
        style={{
          zIndex: 3,
          top: `${RARITY_ROW_TOP}px`,
          left: `${BAR_LEFT + 4}px`,
          width: `${BAR_WIDTH - 8}px`,
          height: `${RARITY_ROW_HEIGHT}px`,
        }}
      >
        {rarity && (
          <span
            style={{
              fontSize: "14px",
              fontWeight: 900,
              color: "#ffd700",
              textShadow:
                "0 0 8px rgba(255,215,0,0.9), 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
              lineHeight: 1,
            }}
          >
            {rarity}
          </span>
        )}
        {attack !== null && (
          <div
            className="flex items-baseline gap-0.5"
            style={{ marginLeft: "auto" }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 900,
                color: "#ffffff",
                textShadow: "1px 1px 0 #000, -1px -1px 0 #000",
                letterSpacing: "0.05em",
              }}
            >
              ATK
            </span>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 900,
                color: colors.primary,
                textShadow: `0 0 10px ${colors.glow}, 2px 2px 0 #000, -2px -2px 0 #000`,
                lineHeight: 1,
              }}
            >
              {attack}
            </span>
          </div>
        )}
      </div>

      {/* Ability badge - just below photo area */}
      {ability && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            zIndex: 3,
            top: `${PHOTO_TOP + PHOTO_HEIGHT + 4}px`,
            left: `${BAR_LEFT}px`,
            width: `${BAR_WIDTH}px`,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#ffffff",
              background: `linear-gradient(135deg, ${colors.primary}cc, ${colors.primary}88)`,
              border: `1px solid ${colors.primary}`,
              borderRadius: "99px",
              padding: "2px 10px",
              boxShadow: `0 0 10px ${colors.glow}`,
              textShadow: "1px 1px 0 rgba(0,0,0,0.7)",
              whiteSpace: "nowrap",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            {ability}
          </span>
        </div>
      )}

      {/* Lower gray bar - special move & description */}
      <div
        className="absolute flex flex-col justify-center"
        style={{
          zIndex: 3,
          top: `${LOWER_BAR_TOP}px`,
          left: `${BAR_LEFT}px`,
          width: `${BAR_WIDTH}px`,
          height: `${LOWER_BAR_HEIGHT}px`,
          paddingLeft: "8px",
          paddingRight: "8px",
          gap: "2px",
        }}
      >
        {specialMove && (
          <div
            style={{
              fontSize: "12px", // +2: 10→12px
              fontWeight: 900,
              color: colors.primary,
              textShadow: `0 0 6px ${colors.glow}, 1px 1px 0 #000, -1px -1px 0 #000, 0 0 2px #000`,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontFamily: "'Noto Sans JP', sans-serif",
              lineHeight: 1.2,
            }}
          >
            ⚡ 必殺技：{specialMove}
          </div>
        )}
        {description && (
          <p
            style={{
              fontSize: "10px", // +2: 8→10px
              fontWeight: 700, // bold化
              color: "#ffffff",
              textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 0 0 2px #000",
              lineHeight: "1.3",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontFamily: "'Noto Sans JP', sans-serif",
              margin: 0,
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
