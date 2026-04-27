import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const BGM_URL = "/manus-storage/bgm_a4cfeefc.mp3";
const LOGO_URL = "/manus-storage/fitwars-logo_890a85a0.png";
const CARD_FIRE_URL = "/manus-storage/card-fire_a21758fe.png";
const CARD_WATER_URL = "/manus-storage/card-water_41be0131.png";
const CARD_GRASS_URL = "/manus-storage/card-grass_a6a91d27.png";
const CARD_DARK_URL = "/manus-storage/card-dark_6f0fa171.png";

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
          {["service", "benefits", "system", "rule"].map((id) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-white text-3xl font-black italic uppercase my-3 hover:text-[#ccff00] transition-colors"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {id === "service" ? "目的" : id === "benefits" ? "メリット" : id === "system" ? "サービス概要" : "ルール説明"}
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
      <header className="fixed top-0 left-0 w-full z-[5000] px-6 py-4 bg-black/85 backdrop-blur-md border-b border-[#ccff00]/30 flex justify-between items-center">
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <img src={LOGO_URL} alt="FIT WARS" className="h-8 md:h-12" />
        </a>
        <div className="flex items-center ml-auto gap-4">
          <nav className="hidden lg:flex items-center gap-8 mr-4">
            {[
              { id: "service", label: "目的" },
              { id: "benefits", label: "メリット" },
              { id: "system", label: "サービス概要" },
              { id: "rule", label: "ルール説明" },
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

      {/* Hero Section */}
      <section className="min-h-[60vh] md:min-h-screen flex flex-col justify-center items-center relative overflow-x-hidden pt-24 md:pt-32 pb-12 md:pb-20 bg-black">
        <div className="text-center relative z-20 px-4 w-full max-w-6xl mx-auto">
          <img src={LOGO_URL} alt="FIT WARS" className="w-64 md:w-96 mx-auto mb-6 drop-shadow-[0_0_40px_rgba(204,255,0,0.5)]" />
          <p className="text-white font-black italic tracking-[0.5em] uppercase mt-2 md:mt-4 mb-6 text-base md:text-2xl" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Trading Card × Event Content
          </p>
          <div className="inline-block bg-white text-black px-10 py-3 mb-8">
            <p className="font-black italic text-lg md:text-xl" style={{ fontFamily: "'Noto Sans JP', sans-serif", letterSpacing: "-0.05em" }}>
              オリジナルカードを作って、その場で遊べる。
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {[CARD_FIRE_URL, CARD_WATER_URL, CARD_GRASS_URL, CARD_DARK_URL].map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`card-${i}`}
                className="w-28 md:w-36 rounded-lg shadow-2xl hover:scale-110 hover:-rotate-3 transition-transform duration-300"
                style={{ filter: "drop-shadow(0 0 12px rgba(204,255,0,0.3))" }}
              />
            ))}
          </div>
          <button
            onClick={() => setLocation("/create")}
            className="mt-10 px-10 py-4 bg-[#ccff00] text-black font-black italic uppercase text-lg tracking-widest rounded hover:bg-[#aadd00] hover:scale-105 transition-all duration-200 shadow-[0_0_30px_rgba(204,255,0,0.5)]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            カードを作成する →
          </button>
        </div>
      </section>

      {/* Service Section */}
      <section id="service" className="py-12 md:py-20 bg-zinc-900 relative overflow-hidden border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 reveal opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-4xl md:text-6xl italic font-black mb-16 uppercase tracking-tighter text-center text-[#ccff00]" style={{ fontFamily: "'Oswald', sans-serif" }}>
            What is FIT WARS?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: "🎴", title: "オリジナルカード", desc: "自分の写真とステータスで世界に1枚だけのトレーディングカードを作成" },
              { icon: "⚔️", title: "その場でバトル", desc: "属性・攻撃力・アビリティを駆使してリアルタイムで対戦" },
              { icon: "🤝", title: "交流が生まれる", desc: "カードを通じた自然なコミュニケーションでイベントが盛り上がる" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-8 border border-zinc-800 hover:border-[#ccff00] hover:-translate-y-2 transition-all duration-300 bg-zinc-900/50">
                <div className="text-5xl mb-4">{icon}</div>
                <h3 className="text-xl font-black italic uppercase mb-3">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-12 md:py-20 bg-black relative overflow-hidden border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 reveal opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-4xl md:text-6xl italic font-black mb-16 uppercase tracking-tighter text-center" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Benefits
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { label: "参加者の熱量UP", color: "border-[#ccff00]", textColor: "text-[#ccff00]", desc: "自分だけのカードへの愛着がイベント参加意欲を高める" },
              { label: "SNS拡散力", color: "border-red-500", textColor: "text-red-500", desc: "カード画像のシェアでオーガニックな口コミが広がる" },
              { label: "滞在時間増加", color: "border-blue-400", textColor: "text-blue-400", desc: "公園のような「楽しい場」が滞在・回遊時間を自然に延ばす" },
            ].map(({ label, color, textColor, desc }) => (
              <div key={label} className={`p-8 border-l-4 ${color} bg-zinc-900/50 hover:bg-zinc-800 transition-colors`}>
                <p className={`text-2xl font-black italic uppercase mb-3 ${textColor}`}>{label}</p>
                <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System / How to play */}
      <section id="system" className="py-12 md:py-20 bg-zinc-900 relative border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 reveal opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-4xl md:text-6xl italic font-black mb-24 uppercase tracking-tighter text-center" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Service
          </h2>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              {
                step: "STEP 01",
                icon: (
                  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <path d="M12 18h.01" />
                  </svg>
                ),
                title: "スマホでアクセス",
                desc: "QRコードからWebページへ。専用アプリは不要です。",
              },
              {
                step: "STEP 02",
                icon: (
                  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                ),
                title: "カード生成",
                desc: "画像を自由に選択し、ステータスを入力。自分だけのカードを作成。",
              },
              {
                step: "STEP 03",
                icon: (
                  <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                ),
                title: "その場で印刷",
                desc: "市販プリンターで即時出力。所要時間は約2分。",
              },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="relative mt-8">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-white font-black px-4 py-1 text-xl italic z-20" style={{ fontFamily: "'Oswald', sans-serif", transform: "translateX(-50%) skewX(-10deg)" }}>
                  {step}
                </div>
                <div className="group p-10 border border-zinc-800 bg-zinc-900/50 hover:border-[#ccff00] hover:bg-zinc-900 hover:-translate-y-2 transition-all duration-300">
                  <div className="text-[#ccff00] mb-6 flex justify-center group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(204,255,0,0.8)] transition-transform duration-300">
                    {icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 uppercase italic">{title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section id="rule" className="py-12 md:py-20 bg-black relative border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 reveal opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-4xl md:text-6xl italic font-black mb-16 uppercase tracking-tighter text-center" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Rules
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Attribute chart */}
            <div>
              <h3 className="text-2xl md:text-3xl font-black italic mb-8 border-l-8 border-[#ccff00] pl-4">ELEMENTS</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "火", color: "border-red-500", glow: "shadow-[0_0_20px_#ef4444]", desc: "草に強い・水に弱い" },
                  { name: "水", color: "border-blue-400", glow: "shadow-[0_0_20px_#60a5fa]", desc: "火に強い・草に弱い" },
                  { name: "草", color: "border-green-500", glow: "shadow-[0_0_20px_#22c55e]", desc: "水に強い・火に弱い" },
                  { name: "闇", color: "border-purple-500", glow: "shadow-[0_0_20px_#a855f7]", desc: "全属性に有利" },
                ].map(({ name, color, glow, desc }) => (
                  <div key={name} className={`p-4 border ${color} bg-zinc-900/80 text-center ${glow} hover:scale-105 transition-transform`}>
                    <span className="text-3xl font-black">{name}</span>
                    <p className="text-xs text-zinc-400 mt-2">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-zinc-500">※闇属性は全属性に有利（デッキに2枚まで）</p>
            </div>
            {/* Abilities */}
            <div>
              <h3 className="text-2xl md:text-3xl font-black italic mb-8 border-l-8 border-[#ccff00] pl-4">ABILITIES</h3>
              <p className="text-zinc-400 mb-6 text-sm">上級者向けルール：特殊効果の発動</p>
              <div className="space-y-3">
                {[
                  { name: "BOOST", color: "border-red-500", textColor: "text-red-500", desc: "同属性+20：自分の攻撃力を+20" },
                  { name: "CURSE", color: "border-purple-500", textColor: "text-purple-500", desc: "相手攻撃力-10：相手の攻撃力を-10" },
                  { name: "BREAK", color: "border-yellow-500", textColor: "text-yellow-500", desc: "属性効果無効：属性の不利を打ち消す" },
                  { name: "VOID", color: "border-blue-400", textColor: "text-blue-400", desc: "引き分け：勝負を引き分けにする" },
                  { name: "LOCK", color: "border-zinc-500", textColor: "text-zinc-400", desc: "特殊効果無効：相手の特殊効果を無効にする" },
                ].map(({ name, color, textColor, desc }) => (
                  <div key={name} className={`flex items-center bg-zinc-900/80 p-3 border-l-4 ${color} hover:bg-zinc-800 transition-colors`}>
                    <div className={`w-16 md:w-20 font-black italic ${textColor} shrink-0 text-base md:text-lg`} style={{ fontFamily: "'Oswald', sans-serif" }}>{name}</div>
                    <div className="text-xs md:text-sm text-zinc-300 pl-4 border-l border-zinc-700">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-zinc-900 border-t border-zinc-800 text-center">
        <div className="max-w-2xl mx-auto px-6 reveal opacity-0 translate-y-8 transition-all duration-700">
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-6 text-[#ccff00]" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Make Your Card
          </h2>
          <p className="text-zinc-400 mb-10 text-base md:text-lg">
            今すぐあなただけのトレーディングカードを作成しよう。
          </p>
          <button
            onClick={() => setLocation("/create")}
            className="px-12 py-5 bg-[#ccff00] text-black font-black italic uppercase text-xl tracking-widest rounded hover:bg-[#aadd00] hover:scale-105 transition-all duration-200 shadow-[0_0_40px_rgba(204,255,0,0.5)]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            カードを作成する →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-black border-t border-zinc-800 text-center">
        <img src={LOGO_URL} alt="FIT WARS" className="h-8 mx-auto mb-4 opacity-60" />
        <p className="text-zinc-600 text-xs">© 2024 FIT WARS. All rights reserved.</p>
      </footer>

      <style>{`
        .reveal { opacity: 0; transform: translateY(2rem); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
      `}</style>
    </div>
  );
}
