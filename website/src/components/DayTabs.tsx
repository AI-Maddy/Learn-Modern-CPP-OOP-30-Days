import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Props {
  readme: string;
  theory: string;
  pitfalls: string;
  code: string;
  clusterColor: string;
}

const COLOR_MAP: Record<string, { active: string; hover: string; border: string; glow: string; top: string }> = {
  blue:   { active: "bg-blue-500/20 text-blue-300 border-blue-500/60",   hover: "hover:bg-blue-500/10 hover:text-blue-300",   border: "border-blue-500/25", glow: "shadow-blue-500/20",   top: "#3b82f6" },
  green:  { active: "bg-green-500/20 text-green-300 border-green-500/60",  hover: "hover:bg-green-500/10 hover:text-green-300",  border: "border-green-500/25", glow: "shadow-green-500/20",  top: "#22c55e" },
  violet: { active: "bg-violet-500/20 text-violet-300 border-violet-500/60", hover: "hover:bg-violet-500/10 hover:text-violet-300", border: "border-violet-500/25", glow: "shadow-violet-500/20", top: "#8b5cf6" },
  red:    { active: "bg-red-500/20 text-red-300 border-red-500/60",    hover: "hover:bg-red-500/10 hover:text-red-300",    border: "border-red-500/25", glow: "shadow-red-500/20",    top: "#ef4444" },
  orange: { active: "bg-orange-500/20 text-orange-300 border-orange-500/60", hover: "hover:bg-orange-500/10 hover:text-orange-300", border: "border-orange-500/25", glow: "shadow-orange-500/20", top: "#f97316" },
  yellow: { active: "bg-yellow-500/20 text-yellow-300 border-yellow-500/60", hover: "hover:bg-yellow-500/10 hover:text-yellow-300", border: "border-yellow-500/25", glow: "shadow-yellow-500/20", top: "#eab308" },
  slate:  { active: "bg-slate-500/20 text-slate-300 border-slate-500/60",  hover: "hover:bg-slate-500/10 hover:text-slate-300",  border: "border-slate-500/25", glow: "shadow-slate-500/20",  top: "#94a3b8" },
};

const TABS = [
  { key: "overview",  label: "Overview",  icon: "📖", hint: "1" },
  { key: "theory",    label: "Theory",    icon: "🧠", hint: "2" },
  { key: "code",      label: "Code",      icon: "💻", hint: "3" },
  { key: "pitfalls",  label: "Pitfalls",  icon: "⚠️",  hint: "4" },
] as const;
type TabKey = typeof TABS[number]["key"];

