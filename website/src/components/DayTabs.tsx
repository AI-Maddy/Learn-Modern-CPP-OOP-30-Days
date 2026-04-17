// ─────────────────────────────────────────────────────────────────────────────
// DayTabs.tsx  —  The interactive tabbed panel shown on every Day page.
//
// Four tabs:  Overview (readme)  |  Theory  |  Code  |  Pitfalls
// The user switches tabs by clicking buttons or pressing keys 1–4.
// Each day's colour cluster controls the accent colour used on the active tab.
// ─────────────────────────────────────────────────────────────────────────────

// useState: remember which tab is active between renders.
// useEffect: run side-effects (like attaching keyboard listeners) after render.
import { useState, useEffect } from "react";

// ReactMarkdown turns the Markdown strings (readme / theory / pitfalls) into
// React DOM nodes so they render as formatted HTML in the browser.
import ReactMarkdown from "react-markdown";

// Props defines the data this component expects from its parent (the day page).
interface Props {
  readme:       string; // Markdown text for the Overview tab (from README.rst)
  theory:       string; // Markdown text for the Theory tab   (from theory.rst)
  pitfalls:     string; // Markdown text for the Pitfalls tab (from pitfalls.rst)
  code:         string; // Raw C++ source code for the Code tab (from main.cpp)
  clusterColor: string; // Colour name, e.g. "blue" — drives the active-tab highlight
}

// ── COLOR_MAP ────────────────────────────────────────────────────────────────
// Maps each cluster colour name to four Tailwind class strings.
//  active : classes applied to the currently selected tab button
//  hover  : classes applied on mouse-over of an inactive tab
//  border : the border colour of inactive tab buttons
//  glow   : shadow colour that creates the lit-up glow on the active tab
//  top    : a raw CSS hex colour used for the accent bar and inline styles
const COLOR_MAP: Record<string, { active: string; hover: string; border: string; glow: string; top: string }> = {
  blue:   { active: "bg-blue-500/20 text-blue-300 border-blue-500/60",   hover: "hover:bg-blue-500/10 hover:text-blue-300",   border: "border-blue-500/25",   glow: "shadow-blue-500/20",   top: "#3b82f6" },
  green:  { active: "bg-green-500/20 text-green-300 border-green-500/60",  hover: "hover:bg-green-500/10 hover:text-green-300",  border: "border-green-500/25",  glow: "shadow-green-500/20",  top: "#22c55e" },
  violet: { active: "bg-violet-500/20 text-violet-300 border-violet-500/60", hover: "hover:bg-violet-500/10 hover:text-violet-300", border: "border-violet-500/25", glow: "shadow-violet-500/20", top: "#8b5cf6" },
  red:    { active: "bg-red-500/20 text-red-300 border-red-500/60",    hover: "hover:bg-red-500/10 hover:text-red-300",    border: "border-red-500/25",    glow: "shadow-red-500/20",    top: "#ef4444" },
  orange: { active: "bg-orange-500/20 text-orange-300 border-orange-500/60", hover: "hover:bg-orange-500/10 hover:text-orange-300", border: "border-orange-500/25", glow: "shadow-orange-500/20", top: "#f97316" },
  yellow: { active: "bg-yellow-500/20 text-yellow-300 border-yellow-500/60", hover: "hover:bg-yellow-500/10 hover:text-yellow-300", border: "border-yellow-500/25", glow: "shadow-yellow-500/20", top: "#eab308" },
  slate:  { active: "bg-slate-500/20 text-slate-300 border-slate-500/60",  hover: "hover:bg-slate-500/10 hover:text-slate-300",  border: "border-slate-500/25",  glow: "shadow-slate-500/20",  top: "#94a3b8" },
};

