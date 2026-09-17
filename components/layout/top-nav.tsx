'use client';

import Link from 'next/link';
import { Search, Calendar, Plus } from 'lucide-react';

export function TopNav({
  workspaceName,
  workspaceSlug,
  currentViewTitle = 'Analytics'
}: {
  workspaceName: string;
  workspaceSlug: string;
  currentViewTitle?: string;
}) {
  return (
    <header className="top-navbar">
      {/* Breadcrumbs */}
      <div className="breadcrumb-row">
        <span className="crumb-dim">Workspaces</span>
        <span className="crumb-sep">/</span>
        <Link href={`/${workspaceSlug}`} className="crumb-dim">
          {workspaceName}
        </Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-active">{currentViewTitle}</span>
      </div>

      {/* Global Actions */}
      <div className="navbar-controls">
        <button
          onClick={() => {
            const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
            document.dispatchEvent(e);
          }}
          className="search-cmd-btn"
        >
          <Search style={{ width: '13px', height: '13px' }} />
          <span>Search telemetry...</span>
          <span className="kbd-shortcut">⌘K</span>
        </button>

        <button className="date-range-btn">
          <Calendar style={{ width: '13px', height: '13px', color: '#71717a' }} />
          <span>Last 24 Hours</span>
        </button>

        <Link
          href={`/${workspaceSlug}/docs/connect`}
          className="action-btn-primary"
        >
          <Plus style={{ width: '13px', height: '13px' }} />
          <span>Connect App</span>
        </Link>
      </div>
    </header>
  );
}
