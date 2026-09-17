'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('nehal@openpulse.io');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const slug = data.workspace ? data.workspace.slug : 'default';
      router.push(`/${slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-ambient-glow" />

      <div className="auth-card-box">
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', textAlign: 'center' }}>
          <div className="auth-brand-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em' }}>Welcome back to OpenPulse</h1>
          <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>Enter your credentials to access your telemetry bench</p>
        </div>

        {error && (
          <div style={{ marginBottom: '14px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(127, 29, 29, 0.3)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fca5a5', fontSize: '12px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label-text">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@company.com"
              className="form-text-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label-text" style={{ marginBottom: 0 }}>Password</label>
              <span style={{ fontSize: '11px', color: '#71717a', cursor: 'pointer' }}>Forgot?</span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="form-text-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-btn-primary"
            style={{ marginTop: '6px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #18181b', textAlign: 'center', fontSize: '12px', color: '#71717a' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}>
            Create account
          </Link>
        </div>
      </div>

      <div style={{ marginTop: '16px', textAlign: 'center', zIndex: 10 }}>
        <p style={{ fontSize: '11px', color: '#52525b' }}>
          Demo credentials pre-filled: <span className="mono" style={{ color: '#71717a' }}>nehal@openpulse.io</span> / <span className="mono" style={{ color: '#71717a' }}>password123</span>
        </p>
      </div>
    </div>
  );
}
