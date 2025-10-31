# 🎯 詳細設計書（Detail Design Document）

### 対象：詳細診断モジュール（MBTI＋Big Five＋自由記述 → ストーリー生成）

---

## 1. 機能概要（Feature Overview）

### 機能名

**詳細性格診断（Deep Personality Analysis）**

### 機能目的

ユーザーの回答（選択＋自由記述）から

* MBTIタイプ
* Big Five性格特性スコア
* 補助軸（ストレス耐性・適応力・価値観など）
  を推定し、
  それに基づいてパーソナライズされた短編物語を生成する。

### 主な特徴

| 要素     | 内容                                                        |
| ------ | --------------------------------------------------------- |
| 質問数    | 約30〜50問（選択式＋自由記述）                                         |
| 入力形式   | Likertスケール（5段階）＋自由記述                                      |
| 出力     | MBTIタイプ（16タイプ）＋Big Fiveスコア＋要約レポート＋物語生成                    |
| 生成AI   | 無料利用可能モデル（例：**Gemini 1.5 Flash** または **ChatGPT-4o-mini**） |
| 想定利用時間 | 約5〜10分                                                    |

---

## 2. 構成概要（System Modules）

```
[UI層]
 ├─ 質問表示コンポーネント（選択式／自由記述）
 ├─ 回答進捗バー
 ├─ スコア結果画面（MBTI＋Big Five＋物語）
 └─ 再診断ボタン／物語シェア機能

[API層]
 ├─ /api/questions/detail        ← 設問データ取得
 ├─ /api/diagnose/detail         ← 回答データ→スコア計算＋AI推定
 ├─ /api/story/generate          ← ストーリー生成（AI呼び出し）
 └─ /api/log                     ← 分析ログ保存（任意）

[AI層]
 ├─ MBTIタイプ分類ロジック
 ├─ Big Fiveスコア算出
 ├─ 物語生成プロンプト
 └─ AI応答制御（出力長・トーン調整）
```

---

## 3. データ構造設計

### (1) 質問データ構造

```ts
interface Question {
  id: string;
  section: "MBTI" | "BIGFIVE" | "SUPPLEMENT" | "OPEN";
  axis?: string; // 例: "E-I", "Openness", "StressTolerance"
  text: string;
  type: "scale" | "text";
  options?: string[]; // Likert選択肢など
  weight?: number; // 各質問の重み
}
```

例（1問目）：

```json
{
  "id": "Q01",
  "section": "MBTI",
  "axis": "E-I",
  "text": "社交の場で、まず自分から話しかけることが多いですか？",
  "type": "scale",
  "options": ["全く当てはまらない", "やや当てはまらない", "どちらともいえない", "やや当てはまる", "非常に当てはまる"],
  "weight": 1.0
}
```

### (2) 回答データ構造

```ts
interface Answer {
  questionId: string;
  score?: number; // Likert選択回答
  text?: string;  // 自由記述回答
}
```

### (3) スコア出力データ構造

```ts
interface PersonalityResult {
  mbtiType: string;  // 例: "INFP"
  bigFive: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  supplements: {
    stressTolerance: number;
    adaptability: number;
    valueFlexibility: number;
  };
  summaryText: string;
}
```

---

## 4. スコア算出ロジック（MVP簡易版）

### (1) MBTI推定ロジック

* 各軸ごとにスコア平均を求める（例：E–I軸で、E寄り質問の平均 − I寄り質問の平均）
* 各軸で正の値なら前者（E, S, T, J）、負の値なら後者（I, N, F, P）
* 結合して16タイプを生成
  → 例：`I + N + F + P = INFP`

### (2) Big Fiveスコア算出

* 各特性軸に属する質問スコアの平均を0–100スケールに正規化
* 各軸は後続のストーリー生成でプロンプトパラメータとして利用

### (3) 補助軸（補足指標）

* 回答傾向に応じて ±10%の補正を付与
  例：自由記述内に「不安」「心配」などが多い → 神経症傾向を＋10%

---

## 5. AI推定プロンプト設計

### (1) MBTI＋Big Five判定用

```text
あなたは心理分析AIです。以下のデータからユーザーの性格を分析してください。

【データ概要】
- MBTI関連質問スコア: {{MBTI_data}}
- Big Five関連質問スコア: {{BigFive_data}}
- 補助軸: {{Supplement_data}}
- 自由記述回答: {{OpenAnswers}}

【出力フォーマット】
{
  "mbtiType": "XXXX",
  "bigFive": {
    "openness": 0-100,
    "conscientiousness": 0-100,
    "extraversion": 0-100,
    "agreeableness": 0-100,
    "neuroticism": 0-100
  },
  "supplements": {
    "stressTolerance": 0-100,
    "adaptability": 0-100,
    "valueFlexibility": 0-100
  },
  "summaryText": "100字程度で分析要約"
}
```

### (2) 物語生成プロンプト

```text
あなたは心理小説家です。以下の性格データをもとに、その人の性格や価値観を象徴する短編物語を生成してください。

【性格データ】
MBTIタイプ: {{mbtiType}}
Big Five: {{bigFive}}
補助軸: {{supplements}}
自由記述のキーワード: {{keywords}}

【出力要件】
- 文字数: 約600〜800字
- トーン: 共感的でポジティブ（哲学的・内省的でも可）
- 構成: 
  1. 導入（性格を象徴する日常や場面）
  2. 転機（性格的特徴が試される出来事）
  3. 結末（その人らしい選択／学び）
  4. 一文のまとめ：「あなたの次のチャプターへ——」
```

---

## 6. 画面仕様（MVP版）

| 画面       | 内容                        | 備考              |
| -------- | ------------------------- | --------------- |
| 詳細診断スタート | 説明＋開始ボタン                  | 「簡単診断」へのリンクも表示  |
| 設問画面     | 質問文・選択肢・進捗バー              | 1問ずつ出題（会話式UIも可） |
| 自由記述画面   | テキストエリア＋次へボタン             | 自動保存機能あり        |
| 分析処理中    | 「あなたの回答を分析しています…」         | AI呼び出し時間短縮      |
| 結果画面     | MBTIタイプ＋Big Fiveグラフ＋要約＋物語 | 「再診断」「共有」ボタンあり  |

---

## 7. 利用AIモデル（無料利用前提）

| 用途             | モデル                                               | 備考              |
| -------------- | ------------------------------------------------- | --------------- |
| MBTI・BigFive判定 | **Gemini 1.5 Flash (Google AI Studio)**           | 無料で高速応答／API利用可能 |
| 物語生成           | **ChatGPT-4o-mini (OpenAI)** または **Gemini Flash** | 無料層でも自然な文章生成が可能 |
| 自由記述要約         | **Gemini Flash**                                  | 軽量＆高速処理向け       |

※ どちらも個人開発用途で商用利用が容易（利用規約要確認）

---

## 8. MVP検証項目

| 検証項目     | 評価基準                     |
| -------- | ------------------------ |
| 診断精度     | 同一ユーザーが再回答しても類似タイプに収束するか |
| 離脱率      | 30問中、最後まで完了する割合が70%以上か   |
| ストーリー満足度 | 物語の内容に「自分らしさ」を感じると答えた割合  |
| レスポンス速度  | AI応答平均2秒以内（Gemini使用時）    |

---

## 9. 今後の拡張想定

* 診断履歴保存／再診断比較機能
* キャラクター生成連動（AIアバターやボイス付き）
* 物語世界観の選択（SF / ファンタジー / 恋愛 など）
* Big Five／MBTIの結果を用いた相性診断・マッチングモード

---
