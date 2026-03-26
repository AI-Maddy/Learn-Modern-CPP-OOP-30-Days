import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface Props { content: string; }

function CopyableCode({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-slate-700/60 group">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400">{lang ?? "cpp"}</span>
        <button
          onClick={copy}
          className="text-xs text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded hover:bg-white/5"
        >
          {copied ? "✓ Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-[#0d1117] p-4 overflow-x-auto text-sm text-slate-200 font-mono leading-7">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function CheatsheetView({ content }: Props) {
  return (
    <div className="space-y-2">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const lang = className?.replace("language-", "");
            const isBlock = !!className;
            if (isBlock) {
              return <CopyableCode code={String(children).trimEnd()} lang={lang} />;
            }
            return (
              <code className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-8 mb-4">{children}</h1>,
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-slate-100 mt-8 mb-3 flex items-center gap-2 border-b border-slate-700/60 pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => <h3 className="text-base font-semibold text-slate-200 mt-5 mb-2">{children}</h3>,
          p:  ({ children }) => <p className="text-slate-300 leading-relaxed mb-3">{children}</p>,
          ul: ({ children }) => <ul className="space-y-1.5 mb-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 mb-4 text-slate-300">{children}</ol>,
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-slate-300">
              <span className="text-violet-500 mt-1 shrink-0">▸</span>
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-violet-500/50 pl-4 my-4 rounded-r-lg bg-violet-500/5 py-2 pr-4">
              <div className="text-slate-300 italic">{children}</div>
            </blockquote>
          ),
          hr: () => <hr className="border-slate-700/60 my-6" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
