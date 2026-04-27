/**
 * routers.prompt.test.ts
 *
 * v4 Clean Reset — 仕様書（pasted_content_2.txt）のプロンプトが正しく実装されているか検証
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const routersSource = readFileSync(
  resolve(__dirname, "./routers.ts"),
  "utf-8"
);

describe("Clean Reset: 仕様書のプロンプトが正しく実装されている", () => {
  it("旧ルールブロック（NO_TEXT_BLOCK）が削除されている", () => {
    expect(routersSource).not.toContain("NO_TEXT_BLOCK");
  });

  it("旧ルールブロック（AGE_ANCHOR_BLOCK）が削除されている", () => {
    expect(routersSource).not.toContain("AGE_ANCHOR_BLOCK");
  });

  it("旧ルールブロック（THICK_PAINT_BLOCK）が削除されている", () => {
    expect(routersSource).not.toContain("THICK_PAINT_BLOCK");
  });

  it("旧ルールブロック（MASTER_RULE）が削除されている", () => {
    expect(routersSource).not.toContain("MASTER_RULE");
  });
});

describe("5職業プロンプトの実装確認", () => {
  it("Hero（勇者）プロンプトが定義されている", () => {
    expect(routersSource).toContain("HERO_PROMPT");
    expect(routersSource).toContain("chibi HERO");
    expect(routersSource).toContain("Dragon Quest");
  });

  it("Priest（僧侶）プロンプトが定義されている", () => {
    expect(routersSource).toContain("PRIEST_PROMPT");
    expect(routersSource).toContain("chibi PRIEST");
  });

  it("Mage（魔法使い）プロンプトが定義されている", () => {
    expect(routersSource).toContain("MAGE_PROMPT");
    expect(routersSource).toContain("chibi MAGE");
  });

  it("DemonLord（魔王）プロンプトが定義されている", () => {
    expect(routersSource).toContain("DEMON_LORD_PROMPT");
    expect(routersSource).toContain("chibi DEMON LORD");
  });

  it("Swordsman（剣士）プロンプトが定義されている", () => {
    expect(routersSource).toContain("SWORDSMAN_PROMPT");
    expect(routersSource).toContain("chibi SWORDSMAN");
  });
});

describe("仕様書の重要指示が全プロンプトに含まれている", () => {
  it("ポーズ維持の指示が含まれている（Hero）", () => {
    expect(routersSource).toContain("Faithfully preserve the original pose");
  });

  it("顔の特徴保持の指示が含まれている（Hero）", () => {
    expect(routersSource).toContain("Preserve facial structure, expression, eye shape");
  });

  it("服の色継承の指示が含まれている（Hero）", () => {
    expect(routersSource).toContain("strictly preserving the original clothing color palette");
  });

  it("背景は服の色から派生する指示が含まれている", () => {
    expect(routersSource).toContain("derived from the dominant clothing color");
  });

  it("チビ比率の指示が含まれている", () => {
    expect(routersSource).toContain("chibi proportion");
  });

  it("フォトリアリズム禁止が含まれている", () => {
    expect(routersSource).toContain("Avoid photorealism");
  });
});

describe("gpt-image-1 APIの使用確認", () => {
  it("gpt-image-1モデルを使用している", () => {
    expect(routersSource).toContain("gpt-image-1");
  });

  it("images/editsエンドポイントを使用している", () => {
    expect(routersSource).toContain("images/edits");
  });

  it("写真をFormDataで送信している", () => {
    expect(routersSource).toContain("multipart/form-data");
  });

  it("ランダム職業選択が実装されている", () => {
    expect(routersSource).toContain("CHARACTER_KEYS");
    expect(routersSource).toContain("Math.random()");
  });
});
