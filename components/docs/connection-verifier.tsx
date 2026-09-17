'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Send, ArrowRight, ShieldCheck } from 'lucide-react';

export function ConnectionVerifier({
  apiKey,
  appName,
  workspaceSlug
}: {
  apiKey: string;
  appName: string;
  workspaceSlug: string;
}) {
  const [testing, setTesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSendTestEvent() {
    setTesting(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OpenPulse-Key': apiKey,
        },
        body: JSON.stringify({
          event: '$connection_verified',
          distinctId: 'test_dev_' + Math.random().toString(36).substring(2, 7),
          properties: {
            appName,
            verifiedVia: 'OpenPulse Integration Assistant',
            sdk: '@openpulse/live-verifier',
            client: typeof window !== 'undefined' ? window.navigator.userAgent : 'Browser'
          }
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setSuccess(true);
      } else {
        alert(data.error || 'Connection failed.');
      }
    } catch (err: any) {
      alert('Network error testing connection: ' + err.message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="verifier-card">
      <div className="verifier-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: '#fafafa' }}>Live Connection Verifier</h3>
        </div>
        <span className="mono" style={{ fontSize: '11px', color: '#71717a' }}>
          Listening on <span style={{ color: '#38bdf8' }}>{apiKey.substring(0, 14)}...</span>
        </span>
      </div>

      <div style={{ paddingTop: '8px' }}>
        {success ? (
          <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600, fontSize: '13px' }}>
              <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <span>Connection Verified! Event successfully ingested into ClickHouse cluster.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px', fontFamily: 'Geist Mono, monospace', background: '#09090b', padding: '10px', borderRadius: '6px', border: '1px solid #27272a' }}>
              <div>
                <span style={{ color: '#71717a', display: 'block', fontSize: '10px' }}>STATUS</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>{result?.status || '202 ACCEPTED'}</span>
              </div>
              <div>
                <span style={{ color: '#71717a', display: 'block', fontSize: '10px' }}>INGESTION LATENCY</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{result?.latencyMs} ms</span>
              </div>
              <div>
                <span style={{ color: '#71717a', display: 'block', fontSize: '10px' }}>STORAGE PARTITION</span>
                <span style={{ color: '#fafafa', fontWeight: 700 }}>{result?.shard}</span>
              </div>
            </div>

            <div style={{ paddingTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                href={`/${workspaceSlug}`}
                className="action-btn-primary"
                style={{ background: '#10b981', borderColor: '#10b981', color: '#09090b' }}
              >
                <span>View in Live Telemetry Dashboard</span>
                <ArrowRight style={{ width: '13px', height: '13px' }} />
              </Link>
              <button
                onClick={handleSendTestEvent}
                style={{ fontSize: '12px', color: '#a1a1aa', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                Send Another Event
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12.5px', color: '#d4d4d8' }}>
                Verify that your application is configured properly. Click below to emit an end-to-end simulated telemetry batch using your project key.
              </p>
              <p style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                Target App: <span className="mono" style={{ color: '#a1a1aa' }}>{appName}</span>
              </p>
            </div>

            <button
              onClick={handleSendTestEvent}
              disabled={testing}
              className="btn-test-send"
              style={{ opacity: testing ? 0.6 : 1, flexShrink: 0 }}
            >
              {testing ? (
                <>
                  <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                  <span>Ingesting...</span>
                </>
              ) : (
                <>
                  <Send style={{ width: '13px', height: '13px' }} />
                  <span>Send Test Event Now</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
