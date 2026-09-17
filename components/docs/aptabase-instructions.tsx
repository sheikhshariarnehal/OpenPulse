'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export interface AppInfo {
  id: string;
  name: string;
  platform: string;
  apiKey: string;
}

interface AptabaseInstructionsProps {
  app: AppInfo;
  allApps: AppInfo[];
  workspaceSlug: string;
  hostUrl?: string;
}

interface FrameworkDoc {
  id: string;
  name: string;
  icon: (size?: number) => React.ReactNode;
  category: 'mobile' | 'desktop' | 'web' | 'backend' | 'game';
  platforms: string[];
  githubUrl: string;
  installOptions: {
    title: string;
    description?: string;
    language: string;
    code: string;
  }[];
  usage: {
    description: string;
    language: string;
    filename?: string;
    code: string;
  };
  tracking: {
    description: string;
    language: string;
    filename?: string;
    code: string;
  };
}

export function AptabaseInstructions({
  app,
  allApps,
  workspaceSlug,
  hostUrl = 'http://localhost:3000',
}: AptabaseInstructionsProps) {
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>(() => {
    if (app.platform === 'desktop' || app.name.toLowerCase().includes('desktop')) return 'tauri';
    if (app.platform === 'android') return 'android';
    if (app.platform === 'ios') return 'apple';
    return 'tauri';
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState<string | null>(null);

  // Live Test Verifier state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    eventId?: string;
  } | null>(null);

  function copyText(text: string, id?: string) {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedSnippetIdx(id);
      setTimeout(() => setCopiedSnippetIdx(null), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  }

  async function handleSendTestEvent() {
    setTesting(true);
    setTestResult(null);
    try {
      const startTime = performance.now();
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OpenPulse-Key': app.apiKey,
        },
        body: JSON.stringify({
          event: '$doc_test_ping',
          distinctId: 'test_dev_' + Math.random().toString(36).substring(2, 7),
          properties: {
            framework: selectedFrameworkId,
            source: 'aptabase_instructions_docs',
            timestamp: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (res.ok && data.success) {
        setTestResult({
          success: true,
          latencyMs: data.latencyMs || latency,
          eventId: data.eventId,
          message: 'Telemetry ingestion verified successfully in ' + (data.latencyMs || latency) + 'ms!',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to ingest test event',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network connection failed',
      });
    } finally {
      setTesting(false);
    }
  }

  // Define frameworks matching Aptabase
  const frameworks: FrameworkDoc[] = [
    {
      id: 'tauri',
      name: 'Tauri (Windows Desktop)',
      category: 'desktop',
      platforms: ['Windows', 'macOS', 'Linux'],
      githubUrl: 'https://github.com/openpulse/openpulse-tauri',
      icon: (s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <circle cx="8" cy="8" r="4" fill="#24C8D8" />
          <circle cx="16" cy="8" r="4" fill="#FFC131" />
          <path d="M4 16h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" fill="#24C8D8" />
        </svg>
      ),
      installOptions: [
        {
          title: 'Option 1: Add Telemetry Client Module (Recommended for Windows & All Platforms)',
          description: 'Create `src/utils/openpulse.ts` in your Tauri React / TypeScript frontend. It works out-of-the-box in the Windows webview without any extra native crates or recompilation:',
          language: 'typescript',
          code: `/**
 * OpenPulse Telemetry Integration for Windows Tauri Desktop
 * Connects directly to the OpenPulse high-velocity ingestion pipeline.
 */

const OPENPULSE_ENDPOINT = '${hostUrl}/api/ingest';
const OPENPULSE_API_KEY = '${app.apiKey}';
const STORAGE_KEY_DISTINCT_ID = 'openpulse_distinct_id';

/**
 * Retrieves or generates a persistent anonymous installation ID.
 */
export function getDistinctId(): string {
  if (typeof window === 'undefined') return 'server_desktop';
  try {
    let id = localStorage.getItem(STORAGE_KEY_DISTINCT_ID);
    if (!id) {
      id = 'cs_desk_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(STORAGE_KEY_DISTINCT_ID, id);
    }
    return id;
  } catch {
    return 'cs_desk_fallback';
  }
}

/**
 * Resolves regional location based on client timezone.
 */
function resolveCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Dhaka') || tz.includes('Asia/Dhaka')) return 'Bangladesh';
    if (tz.includes('Calcutta') || tz.includes('Kolkata')) return 'India';
    if (tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago') || tz.includes('America')) return 'United States';
    if (tz.includes('London') || tz.includes('Europe/London')) return 'United Kingdom';
    if (tz.includes('Berlin') || tz.includes('Paris') || tz.includes('Rome')) return 'Germany';
    if (tz.includes('Tokyo') || tz.includes('Asia/Tokyo')) return 'Japan';
    if (tz.includes('Singapore')) return 'Singapore';
    return 'United States';
  } catch {
    return 'United States';
  }
}

/**
 * Emits a telemetry event asynchronously without blocking UI or app performance.
 */
export async function track(event: string, properties: Record<string, any> = {}): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const distinctId = getDistinctId();
    const os = navigator.userAgent.includes('Windows')
      ? 'Windows'
      : navigator.userAgent.includes('Mac')
      ? 'macOS'
      : 'Linux';

    const path = properties.path || properties.screen || (event === '$screen_view' ? '/home' : \`/\${event.replace('$', '')}\`);

    await fetch(OPENPULSE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenPulse-Key': OPENPULSE_API_KEY,
      },
      body: JSON.stringify({
        event,
        distinctId,
        properties: {
          app: '${app.name}',
          platform: 'desktop_tauri',
          os,
          browser: '${app.name}',
          country: resolveCountry(),
          path,
          timestamp: new Date().toISOString(),
          ...properties,
        },
      }),
    });
  } catch {
    // Fail silently in development/offline so user experience is never degraded
  }
}

/**
 * Track navigation between views (Home, Search, Player, Settings, Plugins).
 */
export function trackScreen(screen: string, extra: Record<string, any> = {}) {
  const normalizedPath = screen.startsWith('/') ? screen : \`/\${screen}\`;
  return track('$screen_view', {
    screen: normalizedPath,
    path: normalizedPath,
    ...extra,
  });
}

/**
 * Track media playback operations (play, pause, buffer, ended, error).
 */
export function trackPlayback(
  action: 'play' | 'pause' | 'buffer' | 'ended' | 'error',
  details: {
    title?: string;
    provider?: string;
    durationSec?: number;
    quality?: string;
    [key: string]: any;
  } = {}
) {
  return track(\`video_\${action}\`, {
    ...details,
    path: '/player',
  });
}

/**
 * Track content search and discovery queries.
 */
export function trackSearch(query: string, resultsCount: number, provider?: string) {
  return track('search_query', {
    query,
    results_count: resultsCount,
    provider: provider || 'all',
    path: '/search',
  });
}

/**
 * Initializes automatic application lifecycle events, crash logging, and real-time active user heartbeat.
 */
export function initTelemetry(): void {
  if (typeof window === 'undefined') return;

  // 1. Send Application Launch Telemetry
  track('app_open', {
    version: '0.1.0',
    screen_resolution: \`\${window.screen.width}x\${window.screen.height}\`,
    device_pixel_ratio: window.devicePixelRatio || 1,
    path: '/app',
  });

  // 2. Track initial screen view
  trackScreen('/home', { initial: true });

  // 3. Global Uncaught JavaScript Exception Listener
  window.addEventListener('error', (event) => {
    track('error_thrown', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      stack: event.error?.stack?.substring(0, 500),
      path: window.location?.pathname || '/app',
    });
  });

  // 4. Global Unhandled Promise Rejection Listener
  window.addEventListener('unhandledrejection', (event) => {
    track('error_thrown', {
      type: 'unhandledrejection',
      reason: String(event.reason),
      path: window.location?.pathname || '/app',
    });
  });

  // 5. Automatic periodic active session heartbeat (every 25 seconds for Realtime Active Users)
  setInterval(() => {
    track('$heartbeat', {
      path: window.location?.pathname || '/app',
    });
  }, 25000);
}`,
        },
        {
          title: 'Option 2: Tauri Rust Backend (Native reqwest / Background Daemon)',
          description: 'If you want to send telemetry directly from Rust code in `src-tauri/src/main.rs` (e.g. background tasks or IPC commands):',
          language: 'rust',
          code: `// 1. In src-tauri/Cargo.toml add:
// reqwest = { version = "0.11", features = ["json"] }
// serde_json = "1.0"

use serde_json::json;

pub async fn track_rust_event(event: &str, properties: serde_json::Value) {
    let client = reqwest::Client::new();
    let _ = client.post("${hostUrl}/api/ingest")
        .header("X-OpenPulse-Key", "${app.apiKey}")
        .json(&json!({
            "event": event,
            "distinctId": "tauri_native_rust",
            "properties": properties
        }))
        .send()
        .await;
}`,
        },
      ],
      usage: {
        description: 'Initialize telemetry in your React Root Component (`src/App.tsx`):',
        language: 'tsx',
        filename: 'src/App.tsx',
        code: `import React, { useEffect } from 'react';
import { initTelemetry, trackScreen } from './utils/openpulse';

export function App() {
  useEffect(() => {
    // Initializes app_open, error listeners & live active user heartbeat
    initTelemetry();
  }, []);

  return (
    <div className="app-container">
      {/* Your Windows Tauri Desktop UI */}
    </div>
  );
}`,
      },
      tracking: {
        description: 'Track screen navigation, playback, searches, and custom user actions anywhere in your app:',
        language: 'typescript',
        filename: 'src/screens/HomeScreen.tsx',
        code: `import { track, trackScreen, trackPlayback, trackSearch } from '../utils/openpulse';

// 1. Track screen navigation
trackScreen('/player');

// 2. Track video playback
trackPlayback('play', {
  title: 'Inception',
  provider: 'DiscoveryFTP',
  durationSec: 8880,
  quality: '1080p'
});

// 3. Track search queries
trackSearch('Action Movies', 24, 'SuperStream');

// 4. Track any custom event with properties
track('button_clicked', {
  button_id: 'download_torrent',
  theme: 'dark'
});`,
      },
    },

    {
      id: 'apple',
      name: 'Apple (Swift)',
      category: 'mobile',
      platforms: ['iOS', 'macOS', 'visionOS', 'tvOS', 'watchOS'],
      githubUrl: 'https://github.com/openpulse/openpulse-swift',
      icon: (s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="#ffffff">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.13.64-2.81 1.45-.6.69-1.12 1.83-.98 2.93 1.07.08 2.14-.46 2.8-1.28z" />
        </svg>
      ),
      installOptions: [
        {
          title: 'Option 1: Swift Package Manager',
          description: 'Add the following lines to your `Package.swift` file:',
          language: 'swift',
          code: `let package = Package(
    ...
    dependencies: [
        .package(url: "https://github.com/openpulse/openpulse-swift.git", from: "1.0.0")
    ],
    targets: [
        .target(name: "MyApp", dependencies: ["OpenPulse"])
    ]
)`,
        },
        {
          title: 'Option 2: CocoaPods',
          description: 'Add the following line to your `Podfile`:',
          language: 'ruby',
          code: `pod 'OpenPulse', :git => 'https://github.com/openpulse/openpulse-swift.git', :tag => '1.0.0'`,
        },
      ],
      usage: {
        description: 'Initialize the SDK as early as possible in your app lifecycle:',
        language: 'swift',
        filename: 'MyApp.swift',
        code: `import SwiftUI
import OpenPulse

@main
struct MyApp: App {
    init() {
        OpenPulse.initialize(
            appKey: "${app.apiKey}",
            options: InitOptions(host: "${hostUrl}")
        )
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}`,
      },
      tracking: {
        description: 'Track user engagements and custom telemetry events:',
        language: 'swift',
        code: `// Track custom event with properties
OpenPulse.track("item_purchased", with: [
    "item_id": "pro_monthly",
    "price": 9.99,
    "currency": "USD"
])`,
      },
    },

    {
      id: 'android',
      name: 'Android (Kotlin)',
      category: 'mobile',
      platforms: ['Android', 'WearOS', 'Android TV'],
      githubUrl: 'https://github.com/openpulse/openpulse-android',
      icon: (s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="#3DDC84">
          <path d="M6 18h12V6H6v12zm10.5-8.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-9 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
        </svg>
      ),
      installOptions: [
        {
          title: 'Zero-Dependency Integration (Recommended)',
          description: 'No SDK library needed — copy `OpenPulseAnalytics.kt` into your `analytics/` package. Uses only Android\'s built-in `HttpURLConnection` and Kotlin coroutines (already in every Android project):',
          language: 'kotlin',
          code: `package com.example.app.analytics

import android.content.Context
import android.os.Build
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

object OpenPulseAnalytics {

    private const val OPENPULSE_API_KEY = "${app.apiKey}"
    private const val OPENPULSE_ENDPOINT = "${hostUrl}/api/ingest"
    private const val PREFS_NAME = "openpulse_prefs"
    private const val PREF_DISTINCT_ID = "distinct_id"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var distinctId = "anon_android"
    private var appVersion = ""
    private var sdkInt = 0
    private var deviceModel = ""
    private var deviceManufacturer = ""

    /** Call once from Application.onCreate() */
    fun init(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        var id = prefs.getString(PREF_DISTINCT_ID, null)
        if (id.isNullOrBlank()) {
            id = "cs_android_" + UUID.randomUUID().toString().replace("-", "").take(12)
            prefs.edit().putString(PREF_DISTINCT_ID, id).apply()
        }
        distinctId = id
        appVersion = context.packageManager
            .getPackageInfo(context.packageName, 0).versionName ?: ""
        sdkInt = Build.VERSION.SDK_INT
        deviceModel = Build.MODEL ?: "unknown"
        deviceManufacturer = Build.MANUFACTURER ?: "unknown"

        track("app_open", mapOf(
            "version" to appVersion,
            "android_sdk" to sdkInt,
            "device_model" to "$deviceManufacturer $deviceModel",
            "path" to "/app"
        ))
    }

    fun track(event: String, properties: Map<String, Any?> = emptyMap()) {
        scope.launch {
            try {
                val payload = JSONObject().apply {
                    put("event", event)
                    put("distinctId", distinctId)
                    put("properties", JSONObject().apply {
                        put("app", "MyApp")
                        put("platform", "android")
                        put("os", "Android")
                        put("android_sdk", sdkInt)
                        put("device", "$deviceManufacturer $deviceModel")
                        put("app_version", appVersion)
                        put("timestamp", java.time.Instant.now().toString())
                        properties.forEach { (k, v) ->
                            when (v) {
                                null -> put(k, JSONObject.NULL)
                                is Boolean -> put(k, v)
                                is Int -> put(k, v)
                                is Long -> put(k, v)
                                is Float -> put(k, v.toDouble())
                                is Double -> put(k, v)
                                else -> put(k, v.toString())
                            }
                        }
                    })
                }
                val url = URL(OPENPULSE_ENDPOINT)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setRequestProperty("X-OpenPulse-Key", OPENPULSE_API_KEY)
                conn.doOutput = true
                conn.connectTimeout = 5000
                conn.readTimeout = 5000
                OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(payload.toString()) }
                conn.responseCode // trigger send
                conn.disconnect()
            } catch (_: Throwable) {
                // Fail silently — never degrade user experience
            }
        }
    }

    fun trackScreen(screen: String) = track("\$screen_view", mapOf("screen" to screen, "path" to "/$screen"))

    fun trackError(type: String, message: String?) = track("error_thrown", mapOf(
        "error_type" to type, "message" to (message ?: "unknown"), "path" to "/app"
    ))

    fun trackHeartbeat(screen: String = "/app") = track("\$heartbeat", mapOf("path" to screen))
}`,
        },
        {
          title: 'Internet Permission (AndroidManifest.xml)',
          description: 'Make sure your `AndroidManifest.xml` has internet permission (most apps already do):',
          language: 'xml',
          code: `<uses-permission android:name="android.permission.INTERNET" />`,
        },
      ],
      usage: {
        description: 'Call `OpenPulseAnalytics.init(this)` in your `Application.onCreate()`. This fires the initial `app_open` event and caches a persistent anonymous install ID:',
        language: 'kotlin',
        filename: 'MyApplication.kt',
        code: `package com.example.app

import android.app.Application
import com.example.app.analytics.OpenPulseAnalytics

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Initializes OpenPulse — fires app_open event, stores anonymous install ID
        OpenPulseAnalytics.init(this)

        // Optional: auto-report uncaught exceptions
        val default = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            OpenPulseAnalytics.trackError(
                type = throwable.javaClass.simpleName,
                message = throwable.message
            )
            default?.uncaughtException(thread, throwable)
        }
    }
}`,
      },
      tracking: {
        description: 'Track screen navigation, media playback, searches, and custom business events anywhere in your Activities or Fragments:',
        language: 'kotlin',
        filename: 'HomeActivity.kt',
        code: `import com.example.app.analytics.OpenPulseAnalytics

// 1. Track screen navigation
OpenPulseAnalytics.trackScreen("home")
OpenPulseAnalytics.trackScreen("player")

// 2. Track video / content playback
OpenPulseAnalytics.track("video_play", mapOf(
    "title" to "Inception",
    "provider" to "SuperStream",
    "quality" to "1080p",
    "path" to "/player"
))

// 3. Track search queries
OpenPulseAnalytics.track("search_query", mapOf(
    "query" to "action movies",
    "results_count" to 42,
    "path" to "/search"
))

// 4. Track extension/plugin installation
OpenPulseAnalytics.track("extension_installed", mapOf(
    "extension_name" to "SuperStream",
    "version" to 5,
    "path" to "/extensions"
))

// 5. Periodic active-user heartbeat (call every ~25 seconds for Realtime Users)
OpenPulseAnalytics.trackHeartbeat("/home")`,
      },
    },

    {
      id: 'nextjs',
      name: 'Next.js',
      category: 'web',
      platforms: ['Web', 'Edge', 'Node.js'],
      githubUrl: 'https://github.com/openpulse/openpulse-js',
      icon: (s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.87 17.56l-6.24-8.08v8.08H9.8V6.44h1.83l6.24 8.08V6.44h1.8v11.12h-1.8z" />
        </svg>
      ),
      installOptions: [
        {
          title: 'Option 1: npm / pnpm / yarn',
          description: 'Install the OpenPulse Web SDK package:',
          language: 'bash',
          code: `npm install @openpulse/web
# or pnpm add @openpulse/web
# or yarn add @openpulse/web`,
        },
      ],
      usage: {
        description: 'Wrap your Root Layout (`app/layout.tsx`) with the OpenPulse provider:',
        language: 'tsx',
        filename: 'app/layout.tsx',
        code: `import { OpenPulseProvider } from '@openpulse/web';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OpenPulseProvider
          appKey="${app.apiKey}"
          options={{
            host: "${hostUrl}",
            autoPageview: true,
            captureWebVitals: true
          }}
        >
          {children}
        </OpenPulseProvider>
      </body>
    </html>
  );
}`,
      },
      tracking: {
        description: 'Track custom business actions in client components:',
        language: 'tsx',
        filename: 'components/subscribe-btn.tsx',
        code: `'use client';
import { useOpenPulse } from '@openpulse/web';

export function SubscribeButton() {
  const { track } = useOpenPulse();

  return (
    <button
      onClick={() => {
        track('subscription_clicked', { plan: 'pro_annual', price: 99.00 });
      }}
    >
      Upgrade Now
    </button>
  );
}`,
      },
    },

    {
      id: 'electron',
      name: 'Electron',
      category: 'desktop',
      platforms: ['macOS', 'Windows', 'Linux'],
      githubUrl: 'https://github.com/openpulse/openpulse-electron',
      icon: (s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="#9FEAF9">
          <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 2.4c4.68 0 8.65 3.39 9.4 7.85-2.2-.6-4.66-.95-7.4-.95-4.48 0-8.31.95-11.2 2.46C3.92 7.03 7.66 2.4 12 2.4z" />
        </svg>
      ),
      installOptions: [
        {
          title: 'Option 1: Package Manager',
          language: 'bash',
          code: `npm install @openpulse/electron`,
        },
      ],
      usage: {
        description: 'Initialize in your Electron main process entrypoint (`main.js` or `main.ts`):',
        language: 'javascript',
        filename: 'src/main.js',
        code: `const { app } = require('electron');
const { OpenPulse } = require('@openpulse/electron');

app.whenReady().then(() => {
  OpenPulse.init({
    appKey: '${app.apiKey}',
    host: '${hostUrl}',
    trackAppLifecycle: true
  });
});`,
      },
      tracking: {
        description: 'Track desktop client sessions and user interactions:',
        language: 'javascript',
        code: `OpenPulse.track('desktop_window_focused', {
  screen: 'settings',
  version: app.getVersion()
});`,
      },
    },

    {
      id: 'flutter',
      name: 'Flutter',
      category: 'mobile',
      platforms: ['iOS', 'Android', 'macOS', 'Windows', 'Web'],
      githubUrl: 'https://github.com/openpulse/openpulse-flutter',
      icon: (s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="#54C5F8">
          <path d="M14.314 0L2.3 12 6 15.7 21.686 0zM14.314 12.314L8.3 18.329 12 22l9.686-9.686z" />
        </svg>
      ),
      installOptions: [
        {
          title: 'Option 1: Flutter pub',
          language: 'bash',
          code: `flutter pub add openpulse_flutter`,
        },
      ],
      usage: {
        description: 'Initialize in your `main()` function before `runApp()`:',
        language: 'dart',
        filename: 'lib/main.dart',
        code: `import 'package:flutter/material.dart';
import 'package:openpulse_flutter/openpulse_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await OpenPulse.init(
    '${app.apiKey}',
    InitOptions(host: '${hostUrl}')
  );

  runApp(const MyApp());
}`,
      },
      tracking: {
        description: 'Track custom analytics events:',
        language: 'dart',
        code: `OpenPulse.track('video_stream_played', {
  'channel_id': 'ch_901',
  'resolution': '4k'
});`,
      },
    },

    {
      id: 'react-native',
      name: 'React Native / Expo',
      category: 'mobile',
      platforms: ['iOS', 'Android', 'Web'],
      githubUrl: 'https://github.com/openpulse/openpulse-react-native',
      icon: (s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="#61DAFB">
          <ellipse cx="12" cy="12" rx="11" ry="4.2" fill="none" stroke="#61DAFB" strokeWidth="1.5" />
          <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)" fill="none" stroke="#61DAFB" strokeWidth="1.5" />
          <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)" fill="none" stroke="#61DAFB" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="2" fill="#61DAFB" />
        </svg>
      ),
      installOptions: [
        {
          title: 'Option 1: Expo / npm',
          language: 'bash',
          code: `npx expo install @openpulse/react-native
# or npm install @openpulse/react-native`,
        },
      ],
      usage: {
        description: 'Initialize inside your `App.tsx` entrypoint:',
        language: 'tsx',
        filename: 'App.tsx',
        code: `import { init } from '@openpulse/react-native';

init('${app.apiKey}', {
  host: '${hostUrl}'
});

export default function App() {
  return <NavigationContainer>...</NavigationContainer>;
}`,
      },
      tracking: {
        description: 'Track screen views and user actions:',
        language: 'tsx',
        code: `import { trackEvent } from '@openpulse/react-native';

trackEvent('user_signup_completed', {
  auth_provider: 'google',
  country: 'US'
});`,
      },
    },

    {
      id: 'python',
      name: 'Python',
      category: 'backend',
      platforms: ['FastAPI', 'Django', 'Flask', 'CLI'],
      githubUrl: 'https://github.com/openpulse/openpulse-python',
      icon: (s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="#3776AB">
          <path d="M11.9 0C5.7 0 6.1 2.7 6.1 2.7l.01 2.8h5.9v.8H3.8S0 5.8 0 12c0 6.2 3.3 6 3.3 6h2v-2.8s-.1-3.3 3.3-3.3h5.7s3.1.1 3.1-3V3s.5-3-5.5-3z" />
          <path d="M12.1 24c6.2 0 5.8-2.7 5.8-2.7l-.01-2.8h-5.9v-.8h8.2s3.8.5 3.8-5.7c0-6.2-3.3-6-3.3-6h-2v2.8s.1 3.3-3.3 3.3H9.7s-3.1-.1-3.1 3V21s-.5 3 5.5 3z" fill="#FFD43B" />
        </svg>
      ),
      installOptions: [
        {
          title: 'Option 1: pip / poetry',
          language: 'bash',
          code: `pip install openpulse
# or poetry add openpulse`,
        },
      ],
      usage: {
        description: 'Initialize the OpenPulse client:',
        language: 'python',
        filename: 'main.py',
        code: `from openpulse import OpenPulse

client = OpenPulse(
    app_key="${app.apiKey}",
    host="${hostUrl}"
)`,
      },
      tracking: {
        description: 'Track backend events and API requests:',
        language: 'python',
        code: `client.track(
    event="payment_succeeded",
    distinct_id="usr_99182",
    properties={
        "amount": 49.99,
        "currency": "USD",
        "plan": "team_monthly"
    }
)`,
      },
    },

    {
      id: 'dotnet',
      name: '.NET / MAUI',
      category: 'desktop',
      platforms: ['Windows', 'macOS', 'iOS', 'Android'],
      githubUrl: 'https://github.com/openpulse/openpulse-dotnet',
      icon: (s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="#512BD4">
          <circle cx="12" cy="12" r="11" stroke="#512BD4" strokeWidth="2" />
        </svg>
      ),
      installOptions: [
        {
          title: 'Option 1: NuGet Package',
          language: 'bash',
          code: `dotnet add package OpenPulse.Maui`,
        },
      ],
      usage: {
        description: 'Initialize in `MauiProgram.cs`:',
        language: 'csharp',
        filename: 'MauiProgram.cs',
        code: `using OpenPulse;

public static MauiApp CreateMauiApp()
{
    var builder = MauiApp.CreateBuilder();
    builder
        .UseMauiApp<App>()
        .UseOpenPulse("${app.apiKey}", "${hostUrl}");

    return builder.Build();
}`,
      },
      tracking: {
        description: 'Track events in views or viewmodels:',
        language: 'csharp',
        code: `OpenPulseClient.Track("button_click", new { Screen = "Settings" });`,
      },
    },

    {
      id: 'unity',
      name: 'Unity Engine',
      category: 'game',
      platforms: ['PC', 'Mobile', 'Console', 'VR'],
      githubUrl: 'https://github.com/openpulse/openpulse-unity',
      icon: (s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12 2L2 8v8l10 6 10-6V8L12 2z" />
        </svg>
      ),
      installOptions: [
        {
          title: 'Option 1: Unity Package Manager',
          description: 'Add package from git URL in Unity Package Manager:',
          language: 'text',
          code: `https://github.com/openpulse/openpulse-unity.git`,
        },
      ],
      usage: {
        description: 'Initialize in a startup GameObject script:',
        language: 'csharp',
        filename: 'GameManager.cs',
        code: `using OpenPulse;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    void Awake()
    {
        OpenPulseClient.Initialize("${app.apiKey}", "${hostUrl}");
    }
}`,
      },
      tracking: {
        description: 'Track gameplay progress and level analytics:',
        language: 'csharp',
        code: `OpenPulseClient.Track("level_completed", new Dictionary<string, object> {
    { "level_num", 5 },
    { "score", 9820 }
});`,
      },
    },

    {
      id: 'cdn',
      name: 'HTML / CDN Script Tag',
      category: 'web',
      platforms: ['Webflow', 'WordPress', 'Shopify', 'Static HTML'],
      githubUrl: 'https://github.com/openpulse/openpulse-js',
      icon: (s = 16) => (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="#38bdf8">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#38bdf8" strokeWidth="2" fill="none" />
        </svg>
      ),
      installOptions: [
        {
          title: 'Drop into your <head> tag',
          description: 'Embed this script tag on any website for automatic pageview and web vitals tracking:',
          language: 'html',
          code: `<!-- OpenPulse Telemetry Script -->
<script
  defer
  src="${hostUrl}/v1/pulse.min.js"
  data-api-key="${app.apiKey}"
  data-endpoint="${hostUrl}/api/ingest"
  data-auto-track="true"
></script>`,
        },
      ],
      usage: {
        description: 'Optional manual event tracking via the global `openpulse` object:',
        language: 'javascript',
        code: `window.openpulse && window.openpulse.track('lead_form_submitted', {
  form_id: 'contact_us',
  company_size: '50-100'
});`,
      },
      tracking: {
        description: 'Automatic click & engagement tracking with data attributes:',
        language: 'html',
        code: `<button data-pulse-event="newsletter_signup" data-pulse-location="footer">
  Subscribe
</button>`,
      },
    },
  ];

  const currentDoc = frameworks.find((f) => f.id === selectedFrameworkId) || frameworks[0];

  return (
    <div className="aptabase-instructions-container">
      {/* ── Top Header Section ────────────────────────────────────────────── */}
      <div className="aptabase-header-section">
        <h1 className="aptabase-main-title">Instructions</h1>
        <p className="aptabase-subtitle">Instrument your app with our SDK</p>
      </div>

      {/* ── App Key Box (Exact Aptabase styling) ──────────────────────────── */}
      <div className="aptabase-appkey-card">
        <div className="aptabase-appkey-header">
          <span>App Key for </span>
          <strong className="aptabase-appkey-appname">{app.name}</strong>
        </div>

        <div className="aptabase-appkey-row">
          <span className="aptabase-appkey-val">{app.apiKey}</span>
          <button
            type="button"
            className="aptabase-appkey-copy-btn"
            onClick={() => copyText(app.apiKey)}
            title="Copy App Key"
          >
            {copiedKey ? (
              <Check size={16} color="#10b981" />
            ) : (
              <Copy size={16} color="#a1a1aa" />
            )}
          </button>
        </div>

        <div className="aptabase-appkey-footer">
          It is used by the SDK to identify your app
        </div>
      </div>

      {/* ── Framework Selector Dropdown Bar & GitHub Link ──────────────────── */}
      <div className="aptabase-sdk-selector-bar">
        {/* Dropdown Menu Trigger */}
        <div className="aptabase-dropdown-wrap">
          <button
            type="button"
            className="aptabase-dropdown-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="aptabase-dropdown-left">
              {currentDoc.icon(16)}
              <span className="aptabase-dropdown-label">{currentDoc.name}</span>
            </span>
            <ChevronDown
              size={14}
              className={`aptabase-chevron ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="aptabase-dropdown-backdrop"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="aptabase-dropdown-menu">
                {frameworks.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`aptabase-framework-option ${f.id === currentDoc.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedFrameworkId(f.id);
                      setDropdownOpen(false);
                    }}
                  >
                    <span className="aptabase-option-icon">{f.icon(16)}</span>
                    <span className="aptabase-option-name">{f.name}</span>
                    {f.id === currentDoc.id && (
                      <Check size={14} color="#10b981" style={{ marginLeft: 'auto' }} />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* View on GitHub Link */}
        <a
          href={currentDoc.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="aptabase-github-link"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>View on GitHub</span>
        </a>
      </div>

      {/* ── SDK Title & Platform Tags ─────────────────────────────────────── */}
      <div className="aptabase-sdk-header">
        <h2 className="aptabase-sdk-title">
          {currentDoc.name} SDK for OpenPulse
        </h2>

        <div className="aptabase-platforms-row">
          <span className="aptabase-platforms-label">Platforms</span>
          <div className="aptabase-platforms-badges">
            {currentDoc.platforms.map((p, idx) => (
              <span key={idx} className="aptabase-platform-pill">
                {p}
              </span>
            ))}
          </div>
        </div>

        <p className="aptabase-sdk-desc">
          OpenPulse is an Open Source, High-Velocity Telemetry and Analytics platform for Mobile, Desktop, and Web Apps.
        </p>
      </div>

      {/* ── Installation Options ─────────────────────────────────────────── */}
      <div className="aptabase-section">
        {currentDoc.installOptions.map((opt, i) => (
          <div key={i} className="aptabase-install-block">
            <h3 className="aptabase-option-title">{opt.title}</h3>
            {opt.description && (
              <p className="aptabase-option-desc">{opt.description}</p>
            )}

            <div className="aptabase-code-block">
              <button
                type="button"
                className="aptabase-code-copy-btn"
                onClick={() => copyText(opt.code, `install-${i}`)}
              >
                {copiedSnippetIdx === `install-${i}` ? (
                  <>
                    <Check size={13} color="#10b981" />
                    <span style={{ color: '#10b981' }}>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <pre className="aptabase-code-content">{opt.code}</pre>
            </div>
          </div>
        ))}
      </div>

      {/* ── Usage / Initialization ────────────────────────────────────────── */}
      <div className="aptabase-section">
        <h3 className="aptabase-section-heading">Usage</h3>
        <p className="aptabase-section-text">
          First, you need to get your <span className="aptabase-inline-code">App Key</span> from OpenPulse, you can find it in the card at the top of this page.
        </p>
        <p className="aptabase-section-text">
          {currentDoc.usage.description}
        </p>

        <div className="aptabase-code-block">
          <button
            type="button"
            className="aptabase-code-copy-btn"
            onClick={() => copyText(currentDoc.usage.code, 'usage')}
          >
            {copiedSnippetIdx === 'usage' ? (
              <>
                <Check size={13} color="#10b981" />
                <span style={{ color: '#10b981' }}>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
          <pre className="aptabase-code-content">{currentDoc.usage.code}</pre>
        </div>
      </div>

      {/* ── Tracking Events ──────────────────────────────────────────────── */}
      <div className="aptabase-section">
        <h3 className="aptabase-section-heading">Tracking Events</h3>
        <p className="aptabase-section-text">
          {currentDoc.tracking.description}
        </p>

        <div className="aptabase-code-block">
          <button
            type="button"
            className="aptabase-code-copy-btn"
            onClick={() => copyText(currentDoc.tracking.code, 'tracking')}
          >
            {copiedSnippetIdx === 'tracking' ? (
              <>
                <Check size={13} color="#10b981" />
                <span style={{ color: '#10b981' }}>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
          <pre className="aptabase-code-content">{currentDoc.tracking.code}</pre>
        </div>
      </div>

      {/* ── Live Connection Verifier ──────────────────────────────────────── */}
      <div className="aptabase-verifier-card">
        <div className="aptabase-verifier-left">
          <div className="aptabase-verifier-title-row">
            <Zap size={16} color="#38bdf8" />
            <span className="aptabase-verifier-title">Verify Live SDK Ingestion</span>
          </div>
          <p className="aptabase-verifier-desc">
            Test whether OpenPulse is receiving telemetry events with this app key right now.
          </p>
        </div>

        <div className="aptabase-verifier-right">
          <button
            type="button"
            disabled={testing}
            onClick={handleSendTestEvent}
            className="aptabase-test-btn"
          >
            {testing ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Sending Test Event…</span>
              </>
            ) : (
              <>
                <Play size={13} fill="#09090b" />
                <span>Send Test Event</span>
              </>
            )}
          </button>
        </div>
      </div>

      {testResult && (
        <div
          className={`aptabase-test-banner ${testResult.success ? 'success' : 'error'}`}
        >
          {testResult.success ? (
            <CheckCircle2 size={16} color="#10b981" />
          ) : (
            <AlertCircle size={16} color="#ef4444" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}
    </div>
  );
}
