import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const BGM_URL = "/manus-storage/bgm_a4cfeefc.mp3";
const LOGO_URL = "/manus-storage/logo_685ee78c.png";
const HERO_BANNER_URL = "/manus-storage/hero-banner_5a31bf82.webp";
const EVENT_PHOTO_URL = "/manus-storage/event-photo_d672ed72.png";

// Card images (actual card artwork)
const CARD_URLS = [
  "/manus-storage/card1_5fcad3c7.jpg",
  "/manus-storage/card2_a858cb82.jpg",
  "/manus-storage/card3_4339bf25.jpg",
  "/manus-storage/card4_93d0ea23.jpg",
  "/manus-storage/card5_5816181b.jpg",
  "/manus-storage/card6_efe05c75.jpg",
  "/manus-storage/card7_5dd49088.jpg",
  "/manus-storage/card8_0308ed77.jpg",
];

// Monster mascot images
const MONSTER_URLS = [
  "/manus-storage/dragon_bc1dbe78.png",
  "/manus-storage/goblin_e48b5865.png",
  "/manus-storage/pixie_693710fd.png",
  "/manus-storage/slime_713b4034.png",
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorOutlineRef = useRef<HTMLDivElement>(null);

  // Custom cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = `${e.clientX}px`;
        cursorDotRef.current.style.top = `${e.clientY}px`;
      }
      if (cursorOutlineRef.current) {
        cursorOutlineRef.current.style.left = `${e.clientX}px`;
        cursorOutlineRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleBGM = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (bgmPlaying) {
      audio.pause();
      setBgmPlaying(false);
    } else {
      audio.play().catch(() => {});
      setBgmPlaying(true);
    }
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Noto Sans JP', sans-serif", cursor: "none" }}>
      {/* Custom cursor */}
      <div
        ref={cursorDotRef}
        className="fixed pointer-events-none z-[9999] w-2 h-2 bg-[#ccff00] rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
        style={{ top: 0, left: 0 }}
      />
      <div
        ref={cursorOutlineRef}
        className="fixed pointer-events-none z-[9998] w-8 h-8 border border-[#ccff00]/50 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
        style={{ top: 0, left: 0 }}
      />

      {/* BGM */}
      <audio ref={audioRef} loop src={BGM_URL} />

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/95 z-[4999] flex flex-col justify-center items-center">
          <button
            className="absolute top-6 right-6 text-white p-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {["service", "cards", "event", "rule"].map((id) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-white text-3xl font-black italic uppercase my-3 hover:text-[#ccff00] transition-colors"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {id === "service" ? "FIT WARSとは" : id === "cards" ? "カード紹介" : id === "event" ? "イベント" : "ルール"}
            </button>
          ))}
          <button
            onClick={() => { setMobileMenuOpen(false); setLocation("/create"); }}
            className="mt-6 px-8 py-3 bg-[#ccff00] text-black font-black italic uppercase text-xl rounded"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            作成
          </button>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-[5000] px-6 py-3 bg-black/90 backdrop-blur-md border-b border-[#ccff00]/20 flex justify-between items-center">
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <img src={LOGO_URL} alt="FIT WARS" className="h-10 md:h-14 object-contain" style={{ filter: "drop-shadow(0 0 8px rgba(204,255,0,0.4))" }} />
        </a>
        <div className="flex items-center ml-auto gap-3">
          <nav className="hidden lg:flex items-center gap-6 mr-4">
            {[
              { id: "service", label: "FIT WARSとは" },
              { id: "cards", label: "カード紹介" },
              { id: "event", label: "イベント" },
              { id: "rule", label: "ルール" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-white hover:text-[#ccff00] transition-colors font-black italic uppercase text-sm tracking-wide"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {label}
              </button>
            ))}
          </nav>
          {/* 作成ボタン */}
          <button
            onClick={() => setLocation("/create")}
            className="px-5 py-2 bg-[#ccff00] text-black font-black italic uppercase text-sm tracking-wide rounded hover:bg-[#aadd00] transition-colors"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            作成
          </button>
          {/* BGM toggle */}
          <button
            onClick={toggleBGM}
            title={bgmPlaying ? "BGM停止" : "BGM再生"}
            className="p-2 border border-[#ccff00]/50 rounded-full hover:border-[#ccff00] transition-colors"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              {bgmPlaying ? (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM3 9v6h4l5 5V4L7 9H3z" />
              ) : (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              )}
            </svg>
          </button>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 border border-[#ccff00]/50 rounded-full hover:border-[#ccff00] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      {/* Hero: タイガー＆フェニックスバナー + ロゴ */}
      <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-black pt-20">
        {/* Hero Banner (Tiger & Phoenix) as full background */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_BANNER_URL}
            alt="FIT WARS Hero"
            className="w-full h-full object-cover opacity-80"
          />
          {/* Dark gradient overlay top and bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <img
            src={LOGO_URL}
            alt="FIT WARS"
            className="w-72 md:w-[480px] mb-6 drop-shadow-[0_0_60px_rgba(204,255,0,0.7)]"
          />
          <p className="text-white font-black italic tracking-[0.4em] uppercase text-base md:text-2xl mb-4" style={{ fontFamily: "'Oswald', sans-serif", textShadow: "0 0 20px rgba(204,255,0,0.5)" }}>
            Trading Card × Event Content
          </p>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-3 mb-8 rounded">
            <p className="font-black text-white text-lg md:text-2xl" style={{ letterSpacing: "-0.02em" }}>
              オリジナルカードを作って、その場で遊べる。
            </p>
          </div>
          <button
            onClick={() => setLocation("/create")}
            className="px-12 py-4 bg-[#ccff00] text-black font-black italic uppercase text-xl tracking-widest rounded hover:bg-[#aadd00] hover:scale-105 transition-all duration-200 shadow-[0_0_40px_rgba(204,255,0,0.6)]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            カードを作成する →
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-white/50 uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>Scroll</span>
          <svg className="w-5 h-5 text-[#ccff00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ===== WHAT IS FIT WARS ===== */}
      <section id="service" className="py-16 md:py-24 bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 reveal">
          <h2 className="text-4xl md:text-6xl italic font-black mb-4 uppercase tracking-tighter text-center text-[#ccff00]" style={{ fontFamily: "'Oswald', sans-serif" }}>
            What is FIT WARS?
          </h2>
          <p className="text-center text-zinc-400 mb-16 text-base md:text-lg">
            フィットネスとトレーディングカードゲームを融合した、まったく新しいイベントコンテンツ
          </p>

          {/* 3 feature cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: "🎴",
                title: "オリジナルカード",
                desc: "自分の写真とステータスで世界に1枚だけのトレーディングカードを作成。AIが自動でアニメ風に変換します。",
                color: "border-[#ccff00]",
              },
              {
                icon: "⚔️",
                title: "その場でバトル",
                desc: "属性・攻撃力・アビリティを駆使してリアルタイムで対戦。誰でもすぐに楽しめるシンプルなルール。",
                color: "border-red-500",
              },
              {
                icon: "🤝",
                title: "交流が生まれる",
                desc: "カードを通じた自然なコミュニケーションでイベントが盛り上がる。参加者同士の絆を深めます。",
                color: "border-blue-400",
              },
            ].map(({ icon, title, desc, color }) => (
              <div
                key={title}
                className={`p-8 border ${color} bg-zinc-900/60 hover:-translate-y-2 transition-all duration-300 rounded`}
              >
                <div className="text-5xl mb-4">{icon}</div>
                <h3 className="text-xl font-black italic uppercase mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Monster mascots row */}
          <div className="flex justify-center gap-6 md:gap-12 flex-wrap">
            {MONSTER_URLS.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`monster-${i}`}
                className="w-20 md:w-28 object-contain hover:scale-110 hover:-rotate-6 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(204,255,0,0.3)]"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CARD GALLERY ===== */}
      <section id="cards" className="py-16 md:py-24 bg-black border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 reveal">
          <h2 className="text-4xl md:text-6xl italic font-black mb-4 uppercase tracking-tighter text-center" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Card Gallery
          </h2>
          <p className="text-center text-zinc-400 mb-12 text-base">
            実際に作成されたオリジナルカードの一例
          </p>

          {/* Card grid - 4 columns on desktop, 2 on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {CARD_URLS.map((url, i) => (
              <div
                key={i}
                className="relative group overflow-hidden rounded-lg shadow-xl hover:scale-105 hover:z-10 transition-all duration-300"
                style={{ aspectRatio: "63/88" }}
              >
                <img
                  src={url}
                  alt={`card-${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setLocation("/create")}
              className="px-10 py-4 bg-[#ccff00] text-black font-black italic uppercase text-lg tracking-widest rounded hover:bg-[#aadd00] hover:scale-105 transition-all duration-200 shadow-[0_0_30px_rgba(204,255,0,0.4)]"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              自分のカードを作る →
            </button>
          </div>
        </div>
      </section>

      {/* ===== EVENT SECTION ===== */}
      <section id="event" className="py-16 md:py-24 bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 reveal">
          <h2 className="text-4xl md:text-6xl italic font-black mb-4 uppercase tracking-tighter text-center text-[#ccff00]" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Event
          </h2>
          <p className="text-center text-zinc-400 mb-12 text-base">
            全国各地のイベントで展開中
          </p>

          {/* Event photo */}
          <div className="relative rounded-xl overflow-hidden shadow-2xl mb-12">
            <img
              src={EVENT_PHOTO_URL}
              alt="FIT WARS Event"
              className="w-full object-cover max-h-[500px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white font-black text-xl md:text-3xl italic uppercase" style={{ fontFamily: "'Oswald', sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                子どもから大人まで楽しめるイベントコンテンツ
              </p>
            </div>
          </div>

          {/* Service steps */}
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              {
                step: "STEP 01",
                icon: "📱",
                title: "スマホでアクセス",
                desc: "QRコードからWebページへ。専用アプリは不要です。",
              },
              {
                step: "STEP 02",
                icon: "✏️",
                title: "カード生成",
                desc: "画像を選択し、ステータスを入力。自分だけのカードを作成。",
              },
              {
                step: "STEP 03",
                icon: "🖨️",
                title: "その場で印刷",
                desc: "市販プリンターで即時出力。所要時間は約2分。",
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="p-8 border border-zinc-800 bg-zinc-900/50 hover:border-[#ccff00] hover:-translate-y-2 transition-all duration-300 rounded">
                <div className="text-xs font-black italic text-[#ccff00] mb-2 tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>{step}</div>
                <div className="text-5xl mb-4">{icon}</div>
                <h3 className="text-lg font-black italic uppercase mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RULES SECTION ===== */}
      <section id="rule" className="py-16 md:py-24 bg-black border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 reveal">
          <h2 className="text-4xl md:text-6xl italic font-black mb-16 uppercase tracking-tighter text-center" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Rules
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Attribute chart */}
            <div>
              <h3 className="text-2xl md:text-3xl font-black italic mb-8 border-l-8 border-[#ccff00] pl-4" style={{ fontFamily: "'Oswald', sans-serif" }}>ELEMENTS</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { name: "火", emoji: "🔥", color: "border-red-500", glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]", desc: "草に強い・水に弱い" },
                  { name: "水", emoji: "💧", color: "border-blue-400", glow: "shadow-[0_0_20px_rgba(96,165,250,0.4)]", desc: "火に強い・草に弱い" },
                  { name: "草", emoji: "🌿", color: "border-green-500", glow: "shadow-[0_0_20px_rgba(34,197,94,0.4)]", desc: "水に強い・火に弱い" },
                  { name: "闇", emoji: "🌙", color: "border-purple-500", glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]", desc: "全属性に有利" },
                ].map(({ name, emoji, color, glow, desc }) => (
                  <div key={name} className={`p-5 border ${color} bg-zinc-900/80 text-center ${glow} hover:scale-105 transition-transform rounded`}>
                    <div className="text-3xl mb-1">{emoji}</div>
                    <span className="text-2xl font-black">{name}</span>
                    <p className="text-xs text-zinc-400 mt-2">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500">※闇属性は全属性に有利（デッキに2枚まで）</p>
            </div>
            {/* Abilities */}
            <div>
              <h3 className="text-2xl md:text-3xl font-black italic mb-8 border-l-8 border-[#ccff00] pl-4" style={{ fontFamily: "'Oswald', sans-serif" }}>ABILITIES</h3>
              <p className="text-zinc-400 mb-6 text-sm">特殊効果の発動条件と効果</p>
              <div className="space-y-3">
                {[
                  { name: "BOOST", color: "border-red-500", textColor: "text-red-400", desc: "同属性+20：自分の攻撃力を+20" },
                  { name: "CURSE", color: "border-purple-500", textColor: "text-purple-400", desc: "相手攻撃力-10：相手の攻撃力を-10" },
                  { name: "BREAK", color: "border-yellow-500", textColor: "text-yellow-400", desc: "属性効果無効：属性の不利を打ち消す" },
                  { name: "VOID", color: "border-blue-400", textColor: "text-blue-400", desc: "引き分け：勝負を引き分けにする" },
                  { name: "LOCK", color: "border-zinc-500", textColor: "text-zinc-400", desc: "特殊効果無効：相手の特殊効果を無効にする" },
                ].map(({ name, color, textColor, desc }) => (
                  <div key={name} className={`flex items-center bg-zinc-900/80 p-3 border-l-4 ${color} hover:bg-zinc-800 transition-colors rounded-r`}>
                    <div className={`w-16 md:w-20 font-black italic ${textColor} shrink-0 text-base md:text-lg`} style={{ fontFamily: "'Oswald', sans-serif" }}>{name}</div>
                    <div className="text-xs md:text-sm text-zinc-300 pl-4 border-l border-zinc-700">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 md:py-32 relative overflow-hidden border-t border-zinc-800">
        {/* Background: hero banner at low opacity */}
        <div className="absolute inset-0 z-0">
          <img src={HERO_BANNER_URL} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center reveal">
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-6 text-[#ccff00]" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Make Your Card
          </h2>
          <p className="text-zinc-300 mb-10 text-base md:text-lg">
            今すぐあなただけのトレーディングカードを作成しよう。
          </p>
          <button
            onClick={() => setLocation("/create")}
            className="px-12 py-5 bg-[#ccff00] text-black font-black italic uppercase text-xl tracking-widest rounded hover:bg-[#aadd00] hover:scale-105 transition-all duration-200 shadow-[0_0_50px_rgba(204,255,0,0.6)]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            カードを作成する →
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-10 bg-black border-t border-zinc-800 text-center">
        <img src={LOGO_URL} alt="FIT WARS" className="h-10 mx-auto mb-4 opacity-60 object-contain" />
        <p className="text-zinc-600 text-xs">© 2024 FIT WARS. All rights reserved.</p>
      </footer>

      <style>{`
        .reveal { opacity: 0; transform: translateY(2rem); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
      `}</style>
    </div>
  );
}
