/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — syntax-highlighted read-only code viewer
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useEffect, useState } from 'react';
import hljs from 'highlight.js';

// Custom highlight.js theme — matches the dashboard's denim/cyan/bronze palette.
// Comments are gray (#9ca3af) per design; everything else picks from brand accents.
const SYNTAX_THEME_CSS = `
.hljs                                            { color: #e2e8f0; background: transparent; }
.hljs-comment, .hljs-quote                       { color: #9ca3af; font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-doctag,
.hljs-section, .hljs-subst                       { color: #22d3ee; }
.hljs-string, .hljs-regexp, .hljs-template-tag,
.hljs-template-variable                          { color: #eab308; }
.hljs-number, .hljs-literal, .hljs-symbol,
.hljs-bullet                                     { color: #10b981; }
.hljs-title, .hljs-title.function_,
.hljs-title.class_, .hljs-name                   { color: #a78bfa; }
.hljs-built_in, .hljs-type, .hljs-class,
.hljs-title.class_.inherited__                   { color: #f59e0b; }
.hljs-attr, .hljs-attribute, .hljs-property      { color: #67e8f9; }
.hljs-variable, .hljs-params                     { color: #e2e8f0; }
.hljs-tag                                        { color: #94a3b8; }
.hljs-meta, .hljs-meta-keyword                   { color: #94a3b8; }
.hljs-deletion                                   { color: #ef4444; }
.hljs-addition                                   { color: #10b981; }
.hljs-emphasis                                   { font-style: italic; }
.hljs-strong                                     { font-weight: 600; }
`;

interface CodeViewerProps {
  sessionId: string;
  filePath:  string | null;
}

function langFromPath(filePath: string): string | undefined {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    py: 'python',   rs: 'rust',
    go: 'go',        java: 'java',
    c: 'c',          cpp: 'cpp',
    css: 'css',      html: 'xml',
    json: 'json',    md: 'markdown',
    sh: 'bash',      yaml: 'yaml',
    yml: 'yaml',     toml: 'ini',
    sql: 'sql',      txt: 'plaintext',
  };
  return ext ? map[ext] : undefined;
}

export function CodeViewer({ sessionId, filePath }: CodeViewerProps) {
  const [content,    setContent]    = useState('');
  const [highlighted, setHighlighted] = useState('');
  const [status,     setStatus]     = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg,   setErrorMsg]   = useState('');

  useEffect(() => {
    if (!filePath) return;

    setStatus('loading');
    setContent('');
    setHighlighted('');

    fetch(`/api/code/file?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(filePath)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.content && data.error) {
          setStatus('error');
          setErrorMsg(data.error);
          return;
        }
        const raw  = data.content ?? '';
        const lang = langFromPath(filePath);
        const hl   = lang
          ? hljs.highlight(raw, { language: lang, ignoreIllegals: true })
          : hljs.highlightAuto(raw);
        setContent(raw);
        setHighlighted(hl.value);
        setStatus('idle');
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Failed to load file.');
      });
  }, [sessionId, filePath]);

  if (!filePath) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'rgba(212,168,83,0.3)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        letterSpacing: '1px',
      }}>
        Select a file to view
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div style={{
        padding: 24, color: 'rgba(212,168,83,0.4)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
      }}>
        Loading {filePath.split('/').pop()}…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        padding: 24, color: '#ef4444',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
      }}>
        {errorMsg}
      </div>
    );
  }

  const lineCount = content.split('\n').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{SYNTAX_THEME_CSS}</style>
      {/* File header */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px dashed rgba(196,133,58,0.2)',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
        color: 'rgba(212,168,83,0.5)', letterSpacing: '0.5px',
        flexShrink: 0, display: 'flex', justifyContent: 'space-between',
      }}>
        <span>{filePath}</span>
        <span style={{ opacity: 0.5 }}>{lineCount} lines</span>
      </div>

      {/* Code block */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <pre className="hljs" style={{
          margin: 0, padding: '16px 0',
          background: 'transparent',
          fontSize: 13, lineHeight: 1.6,
          minHeight: '100%',
        }}>
          {/* Line numbers + code side by side */}
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              {content.split('\n').map((_, i) => (
                <tr key={i}>
                  <td style={{
                    textAlign: 'right', padding: '0 16px 0 16px',
                    color: 'rgba(196,133,58,0.25)', fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    userSelect: 'none', verticalAlign: 'top',
                    minWidth: 40, borderRight: '1px solid rgba(196,133,58,0.1)',
                  }}>
                    {i + 1}
                  </td>
                  <td style={{ padding: '0 16px', verticalAlign: 'top' }}
                    dangerouslySetInnerHTML={{
                      __html: highlighted.split('\n')[i] ?? '',
                    }}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </pre>
      </div>
    </div>
  );
}
