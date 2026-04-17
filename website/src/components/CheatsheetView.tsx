// ─────────────────────────────────────────────────────────────────────────────
// CheatsheetView.tsx  —  React component that renders one cheatsheet page.
//
// What it does:
//   1. Receives a Markdown string (the cheatsheet content) as a prop.
//   2. Renders it using ReactMarkdown, which turns Markdown into React elements.
//   3. Replaces the default code block renderer with a custom <CopyableCode>
//      component that adds a "Copy" button above every code snippet.
// ─────────────────────────────────────────────────────────────────────────────

// useState is a React hook that lets a component remember a value between renders.
// When useState's value changes, React re-renders only this component (not the page).
import { useState } from "react";

// ReactMarkdown parses a Markdown string and renders it as React DOM nodes.
// We supply custom "components" to override how specific Markdown elements look.
import ReactMarkdown from "react-markdown";

// Props is the TypeScript type for the data passed into CheatsheetView from the parent.
// { content: string } means the parent must pass exactly one prop called "content"
// which is a string of Markdown text.
interface Props { content: string; }

// ── CopyableCode ────────────────────────────────────────────────────────────
// A small helper component that wraps a code block with a toolbar showing the
// language name and a "Copy" button.  This component is only used inside
// CheatsheetView — it is not exported.
function CopyableCode({ code, lang }: { code: string; lang?: string }) {
  // copied tracks whether the user just clicked the Copy button.
  // useState(false) sets the initial value to false (button hasn't been clicked yet).
  const [copied, setCopied] = useState(false);

  // copy() is the function called when the user clicks the Copy button.
  const copy = () => {
    navigator.clipboard.writeText(code); // Write the code string to the system clipboard
    setCopied(true);                     // Switch the button label to "✓ Copied!"
    // After 2 000 ms (2 seconds) reset the button back to its normal "Copy" label.
    setTimeout(() => setCopied(false), 2000);
  };

  // The JSX returned here is the actual HTML structure that appears on screen.
  return (
    // Outer wrapper: rounded card with a dark border.  "group" is a Tailwind
    // trick — child elements can show/hide based on whether the card is hovered
    // by using "group-hover:" prefixed classes.
    <div className="relative my-4 rounded-xl overflow-hidden border border-slate-700/60 group">
      {/* Toolbar bar above the code: shows the language label on the left
          and the Copy button on the right.  The button is invisible by default
          and fades in when the card is hovered (opacity-0 → group-hover:opacity-100). */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        {/* Language label — falls back to "cpp" if no language was detected */}
        <span className="text-xs font-mono text-slate-400">{lang ?? "cpp"}</span>
        {/* onClick={copy}: call copy() when this button is clicked */}
        <button
          onClick={copy}
          className="text-xs text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded hover:bg-white/5"
        >
          {/* Ternary: show "✓ Copied!" for 2 s after a click, then revert */}
          {copied ? "✓ Copied!" : "Copy"}
        </button>
      </div>
      {/* The <pre> tag preserves whitespace and line breaks (important for code).
          overflow-x-auto adds a horizontal scrollbar for very long lines. */}
      <pre className="bg-[#0d1117] p-4 overflow-x-auto text-sm text-slate-200 font-mono leading-7">
        {/* <code> is the semantic HTML element for inline or block code */}
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── CheatsheetView ───────────────────────────────────────────────────────────
// The main exported component.  It renders the full cheatsheet Markdown string,
// customising every element type to match the dark-theme design system.
export default function CheatsheetView({ content }: Props) {
  return (
    // space-y-2 adds a small vertical gap between sibling children
    <div className="space-y-2">
      {/* ReactMarkdown walks the Markdown AST and calls the matching component
          for each node type (code, h1, h2, p, etc.).  Our overrides in
          "components" replace the browser defaults with styled versions. */}
      <ReactMarkdown
        components={{
          // ── code override ──────────────────────────────────────────────────
          // ReactMarkdown passes className="language-cpp" for fenced code blocks.
          // Inline code (backtick-wrapped) has no className.
          code({ className, children, ...props }) {
            const lang = className?.replace("language-", ""); // Extract "cpp" from "language-cpp"
            const isBlock = !!className;                      // true = fenced block, false = inline

            if (isBlock) {
              // Fenced code block → use our CopyableCode component with a copy button.
              // String(children).trimEnd() converts the children to a string and removes
              // the trailing newline that ReactMarkdown appends.
              return <CopyableCode code={String(children).trimEnd()} lang={lang} />;
            }
            // Inline code → simple styled <code> tag (no copy button needed)
            return (
              <code className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          // ── Heading overrides ──────────────────────────────────────────────
          // Each heading level gets a distinct size, weight, and colour so the
          // visual hierarchy is immediately obvious to the reader.
          h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-8 mb-4">{children}</h1>,
          h2: ({ children }) => (
            // h2 also gets a bottom border to visually separate major sections
            <h2 className="text-lg font-bold text-slate-100 mt-8 mb-3 flex items-center gap-2 border-b border-slate-700/60 pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => <h3 className="text-base font-semibold text-slate-200 mt-5 mb-2">{children}</h3>,
          // ── Paragraph ─────────────────────────────────────────────────────
          p:  ({ children }) => <p className="text-slate-300 leading-relaxed mb-3">{children}</p>,
          // ── Lists ─────────────────────────────────────────────────────────
          ul: ({ children }) => <ul className="space-y-1.5 mb-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-4 text-slate-300">{children}</ol>,
          // Each list item gets a violet arrow bullet instead of the browser default
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-slate-300">
              <span className="text-violet-500 mt-1 shrink-0">▸</span> {/* Custom bullet */}
              <span>{children}</span>
            </li>
          ),
          // ── Inline text styles ─────────────────────────────────────────────
          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
          // ── Blockquote (> text in Markdown) ────────────────────────────────
          // Used for tips, callouts, and important notes in the cheatsheets
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-violet-500/50 pl-4 my-4 rounded-r-lg bg-violet-500/5 py-2 pr-4">
              <div className="text-slate-300 italic">{children}</div>
            </blockquote>
          ),
          // ── Horizontal rule (--- in Markdown) ─────────────────────────────
          hr: () => <hr className="border-slate-700/60 my-6" />,
        }}
      >
        {content} {/* The raw Markdown string to be parsed and rendered */}
      </ReactMarkdown>
    </div>
  );
}
