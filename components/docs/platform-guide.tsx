'use client';

import { useState } from 'react';
import { CodeSnippet } from './code-snippet';
import { Globe, Smartphone, Monitor, Terminal, CheckCircle } from 'lucide-react';

export function PlatformGuide({
  apiKey,
  appName,
  hostUrl = 'https://telemetry.openpulse.io'
}: {
  apiKey: string;
  appName: string;
  hostUrl?: string;
}) {
  const [platform, setPlatform] = useState<'web' | 'android' | 'desktop' | 'backend'>('web');
  const [subOption, setSubOption] = useState<string>('nextjs');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Platform Category Selector */}
      <div className="platform-card-grid">
        <button
          onClick={() => { setPlatform('web'); setSubOption('nextjs'); }}
          className={`platform-select-card ${platform === 'web' ? 'active' : ''}`}
        >
          <Globe style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Web App</div>
            <div style={{ fontSize: '10.5px', opacity: 0.75 }}>React, Next.js, JS</div>
          </div>
        </button>

        <button
          onClick={() => { setPlatform('android'); setSubOption('kotlin'); }}
          className={`platform-select-card ${platform === 'android' ? 'active android' : ''}`}
        >
          <Smartphone style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Android App</div>
            <div style={{ fontSize: '10.5px', opacity: 0.75 }}>Kotlin, Compose</div>
          </div>
        </button>

        <button
          onClick={() => { setPlatform('desktop'); setSubOption('electron'); }}
          className={`platform-select-card ${platform === 'desktop' ? 'active desktop' : ''}`}
        >
          <Monitor style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Desktop App</div>
            <div style={{ fontSize: '10.5px', opacity: 0.75 }}>Electron, Tauri, .NET</div>
          </div>
        </button>

        <button
          onClick={() => { setPlatform('backend'); setSubOption('nodejs'); }}
          className={`platform-select-card ${platform === 'backend' ? 'active backend' : ''}`}
        >
          <Terminal style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Backend / API</div>
            <div style={{ fontSize: '10.5px', opacity: 0.75 }}>Node, Python, Go</div>
          </div>
        </button>
      </div>

      {/* WEB DOCUMENTATION */}
      {platform === 'web' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Sub-framework pills */}
          <div className="sub-tabs-row">
            {[
              { id: 'nextjs', label: 'Next.js App Router' },
              { id: 'react', label: 'React SPA' },
              { id: 'cdn', label: 'HTML / CDN Script Tag' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSubOption(opt.id)}
                className={`sub-tab-btn ${subOption === opt.id ? 'active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {subOption === 'nextjs' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-[#fafafa] mb-1">1. Install OpenPulse Web SDK</h4>
                <CodeSnippet code="npm install @openpulse/web" language="bash" title="Terminal" />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#fafafa] mb-1">2. Initialize Analytics in your Root Layout (`app/layout.tsx`)</h4>
                <CodeSnippet
                  language="tsx"
                  title="app/layout.tsx"
                  code={`import { OpenPulseProvider } from '@openpulse/web';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OpenPulseProvider
          apiKey="${apiKey}"
          options={{
            endpoint: "${hostUrl}/api/ingest",
            autoPageview: true,
            captureWebVitals: true
          }}
        >
          {children}
        </OpenPulseProvider>
      </body>
    </html>
  );
}`}
                />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#fafafa] mb-1">3. Track Custom Events in Client Components</h4>
                <CodeSnippet
                  language="tsx"
                  title="components/checkout-btn.tsx"
                  code={`'use client';
import { useOpenPulse } from '@openpulse/web';

export function CheckoutButton({ amount }: { amount: number }) {
  const { track } = useOpenPulse();

  return (
    <button
      onClick={() => {
        track('checkout_clicked', {
          cart_total: amount,
          currency: 'USD',
          platform: 'web'
        });
      }}
    >
      Complete Purchase
    </button>
  );
}`}
                />
              </div>
            </div>
          )}

          {subOption === 'cdn' && (
            <div className="space-y-4">
              <p className="text-xs text-[#a1a1aa]">
                For static HTML, WordPress, Webflow, or Shopify, drop this single line inside your `&lt;head&gt;` tag:
              </p>
              <CodeSnippet
                language="html"
                title="index.html"
                code={`<!-- OpenPulse Real-Time Telemetry Tag -->
<script
  defer
  src="https://cdn.openpulse.io/v1/pulse.min.js"
  data-api-key="${apiKey}"
  data-endpoint="${hostUrl}/api/ingest"
  data-auto-track="true"
></script>`}
              />
            </div>
          )}

          {subOption === 'react' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-[#fafafa] mb-1">1. Install Package</h4>
                <CodeSnippet code="npm install @openpulse/web" language="bash" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#fafafa] mb-1">2. Initialize in Entrypoint (`src/main.tsx` or `src/index.js`)</h4>
                <CodeSnippet
                  language="typescript"
                  title="src/main.tsx"
                  code={`import { init } from '@openpulse/web';

init({
  apiKey: '${apiKey}',
  endpoint: '${hostUrl}/api/ingest',
  capturePerformance: true
});`}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ANDROID DOCUMENTATION */}
      {platform === 'android' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="sub-tabs-row">
            {[
              { id: 'kotlin', label: 'Kotlin / Jetpack Compose' },
              { id: 'java', label: 'Java' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSubOption(opt.id)}
                className={`sub-tab-btn ${subOption === opt.id ? 'active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#fafafa] mb-1">1. Add Maven Repository & Gradle Dependency</h4>
            <CodeSnippet
              language="kotlin"
              title="app/build.gradle.kts"
              code={`dependencies {
    implementation("io.openpulse:openpulse-android:1.4.2")
}`}
            />
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#fafafa] mb-1">2. Initialize in your `Application` class</h4>
            <CodeSnippet
              language="kotlin"
              title="MainApplication.kt"
              code={`package com.example.app

import android.app.Application
import io.openpulse.android.OpenPulse
import io.openpulse.android.OpenPulseConfig

class MainApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        OpenPulse.initialize(
            context = this,
            config = OpenPulseConfig(
                apiKey = "${apiKey}",
                endpoint = "${hostUrl}/api/ingest",
                trackCrashes = true,
                trackAppLifecycle = true
            )
        )
    }
}`}
            />
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#fafafa] mb-1">3. Track Events in Compose or Activity</h4>
            <CodeSnippet
              language="kotlin"
              title="MainActivity.kt"
              code={`// Track custom screen view or user action
OpenPulse.track(
    event = "user_completed_onboarding",
    properties = mapOf(
        "device_model" to android.os.Build.MODEL,
        "os_version" to android.os.Build.VERSION.RELEASE
    )
)`}
            />
          </div>
        </div>
      )}

      {/* DESKTOP DOCUMENTATION */}
      {platform === 'desktop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="sub-tabs-row">
            {[
              { id: 'electron', label: 'Electron' },
              { id: 'tauri', label: 'Tauri (Rust / Web)' },
              { id: 'dotnet', label: '.NET / C# (WPF / Avalonia)' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSubOption(opt.id)}
                className={`sub-tab-btn ${subOption === opt.id ? 'active' : ''}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {subOption === 'electron' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-[#fafafa] mb-1">1. Install Package in Electron project</h4>
                <CodeSnippet code="npm install @openpulse/electron" language="bash" />
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#fafafa] mb-1">2. Initialize in Electron Main Process (`main.js` or `main.ts`)</h4>
                <CodeSnippet
                  language="javascript"
                  title="src/main.js"
                  code={`const { app } = require('electron');
const { OpenPulse } = require('@openpulse/electron');

app.whenReady().then(() => {
  OpenPulse.init({
    apiKey: '${apiKey}',
    endpoint: '${hostUrl}/api/ingest',
    trackAppLifecycle: true,
    catchUncaughtExceptions: true
  });

  OpenPulse.track('desktop_app_launched', {
    os: process.platform,
    arch: process.arch,
    electron_version: process.versions.electron
  });
});`}
                />
              </div>
            </div>
          )}

          {subOption === 'tauri' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-[#fafafa] mb-1">Initialize in Tauri Rust Core or Frontend</h4>
                <CodeSnippet
                  language="rust"
                  title="src-tauri/src/main.rs"
                  code={`// Cargo.toml: openpulse = "1.0"
use openpulse::{OpenPulseClient, Event};

fn main() {
    let pulse = OpenPulseClient::new(
        "${apiKey}",
        "${hostUrl}/api/ingest"
    );

    pulse.track(Event::new("tauri_app_startup"));
    tauri::Builder::default().run(tauri::generate_context!()).unwrap();
}`}
                />
              </div>
            </div>
          )}

          {subOption === 'dotnet' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-[#fafafa] mb-1">C# / .NET Desktop Integration</h4>
                <CodeSnippet
                  language="csharp"
                  title="App.xaml.cs"
                  code={`using OpenPulse;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        OpenPulseClient.Initialize(new OpenPulseOptions
        {
            ApiKey = "${apiKey}",
            Endpoint = "${hostUrl}/api/ingest"
        });

        OpenPulseClient.Track("desktop_session_started", new {
            Version = "2.1.0",
            OS = Environment.OSVersion.ToString()
        });
    }
}`}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* BACKEND DOCUMENTATION */}
      {platform === 'backend' && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <h4 className="text-xs font-semibold text-[#fafafa] mb-1">Node.js Express / Fastify Middleware</h4>
            <CodeSnippet
              language="javascript"
              title="server.js"
              code={`const { OpenPulse } = require('@openpulse/node');

const pulse = new OpenPulse({
  apiKey: '${apiKey}',
  endpoint: '${hostUrl}/api/ingest'
});

// Track API invocation
pulse.track('api_order_processed', {
  order_id: 'ord_99812',
  duration_ms: 14.2
});`}
            />
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#fafafa] mb-1">Python FastAPI / Flask</h4>
            <CodeSnippet
              language="python"
              title="main.py"
              code={`from openpulse import OpenPulse

pulse = OpenPulse(
    api_key="${apiKey}",
    endpoint="${hostUrl}/api/ingest"
)

pulse.track(
    event="payment_webhook_received",
    distinct_id="user_8812",
    properties={"status": "succeeded", "amount": 29.99}
)`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
