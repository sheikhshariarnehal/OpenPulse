'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Globe, Smartphone, Monitor, Terminal, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

export default function NewAppPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const [platform, setPlatform] = useState<'web' | 'android' | 'desktop' | 'backend'>('web');
  const [framework, setFramework] = useState('nextjs');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const frameworksByPlatform = {
    web: [
      { id: 'nextjs', name: 'Next.js App Router' },
      { id: 'react', name: 'React SPA' },
      { id: 'vue', name: 'Vue 3' },
      { id: 'vanilla', name: 'HTML / Vanilla JS' }
    ],
    android: [
      { id: 'kotlin', name: 'Kotlin / Jetpack Compose' },
      { id: 'java', name: 'Android Java' }
    ],
    desktop: [
      { id: 'electron', name: 'Electron' },
      { id: 'tauri', name: 'Tauri (Rust / Web)' },
      { id: 'dotnet', name: '.NET / C# (WPF/Avalonia)' },
      { id: 'macos', name: 'macOS (Swift)' }
    ],
    backend: [
      { id: 'nodejs', name: 'Node.js (Express / Fastify)' },
      { id: 'python', name: 'Python (FastAPI / Flask)' },
      { id: 'go', name: 'Go (Golang)' }
    ]
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), platform, framework })
      });
      const data = await res.json();
      if (res.ok && data.app) {
        router.push(`/${workspaceSlug}/docs/connect?app=${data.app.id}`);
      } else {
        alert(data.error || 'Failed to create application.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page" style={{ justifyContent: 'flex-start', paddingTop: '48px' }}>
      <div className="auth-ambient-glow" />

      <div style={{ width: '100%', maxWidth: '640px', zIndex: 10 }}>
        <Link
          href={`/${workspaceSlug}/apps`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#71717a', textDecoration: 'none', marginBottom: '16px' }}
        >
          <ArrowLeft style={{ width: '14px', height: '14px' }} />
          <span>Back to Applications</span>
        </Link>

        <div className="auth-card-box" style={{ maxWidth: '100%' }}>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em' }}>Register New Application</h1>
            <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
              Select your platform and tech stack to generate a dedicated telemetry API key and custom integration instructions.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step 1: Platform Selection */}
            <div>
              <label className="form-label-text">1. Select Application Platform</label>
              <div className="platform-card-grid">
                {[
                  { id: 'web', label: 'Web App', icon: Globe, desc: 'React, Next.js' },
                  { id: 'android', label: 'Android App', icon: Smartphone, desc: 'Kotlin, Compose' },
                  { id: 'desktop', label: 'Desktop App', icon: Monitor, desc: 'Electron, Tauri' },
                  { id: 'backend', label: 'Backend API', icon: Terminal, desc: 'Node, Python' }
                ].map(p => {
                  const Icon = p.icon;
                  const isSelected = platform === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPlatform(p.id as any);
                        setFramework(frameworksByPlatform[p.id as keyof typeof frameworksByPlatform][0].id);
                      }}
                      className={`platform-select-card ${isSelected ? `active ${p.id}` : ''}`}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}
                    >
                      <Icon style={{ width: '16px', height: '16px' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>{p.label}</div>
                        <div style={{ fontSize: '10px', opacity: 0.75 }}>{p.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Framework Selection */}
            <div>
              <label className="form-label-text">2. Framework / Environment</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {frameworksByPlatform[platform].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFramework(f.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 500,
                      textAlign: 'left',
                      background: framework === f.id ? '#18181b' : '#09090b',
                      color: framework === f.id ? '#fafafa' : '#71717a',
                      border: `1px solid ${framework === f.id ? '#38bdf8' : '#27272a'}`,
                      cursor: 'pointer',
                      transition: 'all 0.12s'
                    }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Name */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label-text">3. Application Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. My ${platform.toUpperCase()} Client`}
                className="form-text-input"
              />
            </div>

            <div style={{ paddingTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Link
                href={`/${workspaceSlug}/apps`}
                className="btn-dialog-cancel"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="action-btn-primary"
                style={{ opacity: loading || !name.trim() ? 0.5 : 1 }}
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Credentials & View Docs</span>
                    <ArrowRight style={{ width: '13px', height: '13px' }} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
