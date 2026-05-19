/*
 * Witness shared chat panel — single source of truth.
 *
 * - Injects the same chat markup, styles (via witness-chat-panel.css link), and
 *   behavior as dashboard.html into every host page.
 * - Mounts into an existing <aside class="chat" id="chat"></aside> placeholder
 *   inside the host page's .app-grid (the 3rd grid column). If no placeholder
 *   exists, falls back to creating one at the end of <body>.
 * - Persists mode (rail/slim/float), float position, AND active conversation
 *   (Ask/Think/Do + gate decision) in localStorage so the panel looks the same
 *   when the user navigates between pages.
 */
(function () {
  'use strict';

  /* ─────────── localStorage keys ─────────── */
  var LS_MODE       = 'witness-chat-mode';
  var LS_FLOAT_POS  = 'witness-chat-float-pos';
  var LS_WIDTH      = 'witness-chat-width';
  var LS_CONVO      = 'witness-chat-convo';      /* JSON: { kind, gate } */

  var DEFAULT_WIDTH = 340;
  var MIN_W = 280;
  var MAX_W = 520;

  /* ─────────── Template strings (extracted from dashboard.html) ─────────── */

  var EMPTY_STATE_HTML =
    '<div class="empty-state" id="emptyState">' +
      '<div class="empty-title">What can Witness do for you?</div>' +
      '<div class="empty-spacer"></div>' +
      '<div class="empty-chips-row" role="list" aria-label="Suggested modes">' +
        '<button class="empty-chip" type="button" role="listitem" data-kind="ask"' +
                ' data-prompt="Where is INV-1048 in the approval chain?">' +
          '<span class="empty-chip-title">Assist</span>' +
          '<span class="empty-chip-sub">info</span>' +
        '</button>' +
        '<button class="empty-chip" type="button" role="listitem" data-kind="think"' +
                ' data-prompt="How should I handle the Brightline backlog?">' +
          '<span class="empty-chip-title">Suggest</span>' +
          '<span class="empty-chip-sub">action</span>' +
        '</button>' +
        '<button class="empty-chip" type="button" role="listitem" data-kind="do"' +
                ' data-prompt="Send follow-ups to all 6 overdue vendor items">' +
          '<span class="empty-chip-title">Do</span>' +
          '<span class="empty-chip-sub">review</span>' +
        '</button>' +
      '</div>' +
    '</div>';

  var TPL_ASK_HTML =
    '<div class="msg-user">' +
      '<button class="msg-replay" onclick="runPrompt(\'ask\')" title="Replay">↻</button>' +
      '<span class="kind-tag">Ask</span><br/>' +
      'Where is INV-1048 in the approval chain?' +
    '</div>' +
    '<div class="msg-agent">' +
      '<div class="lede stream-item">Here\'s where INV-1048 currently lives, pulled across three systems.</div>' +
      '<div class="ask-block stream-item">' +
        '<div class="ask-block-head">' +
          '<span>Current status</span>' +
          '<span class="src-badge live">NetSuite ERP · live</span>' +
        '</div>' +
        '<div class="ask-block-body">' +
          '<div class="ask-status stream-item">' +
            '<div>' +
              '<div class="status-label">Stage</div>' +
              '<div class="status-val">Pending J. Park\'s approval</div>' +
            '</div>' +
            '<div class="status-time">waiting 3 days</div>' +
          '</div>' +
          '<ul class="ask-timeline">' +
            '<li class="stream-item"><span class="time">Apr 22 · 10:14</span>Invoice received via Brightline EDI</li>' +
            '<li class="stream-item"><span class="time">Apr 22 · 10:15</span>3-way match passed · PO-7702 / GRN-4421</li>' +
            '<li class="stream-item"><span class="time">Apr 22 · 10:16</span>Routed to J. Park (over $5k threshold)</li>' +
            '<li class="stream-item"><span class="time">Apr 24 · 09:00</span>Agent reminder #1 sent</li>' +
            '<li class="stream-item"><span class="time">Apr 25 · 09:00</span>Agent reminder #2 sent</li>' +
            '<li class="current stream-item"><span class="time">Now</span>Awaiting J. Park\'s approval</li>' +
          '</ul>' +
          '<div class="ask-cross stream-item">' +
            '<div class="ask-doc">' +
              '<div class="dn">PO-7702.pdf</div>' +
              '<div class="ds"><span class="src-badge">Amazon Business</span></div>' +
            '</div>' +
            '<div class="ask-doc">' +
              '<div class="dn">GRN-4421</div>' +
              '<div class="ds"><span class="src-badge">NetSuite</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="trust-strip stream-item">' +
            '✓ <strong>Auto-verified</strong> · all three docs match · synced 2 min ago' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ask-followup stream-item">' +
        'Heads up — Brightline\'s <strong>2% early-pay discount expires Apr 29</strong>. <a onclick="runPrompt(\'think\')">What should we do?</a>' +
      '</div>' +
    '</div>';

  var TPL_THINK_HTML =
    '<div class="msg-user">' +
      '<button class="msg-replay" onclick="runPrompt(\'think\')" title="Replay">↻</button>' +
      '<span class="kind-tag">Think</span><br/>' +
      'How should I handle the Brightline backlog?' +
    '</div>' +
    '<div class="msg-agent">' +
      '<div class="think-analysis stream-item">' +
        '<em>Here\'s what I\'m seeing.</em> Brightline has <strong>2 items, $10,470</strong>, oldest waiting 2 days. They\'ve responded to <strong>2 of your last 3 follow-ups</strong> (typical turnaround: 18h after a nudge). One item has a credit memo pending; the other needs a proof of delivery.' +
      '</div>' +
      '<div class="think-options">' +
        '<div class="think-opt recommended stream-item">' +
          '<div class="opt-head">' +
            '<div class="opt-title">Send one consolidated follow-up</div>' +
            '<div class="opt-tags">' +
              '<span class="opt-tag low">Low risk</span>' +
              '<span class="opt-tag low">Low effort</span>' +
            '</div>' +
          '</div>' +
          '<div class="opt-rationale">' +
            'Brightline responds better to single threaded emails. Bundles both asks (credit memo + POD) and references your past payment history — likely 18–24h response based on pattern.' +
          '</div>' +
          '<div class="opt-actions">' +
            '<button class="opt-do primary" onclick="runPrompt(\'do\')">Do this →</button>' +
            '<a class="opt-why">Why this works</a>' +
          '</div>' +
        '</div>' +
        '<div class="think-opt stream-item">' +
          '<div class="opt-head">' +
            '<div class="opt-title">Escalate to Brightline AR lead</div>' +
            '<div class="opt-tags">' +
              '<span class="opt-tag med">Medium risk</span>' +
              '<span class="opt-tag low">Low effort</span>' +
            '</div>' +
          '</div>' +
          '<div class="opt-rationale">' +
            'Skip Aaron and go straight to AR lead Priya Mehta. Faster, but you\'ve only escalated once this year — may signal urgency you don\'t intend.' +
          '</div>' +
          '<div class="opt-actions">' +
            '<button class="opt-do">Do this</button>' +
            '<a class="opt-why">Why this works</a>' +
          '</div>' +
        '</div>' +
        '<div class="think-opt stream-item">' +
          '<div class="opt-head">' +
            '<div class="opt-title">Pause + review contract SLA</div>' +
            '<div class="opt-tags">' +
              '<span class="opt-tag low">Low risk</span>' +
              '<span class="opt-tag high">High effort</span>' +
            '</div>' +
          '</div>' +
          '<div class="opt-rationale">' +
            'Your MSA says credit memos must be issued within 5 business days — you\'re at day 2. Worth doing if this is a recurring pattern; not urgent today.' +
          '</div>' +
          '<div class="opt-actions">' +
            '<button class="opt-do">Do this</button>' +
            '<a class="opt-why">Why this works</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var TPL_DO_HTML =
    '<div class="msg-user">' +
      '<button class="msg-replay" onclick="runPrompt(\'do\')" title="Replay">↻</button>' +
      '<span class="kind-tag">Do</span><br/>' +
      'Send follow-ups to all 6 overdue vendor items' +
    '</div>' +
    '<div class="msg-agent">' +
      '<div class="do-plan stream-item" data-step="1">' +
        '<div class="do-plan-head">⚡ Plan</div>' +
        '<div class="do-plan-summary">' +
          'Send <strong>6 follow-ups</strong> to <strong>4 vendors</strong> · $31,240 total · using your saved templates. <strong>4 are routine</strong> (auto-send); I\'ll flag anything that needs your call as I go.' +
        '</div>' +
      '</div>' +
      '<div class="do-log stream-item" data-step="2">' +
        '<div class="do-log-head">' +
          '<span>Execution log</span>' +
          '<span class="log-status starting" data-log-status>' +
            '<span class="dot"></span><span class="label">starting</span>' +
          '</span>' +
        '</div>' +
        '<div class="log-body" data-log-body></div>' +
      '</div>' +
      '<div class="do-gate stream-item" data-step="7">' +
        '<div class="do-gate-head">Needs your call before I proceed</div>' +
        '<div class="do-gate-q">' +
          'Greenline\'s primary contact <strong>Sara Liu</strong> bounced last week. Her backup <strong>Tom Greenfield</strong> isn\'t in your approved list yet. <strong>How should I proceed?</strong>' +
        '</div>' +
        '<div class="do-gate-actions">' +
          '<button class="gate-btn ok"  onclick="resolveGate(this, \'Added Tom Greenfield to approved list, sending to him.\')">Add Tom &amp; continue</button>' +
          '<button class="gate-btn alt" onclick="resolveGate(this, \'Sending to Sara only — will retry tomorrow if she bounces.\')">Use Sara only</button>' +
          '<button class="gate-btn alt" onclick="resolveGate(this, \'Skipped Greenline — flagged for tomorrow.\')">Skip Greenline</button>' +
        '</div>' +
        '<div class="do-gate-decision">Your call recorded · resuming…</div>' +
      '</div>' +
      '<div class="do-summary stream-item" data-step="11">' +
        '<div class="do-summary-head">✓ Ready for review</div>' +
        '<div class="do-summary-stats">' +
          '<div class="ds-stat"><div class="n">5</div><div class="l">Drafts ready</div></div>' +
          '<div class="ds-stat"><div class="n">1</div><div class="l">Needs review</div></div>' +
          '<div class="ds-stat"><div class="n">12s</div><div class="l">Total time</div></div>' +
        '</div>' +
        '<div class="do-summary-actions">' +
          '<button class="ds-btn primary">Approve all &amp; send</button>' +
          '<button class="ds-btn">Review one-by-one</button>' +
          '<button class="ds-btn audit">View audit log</button>' +
          '<button class="ds-btn undo">Undo all drafts</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* Static log lines used for restoring a completed Do conversation without
     replaying the entire animation. Mirrors the live streamDo() output. */
  var DO_LOG_LINES_PRE_GATE = [
    { thinking: 'Reading policy rules and your saved templates…' },
    { time: '14:32:04', cls: 'ok',   icon: '✓', msg: 'Drafted email to <span class="hl">Brightline</span> — consolidated (credit memo + POD)', view: 'view draft' },
    { time: '14:32:09', cls: 'ok',   icon: '✓', msg: 'Drafted email to <span class="hl">Office Depot</span> — single item, $7,160', view: 'view draft' },
    { thinking: 'Cross-checking Staples INV-1105 against dispute log…' },
    { time: '14:32:14', cls: 'warn', icon: '⏸', msg: '<span class="hl">Staples INV-1105</span> — open dispute on file, flagged for your review', view: 'review' },
    { time: '14:32:18', cls: 'ok',   icon: '✓', msg: 'Drafted email to <span class="hl">Staples</span> — POD only (skipped disputed item)', view: 'view draft' },
    { thinking: 'Verifying Greenline contact list…' },
    { time: '14:32:21', cls: 'warn', icon: '⏸', msg: '<span class="hl">Greenline</span> — primary contact bounced, backup not yet approved', view: null }
  ];
  var DO_LOG_LINES_POST_GATE = [
    { time: '14:32:38', cls: 'ok', icon: '✓', msg: 'Drafted email to <span class="hl">Greenline</span> — routed per your call', view: 'view draft' },
    { time: '14:32:42', cls: 'ok', icon: '✓', msg: 'Audit trail entry written · 5 drafts, 1 flagged', view: 'audit' }
  ];

  /* ─────────── localStorage helpers ─────────── */

  function lsRead(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function lsWrite(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* ignore */ }
  }
  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch (_) { /* ignore */ }
  }
  function lsReadJSON(key) {
    var raw = lsRead(key); if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  }

  function loadStoredMode() {
    var m = lsRead(LS_MODE);
    return (m === 'rail' || m === 'slim' || m === 'float') ? m : null;
  }
  function loadFloatPos() {
    var p = lsReadJSON(LS_FLOAT_POS);
    if (!p) return null;
    return (typeof p.left === 'number' && typeof p.top === 'number') ? p : null;
  }
  function loadStoredWidth() {
    var w = parseInt(lsRead(LS_WIDTH), 10);
    return isFinite(w) ? Math.max(MIN_W, Math.min(MAX_W, w)) : null;
  }
  function loadConvo() {
    var c = lsReadJSON(LS_CONVO);
    if (!c || !c.kind || (c.kind !== 'ask' && c.kind !== 'think' && c.kind !== 'do')) return null;
    return c;
  }
  function saveConvo(convo) {
    if (!convo) { lsRemove(LS_CONVO); }
    else        { lsWrite(LS_CONVO, JSON.stringify(convo)); }
  }

  /* ─────────── Inject CSS link if not already present ─────────── */
  function ensureStylesheet() {
    var alreadyLinked = false;
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (href.indexOf('witness-chat-panel.css') !== -1) { alreadyLinked = true; break; }
    }
    if (!alreadyLinked) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'witness-chat-panel.css';
      document.head.appendChild(link);
    }
  }

  /* ─────────── Build chat HTML inside the host placeholder ─────────── */
  function injectMarkup() {
    var chat = document.getElementById('chat');
    if (!chat) {
      // Fallback: create the aside at end of body. (Pages should provide a
      // placeholder inside .app-grid for the 3-column layout to work properly.)
      chat = document.createElement('aside');
      chat.className = 'chat';
      chat.id = 'chat';
      document.body.appendChild(chat);
    }
    // If the chat ended up as a direct child of <body> (no .app-grid / .app
    // wrapper), reserve right-edge space via the .chat-padded body class so
    // the page content doesn't slide underneath the fixed-position panel.
    var parentTag = chat.parentElement && chat.parentElement.tagName;
    var parentCls = chat.parentElement && chat.parentElement.className || '';
    if (parentTag === 'BODY' || !/\b(app-grid|app)\b/.test(parentCls)) {
      document.body.classList.add('chat-padded');
    }
    // Always replace existing innerHTML to ensure uniformity across pages.
    chat.innerHTML =
      '<div class="chat-grip" id="chatGrip" title="Drag to resize"></div>' +
      '<div class="slim-cta">Chat · Witness</div>' +
      '<div class="chat-head" onclick="expandFromSlim()">' +
        '<div class="chat-mark" id="chatMark">W</div>' +
        '<div class="chat-head-info">' +
          '<div class="chat-title">Witness</div>' +
          '<div class="chat-sub">Procurement agent · always on</div>' +
        '</div>' +
        '<div class="chat-status-dot" title="Online"></div>' +
        '<div class="chat-tools" onclick="event.stopPropagation()">' +
          '<button class="chat-tool-btn" id="btnReset" title="New conversation" onclick="resetConvo()">↺</button>' +
          '<button class="chat-tool-btn" id="btnFloat" title="Float as window">⊞</button>' +
          '<button class="chat-tool-btn" id="btnSlim"  title="Collapse">—</button>' +
        '</div>' +
      '</div>' +
      '<div class="chat-body" id="chatBody">' +
        EMPTY_STATE_HTML +
        '<div class="convo-area" id="convoArea"></div>' +
      '</div>' +
      '<div class="chat-bottom-prompts" id="bottomPrompts" style="display:none;">' +
        '<div class="bp-label">Try another mode</div>' +
        '<div class="bp-row">' +
          '<button class="bp-chip ask"   onclick="runPrompt(\'ask\')">  <span class="m">?</span><span class="lbl">Ask</span>  </button>' +
          '<button class="bp-chip think" onclick="runPrompt(\'think\')"><span class="m">◇</span><span class="lbl">Think</span></button>' +
          '<button class="bp-chip do"    onclick="runPrompt(\'do\')">   <span class="m">⚡</span><span class="lbl">Do</span>   </button>' +
        '</div>' +
      '</div>' +
      '<div class="chat-foot">' +
        '<div class="chat-input-row">' +
          '<input class="chat-input" placeholder="Ask, suggest, or delegate to Witness…" />' +
          '<button class="send-btn" title="Send">↑</button>' +
        '</div>' +
        '<div class="chat-foot-meta">Encrypted · stays in your tenant</div>' +
      '</div>';
    return chat;
  }

  /* ─────────── Mode (rail/slim/float) ─────────── */

  function chatEl() { return document.getElementById('chat'); }

  function clampPos(pos, w, h) {
    w = w || 360; h = h || Math.max(420, window.innerHeight - 96);
    var maxLeft = Math.max(0, window.innerWidth - w - 8);
    var maxTop  = Math.max(0, window.innerHeight - 80);
    return {
      left: Math.min(Math.max(8, pos.left), maxLeft),
      top:  Math.min(Math.max(8, pos.top),  maxTop),
      width: w, height: h
    };
  }
  function applyFloatPos(pos) {
    var c = chatEl();
    if (!c || !pos) return;
    c.style.top = pos.top + 'px'; c.style.left = pos.left + 'px';
    c.style.right = 'auto'; c.style.bottom = 'auto';
    if (pos.width)  c.style.width  = pos.width  + 'px';
    if (pos.height) c.style.height = pos.height + 'px';
  }
  function clearFloatPos() {
    var c = chatEl(); if (!c) return;
    c.style.top = c.style.left = c.style.right = c.style.bottom = c.style.width = c.style.height = '';
  }

  function setChatMode(mode, opts) {
    var persist = !opts || opts.persist !== false;
    var body = document.body;
    var prev = body.getAttribute('data-chat');
    body.setAttribute('data-chat', mode);

    // Clear inline --chat-w from any earlier rail drag so slim/float CSS takes effect.
    if (mode !== 'rail') body.style.removeProperty('--chat-w');
    else {
      var w = loadStoredWidth();
      if (w) body.style.setProperty('--chat-w', w + 'px');
    }

    if (mode === 'float') {
      var pos = loadFloatPos();
      if (pos) applyFloatPos(clampPos(pos, pos.width, pos.height));
      else clearFloatPos();
    } else {
      clearFloatPos();
    }

    var btnSlim  = document.getElementById('btnSlim');
    var btnFloat = document.getElementById('btnFloat');
    if (btnSlim) {
      btnSlim.classList.toggle('active', mode === 'slim');
      btnSlim.textContent = mode === 'slim' ? '→' : '—';
      btnSlim.title       = mode === 'slim' ? 'Expand' : 'Collapse';
    }
    if (btnFloat) {
      btnFloat.classList.toggle('active', mode === 'float');
      btnFloat.textContent = mode === 'float' ? '⇲' : '⊞';
      btnFloat.title       = mode === 'float' ? 'Dock to side' : 'Float as window';
    }

    if (persist && mode !== prev) lsWrite(LS_MODE, mode);
  }

  /* ─────────── Streaming infrastructure ─────────── */
  var streamToken = 0;
  var gateResolver = null;

  function wait(ms)   { return new Promise(function (r) { setTimeout(r, ms); }); }
  function isStale(t) { return t !== streamToken; }

  function scrollToBottom() {
    var b = document.getElementById('chatBody');
    if (b) b.scrollTop = b.scrollHeight;
  }
  function setAgentThinking(on) {
    var m = document.getElementById('chatMark');
    if (m) m.classList.toggle('thinking', !!on);
  }
  function setLogStatus(root, status, label) {
    var el = root.querySelector('[data-log-status]');
    if (!el) return;
    el.className = 'log-status ' + status;
    el.innerHTML = '<span class="dot"></span><span class="label">' + label + '</span>';
  }

  async function typewriter(el, text, token, charDelay) {
    charDelay = charDelay || 30;
    el.classList.add('typing');
    el.innerHTML = '<span class="tw-cursor"></span>';
    var cursor = el.querySelector('.tw-cursor');
    for (var i = 0; i < text.length; i++) {
      if (isStale(token)) return;
      cursor.insertAdjacentText('beforebegin', text[i]);
      var jitter = Math.random() * 18;
      await wait(charDelay + jitter);
      if (i % 6 === 0) scrollToBottom();
    }
    await wait(480);
    if (isStale(token)) return;
    cursor.remove();
    el.classList.remove('typing');
  }

  function appendLogLine(logBody, opts) {
    var div = document.createElement('div');
    div.className = 'log-line stream-item';
    div.innerHTML =
      '<span class="t">' + opts.time + '</span>' +
      '<span class="s ' + opts.status.cls + '">' + opts.status.icon + '</span>' +
      '<span class="msg">' + opts.msg + '</span>' +
      (opts.view ? '<span class="view">' + opts.view + '</span>' : '<span></span>');
    logBody.appendChild(div);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { div.classList.add('shown'); });
    });
    scrollToBottom();
    return div;
  }
  function appendThinking(logBody) {
    var div = document.createElement('div');
    div.className = 'do-thinking stream-item';
    logBody.appendChild(div);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { div.classList.add('shown'); });
    });
    scrollToBottom();
    return div;
  }
  async function revealStep(scope, step, token, holdAfter) {
    var el = scope.querySelector('[data-step="' + step + '"]');
    if (!el || isStale(token)) return null;
    el.classList.add('shown');
    scrollToBottom();
    if (holdAfter) await wait(holdAfter);
    return el;
  }

  /* ─────────── DO stream ─────────── */
  async function streamDo(scope) {
    var token = ++streamToken;
    setAgentThinking(true);

    await wait(500);
    await revealStep(scope, 1, token, 900);
    if (isStale(token)) return;

    var logRoot = await revealStep(scope, 2, token, 550);
    if (!logRoot || isStale(token)) return;
    var logBody = logRoot.querySelector('[data-log-body]');
    await wait(600);
    setLogStatus(logRoot, 'running', 'running');

    var t1 = appendThinking(logBody);
    await typewriter(t1, 'Reading policy rules and your saved templates…', token);
    if (isStale(token)) return;
    await wait(500);

    appendLogLine(logBody, {
      time: '14:32:04',
      status: { cls: 'ok', icon: '✓' },
      msg: 'Drafted email to <span class="hl">Brightline</span> — consolidated (credit memo + POD)',
      view: 'view draft'
    });
    await wait(950); if (isStale(token)) return;

    appendLogLine(logBody, {
      time: '14:32:09',
      status: { cls: 'ok', icon: '✓' },
      msg: 'Drafted email to <span class="hl">Office Depot</span> — single item, $7,160',
      view: 'view draft'
    });
    await wait(1050); if (isStale(token)) return;

    var t2 = appendThinking(logBody);
    await typewriter(t2, 'Cross-checking Staples INV-1105 against dispute log…', token);
    if (isStale(token)) return;
    await wait(450);

    appendLogLine(logBody, {
      time: '14:32:14',
      status: { cls: 'warn', icon: '⏸' },
      msg: '<span class="hl">Staples INV-1105</span> — open dispute on file, flagged for your review',
      view: 'review'
    });
    await wait(800);
    appendLogLine(logBody, {
      time: '14:32:18',
      status: { cls: 'ok', icon: '✓' },
      msg: 'Drafted email to <span class="hl">Staples</span> — POD only (skipped disputed item)',
      view: 'view draft'
    });
    await wait(950); if (isStale(token)) return;

    var t3 = appendThinking(logBody);
    await typewriter(t3, 'Verifying Greenline contact list…', token);
    if (isStale(token)) return;
    await wait(420);

    appendLogLine(logBody, {
      time: '14:32:21',
      status: { cls: 'warn', icon: '⏸' },
      msg: '<span class="hl">Greenline</span> — primary contact bounced, backup not yet approved',
      view: null
    });
    await wait(750);

    setLogStatus(logRoot, 'paused', 'paused — awaiting your call');
    setAgentThinking(false);
    await revealStep(scope, 7, token);
    if (isStale(token)) return;

    await new Promise(function (r) { gateResolver = r; });
    if (isStale(token)) return;

    setAgentThinking(true);
    setLogStatus(logRoot, 'running', 'running');
    await wait(700);

    appendLogLine(logBody, {
      time: '14:32:38',
      status: { cls: 'ok', icon: '✓' },
      msg: 'Drafted email to <span class="hl">Greenline</span> — routed per your call',
      view: 'view draft'
    });
    await wait(900); if (isStale(token)) return;

    appendLogLine(logBody, {
      time: '14:32:42',
      status: { cls: 'ok', icon: '✓' },
      msg: 'Audit trail entry written · 5 drafts, 1 flagged',
      view: 'audit'
    });
    await wait(850); if (isStale(token)) return;

    setLogStatus(logRoot, 'complete', 'complete');
    setAgentThinking(false);
    await wait(500);
    await revealStep(scope, 11, token);
  }

  /* ─────────── Simple staggered reveal for Ask/Think ─────────── */
  async function streamSimple(scope) {
    var token = ++streamToken;
    setAgentThinking(true);
    await wait(600); // matches the initial 'running' beat in streamDo

    var agentMsg = scope.querySelector('.msg-agent');
    if (agentMsg) {
      var items = Array.prototype.slice.call(agentMsg.querySelectorAll('.stream-item'));
      if (items.length === 0) {
        items = Array.prototype.slice.call(agentMsg.children);
        items.forEach(function (b) { b.classList.add('stream-item'); });
      }
      for (var i = 0; i < items.length; i++) {
        if (isStale(token)) return;
        items[i].classList.add('shown');
        scrollToBottom();
        // Block-level items (cards/sections) match Do's per-log-line cadence
        // ~800ms; list-row items (LI inside a timeline) tick faster ~220ms so
        // a list reveals as one paced burst, not 6 separate beats.
        var isRow = items[i].tagName === 'LI';
        await wait(isRow ? 220 : 800);
      }
    }
    setAgentThinking(false);
  }

  /* ─────────── Restore a finished conversation (no animation) ─────────── */
  function restoreConvo(convo) {
    if (!convo) return;
    var empty   = document.getElementById('emptyState');
    var bottom  = document.getElementById('bottomPrompts');
    var convoEl = document.getElementById('convoArea');
    if (!convoEl) return;

    if (empty)  empty.classList.add('hidden');
    if (bottom) bottom.style.display = 'block';

    var html = (convo.kind === 'ask') ? TPL_ASK_HTML
            : (convo.kind === 'think') ? TPL_THINK_HTML
            : TPL_DO_HTML;
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    convoEl.innerHTML = '';
    convoEl.appendChild(wrapper);

    // Show everything in final state (no animation)
    var streamItems = wrapper.querySelectorAll('.stream-item');
    Array.prototype.forEach.call(streamItems, function (el) { el.classList.add('shown'); });

    if (convo.kind === 'do') {
      // Re-populate the execution log lines synchronously
      var logBody = wrapper.querySelector('[data-log-body]');
      var logRoot = wrapper.querySelector('.do-log');
      if (logBody) {
        DO_LOG_LINES_PRE_GATE.forEach(function (line) { logBody.appendChild(renderLogEntry(line)); });
        if (convo.gate && convo.gate.decided) {
          DO_LOG_LINES_POST_GATE.forEach(function (line) { logBody.appendChild(renderLogEntry(line)); });
          setLogStatus(logRoot, 'complete', 'complete');
        } else {
          setLogStatus(logRoot, 'paused', 'paused — awaiting your call');
        }
      }
      var gate = wrapper.querySelector('.do-gate');
      if (gate && convo.gate && convo.gate.decided) {
        gate.classList.add('decided');
        var dec = gate.querySelector('.do-gate-decision');
        if (dec) dec.textContent = '✓ ' + (convo.gate.text || 'Decision recorded.');
      }
      var summary = wrapper.querySelector('.do-summary');
      if (summary && (!convo.gate || !convo.gate.decided)) {
        // Hide the summary block when gate hasn't been decided yet.
        summary.classList.remove('shown');
      }
    }

    scrollToBottom();
  }
  function renderLogEntry(line) {
    var div = document.createElement('div');
    if (line.thinking) {
      div.className = 'do-thinking stream-item shown';
      div.textContent = line.thinking;
    } else {
      div.className = 'log-line stream-item shown';
      div.innerHTML =
        '<span class="t">' + line.time + '</span>' +
        '<span class="s ' + line.cls + '">' + line.icon + '</span>' +
        '<span class="msg">' + line.msg + '</span>' +
        (line.view ? '<span class="view">' + line.view + '</span>' : '<span></span>');
    }
    return div;
  }

  /* ─────────── Entry points (global) ─────────── */
  window.runPrompt = async function runPrompt(kind) {
    streamToken++;
    if (gateResolver) { var r = gateResolver; gateResolver = null; r(); }
    setAgentThinking(false);

    // Ensure chat is visible
    if (document.body.getAttribute('data-chat') === 'slim') setChatMode('rail');

    var empty   = document.getElementById('emptyState');
    var bottom  = document.getElementById('bottomPrompts');
    var convoEl = document.getElementById('convoArea');
    if (empty)  empty.classList.add('hidden');
    if (bottom) bottom.style.display = 'block';

    var html = (kind === 'ask') ? TPL_ASK_HTML
            : (kind === 'think') ? TPL_THINK_HTML
            : (kind === 'do') ? TPL_DO_HTML : null;
    if (!html || !convoEl) return;

    convoEl.innerHTML = '';
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    convoEl.appendChild(wrapper);
    scrollToBottom();

    saveConvo({ kind: kind, gate: { decided: false } });

    if (kind === 'do') await streamDo(wrapper);
    else               await streamSimple(wrapper);
  };

  window.resetConvo = function resetConvo() {
    streamToken++;
    if (gateResolver) { var r = gateResolver; gateResolver = null; r(); }
    setAgentThinking(false);
    var convoEl = document.getElementById('convoArea');
    var empty   = document.getElementById('emptyState');
    var bottom  = document.getElementById('bottomPrompts');
    if (convoEl) convoEl.innerHTML = '';
    if (empty)   empty.classList.remove('hidden');
    if (bottom)  bottom.style.display = 'none';
    saveConvo(null);
    scrollToBottom();
  };

  window.expandFromSlim = function expandFromSlim() {
    if (document.body.getAttribute('data-chat') === 'slim') setChatMode('rail');
  };

  window.resolveGate = function resolveGate(btn, text) {
    var gate = btn.closest('.do-gate');
    if (!gate) return;
    gate.classList.add('decided');
    var dec = gate.querySelector('.do-gate-decision');
    if (dec) dec.textContent = '✓ ' + text;
    saveConvo({ kind: 'do', gate: { decided: true, text: text } });
    if (gateResolver) { var r = gateResolver; gateResolver = null; r(); }
  };

  /* ─────────── Float-mode drag + rail-mode resize ─────────── */
  function attachFloatDrag() {
    var head = document.querySelector('.chat-head');
    var chat = chatEl();
    if (!head || !chat) return;
    var dragging = false, startX = 0, startY = 0, startL = 0, startT = 0;
    head.addEventListener('mousedown', function (e) {
      if (document.body.getAttribute('data-chat') !== 'float') return;
      if (e.target.closest('.chat-tools')) return;
      if (e.button !== 0) return;
      var r = chat.getBoundingClientRect();
      startL = r.left; startT = r.top;
      chat.style.left = startL + 'px'; chat.style.top = startT + 'px';
      chat.style.right = 'auto'; chat.style.bottom = 'auto';
      chat.style.width = r.width + 'px'; chat.style.height = r.height + 'px';
      startX = e.clientX; startY = e.clientY;
      dragging = true;
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var r = chat.getBoundingClientRect();
      var c = clampPos({ left: startL + (e.clientX - startX), top: startT + (e.clientY - startY) }, r.width, r.height);
      chat.style.left = c.left + 'px'; chat.style.top = c.top + 'px';
    });
    document.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      document.body.style.cursor = ''; document.body.style.userSelect = '';
      var r = chat.getBoundingClientRect();
      lsWrite(LS_FLOAT_POS, JSON.stringify({ left: r.left, top: r.top, width: r.width, height: r.height }));
    });
  }

  function attachRailResize() {
    var grip = document.getElementById('chatGrip');
    if (!grip) return;
    grip.addEventListener('mousedown', function (e) {
      if (document.body.getAttribute('data-chat') !== 'rail') return;
      e.preventDefault();
      var startX = e.clientX;
      var startW = parseInt(getComputedStyle(document.body).getPropertyValue('--chat-w'), 10) || DEFAULT_WIDTH;
      grip.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      function onMove(ev) {
        var delta = startX - ev.clientX;
        var next = Math.max(MIN_W, Math.min(MAX_W, startW + delta));
        document.body.style.setProperty('--chat-w', next + 'px');
      }
      function onUp() {
        var finalW = parseInt(getComputedStyle(document.body).getPropertyValue('--chat-w'), 10) || DEFAULT_WIDTH;
        lsWrite(LS_WIDTH, String(finalW));
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = ''; document.body.style.userSelect = '';
        grip.classList.remove('dragging');
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  /* ─────────── Cross-tab / cross-page sync ─────────── */
  function attachStorageSync() {
    window.addEventListener('storage', function (e) {
      if (e.key === LS_MODE && e.newValue && e.newValue !== document.body.getAttribute('data-chat')) {
        setChatMode(e.newValue, { persist: false });
      }
      if (e.key === LS_FLOAT_POS && document.body.getAttribute('data-chat') === 'float') {
        var pos = loadFloatPos();
        if (pos) applyFloatPos(clampPos(pos, pos.width, pos.height));
      }
      if (e.key === LS_CONVO) {
        var convo = loadConvo();
        if (convo) restoreConvo(convo);
        else window.resetConvo();
      }
    });
  }

  /* ─────────── Tool button click bindings ─────────── */
  function attachToolButtons() {
    var btnSlim  = document.getElementById('btnSlim');
    var btnFloat = document.getElementById('btnFloat');
    if (btnSlim) btnSlim.onclick = function () {
      setChatMode(document.body.getAttribute('data-chat') === 'slim' ? 'rail' : 'slim');
    };
    if (btnFloat) btnFloat.onclick = function () {
      setChatMode(document.body.getAttribute('data-chat') === 'float' ? 'rail' : 'float');
    };
  }

  /* ─────────── Input wiring: chip prefill + send/Enter to fire ─────────── */
  function attachInputWiring() {
    var input   = document.querySelector('.chat-input');
    var sendBtn = document.querySelector('.send-btn');
    if (!input || !sendBtn) return;

    // Chip click behavior differs by autonomy mode:
    //   Assist (ask)   → prefill the input; the user reads and presses send.
    //                    Reflects "user asks a question."
    //   Suggest/Do     → fire immediately; the agent initiates, no user text.
    //                    Reflects "agent surfaces a recommendation / has done X."
    var chips = document.querySelectorAll('.empty-chip[data-kind]');
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        var kind = chip.getAttribute('data-kind');
        if (kind === 'ask') {
          input.value = chip.getAttribute('data-prompt') || '';
          input.setAttribute('data-kind', kind);
          input.focus();
        } else if (typeof window.runPrompt === 'function') {
          window.runPrompt(kind);
        }
      });
    });

    function fire() {
      var kind = input.getAttribute('data-kind') || 'ask';
      if (typeof window.runPrompt !== 'function') return;
      window.runPrompt(kind);
      input.value = '';
      input.removeAttribute('data-kind');
    }

    sendBtn.addEventListener('click', function (e) {
      e.preventDefault();
      fire();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        fire();
      }
    });
  }

  /* ─────────── Boot ─────────── */
  function boot() {
    ensureStylesheet();
    injectMarkup();

    var storedWidth = loadStoredWidth() || DEFAULT_WIDTH;
    document.body.style.setProperty('--chat-w', storedWidth + 'px');

    var initialMode = loadStoredMode() || (window.innerWidth < 1100 ? 'slim' : 'rail');
    setChatMode(initialMode, { persist: false });

    attachToolButtons();
    attachInputWiring();
    attachFloatDrag();
    attachRailResize();
    attachStorageSync();

    var convo = loadConvo();
    if (convo) restoreConvo(convo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
