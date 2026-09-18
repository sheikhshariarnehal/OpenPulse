import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    const workspaces = await db.getWorkspacesForUser(user.id);
    if (workspaces.length > 0) {
      redirect(`/${workspaces[0].slug}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-[#fafafa] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-[#38bdf8]/10 via-[#10b981]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-14 border-b border-[#27272a] flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#38bdf8]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="font-semibold tracking-tight text-sm">OpenPulse</span>
          <span className="text-[10px] bg-[#18181b] text-[#a1a1aa] px-2 py-0.5 rounded border border-[#27272a] font-mono">v1.4.2</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs text-[#a1a1aa] hover:text-[#fafafa] transition-colors px-3 py-1.5 rounded-md hover:bg-[#18181b]"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-xs bg-[#fafafa] text-[#09090b] font-semibold px-3 py-1.5 rounded-md hover:bg-[#e4e4e7] transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center z-10 max-w-4xl mx-auto py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#27272a] bg-[#121215] text-[11px] text-[#a1a1aa] mb-6">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span>Next.js 16 + ClickHouse Telemetry Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#fafafa] max-w-2xl leading-tight">
          High-Velocity Telemetry & Developer Analytics
        </h1>

        <p className="mt-4 text-sm sm:text-base text-[#a1a1aa] max-w-xl">
          Self-hostable, privacy-first analytics for all your applications. Connect your <span className="text-[#38bdf8] font-medium">Web</span>, <span className="text-[#10b981] font-medium">Android</span>, and <span className="text-[#f59e0b] font-medium">Desktop</span> apps in under 2 minutes.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/signup"
            className="w-full sm:w-auto text-xs sm:text-sm bg-[#fafafa] text-[#09090b] font-semibold px-6 py-2.5 rounded-md hover:bg-[#e4e4e7] transition-all shadow-lg"
          >
            Create Free Account
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-xs sm:text-sm bg-[#121215] border border-[#27272a] text-[#d4d4d8] font-medium px-6 py-2.5 rounded-md hover:bg-[#18181b] hover:border-[#3f3f46] transition-all"
          >
            Sign In with Demo Account
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left w-full">
          <div className="p-4 rounded-lg bg-[#0c0c0e] border border-[#27272a]">
            <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#38bdf8] mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/></svg>
            </div>
            <h3 className="text-xs font-semibold text-[#fafafa]">Web Apps</h3>
            <p className="text-[11px] text-[#71717a] mt-1">Next.js, React, Vue, Svelte, and CDN script tags with automated Web Vitals.</p>
          </div>

          <div className="p-4 rounded-lg bg-[#0c0c0e] border border-[#27272a]">
            <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#10b981] mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            </div>
            <h3 className="text-xs font-semibold text-[#fafafa]">Android Apps</h3>
            <p className="text-[11px] text-[#71717a] mt-1">Kotlin, Java, and Jetpack Compose SDK with automatic crash and session tracking.</p>
          </div>

          <div className="p-4 rounded-lg bg-[#0c0c0e] border border-[#27272a]">
            <div className="w-8 h-8 rounded bg-[#18181b] border border-[#27272a] flex items-center justify-center text-[#f59e0b] mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <h3 className="text-xs font-semibold text-[#fafafa]">Desktop Apps</h3>
            <p className="text-[11px] text-[#71717a] mt-1">Electron, Tauri, .NET/C#, and macOS Swift SDKs with sub-ms local event buffering.</p>
          </div>
        </div>
      </main>

      <footer className="h-12 border-t border-[#27272a] flex items-center justify-between px-6 text-[11px] text-[#71717a]">
        <span>OpenPulse Telemetry Platform</span>
        <span>Apache 2.0 Open Source</span>
      </footer>
    </div>
  );
}
