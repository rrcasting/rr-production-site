# DESIGN.md — Rr.production's 版 v3「Dusk」（明るい・暖色の光＋紺紫の深み）

作成: 2026-09-20。**Richard がモックアップ（B2）を見て承認。** これ以前の2版（Index／ブループリント・Mesh／エディトリアル）は**暗すぎて不採用**。二度と使わない。
**このファイルが唯一の色・フォント・余白・部品の基準。** 文章は `COPY.md`。Claude Code はこの2つから組む。

---

## 世界観（1段落）

夕暮れの空。明るい薄紫がかった白の地に、オレンジ→ピンク→紫→青の光がにじむ。ページは**明るい**。文字は紺で締め、見出しは幾何的なサンセリフ（Sora）で「プロの会社」に見せる。キャストの実写真は白い縁のポラロイド風カードで、少し傾けて重ねる——人が集まっている感じを写真で出す。ページの途中に**紺→紫の深い帯**が1本入り（制作会社向け）、明るいページに奥行きと信用を足す。影は柔らかく大きく（紺の色付き影）、角丸は大きめ。**暗いページにしない。黒地の面は作らない。**

---

## 色

| 名前 | 値 | 用途 |
|---|---|---|
| Ground | `#f6f4fb` | ページ背景（薄紫がかった白）。**純白 `#fff` はカードとナビの中だけ** |
| Ink | `#1a1a3a` | 本文の基本色 |
| Navy | `#141a4a` | 見出し・ロゴ・主要ボタンの地（塗り）・深い帯の始点 |
| Body Mute | `#4a4a6a` | 本文（サブ）・説明文 |
| Label Mute | `#6a6a8a` | 小さなラベル・数字の説明 |
| **Orange** | `#ff8a3d` | 光（左上）・見出しのグラデーションの始点 |
| **Magenta** | `#ff3d8a` | 光（右上）・見出しグラデーションの中間・主ボタンの始点 |
| **Violet** | `#6a3df5` | 光（下）・見出しグラデーションの終点・主ボタンの終点・数字・eyebrow の文字・深い帯の終点 |
| **Blue** | `#2b6cf6` | 光（右下）だけ。文字やボタンには使わない |
| Deep Mid | `#2a1f7a` | 深い帯の中間色 |
| Peach（帯の中のラベル） | `#ffd2a8` | 深い帯の上の eyebrow 文字だけ |

**グラデーション（この3つだけ）**
- **Sky Wash（ヒーロー背景の光）**: 4つの放射光を重ねる（下の CSS）。`opacity:.5`・`filter:blur(34px)`。**ヒーローとフッター上にだけ**
- **Text Wash（見出しの1語）**: `linear-gradient(90deg,#ff8a3d 0%,#ff3d8a 45%,#6a3df5 100%)` を `background-clip:text` で
- **Deep Band（深い帯）**: `linear-gradient(160deg,#141a4a 0%,#2a1f7a 55%,#6a3df5 100%)`。**「制作会社の方へ」セクションにだけ**
- **主ボタン**: `linear-gradient(90deg,#ff3d8a,#6a3df5)`

禁止：黒・濃いグレーの面／緑（WhatsApp の緑 `#22c55e` は使わない。WhatsApp ボタンは白地・紺文字）／金 `#C9A84C`（旧ブランド色。v5 では使わない）／上記以外の有彩色。

---

## フォント（Google Fonts・この3つだけ）

| 役割 | フォント | 太さ | 備考 |
|---|---|---|---|
| 見出し（EN/ES）・ロゴ・数字 | **Sora** | 700・800 | 字間 -0.03em（見出し）／-0.02em（数字）。行間 1.02 |
| 見出し（JA） | **Noto Sans JP** | 900 | 字間 +0.02em・行間 1.3 |
| 本文・ボタン・ラベル（3言語） | **Manrope**（JA は Noto Sans JP） | 500・600・700・800 | 本文 500、ラベル 700、ボタン 800 |

Inter・Playfair Display・Oswald・Geist は**使わない**。

### 文字サイズ

| 役割 | サイズ | 行間 | 字間 |
|---|---|---|---|
| eyebrow（大文字ラベル） | 11px | 1.4 | +0.16em |
| caption | 12px | 1.4 | 0 |
| body | 14px | 1.7 | 0 |
| body-lg | 16px | 1.7 | 0 |
| heading-sm | 20px | 1.35 | -0.01em |
| h2（セクション見出し） | 28px（PC 34px） | 1.3 | -0.02em（JA は +0.02em） |
| display（H1・EN/ES） | **clamp(38px, 8vw, 80px)** | 1.02 | -0.03em |
| display JA | clamp(20px, 4vw, 34px) | 1.3 | +0.02em |
| 数字（統計） | 30px | 1 | -0.02em・`tabular-nums` |

---

## 余白・形・影