// ── TABS constant ────────────────────────────────────────────────────────────
// An array describing each tab: key (internal identifier), label (displayed
// text), icon (emoji), and hint (keyboard shortcut shown on the button).
// `as const` makes TypeScript treat these as literal types (not just strings)
// so TabKey below can be derived from them precisely.
const TABS = [
  { key: "overview",  label: "Overview",  icon: "📖", hint: "1" },
  { key: "theory",    label: "Theory",    icon: "🧠", hint: "2" },
  { key: "code",      label: "Code",      icon: "💻", hint: "3" },
  { key: "pitfalls",  label: "Pitfalls",  icon: "⚠️",  hint: "4" },
] as const;

// TabKey is a union type of the four literal key strings: "overview" | "theory" | "code" | "pitfalls".
// Derived from the TABS array so it updates automatically if we add/remove a tab.
type TabKey = typeof TABS[number]["key"];

// ── Syntax highlight: very basic keyword coloring for C++ ──────────────────
// highlightCpp takes a plain C++ source string and returns an HTML string
// with <span> elements wrapping known tokens.  This is a simple regex-based
// approach — not a full parser, but good enough for educational display.
function highlightCpp(code: string): string {
  // Long regex matching C++ keywords: control flow, types, qualifiers, STL names.
  const keywords = /\b(auto|const|constexpr|consteval|constinit|decltype|explicit|export|extern|final|friend|import|inline|module|mutable|namespace|noexcept|nullptr|operator|override|private|protected|public|register|requires|static|template|this|thread_local|typename|using|virtual|volatile|class|struct|enum|union|void|bool|int|long|short|char|float|double|unsigned|signed|return|if|else|for|while|do|switch|case|break|continue|try|catch|throw|new|delete|sizeof|alignof|static_cast|dynamic_cast|reinterpret_cast|const_cast|std|make_unique|make_shared|unique_ptr|shared_ptr|weak_ptr|vector|string|map|set|optional|variant|expected|span|string_view|cout|cin|endl)\b/g;
  const strings     = /(\"[^\"\\]*(?:\\.[^\"\\]*)*\")/g; // Double-quoted string literals
  const comments    = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g;  // // line comments and /* block */ comments
  const preprocessor = /(#[^\n]+)/g;                     // #include, #define, #pragma directives
  const numbers     = /\b(\d+(?:\.\d+)?(?:f|u|l|ul|ll|ull)?)\b/g; // Integer and float literals

  return code
    // Step 1: escape HTML special characters so <, >, & in the source code
    // are displayed as literal characters rather than interpreted as HTML tags.
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // Step 2: wrap token types in <span> elements.
    // ORDER MATTERS: comments are replaced first so a // inside a string doesn't
    // get mis-coloured, and preprocessor is next for the same reason.
    .replace(comments,    '<span class="cpp-comment">$1</span>')   // Grey italic comments
    .replace(preprocessor,'<span class="cpp-preproc">$1</span>')   // Blue preprocessor lines
    .replace(strings,     '<span class="cpp-string">$1</span>')    // Green string literals
    .replace(keywords,    '<span class="cpp-kw">$1</span>')        // Purple keywords
    .replace(numbers,     '<span class="cpp-num">$1</span>');      // Orange number literals
}

// ── CodeBlock ────────────────────────────────────────────────────────────────
// Renders the day's main.cpp with line numbers, syntax highlighting, and
// a "Copy" button.  The visual style mimics a code editor (traffic-light dots,
// dark background, monospace font).
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false); // Tracks copy-button feedback state

  const lines = code.split("\n");              // Split source into individual lines for line-number rendering
  const highlighted = highlightCpp(code);      // Convert plain code → HTML with <span> colour tags
  const highlightedLines = highlighted.split("\n"); // Keep as lines so they align with line numbers

  // copy() writes the original (un-highlighted) code to the clipboard
  const copy = () => {
    navigator.clipboard.writeText(code);      // Browser Clipboard API
    setCopied(true);                           // Show "✓ Copied!" label
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    // Card wrapper: rounded corners, dark border, large shadow for depth
    <div className="rounded-xl overflow-hidden border border-slate-700/40 shadow-xl shadow-black/40">
      {/* Traffic-light toolbar: mimics macOS window chrome to signal "this is a code editor" */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b27] border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          {/* Three coloured circles: red / yellow / green — purely decorative */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
          </div>
          {/* Filename and language badge shown next to the traffic lights */}
          <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
            <span className="text-blue-500">⚡</span> main.cpp
            {/* Small C++20 badge to tell the reader which standard this code uses */}
            <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">C++20</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Line count: gives the reader a quick sense of the code length */}
          <span className="text-[10px] text-slate-600 font-mono">{lines.length} lines</span>
          {/* Copy button: style switches to green confirmation after a click */}
          <button
            onClick={copy}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
              copied
                ? "bg-green-500/20 text-green-400 border border-green-500/40"  // "Copied" state
                : "text-slate-400 hover:text-white hover:bg-white/[0.08] border border-transparent" // Normal state
            }`}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Code body: line numbers on the left, highlighted code on the right */}
      <div className="flex bg-[#0d1117] overflow-x-auto">
        {/* Left column: line numbers.
            select-none prevents the user accidentally selecting numbers when
            they try to select and copy the code.  shrink-0 stops this column
            from being squeezed on narrow screens. */}
        <div className="select-none shrink-0 px-4 py-5 text-right text-slate-700 font-mono text-xs leading-7 border-r border-slate-800">
          {/* Render one <div> per line, showing the 1-based line number */}
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>  // key={i} is required by React for list items
          ))}
        </div>
        {/* Right column: the syntax-highlighted code.
            dangerouslySetInnerHTML is how React sets raw HTML strings.
            We use it here because highlightCpp() returns HTML with <span> tags.
            It is safe because the only HTML comes from our own highlightCpp function. */}
        <pre className="flex-1 p-5 text-sm font-mono leading-7 overflow-x-auto">
          <code
            className="text-slate-200"
            dangerouslySetInnerHTML={{ __html: highlightedLines.join("\n") }}
          />
        </pre>
      </div>

      {/* Inline CSS for the syntax-colouring span classes injected by highlightCpp().
          A <style> tag inside JSX is valid and scopes these colours to this component. */}
      <style>{`
        .cpp-kw     { color: #c792ea; font-weight: 600; }   /* Purple for keywords */
        .cpp-string { color: #c3e88d; }                     /* Green for string literals */
        .cpp-comment{ color: #4a5568; font-style: italic; } /* Dark grey italic for comments */
        .cpp-preproc{ color: #82aaff; }                     /* Blue for preprocessor directives */
        .cpp-num    { color: #f78c6c; }                     /* Orange for numbers */
      `}</style>
    </div>
  );
}

// ── MarkdownContent ──────────────────────────────────────────────────────────
// Renders any Markdown string (readme, theory) with a full set of custom
// styled components.  `accentColor` is a CSS hex string passed in as an inline
// style so each cluster can have a differently-coloured heading left-border.
function MarkdownContent({ md, accentColor }: { md: string; accentColor: string }) {
  // Guard: if the Markdown string is empty or whitespace-only, show a placeholder
  if (!md || md.trim() === "") {
    return <p className="text-slate-500 italic">No content available.</p>;
  }
  return (
    // prose prose-invert: Tailwind Typography plugin base styles for dark theme.
    // The --accent CSS custom property is consumed by the h2 left-border style below.
    <div className="prose prose-invert prose-sm max-w-none" style={{ "--accent": accentColor } as React.CSSProperties}>
      <ReactMarkdown
        components={{
          // code: inline backtick code vs fenced (block) code blocks
          code({ className, children, ...props }) {
            const isBlock = className?.includes("language-"); // Block code has a language class
            if (isBlock) {
              const raw = String(children).replace(/\n$/, ""); // Strip trailing newline
              return (
                // Block code: card with a language label header and highlighted body
                <div className="rounded-xl overflow-hidden border border-slate-700/40 my-4">
                  <div className="px-4 py-2 bg-[#161b27] border-b border-slate-700/50 text-xs text-slate-500 font-mono">
                    {/* Show the detected language or fall back to "cpp" */}
                    {className?.replace("language-", "") || "cpp"}
                  </div>
                  <pre className="bg-[#0d1117] p-4 overflow-x-auto">
                    {/* Use dangerouslySetInnerHTML to inject our syntax-highlighted HTML */}
                    <code
                      className="text-sm text-slate-200 font-mono leading-7"
                      dangerouslySetInnerHTML={{ __html: highlightCpp(raw) }}
                    />
                  </pre>
                  {/* Inject syntax colour CSS directly here so it applies inside the prose container */}
                  <style>{`.cpp-kw{color:#c792ea;font-weight:600}.cpp-string{color:#c3e88d}.cpp-comment{color:#4a5568;font-style:italic}.cpp-preproc{color:#82aaff}.cpp-num{color:#f78c6c}`}</style>
                </div>
              );
            }
            // Inline code: small coloured pill, no copy button
            return (
              <code className="bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono border border-indigo-500/20" {...props}>
                {children}
              </code>
            );
          },
          // Heading levels: each has distinct size and weight for hierarchy
          h1: ({ children }) => <h1 className="text-2xl font-extrabold text-white mt-6 mb-3">{children}</h1>,
          h2: ({ children }) => (
            // The left border uses `accentColor` as an inline style so it matches
            // the cluster colour (blue for foundations, red for memory, etc.).
            <h2 className="text-base font-bold text-slate-100 mt-6 mb-3 pb-2 border-b border-slate-800 pl-3" style={{ borderLeft: `3px solid ${accentColor}` }}>
              {children}
            </h2>
          ),
          // h3 is styled as an ALL-CAPS label — a subtle visual cue
          h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-400 mt-4 mb-2 uppercase tracking-wider">{children}</h3>,
          p:  ({ children }) => <p className="text-slate-300 leading-relaxed mb-3 text-sm">{children}</p>,
          ul: ({ children }) => <ul className="space-y-1.5 mb-3 pl-0">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-3 text-slate-300">{children}</ol>,
          // List items: small blue arrow bullet replaces the browser default disc
          li: ({ children }) => (
            <li className="text-slate-300 text-sm flex gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0 text-xs">▸</span>
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
          em:     ({ children }) => <em className="text-sky-400 not-italic">{children}</em>, // italic → sky blue
          // Blockquote: coloured left-border using accentColor, semi-transparent background
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 pl-4 py-2 my-3 text-slate-400 rounded-r-lg"
              style={{ borderColor: accentColor, background: `color-mix(in srgb, ${accentColor} 5%, transparent)` }}>
              {children}
            </blockquote>
          ),
          // Table: wrapped in an overflow div so wide tables get a scrollbar instead of breaking layout
          table: ({ children }) => <div className="overflow-x-auto my-4"><table className="w-full text-xs border-collapse">{children}</table></div>,
          thead: ({ children }) => <thead className="bg-white/[0.04]">{children}</thead>,
          th:    ({ children }) => <th className="px-3 py-2 text-left text-slate-400 font-semibold border border-slate-800">{children}</th>,
          td:    ({ children }) => <td className="px-3 py-2 text-slate-300 border border-slate-800">{children}</td>,
          hr:    () => <hr className="border-slate-800 my-5" />,
        }}
      >
        {md} {/* The Markdown string to be parsed */}
      </ReactMarkdown>
    </div>
  );
}

// ── PitfallsContent ──────────────────────────────────────────────────────────
// Wraps MarkdownContent with an amber warning banner at the top to signal
// that this tab contains anti-patterns and mistakes to avoid.
function PitfallsContent({ md, accentColor }: { md: string; accentColor: string }) {
  if (!md || md.trim() === "") {
    return <p className="text-slate-500 italic">No pitfalls documented.</p>;
  }
  return (
    <div>
      {/* Warning banner: amber colour signals "caution / danger" to the reader */}
      <div className="flex items-start gap-3 p-4 mb-5 rounded-xl bg-amber-500/8 border border-amber-500/25">
        <span className="text-xl mt-0.5 shrink-0">⚠️</span>
        <div>
          <div className="font-semibold text-amber-300 mb-0.5 text-sm">Common Pitfalls & Anti-Patterns</div>
          <div className="text-xs text-amber-400/70 leading-relaxed">Study what breaks before you write it wrong — curated mistakes specific to this topic.</div>
        </div>
      </div>
      {/* Reuse MarkdownContent for the actual pitfalls text, amber accent colour */}
      <MarkdownContent md={md} accentColor="#f59e0b" />
    </div>
  );
}

// ── DayTabs (main export) ────────────────────────────────────────────────────
// The parent component that renders the tab bar and conditionally shows the
// correct panel based on which tab is active.
export default function DayTabs({ readme, theory, pitfalls, code, clusterColor }: Props) {
  // active: tracks which tab key is currently selected.  Default = "overview".
  const [active, setActive] = useState<TabKey>("overview");

  // c: the colour-map entry for this day's cluster (buttons, glows, borders).
  // Falls back to slate if an unknown colour name is provided.
  const c = COLOR_MAP[clusterColor] ?? COLOR_MAP.slate;

  // ── Keyboard shortcuts: keys 1–4 switch tabs ──────────────────────────────
  // useEffect runs AFTER the component renders.  The empty [] dependency array
  // means it runs only once (on mount) and cleans up on unmount.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore keypresses that happen inside text inputs (the user is typing, not navigating)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Convert key "1"–"4" to 0-based index 0–3
      const idx = parseInt(e.key) - 1;
      // Only switch if the index falls within the valid TABS range
      if (idx >= 0 && idx < TABS.length) {
        setActive(TABS[idx].key); // Switch to the corresponding tab
      }
    };
    window.addEventListener("keydown", handler);   // Attach the listener globally
    // Cleanup: remove the listener when this component is unmounted.
    // Without cleanup, old listeners would pile up and cause memory leaks.
    return () => window.removeEventListener("keydown", handler);
  }, []); // [] means "run once after first render, clean up on unmount"

  return (
    <div>
      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      {/* The container uses a dark background and rounded corners to look like
          a pill-shaped button group. overflow-x-auto handles very narrow screens. */}
      <div className="flex gap-1 mb-6 p-1.5 bg-[#0e1320] rounded-xl border border-white/[0.06] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}                        // Required React key for list items
            onClick={() => setActive(tab.key)}   // Switch to this tab on click
            className={`flex-1 min-w-max px-3 py-2 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${
              active === tab.key
                ? `${c.active} border-current shadow-lg ${c.glow}` // Active: bright + glowing
                : `text-slate-600 border-transparent ${c.hover} hover:border-white/10` // Inactive: muted
            }`}
          >
            <span>{tab.icon}</span>
            {/* hidden sm:inline: hide label on very small screens to save space */}
            <span className="hidden sm:inline">{tab.label}</span>
            {/* Keyboard hint badge: shown only on large screens (hidden lg:inline) */}
            <span className="hidden lg:inline ml-1 text-[9px] font-mono opacity-40 bg-white/10 px-1 rounded">
              {tab.hint}
            </span>
          </button>
        ))}
      </div>

      {/* Small reminder text that keyboard shortcuts work */}
      <div className="text-[10px] text-slate-700 text-right mb-4 font-mono">
        Press 1–4 to switch tabs
      </div>

      {/* ── Tab panels ───────────────────────────────────────────────────── */}
      <div className="animate-slide-in">
        {/* Conditionally render only the active panel — React evaluates boolean
            expressions left to right and renders nothing for `false`. */}
        {active === "overview"  && <MarkdownContent md={readme}   accentColor={c.top} />}
        {active === "theory"    && <MarkdownContent md={theory}   accentColor={c.top} />}
        {active === "code"      && <CodeBlock code={code} />}
        {active === "pitfalls"  && <PitfallsContent md={pitfalls} accentColor={c.top} />}
      </div>
    </div>
  );
}
