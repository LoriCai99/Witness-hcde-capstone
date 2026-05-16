(function(){
  var STATE_KEY = 'witness-chat-state';
  var DEFAULT_WIDTH = 340;
  var MIN_W = 280;
  var MAX_W = 520;

  function readState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }

  function writeState(next) {
    var state = readState();
    Object.keys(next).forEach(function(key){ state[key] = next[key]; });
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function injectStyles() {
    if (document.getElementById('witness-chat-shared-style')) return;
    var style = document.createElement('style');
    style.id = 'witness-chat-shared-style';
    style.textContent = [
      'body{padding-right:var(--chat-w,340px);transition:padding-right .2s ease;}',
      'body[data-chat="slim"]{--chat-w:0px;}',
      'body[data-chat="float"]{--chat-w:0px;}',
      '.chat{position:fixed;top:0;right:0;bottom:0;width:var(--chat-w,340px);background:#fff;border-left:1px solid #e9e9e9;display:flex;flex-direction:column;overflow:hidden;z-index:30;transition:width .2s ease,top .2s ease,right .2s ease,bottom .2s ease,border-radius .2s ease,box-shadow .2s ease;font-family:Inter,system-ui,sans-serif;}',
      '.chat-grip{position:absolute;left:-3px;top:0;bottom:0;width:6px;cursor:col-resize;z-index:5;transition:background .15s;}',
      '.chat-grip:hover,.chat-grip.dragging{background:linear-gradient(90deg,transparent,#ff6900 50%,transparent);}',
      'body[data-chat="slim"] .chat-grip,body[data-chat="float"] .chat-grip{display:none;}',
      'body[data-chat="float"] .chat{top:72px;right:24px;bottom:24px;width:380px;border:1px solid rgba(69,85,108,.24);border-radius:12px;box-shadow:0 24px 60px -12px rgba(0,0,0,.22),0 4px 16px rgba(0,0,0,.06);}',
      'body[data-chat="slim"] .chat{width:56px;align-items:center;cursor:pointer;}',
      'body[data-chat="slim"] .chat-head{padding:16px 0;border-bottom:1px solid #e9e9e9;width:100%;justify-content:center;flex-direction:column;gap:8px;}',
      'body[data-chat="slim"] .chat-head>.chat-head-info,body[data-chat="slim"] .chat-head>.chat-tools,body[data-chat="slim"] .chat-body,body[data-chat="slim"] .chat-suggestions,body[data-chat="slim"] .chat-foot{display:none;}',
      'body[data-chat="slim"] .chat-status-dot{margin-left:0;}',
      'body[data-chat="slim"] .chat-mark{position:relative;}',
      'body[data-chat="slim"] .chat-mark::after{content:"";position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:#ff6900;border:2px solid #fff;}',
      '.slim-cta{display:none;writing-mode:vertical-rl;transform:rotate(180deg);font-family:JetBrains Mono,ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#adadad;padding:12px 0;}',
      'body[data-chat="slim"] .slim-cta{display:block;}',
      'body[data-chat="slim"] .chat:hover{width:56px;box-shadow:0 16px 48px rgba(18,11,11,.12);}',
      '.chat-head{padding:16px 18px;border-bottom:1px solid #e9e9e9;display:flex;align-items:center;gap:12px;flex-shrink:0;}',
      '.chat-head-info{display:flex;flex-direction:column;min-width:0;}',
      '.chat-tools{display:flex;align-items:center;gap:2px;margin-left:auto;}',
      '.chat-tool-btn{width:26px;height:26px;border-radius:6px;display:grid;place-items:center;cursor:pointer;border:none;background:transparent;color:#45556c;font-size:14px;line-height:1;transition:all .12s;}',
      '.chat-tool-btn:hover{background:#f4f4f4;color:#120b0b;}',
      '.chat-tool-btn.active{background:#120b0b;color:#fff;}',
      '.chat-mark{width:28px;height:28px;border-radius:6px;background:#120b0b;color:#fff;display:grid;place-items:center;font-family:Inter,sans-serif;font-weight:700;font-size:13px;flex-shrink:0;}',
      '.chat-title{font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:#120b0b;}',
      '.chat-sub{font-size:11px;color:#adadad;margin-top:1px;}',
      '.chat-status-dot{width:6px;height:6px;border-radius:50%;background:#16a34a;margin-left:auto;box-shadow:0 0 0 3px rgba(22,163,74,.15);flex-shrink:0;}',
      '.chat-body{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:16px;}',
      '.chat-body .msg{display:flex;flex-direction:column;gap:4px;max-width:92%;}',
      '.chat-body .msg.agent{align-self:flex-start;}',
      '.chat-body .msg.user{align-self:flex-end;align-items:flex-end;}',
      '.chat-body .msg-author{font-family:JetBrains Mono,ui-monospace,monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#adadad;}',
      '.chat-body .msg.agent .msg-author{color:#ff6900;}',
      '.chat-body .msg-bubble{padding:12px 16px;border-radius:10px;font-size:13px;line-height:1.5;}',
      '.chat-body .msg.agent .msg-bubble{background:#fff5f1;border:1px solid #ffe8df;color:#120b0b;}',
      '.chat-body .msg.user .msg-bubble{background:#120b0b;color:#fff;}',
      '.chat-body .msg-bubble strong{font-weight:600;}',
      '.chat-body .msg-bubble .link{color:#d95b03;text-decoration:underline;cursor:pointer;}',
      '.chat-suggestions{display:flex;flex-wrap:wrap;gap:6px;padding:0 18px 12px;}',
      '.suggestion-chip{font-size:11.5px;padding:5px 12px;border-radius:9999px;border:1px solid rgba(69,85,108,.24);background:#fff;color:#45556c;cursor:pointer;}',
      '.suggestion-chip:hover{border-color:#120b0b;color:#120b0b;}',
      '.chat-foot{border-top:1px solid #e9e9e9;padding:12px 16px;display:flex;flex-direction:column;gap:8px;}',
      '.chat-foot .dropzone{border:1.5px dashed rgba(69,85,108,.24);border-radius:8px;padding:10px 12px;font-size:11.5px;color:#adadad;display:flex;align-items:center;gap:8px;cursor:pointer;transition:all .15s;background:#f4f4f4;}',
      '.chat-foot .dropzone:hover,.chat-foot .dropzone.dragover{border-color:#ff6900;color:#d95b03;background:#fff5f1;}',
      '.chat-foot .dropzone::before{content:"↥";font-size:13px;color:#ff6900;}',
      '.chat-foot .dropzone strong{color:#120b0b;font-weight:600;}',
      '.chat-input-row{display:flex;align-items:center;gap:8px;border:1px solid rgba(69,85,108,.24);border-radius:8px;background:#fff;padding:6px 12px;}',
      '.chat-input-row:focus-within{border-color:#120b0b;}',
      '.chat-input{flex:1;border:none;outline:none;font-family:Inter,sans-serif;font-size:13px;color:#120b0b;background:transparent;padding:4px 0;min-width:0;}',
      '.chat-input::placeholder{color:#adadad;}',
      '.chat .send-btn{border:none;background:#ff6900;color:#fff;width:28px;height:28px;border-radius:6px;display:grid;place-items:center;cursor:pointer;font-size:13px;flex-shrink:0;}',
      '.chat .send-btn:hover{background:#d95b03;}',
      '.chat-foot-meta{font-family:JetBrains Mono,ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#adadad;display:flex;align-items:center;gap:6px;}',
      '.chat-foot-meta::before{content:"";width:5px;height:5px;border-radius:50%;background:#16a34a;}'
    ].join('');
    document.head.appendChild(style);
  }

  function svgData(label, bg, fg) {
    var safe = String(label || 'W').slice(0, 2).toUpperCase();
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" rx="14" fill="' + bg + '"/>' +
      '<text x="32" y="39" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700" fill="' + fg + '">' + safe + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function iconData(path, bg, fg) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" rx="14" fill="' + bg + '"/>' +
      '<path d="' + path + '" fill="none" stroke="' + fg + '" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function fallbackForImage(img, index) {
    var cls = img.className || '';
    var parentText = (img.closest('.nav-item,.health-chip,.stat-card,.ai-stat,.sec-title-row,.greeting-title-row,.insight-hd,.brand-logo') || img.parentElement || {}).textContent || '';
    var label = 'W';
    var bg = '#120b0b';
    var fg = '#ffffff';

    if (img.closest('.brand-logo')) { label = 'W'; bg = '#120b0b'; fg = '#ffffff'; }
    else if (parentText.match(/Dashboard/i)) { label = 'D'; bg = '#e7f4ff'; fg = '#155dfc'; }
    else if (parentText.match(/Invoice/i)) { label = 'I'; bg = '#fff5f1'; fg = '#ff6900'; }
    else if (parentText.match(/Autoflow/i)) { label = 'A'; bg = '#dcfce7'; fg = '#15803d'; }
    else if (parentText.match(/Settings/i)) { label = 'S'; bg = '#f4f4f4'; fg = '#45556c'; }
    else if (parentText.match(/healthy/i)) { label = '✓'; bg = '#dcfce7'; fg = '#15803d'; }
    else if (cls.indexOf('stat-icon') !== -1 || cls.indexOf('asi') !== -1) {
      var iconPaths = [
        'M32 12 L52 48 H12 L32 12 Z M32 24 V34 M32 43 H32.1',
        'M32 14 A18 18 0 1 1 31.9 14 M32 22 V34 L41 39',
        'M18 24 H46 M20 14 H44 L50 24 L44 50 H20 L14 24 L20 14 Z M25 41 L39 27 M25 28 H25.1 M39 40 H39.1',
        'M32 12 V20 M32 44 V52 M12 32 H20 M44 32 H52 M19 19 L24 24 M40 40 L45 45 M45 19 L40 24 M24 40 L19 45 M32 24 A8 8 0 1 1 31.9 24'
      ];
      bg = ['#fee2e2','#fff5f1','#fdf2d4','#e7f4ff'][index % 4];
      fg = ['#b91c1c','#d95b03','#b17728','#155dfc'][index % 4];
      return iconData(iconPaths[index % iconPaths.length], bg, fg);
    }
    else if (img.closest('.sec-title-row,.greeting-title-row,.insight-hd')) { label = '✦'; bg = '#fff5f1'; fg = '#ff6900'; }

    return svgData(label, bg, fg);
  }

  function stabilizeImages() {
    Array.prototype.forEach.call(document.querySelectorAll('img'), function(img, index) {
      if (img.dataset.witnessImgReady === 'true') return;
      img.dataset.witnessImgReady = 'true';
      var fallback = fallbackForImage(img, index);
      img.addEventListener('error', function() {
        if (img.src !== fallback) img.src = fallback;
      });
      if (/figma\.com\/api\/mcp\/asset/.test(img.getAttribute('src') || '')) {
        img.src = fallback;
      }
    });
  }

  function injectMarkup() {
    var existing = document.getElementById('chat');
    if (existing) return existing;
    var chat = document.createElement('aside');
    chat.className = 'chat';
    chat.id = 'chat';
    chat.innerHTML =
      '<div class="chat-grip" id="chatGrip" title="Drag to resize"></div>' +
      '<div class="slim-cta">Chat · Witness</div>' +
      '<div class="chat-head">' +
        '<div class="chat-mark">W</div>' +
        '<div class="chat-head-info"><div class="chat-title">Witness</div><div class="chat-sub">Always here · 47 invoices overnight</div></div>' +
        '<div class="chat-status-dot" title="Online"></div>' +
        '<div class="chat-tools"><button class="chat-tool-btn" id="btnFloat" title="Float as window">⊞</button><button class="chat-tool-btn" id="btnSlim" title="Collapse">—</button></div>' +
      '</div>' +
      '<div class="chat-body">' +
        '<div class="msg agent"><span class="msg-author">Witness · 09:02</span><div class="msg-bubble">Morning, Maya. Your brief is ready above. The <strong>$47,820 payment batch</strong> is built — I will wait for your commit before the 2 PM ACH cutoff.</div></div>' +
        '<div class="msg agent"><span class="msg-author">Witness · 09:03</span><div class="msg-bubble">Heads up: <strong>D. Lee approval</strong> escalates at 10 AM unless you decide on it first.</div></div>' +
        '<div class="msg user"><span class="msg-author">Maya</span><div class="msg-bubble">Pull up the BetaCo banking change. I want to verify before lunch.</div></div>' +
        '<div class="msg agent"><span class="msg-author">Witness · just now</span><div class="msg-bubble">On it — routing change, old vs new account, source email, and callback template. <span class="link">Open panel</span></div></div>' +
      '</div>' +
      '<div class="chat-suggestions"><span class="suggestion-chip">Draft Acme reply</span><span class="suggestion-chip">Show critical path</span><span class="suggestion-chip">Why was BetaCo held?</span></div>' +
      '<div class="chat-foot"><label class="dropzone" id="dropzone">Drop a <strong>PDF, image, or forwarded email</strong> here<input type="file" hidden multiple accept=".pdf,.png,.jpg,.jpeg,.eml,.msg" /></label><div class="chat-input-row"><input class="chat-input" placeholder="Ask Witness anything..." /><button class="send-btn" title="Send">↑</button></div><div class="chat-foot-meta">Encrypted · stays in your tenant</div></div>';
    document.body.appendChild(chat);
    return chat;
  }

  function boot() {
    stabilizeImages();
    injectStyles();
    injectMarkup();

    var body = document.body;
    var state = readState();
    var width = Math.max(MIN_W, Math.min(MAX_W, parseInt(state.width, 10) || DEFAULT_WIDTH));
    body.style.setProperty('--chat-w', width + 'px');

    function setChatMode(mode, persist) {
      if (['rail','slim','float'].indexOf(mode) === -1) mode = 'rail';
      body.setAttribute('data-chat', mode);
      var slim = document.getElementById('btnSlim');
      var flt = document.getElementById('btnFloat');
      if (slim) {
        slim.classList.toggle('active', mode === 'slim');
        slim.textContent = mode === 'slim' ? '→' : '—';
        slim.title = mode === 'slim' ? 'Expand' : 'Collapse';
      }
      if (flt) {
        flt.classList.toggle('active', mode === 'float');
        flt.textContent = mode === 'float' ? '⇲' : '⊞';
        flt.title = mode === 'float' ? 'Dock to side' : 'Float as window';
      }
      if (persist !== false) writeState({ mode: mode });
    }

    var initialMode = state.mode || (window.innerWidth < 1440 ? 'slim' : 'rail');
    setChatMode(initialMode, false);

    var head = document.querySelector('.chat-head');
    if (head) {
      head.onclick = function() {
        if (body.getAttribute('data-chat') === 'slim') setChatMode('rail');
      };
    }
    var tools = document.querySelector('.chat-tools');
    if (tools) tools.onclick = function(event) { event.stopPropagation(); };

    var slimBtn = document.getElementById('btnSlim');
    if (slimBtn) slimBtn.onclick = function(event) {
      event.stopPropagation();
      setChatMode(body.getAttribute('data-chat') === 'slim' ? 'rail' : 'slim');
    };
    var floatBtn = document.getElementById('btnFloat');
    if (floatBtn) floatBtn.onclick = function(event) {
      event.stopPropagation();
      setChatMode(body.getAttribute('data-chat') === 'float' ? 'rail' : 'float');
    };
    window.expandFromSlim = function() {
      if (body.getAttribute('data-chat') === 'slim') setChatMode('rail');
    };

    var grip = document.getElementById('chatGrip');
    if (grip && !grip.dataset.witnessBound) {
      grip.dataset.witnessBound = 'true';
      grip.addEventListener('mousedown', function(e) {
        if (body.getAttribute('data-chat') !== 'rail') return;
        e.preventDefault();
        var startX = e.clientX;
        var startW = parseInt(getComputedStyle(body).getPropertyValue('--chat-w'), 10) || DEFAULT_WIDTH;
        grip.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        function onMove(ev) {
          var delta = startX - ev.clientX;
          var next = Math.max(MIN_W, Math.min(MAX_W, startW + delta));
          body.style.setProperty('--chat-w', next + 'px');
        }
        function onUp() {
          var finalW = parseInt(getComputedStyle(body).getPropertyValue('--chat-w'), 10) || DEFAULT_WIDTH;
          writeState({ width: finalW, mode: 'rail' });
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          grip.classList.remove('dragging');
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    var dz = document.getElementById('dropzone');
    if (dz && !dz.dataset.witnessBound) {
      dz.dataset.witnessBound = 'true';
      ['dragenter','dragover'].forEach(function(name){
        dz.addEventListener(name, function(ev){ ev.preventDefault(); dz.classList.add('dragover'); });
      });
      ['dragleave','drop'].forEach(function(name){
        dz.addEventListener(name, function(ev){ ev.preventDefault(); dz.classList.remove('dragover'); });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
