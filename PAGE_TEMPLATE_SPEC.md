# 區域頁模板規格（Region-Page Template Spec）

**canonical＝日本卷**（`japan/*.html`，以 `japan/chubu.html` 為基準頁）。所有國家的**區域／城市頁**（不含各國 `index.html` hub 與 `basics.html`）都必須照這份 spec 製作與稽核。查證日欄位沿用各頁自身。

> 為什麼要這份 spec：本書以日本卷為模板量產各國頁，但「相同 CSS class ≠ 相同 markup」，過去出現同一區塊三種樣式而 per-file 稽核抓不到。這份 spec 是**結構契約**，配合 `tools/check_template.py` 當 gate。

---

## 0. 適用範圍與判定

- **區域頁** ＝ 檔案含 `<h2 id="spots">`。這些頁一律適用本 spec。
- **非區域頁**（`index.html` hub、`basics.html`）不適用第 3 節的 spots 規則，但仍遵守第 1、2、6 節的外殼與語言規則。

---

## 1. 文件外殼（每頁固定）

```html
<!DOCTYPE html><html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0f766e">
  <meta name="description" content="…（本頁重點，含誠實提醒）">
  <title>… · {國家} · 旅行深度自助筆記</title>
  <script>try{document.documentElement.dataset.theme=localStorage.getItem('travel-theme')||'light'}catch(e){}</script>
  <link href="https://fonts.googleapis.com/…Noto+Sans+TC…" rel="stylesheet">
  <link rel="stylesheet" href="../common.css">
</head>
<body>
<a class="site-skip" data-site-skip="1" href="#site-main">跳至主內容</a>
<div class="site-shell">
  <aside class="site-sidebar" aria-label="導覽側欄"><nav aria-label="側欄導覽">
    <div class="sb-group"><div class="sb-title">{國家}</div> …本國 hub＋← 所有國家…</div>
    <div class="sb-group"><div class="sb-title">區域</div> …同國各區域頁，當前頁 class="current" aria-current="page"…</div>
    <div class="sb-group"><div class="sb-title">本頁章節</div> …11 個章節錨點…</div>
  </nav></aside>
  <main class="site-main" id="site-main">
    <header>
      <a class="back-link" href="index.html">&larr; {國家}區域目錄</a>
      <h1>…</h1>
      <p class="subtitle">…（可含 <strong class="hi-warn"> 誠實提醒）</p>
    </header>
    <!-- 頁內 chip 目錄（桌機隱藏、手機顯示） -->
    <nav class="site-inpage-nav" aria-label="頁內快速跳轉"> …pill-nav chips 對應下方 11 章節… </nav>
    … 11 個章節 …
  </main>
</div>
<!-- footer 由 site.js 於 runtime 注入（頁面靜態 HTML 不含 footer / buildDisclaimer）-->
<script src="../common.js"></script>
</body></html>
```

- 共用樣式一律 `../common.css`、共用行為 `../common.js`；**不得**在頁內重造已存在於 common.css 的元件樣式。
- footer（閱讀須知＋版權）由 `site.js` 全站注入，頁面**不得**自行手寫 footer。

---

## 2. 章節骨架（核心章節固定、順序固定、允許擴充）

**核心 10 章節**（`CORE`）：每個區域頁**必須全部具備**，且必須以下列**相對順序**出現（可被擴充章節插入其間，但核心章節本身不可亂序、不可缺）：

| # | h2 id | 標題（文字固定，emoji 可依頁換） |
|---|---|---|
| 1 | `quick` | 速查卡（可加副題如「（中部）」） |
| 2 | `intro` | 這區在哪、為何值得去 |
| 3 | `spots` | **景點深度介紹**（見第 3 節，文字固定為「景點深度介紹」、**不得**加「（點下方分區快速跳轉）」等後綴） |
| 4 | `strategy` | 不開車策略（可作「不開車三策略」） |
| 5 | `itinerary` | 行程建議 |
| 6 | `season` | 季節／依季節排法 |
| 7 | `transport` | 交通詳解 |
| 8 | `apps` | 推薦 App |
| 9 | `food` | 在地美食／吃與省錢 |
| 10 | `tips` | 實戰眉角 |

