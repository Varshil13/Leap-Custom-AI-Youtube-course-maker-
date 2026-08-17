import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const InlineMath = ({ math }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, { throwOnError: false, displayMode: false });
    } catch {
      return math;
    }
  }, [math]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const BlockMath = ({ math }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, { throwOnError: false, displayMode: true });
    } catch {
      return math;
    }
  }, [math]);
  return <div className="my-4 text-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />;
};

const LaTeXRenderer = ({ content }) => {
  if (!content) return null;

  const processLatex = (text) => {
    let html = text;

    html = html.replace(/\\section\{([^}]*)\}/g, '<h2 class="text-2xl font-bold mb-4 mt-8 text-foreground border-b border-border pb-2">$1</h2>');
    html = html.replace(/\\subsection\{([^}]*)\}/g, '<h3 class="text-xl font-semibold mb-3 mt-6 text-foreground">$1</h3>');
    html = html.replace(/\\subsubsection\{([^}]*)\}/g, '<h4 class="text-lg font-semibold mb-2 mt-4 text-foreground">$1</h4>');

    html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, items) => {
      const liMatches = items.match(/\\item\s+([\s\S]*?)(?=\\item|$)/g);
      if (!liMatches) return '';
      const lis = liMatches
        .map(item => {
          const content = item.replace(/^\\item\s+/, '').trim();
          return `<li class="mb-2 text-foreground">${content}</li>`;
        })
        .join('');
      return `<ul class="list-disc list-outside mb-4 ml-6 space-y-1">${lis}</ul>`;
    });

    html = html.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, items) => {
      const liMatches = items.match(/\\item\s+([\s\S]*?)(?=\\item|$)/g);
      if (!liMatches) return '';
      const lis = liMatches
        .map(item => {
          const content = item.replace(/^\\item\s+/, '').trim();
          return `<li class="mb-2 text-foreground">${content}</li>`;
        })
        .join('');
      return `<ol class="list-decimal list-outside mb-4 ml-6 space-y-1">${lis}</ol>`;
    });

    html = html.replace(/\\begin\{lstlisting\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{lstlisting\}/g, (_, code) => {
      const cleanCode = code.trim()
        .replace(/\\\\/g, '\\')
        .replace(/\\{/g, '{')
        .replace(/\\}/g, '}')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      const escaped = cleanCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div class="my-4 rounded-lg border border-border overflow-hidden"><pre class="p-4 overflow-x-auto text-sm leading-relaxed" style="background: var(--code-bg); color: var(--code-text);"><code>${escaped}</code></pre></div>`;
    });

    html = html.replace(/\\textbf\{([^}]*)\}/g, '<strong class="font-semibold text-foreground">$1</strong>');
    html = html.replace(/\\textit\{([^}]*)\}/g, '<em class="italic text-foreground">$1</em>');
    html = html.replace(/\\texttt\{([^}]*)\}/g, '<code class="px-1.5 py-0.5 rounded text-sm font-mono bg-muted text-foreground">$1</code>');

    html = html.replace(/\\item\s*/g, '<li class="mb-2 text-foreground"></li>');
    html = html.replace(/\\begin\{[^}]+\}/g, '');
    html = html.replace(/\\end\{[^}]+\}/g, '');

    return html;
  };

  const segments = content.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g);

  return (
    <div className="latex-content leading-relaxed text-foreground">
      {segments.map((segment, idx) => {
        if (segment.startsWith('$$') && segment.endsWith('$$')) {
          const math = segment.slice(2, -2).trim();
          return <BlockMath key={idx} math={math} />;
        }
        if (segment.startsWith('$') && segment.endsWith('$')) {
          const math = segment.slice(1, -1).trim();
          return <InlineMath key={idx} math={math} />;
        }
        const html = processLatex(segment);
        if (!html.trim()) return null;
        return (
          <div
            key={idx}
            className="latex-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </div>
  );
};

export default LaTeXRenderer;
