/**
 * PortalHome.tsx
 * Makefrom1 Portal — Sci-Fi Game UI
 * Dark space theme with glowing neon panels, animated particles, and dynamic hover effects
 */

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const FITWARS_LOGO_URL = "/manus-storage/logo_685ee78c.png";
const LICENSE_LOGO_URL = "/manus-storage/license-maker-logo_d91648c0.png";
const MAKEFROM1_LOGO_URL = "/manus-storage/makefrom1-logo-full_5458fab1.png";

// Particle system
function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; color: string;
    }> = [];

    const colors = ["#00d4ff", "#7b2fff", "#ff6b35", "#ccff00", "#ff2d78"];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Init particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, "0");
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color + "11";
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);
}

interface MenuCardProps {
  title: string;
  subtitle: string;
  description: string;
  logoUrl: string;
  accentColor: string;
  glowColor: string;
  bgGradient: string;
  borderColor: string;
  onClick: () => void;
  badge?: string;
}

function MenuCard({
  title, subtitle, description, logoUrl, accentColor, glowColor,
  bgGradient, borderColor, onClick, badge
}: MenuCardProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        position: "relative",
        background: hovered
          ? `linear-gradient(135deg, ${bgGradient})`
          : "linear-gradient(135deg, rgba(10,10,30,0.95) 0%, rgba(5,5,20,0.98) 100%)",
        border: `1px solid ${hovered ? borderColor : "rgba(255,255,255,0.08)"}`,
        borderRadius: "20px",
        padding: "0",
        cursor: "pointer",
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        textAlign: "left",
        boxShadow: hovered
          ? `0 0 40px ${glowColor}40, 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`
          : "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        transform: pressed ? "scale(0.97)" : hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
        overflow: "hidden",
        width: "100%",
        minHeight: "380px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Animated top border glow */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "2px",
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        opacity: hovered ? 1 : 0.3,
        transition: "opacity 0.3s",
      }} />

      {/* Corner accent */}
      <div style={{
        position: "absolute",
        top: 0, right: 0,
        width: "80px", height: "80px",
        background: `radial-gradient(circle at top right, ${accentColor}20, transparent 70%)`,
        borderRadius: "0 20px 0 0",
      }} />
      <div style={{
        position: "absolute",
        bottom: 0, left: 0,
        width: "80px", height: "80px",
        background: `radial-gradient(circle at bottom left, ${accentColor}15, transparent 70%)`,
        borderRadius: "0 0 0 20px",
      }} />

      {/* Grid overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        opacity: hovered ? 0.8 : 0.3,
        transition: "opacity 0.3s",
        borderRadius: "20px",
      }} />

      {/* Content */}
      <div style={{ position: "relative", padding: "36px 32px 32px", flex: 1, display: "flex", flexDirection: "column" }}>
        {badge && (
          <div style={{
            position: "absolute",
            top: "20px", right: "20px",
            padding: "4px 10px",
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}60`,
            borderRadius: "20px",
            fontSize: "10px",
            fontWeight: 700,
            color: accentColor,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            {badge}
          </div>
        )}

        <img
          src={logoUrl}
          alt={title}
          style={{
            height: "80px",
            objectFit: "contain",
            marginBottom: "24px",
            display: "block",
            filter: hovered ? `drop-shadow(0 0 12px ${glowColor}80)` : "none",
            transition: "filter 0.3s",
          }}
        />

        <h2 style={{
          fontSize: "26px",
          fontWeight: 900,
          color: "#ffffff",
          marginBottom: "8px",
          letterSpacing: "0.02em",
          textShadow: hovered ? `0 0 20px ${glowColor}80` : "none",
          transition: "text-shadow 0.3s",
        }}>
          {title}
        </h2>

        <p style={{
          fontSize: "12px",
          fontWeight: 600,
          color: accentColor,
          marginBottom: "16px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}>
          {subtitle}
        </p>

        <p style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.8,
          marginBottom: "32px",
          flex: 1,
        }}>
          {description}
        </p>

        {/* CTA Button */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          background: hovered ? accentColor : `${accentColor}20`,
          border: `1px solid ${accentColor}`,
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 700,
          color: hovered ? (accentColor === "#ccff00" ? "#0a0a1e" : "#ffffff") : accentColor,
          letterSpacing: "0.08em",
          transition: "all 0.3s",
          alignSelf: "flex-start",
          boxShadow: hovered ? `0 0 20px ${glowColor}60` : "none",
        }}>
          <span>START</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Bottom scan line animation */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: "1px",
        background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.3s",
      }} />
    </button>
  );
}

export default function PortalHome() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [scanLine, setScanLine] = useState(0);

  useParticles(canvasRef);

  // Scan line animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine((prev) => (prev + 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #020210 0%, #050520 40%, #0a0a1e 100%)",
        fontFamily: "'Noto Sans JP', 'Helvetica Neue', Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Radial glow backgrounds */}
      <div style={{
        position: "fixed",
        top: "20%", left: "15%",
        width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(123,47,255,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      <div style={{
        position: "fixed",
        top: "40%", right: "10%",
        width: "350px", height: "350px",
        background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      <div style={{
        position: "fixed",
        bottom: "10%", left: "30%",
        width: "500px", height: "300px",
        background: "radial-gradient(ellipse, rgba(204,255,0,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Scan line overlay */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: `linear-gradient(180deg, transparent ${scanLine}%, rgba(0,212,255,0.015) ${scanLine + 0.5}%, transparent ${scanLine + 1}%)`,
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* Header */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(2,2,16,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,212,255,0.15)",
        padding: "0 32px",
        height: "70px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={MAKEFROM1_LOGO_URL}
            alt="Makefrom1"
            style={{
              height: "36px",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
              opacity: logoLoaded ? 1 : 0,
              transition: "opacity 0.3s",
            }}
            onLoad={() => setLogoLoaded(true)}
          />
          {!logoLoaded && (
            <span style={{
              fontSize: "18px",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.05em",
            }}>
              Makefrom1
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {[
            { label: "FIT WARS", path: "/fitwars", color: "#ccff00" },
            { label: "免許メーカー", path: "/license", color: "#ff6b35" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              style={{
                padding: "8px 18px",
                background: "transparent",
                border: `1px solid rgba(255,255,255,0.15)`,
                borderRadius: "8px",
                color: "rgba(255,255,255,0.7)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.05em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.color = item.color;
                e.currentTarget.style.boxShadow = `0 0 12px ${item.color}40`;
                e.currentTarget.style.background = `${item.color}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main style={{ position: "relative", zIndex: 2 }}>
        {/* Hero section */}
        <section style={{
          padding: "100px 32px 60px",
          textAlign: "center",
          maxWidth: "900px",
          margin: "0 auto",
        }}>
          {/* Large logo */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "40px",
          }}>
            <img
              src={MAKEFROM1_LOGO_URL}
              alt="Makefrom1"
              style={{
                height: "clamp(60px, 10vw, 120px)",
                objectFit: "contain",
                filter: "brightness(0) invert(1) drop-shadow(0 0 30px rgba(0,212,255,0.5))",
                animation: "float 4s ease-in-out infinite",
              }}
            />
          </div>

          {/* Tagline */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            background: "rgba(0,212,255,0.1)",
            border: "1px solid rgba(0,212,255,0.3)",
            borderRadius: "20px",
            marginBottom: "28px",
          }}>
            <div style={{
              width: "6px", height: "6px",
              borderRadius: "50%",
              background: "#00d4ff",
              boxShadow: "0 0 8px #00d4ff",
              animation: "pulse 2s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#00d4ff",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}>
              Event Content Platform
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.2,
            marginBottom: "20px",
            letterSpacing: "-0.01em",
            textShadow: "0 0 40px rgba(0,212,255,0.3)",
          }}>
            オリジナルコンテンツを作って、
            <br />
            <span style={{
              background: "linear-gradient(90deg, #00d4ff, #7b2fff, #ccff00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              その場で遊べる。
            </span>
          </h1>

          <p style={{
            fontSize: "16px",
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.9,
            maxWidth: "520px",
            margin: "0 auto 16px",
          }}>
            Makefrom1が提供するイベント向けコンテンツ制作ツール。
            <br />
            AIとデジタル技術で、あなただけの特別な体験を作ろう。
          </p>

          {/* Divider */}
          <div style={{
            width: "60px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #00d4ff, transparent)",
            margin: "40px auto 0",
          }} />
        </section>

        {/* Menu Cards */}
        <section style={{
          padding: "20px 32px 100px",
          maxWidth: "1000px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "28px",
        }}>
          <MenuCard
            title="FIT WARS"
            subtitle="AI Trading Card Game"
            description="AIがあなたの写真をドラクエ風チビキャラに変換。トレーディングカードゲーム風のオリジナルカードを即座に作成できる。"
            logoUrl={FITWARS_LOGO_URL}
            accentColor="#ccff00"
            glowColor="#ccff00"
            bgGradient="rgba(15,20,5,0.98) 0%, rgba(20,30,5,0.95) 100%"
            borderColor="rgba(204,255,0,0.5)"
            onClick={() => setLocation("/fitwars")}
            badge="AI POWERED"
          />
          <MenuCard
            title="免許メーカー"
            subtitle="Kids License Creator"
            description="子供向けオリジナル免許証を作成。AIがカーズ風3Dキャラに変換。ニックネーム・長所・将来の夢を入力して特別な免許証をプレゼント！"
            logoUrl={LICENSE_LOGO_URL}
            accentColor="#ff6b35"
            glowColor="#ff6b35"
            bgGradient="rgba(20,8,3,0.98) 0%, rgba(30,12,5,0.95) 100%"
            borderColor="rgba(255,107,53,0.5)"
            onClick={() => setLocation("/license")}
            badge="NEW"
          />
        </section>

        {/* Bottom brand section */}
        <section style={{
          padding: "60px 32px",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.3)",
        }}>
          <img
            src={MAKEFROM1_LOGO_URL}
            alt="Makefrom1"
            style={{
              height: "32px",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
              opacity: 0.4,
              marginBottom: "12px",
              display: "block",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
            © 2024 Makefrom1. All rights reserved.
          </p>
        </section>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #00d4ff; }
          50% { opacity: 0.5; box-shadow: 0 0 4px #00d4ff; }
        }
      `}</style>
    </div>
  );
}