**允許的擴充章節**（`KNOWN_EXTRA`，內容驅動、可插在核心章節之間；不是每頁都要有）：
- `rain`（雨天備案／壞天氣備案）── **強烈建議**；日本卷 10/10 皆有，僅沙漠／特殊氣候頁可省。
- `money`（金錢與預算）── 泰國、澳洲、馬來西亞、新加坡等卷以獨立段呈現（日本折進 quick／food）。
- 氣候／主題特定段：如 `haze`（清邁空污季）、`seakey`（海島季節關鍵）。

> 要新增 `KNOWN_EXTRA` 以外的章節 id，先更新本節與 `tools/check_template.py` 的 `KNOWN_EXTRA`，否則 checker 會以 `unknown-sections` 擋下（防止無意間漂移）。

- `site-inpage-nav` 與側欄「本頁章節」的 pill/連結，錨點須與該頁實際的 `h2 id`（核心＋擴充）一一對應。

---

## 3. 景點深度區塊（`#spots`）── 最常漂移、規格最嚴

**固定順序：h2 → 介紹 `<p>` → `nav.city-nav` → 各分區（`h3` + `card`）。**

### 3.1 標題與介紹段
```html
<h2 id="spots"><span aria-hidden="true">{EMOJI}</span> 景點深度介紹</h2>
<p class="text-muted" style="font-size:13.5px;">依區域分組（{分區1} · {分區2} · …）。每個景點寫「去那幹嘛／亮點／停留時間／玩法動線／內行提示／親子適合度」＋分類標籤與<strong>官方查詢處</strong>。變動性高的票價/場次一律「概估＋官網查」，出發前務必再確認。</p>
```
- h2 文字**必為**「景點深度介紹」（emoji 除外）。**禁止**寫成「景點深度」或加括號後綴。
- 介紹 `<p class="text-muted">` **必須存在且緊接在 h2 之後、nav 之前**。分區清單以 ` · ` 分隔，對應下方各 `h3`。

### 3.2 分區跳轉選單（city-nav）
```html
<nav class="city-nav" data-city-acc aria-label="…快速跳轉">
  <span class="cn-label">跳到{城市／子區／分區／島群}：</span>
  <a class="pill-nav" href="#{id}"><span aria-hidden="true">{emoji}</span> {短標籤}</a>
  … 每個分區一顆 …
</nav>
```
- 必含 `data-city-acc`（common.js 據此生成手風琴）。
- 必含一個 `<span class="cn-label">跳到…：</span>`（措辭可依內容選「城市／子區／分區／島群」）。
- 每個 anchor **必為** `class="pill-nav"`＋一個前導 `<span aria-hidden="true">emoji</span>`＋**短標籤**（細節留給下方 `h3`，pill 只放簡名）。**禁止**用裸 `<a href>` 純文字連結。
- 每個 `href="#id"` 都必須對到本頁一個 `<h3 id>`（見 3.3），零斷錨。

### 3.3 分區標題與景點卡
```html
<h3 id="{city-*|area-*}">{分區名（含代表景點）}</h3>
<div class="card">
  <h4>{景點名（含原文/外文）}
    <span class="badge badge-info">…</span> <span class="badge badge-kid">…</span> …（分類/難度/預約/免費等徽章）</h4>
  <p><strong>去那幹嘛</strong>：…</p>
  <p><strong>亮點／為何值得</strong>：…</p>
  <p><strong>建議停留</strong>：…</p>
  <p><strong>不開車怎麼到</strong>：…（或「玩法動線」）</p>
  <p><strong>內行提示</strong>：…</p>
  <p><strong>親子（學齡兒童）</strong>：…</p>
  <div class="box box-verify"><strong>官方查詢處</strong>（出發前查、查證日 …）：…</div>
</div>
```
- 錨點命名：多城頁用 `id="city-*"`，單城分區頁用 `id="area-*"`（同頁一致）。
- 每張景點卡以 `<div class="card">` 包覆；欄位用 `<strong>標籤</strong>：` 起頭；卡尾放 `box box-verify` 的「官方查詢處」。
- 安全風險用 `box box-warn`（紅框，`<h4>🔴 …</h4>` + `<ul>`）。

