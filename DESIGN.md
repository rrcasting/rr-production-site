# DESIGN.md — Rr.production's 版 v2（エディトリアル／Mesh ベース）

作成: 2026-09-20。元は Refero Styles「Mesh」の DESIGN.md（Richard が選定・2案目）。
**1案目（Index／ブループリント・9/19）は「殺風景」で不採用。** その `index3.html` は消す。
**御社用に改造した点**：①写真を主役として残す ②唯一の有彩色を Mesh の銅色 `#f2b98b` → 御社の金 `#C9A84C` に ③有料フォント Verlag / Chronicle → Google Fonts。
**このファイルが唯一の色・フォント・余白・部品の基準。** Claude Code はここに無い値を使わない。

---

## 世界観（1段落）

夜の編集室。ほぼ黒の紙に、下から金色の光がにじむ。文字は雑誌の見開きのように組む：細く広い字間の大文字ラベル、縦に高い極太の見出し、ゆったりした本文。色は金1色を「線と光」として使い、塗りには使わない。面は平ら、罫線は髪の毛の細さ、影は1種類だけ。**その誌面に、キャストの実写真を大きく貼る**——写真は無加工、角丸16px、顔を切らない。「殺風景」にしないのは、①下からの金の光 ②縦長の大見出し ③写真の大きさ、の3つ。

---

## 色

| 名前 | 値 | 用途 |
|---|---|---|
| Canvas | `#0f0f10` | ページ背景・ヒーロー・フッター |
| Layer | `#1d1d1f` | 一段上の面：カード・パネル・ナビのピル |
| Bone | `#fefef7` | 主テキスト・**塗りボタンの背景**・バッジの枠。純白は使わない |
| Cream | `#f7f3ee` | 明るい面（使うなら1セクションだけ）・グラデーションの終点 |
| Ash | `#b3b3b3` | 二次テキスト・髪の毛の罫線・区切り |
| Mute | `#666666` | 三次テキスト・非活性 |
| Steel | `#868f97` | 補助テキスト・アイコンの線 |
| **Gold** | **`#C9A84C`** | **唯一の有彩色。** 枠線ボタン・リンクの下線・ラベルの1語・罫線の一部・写真の角のラベル。**塗りボタンにしない** |
| Gold Light | `#E2C77A` | 金の明るい版：装飾罫・グラデーションの明るい側 |
| **Gold Wash** | `linear-gradient(95deg, #8A6B2A 0%, #E2C77A 100%)` | **画面下部から上ににじむ「地平線の光」**。ヒーローの下端とフッター上に置く。部品の中には入れない |

禁止：緑（現行の WhatsApp 緑 `#22c55e` は廃止。WhatsApp ボタンは Gold の枠線ボタン）・赤・青・紫。有彩色は Gold 系の3つだけ。

---

## フォント（Google Fonts・この4つだけ）

| 役割 | フォント | 太さ | 備考 |
|---|---|---|---|
| 大見出し（EN/ES） | **Oswald** | **700** | Verlag Condensed の代替。縦に高い。字間 +0.014em・行間 1.0 |
| 大見出し（JA） | **Noto Sans JP** | **900** | 日本語に縦長書体は無い。字間 0・行間 1.15 |
| UI・本文（3言語） | **Inter** / Noto Sans JP | 400・600・700 | 600＝ナビ・ラベル、700＝ボタン・カード見出し |
| 編集的な一文（1ページに1回だけ） | **Noto Serif JP**（JA）／ **Source Serif 4**（EN/ES） | 400 | 22px・行間 1.55。「About」の冒頭1文にだけ使う |

現行の Playfair Display は**使わない**。

### 文字サイズ（この8段だけ）

| 役割 | サイズ | 行間 | 字間 |
|---|---|---|---|
| eyebrow（大文字ラベル） | 10px | 1.1 | **+0.167em** |
| badge | 12px | 1.2 | +0.063em |
| body | 14px | 1.4 | 0 |
| body-lg | 16px | 1.38 | +0.013em |
| subheading | 18px | 1.35 | 0 |
| heading-sm | 20px | 1.33 | 0 |
| editorial（セリフ） | 22px | 1.55 | 0 |
| display | **64px（PC）／ 44px（390px）** | 1.0 | +0.014em |

JA の display は 44px（PC）／ 32px（スマホ）。**大文字ラベルの広い字間（+0.167em）がこのデザインの署名。** 小さく・広く・大文字。

---

## 余白・形・影

- ページ最大幅 1200px。セクション間 80px（スマホ 56px）。カード内 24px。要素間 10px
- 角丸：**ボタン 6px／バッジ 12px／カード 16px／写真 16px／丸アバター 36px（円）／ナビのピル 9999px**。この階層を崩さない
- 影は1種類だけ：`rgba(0,0,0,.06) 0 0 0 1px, rgba(0,0,0,.08) -8px 12px 22px 0`（カードのみ）。ぼかしの大きい影・光彩は禁止

---

## 部品

### 1. ナビ
ロゴ左（Bone・Inter 600）。中央に**ピル**（9999px・半透明の Layer）の中に言語切替 `ENGLISH / ESPAÑOL / 日本語`（Inter 600・12px・大文字・字間 +0.071em・**`data-code` 方式のまま**）。右に塗りボタン「登録する」。スクロールで Canvas の地＋髪の毛の下線。既存の `#lang-bar`・`#sticky-cta` は**残す**（見た目だけ合わせる）。