// ── Syntax highlight: very basic keyword coloring for C++ ──────────────────
function highlightCpp(code: string): string {
  const keywords = /\b(auto|const|constexpr|consteval|constinit|decltype|explicit|export|extern|final|friend|import|inline|module|mutable|namespace|noexcept|nullptr|operator|override|private|protected|public|register|requires|static|template|this|thread_local|typename|using|virtual|volatile|class|struct|enum|union|void|bool|int|long|short|char|float|double|unsigned|signed|return|if|else|for|while|do|switch|case|break|continue|try|catch|throw|new|delete|sizeof|alignof|static_cast|dynamic_cast|reinterpret_cast|const_cast|std|make_unique|make_shared|unique_ptr|shared_ptr|weak_ptr|vector|string|map|set|optional|variant|expected|span|string_view|cout|cin|endl)\b/g;
  const strings = /(\"[^\"\\]*(?:\\.[^\"\\]*)*\")/g;
  const comments = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g;
  const preprocessor = /(#[^\n]+)/g;
  const numbers = /\b(\d+(?:\.\d+)?(?:f|u|l|ul|ll|ull)?)\b/g;

  return code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // order matters: comments first so they don't get re-colored
    .replace(comments, '<span class="cpp-comment">$1</span>')
    .replace(preprocessor, '<span class="cpp-preproc">$1</span>')
    .replace(strings, '<span class="cpp-string">$1</span>')
    .replace(keywords, '<span class="cpp-kw">$1</span>')
    .replace(numbers, '<span class="cpp-num">$1</span>');
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");
  const highlighted = highlightCpp(code);
  const highlightedLines = highlighted.split("\n");

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/40 shadow-xl shadow-black/40">
      {/* Traffic-light toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b27] border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
          </div>
          <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
            <span className="text-blue-500">⚡</span> main.cpp
            <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">C++20</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 font-mono">{lines.length} lines</span>
          <button
            onClick={copy}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
              copied
                ? "bg-green-500/20 text-green-400 border border-green-500/40"
                : "text-slate-400 hover:text-white hover:bg-white/[0.08] border border-transparent"
            }`}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Code with line numbers */}
      <div className="flex bg-[#0d1117] overflow-x-auto">
        {/* Line numbers */}
        <div className="select-none shrink-0 px-4 py-5 text-right text-slate-700 font-mono text-xs leading-7 border-r border-slate-800">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {/* Code */}
        <pre className="flex-1 p-5 text-sm font-mono leading-7 overflow-x-auto">
          <code
            className="text-slate-200"
            dangerouslySetInnerHTML={{ __html: highlightedLines.join("\n") }}
          />
        </pre>
      </div>

      {/* CSS for syntax coloring — injected via style tag */}
      <style>{`
        .cpp-kw    { color: #c792ea; font-weight: 600; }
        .cpp-string { color: #c3e88d; }
        .cpp-comment { color: #4a5568; font-style: italic; }
        .cpp-preproc { color: #82aaff; }
        .cpp-num   { color: #f78c6c; }
      `}</style>
    </div>
  );
}

function MarkdownContent({ md, accentColor }: { md: string; accentColor: string }) {
  if (!md || md.trim() === "") {
    return <p className="text-slate-500 italic">No content available.</p>;
  }
  return (
    <div className="prose prose-invert prose-sm max-w-none" style={{ "--accent": accentColor } as React.CSSProperties}>
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              const raw = String(children).replace(/\n$/, "");
              return (
                <div className="rounded-xl overflow-hidden border border-slate-700/40 my-4">
                  <div className="px-4 py-2 bg-[#161b27] border-b border-slate-700/50 text-xs text-slate-500 font-mono">
                    {className?.replace("language-", "") || "cpp"}
                  </div>
                  <pre className="bg-[#0d1117] p-4 overflow-x-auto">
                    <code
                      className="text-sm text-slate-200 font-mono leading-7"
                      dangerouslySetInnerHTML={{ __html: highlightCpp(raw) }}
                    />
                  </pre>
                  <style>{`.cpp-kw{color:#c792ea;font-weight:600}.cpp-string{color:#c3e88d}.cpp-comment{color:#4a5568;font-style:italic}.cpp-preproc{color:#82aaff}.cpp-num{color:#f78c6c}`}</style>
                </div>
              );
            }
            return (
              <code className="bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono border border-indigo-500/20" {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children }) => <h1 className="text-2xl font-extrabold text-white mt-6 mb-3">{children}</h1>,
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-slate-100 mt-6 mb-3 pb-2 border-b border-slate-800 pl-3" style={{ borderLeft: `3px solid ${accentColor}` }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-400 mt-4 mb-2 uppercase tracking-wider">{children}</h3>,
          p:  ({ children }) => <p className="text-slate-300 leading-relaxed mb-3 text-sm">{children}</p>,
          ul: ({ children }) => <ul className="space-y-1.5 mb-3 pl-0">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-3 text-slate-300">{children}</ol>,
          li: ({ children }) => (
            <li className="text-slate-300 text-sm flex gap-2">
              <span className="text-blue-500 mt-0.5 shrink-0 text-xs">▸</span>
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-sky-400 not-italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 pl-4 py-2 my-3 text-slate-400 rounded-r-lg" style={{ borderColor: accentColor, background: `color-mix(in srgb, ${accentColor} 5%, transparent)` }}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => <div className="overflow-x-auto my-4"><table className="w-full text-xs border-collapse">{children}</table></div>,
          thead: ({ children }) => <thead className="bg-white/[0.04]">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 text-left text-slate-400 font-semibold border border-slate-800">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-slate-300 border border-slate-800">{children}</td>,
          hr: () => <hr className="border-slate-800 my-5" />,
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}

function PitfallsContent({ md, accentColor }: { md: string; accentColor: string }) {
  if (!md || md.trim() === "") {
    return <p className="text-slate-500 italic">No pitfalls documented.</p>;
  }
  return (
    <div>
      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 mb-5 rounded-xl bg-amber-500/8 border border-amber-500/25">
        <span className="text-xl mt-0.5 shrink-0">⚠️</span>
        <div>
          <div className="font-semibold text-amber-300 mb-0.5 text-sm">Common Pitfalls & Anti-Patterns</div>
          <div className="text-xs text-amber-400/70 leading-relaxed">Study what breaks before you write it wrong — curated mistakes specific to this topic.</div>
        </div>
      </div>
      <MarkdownContent md={md} accentColor="#f59e0b" />
    </div>
  );
}

export default function DayTabs({ readme, theory, pitfalls, code, clusterColor }: Props) {
  const [active, setActive] = useState<TabKey>("overview");
  const c = COLOR_MAP[clusterColor] ?? COLOR_MAP.slate;

  // Keyboard shortcuts: 1-4 switch tabs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < TABS.length) {
        setActive(TABS[idx].key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1.5 bg-[#0e1320] rounded-xl border border-white/[0.06] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-1 min-w-max px-3 py-2 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 ${
              active === tab.key
                ? `${c.active} border-current shadow-lg ${c.glow}`
                : `text-slate-600 border-transparent ${c.hover} hover:border-white/10`
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="hidden lg:inline ml-1 text-[9px] font-mono opacity-40 bg-white/10 px-1 rounded">
              {tab.hint}
            </span>
          </button>
        ))}
      </div>

      {/* Keyboard hint */}
      <div className="text-[10px] text-slate-700 text-right mb-4 font-mono">
        Press 1–4 to switch tabs
      </div>

      {/* Tab panels */}
      <div key={active} className="animate-slide-in">
        {active === "overview"  && <MarkdownContent md={readme}   accentColor={c.top} />}
        {active === "theory"    && <MarkdownContent md={theory}   accentColor={c.top} />}
        {active === "code"      && <CodeBlock code={code} />}
        {active === "pitfalls"  && <PitfallsContent md={pitfalls} accentColor={c.top} />}
      </div>
    </div>
  );
}
