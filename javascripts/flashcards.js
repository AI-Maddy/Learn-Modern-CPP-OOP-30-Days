/**
 * flashcards.js
 * Powers 3D flip flashcards, confidence rating, and quiz blocks.
 * Memory system: Hippocampus simulation via spaced repetition tracking.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cpp-brain-flashcards';

  /* ============================================================
     LOAD / SAVE confidence scores from localStorage
     ============================================================ */
  function loadScores() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveScore(cardId, level) {
    const scores = loadScores();
    scores[cardId] = { level, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  }

  /* ============================================================
     FLASHCARD FLIP (3D)
     ============================================================ */
  function initFlashcards() {
    document.querySelectorAll('.flashcard').forEach((card, idx) => {
      card.dataset.cardId = card.dataset.cardId || `card-${idx}`;

      // Click to flip
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('confidence-dot')) return;
        card.classList.toggle('flipped');
      });

      // Confidence dots
      const scores = loadScores();
      const saved  = scores[card.dataset.cardId];
      card.querySelectorAll('.confidence-dot').forEach(dot => {
        const level = parseInt(dot.dataset.level, 10);
        if (saved && saved.level === level) dot.classList.add('active');

        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          card.querySelectorAll('.confidence-dot').forEach(d => d.classList.remove('active'));
          dot.classList.add('active');
          saveScore(card.dataset.cardId, level);
          // Brief spark feedback
          dot.style.transform = 'scale(1.5)';
          setTimeout(() => { dot.style.transform = ''; }, 200);
        });
      });
    });
  }

  /* ============================================================
     DETAILS/SUMMARY — Enhanced collapsible Q&A
     ============================================================ */
  function initCollapsibleQA() {
    document.querySelectorAll('details.flashcard-qa').forEach(det => {
      det.addEventListener('toggle', () => {
        if (det.open) {
          det.style.borderColor = 'rgba(139,92,246,0.5)';
        } else {
          det.style.borderColor = '';
        }
      });
    });
  }

  /* ============================================================
     QUIZ BLOCKS — Multiple choice
     ============================================================ */
  function initQuizBlocks() {
    document.querySelectorAll('.quiz-block').forEach(quiz => {
      const correct = quiz.dataset.answer;
      const opts    = quiz.querySelectorAll('.quiz-option');
      const expl    = quiz.querySelector('.quiz-explanation');
      let answered  = false;

      opts.forEach(opt => {
        opt.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          opts.forEach(o => {
            if (o.dataset.value === correct) {
              o.classList.add('correct');
            } else if (o === opt && o.dataset.value !== correct) {
              o.classList.add('wrong');
            }
          });
          if (expl) expl.classList.add('visible');
        });
      });
    });
  }

  /* ============================================================
     STUDY MODE — Full-screen sequential card review
     ============================================================ */
  function initStudyMode() {
    const btn = document.getElementById('study-mode-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const cards  = Array.from(document.querySelectorAll('.flashcard'));
      if (!cards.length) return;

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(7,10,20,0.97);
        z-index: 10000;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        font-family: 'Inter', sans-serif;
      `;

      let idx = 0;

      function showCard(i) {
        const card = cards[i];
        const q = card.querySelector('.flashcard-q')?.textContent || '';
        const a = card.querySelector('.flashcard-a')?.textContent || '';

        overlay.innerHTML = `
          <div style="max-width:560px;width:100%;padding:2rem">
            <div style="text-align:center;color:rgba(255,255,255,0.3);font-size:0.75rem;margin-bottom:1rem;">
              ${i + 1} / ${cards.length}
            </div>
            <div id="study-card" style="
              background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);
              border-radius:1rem;padding:2rem;min-height:160px;
              display:flex;flex-direction:column;justify-content:center;cursor:pointer;
              text-align:center;transition:all 0.4s;
            ">
              <div style="color:#c4b5fd;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.75rem;">Question</div>
              <div id="study-text" style="font-size:1.1rem;font-weight:600;color:#e2e8f0;">${q}</div>
            </div>
            <div style="margin-top:1.5rem;display:flex;gap:0.75rem;justify-content:center;">
              <button id="study-reveal" style="
                background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);
                color:#c4b5fd;border-radius:0.5rem;padding:0.5rem 1.25rem;cursor:pointer;
                font-size:0.85rem;font-weight:600;
              ">Reveal Answer</button>
              <button id="study-next" style="
                background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);
                color:#6ee7b7;border-radius:0.5rem;padding:0.5rem 1.25rem;cursor:pointer;
                font-size:0.85rem;font-weight:600;display:none;
              ">Next →</button>
              <button id="study-exit" style="
                background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
                color:rgba(255,255,255,0.4);border-radius:0.5rem;padding:0.5rem 1rem;cursor:pointer;
                font-size:0.85rem;
              ">✕ Exit</button>
            </div>
          </div>
        `;

        overlay.querySelector('#study-reveal').addEventListener('click', () => {
          overlay.querySelector('#study-text').innerHTML =
            `<div style="color:#6ee7b7;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;">Answer</div>${a}`;
          overlay.querySelector('#study-reveal').style.display = 'none';
          overlay.querySelector('#study-next').style.display   = 'block';
        });

        overlay.querySelector('#study-next').addEventListener('click', () => {
          idx++;
          if (idx < cards.length) { showCard(idx); }
          else {
            overlay.querySelector('#study-text').textContent = '🎉 All cards reviewed!';
          }
        });

        overlay.querySelector('#study-exit').addEventListener('click', () => {
          overlay.remove();
        });
      }

      showCard(0);
      document.body.appendChild(overlay);
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    initFlashcards();
    initCollapsibleQA();
    initQuizBlocks();
    initStudyMode();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