- ページ最大幅 1100px。セクション間 64px（スマホ 48px）。カード内 24px
- 角丸：**ボタン・ナビ・チップ 999px（ピル）／写真カード 20px（中の写真 14px）／統計タイル 16px／深い帯の写真 18px／特徴パネルの写真 20px**
- 影は2種類だけ：**カード** `0 24px 50px rgba(27,42,143,.18)`／**主ボタン** `0 12px 30px rgba(90,43,214,.32)`。黒い影は使わない（必ず紺系の色付き影）
- 罫線は `rgba(90,43,214,.12)`（薄い紫）。グレーの罫線は使わない

---

## 部品

### 1. ナビ
白 72% の**ピル**（`backdrop-filter:blur(10px)`・1px 白枠・カード影の弱い版）。左ロゴ（Sora 800・紺・18px）、中央にリンク（PC のみ）、右に**紺の塗りピル**「登録する」。言語切替 `ENGLISH / ESPAÑOL / 日本語` はピルの中に小さく（**`data-code` 方式のまま**）。スクロールしても浮いたまま（sticky）。既存 `#lang-bar`・`#sticky-cta` は残す。

### 2. ヒーロー
背景に **Sky Wash**。中央揃え・最大幅 720px：
- eyebrow：白 80% のピル・薄紫の枠・Violet の文字・大文字・字間 +0.16em
- **H1**（Sora 800・紺）。`COPY.md` の【 】の1語だけ **Text Wash**
- H1 の直下に JA の見出し（Noto Sans JP 900）— **EN/ES 表示のときは出さない。JA 表示のときは H1 が JA になる**（3言語切替は既存どおり）
- サブ 16px・Body Mute・最大幅 560px
- **ボタン2本**：主＝ピンク→紫のグラデーション塗りピル・白文字・主ボタン影／副＝白地・紺文字・薄紫の枠のピル
- **その下に「写真カード」5〜6枚**：白い縁（padding 8px）・角丸 20px・カード影・**奇数枚を -4°、偶数枚を +3° 傾けて重ねる**。写真は無加工・顔を切らない・`object-fit:cover`
- その下に統計タイル4つ（白 85%・薄紫の枠・角丸 16px・数字は Sora 800 Violet 30px・説明 12px Label Mute）

### 3. ボタン（2種類）
- **主**：`linear-gradient(90deg,#ff3d8a,#6a3df5)`・白文字・Manrope 800 14px・padding 14px 22px・ピル・主ボタン影
- **副**：白地・紺文字・1.5px `rgba(27,42,143,.2)` の枠・同じ字組・ピル
- **紺の塗りピル**はナビの「登録する」だけ

### 4. eyebrow
Manrope 700・11px・大文字・字間 +0.16em・Violet。白 80% のピルに入れる（深い帯の上では白 12% のピル・Peach の文字）。各セクションの上に置く。

### 5. About（セクション）
Ground の地。h2（紺）→ 本文 16px Body Mute → チェック4つ（Violet のチェック印・14px 紺）。右または下に写真1枚（角丸 20px・カード影）。

### 6. 深い帯 ＝「制作会社の方へ」（日本語のみ・`data-lang` なし）
**Deep Band** の地・白文字。左：eyebrow（Peach）→ h2（Noto Sans JP 900・白）→ 本文（白 82%）→ **白地・紺文字のピルボタン**「制作会社様のお問い合わせ（WhatsApp）」。右：写真1枚（角丸 18px・黒 35% の影）。**このページで唯一の暗い面。2本目を作らない。**

### 7. 5ステップ（登録から撮影まで）
横1列（スマホは縦）。各：白カード（角丸 16px・カード影の弱い版）・上に **Violet の丸番号**（Sora 800・白文字・36px の円）→ heading-sm 紺 → body Body Mute。

### 8. 向いている人／向いていない人
2列（スマホは縦）。Good fit は白カード＋Violet のチェック、Not a fit は白カード＋Magenta の × 。

### 9. ルールと条件（4カード）
白カード・角丸 16px・上に小さな Violet の線アイコン。文は現行そのまま。

### 10. 実績（9作品）
白カード・角丸 16px・作品名は Sora 700（JA タイトルは Noto Sans JP 700）・媒体は eyebrow スタイル。カードの上端に **Text Wash の細い線（3px）**。

### 11. ギャラリー（16枚）
写真カード方式（白縁・角丸 20px・**傾けない**）を 2〜4 列グリッド・隙間 14px。hover で少し浮く（影が強くなる）。**モノクロ化・色被せ禁止。**

### 12. 最新の募集・FAQ・最後の CTA
- 募集：白カード＋主ボタン／副ボタン
- FAQ：白カード内、薄紫の罫で区切る。質問 16px Manrope 700 紺、答え 14px Body Mute。開閉は「+ / −」を Violet で
- 最後の CTA：Sky Wash を薄く敷き直し（opacity .3）、h2 → 本文 → **主ボタン**

### 13. フッター
Ground の地・上に薄紫の罫。ロゴ（Sora 800 紺）・リンク 14px Label Mute・hover で Violet。© 2026。

