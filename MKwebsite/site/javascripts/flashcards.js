(function () {
  "use strict";

  // ── Parse rendered markdown into day/card data ─────────────────
  function parseCards(content) {
    const days = [];
    let day = null;
    let pendingQ = null;

    for (const el of Array.from(content.children)) {
      const tag = el.tagName;

      if (tag === "H1") continue;

      if (tag === "H2") {
        day = { title: el.textContent.trim(), cards: [] };
        days.push(day);
        pendingQ = null;
        continue;
      }

      if (tag === "P" && day) {
        const strong = el.querySelector("strong");
        if (!strong) continue;

        const label = strong.textContent.trim();

        if (label === "Q:") {
          // Grab text after the <strong> tag
          pendingQ = el.textContent.replace(/^Q:\s*/, "").trim();
          // Preserve any inline code formatting from innerHTML
          pendingQ = el.innerHTML.replace(/^<strong>Q:<\/strong>\s*/, "").trim();
        } else if (label === "A:" && pendingQ !== null) {
          const answer = el.innerHTML
            .replace(/^<strong>A:<\/strong>\s*/, "")
            .trim();
          day.cards.push({ q: pendingQ, a: answer });
          pendingQ = null;
        }
      }
    }

    return days;
  }

  // ── Build the interactive deck UI ─────────────────────────────
  function buildUI(days) {
    const app = document.createElement("div");
    app.className = "fc-app";

    // ── Day tabs ────────────────────────────────────────────────
    const tabStrip = document.createElement("div");
    tabStrip.className = "fc-day-tabs";

    days.forEach((day, i) => {
      const btn = document.createElement("button");
      btn.className = "fc-day-tab" + (i === 0 ? " fc-active" : "");
      // "Day 03: Classes and Encapsulation" → "Day 03"
      btn.textContent = day.title.replace(/:.*$/, "").trim();
      btn.title = day.title;
      btn.dataset.idx = i;
      tabStrip.appendChild(btn);
    });

    // ── Day title label ─────────────────────────────────────────
    const dayTitle = document.createElement("div");
    dayTitle.className = "fc-day-title";

    // ── Card stage ──────────────────────────────────────────────
    const stage = document.createElement("div");
    stage.className = "fc-stage";

    const card = document.createElement("div");
    card.className = "fc-card";

    const front = document.createElement("div");
    front.className = "fc-face fc-front";

    const back = document.createElement("div");
    back.className = "fc-face fc-back";

    card.append(front, back);
    stage.appendChild(card);

    // ── Controls ────────────────────────────────────────────────
    const controls = document.createElement("div");
    controls.className = "fc-controls";

    const btnPrev = mkBtn("◀ Prev");
    const progress = document.createElement("span");
    progress.className = "fc-progress";
    const btnFlip = mkBtn("Flip", true);
    const btnNext = mkBtn("Next ▶");

    controls.append(btnPrev, progress, btnFlip, btnNext);

    // ── Extras ──────────────────────────────────────────────────
    const extras = document.createElement("div");
    extras.className = "fc-extras";

    const btnShuffle = mkBtn("🔀 Shuffle");
    const btnReset = mkBtn("↺ Reset");

    extras.append(btnShuffle, btnReset);

    app.append(tabStrip, dayTitle, stage, controls, extras);

    // ── State ───────────────────────────────────────────────────
    let dayIdx = 0;
    let cardIdx = 0;
    let flipped = false;
    let order = [];

    function resetOrder(d) {
      order = Array.from({ length: days[d].cards.length }, (_, i) => i);
    }

    // ── Render current card ─────────────────────────────────────
    function render() {
      const day = days[dayIdx];
      const c = day.cards[order[cardIdx]];

      dayTitle.textContent = day.title;

      front.innerHTML =
        '<div class="fc-badge">Question</div>' +
        '<div class="fc-text">' + c.q + "</div>" +
        '<div class="fc-tap-hint">click to reveal answer</div>';

      back.innerHTML =
        '<div class="fc-badge">Answer</div>' +
        '<div class="fc-text">' + c.a + "</div>";

      progress.textContent = (cardIdx + 1) + " / " + order.length;
      btnPrev.disabled = cardIdx === 0;
      btnNext.disabled = cardIdx === order.length - 1;

      if (flipped) {
        card.classList.add("fc-flipped");
        btnFlip.textContent = "Unflip";
      } else {
        card.classList.remove("fc-flipped");
        btnFlip.textContent = "Flip";
      }
    }

    // ── Event handlers ──────────────────────────────────────────
    tabStrip.addEventListener("click", function (e) {
      const btn = e.target.closest(".fc-day-tab");
      if (!btn) return;
      const i = parseInt(btn.dataset.idx, 10);
      tabStrip
        .querySelectorAll(".fc-day-tab")
        .forEach((t) => t.classList.remove("fc-active"));
      btn.classList.add("fc-active");
      dayIdx = i;
      cardIdx = 0;
      flipped = false;
      resetOrder(i);
      render();
    });

    stage.addEventListener("click", function () {
      flipped = !flipped;
      render();
    });

    btnFlip.addEventListener("click", function (e) {
      e.stopPropagation(); // don't double-trigger stage click
      flipped = !flipped;
      render();
    });

    btnPrev.addEventListener("click", function () {
      if (cardIdx > 0) {
        cardIdx--;
        flipped = false;
        render();
      }
    });

    btnNext.addEventListener("click", function () {
      if (cardIdx < order.length - 1) {
        cardIdx++;
        flipped = false;
        render();
      }
    });

    btnShuffle.addEventListener("click", function () {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      cardIdx = 0;
      flipped = false;
      render();
    });

    btnReset.addEventListener("click", function () {
      resetOrder(dayIdx);
      cardIdx = 0;
      flipped = false;
      render();
    });

    resetOrder(0);
    render();
    return app;
  }

  // ── Helper: create a button ────────────────────────────────────
  function mkBtn(label, primary) {
    const b = document.createElement("button");
    b.className = "fc-btn" + (primary ? " fc-btn-primary" : "");
    b.textContent = label;
    return b;
  }

  // ── Init ───────────────────────────────────────────────────────
  function init() {
    const h1 = document.querySelector(".md-content h1");
    if (!h1 || !h1.textContent.includes("Flashcard")) return;

    const inner = document.querySelector(".md-content__inner");
    if (!inner) return;

    // Already initialised on this page?
    if (inner.querySelector(".fc-app")) return;

    const days = parseCards(inner);
    if (!days.length) return;

    // Hide the raw markdown-rendered content
    for (const el of Array.from(inner.children)) {
      el.classList.add("fc-hidden");
    }

    inner.prepend(buildUI(days));
  }

  // MkDocs Material uses RxJS document$ for instant navigation
  if (typeof document$ !== "undefined") {
    document$.subscribe(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
