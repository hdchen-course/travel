/* === 旅行深度自助筆記 · Common JS ===
   極簡：只做全站共用的 tab 切換與必要初始化。
   各頁若有頁面專屬互動，可在該頁自行加 <script>。 */

// Tab 切換：<button class="tab-btn" data-tab="tab1">... 對應 <div class="tab-content" id="tab1">
// 注意：同一 group 可能拆成「nav 容器」與「內容容器」兩個帶相同 data-tab-group 的兄弟節點，
//       所以不能只取 querySelector 的第一個 scope（會取到沒有 .tab-content 的 nav → 內容永不切換）。
//       這裡改成疊代「所有」相符 group 容器；若沒帶 group 則以整份文件為範圍。
function switchTab(tabId, group) {
  var scopes;
  if (group) {
    scopes = document.querySelectorAll('[data-tab-group="' + group + '"]');
    if (!scopes.length) scopes = [document];
  } else {
    scopes = [document];
  }
  // 保險：若 group 容器內都沒有 .tab-content（nav-only 寫法：group 只放在 .tab-nav、
  // 面板是它的兄弟節點），退回以整份文件為切換範圍，確保面板一定切得動。
  // 正常兩容器寫法本來就有面板在 scope 內、不會觸發退回，多分頁頁面也因 id 唯一而不互擾。
  var hasPanel = Array.prototype.some.call(scopes, function (sc) {
    return sc.querySelector && sc.querySelector('.tab-content');
  });
  if (!hasPanel) scopes = [document];
  scopes.forEach(function (scope) {
    scope.querySelectorAll('.tab-content').forEach(function (el) {
      el.classList.toggle('active', el.id === tabId);
    });
    scope.querySelectorAll('.tab-btn').forEach(function (btn) {
      var selected = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', selected);
      // a11y：aria-selected 與視覺 active 同步
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  // a11y 角色標註：tablist / tab / tabpanel
  document.querySelectorAll('.tab-nav').forEach(function (nav) {
    if (!nav.hasAttribute('role')) nav.setAttribute('role', 'tablist');
    // tablist 需可辨識名稱：若頁面未自訂 aria-label / aria-labelledby，補預設「分頁」
    if (!nav.hasAttribute('aria-label') && !nav.hasAttribute('aria-labelledby')) {
      nav.setAttribute('aria-label', '分頁');
    }
  });
  document.querySelectorAll('.tab-content').forEach(function (panel) {
    if (!panel.hasAttribute('role')) panel.setAttribute('role', 'tabpanel');
    // a11y：純文字面板補 tabindex="0"，讓 tabpanel 可鍵盤聚焦捲動
    if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '0');
  });

  // a11y：資料表欄標題補 scope="col" 語意，利於螢幕閱讀器辨識欄關聯
  document.querySelectorAll('table thead th').forEach(function (th) {
    if (!th.hasAttribute('scope')) th.setAttribute('scope', 'col');
  });

  document.querySelectorAll('.tab-btn[data-tab]').forEach(function (btn) {
    // 明確設 type="button"：避免未來被包進 <form> 時，按鈕預設 type="submit" 誤觸表單送出
    if (!btn.hasAttribute('type')) btn.setAttribute('type', 'button');
    // 原生 <button> 已支援鍵盤與焦點，移除多餘的 role="button"/tabindex 避免重複觸發
    if (btn.getAttribute('role') === 'button') btn.removeAttribute('role');
    if (btn.getAttribute('tabindex') === '0') btn.removeAttribute('tabindex');
    if (!btn.hasAttribute('role')) btn.setAttribute('role', 'tab');
    // 初始 aria-selected 依現有 active class
    btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');

    // WAI-ARIA 關聯：aria-controls 指向對應 panel（其 id 即 data-tab 值）
    var tabId = btn.getAttribute('data-tab');
    if (tabId) {
      btn.setAttribute('aria-controls', tabId);
      // panel 需 aria-labelledby 指回按鈕：確保按鈕有唯一 id（tabbtn-<tabId>）
      if (!btn.id) btn.id = 'tabbtn-' + tabId;
      var panel = document.getElementById(tabId);
      if (panel && panel.classList.contains('tab-content') &&
          !panel.hasAttribute('aria-labelledby')) {
        panel.setAttribute('aria-labelledby', btn.id);
      }
    }

    // click 切換
    btn.addEventListener('click', function () {
      var tabId = btn.getAttribute('data-tab');
      var grp = btn.closest('[data-tab-group]');
      switchTab(tabId, grp ? grp.getAttribute('data-tab-group') : null);
    });

    // 鍵盤：左右方向鍵在同一 tablist 內切換並移動焦點（WAI-ARIA tabs 慣例）
    btn.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var nav = btn.closest('.tab-nav') || btn.parentNode;
      var tabs = Array.prototype.slice.call(nav.querySelectorAll('.tab-btn[data-tab]'));
      var i = tabs.indexOf(btn);
      if (i < 0) return;
      e.preventDefault();
      var next = e.key === 'ArrowRight'
        ? tabs[(i + 1) % tabs.length]
        : tabs[(i - 1 + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });
});

// === 城市快捷手風琴（全站啟用） ===========================================
// 就地把「城市 pill 列」升級為原生 <details> 手風琴：點城市名展開該城景點清單、
// 點景點名跳到該景點卡。純前端、無外部依賴、可離線；原生 <details> 免額外開合 JS
// 且鍵盤/螢幕閱讀器友善。
//
// 【機制】opt-in：只處理帶 data-city-acc 屬性的 .city-nav；缺屬性者整段跳過。
// Fallback：JS 關閉、或某城 h3 找不到、或完全沒建成時，原 pill 連結原樣保留仍可點。
// 這套 opt-in/fallback 設計是「機制層」——與「目前套用到哪些頁」是兩件事。
//
// 【目前套用範圍】全站所有含 .city-nav 的區域頁（實測 27 頁）皆已加 data-city-acc，
// 因此手風琴全站啟用（非 kansai 專屬）。維護者注意：勿把本段當 kansai 專用而精簡掉
// data-city-acc 判斷或移除其餘頁的屬性，否則會關掉其餘 26 頁的手風琴。
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.city-nav[data-city-acc]').forEach(function (nav) {
    var pills = nav.querySelectorAll('a.pill-nav[href^="#"]');
    if (!pills.length) return;

    if (!nav.id) nav.id = 'city-menu';   // 供各城市區的行內「回選單」連結錨定
    var navId = nav.id;

    var frag = document.createDocumentFragment();
    var built = 0;

    pills.forEach(function (pill) {
      var href = pill.getAttribute('href') || '';
      var cityId = href.charAt(0) === '#' ? href.slice(1) : '';
      if (!cityId) return;
      var cityH3 = document.getElementById(cityId);
      if (!cityH3) {
        // 找不到對應城市 section：保留原 pill（clone 進 frag），避免收尾 nav.textContent=''
        // 清空整列時，該城既沒生成 details 又原 pill 已被清掉 → 從選單整個消失（per-pill fallback）
        frag.appendChild(pill.cloneNode(true));
        built++;
        return;
      }

      // 蒐集該城景點：自城市 h3 起、到下一個 h3 或 h2 前的所有 .card（同層兄弟）
      var spots = [];
      var node = cityH3.nextElementSibling;
      while (node && node.tagName !== 'H3' && node.tagName !== 'H2') {
        // 帶 data-acc-skip 的卡＝攻略/策略/玩法說明（非地標景點）→ 不收進清單、也不指派錨點
        if (node.classList && node.classList.contains('card') && !node.hasAttribute('data-acc-skip')) {
          var card = node;
          // 卡內第一個 h4 即景點名（巢狀 .box 內的 h4 於文件順序在後，不會被選到）
          var h4 = card.querySelector('h4');
          if (h4) {
            // 景點名＝複製 h4、移除所有 <span>（去 emoji 與 badge）後的純文字
            var clone = h4.cloneNode(true);
            clone.querySelectorAll('span').forEach(function (s) { s.parentNode.removeChild(s); });
            var name = (clone.textContent || '').replace(/\s+/g, ' ').trim();
            if (name) {
              // 錨點目標：優先用既有 h4 id、其次卡片 id；都沒有才指派唯一 id 給卡片
              var targetId = h4.id || card.id;
              if (!targetId) {
                targetId = 'acc-' + cityId + '-' + (spots.length + 1);
                card.id = targetId;
              }
              spots.push({ id: targetId, name: name });
            }
          }
        }
        node = node.nextElementSibling;
      }
      // node 現為本城區塊的結尾邊界（下一個 h3/h2）。景點多的城市（如京都 30+ 卡）靠後景點跳下去後,
      // h3 下方的行內回選單連結遠在螢幕外 → 於區塊結尾(下一個 h3/h2 前)再插一個「↑ 城市選單」,
      // 讓長城市「往下看也有 back」。小城市(<6 卡)不插以免冗贅;右下浮動鈕仍為全域主要回選單機制。
      // 只在區塊結尾為「章節邊界(H2,如 #strategy)」時插 endLink＝該城後面沒有下一城的 back-to-menu;
      // 中間城市(結尾為下一城 H3)不插,因下一城 h3 後就有自己的 back-to-menu、免得城市交界出現相鄰兩條。
      if (spots.length >= 6 && node && node.tagName === 'H2' && node.parentNode &&
          !(node.previousElementSibling && node.previousElementSibling.classList &&
            node.previousElementSibling.classList.contains('back-to-menu'))) {
        var endLink = document.createElement('a');
        endLink.className = 'back-to-menu';
        endLink.setAttribute('href', '#' + navId);
        endLink.textContent = '↑ 城市選單';
        node.parentNode.insertBefore(endLink, node);   // 插在下一個 h3/h2 前＝本城結尾
      }

      // 在每個城市區 h3 後插入行內「↑ 城市選單」回選單連結：跳到某景點後,往上一格即見,
      // 比右下角浮動鈕更貼近「landing 處就有 back」的直覺(浮動鈕仍保留當全域保底)。
      //
      // 守門條件(usability niceToFix):以下兩種城市「不插」行內 back-to-menu——
      //   ① 選單正下方「第一座」城市:讀者剛看完選單、緊接的第一座城市 h3 下一行就是
      //      指回正上方選單的按鈕=冗餘突兀(才往下一格又被送回上一格)。判定方式=自 cityH3
      //      沿 previousElementSibling 往前找:先遇到本 nav(city-nav)、或到頭都沒遇到別的
      //      城市 h3 ⇒ 它與選單之間沒有其他城市區塊 ⇒ 即選單正下方第一座 ⇒ 跳過。
      //   ② solo 退化城市(spots.length===0,下方改放單一 pill 連結、無展開清單):
      //      原邏輯誤在 solo 分支「之前」無條件插了 back(USJ 之類 0 景點城市也吃到),
      //      這類城市本就不該有行內 back,一併排除。
      //   其餘(非第一座、且有景點)照插;長城市區塊結尾的 endLink(≥6 卡那段,見上方)
      //   屬另一段邏輯、不受此守門影響。右下浮動 .back-to-nav 為全域保底,故第一座/solo
      //   省略行內 back 不影響「隨時可回選單」。
      var isFirstCityBelowMenu = (function () {
        var prev = cityH3.previousElementSibling;
        while (prev) {
          if (prev === nav) return true;            // 一路往前只遇到 city-nav ⇒ 選單正下方第一座
          if (prev.tagName === 'H3') return false;  // 先遇到別的城市 h3 ⇒ 非第一座
          prev = prev.previousElementSibling;
        }
        return true;   // 到頭都沒遇到別的城市 h3(nav 可能在更上層父節點)⇒ 視為第一座
      })();
      var hasInlineBack = cityH3.nextElementSibling &&
          cityH3.nextElementSibling.classList &&
          cityH3.nextElementSibling.classList.contains('back-to-menu');
      // spots.length(非 solo) && 非第一座 && 尚未存在(防重複) 三者皆成立才插
      if (spots.length && !isFirstCityBelowMenu && !hasInlineBack) {
        var backLink = document.createElement('a');
        backLink.className = 'back-to-menu';
        backLink.setAttribute('href', '#' + navId);
        backLink.textContent = '↑ 城市選單';
        cityH3.parentNode.insertBefore(backLink, cityH3.nextElementSibling);
      }

      var cityLabel = (pill.textContent || '').replace(/\s+/g, ' ').trim();   // 保留原 emoji＋城市名

      // 該城過濾後景點數為 0（如整區都是攻略卡）→ 不生成空的 <details>，
      // 改放一個單純可點的城市連結（點了跳到該城 section），避免空手風琴。
      if (!spots.length) {
        var soloLink = document.createElement('a');
        soloLink.className = 'pill-nav';
        soloLink.setAttribute('href', '#' + cityId);
        soloLink.textContent = cityLabel;
        frag.appendChild(soloLink);
        built++;
        return;
      }

      // 建立手風琴項目（預設收合）：<details><summary>城市名（數）</summary><ul>…</ul>
      var details = document.createElement('details');
      details.className = 'city-acc-item';

      var summary = document.createElement('summary');
      summary.textContent = cityLabel + '（' + spots.length + '）';
      details.appendChild(summary);

      var ul = document.createElement('ul');
      ul.className = 'city-acc-list';
      spots.forEach(function (s) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.setAttribute('href', '#' + s.id);
        a.textContent = s.name;
        li.appendChild(a);
        ul.appendChild(li);
      });
      details.appendChild(ul);

      frag.appendChild(details);
      built++;
    });

    // 只有真的建成手風琴才取代 pill；否則整列原 pill 保留（fallback 不破壞）
    if (built) {
      var label = nav.querySelector('.cn-label');
      nav.textContent = '';                 // 清掉原 pill 連結
      if (label) nav.appendChild(label);    // 保留「跳到城市：」標籤
      nav.appendChild(frag);
      nav.classList.add('city-acc-ready');  // 供 CSS 切換為直向堆疊版式
    }
  });

  // 帶 #hash 開啟時（書籤/分享/重整/前後退）：手風琴 build 把 city-nav 由水平 pill 轉直向堆疊
  // 並插入 back-to-menu，版位下移數百 px，瀏覽器先前的隱式 fragment 重捲已失準、落點偏上。
  // → 僅在「確有手風琴改版」時，build 完主動重捲一次到 hash 目標（instant，非平滑，避免 load 時抖動）。
  if (location.hash && location.hash.length > 1 &&
      document.querySelector('.city-nav.city-acc-ready')) {
    var hashEl = document.getElementById(location.hash.slice(1));
    if (hashEl && hashEl.scrollIntoView) hashEl.scrollIntoView({ block: 'start' });
  }
});

