'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Account creation failed');
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
      <div className="auth-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(9, 9, 11, 0) 70%)' }} />

      <div className="auth-card-box">
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', textAlign: 'center' }}>
          <div className="auth-brand-badge" style={{ color: '#10b981' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em' }}>Create your OpenPulse Account</h1>
          <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>Start tracking Web, Android, and Desktop apps</p>
        </div>

        {error && (
          <div style={{ marginBottom: '14px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(127, 29, 29, 0.3)', border: '1px solid rgba(244, 63, 94, 0.4)', color: '#fca5a5', fontSize: '12px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label-text">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Mercer"
              className="form-text-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label-text">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              className="form-text-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label-text">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="form-text-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-btn-primary"
            style={{ marginTop: '6px' }}
          >
            {loading ? 'Creating Workspace...' : 'Create Account & Workspace'}
          </button>
        </form>

        <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #18181b', textAlign: 'center', fontSize: '12px', color: '#71717a' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
