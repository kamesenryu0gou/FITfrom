/**
 * AIPasswordModal.tsx
 * AI加工ボタン押下時に表示するパスワード保護モーダル
 * パスワード: Makefrom1
 */
import { useState, useRef, useEffect } from "react";

interface AIPasswordModalProps {
  /** モーダルを表示するか */
  open: boolean;
  /** パスワード認証成功時のコールバック */
  onSuccess: () => void;
  /** キャンセル時のコールバック */
  onCancel: () => void;
}

const CORRECT_PASSWORD = "Makefrom1";

export default function AIPasswordModal({ open, onSuccess, onCancel }: AIPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // モーダルが開くたびに入力をリセットしてフォーカス
  useEffect(() => {
    if (open) {
      setPassword("");
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (password === CORRECT_PASSWORD) {
      setPassword("");
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: "#11082f",
          border: "3px solid #5ab520",
          borderRadius: "20px",
          padding: "32px 28px",
          width: "min(92vw, 420px)",
          boxShadow: "0 0 40px rgba(90,181,32,0.3), 0 20px 60px rgba(0,0,0,0.8)",
          textAlign: "center",
        }}
      >
        {/* アイコン */}
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔒</div>

        {/* タイトル */}
        <h2 style={{
          color: "#7adb3a",
          fontSize: "18px",
          fontWeight: 800,
          marginBottom: "8px",
          fontFamily: "'Noto Sans JP', sans-serif",
        }}>
          AI加工パスワード認証
        </h2>

        {/* 案内メッセージ */}
        <p style={{
          color: "#ccccdd",
          fontSize: "14px",
          lineHeight: 1.7,
          marginBottom: "24px",
          fontFamily: "'Noto Sans JP', sans-serif",
        }}>
          係の人に操作を依頼してください。
        </p>

        {/* パスワード入力 */}
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          onKeyDown={handleKeyDown}
          placeholder="パスワードを入力"
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "10px",
            border: `2px solid ${error ? "#ff4466" : "#2a2a4a"}`,
            background: "#0d0d20",
            color: "#ffffff",
            fontSize: "16px",
            fontFamily: "'Noto Sans JP', sans-serif",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: "8px",
            transition: "border-color 0.2s",
          }}
        />

        {/* エラーメッセージ */}
        {error && (
          <p style={{
            color: "#ff4466",
            fontSize: "13px",
            marginBottom: "16px",
            fontFamily: "'Noto Sans JP', sans-serif",
          }}>
            パスワードが違います
          </p>
        )}
        {!error && <div style={{ marginBottom: "16px" }} />}

        {/* ボタン群 */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px",
              border: "2px solid #444",
              borderRadius: "10px",
              background: "transparent",
              color: "#aaaaaa",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 2,
              padding: "12px",
              border: "2px solid #3a8a10",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #5ab520, #3a8a10)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 4px 0 #1a5000",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            加工を開始する
          </button>
        </div>
      </div>
    </div>
  );
}
