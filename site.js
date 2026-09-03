/* === 旅行深度自助筆記 · Site Chrome ===
   全站統一：(1) 深/淺主題切換（預設 light，不跟系統，記憶於 localStorage）
             (2) 頁尾標準免責聲明。
   刻意不碰頁面內容與互動，避免衝突。 */
(function () {
  /* ---- Theme：預設 GitBook light，手動切換，記住選擇（不跟系統） ---- */
  var THEME_KEY = 'travel-theme';
  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function applyTheme(t) {
    document.documentElement.dataset.theme = (t === 'dark') ? 'dark' : 'light';
  }
  function currentTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }
  function setTheme(t) {
    applyTheme(t);
    try { localStorage.setItem(THEME_KEY, currentTheme()); } catch (e) {}
    syncToggle();
  }
  // 盡早套用，減少切換閃爍（預設 light）
  applyTheme(storedTheme() || 'light');

  var toggleBtn = null;
  function syncToggle() {
    if (!toggleBtn) return;
    var dark = currentTheme() === 'dark';
    toggleBtn.textContent = dark ? '☀' : '☾';   /* 顯示「切到哪」：深色時顯示太陽 */
    var label = dark ? '切換到淺色主題' : '切換到深色主題';
    toggleBtn.setAttribute('aria-label', label);
    toggleBtn.setAttribute('title', label);
  }
  function buildToggle() {
    var b = document.createElement('button');
    b.className = 'site-theme-toggle';
    b.type = 'button';
    b.setAttribute('data-site-theme-toggle', '1');
    b.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
    toggleBtn = b;
    syncToggle();
    return b;
  }

  function injectStyle() {
    if (document.getElementById('site-chrome-style')) return;
    var css = document.createElement('style');
    css.id = 'site-chrome-style';
    css.textContent =
      /* 主題切換鈕：固定右上、圓形、觸控友善（44px） */
      '.site-theme-toggle{position:fixed;top:14px;right:16px;z-index:50;width:44px;height:44px;' +
        'border-radius:999px;border:1px solid var(--border,#e4e8ef);background:var(--bg2,#fff);' +
        'color:var(--text2,#3a424e);font-size:20px;line-height:1;cursor:pointer;box-shadow:var(--shadow,0 4px 12px rgba(0,0,0,.08));' +
        'display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s;}' +
      '.site-theme-toggle:hover{background:var(--bg3,#eef0f4);}' +
      '.site-theme-toggle:focus-visible{outline:3px solid var(--primary,#0f766e);outline-offset:2px;}' +
      /* 免責聲明 */
      '.site-disclaimer{margin:24px 0 8px;padding:14px 16px;border:1px solid var(--border,#e4e8ef);' +
        'border-radius:12px;background:var(--bg3,#eef0f4);color:var(--text2,#3a424e);font-size:13px;line-height:1.7;}' +
      '.site-disclaimer strong{color:var(--text,#1a1f28);}' +
      '.site-disclaimer .sd-copyright{display:block;margin-top:10px;padding-top:10px;border-top:1px solid var(--border,#e4e8ef);}' +
      '.site-disclaimer .sd-brand{display:block;margin-top:8px;font-size:12px;color:var(--text3,#64707e);}' +
      /* (B) 列印 / 存 PDF 時才出現的浮水印:螢幕閱讀零影響 */
      '@media print{#hb-kofi-fab{display:none;}' +
        'html::before{content:"\\00A9 HD Chen \\2014 Not for redistribution";position:fixed;top:44%;left:0;right:0;' +
          'text-align:center;transform:rotate(-22deg);font:800 40pt -apple-system,BlinkMacSystemFont,sans-serif;' +
          'color:rgba(0,0,0,.07);letter-spacing:2px;pointer-events:none;z-index:2147483646;}' +
        'body::after{content:"\\00A9 2026 HD Chen \\00B7 hdchen-course \\00B7 \\672A\\7D93\\6388\\6B0A\\4E0D\\5F97\\91CD\\88FD\\6216\\6563\\5E03 \\00B7 All Rights Reserved";' +
          'position:fixed;left:0;right:0;bottom:6mm;text-align:center;font:600 9pt -apple-system,sans-serif;color:#8a8f98;}' +
      '}';
    document.head.appendChild(css);
  }

  function buildDisclaimer() {
    var d = document.createElement('footer');
    d.className = 'site-disclaimer';
    d.setAttribute('data-site-disclaimer', '1');
    // LICENSE 在專案根目錄；子資料夾頁面（japan/、uk/ 等）需回上一層
    var cssLink = document.querySelector('link[rel="stylesheet"][href*="common.css"]');
    var prefix = (cssLink && cssLink.getAttribute('href').indexOf('../') === 0) ? '../' : '';
    d.innerHTML =
      '<strong>閱讀須知</strong>：本站為個人自助旅行規劃參考，' +
      '交通班次、票價、營業/開放時間、預約規則等資訊<strong>會隨時異動</strong>，' +
      '出發前務必以各設施/交通業者官方公告為準。旅遊過程中的行程安排、支出與風險由旅行者自行負責。' +
      '<span class="sd-copyright">© 2026 HD Chen · 保留所有權利（All Rights Reserved）。' +
      '本站<strong>原創表達</strong>（章節編排、速查卡與版面設計、行程規劃與全部原創文字）未經著作權人同意，' +
      '不得轉載、改作或作商業利用；票價、時刻與各設施規則等<strong>事實資訊</strong>屬公開事實、不主張獨佔，' +
      '官方引文著作權歸各該權利人。內容部分由 AI 工具輔助生成、由作者主導編輯與查證。' +
      '詳見 <a href="' + prefix + 'LICENSE">授權條款（LICENSE）</a>。</span>' +
      '<span class="sd-brand">旅行深度自助筆記 · GitBook light · 台灣散客觀點</span>';
    return d;
  }

  function ensureSkipLink() {
    // 主內容需有 id，供 skip-link 錨定
    var main = document.querySelector('.site-main') || document.querySelector('main');
    if (main && !main.id) main.id = 'site-main';
    // 確保啟用 skip-link 後鍵盤焦點確實落到主內容（部分瀏覽器對非可聚焦容器只捲動不移焦）
    if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    // 於 <body> 最前面注入「跳至主內容」skip-link（只注入一次）
    if (!document.querySelector('[data-site-skip]')) {
      var a = document.createElement('a');
      a.className = 'site-skip';
      a.setAttribute('data-site-skip', '1');
      a.href = '#site-main';
      a.textContent = '跳至主內容';
      document.body.insertBefore(a, document.body.firstChild);
    }
  }

  function run() {
    injectStyle();
    applyTheme(storedTheme() || 'light');   // 確保 DOM ready 後仍正確
    ensureSkipLink();
    /* (C) 隱形數位指紋 canary:visually-hidden,畫面看不到但存在於原始碼,供出處證明。 */
    if (!document.getElementById('hb-canary')) {
      var cn = document.createElement('div');
      cn.id = 'hb-canary';
      cn.setAttribute('aria-hidden', 'true');
      cn.style.cssText = 'position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;' +
        'clip:rect(0 0 0 0);white-space:nowrap;border:0;opacity:0;pointer-events:none;';
      cn.textContent = 'Original work © 2026 HD Chen (hdchen-course). Unauthorized commercial use or redistribution is prohibited. Source fingerprint: HDC-TRV-4M8P1.';
      document.body.appendChild(cn);
    }
    if (!document.querySelector('[data-site-theme-toggle]')) {
      document.body.appendChild(buildToggle());
    }
    if (!document.querySelector('[data-site-disclaimer]')) {
      var host = document.querySelector('.site-main') || document.body;
      host.appendChild(buildDisclaimer());
    }
    if (!document.getElementById('hb-kofi-fab')) {
      var fab = document.createElement('a');
      fab.id = 'hb-kofi-fab';
      fab.href = 'https://ko-fi.com/A5O7268MXT';
      fab.target = '_blank'; fab.rel = 'noopener';
      fab.setAttribute('aria-label', 'Buy me a coffee at ko-fi.com');
      fab.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:2147483000;line-height:0;border-radius:10px;box-shadow:0 3px 14px rgba(0,0,0,.22);';
      fab.innerHTML = '<img src="https://storage.ko-fi.com/cdn/kofi6.png?v=6" alt="Buy Me a Coffee at ko-fi.com" height="40" loading="lazy" style="display:block !important;height:40px !important;width:auto !important;max-width:none !important;border-radius:10px;">';
      document.body.appendChild(fab);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else { run(); }
})();
