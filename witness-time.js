/* Witness · live PST time helper
   ─────────────────────────────────────────
   Renders all timestamps on the platform relative to real-world Pacific time.

   Markup conventions:
     <span data-wt-time="today 06:42" data-wt-fmt="time2"></span>
     <span data-wt-time="-1d 23:00"   data-wt-fmt="datetime"></span>
     <span data-wt-time="-15m"        data-wt-fmt="time"></span>
     <h1>  <span data-wt-greeting></span>, Sarah.</h1>
     <span data-wt-clock="pst"></span>      live PST clock
     <span data-wt-day="0"  data-wt-fmt="daylabel"></span>   "Mon · Apr 28"
     <span data-wt-day="-1" data-wt-fmt="date"></span>       "Apr 27"

   Offset grammar for data-wt-time:
     "now"                          → current PST instant
     "+5m" / "-30m" / "-2h" / "-1d" → relative offset from now
     "-1h30m" / "-2d3h"             → compound relative offset
     "today HH:MM"                  → today at HH:MM PST
     "yesterday HH:MM"              → yesterday at HH:MM PST
     "-3d 08:30"                    → 3 days ago at 08:30 PST
     "+1d 09:00"                    → tomorrow at 09:00 PST

   Format names (data-wt-fmt):
     time      "6:42 AM"                  (hour not zero-padded)
     time2     "06:42 AM"                 (hour zero-padded)
     date      "Apr 28"
     datetime  "Apr 28 · 06:42 AM"        (date + zero-padded time)
     datetimeN "Apr 28 · 6:42 AM"         (date + non-padded time)
     daylabel  "Mon · Apr 28"
     pst       "6:42 AM PST"              (live clock)
     full      "Mon, Apr 28 · 6:42 AM PST" (live clock long form)
*/
(function () {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WEEKDAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const WEEKDAYS_LONG  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // Return a Date object whose local getters (getHours, getDate, ...)
  // report the current wall-clock time in America/Los_Angeles.
  function pstNow() {
    const now = new Date();
    const shifted = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    return shifted;
  }

  function parseRelative(rest) {
    const m = rest.match(/^([+-])((?:\d+d)?(?:\d+h)?(?:\d+m)?)$/);
    if (!m || !m[2]) return null;
    const sign = m[1] === '-' ? -1 : 1;
    const body = m[2];
    let d = 0, h = 0, mi = 0;
    const dM = body.match(/(\d+)d/); if (dM) d = +dM[1];
    const hM = body.match(/(\d+)h/); if (hM) h = +hM[1];
    const mM = body.match(/(\d+)m/); if (mM) mi = +mM[1];
    return sign * (((d * 24) + h) * 60 + mi) * 60000;
  }

  function resolveSpec(spec) {
    const base = pstNow();
    if (!spec || spec === 'now') return base;

    // "today HH:MM" / "yesterday HH:MM"
    const named = spec.match(/^(today|yesterday|tomorrow)\s+(\d{1,2}):(\d{2})$/i);
    if (named) {
      const shift = { today: 0, yesterday: -1, tomorrow: 1 }[named[1].toLowerCase()];
      const d = new Date(base);
      d.setDate(d.getDate() + shift);
      d.setHours(+named[2], +named[3], 0, 0);
      return d;
    }

    // "-Nd HH:MM" / "+Nd HH:MM"
    const dayHour = spec.match(/^([+-]\d+)d\s+(\d{1,2}):(\d{2})$/);
    if (dayHour) {
      const d = new Date(base);
      d.setDate(d.getDate() + +dayHour[1]);
      d.setHours(+dayHour[2], +dayHour[3], 0, 0);
      return d;
    }

    // Purely relative: "-1h30m", "+5m", "-2d"
    const relMs = parseRelative(spec);
    if (relMs !== null) return new Date(base.getTime() + relMs);

    return base;
  }

  function fmtTime(d, padHour) {
    let h = d.getHours();
    const mi = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const hStr = padHour ? String(h).padStart(2, '0') : String(h);
    return `${hStr}:${String(mi).padStart(2, '0')} ${ampm}`;
  }

  function fmtDate(d) {
    return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  }

  function fmtDayLabel(d) {
    return `${WEEKDAYS_SHORT[d.getDay()]} · ${fmtDate(d)}`;
  }

  function format(d, fmt) {
    switch (fmt) {
      case 'time2':     return fmtTime(d, true);
      case 'time':      return fmtTime(d, false);
      case 'date':      return fmtDate(d);
      case 'datetime':  return `${fmtDate(d)} · ${fmtTime(d, true)}`;
      case 'datetimeN': return `${fmtDate(d)} · ${fmtTime(d, false)}`;
      case 'daylabel':  return fmtDayLabel(d);
      case 'pst':       return `${fmtTime(d, false)} PST`;
      case 'full':      return `${WEEKDAYS_LONG[d.getDay()]}, ${fmtDate(d)} · ${fmtTime(d, false)} PST`;
      case 'topbar':    return `${WEEKDAYS_LONG[d.getDay()]}  ·  ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}  ·  ${d.getFullYear()}  ·  ${fmtTime(d, true)}`;
      case 'longdate':  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      case 'longdatetime': return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${fmtTime(d, false)}`;
      case 'longdatetime2': return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${fmtTime(d, true)}`;
      case 'fullbrief':     return `${WEEKDAYS_LONG[d.getDay()]} · ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      default:          return fmtTime(d, false);
    }
  }

  function greetingFor(d) {
    const h = d.getHours();
    if (h < 5)  return 'Good evening';
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  // Re-anchor any "Mon DD" or "Mon DD, 2025" date that appears in prose / attributes
  // The prototype's narrative date is Apr 28, 2025 → today. Other dates shift by the
  // same offset (Apr 27 → yesterday, Apr 15 → 13 days ago, May 1 → 3 days from today, …).
  const ANCHOR = new Date(2025, 3, 28); // Apr 28, 2025
  const MONTH_RE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(,\s*2025)?\b/g;

  function shiftedTarget(monIdx, day) {
    const orig = new Date(2025, monIdx, day);
    const diffDays = Math.round((orig - ANCHOR) / (24 * 3600 * 1000));
    const target = new Date(pstNow());
    target.setHours(0, 0, 0, 0);
    target.setDate(target.getDate() + diffDays);
    return target;
  }

  function rewriteDateText(s) {
    if (!s || s.indexOf(' ') === -1) return s;
    return s.replace(MONTH_RE, (m, mon, day, yearPart) => {
      const monIdx = MONTHS.indexOf(mon);
      if (monIdx < 0) return m;
      const t = shiftedTarget(monIdx, +day);
      return yearPart
        ? `${MONTHS[t.getMonth()]} ${t.getDate()}, ${t.getFullYear()}`
        : `${MONTHS[t.getMonth()]} ${t.getDate()}`;
    });
  }

  const REWRITE_ATTRS = [
    'data-trace-fields',
    'data-trace-captured',
    'data-revert-undos',
    'data-revert-title',
    'data-revert-note',
    'aria-label',
    'title'
  ];

  // Cache original attribute values so re-renders are idempotent
  function snapshotAttr(el, name) {
    const key = `__wt_orig_${name}`;
    if (!(key in el.dataset)) {
      el.dataset[key] = el.getAttribute(name) || '';
    }
    return el.dataset[key];
  }

  function rewriteAttributes() {
    REWRITE_ATTRS.forEach(attr => {
      document.querySelectorAll('[' + attr + ']').forEach(el => {
        const orig = snapshotAttr(el, attr);
        const next = rewriteDateText(orig);
        if (next !== orig) el.setAttribute(attr, next);
      });
    });
  }

  // Rewrite text-node dates across the document. Walks once, caches originals,
  // so day-rollover re-renders against the unmodified text (no compounding drift).
  let cachedNodes = null;
  const SEARCH_RE = new RegExp(MONTH_RE.source); // non-global copy for .test()

  function collectTextNodes() {
    const roots = document.querySelectorAll('[data-wt-rewrite-dates]');
    const scope = roots.length ? Array.from(roots) : [document.body];
    const nodes = [];
    scope.forEach(root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest('[data-wt-time], [data-wt-day], [data-wt-clock], script, style')) {
            return NodeFilter.FILTER_REJECT;
          }
          return SEARCH_RE.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      let node;
      while ((node = walker.nextNode())) {
        nodes.push({ node, orig: node.nodeValue });
      }
    });
    cachedNodes = nodes;
  }

  function rewriteTextNodes() {
    if (!cachedNodes) collectTextNodes();
    cachedNodes.forEach(({ node, orig }) => {
      MONTH_RE.lastIndex = 0;
      const next = rewriteDateText(orig);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function renderAll() {
    const base = pstNow();

    document.querySelectorAll('[data-wt-time]').forEach(el => {
      const spec = el.getAttribute('data-wt-time');
      const fmt  = el.getAttribute('data-wt-fmt') || 'time';
      el.textContent = format(resolveSpec(spec), fmt);
    });

    document.querySelectorAll('[data-wt-day]').forEach(el => {
      const shift = parseInt(el.getAttribute('data-wt-day'), 10) || 0;
      const fmt = el.getAttribute('data-wt-fmt') || 'daylabel';
      const d = new Date(base);
      d.setDate(d.getDate() + shift);
      el.textContent = format(d, fmt);
    });

    document.querySelectorAll('[data-wt-greeting]').forEach(el => {
      el.textContent = greetingFor(base);
    });

    document.querySelectorAll('[data-wt-clock]').forEach(el => {
      const fmt = el.getAttribute('data-wt-clock') || 'pst';
      el.textContent = format(pstNow(), fmt);
    });

    rewriteAttributes();
    rewriteTextNodes();
  }

  function start() {
    renderAll();
    // Re-render every 20s so the live clock and "today" anchoring stay current
    // (also covers the case where the page is opened just before midnight PST).
    setInterval(renderAll, 20000);
  }

  window.WitnessTime = { pstNow, format, resolveSpec, greetingFor, renderAll };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