---

## やる／やらない

**やる**
- ページ全体を**明るく**。地は `#f6f4fb`、面は白
- Sky Wash はヒーローと最後の CTA だけ。**帯にしない、にじませる**
- 深い帯（紺→紫）は「制作会社の方へ」**1本だけ**
- 見出しは Sora 800 紺、JA は Noto Sans JP 900
- 写真は白縁のカード・無加工・顔を切らない
- 影は紺系の色付き、罫線は薄紫

**やらない**
- 黒・濃いグレーの面／金色／緑／グレーの罫線／黒い影
- 深い帯を2本以上
- Blue `#2b6cf6` を文字・ボタンに使う（光だけ）
- 写真のモノクロ化・色被せ・顔が切れるトリミング
- ロゴ画像の捏造（Netflix 等は文字）
- 4px 未満の細い装飾、極端な字間

---

## CSS（そのまま貼る・モックアップ B2 と同一）

```css
:root{
  --ground:#f6f4fb; --ink:#1a1a3a; --navy:#141a4a; --mute:#4a4a6a; --label:#6a6a8a;
  --orange:#ff8a3d; --magenta:#ff3d8a; --violet:#6a3df5; --blue:#2b6cf6; --deep-mid:#2a1f7a; --peach:#ffd2a8;
  --text-wash:linear-gradient(90deg,#ff8a3d 0%,#ff3d8a 45%,#6a3df5 100%);
  --deep-band:linear-gradient(160deg,#141a4a 0%,#2a1f7a 55%,#6a3df5 100%);
  --btn-wash:linear-gradient(90deg,#ff3d8a,#6a3df5);
  --shadow-card:0 24px 50px rgba(27,42,143,.18);
  --shadow-btn:0 12px 30px rgba(90,43,214,.32);
  --line:rgba(90,43,214,.12);
  --font-display:'Sora','Noto Sans JP',sans-serif;
  --font-body:'Manrope','Noto Sans JP',system-ui,sans-serif;
  --font-jp:'Noto Sans JP',sans-serif;
  --r-pill:999px; --r-card:20px; --r-tile:16px;
  --max:1100px; --gap-section:64px;
}
@media(max-width:480px){:root{--gap-section:48px}}
body{background:var(--ground);color:var(--ink);font-family:var(--font-body)}
/* Sky Wash（ヒーローの光） */
.hero{position:relative;overflow:hidden}
.hero:before{content:"";position:absolute;inset:-30% -20% auto -20%;height:85%;pointer-events:none;opacity:.5;filter:blur(34px);
  background:radial-gradient(55% 55% at 22% 35%,var(--orange) 0%,transparent 62%),
             radial-gradient(50% 55% at 78% 25%,var(--magenta) 0%,transparent 62%),
             radial-gradient(60% 60% at 60% 95%,var(--violet) 0%,transparent 60%),
             radial-gradient(70% 50% at 95% 80%,var(--blue) 0%,transparent 60%)}
.nav{background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.8);border-radius:var(--r-pill);padding:10px 16px;backdrop-filter:blur(10px);box-shadow:0 8px 30px rgba(27,42,143,.10)}
.eyebrow{display:inline-block;background:rgba(255,255,255,.8);border:1px solid rgba(90,43,214,.18);border-radius:var(--r-pill);padding:6px 14px;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--violet)}
h1{font-family:var(--font-display);font-weight:800;font-size:clamp(38px,8vw,80px);line-height:1.02;letter-spacing:-.03em;color:var(--navy);text-wrap:balance}
h1 .accent{background:var(--text-wash);-webkit-background-clip:text;background-clip:text;color:transparent}
.btn-primary{background:var(--btn-wash);color:#fff;border-radius:var(--r-pill);box-shadow:var(--shadow-btn);font-weight:800;font-size:14px;padding:14px 22px}
.btn-secondary{background:#fff;color:var(--navy);border:1.5px solid rgba(27,42,143,.2);border-radius:var(--r-pill);font-weight:800;font-size:14px;padding:14px 22px}
.photo-card{background:#fff;padding:8px;border-radius:var(--r-card);box-shadow:var(--shadow-card)}
.photo-card img{display:block;width:100%;height:100%;object-fit:cover;border-radius:14px}
.photo-card:nth-child(odd){transform:rotate(-4deg) translateY(10px)}.photo-card:nth-child(even){transform:rotate(3deg)}
.stat{background:rgba(255,255,255,.85);border:1px solid var(--line);border-radius:var(--r-tile);padding:14px 18px;text-align:center}
.stat b{display:block;font-family:var(--font-display);font-weight:800;font-size:30px;line-height:1;color:var(--violet);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.deep{background:var(--deep-band);color:#fff;padding:40px 16px 48px}
.deep .eyebrow{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.25);color:var(--peach)}
.deep .btn-secondary{background:#fff;color:var(--navy);border:0}
```
