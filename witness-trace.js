/* ═══════════════════════════════════════════════════════════════════
   WITNESS · TRACEABILITY MODULE — runtime
   Reads data-* attrs from triggers, builds popovers, handles revert.

   Markup patterns:
     1. <span class="trace-src wt-src" data-trace-system="Amazon Business"
              data-trace-doc="PO-7721" data-trace-loc="Line 4"
              data-trace-url="#amzn"
              data-trace-fields='Item|Monitor Arm Pro;Qty|12 units;Price|$701.67'>
          Amazon Business
        </span>

     2. <button class="wt-prov-trigger" data-trace-prov="match-1048">
          <span class="wt-prov-spark">✦</span> Provenance
        </button>
        <div hidden id="trace-prov-match-1048" data-prov>
          ...HTML content rendered inside popover...
        </div>

     3. <button class="wt-revert" data-trace-revert="batch-pb0428"
                data-revert-title="Revert payment batch PB-0428?"
                data-revert-undos="8 ERP payment entries;Status: scheduled → pending;Notify J. Park (reroute)"
                data-revert-note="Witness will keep the audit trail. Vendors are not notified.">
          ↩ Revert
        </button>
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── singleton popover element (reused) ────────────────────────────
  let pop = null;
  let activeTrigger = null;
  let activeKind = null;

  function ensurePop() {
    if (pop) return pop;
    pop = document.createElement('div');
    pop.className = 'wt-pop';
    pop.setAttribute('role', 'dialog');
    pop.innerHTML = '<span class="wt-pop-arrow"></span><div class="wt-pop-inner"></div>';
    document.body.appendChild(pop);
    return pop;
  }

  function closePop() {
    if (!pop) return;
    pop.classList.remove('open');
    if (activeTrigger) activeTrigger.removeAttribute('data-trace-open');
    activeTrigger = null;
    activeKind = null;
  }

  function positionPop(trigger) {
    const tRect = trigger.getBoundingClientRect();
    const pRect = pop.getBoundingClientRect();
    const margin = 8;
    let left = tRect.left;
    let top  = tRect.bottom + margin;

    // overflow right
    if (left + pRect.width > window.innerWidth - 12) {
      left = window.innerWidth - pRect.width - 12;
    }
    if (left < 12) left = 12;

    // overflow bottom → flip above
    let arrowTop = '-6px';
    let arrowBottom = 'auto';
    let arrowBorders = 'border-left:1px solid var(--ab,#e9e9e9);border-top:1px solid var(--ab,#e9e9e9);border-right:none;border-bottom:none;';
    if (top + pRect.height > window.innerHeight - 12) {
      top = tRect.top - pRect.height - margin;
      arrowTop = 'auto';
      arrowBottom = '-6px';
      arrowBorders = 'border-right:1px solid var(--ab,#e9e9e9);border-bottom:1px solid var(--ab,#e9e9e9);border-left:none;border-top:none;';
    }

    // arrow horizontal: align to trigger center, but clamp
    const arrowLeft = Math.max(14, Math.min(pRect.width - 26, tRect.left - left + tRect.width / 2 - 6));

    pop.style.left = left + 'px';
    pop.style.top  = top + 'px';

    const arrow = pop.querySelector('.wt-pop-arrow');
    if (arrow) {
      arrow.style.left = arrowLeft + 'px';
      arrow.style.top = arrowTop;
      arrow.style.bottom = arrowBottom;
      arrow.style.cssText += arrowBorders;
    }
  }

  // ─── toast ─────────────────────────────────────────────────────────
  let toastEl = null;
  function showToast(html) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'wt-toast';
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = html;
    toastEl.classList.add('open');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('open'), 3200);
  }

  // ─── LAYER 1: source popover (built from data-*) ───────────────────
  function buildSrcPopover(trigger) {
    const system = trigger.getAttribute('data-trace-system') || 'External source';
    const doc    = trigger.getAttribute('data-trace-doc') || '';
    const loc    = trigger.getAttribute('data-trace-loc') || '';
    const url    = trigger.getAttribute('data-trace-url') || '#';
    const fieldsRaw = trigger.getAttribute('data-trace-fields') || '';
    const captured  = trigger.getAttribute('data-trace-captured') || '';
    const extractor = trigger.getAttribute('data-trace-extractor') || '';
    const confidence = trigger.getAttribute('data-trace-confidence') || '';

    const fields = fieldsRaw
      .split(';').map(p => p.trim()).filter(Boolean)
      .map(pair => {
        const [k, ...rest] = pair.split('|');
        return { k: (k || '').trim(), v: rest.join('|').trim() };
      });

    pop.setAttribute('data-variant', 'src');
    pop.style.setProperty('--ab', '#e9e9e9');
    const titleLine = [doc, loc].filter(Boolean).join(' · ');
    const fieldsHtml = fields.map(f =>
      `<div class="wt-pop-row"><span class="k">${escapeHtml(f.k)}</span><span class="v">${escapeHtml(f.v)}</span></div>`
    ).join('');

    pop.querySelector('.wt-pop-inner').innerHTML = `
      <div class="wt-pop-head">
        <span class="wt-pop-eyebrow src"><span class="wt-dot"></span>Source · ${escapeHtml(system)}</span>
        <button class="wt-pop-close" type="button" aria-label="Close">✕</button>
      </div>
      ${titleLine ? `<div class="wt-pop-title">${escapeHtml(titleLine)}</div>` : ''}
      ${fields.length ? `<div class="wt-pop-rows">${fieldsHtml}</div>` : ''}
      ${(captured || extractor || confidence) ? `
        <div class="wt-prov-section" style="background:#fafafa;border-top:1px solid #f0f0f0;">
          ${captured ? `<div style="font-size:11px;color:#45556c;margin-bottom:3px;"><strong style="color:#0b0d12;">Captured:</strong> ${escapeHtml(captured)}</div>` : ''}
          ${extractor ? `<div style="font-size:11px;color:#45556c;margin-bottom:3px;"><strong style="color:#0b0d12;">By:</strong> ${escapeHtml(extractor)}</div>` : ''}
          ${confidence ? `<div style="font-size:11px;color:#45556c;"><strong style="color:#0b0d12;">Extraction confidence:</strong> ${escapeHtml(confidence)}</div>` : ''}
        </div>
      ` : ''}
      <div class="wt-pop-foot">
        <button class="wt-pop-btn primary" type="button" data-action="open">
          Open in ${escapeHtml(system)} ↗
        </button>
        <button class="wt-pop-btn ghost" type="button" data-action="copy">Copy ref</button>
      </div>
    `;

    // bind actions
    pop.querySelector('[data-action="open"]').addEventListener('click', () => {
      closePop();
      showToast(
        `<span class="wt-toast-icon">↗</span>
         <span>Opening <strong>${escapeHtml(titleLine || doc || system)}</strong> in ${escapeHtml(system)}…</span>
         <span class="wt-toast-link" onclick="this.parentElement.classList.remove('open')">Cancel</span>`
      );
    });
    pop.querySelector('[data-action="copy"]').addEventListener('click', () => {
      const ref = [system, doc, loc].filter(Boolean).join(' · ');
      try { navigator.clipboard.writeText(ref); } catch (e) {}
      showToast(`<span class="wt-toast-icon">✓</span><span>Copied <strong>${escapeHtml(ref)}</strong> to clipboard</span>`);
      closePop();
    });
    pop.querySelector('.wt-pop-close').addEventListener('click', closePop);
  }

  // ─── LAYER 2: AI provenance popover ────────────────────────────────
  function buildProvPopover(trigger) {
    const refId = trigger.getAttribute('data-trace-prov');
    const tmpl = document.getElementById('trace-prov-' + refId);
    pop.setAttribute('data-variant', 'ai');
    pop.style.setProperty('--ab', '#ffd5b8');

    if (tmpl) {
      pop.querySelector('.wt-pop-inner').innerHTML = tmpl.innerHTML;
    } else {
      // fallback minimal provenance built from data-*
      const action = trigger.getAttribute('data-prov-action') || 'AI action';
      const ranAt  = trigger.getAttribute('data-prov-when')   || '';
      const rule   = trigger.getAttribute('data-prov-rule')   || '';
      const status = trigger.getAttribute('data-prov-status') || 'done';
      pop.querySelector('.wt-pop-inner').innerHTML = `
        <div class="wt-pop-head">
          <span class="wt-pop-eyebrow ai"><span class="wt-dot"></span>Witness AI · Provenance</span>
          <button class="wt-pop-close" type="button">✕</button>
        </div>
        <div class="wt-pop-title">${escapeHtml(action)}</div>
        ${ranAt ? `<div class="wt-pop-sub">${escapeHtml(ranAt)}</div>` : ''}
        ${rule ? `<div class="wt-prov-section"><div class="wt-prov-label why-auto"><span class="wt-dot"></span>Allowed because</div><div class="wt-prov-body"><span class="pill rule">${escapeHtml(rule)}</span></div></div>` : ''}
        <div class="wt-pop-foot">
          <button class="wt-pop-btn" type="button" onclick="window.location.href='ai-activity.html'">View in Activity log →</button>
        </div>
      `;
    }
    // bind close + any in-template action buttons
    const closeBtn = pop.querySelector('.wt-pop-close');
    if (closeBtn) closeBtn.addEventListener('click', closePop);
    pop.querySelectorAll('[data-trace-action="goto-activity"]').forEach(b =>
      b.addEventListener('click', () => { window.location.href = 'ai-activity.html'; })
    );
    pop.querySelectorAll('[data-trace-action="goto-workflow"]').forEach(b =>
      b.addEventListener('click', () => { window.location.href = 'autoflow.html'; })
    );
    pop.querySelectorAll('[data-trace-action="revert"]').forEach(b =>
      b.addEventListener('click', () => {
        closePop();
        const refId = b.getAttribute('data-revert-ref');
        const synthetic = document.querySelector(`[data-trace-revert="${refId}"]`) || b;
        openRevertModal(synthetic);
      })
    );
  }

  // ─── LAYER 3: revert confirmation modal ────────────────────────────
  let modalEl = null;
  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'wt-modal-backdrop';
    modalEl.innerHTML = `
      <div class="wt-modal" role="dialog" aria-modal="true">
        <div class="wt-modal-head">
          <div class="wt-modal-eyebrow"><span style="width:6px;height:6px;border-radius:50%;background:#dc2626;display:inline-block;"></span>Revert AI action</div>
          <div class="wt-modal-title"></div>
        </div>
        <div class="wt-modal-body">
          <div class="wt-modal-section-label">This will undo</div>
          <ul class="wt-modal-undo-list"></ul>
          <div class="wt-modal-note" hidden></div>
        </div>
        <div class="wt-modal-foot">
          <button class="wt-modal-btn" data-action="cancel">Cancel</button>
          <button class="wt-modal-btn danger" data-action="confirm">↩ Revert all</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
    modalEl.addEventListener('click', e => {
      if (e.target === modalEl) closeModal();
    });
    modalEl.querySelector('[data-action="cancel"]').addEventListener('click', closeModal);
    return modalEl;
  }
  function openRevertModal(trigger) {
    ensureModal();
    const title  = trigger.getAttribute('data-revert-title') || 'Revert this AI action?';
    const undos  = (trigger.getAttribute('data-revert-undos') || '').split(';').map(s => s.trim()).filter(Boolean);
    const note   = trigger.getAttribute('data-revert-note') || '';
    const refId  = trigger.getAttribute('data-trace-revert') || '';

    modalEl.querySelector('.wt-modal-title').textContent = title;
    const ul = modalEl.querySelector('.wt-modal-undo-list');
    ul.innerHTML = undos.map(u => {
      // bold the "key" portion before ':'
      const m = u.match(/^([^:]+:)\s*(.*)$/);
      if (m) return `<li><span><strong>${escapeHtml(m[1])}</strong> ${escapeHtml(m[2])}</span></li>`;
      return `<li><span>${escapeHtml(u)}</span></li>`;
    }).join('');
    const noteEl = modalEl.querySelector('.wt-modal-note');
    if (note) { noteEl.textContent = note; noteEl.hidden = false; }
    else { noteEl.hidden = true; }

    const confirmBtn = modalEl.querySelector('[data-action="confirm"]');
    confirmBtn.onclick = () => {
      // mark all matching triggers as reverted
      document.querySelectorAll(`[data-trace-revert="${refId}"]`).forEach(b => {
        b.classList.add('reverted');
        b.innerHTML = '<span class="wt-revert-icon">↩</span> Reverted';
        b.disabled = true;
      });
      // visually mark the closest log-card if any
      const card = trigger.closest('.log-card');
      if (card) card.classList.add('wt-card-reverted');
      closeModal();
      showToast(
        `<span class="wt-toast-icon">↩</span>
         <span><strong>Reverted.</strong> ${undos.length} change${undos.length === 1 ? '' : 's'} rolled back.</span>
         <span class="wt-toast-link" onclick="this.parentElement.classList.remove('open')">Undo revert</span>`
      );
    };
    modalEl.classList.add('open');
  }
  function closeModal() {
    if (modalEl) modalEl.classList.remove('open');
  }

  // ─── click router ──────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    // popover-internal clicks → ignore
    if (pop && pop.contains(e.target)) return;

    // revert trigger
    const revertBtn = e.target.closest('.wt-revert, [data-trace-revert]');
    if (revertBtn && !revertBtn.classList.contains('reverted')) {
      e.preventDefault();
      e.stopPropagation();
      openRevertModal(revertBtn);
      return;
    }

    // source trigger
    const srcTrig = e.target.closest('.wt-src, .wt-src-mention');
    if (srcTrig) {
      e.preventDefault();
      e.stopPropagation();
      ensurePop();
      if (activeTrigger === srcTrig) { closePop(); return; }
      closePop();
      buildSrcPopover(srcTrig);
      activeTrigger = srcTrig;
      activeKind = 'src';
      srcTrig.setAttribute('data-trace-open', '1');
      pop.classList.add('open');
      // reflow + position
      requestAnimationFrame(() => positionPop(srcTrig));
      return;
    }

    // provenance trigger
    const provTrig = e.target.closest('.wt-prov-trigger, .wt-prov-icon, .wt-ai-tag, [data-trace-prov]');
    if (provTrig) {
      e.preventDefault();
      e.stopPropagation();
      ensurePop();
      if (activeTrigger === provTrig) { closePop(); return; }
      closePop();
      buildProvPopover(provTrig);
      activeTrigger = provTrig;
      activeKind = 'prov';
      provTrig.setAttribute('data-trace-open', '1');
      pop.classList.add('open');
      requestAnimationFrame(() => positionPop(provTrig));
      return;
    }

    // click outside → close
    closePop();
  });

  // close on ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closePop(); closeModal(); }
  });

  // reposition on scroll/resize (cheap; only if open)
  function reposIfOpen() {
    if (pop && pop.classList.contains('open') && activeTrigger) {
      positionPop(activeTrigger);
    }
  }
  window.addEventListener('scroll', reposIfOpen, true);
  window.addEventListener('resize', reposIfOpen);

  // ─── util ──────────────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // expose minimal API in case pages want programmatic use
  window.WitnessTrace = {
    closePop, openRevertModal, showToast
  };
})();
