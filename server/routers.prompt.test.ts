/**
 * routers.prompt.test.ts
 *
 * v6 — 超精巧ファンタジーイラスト変換ロジック（de91fbb6）復元確認
 * APIエラー解消済み（DALL-E 3 images/generations使用）
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const routersSource = readFileSync(
  resolve(__dirname, "./routers.ts"),
  "utf-8"
);

describe("v6: gpt-image-1 editモードが使われていない（APIエラー解消確認）", () => {
  it("images/editsエンドポイントを使用していない", () => {
    expect(routersSource).not.toContain("images/edits");
  });

  it("gpt-image-1モデルを使用していない", () => {
    expect(routersSource).not.toContain('"gpt-image-1"');
  });

  it("DALL-E 3 images/generationsエンドポイントを使用している", () => {
    expect(routersSource).toContain("images/generations");
  });

  it("dall-e-3モデルを使用している", () => {
    expect(routersSource).toContain("dall-e-3");
  });
});

describe("v6: 超精巧ファンタジーイラスト変換 — MASTER_RULE 5ルール", () => {
  it("MASTER_RULEが定義されている", () => {
    expect(routersSource).toContain("MASTER_RULE");
  });

  it("RULE 1 — 表情同期が含まれている", () => {
    expect(routersSource).toContain("FACIAL EXPRESSION SYNC");
    expect(routersSource).toContain("smile shape");
    expect(routersSource).toContain("eye squint angle");
  });

  it("RULE 2 — 持ち物ファンタジー置換が含まれている", () => {
    expect(routersSource).toContain("OBJECT TRANSLATION");
    expect(routersSource).toContain("Elemental energy crystal");
  });

  it("RULE 3 — SSRグラフィック品質が含まれている", () => {
    expect(routersSource).toContain("SSR QUALITY STANDARD");
    expect(routersSource).toContain("High-end 2D game splash art");
    expect(routersSource).toContain("Semi-chibi proportions");
  });

  it("RULE 4 — 色彩継承が含まれている", () => {
    expect(routersSource).toContain("COLOR PALETTE INHERITANCE");
    expect(routersSource).toContain("dominant colors");
  });

  it("RULE 5 — ポーズ・顔固定が含まれている", () => {
    expect(routersSource).toContain("POSE & FACE LOCK");
    expect(routersSource).toContain("zero deviation");
  });
});

describe("v6: GPT-4o Vision 6軸分析", () => {
  it("GPT-4o visionモデルを使用している", () => {
    expect(routersSource).toContain("gpt-4o");
  });

  it("AXIS 1 — 表情力学の分析が含まれている", () => {
    expect(routersSource).toContain("AXIS 1");
    expect(routersSource).toContain("FACIAL EXPRESSION MECHANICS");
  });

  it("AXIS 2 — 顔構造の分析が含まれている", () => {
    expect(routersSource).toContain("AXIS 2");
    expect(routersSource).toContain("FACE STRUCTURE");
  });

  it("AXIS 4 — 持ち物・背景の分析が含まれている", () => {
    expect(routersSource).toContain("AXIS 4");
    expect(routersSource).toContain("HELD OBJECTS");
  });

  it("AXIS 6 — ポーズの分析が含まれている", () => {
    expect(routersSource).toContain("AXIS 6");
    expect(routersSource).toContain("POSE");
  });

  it("写真をbase64でGPT-4oに送信している", () => {
    expect(routersSource).toContain("image_url");
    expect(routersSource).toContain("base64");
  });
});

describe("v6: 5職業の定義", () => {
  it("CHARACTER_PROMPTSに5職業が定義されている", () => {
    expect(routersSource).toContain("CHARACTER_PROMPTS");
    expect(routersSource).toContain("Hero");
    expect(routersSource).toContain("Priest");
    expect(routersSource).toContain("Mage");
    expect(routersSource).toContain("DemonLord");
    expect(routersSource).toContain("Swordsman");
  });

  it("Dragon Quest-style Cosplay/Outfit（服装限定）が含まれている", () => {
    expect(routersSource).toContain("Dragon Quest-style Cosplay/Outfit");
  });

  it("ランダム職業選択が実装されている", () => {
    expect(routersSource).toContain("CHARACTER_KEYS");
    expect(routersSource).toContain("Math.random()");
  });
});

describe("v6: DALL-E 3 パラメーター設定", () => {
  it("quality: hdが設定されている", () => {
    expect(routersSource).toContain('"hd"');
  });

  it("style: naturalが設定されている（元画像への忠実度優先）", () => {
    expect(routersSource).toContain('"natural"');
  });

  it("response_format: b64_jsonが設定されている", () => {
    expect(routersSource).toContain("b64_json");
  });
});
