/**
 * PortalHome.tsx
 * Makefrom1 Portal — Genshin Impact Style
 * Deep parallax layers, cinematic motion, floating particles,
 * scroll-triggered reveals, and layered depth effects.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";

const FITWARS_LOGO_URL = "/manus-storage/logo_685ee78c.png";
const LICENSE_LOGO_URL = "/manus-storage/license-maker-logo-new2_eff90f28.png";
const MAKEFROM1_LOGO_URL = "/manus-storage/makefrom1-logo-full_5458fab1.png";

// ── Parallax scroll hook ───────────────────────────────────────────────────────
function useParallax() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrollY;
}

// ── Intersection Observer reveal hook ─────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── Floating particles canvas ─────────────────────────────────────────────────
function useGenshinParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    type Particle = {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; maxOpacity: number;
      color: string; phase: number; speed: number;
    };
    const particles: Particle[] = [];

    // Genshin-style warm gold + cool blue palette
    const colors = [
      "#f5d87a", "#e8c44a", "#ffeaa0",  // gold/amber
      "#a8d8f0", "#7ec8e3", "#c8e6f5",  // ice blue
      "#d4a8ff", "#b87fff",             // soft purple
      "#ffffff",                         // white sparkle
    ];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,  // mostly upward drift
        size: Math.random() * 2.5 + 0.5,
        opacity: 0,
        maxOpacity: Math.random() * 0.7 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.005,
      });
    }

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      particles.forEach((p) => {
        // Pulsing opacity
        p.opacity = p.maxOpacity * (0.5 + 0.5 * Math.sin(p.phase + frame * p.speed));
        p.x += p.vx + Math.sin(p.phase + frame * 0.01) * 0.2;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        // Diamond / cross sparkle shape for larger particles
        if (p.size > 1.8) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(frame * p.speed * 0.5);
          ctx.globalAlpha = p.opacity;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.8;
          const s = p.size * 2;
          ctx.beginPath();
          ctx.moveTo(0, -s); ctx.lineTo(0, s);
          ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
          ctx.stroke();
          ctx.restore();
        }

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();

        // Soft glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        grad.addColorStop(0, p.color + "60");
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = p.opacity * 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
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

// ── Feature Card ──────────────────────────────────────────────────────────────
interface FeatureCardProps {
  title: string;
  subtitle: string;
  description: string;
  logoUrl: string;
  accentColor: string;
  glowColor: string;
  gradientFrom: string;
  gradientTo: string;
  onClick: () => void;
  badge?: string;
  delay?: number;
}

function FeatureCard({
  title, subtitle, description, logoUrl,
  accentColor, glowColor, gradientFrom, gradientTo,
  onClick, badge, delay = 0,
}: FeatureCardProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className="reveal-on-scroll"
      style={{
        position: "relative",
        background: hovered
          ? `linear-gradient(145deg, ${gradientFrom}, ${gradientTo})`
          : "linear-gradient(145deg, rgba(8,8,24,0.96) 0%, rgba(4,4,16,0.98) 100%)",
        border: `1px solid ${hovered ? accentColor + "80" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "24px",
        padding: "0",
        cursor: "pointer",
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        textAlign: "left",
        boxShadow: hovered
          ? `0 0 60px ${glowColor}30, 0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)`
          : "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        transform: pressed
          ? "scale(0.97) translateY(2px)"
          : hovered
          ? "translateY(-12px) scale(1.02)"
          : "translateY(0) scale(1)",
        overflow: "hidden",
        width: "100%",
        minHeight: "420px",
        display: "flex",
        flexDirection: "column",
        opacity: 0,
        transitionProperty: "all",
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Animated shimmer border top */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "2px",
        background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
        opacity: hovered ? 1 : 0.4,
        transition: "opacity 0.4s",
      }} />

      {/* Corner glow */}
      <div style={{
        position: "absolute",
        top: 0, right: 0,
        width: "120px", height: "120px",
        background: `radial-gradient(circle at top right, ${accentColor}18, transparent 70%)`,
        borderRadius: "0 24px 0 0",
        transition: "opacity 0.4s",
        opacity: hovered ? 1 : 0.5,
      }} />
      <div style={{
        position: "absolute",
        bottom: 0, left: 0,
        width: "100px", height: "100px",
        background: `radial-gradient(circle at bottom left, ${accentColor}12, transparent 70%)`,
        borderRadius: "0 0 0 24px",
        transition: "opacity 0.4s",
        opacity: hovered ? 1 : 0.3,
      }} />

      {/* Subtle grid texture */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        opacity: hovered ? 1 : 0.5,
        transition: "opacity 0.4s",
        borderRadius: "24px",
      }} />

      {/* Main content */}
      <div style={{
        position: "relative",
        padding: "40px 36px 36px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}>
        {badge && (
          <div style={{
            position: "absolute",
            top: "24px", right: "24px",
            padding: "4px 12px",
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}50`,
            borderRadius: "20px",
            fontSize: "10px",
            fontWeight: 700,
            color: accentColor,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            {badge}
          </div>
        )}

        {/* Logo */}
        <img
          src={logoUrl}
          alt={title}
          style={{
            height: "90px",
            objectFit: "contain",
            marginBottom: "28px",
            display: "block",
            filter: hovered
              ? `drop-shadow(0 0 16px ${glowColor}90) drop-shadow(0 0 32px ${glowColor}40)`
              : `drop-shadow(0 2px 8px rgba(0,0,0,0.5))`,
            transition: "filter 0.4s",
            transformOrigin: "left center",
            transform: hovered ? "scale(1.05)" : "scale(1)",
          }}
        />

        <h2 style={{
          fontSize: "28px",
          fontWeight: 900,
          color: "#ffffff",
          marginBottom: "8px",
          letterSpacing: "0.02em",
          textShadow: hovered ? `0 0 24px ${glowColor}70` : "none",
          transition: "text-shadow 0.4s",
          fontFamily: "'Orbitron', 'Noto Sans JP', sans-serif",
        }}>
          {title}
        </h2>

        <p style={{
          fontSize: "11px",
          fontWeight: 700,
          color: accentColor,
          marginBottom: "16px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: 0.9,
        }}>
          {subtitle}
        </p>

        <p style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.58)",
          lineHeight: 1.85,
          marginBottom: "36px",
          flex: 1,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}>
          {description}
        </p>

        {/* CTA */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          padding: "13px 28px",
          background: hovered ? accentColor : `${accentColor}15`,
          border: `1px solid ${accentColor}80`,
          borderRadius: "12px",
          fontSize: "13px",
          fontWeight: 700,
          color: hovered ? "#0a0a1e" : accentColor,
          letterSpacing: "0.1em",
          transition: "all 0.3s",
          alignSelf: "flex-start",
          boxShadow: hovered ? `0 0 28px ${glowColor}60, 0 4px 16px ${glowColor}30` : "none",
          fontFamily: "'Orbitron', sans-serif",
        }}>
          <span>ENTER</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Bottom accent line */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: "1px",
        background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.4s",
      }} />
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PortalHome() {
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const scrollY = useParallax();

  useGenshinParticles(canvasRef);
  useReveal();

  const handleNavigate = useCallback((path: string) => {
    window.scrollTo(0, 0);
    setLocation(path);
  }, [setLocation]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #030310 0%, #060620 30%, #0a0a28 60%, #060618 100%)",
        fontFamily: "'Noto Sans JP', 'Helvetica Neue', Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
        color: "#fff",
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

      {/* Deep background glow layers — parallax */}
      <div style={{
        position: "fixed",
        top: `${-scrollY * 0.15}px`,
        left: "5%",
        width: "600px", height: "600px",
        background: "radial-gradient(ellipse, rgba(100,60,200,0.18) 0%, transparent 65%)",
        pointerEvents: "none",
        zIndex: 0,
        transform: `translateX(${scrollY * 0.05}px)`,
      }} />
      <div style={{
        position: "fixed",
        top: `${100 - scrollY * 0.1}px`,
        right: "5%",
        width: "500px", height: "500px",
        background: "radial-gradient(ellipse, rgba(30,140,200,0.14) 0%, transparent 65%)",
        pointerEvents: "none",
        zIndex: 0,
        transform: `translateX(${-scrollY * 0.04}px)`,
      }} />
      <div style={{
        position: "fixed",
        bottom: "5%",
        left: "30%",
        width: "700px", height: "400px",
        background: "radial-gradient(ellipse, rgba(200,160,50,0.07) 0%, transparent 65%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Horizontal light streaks */}
      <div style={{
        position: "fixed",
        top: "35%",
        left: 0, right: 0,
        height: "1px",
        background: "linear-gradient(90deg, transparent 0%, rgba(100,60,200,0.3) 30%, rgba(30,140,200,0.3) 70%, transparent 100%)",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.6,
      }} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(3,3,16,0.82)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px",
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 40px rgba(0,0,0,0.6)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={MAKEFROM1_LOGO_URL}
            alt="Makefrom1"
            style={{
              height: "32px",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
              opacity: logoLoaded ? 0.9 : 0,
              transition: "opacity 0.5s",
            }}
            onLoad={() => setLogoLoaded(true)}
          />
          {!logoLoaded && (
            <span style={{ fontSize: "16px", fontWeight: 900, color: "#fff", letterSpacing: "0.05em", fontFamily: "'Orbitron', sans-serif" }}>
              Makefrom1
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {[
            { label: "FIT WARS", path: "/fitwars", color: "#c8ff00", bgColor: "rgba(200,255,0,0.1)", borderColor: "rgba(200,255,0,0.4)" },
            { label: "免許メーカー", path: "/license", color: "#ff4daa", bgColor: "rgba(255,77,170,0.1)", borderColor: "rgba(255,77,170,0.4)" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              style={{
                padding: "8px 20px",
                background: (item as any).bgColor || "transparent",
                border: `1px solid ${(item as any).borderColor || "rgba(255,255,255,0.3)"}`,
                borderRadius: "20px",
                color: item.color,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                letterSpacing: "0.06em",
                fontFamily: "'Noto Sans JP', sans-serif",
                textShadow: `0 0 10px ${item.color}80`,
                boxShadow: `0 0 14px ${item.color}25, inset 0 1px 0 rgba(255,255,255,0.15)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = item.color + "22";
                e.currentTarget.style.borderColor = item.color + "cc";
                e.currentTarget.style.boxShadow = `0 0 28px ${item.color}60, inset 0 1px 0 rgba(255,255,255,0.25)`;
                e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = (item as any).bgColor || "transparent";
                e.currentTarget.style.borderColor = (item as any).borderColor || "rgba(255,255,255,0.3)";
                e.currentTarget.style.boxShadow = `0 0 14px ${item.color}25, inset 0 1px 0 rgba(255,255,255,0.15)`;
                e.currentTarget.style.transform = "none";
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main style={{ position: "relative", zIndex: 2 }}>

        {/* ── Hero Section ─────────────────────────────────────────────────── */}
        <section style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 32px 60px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Decorative rings */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: `translate(-50%, -50%) translateY(${scrollY * 0.1}px)`,
            width: "700px", height: "700px",
            border: "1px solid rgba(100,60,200,0.12)",
            borderRadius: "50%",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: `translate(-50%, -50%) translateY(${scrollY * 0.08}px)`,
            width: "500px", height: "500px",
            border: "1px solid rgba(30,140,200,0.1)",
            borderRadius: "50%",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: `translate(-50%, -50%) translateY(${scrollY * 0.06}px)`,
            width: "300px", height: "300px",
            border: "1px solid rgba(200,160,50,0.08)",
            borderRadius: "50%",
            pointerEvents: "none",
          }} />

          {/* Large Makefrom1 logo — hero centerpiece */}
          <div style={{
            transform: `translateY(${-scrollY * 0.25}px)`,
            transition: "transform 0.05s linear",
            marginBottom: "48px",
          }}>
            <img
              src={MAKEFROM1_LOGO_URL}
              alt="Makefrom1"
              style={{
                height: "clamp(80px, 14vw, 200px)",
                objectFit: "contain",
                filter: "brightness(0) invert(1) drop-shadow(0 0 40px rgba(100,60,200,0.6)) drop-shadow(0 0 80px rgba(30,140,200,0.3))",
                animation: "heroFloat 5s ease-in-out infinite",
                display: "block",
                margin: "0 auto",
              }}
            />
          </div>

          {/* Platform badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 20px",
            background: "rgba(100,60,200,0.12)",
            border: "1px solid rgba(100,60,200,0.35)",
            borderRadius: "30px",
            marginBottom: "32px",
            transform: `translateY(${-scrollY * 0.15}px)`,
          }}>
            <div style={{
              width: "7px", height: "7px",
              borderRadius: "50%",
              background: "#a07aff",
              boxShadow: "0 0 10px #a07aff, 0 0 20px #a07aff60",
              animation: "pulseDot 2.5s ease-in-out infinite",
            }} />
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#c8a8ff",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontFamily: "'Orbitron', sans-serif",
            }}>
              Event Content Platform
            </span>
          </div>

          {/* Main headline */}
          <div style={{ transform: `translateY(${-scrollY * 0.12}px)` }}>
            <h1 style={{
              fontSize: "clamp(28px, 5.5vw, 60px)",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.18,
              marginBottom: "24px",
              letterSpacing: "-0.02em",
              textShadow: "0 0 60px rgba(100,60,200,0.4), 0 2px 4px rgba(0,0,0,0.8)",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}>
              オリジナルコンテンツを作って、
              <br />
              <span style={{
                background: "linear-gradient(90deg, #c8a8ff 0%, #7ec8e3 40%, #f5d87a 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "inline-block",
              }}>
                その場で遊べる。
              </span>
            </h1>

            <p style={{
              fontSize: "clamp(14px, 1.8vw, 17px)",
              color: "rgba(255,255,255,0.48)",
              lineHeight: 2,
              maxWidth: "560px",
              margin: "0 auto 48px",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}>
              Makefrom1が提供するイベント向けコンテンツ制作ツール。
              <br />
              AIとデジタル技術で、あなただけの特別な体験を作ろう。
            </p>
          </div>

          {/* CTA buttons */}
          <div style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            justifyContent: "center",
            transform: `translateY(${-scrollY * 0.08}px)`,
          }}>
            <button
              onClick={() => handleNavigate("/fitwars")}
              style={{
                padding: "16px 36px",
                background: "linear-gradient(135deg, #6428c8, #4a1a9a)",
                border: "1px solid rgba(160,120,255,0.5)",
                borderRadius: "14px",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.06em",
                boxShadow: "0 0 30px rgba(100,40,200,0.4), 0 8px 24px rgba(0,0,0,0.4)",
                transition: "all 0.3s",
                fontFamily: "'Orbitron', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 0 50px rgba(100,40,200,0.6), 0 12px 32px rgba(0,0,0,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(100,40,200,0.4), 0 8px 24px rgba(0,0,0,0.4)";
              }}
            >
              FIT WARS を始める
            </button>
            <button
              onClick={() => handleNavigate("/license")}
              style={{
                padding: "16px 36px",
                background: "rgba(255,140,66,0.12)",
                border: "1px solid rgba(255,140,66,0.5)",
                borderRadius: "14px",
                color: "#ff8c42",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.06em",
                boxShadow: "0 0 20px rgba(255,140,66,0.2), 0 8px 24px rgba(0,0,0,0.3)",
                transition: "all 0.3s",
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.background = "rgba(255,140,66,0.2)";
                e.currentTarget.style.boxShadow = "0 0 40px rgba(255,140,66,0.4), 0 12px 32px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "rgba(255,140,66,0.12)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(255,140,66,0.2), 0 8px 24px rgba(0,0,0,0.3)";
              }}
            >
              免許メーカーを試す
            </button>
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            opacity: Math.max(0, 1 - scrollY / 200),
            transition: "opacity 0.2s",
          }}>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Orbitron', sans-serif" }}>
              SCROLL
            </span>
            <div style={{
              width: "1px", height: "40px",
              background: "linear-gradient(180deg, rgba(255,255,255,0.3), transparent)",
              animation: "scrollLine 2s ease-in-out infinite",
            }} />
          </div>
        </section>

        {/* ── Feature Cards Section ─────────────────────────────────────────── */}
        <section style={{
          padding: "40px 32px 100px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}>
          {/* Section header */}
          <div
            className="reveal-on-scroll"
            style={{
              textAlign: "center",
              marginBottom: "64px",
              opacity: 0,
              transform: "translateY(30px)",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}>
              <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(200,168,255,0.6))" }} />
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "rgba(200,168,255,0.7)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontFamily: "'Orbitron', sans-serif",
              }}>
                CONTENTS
              </span>
              <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, rgba(200,168,255,0.6), transparent)" }} />
            </div>
            <h2 style={{
              fontSize: "clamp(22px, 4vw, 38px)",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.01em",
              textShadow: "0 0 40px rgba(100,60,200,0.3)",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}>
              コンテンツを選んでください
            </h2>
          </div>

          {/* Cards grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
            gap: "32px",
          }}
            className="cards-grid"
          >
            <FeatureCard
              title="FIT WARS"
              subtitle="AI Trading Card Game"
              description="AIがあなたの写真をドラクエ風チビキャラに変換。属性・アビリティを選んでトレーディングカードゲーム風のオリジナルカードを即座に作成。印刷用2面付きデータも生成できる。"
              logoUrl={FITWARS_LOGO_URL}
              accentColor="#c8ff00"
              glowColor="#c8ff00"
              gradientFrom="rgba(12,20,4,0.97)"
              gradientTo="rgba(18,30,6,0.95)"
              onClick={() => handleNavigate("/fitwars")}
              badge="AI POWERED"
              delay={0}
            />
            <FeatureCard
              title="免許メーカー"
              subtitle="Kids License Creator"
              description="子供向けオリジナル免許証を作成。AIが写真をかわいいイラスト画像に変換。ニックネーム・長所・将来の夢を入力して特別な免許証をプレゼント！"
              logoUrl={LICENSE_LOGO_URL}
              accentColor="#ff4daa"
              glowColor="#ff4daa"
              gradientFrom="rgba(30,4,20,0.97)"
              gradientTo="rgba(50,8,35,0.95)"
              onClick={() => handleNavigate("/license")}
              badge="NEW"
              delay={120}
            />
          </div>
        </section>

        {/* ── About Makefrom1 Section ───────────────────────────────────────── */}
        <section style={{
          padding: "80px 32px 100px",
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
        }}>
          {/* Decorative divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "64px",
          }}>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1))" }} />
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(200,168,255,0.5)", boxShadow: "0 0 12px rgba(200,168,255,0.4)" }} />
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)" }} />
          </div>

          <div
            className="reveal-on-scroll"
            style={{
              opacity: 0,
              transform: "translateY(40px)",
              transition: "all 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Makefrom1 logo large */}
            <img
              src={MAKEFROM1_LOGO_URL}
              alt="Makefrom1"
              style={{
                height: "clamp(48px, 8vw, 96px)",
                objectFit: "contain",
                filter: "brightness(0) invert(1) drop-shadow(0 0 20px rgba(200,168,255,0.4))",
                display: "block",
                margin: "0 auto 40px",
                opacity: 0.85,
              }}
            />

            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 18px",
              background: "rgba(100,60,200,0.1)",
              border: "1px solid rgba(100,60,200,0.3)",
              borderRadius: "20px",
              marginBottom: "28px",
            }}>
              <span style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "rgba(200,168,255,0.8)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: "'Orbitron', sans-serif",
              }}>
                株式会社 Makefrom1
              </span>
            </div>

            <h3 style={{
              fontSize: "clamp(20px, 3.5vw, 32px)",
              fontWeight: 900,
              color: "#ffffff",
              marginBottom: "24px",
              lineHeight: 1.4,
              textShadow: "0 0 30px rgba(100,60,200,0.3)",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}>
              1からつくる。<br />
              <span style={{
                background: "linear-gradient(90deg, #c8a8ff, #7ec8e3)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                独自の最適解を、あなたと。
              </span>
            </h3>

            <p style={{
              fontSize: "clamp(13px, 1.6vw, 16px)",
              color: "rgba(255,255,255,0.45)",
              lineHeight: 2.1,
              maxWidth: "620px",
              margin: "0 auto 48px",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}>
              Makefrom1は、1つの課題から新たなサービスや提案を生み出し、
              中小企業が持続可能な成長と差別化を実現できるよう支援します。
              戦略的なコンサルティングと革新的なクリエイティブ制作の両輪で、
              企業の課題解決と価値創造を実現します。
            </p>

            {/* Stats / features */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              maxWidth: "700px",
              margin: "0 auto",
            }}>
              {[
                { icon: "⚡", label: "AIリアルタイム変換", desc: "写真を即座にイラストへ" },
                { icon: "🎴", label: "印刷対応データ", desc: "高解像度300dpi出力" },
                { icon: "🎪", label: "イベント特化設計", desc: "その場で完結する体験" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "24px 20px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "16px",
                    textAlign: "center",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(100,60,200,0.08)";
                    e.currentTarget.style.borderColor = "rgba(100,60,200,0.3)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "10px" }}>{item.icon}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", marginBottom: "6px", fontFamily: "'Noto Sans JP', sans-serif" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontFamily: "'Noto Sans JP', sans-serif" }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer style={{
          padding: "40px 32px",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          background: "rgba(0,0,0,0.4)",
          position: "relative",
          zIndex: 2,
        }}>
          <img
            src={MAKEFROM1_LOGO_URL}
            alt="Makefrom1"
            style={{
              height: "28px",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
              opacity: 0.3,
              display: "block",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.1em", fontFamily: "'Orbitron', sans-serif" }}>
            © 2024 Makefrom1. All rights reserved.
          </p>
        </footer>
      </main>

      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) scale(1); filter: brightness(0) invert(1) drop-shadow(0 0 40px rgba(100,60,200,0.6)) drop-shadow(0 0 80px rgba(30,140,200,0.3)); }
          50% { transform: translateY(-14px) scale(1.02); filter: brightness(0) invert(1) drop-shadow(0 0 60px rgba(100,60,200,0.8)) drop-shadow(0 0 100px rgba(30,140,200,0.5)); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px #a07aff, 0 0 20px #a07aff60; }
          50% { opacity: 0.4; box-shadow: 0 0 4px #a07aff; }
        }
        @keyframes scrollLine {
          0% { opacity: 0; transform: scaleY(0); transform-origin: top; }
          50% { opacity: 1; transform: scaleY(1); transform-origin: top; }
          100% { opacity: 0; transform: scaleY(1); transform-origin: bottom; }
        }
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (max-width: 640px) {
          .cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
