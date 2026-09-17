'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CodeSnippet({
  code,
  language = 'bash',
  title
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="code-block-container">
      {title && (
        <div className="code-block-header">
          <span style={{ fontFamily: 'Geist Mono, monospace', color: '#a1a1aa' }}>{title}</span>
          <span style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontFamily: 'Geist Mono, monospace' }}>{language}</span>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <button
          onClick={copyToClipboard}
          className="code-copy-btn"
          style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}
        >
          {copied ? (
            <>
              <Check style={{ width: '12px', height: '12px', color: '#10b981' }} />
              <span style={{ color: '#10b981', fontWeight: 500 }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy style={{ width: '12px', height: '12px', color: '#71717a' }} />
              <span>Copy</span>
            </>
          )}
        </button>

        <pre className="code-content">
          {code}
        </pre>
      </div>
    </div>
  );
}
