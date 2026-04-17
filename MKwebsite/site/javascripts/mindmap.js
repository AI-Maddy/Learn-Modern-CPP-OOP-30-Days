(function () {
  "use strict";

  // ── Tree data ────────────────────────────────────────────────────
  // payload.fold: 1 = start collapsed, 0 = start expanded
  var TREE = {
    content: "🎯 Modern C++ OOP",
    children: [
      {
        content: "🏗️ Foundations",
        payload: { fold: 0 },
        children: [
          {
            content: "⚙️ D00 — Setup",
            payload: { fold: 1 },
            children: [
              { content: "CMake & Ninja" },
              { content: "ASan / UBSan" },
              { content: "clang-tidy" }
            ]
          },
          {
            content: "📦 D01 — Types",
            payload: { fold: 1 },
            children: [
              { content: "constexpr / const" },
              { content: "Brace-init" },
              { content: "Structured bindings" }
            ]
          },
          {
            content: "🔧 D02 — Functions",
            payload: { fold: 1 },
            children: [
              { content: "Pass by value/ref" },
              { content: "Lambda captures" },
              { content: "[[nodiscard]]" }
            ]
          },
          {
            content: "🏛️ D03 — Classes",
            payload: { fold: 1 },
            children: [
              { content: "Encapsulation" },
              { content: "const-correctness" },
              { content: "explicit / friend" }
            ]
          },
          {
            content: "🔒 D04 — RAII",
            payload: { fold: 1 },
            children: [
              { content: "Ctor delegation" },
              { content: "Destructor rules" },
              { content: "Exception safety" }
            ]
          },
          {
            content: "📍 D05 — Ownership",
            payload: { fold: 1 },
            children: [
              { content: "unique_ptr" },
              { content: "shared_ptr" },
              { content: "weak_ptr" }
            ]
          },
          {
            content: "🌿 D06 — Inheritance",
            payload: { fold: 1 },
            children: [
              { content: "vtable & slicing" },
              { content: "override / final" },
              { content: "LSP" }
            ]
          }
        ]
      },
      {
        content: "🧩 Generic Programming",
        payload: { fold: 0 },
        children: [
          {
            content: "🎭 D07 — Virtual",
            payload: { fold: 1 },
            children: [
              { content: "Pure virtual" },
              { content: "NVI idiom" },
              { content: "Covariant return" }
            ]
          },
          {
            content: "🔗 D08 — Adv OOP",
            payload: { fold: 1 },
            children: [
              { content: "CRTP mixin" },
              { content: "Strategy pattern" },
              { content: "Value semantics" }
            ]
          },
          {
            content: "📐 D09 — Templates",
            payload: { fold: 1 },
            children: [
              { content: "Type deduction" },
              { content: "CTAD" },
              { content: "Variadics" }
            ]
          },
          {
            content: "💡 D10 — Concepts",
            payload: { fold: 1 },
            children: [
              { content: "requires clause" },
              { content: "Named concepts" },
              { content: "Subsumption" }
            ]
          },
          {
            content: "🔄 D11 — Generic OOP",
            payload: { fold: 1 },
            children: [
              { content: "Policy-based" },
              { content: "Compile-time poly" },
              { content: "Template method" }
            ]
          },
          {
            content: "🌊 D12 — Ranges",
            payload: { fold: 1 },
            children: [
              { content: "Lazy views" },
              { content: "Pipe syntax" },
              { content: "Custom adaptors" }
            ]
          },
          {
            content: "⚡ D13 — Move",
            payload: { fold: 1 },
            children: [
              { content: "Value categories" },
              { content: "std::move" },
              { content: "Perfect forward" }
            ]
          }
        ]
      },
      {
        content: "🛡️ Robust Design",
        payload: { fold: 0 },
        children: [
          {
            content: "5️⃣ D14 — Rule of 5",
            payload: { fold: 1 },
            children: [
              { content: "Rule of Zero" },
              { content: "Copy-and-swap" },
              { content: "=default/=delete" }
            ]
          },
          {
            content: "❌ D15 — Errors",
            payload: { fold: 1 },
            children: [
              { content: "std::expected" },
              { content: "Monadic ops" },
              { content: "noexcept" }
            ]
          },
          {
            content: "📦 D16 — Modules",
            payload: { fold: 1 },
            children: [
              { content: "Interface units" },
              { content: "Partitions" },
              { content: "import std" }
            ]
          },
          {
            content: "🏭 D17 — Patterns",
            payload: { fold: 1 },
            children: [
              { content: "Factory / Observer" },
              { content: "Strategy" },
              { content: "Command" }
            ]
          },
          {
            content: "✅ D18 — SOLID",
            payload: { fold: 1 },
            children: [
              { content: "SRP / OCP" },
              { content: "LSP / ISP" },
              { content: "DIP" }
            ]
          },
          {
            content: "🧪 D19 — Testing",
            payload: { fold: 1 },
            children: [
              { content: "Catch2 TDD" },
              { content: "TEST_CASE / SECTION" },
              { content: "Test doubles" }
            ]
          },
          {
            content: "📊 D20 — CRTP",
            payload: { fold: 1 },
            children: [
              { content: "Static interface" },
              { content: "Mixin chaining" },
              { content: "Devirtualise" }
            ]
          }
        ]
      },
      {
        content: "🚀 Advanced & Projects",
        payload: { fold: 0 },
        children: [
          {
            content: "🪆 D21 — pImpl",
            payload: { fold: 1 },
            children: [
              { content: "ABI firewall" },
              { content: "std::function" },
              { content: "Type erasure" }
            ]
          },
          {
            content: "⚡ D22 — Perf",
            payload: { fold: 1 },
            children: [
              { content: "SoA vs AoS" },
              { content: "SBO / RVO" },
              { content: "[[likely]]" }
            ]
          },
          {
            content: "🔮 D23 — C++26",
            payload: { fold: 1 },
            children: [
              { content: "Reflection" },
              { content: "Pattern match" },
              { content: "std::execution" }
            ]
          },
          {
            content: "🏦 D24 — Bank",
            payload: { fold: 1 },
            children: [
              { content: "RAII logs" },
              { content: "Polymorphic wd" },
              { content: "Factory" }
            ]
          },
          {
            content: "🎨 D25 — Shapes",
            payload: { fold: 1 },
            children: [
              { content: "Visitor pattern" },
              { content: "std::variant" },
              { content: "std::ranges" }
            ]
          },
          {
            content: "🎮 D26 — Game ECS",
            payload: { fold: 1 },
            children: [
              { content: "Entity-Component" },
              { content: "Event bus" },
              { content: "Spatial partition" }
            ]
          },
          {
            content: "🔄 D27 — Refactor",
            payload: { fold: 1 },
            children: [
              { content: "Strangler fig" },
              { content: "Code smells" },
              { content: "clang-tidy" }
            ]
          },
          {
            content: "🔍 D28 — Review",
            payload: { fold: 1 },
            children: [
              { content: "Anti-patterns" },
              { content: "Review checklist" },
              { content: "clang-tidy" }
            ]
          },
          {
            content: "🌊 D29 — Deep Dive",
            payload: { fold: 1 },
            children: [
              { content: "Coroutines" },
              { content: "std::pmr" },
              { content: "consteval" }
            ]
          },
          {
            content: "🎓 D30 — Review",
            payload: { fold: 1 },
            children: [
              { content: "Self-assessment" },
              { content: "Capstone project" },
              { content: "Next steps" }
            ]
          }
        ]
      }
    ]
  };

  // ── Week branch colour palette ───────────────────────────────────
  // Keyed by top-level branch index (0-3)
  var BRANCH_COLORS = ["#3949ab", "#00695c", "#e65100", "#6a1b9a"];

  function colorFn(node) {
    // Walk up to find the top-level ancestor and use its color
    var d = node;
    while (d.parent && d.parent.parent) {
      d = d.parent;
    }
    if (!d.parent) return "#455a64"; // root
    var idx = d.parent.children ? d.parent.children.indexOf(d) : 0;
    return BRANCH_COLORS[idx % BRANCH_COLORS.length];
  }

  // ── Init ─────────────────────────────────────────────────────────
  function init() {
    var container = document.getElementById("mm-container");
    if (!container) return;
    if (container.dataset.mmInit) return; // already rendered
    container.dataset.mmInit = "1";

    if (!window.markmap || !window.markmap.Markmap) {
      console.warn("markmap not loaded");
      return;
    }

    var svg = container.querySelector("svg");
    if (!svg) return;

    var mm = window.markmap.Markmap.create(svg, {
      duration: 400,
      maxWidth: 200,
      color: colorFn,
      paddingX: 16,
      zoom: true,
      pan: true
    }, TREE);

    // Fit on first render
    setTimeout(function () { mm.fit(); }, 100);
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
