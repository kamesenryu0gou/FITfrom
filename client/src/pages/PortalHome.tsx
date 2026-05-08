/**
 * PortalHome.tsx
 * Portal navigation hub — clean corporate style (makefrom1.com inspired)
 * Two menu tiles: FIT WARS and 免許メーカー
 */

import { useLocation } from "wouter";

const FITWARS_LOGO_URL = "/manus-storage/logo_685ee78c.png";
const LICENSE_LOGO_URL = "/manus-storage/license-maker-logo_d91648c0.png";

export default function PortalHome() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f0f2f5 100%)",
        fontFamily: "'Noto Sans JP', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e0e0e0",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #1a1a2e, #16213e)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#ccff00", fontWeight: 900, fontSize: "14px" }}>M</span>
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: "16px",
              color: "#1a1a2e",
              letterSpacing: "0.02em",
            }}
          >
            Makefrom1
          </span>
        </div>
        <nav style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setLocation("/fitwars")}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: "1px solid #ddd",
              borderRadius: "6px",
              color: "#555",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#1a1a2e";
              e.currentTarget.style.color = "#1a1a2e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#ddd";
              e.currentTarget.style.color = "#555";
            }}
          >
            FIT WARS
          </button>
          <button
            onClick={() => setLocation("/license")}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: "1px solid #ddd",
              borderRadius: "6px",
              color: "#555",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#e63946";
              e.currentTarget.style.color = "#e63946";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#ddd";
              e.currentTarget.style.color = "#555";
            }}
          >
            免許メーカー
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section
        style={{
          padding: "80px 24px 60px",
          textAlign: "center",
          maxWidth: "800px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#999",
            marginBottom: "16px",
          }}
        >
          Event Content Platform
        </p>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 900,
            color: "#1a1a2e",
            lineHeight: 1.2,
            marginBottom: "20px",
            letterSpacing: "-0.01em",
          }}
        >
          オリジナルカードを作って、
          <br />
          その場で遊べる。
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#666",
            lineHeight: 1.8,
            maxWidth: "520px",
            margin: "0 auto",
          }}
        >
          イベントをもっと楽しく、もっと特別に。
          <br />
          あなただけのオリジナルコンテンツを作成しよう。
        </p>
      </section>

      {/* Menu Tiles */}
      <section
        style={{
          padding: "0 24px 80px",
          maxWidth: "900px",
          margin: "0 auto",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        {/* FIT WARS Tile */}
        <button
          onClick={() => setLocation("/fitwars")}
          style={{
            background: "#ffffff",
            border: "1px solid #e0e0e0",
            borderRadius: "20px",
            padding: "40px 32px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            textAlign: "left",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)";
            e.currentTarget.style.borderColor = "#ccff00";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
            e.currentTarget.style.borderColor = "#e0e0e0";
          }}
        >
          {/* Background accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "120px",
              height: "120px",
              background: "linear-gradient(135deg, rgba(204,255,0,0.08), rgba(204,255,0,0.02))",
              borderRadius: "0 20px 0 120px",
            }}
          />
          <div style={{ position: "relative" }}>
            <img
              src={FITWARS_LOGO_URL}
              alt="FIT WARS"
              style={{
                height: "72px",
                objectFit: "contain",
                marginBottom: "20px",
                display: "block",
              }}
            />
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: "#1a1a2e",
                marginBottom: "10px",
                letterSpacing: "-0.01em",
              }}
            >
              FIT WARS
            </h2>
            <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.7, marginBottom: "24px" }}>
              トレーディングカードゲーム風の
              <br />
              オリジナルカードを作成。
              <br />
              AIがあなたをキャラクターに変換！
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                background: "#1a1a2e",
                color: "#ccff00",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              カードを作成する
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>

        {/* 免許メーカー Tile */}
        <button
          onClick={() => setLocation("/license")}
          style={{
            background: "#ffffff",
            border: "1px solid #e0e0e0",
            borderRadius: "20px",
            padding: "40px 32px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            textAlign: "left",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)";
            e.currentTarget.style.borderColor = "#e63946";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
            e.currentTarget.style.borderColor = "#e0e0e0";
          }}
        >
          {/* Background accent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "120px",
              height: "120px",
              background: "linear-gradient(135deg, rgba(230,57,70,0.08), rgba(230,57,70,0.02))",
              borderRadius: "0 20px 0 120px",
            }}
          />
          <div style={{ position: "relative" }}>
            <img
              src={LICENSE_LOGO_URL}
              alt="免許メーカー"
              style={{
                height: "72px",
                objectFit: "contain",
                marginBottom: "20px",
                display: "block",
              }}
            />
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 900,
                color: "#1a1a2e",
                marginBottom: "10px",
                letterSpacing: "-0.01em",
              }}
            >
              免許メーカー
            </h2>
            <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.7, marginBottom: "24px" }}>
              子供向けオリジナル免許証を作成。
              <br />
              ニックネーム・長所・夢を入力して
              <br />
              特別な免許証をプレゼント！
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 20px",
                background: "#e63946",
                color: "#ffffff",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              免許証を作成する
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: "auto",
          padding: "24px",
          textAlign: "center",
          borderTop: "1px solid #e0e0e0",
          background: "#ffffff",
        }}
      >
        <p style={{ fontSize: "12px", color: "#aaa" }}>
          © 2024 Makefrom1. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
