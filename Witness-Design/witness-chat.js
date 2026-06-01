/* ─────────────────────────────────────────────────────────────────
   witness-chat.js  —  Witness shared chat panel
   Place in the same folder as witness-dashboard.html and
   witness-invoices.html. Both pages load it via <script src="witness-chat.js">.
   ──────────────────────────────────────────────────────────────── */

// ── 1. Inject chat CSS ───────────────────────────────────────────────────
(function() {
  if (document.getElementById('witness-chat-css')) return;
  var s = document.createElement('style');
  s.id = 'witness-chat-css';
  s.textContent = `
/* ═══════════════════════════════════════════════════════════════
   Witness shared chat panel. Visuals match dashboard.html exactly.
   Tokens are inlined as literal colors so the file is self-contained
   and works regardless of host-page :root definitions.
   ═══════════════════════════════════════════════════════════════ */

/* Layout-level chat width tokens (used by host pages' grid). */
[data-chat="float"] { --chat-w: 0px; }
[data-chat="slim"]  { --chat-w: 56px; }

/* CHAT: sits in 3rd grid column (rail/slim), floats over in float mode.
   Default to position:fixed so pages without a grid wrapper (e.g. onboarding)
   still get a right-side panel. Grid-hosted chats override below. */
.chat {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: var(--chat-w, 340px);
  z-index: 30;
  background: #ffffff;
  border-left: 1px solid #e9e9e9;
  display: flex; flex-direction: column;
  overflow: hidden;
  min-width: 0;
  font-family: 'Inter', system-ui, sans-serif;
  color: #120b0b;
  transition: width .2s ease;
}
/* Inside a 3-column grid wrapper, flow in as the 3rd column instead. */
.app-grid > .chat,
.app > .chat {
  position: relative;
  top: auto; right: auto; bottom: auto;
  width: auto;
  height: 100%;
}
/* Free-standing chat (no grid wrapper): reserve right-edge space on body.
   JS toggles the .chat-padded class on body when the chat is appended at body level. */
body.chat-padded {
  padding-right: var(--chat-w, 340px);
  transition: padding-right .2s ease;
}
body.chat-padded[data-chat="float"] { padding-right: 0; }
.chat-grip {
  position: absolute; left: -3px; top: 0; bottom: 0;
  width: 6px; cursor: col-resize; z-index: 5;
  transition: background .15s;
}
.chat-grip:hover, .chat-grip.dragging {
  background: linear-gradient(90deg, transparent, #ff6900 50%, transparent);
}

/* SLIM state: 56px vertical rail */
[data-chat="slim"] .chat {
  overflow: hidden;
  pointer-events: none;
}
[data-chat="slim"] .chat-grip { display: none; }
[data-chat="slim"] .chat-head {
  padding: 20px 0 16px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  border-bottom: none;
}
[data-chat="slim"] .chat-head > .chat-head-info,
[data-chat="slim"] .chat-head > .chat-tools,
[data-chat="slim"] .chat-body,
[data-chat="slim"] .chat-bottom-prompts,
[data-chat="slim"] .chat-foot { display: none !important; }
[data-chat="slim"] .chat-status-dot {
  display: none;
}
[data-chat="slim"] .slim-dot-top {
  display: block !important;
  width: 8px; height: 8px;
  min-width: 8px; min-height: 8px;
  max-width: 8px; max-height: 8px;
  background: #16a34a;
  border-radius: 50%;
  flex-shrink: 0; flex-grow: 0;
  box-sizing: border-box;
  margin: 0;
  animation: slimDotPulse 2s ease-in-out infinite;
}
@keyframes slimDotPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,.5); }
  50% { box-shadow: 0 0 0 5px rgba(22,163,74,0); }
}
[data-chat="slim"] .chat-mark { position: relative; }
.slim-cta {
  display: none;
  writing-mode: horizontal-tb;
  transform: none;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: #9f9fa6;
  text-align: center;
  padding: 0;
  line-height: 1.4;
  white-space: normal;
  word-break: break-word;
  max-width: 44px;
}
[data-chat="slim"] .slim-cta { display: block; }

/* FLOAT state: detached overlay; the 3rd grid column shrinks to 0 */
[data-chat="float"] .chat {
  position: fixed;
  top: 16px;
  right: 24px;
  bottom: 24px;
  width: 360px; height: auto;
  border: 1px solid rgba(69,85,108,0.24);
  border-radius: 14px;
  box-shadow: 0 24px 60px -12px rgba(0,0,0,.22), 0 4px 16px rgba(0,0,0,.06);
  z-index: 40;
  animation: wcpFloatIn .25s cubic-bezier(.4,0,.2,1);
}
[data-chat="float"] .chat-grip { display: none; }
[data-chat="float"] .chat-head { cursor: grab; }
[data-chat="float"] .chat-head .chat-tools { cursor: default; }
@keyframes wcpFloatIn {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to { opacity: 1; transform: none; }
}

/* Chat head */
.chat-head {
  padding: 14px 16px; border-bottom: 1px solid #e9e9e9;
  display: flex; align-items: center; gap: 12px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #fff5f1, #ffffff);
}
.chat-head-info { display: flex; flex-direction: column; min-width: 0; }
.chat-tools { display: flex; align-items: center; gap: 2px; margin-left: auto; overflow: visible; }
.chat-tool-btn {
  width: 26px; height: 26px; border-radius: 6px;
  display: grid; place-items: center; cursor: pointer;
  border: none; background: transparent; color: #45556c;
  font-size: 14px; line-height: 1;
  transition: all .12s;
}
.chat-tool-btn:hover { background: #f4f4f4; color: #120b0b; }
.chat-tool-btn.active { background: #120b0b; color: white; }
.chat-mark {
  width: 32px; height: 32px; min-width: 32px; min-height: 32px;
  border-radius: 9px;
  background: #120b0b;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.chat-mark.thinking::after {
  content: ""; position: absolute; inset: -3px;
  border: 1.5px solid #ff6900; border-radius: inherit;
  opacity: .35; animation: wcpThinkingPulse 1.4s ease-in-out infinite;
}
@keyframes wcpThinkingPulse {
  0%, 100% { transform: scale(1); opacity: .35; }
  50% { transform: scale(1.18); opacity: 0; }
}
.chat-title { font-family: 'Inter', system-ui, sans-serif; font-size: 14px; font-weight: 600; color: #120b0b; }
.chat-sub { font-size: 11px; color: #9f9fa6; margin-top: 1px; }
.chat-status-dot {
  width: 8px; height: 8px;
  min-width: 8px; min-height: 8px;
  max-width: 8px; max-height: 8px;
  border-radius: 50%; flex-shrink: 0; flex-grow: 0;
  box-sizing: border-box;
  display: inline-block;
  background: #16a34a; box-shadow: 0 0 0 2.5px rgba(22,163,74,.2);
}

/* Chat body */
.chat-body {
  flex: 1; overflow-y: auto;
  padding: 18px 16px 6px;
  scroll-behavior: smooth;
}
.chat-body::-webkit-scrollbar { width: 6px; }
.chat-body::-webkit-scrollbar-thumb { background: rgba(69,85,108,0.24); border-radius: 3px; }

/* Empty state: title at top, chips above input at bottom */
.empty-state {
  display: flex; flex-direction: column;
  min-height: 100%;
  padding: 16px 4px 8px;
  gap: 0;
}
.empty-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 26px; font-weight: 400;
  color: #120b0b; line-height: 1.3;
  letter-spacing: -0.3px;
  padding: 4px 8px;
}
.empty-spacer { flex: 1; min-height: 40px; }
.empty-chips-row {
  display: flex; gap: 6px;
  padding: 0 2px;
}
.empty-chip {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: white;
  border: 1.5px solid #e9e9e9;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Inter', system-ui, sans-serif;
  text-align: left;
  transition: border-color .15s, background .15s, transform .15s;
}
.empty-chip:hover {
  border-color: #ff6900;
  background: #fff8f3;
  transform: translateY(-1px);
}
/* Mode-color glyph: matches .bp-chip .m so the same Ask/Suggest/Do icons
   read identically in the empty state and the "Try another mode" row. */
.empty-chip-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: grid; place-items: center;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 16px; font-weight: 700;
  margin-bottom: 6px;
}
.empty-chip-icon.ask   { background: #fdf2d4; color: #b17728; }
.empty-chip-icon.think { background: #dcfce7; color: #15803d; }
.empty-chip-icon.do    { background: #e7f4ff; color: #155dfc; }
.empty-chip-title {
  font-size: 13px; font-weight: 600;
  color: #120b0b; line-height: 1.2;
}
.empty-chip-sub {
  font-size: 11px; font-weight: 400;
  color: #45556c; line-height: 1.3;
}

/* ═══════════════════════════════════════════════════════════════
   Conversation building blocks
   ═══════════════════════════════════════════════════════════════ */
.convo-area { display: flex; flex-direction: column; }

.msg-user {
  position: relative;
  background: #120b0b; color: white;
  padding: 10px 14px;
  border-radius: 14px 14px 4px 14px;
  font-size: 13.5px; line-height: 1.45;
  max-width: 86%; margin-left: auto; margin-bottom: 14px;
}
.msg-user .kind-tag {
  display: inline-block;
  font-size: 9.5px; letter-spacing: .08em;
  background: rgba(255,255,255,.18);
  padding: 2px 6px; border-radius: 3px; margin-bottom: 4px;
  font-weight: 600;
}
.msg-replay {
  position: absolute; top: 50%; left: -28px;
  transform: translateY(-50%);
  width: 22px; height: 22px;
  background: #ffffff; border: 1px solid #e9e9e9;
  border-radius: 50%; color: #9f9fa6; cursor: pointer;
  font-size: 11px; display: grid; place-items: center;
  opacity: 0; transition: opacity .2s, color .12s; padding: 0;
}
.msg-user:hover .msg-replay { opacity: 1; }
.msg-replay:hover { color: #120b0b; border-color: #120b0b; }

.msg-agent { margin-bottom: 14px; animation: wcpFadeIn .3s ease-out; }
@keyframes wcpFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
/* lede now handled in ask-block section above */

/* ═══════════ TYPE 1: ASK / INFO — Claude style ═══════════ */
.msg-agent .lede {
  font-size: 13px; color: #0b0d12; font-style: normal;
  font-family: 'Inter', system-ui, sans-serif;
  line-height: 1.6; margin-bottom: 12px; padding-left: 0;
}
.ask-block {
  background: transparent;
  border: none;
  margin-bottom: 0;
}
.ask-block-head {
  display: flex; flex-direction: row;
  justify-content: space-between; align-items: center;
  padding: 0 0 8px 0;
  background: transparent;
  border-bottom: none;
  font-size: 10.5px; color: #9f9fa6;
  letter-spacing: .06em; font-weight: 600;
}
.src-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10px;
  background: #f4f4f4; border: 1px solid #e9e9e9;
  padding: 2px 6px; border-radius: 4px;
  color: #6b7a92; letter-spacing: 0; font-weight: 400;
}
.src-badge.live { background: #dcfce7; border-color: #bbf7d0; color: #15803d; }
.src-badge.live::before {
  content: ""; width: 5px; height: 5px; border-radius: 50%;
  background: #15803d; flex-shrink: 0;
  animation: wcpPing 2s ease-out infinite;
}
@keyframes wcpPing {
  0%   { box-shadow: 0 0 0 0 rgba(21,128,61,.5); }
  70%  { box-shadow: 0 0 0 5px rgba(21,128,61,0); }
  100% { box-shadow: 0 0 0 0 rgba(21,128,61,0); }
}
.ask-block-body { padding: 0; }
.ask-status {
  display: grid;
  grid-template-columns: 1fr 150px;
  gap: 6px 12px;
  margin-bottom: 14px;
  align-items: start;
}
.ask-status .status-label { display: none; }
.ask-status .status-val {
  grid-column: 1;
  font-size: 13px; font-weight: 600; color: #0b0d12; line-height: 1.5;
  word-break: keep-all;
  overflow-wrap: break-word;
}
.ask-status .status-time {
  grid-column: 2;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10.5px;
  color: #b17728; background: #fdf2d4; border-radius: 4px;
  padding: 4px 8px;
  white-space: normal;
  text-align: left;
  line-height: 1.6;
  width: 150px;
  align-self: start;
}
.ask-timeline {
  margin: 0 0 14px 0; padding: 0; list-style: none;
  display: flex; flex-direction: column; gap: 0;
}
.ask-timeline li {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 5px 0; font-size: 12.5px; color: #6b7a92; line-height: 1.5;
  position: relative;
}
/* vertical connector line — runs from bottom of dot to top of next dot */
.ask-timeline li:not(:last-child)::after {
  content: ""; position: absolute;
  left: 4px; top: 18px; bottom: -2px;
  width: 1px; background: #e4e7ec;
}
.ask-timeline li .tl-dot {
  width: 9px; height: 9px;
  min-width: 9px; min-height: 9px;
  max-width: 9px; max-height: 9px;
  border-radius: 50%;
  border: 1.5px solid #c8cdd6;
  background: white;
  margin-top: 5px;
  flex-shrink: 0;
  flex-grow: 0;
  display: block;
  position: relative; z-index: 1;
  box-sizing: border-box;
}
.ask-timeline li.current .tl-dot {
  background: #0b0d12; border-color: #0b0d12;
  box-shadow: 0 0 0 3px rgba(11,13,18,0.1);
}
.ask-timeline li.current { color: #0b0d12; font-weight: 500; }
.ask-timeline li .time {
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10px;
  color: #9f9fa6; white-space: nowrap; margin-top: 3px; flex-shrink: 0; min-width: 54px;
}
.ask-timeline li .tl-text { flex: 1; }
.ask-cross {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 6px; margin-top: 14px;
}
.ask-doc {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background .12s;
}
.ask-doc:last-of-type { border-bottom: none; }
.ask-doc:hover { background: transparent; }
.ask-doc-icon {
  width: 28px; height: 28px; min-width: 28px;
  border: 1.5px solid #e9e9e9; border-radius: 6px;
  display: grid; place-items: center;
  background: white; flex-shrink: 0; margin-top: 1px;
}
.ask-doc-icon svg { width: 14px; height: 14px; color: #45556c; }
.ask-doc-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.ask-doc .dn {
  font-family: 'Inter', system-ui, sans-serif; font-size: 12.5px;
  color: #155dfc; font-weight: 600; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.ask-doc .ds { font-size: 10px; color: #9f9fa6; }
.ask-doc .dm { font-size: 11px; color: #45556c; line-height: 1.5; }
.trust-strip {
  margin-top: 10px;
  font-size: 12px; color: #45556c; line-height: 1.5;
  padding: 0; background: transparent; border: none;
}
.trust-strip strong { color: #0b0d12; font-weight: 700; }
.ask-followup {
  margin-top: 12px;
  font-size: 12.5px; color: #45556c; line-height: 1.6;
  background: transparent; border: none; padding: 0;
}
.ask-followup a { color: #ff6900; font-weight: 500; cursor: pointer; }

/* ═══════════ TYPE 2: THINK / ANALYSIS ═══════════ */
.think-analysis {
  font-size: 13px; line-height: 1.6; color: #0b0d12;
  margin-bottom: 12px; padding: 0;
  background: transparent; border: none; border-radius: 0;
}
.think-analysis strong { font-weight: 600; }

.think-options { display: flex; flex-direction: column; gap: 8px; }

.think-opt {
  padding: 12px 14px;
  border: 1px solid #e9e9e9;
  border-radius: 10px;
  background: white;
  display: flex; flex-direction: column; gap: 8px;
}
.think-opt.recommended {
  border-color: #15803d;
  background: white;
}

.think-opt-recommended-badge {
  display: inline-flex; align-items: center;
  font-size: 10.5px; font-weight: 700;
  color: #15803d;
  background: #dcfce7;
  padding: 2px 8px; border-radius: 999px;
  letter-spacing: 0.02em;
  width: fit-content;
}

.think-opt-title-row {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 8px;
}
.opt-title {
  font-size: 13px; font-weight: 600; color: #0b0d12;
  line-height: 1.35; flex: 1;
}
.opt-tags { display: flex; gap: 4px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
.opt-tag {
  font-size: 10px; letter-spacing: .03em;
  padding: 2px 7px; border-radius: 999px;
  font-weight: 600; white-space: nowrap;
}
.opt-tag.low  { background: #dcfce7; color: #15803d; }
.opt-tag.med  { background: #fdf2d4; color: #b17728; }
.opt-tag.high { background: #fee2e2; color: #b91c1c; }

.opt-rationale {
  font-size: 12px; color: #45556c;
  line-height: 1.55;
}

.opt-actions { display: flex; gap: 10px; align-items: center; }
.opt-do {
  border: 1px solid #e9e9e9; background: #120b0b; color: white;
  font-family: 'Inter', system-ui, sans-serif; font-size: 12px; font-weight: 600;
  padding: 6px 14px; border-radius: 6px; cursor: pointer;
  transition: background .12s;
}
.opt-do:hover { background: #374151; }
.opt-do.primary {
  background: #15803d; color: white; border-color: #15803d;
}
.opt-do.primary:hover { background: #166534; border-color: #166534; }
.opt-why {
  font-size: 11.5px; color: #9f9fa6;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}
.opt-why:hover { color: #45556c; }

/* ═══════════ TYPE 3: DO / ACTION ═══════════ */
/* ── Do: Plan ── */
.do-plan {
  background: transparent; border: none; border-radius: 0;
  padding: 0; margin-bottom: 14px;
}
.do-plan-head {
  font-size: 10.5px; font-weight: 600; color: #9f9fa6;
  letter-spacing: 0.06em; margin-bottom: 6px;
  display: flex; align-items: center; gap: 6px;
}
.do-plan-summary {
  font-size: 13px; color: #0b0d12; line-height: 1.6;
}
.do-plan-summary strong { font-weight: 600; }

/* ── Do: Gate ── */
.do-gate {
  background: transparent; border: none; border-radius: 0;
  padding: 12px 0 0; margin-bottom: 12px;
  border-top: 1px solid #f0f0f0;
}
.do-gate-head {
  font-size: 11px; letter-spacing: .06em;
  color: #b17728; font-weight: 600; margin-bottom: 8px;
  display: flex; align-items: center; gap: 5px;
}
.do-gate-head::before { content: "⏸"; font-size: 11px; }
.do-gate-q {
  font-size: 13px; color: #0b0d12; line-height: 1.6; margin-bottom: 10px;
}
.do-gate-q strong { font-weight: 600; }
.do-gate-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.gate-btn {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 11.5px; font-weight: 500;
  padding: 5px 12px; border-radius: 6px; cursor: pointer;
  transition: background .12s, border-color .12s;
}
.gate-btn.ok { background: #FF6900; color: white; border: none; }
.gate-btn.ok:hover { background: #d95b03; }
.gate-btn.alt { background: white; color: #45556c; border: 1px solid #e9e9e9; }
.gate-btn.alt:hover { background: #f4f4f4; }
.do-gate.decided { opacity: .75; }
.do-gate.decided .do-gate-head { color: #15803d; }
.do-gate.decided .do-gate-head::before { content: "✓"; }
.do-gate.decided .do-gate-actions { display: none; }
.do-gate-decision {
  display: none; font-size: 12px; color: #15803d;
  margin-top: 6px; font-weight: 500;
}
.do-gate.decided .do-gate-decision { display: block; }

/* ── Do: Execution log — light grey ── */
.do-log {
  background: #f4f4f4; border-radius: 10px;
  padding: 12px 14px; margin-bottom: 12px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11.5px; line-height: 1.7; color: #120b0b;
}
.do-log-head {
  color: #6b7a92; font-size: 10px; letter-spacing: .08em;
  margin-bottom: 8px; padding-bottom: 6px;
  border-bottom: 1px solid #e4e4e4;
  font-family: 'Inter', system-ui, sans-serif; font-weight: 600;
  display: flex; justify-content: space-between;
}
.log-line {
  display: flex; flex-wrap: wrap; align-items: baseline;
  gap: 4px 8px; padding: 3px 0;
}
.log-line .t {
  color: #6b7a92; flex-shrink: 0;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 10.5px;
}
.log-line .s { width: 14px; text-align: center; flex-shrink: 0; }
.log-line .s.ok   { color: #15803d; }
.log-line .s.wait { color: #b17728; }
.log-line .s.warn { color: #d95b03; }
.log-line .s.skip { color: #6b7a92; }
.log-line .msg {
  color: #120b0b; font-family: 'Inter', system-ui, sans-serif; font-size: 12px;
  flex: 1; min-width: 0;
}
.log-line .msg .hl { color: #120b0b; font-weight: 600; }
.log-line .view {
  color: #ff6900; font-family: 'Inter', system-ui, sans-serif; font-size: 11px;
  cursor: pointer; text-decoration: underline; text-decoration-style: dotted;
  flex-shrink: 0;
}
.log-line .view:hover { color: #d95b03; }
.do-thinking {
  color: #6b7a92; font-family: 'Inter', system-ui, sans-serif;
  font-size: 11.5px; padding: 4px 0 4px 8px; font-style: italic;
  border-left: 2px solid #d0d5dd; margin: 2px 0;
}
.log-status { display: flex; align-items: center; gap: 4px; font-weight: 500; }
.log-status .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.log-status.starting { color: #9f9fa6; }
.log-status.starting .dot { background: #9f9fa6; }
.log-status.running  { color: #15803d; }
.log-status.running .dot {
  background: #15803d; box-shadow: 0 0 0 0 rgba(21,128,61,.4);
  animation: wcpLogPulse 1.4s ease-out infinite;
}
.log-status.paused   { color: #b17728; }
.log-status.paused .dot  { background: #b17728; }
.log-status.complete { color: #15803d; }
.log-status.complete .dot { background: #15803d; }
@keyframes wcpLogPulse {
  0%   { box-shadow: 0 0 0 0 rgba(74,222,128,.6); }
  70%  { box-shadow: 0 0 0 5px rgba(74,222,128,0); }
  100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
}

/* ── Do: Summary ── */
.do-summary {
  background: transparent; border: none; border-radius: 0;
  padding: 0; margin-bottom: 8px;
}
.do-summary-head {
  font-size: 13px; font-weight: 600; color: #0b0d12;
  margin-bottom: 10px;
}
.do-summary-stats {
  display: flex; gap: 20px; margin-bottom: 12px;
}
.ds-stat .n {
  font-weight: 700; font-size: 22px; color: #0b0d12;
  line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -0.3px;
}
.ds-stat .l {
  font-size: 10.5px; color: #9f9fa6; margin-top: 4px; letter-spacing: .04em;
}
.do-summary-actions {
  display: flex; gap: 6px; flex-wrap: wrap;
  padding-top: 10px; border-top: 1px solid #f0f0f0;
}
.ds-btn {
  border: 1px solid #e9e9e9; background: white; color: #0b0d12;
  font-family: 'Inter', system-ui, sans-serif; font-size: 11.5px; font-weight: 500;
  padding: 5px 12px; border-radius: 6px; cursor: pointer;
  transition: background .12s;
}
.ds-btn:hover { background: #f4f4f4; }
.ds-btn:hover { border-color: #120b0b; }
.ds-btn.primary { background: #120b0b; color: white; border-color: #120b0b; }
.ds-btn.audit { color: #d95b03; border-color: #ffe8df; }
.ds-btn.undo  { color: #b91c1c; border-color: #f5c8b8; }

/* Bottom prompts (visible once a convo has started) */
.chat-bottom-prompts {
  padding: 10px 12px 6px;
  border-top: 1px solid #e9e9e9;
  background: #f4f4f4;
}
.bp-label {
  font-size: 10px; letter-spacing: .08em;
  color: #9f9fa6; font-weight: 600;
  padding: 0 2px 6px;
}
.bp-row { display: flex; gap: 6px; }
.bp-chip {
  flex: 1; min-width: 0;
  display: flex; align-items: center; gap: 6px;
  padding: 7px 10px;
  background: #ffffff;
  border: 1px solid #e9e9e9;
  border-radius: 8px;
  cursor: pointer; font-family: 'Inter', system-ui, sans-serif;
  font-size: 11.5px; color: #120b0b;
  text-align: left; transition: all .12s;
}
.bp-chip:hover { border-color: #120b0b; background: white; }
.bp-chip .m {
  width: 18px; height: 18px;
  border-radius: 4px;
  display: grid; place-items: center;
  font-size: 10px; font-weight: 700;
  flex-shrink: 0;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.bp-chip.ask .m   { background: #fdf2d4; color: #b17728; }
.bp-chip.think .m { background: #dcfce7; color: #15803d; }
.bp-chip.do .m    { background: #e7f4ff; color: #155dfc; }
.bp-chip .lbl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Chat foot: input */
.chat-foot {
  border-top: 1px solid #e9e9e9;
  padding: 10px 14px 12px;
  background: #ffffff;
}
.chat-input-row {
  display: flex; align-items: flex-end; gap: 8px;
  border: 1px solid rgba(69,85,108,0.24);
  border-radius: 8px;
  background: #ffffff; padding: 6px 10px;
}
.chat-input-row:focus-within { border-color: #120b0b; }
.chat-input {
  flex: 1; border: none; outline: none;
  font-family: 'Inter', system-ui, sans-serif; font-size: 13px; color: #120b0b;
  background: transparent; padding: 4px 0;
  resize: none; overflow: hidden; line-height: 1.5;
  min-height: 22px; max-height: 120px;
}
.chat-input::placeholder { color: #9f9fa6; }
.chat .send-btn {
  border: none; background: #ff6900; color: white;
  width: 28px; height: 28px; border-radius: 6px;
  display: grid; place-items: center; cursor: pointer; font-size: 13px;
}
.chat .send-btn:hover { background: #d95b03; }
.chat-foot-meta {
  margin-top: 6px;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 9px; letter-spacing: 0.1em;
  color: #9f9fa6;
  display: flex; align-items: center; gap: 6px;
}
.chat-foot-meta::before {
  content: ''; width: 5px; height: 5px;
  border-radius: 50%; background: #16a34a;
}

/* ── Thinking bubble ───────────────────────────────────────── */
.thinking-bubble {
  display: flex; flex-direction: row;
  align-items: center; gap: 5px;
  padding: 10px 14px;
  background: #f4f4f4;
  border-radius: 14px 14px 14px 4px;
  margin-bottom: 14px;
  width: fit-content;
  max-width: fit-content;
}
.thinking-bubble .t-dot {
  width: 6px; height: 6px;
  min-width: 6px; min-height: 6px;
  max-width: 6px; max-height: 6px;
  border-radius: 50%;
  background: #9f9fa6;
  display: inline-block;
  flex-shrink: 0;
  flex-grow: 0;
  box-sizing: border-box;
  animation: thinkingBounce 1.2s ease-in-out infinite;
}
.thinking-bubble .t-dot:nth-child(2) { animation-delay: 0.2s; }
.thinking-bubble .t-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes thinkingBounce {
  0%, 60%, 100% { transform: translateY(0);   background: #c8cdd6; }
  30%            { transform: translateY(-4px); background: #45556c; }
}

/* Streaming utilities */
.stream-item { opacity: 0; transform: translateY(6px); }
.stream-item.shown {
  opacity: 1; transform: translateY(0);
  transition: opacity .35s ease-out, transform .35s ease-out;
}
.tw-cursor {
  display: inline-block;
  width: 6px; height: 11px;
  background: #ff6900;
  margin-left: 2px; vertical-align: -1px;
  animation: wcpTwBlink 0.85s steps(2) infinite;
}
@keyframes wcpTwBlink { 50% { opacity: 0; } }
.typing .tw-cursor { background: #e6e1d6; }

.chat .hidden { display: none !important; }

`;
  document.head.appendChild(s);
})();

