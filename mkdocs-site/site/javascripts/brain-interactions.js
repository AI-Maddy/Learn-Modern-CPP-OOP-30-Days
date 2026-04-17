/**
 * brain-interactions.js
 * Scroll-reveal, hover ripple, keyboard nav, progress tracking,
 * synapse-spark on click, active section glow, typewriter effect.
 */

(function () {
  'use strict';

  /* ============================================================
     SCROLL REVEAL — Neurons activate as they enter viewport
     ============================================================ */
  function initScrollReveal() {
    const targets = document.querySelectorAll(
      '.md-typeset h2, .md-typeset h3, .md-typeset .admonition, ' +
      '.md-typeset details, .md-typeset table, .day-card, .brain-stat-card, ' +
      '.md-typeset .grid > *'
    );

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => {
      el.classList.add('reveal-on-scroll');
      io.observe(el);
    });
  }

  /* ============================================================
     SYNAPSE SPARK — Click ripple effect anywhere
     ============================================================ */
  function initSynapseRipple() {
    document.addEventListener('click', function (e) {
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        width: 8px; height: 8px;
        margin: -4px 0 0 -4px;
        border-radius: 50%;
        background: rgba(139,92,246,0.7);
        pointer-events: none;
        z-index: 9999;
        animation: ripple 0.5s ease-out forwards;
      `;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  }

  /* ============================================================
     READING PROGRESS BAR — Neural pathway filling as you read
     ============================================================ */
  function initProgressBar() {
    const bar = document.createElement('div');
    bar.id = 'neural-reading-bar';
    bar.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      height: 3px;
      width: 0%;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
      background-size: 200% 100%;
      z-index: 10000;
      pointer-events: none;
      transition: width 100ms linear;
      animation: axonFlow 2s linear infinite;
    `;
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ============================================================
     TYPEWRITER — Animate hero typewriter elements
     ============================================================ */
  function initTypewriter() {
    document.querySelectorAll('.typewriter-text').forEach(el => {
      const text = el.textContent;
      el.textContent = '';
      el.style.borderRight = '2px solid #8b5cf6';
      let i = 0;
      const interval = setInterval(() => {
        el.textContent += text[i];
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setTimeout(() => { el.style.borderRight = 'none'; }, 1500);
        }
      }, 60);
    });
  }

  /* ============================================================
     STAGGERED CARD ENTRANCE
     ============================================================ */
  function initCardEntrance() {
    const grids = document.querySelectorAll('.day-cards-grid, .flashcard-grid, .brain-stats');
    grids.forEach(grid => {
      Array.from(grid.children).forEach((child, idx) => {
        child.style.opacity = '0';
        child.style.transform = 'translateY(16px)';
        child.style.transition = `opacity 0.4s ease ${idx * 0.06}s, transform 0.4s ease ${idx * 0.06}s`;

        const io = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              e.target.style.opacity = '1';
              e.target.style.transform = 'translateY(0)';
              io.unobserve(e.target);
            }
          });
        }, { threshold: 0.05 });
        io.observe(child);
      });
    });
  }

  /* ============================================================
     KEYBOARD SHORTCUT — Press 1-9 to jump to sections
     ============================================================ */
  function initKeyboardNav() {
    document.addEventListener('keydown', e => {
      // Skip if inside input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // '/' focuses search
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('.md-search__input');
        if (searchInput) searchInput.focus();
      }

      // 'f' toggles full-width
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        document.body.classList.toggle('full-width-mode');
      }
    });
  }

  /* ============================================================
     COPY BUTTON SPARKLE — Extra feedback on code copy
     ============================================================ */
  function initCopySparkle() {
    document.querySelectorAll('.md-clipboard').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.style.color = '#4ade80';
        btn.style.boxShadow = '0 0 12px rgba(74,222,128,0.5)';
        setTimeout(() => {
          btn.style.color = '';
          btn.style.boxShadow = '';
        }, 1500);
      });
    });
  }

  /* ============================================================
     TOOLTIP ENHANCEMENT — Code term tooltips
     ============================================================ */
  function initTooltips() {
    // Automatic abbreviation lookup for C++ terms
    const terms = {
      'RAII':  'Resource Acquisition Is Initialization',
      'CRTP':  'Curiously Recurring Template Pattern',
      'PIMPL': 'Pointer to Implementation',
      'SFINAE':'Substitution Failure Is Not An Error',
      'ADL':   'Argument-Dependent Lookup',
      'SOLID': 'Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion',
    };
    const content = document.querySelector('.md-content__inner');
    if (!content) return;
    Object.entries(terms).forEach(([term, def]) => {
      content.innerHTML = content.innerHTML.replace(
        new RegExp(`\\b(${term})\\b(?![^<]*>)(?!.*<\/abbr>)`, 'g'),
        `<abbr title="${def}">$1</abbr>`
      );
    });
  }

  /* ============================================================
     ACTIVE HEADING GLOW — Highlight TOC active item
     ============================================================ */
  function initActiveSectionGlow() {
    const headings = document.querySelectorAll('.md-typeset h2[id], .md-typeset h3[id]');
    if (!headings.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const id = e.target.getAttribute('id');
        const tocLink = document.querySelector(`.md-nav__link[href="#${id}"]`);
        if (tocLink) {
          tocLink.classList.toggle('toc-active', e.isIntersecting);
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    headings.forEach(h => io.observe(h));
  }

  /* ============================================================
     MERMAID — Dark theme initialization
     ============================================================ */
  function initMermaid() {
    if (typeof window.mermaid === 'undefined') return;
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#0d1117',
        primaryColor: '#8b5cf6',
        primaryTextColor: '#e2e8f0',
        primaryBorderColor: '#6366f1',
        lineColor: '#818cf8',
        secondaryColor: '#1e1b4b',
        tertiaryColor: '#0f172a',
      },
    });
    window.mermaid.run({ querySelector: '.mermaid' });
  }

  /* ============================================================
     MAIN INIT
     ============================================================ */
  function init() {
    initScrollReveal();
    initProgressBar();
    initTypewriter();
    initCardEntrance();
    initKeyboardNav();
    initCopySparkle();
    initActiveSectionGlow();
    initMermaid();

    // Delay ripple to avoid interfering with link clicks
    setTimeout(initSynapseRipple, 1000);
    // Delay tooltip to avoid large DOM ops blocking paint
    setTimeout(initTooltips, 500);
  }

  // Material instant navigation re-fires
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-init after instant navigation
  document.addEventListener('DOMContentLoaded', init);
})();
