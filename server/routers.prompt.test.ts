/**
 * routers.prompt.test.ts
 *
 * v5 — DALL-E 3 新規生成モード（gpt-image-1 editモード廃止）
 * APIエラー解消・テキスト排除・年齢固定・厚塗り品質の検証
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const routersSource = readFileSync(
  resolve(__dirname, "./routers.ts"),
  "utf-8"
);

describe("v5: gpt-image-1 editモードが廃止されている", () => {
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

describe("v5: GPT-4o Visionによる特徴抽出", () => {
  it("extractPersonFeatures関数が定義されている", () => {
    expect(routersSource).toContain("extractPersonFeatures");
  });

  it("GPT-4o visionモデルを使用している", () => {
    expect(routersSource).toContain("gpt-4o");
  });

  it("写真をbase64でGPT-4oに送信している", () => {
    expect(routersSource).toContain("image_url");
    expect(routersSource).toContain("base64");
  });
});

describe("v5: buildDalle3Prompt関数の品質ルール", () => {
  it("buildDalle3Prompt関数が定義されている", () => {
    expect(routersSource).toContain("buildDalle3Prompt");
  });

  it("テキスト完全排除ルールが含まれている", () => {
    expect(routersSource).toContain("NO text");
    expect(routersSource).toContain("NO letters");
    expect(routersSource).toContain("NO numbers");
    expect(routersSource).toContain("NO watermark");
    expect(routersSource).toContain("NO captions");
  });

  it("年齢・顔の固定ルールが含まれている", () => {
    expect(routersSource).toContain("do NOT rejuvenate or idealize");
    expect(routersSource).toContain("Preserve exact facial structure");
  });

  it("高品質厚塗りスタイルが含まれている", () => {
    expect(routersSource).toContain("Masterpiece");
    expect(routersSource).toContain("high-end TCG splash art");
    expect(routersSource).toContain("Rich digital painting");
    expect(routersSource).toContain("SSR game card quality");
  });

  it("Dragon Quest-style cosplay（服装限定）が含まれている", () => {
    expect(routersSource).toContain("Dragon Quest-style cosplay outfit");
  });
});

describe("v5: 5職業の定義", () => {
  it("JOBSに5職業が定義されている", () => {
    expect(routersSource).toContain("Hero");
    expect(routersSource).toContain("Priest");
    expect(routersSource).toContain("Mage");
    expect(routersSource).toContain("DemonLord");
    expect(routersSource).toContain("Swordsman");
  });

  it("各職業にJRPGアウトフィットが定義されている", () => {
    expect(routersSource).toContain("JRPG hero");
    expect(routersSource).toContain("JRPG healer");
    expect(routersSource).toContain("JRPG mage");
    expect(routersSource).toContain("JRPG demon lord");
    expect(routersSource).toContain("JRPG warrior");
  });

  it("ランダム職業選択が実装されている", () => {
    expect(routersSource).toContain("Math.random()");
  });
});

describe("v5: DALL-E 3 パラメーター設定", () => {
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

describe("v5: 旧バージョンの残骸がない", () => {
  it("NO_TEXT_BLOCKが削除されている", () => {
    expect(routersSource).not.toContain("NO_TEXT_BLOCK");
  });

  it("AGE_ANCHOR_BLOCKが削除されている", () => {
    expect(routersSource).not.toContain("AGE_ANCHOR_BLOCK");
  });

  it("THICK_PAINT_BLOCKが削除されている", () => {
    expect(routersSource).not.toContain("THICK_PAINT_BLOCK");
  });

  it("MASTER_RULEが削除されている", () => {
    expect(routersSource).not.toContain("MASTER_RULE");
  });

  it("HERO_PROMPT定数が削除されている（v5はJOBS配列に統合）", () => {
    expect(routersSource).not.toContain("const HERO_PROMPT");
  });
});
