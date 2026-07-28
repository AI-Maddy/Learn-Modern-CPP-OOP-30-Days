/**
 * progress-tracker.js
 * Tracks which days the user has visited. Stores in localStorage.
 * Shows a progress ring in the sidebar and on the homepage.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cpp-brain-progress';
  const TOTAL_DAYS  = 31;

  function load() {
    try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
    catch { return new Set(); }
  }

  function save(set) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  }

  function markCurrentDay() {
    const match = window.location.pathname.match(/day-(\d+)/);
    if (!match) return;
    const visited = load();
    visited.add(match[1]);
    save(visited);
  }

  function renderProgressRing() {
    const visited = load();
    const pct = (visited.size / TOTAL_DAYS) * 100;

    // Update any progress rings on the page
    document.querySelectorAll('.day-progress-ring').forEach(ring => {
      const circle = ring.querySelector('circle.progress');
      if (!circle) return;
      const r = parseFloat(circle.getAttribute('r') || 28);
      const circ = 2 * Math.PI * r;
      circle.style.strokeDasharray  = circ;
      circle.style.strokeDashoffset = circ * (1 - pct / 100);
    });

    // Update counter text
    document.querySelectorAll('.days-completed').forEach(el => {
      el.textContent = visited.size;
    });

    document.querySelectorAll('.days-pct').forEach(el => {
      el.textContent = Math.round(pct) + '%';
    });

    // Mark day cards as visited
    visited.forEach(dayNum => {
      const slug = 'day-' + dayNum.padStart(2, '0');
      const card = document.querySelector(`.day-card[data-slug="${slug}"]`);
      if (card) {
        card.classList.add('day-visited');
        card.style.opacity = '0.65';
        const checkmark = document.createElement('span');
        checkmark.textContent = ' ✓';
        checkmark.style.cssText = 'color:#4ade80;font-size:0.75rem;margin-left:4px;';
        const title = card.querySelector('.day-card-title');
        if (title && !title.querySelector('span')) title.appendChild(checkmark);
      }
    });
  }

  function injectProgressWidget() {
    const hero = document.querySelector('.progress-widget-host');
    if (!hero) return;
    const visited = load();
    const pct = Math.round((visited.size / TOTAL_DAYS) * 100);
    const r = 28, circ = 2 * Math.PI * r;

    hero.innerHTML = `
      <div style="display:flex;align-items:center;gap:1rem;padding:0.75rem 1rem;
                  background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);
                  border-radius:0.75rem;">
        <svg width="70" height="70" class="day-progress-ring">
          <circle cx="35" cy="35" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="5"/>
          <circle class="progress" cx="35" cy="35" r="${r}" fill="none"
            stroke="url(#prog-grad)" stroke-width="5"
            stroke-linecap="round"
            stroke-dasharray="${circ}"
            stroke-dashoffset="${circ * (1 - pct / 100)}"
            transform="rotate(-90 35 35)"
            style="transition:stroke-dashoffset 1s ease"/>
          <defs>
            <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#6366f1"/>
              <stop offset="100%" stop-color="#a855f7"/>
            </linearGradient>
          </defs>
          <text x="35" y="40" text-anchor="middle" fill="#c4b5fd" font-size="14" font-weight="800"
            font-family="Inter,sans-serif"><tspan class="days-pct">${pct}%</tspan></text>
        </svg>
        <div>
          <div style="font-size:0.75rem;color:rgba(255,255,255,0.4);text-transform:uppercase;
                      letter-spacing:0.08em;margin-bottom:0.25rem;">Your Progress</div>
          <div style="font-size:1.1rem;font-weight:700;color:#e2e8f0;">
            <span class="days-completed">${visited.size}</span> / ${TOTAL_DAYS} days completed
          </div>
          <div style="height:4px;border-radius:2px;background:rgba(255,255,255,0.06);
                      overflow:hidden;margin-top:0.5rem;width:180px;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#6366f1,#a855f7);
                        border-radius:2px;transition:width 1s ease;"></div>
          </div>
        </div>
      </div>
    `;
  }

  function init() {
    markCurrentDay();
    renderProgressRing();
    injectProgressWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
