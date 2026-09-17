'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, Smartphone, Monitor, Terminal, Key, ArrowRight, Copy, Check, Trash2, Plus } from 'lucide-react';

interface App {
  id: string;
  workspaceId: string;
  name: string;
  platform: string;
  framework: string;
  apiKey: string;
  createdAt: string;
}

export function AppCard({ app, workspaceSlug }: { app: App; workspaceSlug: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isWeb = app.platform === 'web';
  const isAndroid = app.platform === 'android';
  const isDesktop = app.platform === 'desktop';

  const iconColor = isWeb ? '#38bdf8' : isAndroid ? '#10b981' : isDesktop ? '#f59e0b' : '#a855f7';
  const iconBg = isWeb ? 'rgba(56,189,248,0.1)' : isAndroid ? 'rgba(16,185,129,0.1)' : isDesktop ? 'rgba(245,158,11,0.1)' : 'rgba(168,85,247,0.1)';
  const iconBorder = isWeb ? 'rgba(56,189,248,0.3)' : isAndroid ? 'rgba(16,185,129,0.3)' : isDesktop ? 'rgba(245,158,11,0.3)' : 'rgba(168,85,247,0.3)';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(app.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/apps/${app.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to delete app.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <div style={{ background: '#0c0c0e', border: '1px solid #27272a', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', position: 'relative' }}>
      {/* Delete confirm overlay */}
      {showConfirm && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(9,9,11,0.92)', borderRadius: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', backdropFilter: 'blur(4px)' }}>
          <p style={{ fontSize: '13px', color: '#fafafa', fontWeight: 500, textAlign: 'center' }}>Delete <span style={{ color: '#fb7185' }}>{app.name}</span>?</p>
          <p style={{ fontSize: '11px', color: '#71717a', textAlign: 'center', maxWidth: '200px' }}>This will remove the app and its API key. Events already recorded are kept.</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowConfirm(false)} style={{ padding: '6px 14px', borderRadius: '6px', background: '#18181b', border: '1px solid #27272a', color: '#d4d4d8', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleDelete} disabled={deleting} style={{ padding: '6px 14px', borderRadius: '6px', background: '#7f1d1d', border: '1px solid rgba(244,63,94,0.4)', color: '#fca5a5', fontSize: '12px', cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
              {deleting ? 'Deleting…' : 'Delete App'}
            </button>
          </div>
        </div>
      )}

      <div>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: iconBg, color: iconColor, border: `1px solid ${iconBorder}` }}>
              {isWeb && <Globe style={{ width: '16px', height: '16px' }} />}
              {isAndroid && <Smartphone style={{ width: '16px', height: '16px' }} />}
              {isDesktop && <Monitor style={{ width: '16px', height: '16px' }} />}
              {!isWeb && !isAndroid && !isDesktop && <Terminal style={{ width: '16px', height: '16px' }} />}
            </div>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa' }}>{app.name}</h3>
              <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase' }}>{app.platform} · {app.framework}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>ACTIVE</span>
            <button onClick={() => setShowConfirm(true)} title="Delete app" style={{ padding: '4px', borderRadius: '4px', background: 'transparent', border: '1px solid transparent', color: '#52525b', cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#52525b'; e.currentTarget.style.borderColor = 'transparent'; }}>
              <Trash2 style={{ width: '13px', height: '13px' }} />
            </button>
          </div>
        </div>

        {/* API Key */}
        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#71717a', marginBottom: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}>
              <Key style={{ width: '11px', height: '11px', color: '#38bdf8' }} />
              PROJECT API KEY
            </span>
            <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: copied ? 'rgba(16,185,129,0.1)' : '#18181b', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : '#27272a'}`, borderRadius: '4px', padding: '2px 7px', fontSize: '10px', color: copied ? '#34d399' : '#a1a1aa', cursor: 'pointer', transition: 'all 0.2s' }}>
              {copied ? <Check style={{ width: '10px', height: '10px' }} /> : <Copy style={{ width: '10px', height: '10px' }} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{ fontSize: '11.5px', color: '#d4d4d8', fontFamily: 'Geist Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', userSelect: 'all' }}>
            {app.apiKey}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ paddingTop: '12px', borderTop: '1px solid #18181b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ fontSize: '11px', color: '#71717a' }}>Added {new Date(app.createdAt).toLocaleDateString()}</span>
        <Link href={`/${workspaceSlug}/docs/connect?app=${app.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}>
          <span>View Integration Docs</span>
          <ArrowRight style={{ width: '13px', height: '13px' }} />
        </Link>
      </div>
    </div>
  );
}