// === 返回鈕（跳到景點後一鍵跳回城市選單／頂部） ==============================
// 使用者回饋：從「跳到城市」清單點景點跳下去後，需要一個「跳回去」的按鈕。
// 作法：捲動超過一定距離才浮現右下角返回鈕；點了平滑捲回 .city-nav 城市選單
//       （讓使用者可立刻挑下一個城市/景點），該頁沒有 .city-nav 才退為回頂部。
// 純前端、無依賴；尊重 prefers-reduced-motion；鍵盤與螢幕閱讀器友善。
document.addEventListener('DOMContentLoaded', function () {
  if (document.querySelector('.back-to-nav')) return;   // 防重複建立

  // 目標動態化：讀者還在景點區(或其上)→鈕跳「城市選單」;已捲過景點區、進入行程/美食/眉角等後段
  //   →鈕改「回頂部」(避免後段讀者被拉回中段的城市選單而失去位置)。無 city-nav 的頁一律「回頂部」。
  var citymenu = document.querySelector('.city-nav');
  var mainTop = document.getElementById('site-main');
  var hasCityNav = !!citymenu;
  // #spots 之後的第一個主段落(行程/策略/季節/交通…):捲過它的頂端就切「回頂部」模式
  var postSpots = document.getElementById('strategy') || document.getElementById('itinerary') ||
                  document.getElementById('season') || document.getElementById('transport');

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'back-to-nav';
  btn.textContent = hasCityNav ? '↑ 城市選單' : '↑ 回頂部';
  btn.setAttribute('aria-label', hasCityNav ? '跳回城市選單' : '回頂部（回到頁面頂部）');
  btn.hidden = true;                        // 初始隱藏，捲動後才顯示
  document.body.appendChild(btn);

  // 依目前捲動位置決定模式:'menu'(回城市選單) 或 'top'(回頂部)
  function currentMode() {
    if (!hasCityNav) return 'top';
    if (postSpots) {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var boundary = (postSpots.getBoundingClientRect().top + y) - 80;  // 捲過行程段頂端(留 80px 緩衝)
      if (y >= boundary) return 'top';
    }
    return 'menu';
  }
  function applyMode() {
    var mode = currentMode();
    if (btn._mode === mode) return;
    btn._mode = mode;
    // aria-label 須含可見文字為連續子字串（WCAG 2.5.3 Label in Name）
    if (mode === 'top') {
      btn.textContent = '↑ 回頂部';
      btn.setAttribute('aria-label', '回頂部（回到頁面頂部）');
    } else {
      btn.textContent = '↑ 城市選單';
      btn.setAttribute('aria-label', '跳回城市選單');
    }
  }

  btn.addEventListener('click', function () {
    var reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var behavior = reduce ? 'auto' : 'smooth';
    // 'top' 模式＝「回頂部」：一律捲到頁面「真正」頂端（window 0）。
    // landing 頁（index.html）的 <header> 標題/hero 排在 #site-main 之前，
    // 若只捲到 #site-main 會停在標題下方＝非真頂；region 頁 #site-main 本就在頂、等效。
    // 焦點仍移到 mainTop（preventScroll 不會抵銷上面的捲動），鍵盤者不迷失。
    if (btn._mode === 'top') {
      window.scrollTo({ top: 0, behavior: behavior });
      if (mainTop) {
        if (!mainTop.hasAttribute('tabindex')) mainTop.setAttribute('tabindex', '-1');
        try { mainTop.focus({ preventScroll: true }); } catch (e) { mainTop.focus(); }
      }
      return;
    }
    var dest = citymenu || mainTop;
    if (dest && dest.scrollIntoView) {
      dest.scrollIntoView({ behavior: behavior, block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: behavior });
    }
    // a11y：捲動後把焦點移到目標，鍵盤使用者不會迷失
    if (dest) {
      if (!dest.hasAttribute('tabindex')) dest.setAttribute('tabindex', '-1');
      try { dest.focus({ preventScroll: true }); } catch (e) { dest.focus(); }
    }
  });

  // 捲動超過門檻才顯示；用 rAF 節流避免頻繁 reflow
  var THRESHOLD = 300;
  var ticking = false;
  function updateVisibility() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    btn.hidden = y < THRESHOLD;
    if (!btn.hidden) applyMode();   // 顯示時依位置更新「城市選單/回頂部」模式
    ticking = false;
  }
  function requestUpdate() {
    if (!ticking) { window.requestAnimationFrame(updateVisibility); ticking = true; }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  // 關鍵：點手風琴/目錄的錨點連結（href="#..."）造成的頁內跳轉「不會」可靠觸發 scroll，
  // 故另監聽 hashchange（點錨點時 hash 改變）與 load（帶 #hash 直接開啟、瀏覽器捲到錨點後）重判一次，
  // 否則跳到景點後 y 已在下方、但按鈕仍停留隱藏。
  window.addEventListener('hashchange', requestUpdate);
  window.addEventListener('load', requestUpdate);
  updateVisibility();   // DOMContentLoaded 當下先判一次（重整時若已在下方即顯示）
});