// ── 2. Inject <aside class="chat" id="chat"> if not already in page ──────
(function() {
  if (document.getElementById('chat')) return;
  var aside = document.createElement('aside');
  aside.className = 'chat';
  aside.id = 'chat';
  document.body.appendChild(aside);
})();

// ── 3. Chat panel IIFE (original, unmodified) ────────────────────────────

/*
 * Witness shared chat panel, single source of truth.
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

  /* ─────────── Toolbar icons (line SVGs, currentColor) ───────────
     The previous glyphs (↺ ⊞ ⇲, ↻) read as random symbols. These
     SVGs match the line-weight used by the rest of the prototype
     (e.g. dashboard.html's sidebar toggle) so the affordances are
     self-evident at button-size. */
  var SVG_NEW = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">' +
                  '<path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
                '</svg>';
  // Fold: ›› chevrons pointing right: "tuck the panel to the right edge".
  var SVG_FOLD = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">' +
                   '<path d="M5 4l4 4-4 4M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                 '</svg>';
  // Unfold: ‹‹ chevrons pointing left: "pull the panel back out".
  var SVG_UNFOLD = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">' +
                     '<path d="M11 4l-4 4 4 4M7 4l-4 4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                   '</svg>';
  // Float: overlapping square with arrow: "pop out as window".
  var SVG_FLOAT = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">' +
                    '<rect x="2.5" y="5.5" width="8" height="8" rx="1.2" stroke="currentColor" stroke-width="1.4"/>' +
                    '<path d="M7 3h6v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
                    '<path d="M13 3 7.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
                  '</svg>';
  // Dock: arrow into a right-edge bar: "snap back to the side".
  var SVG_DOCK = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">' +
                   '<path d="M13 3v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
                   '<path d="M3 8h7m-2-2 2 2-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                 '</svg>';
  // Replay: a curved arrow looping back: "play this prompt again".
  var SVG_REPLAY = '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" aria-hidden="true">' +
                     '<path d="M3 4v3h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                     '<path d="M3 7a5 5 0 1 0 1.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                   '</svg>';

  /* ─────────── Template strings (extracted from dashboard.html) ─────────── */

  var EMPTY_STATE_HTML =
    '<div class="empty-state" id="emptyState">' +
      '<div class="empty-title">What can Witness do for you?</div>' +
      '<div class="empty-spacer"></div>' +
      '<div class="empty-chips-row" role="list" aria-label="Suggested modes">' +
        '<button class="empty-chip" type="button" role="listitem" data-kind="ask" data-prompt="What happened with INV-1027?"' +
                ' data-prompt="Where is INV-1048 in the approval chain?">' +
          '<span class="empty-chip-icon ask">?</span>' +
          '<span class="empty-chip-title">Ask</span>' +
          '<span class="empty-chip-sub">info</span>' +
        '</button>' +
        '<button class="empty-chip" type="button" role="listitem" data-kind="think" data-prompt="What are my options for handling INV-1027?"' +
                ' data-prompt="What are my options for handling INV-1027?">' +
          '<span class="empty-chip-icon think">◇</span>' +
          '<span class="empty-chip-title">Suggest</span>' +
          '<span class="empty-chip-sub">action</span>' +
        '</button>' +
        '<button class="empty-chip" type="button" role="listitem" data-kind="do" data-prompt="Confirm hold on INV-1027 and notify Praxis to retract"' +
                ' data-prompt="Send follow-ups to all 6 overdue vendor items">' +
          '<span class="empty-chip-icon do">⚡</span>' +
          '<span class="empty-chip-title">Do</span>' +
          '<span class="empty-chip-sub">review</span>' +
        '</button>' +
      '</div>' +
    '</div>';

  var TPL_ASK_HTML =
    '<div class="msg-user">' +
      '<button class="msg-replay" onclick="runPrompt(\'ask\')" title="Replay">' + SVG_REPLAY + '</button>' +
      '<span class="kind-tag">Ask</span><br/>' +
      'What happened with INV-1027?' +
    '</div>' +
    '<div class="msg-agent">' +
      '<div class="lede stream-item">I auto-held INV-1027 at 2:14 AM, 1 minute after intake. Here\'s what I found across your three systems.</div>' +
      '<div class="ask-block stream-item">' +
        '<div class="ask-block-head">' +
          '<span>Current status</span>' +
          '<span class="src-badge live">NetSuite ERP · live</span>' +
        '</div>' +
        '<div class="ask-block-body">' +
          '<div class="ask-status stream-item">' +
            '<div class="status-val">Held. Likely duplicate&nbsp;of&nbsp;INV-1024</div>' +
            '<div class="status-time">98%&nbsp;confidence&nbsp;· 6&nbsp;of&nbsp;7&nbsp;signals&nbsp;match</div>' +
          '</div>' +
          '<ul class="ask-timeline">' +
            '<li class="stream-item"><span class="tl-dot"></span><span class="time" data-tl-offset="-12"></span><span class="tl-text">PO-7718 created · Praxis Logistics · freight on SHP-2241</span></li>' +
            '<li class="stream-item"><span class="tl-dot"></span><span class="time" data-tl-offset="-8"></span><span class="tl-text">Shipment delivered · GRN-2118 logged</span></li>' +
            '<li class="stream-item"><span class="tl-dot"></span><span class="time" data-tl-offset="-6"></span><span class="tl-text">INV-1024 received and matched cleanly</span></li>' +
            '<li class="stream-item"><span class="tl-dot"></span><span class="time" data-tl-offset="-4"></span><span class="tl-text">INV-1024 paid · $890.40 via ACH · PO-7718 closed</span></li>' +
            '<li class="stream-item"><span class="tl-dot"></span><span class="time" data-tl-offset="-2"></span><span class="tl-text">INV-1027 arrived via vendor portal · same PO and total</span></li>' +
            '<li class="current stream-item"><span class="tl-dot"></span><span class="time" data-tl-offset="0"></span><span class="tl-text">Auto-held as duplicate · awaiting your confirmation</span></li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="ask-followup stream-item">' +
        'Praxis has had 2 similar duplicates in the last 12 months, both resolved within 24h.<br>Let me know if you want to see the source documents for comparison.' +
      '</div>' +
    '</div>' +
    '<div class="msg-user msg-user-2 hidden" id="askMsg2">' +
      '<span class="kind-tag">Ask</span><br/>' +
      'Yes, pull the source documents for me' +
    '</div>' +
    '<div class="msg-agent msg-agent-2 hidden" id="askAgent2">' +
      '<div class="lede stream-item">Here are the four documents Witness read to detect this. All pulled in real time across your systems.</div>' +
      '<div class="ask-block stream-item">' +
        '<div class="ask-block-body">' +
          '<div class="ask-doc">' +
            '<div class="ask-doc-icon"><svg viewBox="0 0 16 16" fill="none"><path d="M3.5 1.5h7L13 4v10.5H3.5v-13z M10 1.5V4h3 M5.5 7h5 M5.5 9.5h5 M5.5 12h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
            '<div class="ask-doc-body">' +
              '<div class="dn">INV-1024.pdf <span class="src-badge">Email · AP inbox</span></div>' +
              '<div class="dm">Vendor: Praxis Logistics · PO: PO-7718 · SHP-2241 · Total: $890.40 · Tax: $73.40 · Bill-to: SF DC Dock 3</div>' +
            '</div>' +
          '</div>' +
          '<div class="ask-doc">' +
            '<div class="ask-doc-icon"><svg viewBox="0 0 16 16" fill="none"><path d="M3.5 1.5h7L13 4v10.5H3.5v-13z M10 1.5V4h3 M5.5 7h5 M5.5 9.5h5 M5.5 12h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
            '<div class="ask-doc-body">' +
              '<div class="dn">INV-1027.pdf <span class="src-badge">Vendor portal</span></div>' +
              '<div class="dm">Vendor: Praxis Logistics · PO: PO-7718 · SHP-2241 · Total: $890.40 · Tax: $73.40 · Bill-to: SF DC Dock 3</div>' +
            '</div>' +
          '</div>' +
          '<div class="ask-doc">' +
            '<div class="ask-doc-icon"><svg viewBox="0 0 16 16" fill="none"><path d="M3.5 1.5h7L13 4v10.5H3.5v-13z M10 1.5V4h3 M5.5 7h5 M5.5 9.5h5 M5.5 12h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
            '<div class="ask-doc-body">' +
              '<div class="dn">PO-7718.pdf <span class="src-badge">ERP</span></div>' +
              '<div class="dm">Approved: $890.40 · Scope: SHP-2241 · Status: fully invoiced · Closed Apr 26</div>' +
            '</div>' +
          '</div>' +
          '<div class="ask-doc">' +
            '<div class="ask-doc-icon"><svg viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 4L3 2h10l1 2M2 4v10h12V4M6 7.5h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
            '<div class="ask-doc-body">' +
              '<div class="dn">Payment ledger <span class="src-badge">ERP</span></div>' +
              '<div class="dm">ACH Apr 26 · $890.40 · Praxis Logistics · vendor acknowledged same day</div>' +
            '</div>' +
          '</div>' +
          '<div class="trust-strip stream-item" style="margin-top:10px">' +
            '⚠ <strong>PO-7718 is fully invoiced.</strong> Releasing INV-1027 would pay Praxis $890.40 twice for the same shipment.' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var TPL_THINK_HTML =
    '<div class="msg-user">' +
      '<button class="msg-replay" onclick="runPrompt(\'think\')" title="Replay">' + SVG_REPLAY + '</button>' +
      '<span class="kind-tag">Suggest</span><br/>' +
      'What are my options for handling INV-1027?' +
    '</div>' +
    '<div class="msg-agent">' +
      '<div class="think-analysis stream-item">' +
        'INV-1027 is a second bill from Praxis on PO-7718, already paid <span data-tl-offset="-4" class="tl-inline-date"></span>. PO is closed. Praxis has done this twice before, both billing-system errors, both resolved within 24h. Here are your options. I recommend option 1.' +
      '</div>' +
      '<div class="think-options">' +

        '<div class="think-opt recommended stream-item">' +
          '<div class="think-opt-recommended-badge">Recommended</div>' +
          '<div class="think-opt-title-row">' +
            '<div class="opt-title">Confirm hold and notify Praxis to retract</div>' +
            '<div class="opt-tags">' +
              '<span class="opt-tag low">Low risk</span>' +
              '<span class="opt-tag low">Low effort</span>' +
            '</div>' +
          '</div>' +
          '<div class="opt-rationale">' +
            'Pre-drafted script ready, same one that worked twice before. Praxis responds within 14h. $0 leaves your account.' +
          '</div>' +
          '<div class="opt-actions">' +
            '<button class="opt-do primary" onclick="runPrompt(\'do\')">Do this →</button>' +
            '<a class="opt-why">Why this works</a>' +
          '</div>' +
        '</div>' +

        '<div class="think-opt stream-item">' +
          '<div class="think-opt-title-row">' +
            '<div class="opt-title">Ask Praxis if this is a legitimate reissue</div>' +
            '<div class="opt-tags">' +
              '<span class="opt-tag low">Low risk</span>' +
              '<span class="opt-tag low">Low effort</span>' +
            '</div>' +
          '</div>' +
          '<div class="opt-rationale">' +
            'Different invoice number could mean a corrected reissue. One message to confirm. Adds 24h.' +
          '</div>' +
          '<div class="opt-actions">' +
            '<button class="opt-do">Do this</button>' +
            '<a class="opt-why">Why this works</a>' +
          '</div>' +
        '</div>' +

        '<div class="think-opt stream-item">' +
          '<div class="think-opt-title-row">' +
            '<div class="opt-title">Override hold and release for payment</div>' +
            '<div class="opt-tags">' +
              '<span class="opt-tag high">High risk</span>' +
              '<span class="opt-tag low">Low effort</span>' +
            '</div>' +
          '</div>' +
          '<div class="opt-rationale">' +
            'Only if Praxis confirmed INV-1024 needs reversal. Without that, this pays Praxis $890.40 twice.' +
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
      '<button class="msg-replay" onclick="runPrompt(\'do\')" title="Replay">' + SVG_REPLAY + '</button>' +
      '<span class="kind-tag">Do</span><br/>' +
      'Confirm hold on INV-1027 and notify Praxis to retract' +
    '</div>' +
    '<div class="msg-agent">' +
      '<div class="do-plan stream-item" data-step="1">' +
        '<div class="do-plan-head">⚡ Plan</div>' +
        '<div class="do-plan-summary">' +
          'Confirm hold on <strong>INV-1027</strong> · send Praxis the retract request · log in audit trail. <strong>No payment will leave your account.</strong>' +
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
          'INV-1027 has a <strong>different invoice number</strong> than INV-1024. Could be a genuine reissue. Proceed to retract or ask Praxis to clarify first?' +
        '</div>' +
        '<div class="do-gate-actions">' +
          '<button class="gate-btn ok" style="background:#FF6900;border-color:#FF6900" onclick="resolveGate(this, \'Confirmed: proceed to retract. PO-7718 is closed and fully paid.\')">Proceed to retract</button>' +
          '<button class="gate-btn alt" onclick="resolveGate(this, \'Ask Praxis to clarify before retracting. Flagged for follow-up.\')">Ask Praxis first</button>' +
          '<button class="gate-btn alt" onclick="resolveGate(this, \'Hold confirmed. No action taken yet. Flagged for review tomorrow.\')">Hold for now</button>' +
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
          '<button class="ds-btn primary">Confirm &amp; close case</button>' +
          '<button class="ds-btn">View retract draft</button>' +
          '<button class="ds-btn audit">View audit log</button>' +
          '<button class="ds-btn undo">Release hold instead</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* Static log lines used for restoring a completed Do conversation without
     replaying the entire animation. Mirrors the live streamDo() output. */
  var DO_LOG_LINES_PRE_GATE = [
    { thinking: 'Verifying INV-1027 against payment ledger and PO-7718 status…' },
    { time: '02:14:01', cls: 'ok',   icon: '✓', msg: 'Confirmed hold on <span class="hl">INV-1027</span> · removed from AP queue · no payment routed', view: null },
    { time: '02:14:02', cls: 'ok',   icon: '✓', msg: 'Checked Praxis pattern · 2 prior duplicates · both retracted within 24h · $1,640 recovered', view: null },
    { thinking: 'Drafting retract request using prior Praxis script…' },
    { time: '02:14:03', cls: 'warn', icon: '⏸', msg: '<span class="hl">INV-1027</span>: different invoice number detected · flagging before sending retract', view: null },
    { time: '02:14:04', cls: 'ok',   icon: '✓', msg: 'Retract request pre-drafted · awaiting your confirmation to send', view: 'view draft' },
    { thinking: 'Checking if INV-1027 could be a legitimate reissue…' },
    { time: '02:14:05', cls: 'warn', icon: '⏸', msg: '<span class="hl">INV-1027</span>: new invoice number (not INV-1024 reuse) · could be genuine reissue · needs your call', view: null }
  ];
  var DO_LOG_LINES_POST_GATE = [
    { time: '02:14:38', cls: 'ok', icon: '✓', msg: 'Retract request sent to <span class="hl">Praxis Logistics</span> · using pre-approved AP script', view: 'view draft' },
    { time: '02:14:39', cls: 'ok', icon: '✓', msg: 'Audit trail written · INV-1027 held · Praxis notified · case awaiting vendor retract', view: 'audit' }
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
      '<!-- slim-cta injected inside head below -->' +
      '<div class="chat-head">' +
        '<div class="chat-status-dot slim-dot-top" title="Online"></div>' +
      '<div class="chat-mark" id="chatMark" style="padding:3px">' +'<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 4 24 24" fill="none" width="24" height="24"><defs><linearGradient id="wgm" x1="4.5" y1="4.5" x2="31.6" y2="20.6" gradientUnits="userSpaceOnUse"><stop stop-color="#FFD000"/><stop offset="1" stop-color="#FF6900"/></linearGradient></defs><g transform="rotate(45,16,16)"><g transform="rotate(0,16,16)"><rect x="14.7" y="4.5" width="2.625" height="6.6" rx="1.3125" fill="url(#wgm)"/></g><g transform="rotate(45,16,16)"><rect x="14.7" y="8.3" width="2.625" height="2.8" rx="1.3125" fill="url(#wgm)"/></g><g transform="rotate(90,16,16)"><rect x="14.7" y="4.5" width="2.625" height="6.6" rx="1.3125" fill="url(#wgm)"/></g><g transform="rotate(135,16,16)"><rect x="14.7" y="8.3" width="2.625" height="2.8" rx="1.3125" fill="url(#wgm)"/></g><g transform="rotate(180,16,16)"><rect x="14.7" y="4.5" width="2.625" height="6.6" rx="1.3125" fill="url(#wgm)"/></g><g transform="rotate(225,16,16)"><rect x="14.7" y="8.3" width="2.625" height="2.8" rx="1.3125" fill="url(#wgm)"/></g><g transform="rotate(270,16,16)"><rect x="14.7" y="4.5" width="2.625" height="6.6" rx="1.3125" fill="url(#wgm)"/></g><g transform="rotate(315,16,16)"><rect x="14.7" y="8.3" width="2.625" height="2.8" rx="1.3125" fill="url(#wgm)"/></g></g><circle cx="16" cy="16" r="3.2" fill="url(#wgm)"/></svg>' +'</div>' +
      '<div class="slim-cta">Witness<br>Chat</div>' +
        '<div class="chat-head-info">' +
          '<div class="chat-title">Witness</div>' +
          '<div class="chat-sub">Procurement agent · always on</div>' +
        '</div>' +
        /* dot removed */ '' +
        '<div class="chat-tools" onclick="event.stopPropagation()">' +
          '<button class="chat-tool-btn" id="btnReset" data-tip="New conversation" onclick="resetConvo()">' + SVG_NEW + '</button>' +
          '<button class="chat-tool-btn" id="btnFloat" data-tip="Pop out">' + SVG_FLOAT + '</button>' +
          '<button class="chat-tool-btn" id="btnSlim" data-tip="Collapse">' + SVG_FOLD + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="chat-body" id="chatBody">' +
        EMPTY_STATE_HTML +
        '<div class="convo-area" id="convoArea"></div>' +
      '</div>' +
      '<div class="chat-bottom-prompts" id="bottomPrompts" style="display:none;">' +
        '<div class="bp-label">Try another mode</div>' +
        '<div class="bp-row">' +
          '<button class="bp-chip ask"   type="button" data-kind="ask" data-prompt="What happened with INV-1027?"' +
                  ' data-prompt="Where is INV-1048 in the approval chain?">' +
            '<span class="m">?</span><span class="lbl">Ask</span>' +
          '</button>' +
          '<button class="bp-chip think" type="button" data-kind="think" data-prompt="What are my options for handling INV-1027?"' +
                  ' data-prompt="What are my options for handling INV-1027?">' +
            '<span class="m">◇</span><span class="lbl">Suggest</span>' +
          '</button>' +
          '<button class="bp-chip do"    type="button" data-kind="do" data-prompt="Confirm hold on INV-1027 and notify Praxis to retract"' +
                  ' data-prompt="Send follow-ups to all 6 overdue vendor items">' +
            '<span class="m">⚡</span><span class="lbl">Do</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="chat-foot">' +
        '<div class="chat-input-row">' +
          '<textarea class="chat-input" placeholder="Ask, suggest, or delegate to Witness…" rows="1"></textarea>' +
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

  window.openWitnessChat = function () {
    // Reset to blank state first
    if (typeof window.resetConvo === 'function') window.resetConvo();

    // Open the chat panel
    setChatMode('rail', { persist: true });

    // Focus the chat input
    setTimeout(function () {
      var input = document.querySelector('.chat-input');
      if (input) input.focus();
    }, 250);
  };

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
      btnSlim.innerHTML = mode === 'slim' ? SVG_UNFOLD : SVG_FOLD;
      btnSlim.dataset.tip = mode === 'slim' ? 'Expand' : 'Collapse';
    }
    if (btnFloat) {
      btnFloat.classList.toggle('active', mode === 'float');
      btnFloat.innerHTML = mode === 'float' ? SVG_DOCK : SVG_FLOAT;
      btnFloat.dataset.tip = mode === 'float' ? 'Dock to side' : 'Pop out';
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
    var viewHtml = '';
    if (opts.view === 'view draft') {
      viewHtml = '<span class="view"><button class="view-draft-btn" onclick="showDraft(this)">View draft</button></span>';
    } else if (opts.view) {
      viewHtml = '<span class="view">' + opts.view + '</span>';
    } else {
      viewHtml = '<span></span>';
    }
    div.innerHTML =
      '<span class="t">' + opts.time + '</span>' +
      '<span class="s ' + opts.status.cls + '">' + opts.status.icon + '</span>' +
      '<span class="msg">' + opts.msg + '</span>' +
      viewHtml;
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
    await typewriter(t1, 'Verifying INV-1027 against payment ledger and PO-7718 status…', token);
    if (isStale(token)) return;
    await wait(500);

    appendLogLine(logBody, {
      time: '02:14:01',
      status: { cls: 'ok', icon: '✓' },
      msg: 'Confirmed hold on <span class="hl">INV-1027</span> · removed from AP queue · no payment routed',
      view: null
    });
    await wait(900); if (isStale(token)) return;

    appendLogLine(logBody, {
      time: '02:14:02',
      status: { cls: 'ok', icon: '✓' },
      msg: 'Checked Praxis pattern · 2 prior duplicates · both retracted within 24h · $1,640 recovered',
      view: null
    });
    await wait(900); if (isStale(token)) return;

    var t2 = appendThinking(logBody);
    await typewriter(t2, 'Drafting retract request using prior Praxis script…', token);
    if (isStale(token)) return;
    await wait(450);

    appendLogLine(logBody, {
      time: '02:14:03',
      status: { cls: 'warn', icon: '⏸' },
      msg: '<span class="hl">INV-1027</span>: different invoice number detected · flagging before sending retract',
      view: null
    });
    await wait(800);

    appendLogLine(logBody, {
      time: '02:14:04',
      status: { cls: 'ok', icon: '✓' },
      msg: 'Retract request pre-drafted · awaiting your confirmation to send',
      view: 'view draft'
    });
    await wait(900); if (isStale(token)) return;

    var t3 = appendThinking(logBody);
    await typewriter(t3, 'Checking if INV-1027 could be a legitimate reissue…', token);
    if (isStale(token)) return;
    await wait(420);

    appendLogLine(logBody, {
      time: '02:14:05',
      status: { cls: 'warn', icon: '⏸' },
      msg: '<span class="hl">INV-1027</span>: new invoice number, not INV-1024 reuse · could be genuine reissue · needs your call',
      view: null
    });
    await wait(750);

    setLogStatus(logRoot, 'paused', 'paused, awaiting your call');
    setAgentThinking(false);
    await revealStep(scope, 7, token);
    if (isStale(token)) return;

    await new Promise(function (r) { gateResolver = r; });
    if (isStale(token)) return;

    setAgentThinking(true);
    setLogStatus(logRoot, 'running', 'running');
    await wait(700);

    appendLogLine(logBody, {
      time: '02:14:38',
      status: { cls: 'ok', icon: '✓' },
      msg: 'Retract request sent to <span class="hl">Praxis Logistics</span> · using pre-approved AP script',
      view: 'view draft'
    });
    await wait(900); if (isStale(token)) return;

    appendLogLine(logBody, {
      time: '02:14:39',
      status: { cls: 'ok', icon: '✓' },
      msg: 'Audit trail written · INV-1027 held · Praxis notified · case awaiting vendor retract',
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
          setLogStatus(logRoot, 'paused', 'paused, awaiting your call');
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
  var DRAFT_EMAIL = {
    to: 'ap@praxislogistics.com',
    subject: 'Re: INV-1027 on PO-7718: Retract request',
    body: 'Hi Praxis AP team,\n\nWe received INV-1027 ($890.40, PO-7718, SHP-2241) on Apr 28 via your vendor portal. However, this purchase order was already fully settled:\n\n  Invoice: INV-1024\n  Paid: $890.40 via ACH on Apr 26\n  PO-7718 status: Fully invoiced and closed\n\nWe believe INV-1027 may have been re-emitted by your billing system when the portal sync ran. Could you please retract INV-1027 from your portal and confirm by reply?\n\nThis matches your prior pattern from Aug 2024 and Jan 2025. Both were resolved quickly, thank you for that.\n\nIf INV-1027 is a corrected reissue (e.g., updated remit-to bank), please let us know and we will process accordingly after confirming the INV-1024 reversal.\n\nThank you,\nSarah Kim\nAP Manager'
  };

  window.showDraft = function(btn) {
    // Insert draft panel right after the log-line that contains the button
    var logLine = btn.closest('.log-line') || btn.parentNode;
    if (logLine.nextSibling && logLine.nextSibling.classList && logLine.nextSibling.classList.contains('draft-panel')) {
      // Toggle — remove if already open
      logLine.parentNode.removeChild(logLine.nextSibling);
      btn.textContent = 'View draft';
      return;
    }
    var panel = document.createElement('div');
    panel.className = 'draft-panel';
    panel.innerHTML =
      '<div class="draft-panel-head">' +
        '<span>📧 Draft · Praxis Logistics</span>' +
        '<button class="draft-copy-btn" onclick="copyDraft(this)">Copy email</button>' +
      '</div>' +
      '<div class="draft-fields">' +
        '<div class="draft-field"><span class="draft-field-lbl">To</span><span class="draft-field-val">' + DRAFT_EMAIL.to + '</span></div>' +
        '<div class="draft-field"><span class="draft-field-lbl">Subject</span><span class="draft-field-val">' + DRAFT_EMAIL.subject + '</span></div>' +
      '</div>' +
      '<div class="draft-body">' + DRAFT_EMAIL.body.replace(/\n/g, '<br>') + '</div>';
    logLine.parentNode.insertBefore(panel, logLine.nextSibling);
    btn.textContent = 'Hide draft';
  };

  window.copyDraft = function(btn) {
    var text = 'To: ' + DRAFT_EMAIL.to + '\nSubject: ' + DRAFT_EMAIL.subject + '\n\n' + DRAFT_EMAIL.body;
    navigator.clipboard.writeText(text).then(function() {
      btn.textContent = '✓ Copied';
      btn.classList.add('copied');
      setTimeout(function() { btn.textContent = 'Copy email'; btn.classList.remove('copied'); }, 2000);
    }).catch(function() {
      // Fallback for browsers that block clipboard
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.textContent = '✓ Copied'; btn.classList.add('copied');
      setTimeout(function() { btn.textContent = 'Copy email'; btn.classList.remove('copied'); }, 2000);
    });
  };

  function renderLogEntry(line) {
    var div = document.createElement('div');
    if (line.thinking) {
      div.className = 'do-thinking stream-item shown';
      div.textContent = line.thinking;
    } else {
      div.className = 'log-line stream-item shown';
      var viewHtml = '';
      if (line.view === 'view draft') {
        viewHtml = '<span class="view"><button class="view-draft-btn" onclick="showDraft(this)">View draft</button></span>';
      } else if (line.view) {
        viewHtml = '<span class="view">' + line.view + '</span>';
      } else {
        viewHtml = '<span></span>';
      }
      div.innerHTML =
        '<span class="t">' + line.time + '</span>' +
        '<span class="s ' + line.cls + '">' + line.icon + '</span>' +
        '<span class="msg">' + line.msg + '</span>' +
        viewHtml;
    }
    return div;
  }

  /* ─────────── Entry points (global) ─────────── */

  /* After Ask streams, prefill the input so the user can send to trigger source docs */
  document.addEventListener('witness:ask-rendered', function () {
    setTimeout(function () {
      var input = document.querySelector('.chat-input');
      if (!input) return;
      input.value = 'Yes, pull the source documents for me';
      input.setAttribute('data-kind', 'source-docs');
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      input.focus();
    }, 400);
  });

  window.showSourceDocs = async function () {
    var msg2   = document.getElementById('askMsg2');
    var agent2 = document.getElementById('askAgent2');
    if (!msg2 || !agent2) return;

    // Show user message
    msg2.classList.remove('hidden');
    scrollToBottom();

    // Show thinking bubble after user message
    await wait(300);
    setAgentThinking(true);
    var convoEl = document.getElementById('convoArea');
    var bubble = document.createElement('div');
    bubble.className = 'thinking-bubble';
    bubble.innerHTML = '<span class="t-dot"></span><span class="t-dot"></span><span class="t-dot"></span>';
    if (convoEl) { convoEl.appendChild(bubble); scrollToBottom(); }
    bubble.remove();
    setAgentThinking(false);

    // Reveal agent response
    agent2.classList.remove('hidden');
    agent2.querySelectorAll('.stream-item').forEach(function (el) {
      el.classList.add('shown');
    });
    scrollToBottom();
  };

  function showThinkingBubble() {
    var convoEl = document.getElementById('convoArea');
    if (!convoEl) return null;
    var bubble = document.createElement('div');
    bubble.className = 'thinking-bubble';
    bubble.id = 'thinkingBubble';
    bubble.innerHTML = '<span class="t-dot"></span><span class="t-dot"></span><span class="t-dot"></span>';
    convoEl.appendChild(bubble);
    scrollToBottom();
    return bubble;
  }
  function removeThinkingBubble() {
    var b = document.getElementById('thinkingBubble');
    if (b) b.remove();
  }

  window.runPrompt = async function runPrompt(kind) {
    streamToken++;
    var myToken = streamToken;
    if (gateResolver) { var r = gateResolver; gateResolver = null; r(); }
    setAgentThinking(false);

    // Ensure chat is visible
    if (document.body.getAttribute('data-chat') === 'slim') setChatMode('rail');

    var empty   = document.getElementById('emptyState');
    var bottom  = document.getElementById('bottomPrompts');
    if (empty)  empty.classList.add('hidden');
    if (bottom) bottom.style.display = 'block';

    var html = (kind === 'ask') ? TPL_ASK_HTML
            : (kind === 'think') ? TPL_THINK_HTML
            : (kind === 'do') ? TPL_DO_HTML : null;
    if (!html) return;

    // Re-query convoEl fresh each time (injected by boot)
    var convoEl = document.getElementById('convoArea');
    if (!convoEl) return;

    // Show user message first
    convoEl.innerHTML = '';
    var tmpWrapper = document.createElement('div');
    tmpWrapper.innerHTML = html;
    var userMsg = tmpWrapper.querySelector('.msg-user');
    if (userMsg) {
      convoEl.appendChild(userMsg.cloneNode(true));
      scrollToBottom();
    }

    // Show thinking bubble + logo pulse
    setAgentThinking(true);
    var bubble = document.createElement('div');
    bubble.className = 'thinking-bubble';
    bubble.innerHTML = '<span class="t-dot"></span><span class="t-dot"></span><span class="t-dot"></span>';
    convoEl.appendChild(bubble);
    scrollToBottom();

    await wait(1600);
    if (myToken !== streamToken) return;

    // Remove thinking bubble, render full response
    bubble.remove();
    setAgentThinking(false);

    convoEl.innerHTML = '';
    var wrapper2 = document.createElement('div');
    wrapper2.innerHTML = html;
    convoEl.appendChild(wrapper2);
    scrollToBottom();

    saveConvo({ kind: kind, gate: { decided: false } });

    if (kind === 'do') await streamDo(wrapper2);
    else {
      await streamSimple(wrapper2);
      if (kind === 'ask') {
        document.dispatchEvent(new CustomEvent('witness:ask-rendered'));
      }
    }
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

    // Chip click behavior differs by autonomy mode (same rule in BOTH the
    // empty-state chips and the "Try another mode" bottom-prompts row):
    //   Ask         → prefill the input; the user reads/edits and presses send.
    //                 Reflects "user asks a question."
    //   Suggest/Do  → fire immediately; the agent initiates, no user text.
    //                 Reflects "agent surfaces a recommendation / has done X."
    window.runChip = function runChip(kind, prompt) {
      if (document.body.getAttribute('data-chat') === 'slim') setChatMode('rail');
      input.value = prompt || '';
      input.setAttribute('data-kind', kind);
      input.focus();
      setTimeout(function() {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        var len = input.value.length;
        try { input.setSelectionRange(len, len); } catch(e) {}
      }, 50);
    };

    var chips = document.querySelectorAll('.empty-chip[data-kind], .bp-chip[data-kind]');
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function (e) {
        e.preventDefault();
        window.runChip(chip.getAttribute('data-kind'), chip.getAttribute('data-prompt') || '');
      });
    });

    var pendingKind = null;

    function fire() {
      // Always re-query — textarea may differ from captured input var
      var activeInput = document.querySelector('.chat-input') || input;
      var kind = pendingKind || activeInput.getAttribute('data-kind') || 'ask';
      pendingKind = null;
      activeInput.value = '';
      if (activeInput.style) { activeInput.style.height = 'auto'; }
      activeInput.removeAttribute('data-kind');
      if (kind === 'source-docs') {
        if (typeof window.showSourceDocs === 'function') window.showSourceDocs(null);
        return;
      }
      if (typeof window.runPrompt !== 'function') return;
      window.runPrompt(kind);
    }

    sendBtn.addEventListener('click', function (e) {
      e.preventDefault();
      fire();
    });
    // Use document-level keydown so it works with textarea too
    document.addEventListener('keydown', function (e) {
      var activeInput = document.querySelector('.chat-input');
      if (e.target !== activeInput) return;
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