---

## 4. 其他章節重點（可變內容、固定容器）

- **`#quick`**：`<div class="summary-card" role="region" aria-label="…速查卡"><h2 id="quick">…速查卡</h2><dl class="kv"><dt>…</dt><dd>…</dd>…</dl>` ＋ 結尾一個 `box box-verify`「出發前查證（查證日 …）」。徽章用 `badge badge-easy/medium/hard/kid/book/info/…`。
- **`#itinerary`**：行程用 `data-tab`（5/7/10 日分頁）或表格；每日花費表欄位＝交通／門票／餐（每人）＋住（家庭房整晚）。
- **`#transport`**：可含「票價/時間速覽」表；步行分鐘**只在官方自載時**才寫。
- 其餘章節（intro/strategy/season/rain/apps/food/tips）：容器沿用日本頁對應段落樣式即可。

---

## 5. 命名與錨點不變量

- `site-inpage-nav`／側欄「本頁章節」的錨點 == 11 個 `h2 id`。
- `city-nav` 的每個 `href="#id"` == 一個 `h3 id`（`city-*`／`area-*`）。
- 同頁 anchor scheme 一致（別混用 city-/area-）。

---

## 6. 語言與格式硬規則（見 REVIEW_RULES.md 詳版）

- **僅繁體中文**，禁簡體（`皇后鎮/皇后/王后` 的「后」是正繁體、非簡體）。
- 中文行文用**全形**標點（逗號、括號、冒號、分號）；建頁後跑 CJK 正規化。
- 金額帶中文前綴（全票／兒童／每人／每程／每日上限），幣別用 £／¥／₩／€；**票價數字不與「分鐘」相鄰裸列**。
- **官方沉默 ≠ 免費 ≠ 無限制**：查不到寫「以官網為準」，不臆測、不寫免費。
- **per-entity 兒童／年齡規則絕不互抄**；官方自我矛盾 → **兩版並列＋🚩**、不取平均。
- 抓取合規：robots 零繞過；被擋的事實一律標 UNVERIFIED。

---

## 7. 機械不變量（conformance gate 必過）

1. `<div>` open == close（平衡）。
2. 巢狀 `<strong>` == 0。
3. `box box-warn` body 內**不得**出現 `hi-warn`／`hi-crit`（H22）。
4. `city-nav` 的 href 集合 == 本頁 `h3 id`（`city-*`/`area-*`）集合，零斷錨。
5. CJK 相鄰半形逗/冒/分/括號 == 0。
6. 簡體字 == 0。
7. **spots 結構契約**（第 3 節）：h2 文字==「景點深度介紹」；h2 後緊接介紹 `<p class="text-muted">`；`city-nav` 含 `data-city-acc`＋`cn-label`＋`pill-nav` pills。

### 跑法
```bash
# 結構契約（本 spec 第 2、3、7 節）
python3 tools/check_template.py .
# 通用機械 + 跨頁一致性（skill: static-doc-audit / guards.js）
SDA_FORBID_CHARS='…簡體集…' \
SDA_TEMPLATE_MARKERS='class="city-nav"' \
SDA_TEMPLATE_COPRESENT='class="city-nav"=><span class="cn-label">,class="pill-nav"' \
  node ~/.claude/skills/static-doc-audit/scripts/guards.js <國家資料夾>
```

**收工條件：`tools/check_template.py` 全書 0 偏差。**
