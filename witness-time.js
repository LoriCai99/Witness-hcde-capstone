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
