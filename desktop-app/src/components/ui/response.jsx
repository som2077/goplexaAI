import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ai-elements/loader";

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeLink(url) {
  const trimmed = (url || "").trim();
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  return "#";
}

function mdToHtml(md) {
  if (!md) return "";
  let input = md.replace(/\r\n/g, "\n");

  const blocks = [];
  let lastIndex = 0;
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: "text",
        content: input.slice(lastIndex, match.index),
      });
    }
    blocks.push({ type: "code", lang: match[1] || "", content: match[2] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < input.length) {
    blocks.push({ type: "text", content: input.slice(lastIndex) });
  }

  const renderTextBlock = (text) => {
    let t = escapeHtml(text);

    t = t.replace(
      /^######\s?(.*)$/gim,
      '<h6 class="text-sm font-semibold text-white mt-4 mb-2">$1</h6>'
    );
    t = t.replace(
      /^#####\s?(.*)$/gim,
      '<h5 class="text-base font-semibold text-white mt-4 mb-2">$1</h5>'
    );
    t = t.replace(
      /^####\s?(.*)$/gim,
      '<h4 class="text-base font-semibold text-white mt-4 mb-2">$1</h4>'
    );
    t = t.replace(
      /^###\s?(.*)$/gim,
      '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>'
    );
    t = t.replace(
      /^##\s?(.*)$/gim,
      '<h2 class="text-xl font-semibold text-white mt-4 mb-2">$1</h2>'
    );
    t = t.replace(
      /^#\s?(.*)$/gim,
      '<h1 class="text-2xl font-semibold text-white mt-4 mb-2">$1</h1>'
    );

    t = t.replace(
      /^>\s?(.*)$/gim,
      '<blockquote class="border-l-2 border-white/15 pl-3 italic text-white/80 my-3">$1</blockquote>'
    );

    t = t.replace(
      /\n-{3,}\n/g,
      '<div class="my-4 border-t border-white/10"></div>'
    );

    t = t.replace(
      /^\s*[-*]\s+(.*)$/gim,
      '<ul class="list-disc pl-5 my-2"><li>$1</li></ul>'
    );
    t = t.replace(/<\/ul>\n<ul/g, "");

    t = t.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');
    t = t.replace(
      /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,
      '<em class="text-white/90">$1</em>'
    );

    t = t.replace(
      /`([^`]+)`/g,
      '<code class="bg-white/10 text-white px-1 py-0.5 rounded font-mono text-[12px]">$1</code>'
    );

    t = t.replace(/\[(.+?)\]\((.+?)\)/g, (m, text, url) => {
      return `<a href="${safeLink(
        url
      )}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline hover:text-blue-300">${text}<\/a>`;
    });

    t = t.replace(/\n\n+/g, "</p><p>");
    t = `<p>${t}</p>`;

    return t;
  };

  const html = blocks
    .map((b) => {
      if (b.type === "code") {
        const code = escapeHtml(b.content);
        const lang = escapeHtml(b.lang);
        return `<pre class="bg-white\/5 border border-white\/10 rounded-md p-3 my-3 overflow-x-auto"><code class="font-mono text-[12px] leading-5 text-white whitespace-pre">${code}<\/code><div class="text-xs text-white\/40 mt-1">${lang}<\/div><\/pre>`;
      }
      return renderTextBlock(b.content);
    })
    .join("\n");

  return html;
}

export const Response = ({ content, streaming = false, className }) => {
  const [typedContent, setTypedContent] = useState("");
  const prevContentRef = useRef("");

  useEffect(() => {
    if (streaming) {
      setTypedContent("");
      return;
    }

    const next = content || "";
    const prev = prevContentRef.current;
    if (next === prev) return;

    prevContentRef.current = next;

    const total = next.length;
    const baseDelay = total > 2000 ? 0 : total > 800 ? 2 : 4;
    let i = 0;
    let raf;

    const step = () => {
      i = Math.min(i + Math.max(1, Math.floor(total / 250)), total);
      setTypedContent(next.slice(0, i));
      if (i < total) raf = requestAnimationFrame(step);
    };

    setTypedContent("");
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [streaming, content]);

  const html = useMemo(
    () => mdToHtml(streaming ? "" : typedContent || content || ""),
    [streaming, typedContent, content]
  );

  if (streaming) {
    return (
      <div
        className={cn("flex items-center gap-3 text-blue-300/90", className)}
      >
        {/* Answer Generating  */}
        <Loader size={18} />

        <span className="skeleton skeleton-text">AI is thinking harder...</span>
      </div>
    );
  }

  if (!content) {
    return (
      <div className={cn("text-gray-500", className)}>Waiting for content…</div>
    );
  }

  return (
    <div
      className={cn(
        "text-white/90 text-[14px] leading-relaxed space-y-3 break-words",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default Response;