### 2. ヒーロー
中央1列・最大幅 720px：
- eyebrow（10px・+0.167em・Ash）例 `FOREIGN TALENT CASTING · JAPAN`（既存の文字）
- **大見出し**（Oswald 700 / 64px・Bone）。**金は1語だけ**（既存の `.accent` の範囲）
- サブテキスト 16px Ash・最大幅 600px・中央
- **ボタン2本**：塗り（Bone 地・Canvas 文字・大文字・字間 +0.063em）＝「登録する」／ 枠線 Gold ＝「制作会社の方 → WhatsApp」
- **その下に「写真カード」**：Layer の地・角丸16px・髪の毛の枠・影1種類。中に **キャスト写真 6〜8 枚のコラージュ**（各16px角丸・無加工）。Mesh ではアプリ画面の模型が入る場所に、御社は写真を入れる。**カードの下半分に Gold Wash が下からにじむ**
- 写真カードの直下に「Past project platforms」の**文字列ストリップ**（Netflix / ABEMA / TV / Theaters＝既存文字・Ash・ロゴ画像は使わない）

### 3. ボタン（2種類）
- **塗り（主）**: 背景 Bone・文字 Canvas・Inter 600 14px 大文字・字間 +0.063em・padding 14px 28px・角丸 6px・枠なし・影なし
- **枠線（副）**: 背景透明・枠 1px Gold・文字 Gold・同じ字組・padding 8px 16px・角丸 6px
- **Gold の塗りボタンは作らない**

### 4. eyebrow ラベル
Inter 600・10px・大文字・字間 +0.167em・Ash（強調は Gold）。各セクションの上に中央または左揃えで置き、下に 24px 空ける。

### 5. ステップ（登録のしかた・進め方）
横1列（スマホは縦）。各：36px の円（Layer 地・Gold の線アイコン）→ heading-sm 20px Bone → body 14px Ash。区切りは髪の毛の罫（Ash・不透明度 20%）。番号は既存文字があればそれを Gold で。

### 6. 特徴パネル（2列：文＋写真）
左：eyebrow → display の小さい版（Oswald 700 / 40px）→ body-lg Ash → チェックリスト（Gold のチェック・14px Bone）。
右：**写真 1 枚**（4:5・角丸16px・無加工・顔を切らない）。スマホは写真が上。本文は左揃え。

### 7. ギャラリー（16枚）
2〜4列グリッド・隙間 10px・角丸16px。hover で髪の毛の Gold 枠。**モノクロ化・色被せ禁止。** 6枚分を「アバター群」（36px の円・重ね）として About の脇に置いてよい（同じ写真の再利用は可）。

### 8. FAQ
髪の毛の罫（Ash 20%）で区切る。質問 16px Inter 600 Bone、答え 14px Ash。開閉は「+ / −」。

### 9. フッター
上に Gold Wash が薄くにじむ → Canvas。リンクは 14px Ash、hover で Gold の下線。

---

## やる／やらない

**やる**
- 大見出しは Oswald 700（JA は Noto Sans JP 900）・行間 1.0
- 小ラベルは 10px・大文字・字間 +0.167em
- 主ボタンは Bone の塗り、副ボタンは Gold の枠線
- Gold Wash は画面下部から「にじませる」（帯にしない・部品に入れない）
- 角丸は 6 / 12 / 16 / 36 の階層を守る
- 写真は無加工・角丸16px・大きく

**やらない**
- Gold の塗りボタン・Gold の本文
- Gold 系以外の有彩色
- 大きくぼけた影・光彩
- 純白 `#ffffff`（Bone `#fefef7` を使う）
- セリフ体を1ページに2回以上
- 写真のモノクロ化・色被せ・顔が切れるトリミング
- ロゴ画像の捏造（Netflix 等は既存の文字のまま）

---

## CSS 変数（そのまま貼る）

```css
:root{
  --canvas:#0f0f10; --layer:#1d1d1f; --bone:#fefef7; --cream:#f7f3ee;
  --ash:#b3b3b3; --mute:#666666; --steel:#868f97;
  --gold:#C9A84C; --gold-light:#E2C77A;
  --gold-wash:linear-gradient(95deg,#8A6B2A 0%,#E2C77A 100%);
  --font-ui:'Inter','Noto Sans JP',ui-sans-serif,system-ui,sans-serif;
  --font-display:'Oswald','Noto Sans JP',sans-serif;
  --font-display-jp:'Noto Sans JP',sans-serif;
  --font-serif:'Source Serif 4','Noto Serif JP',serif;
  --t-eyebrow:10px; --t-badge:12px; --t-body:14px; --t-body-lg:16px; --t-sub:18px; --t-h-sm:20px; --t-editorial:22px; --t-display:64px;
  --track-eyebrow:.167em; --track-badge:.063em; --track-body-lg:.013em; --track-display:.014em;
  --s-4:4px; --s-8:8px; --s-10:10px; --s-12:12px; --s-16:16px; --s-24:24px; --s-36:36px; --s-56:56px; --s-64:64px; --s-104:104px;
  --max:1200px; --gap-section:80px; --pad-card:24px; --gap:10px;
  --r-btn:6px; --r-badge:12px; --r-card:16px; --r-img:16px; --r-avatar:36px; --r-pill:9999px;
  --shadow:rgba(0,0,0,.06) 0 0 0 1px, rgba(0,0,0,.08) -8px 12px 22px 0;
}
@media (max-width:480px){ :root{ --t-display:44px; --gap-section:56px; } }
```
