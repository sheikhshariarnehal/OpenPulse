'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  ChevronsUpDown,
  Plus,
  Radio,
  FileCode,
  AlertTriangle,
  Server,
  Check,
  LogOut,
  AppWindow,
  BarChart2,
  Users
} from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  tier: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export function DashboardSidebar({
  user,
  workspaces,
  currentSlug
}: {
  user: User;
  workspaces: Workspace[];
  currentSlug: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [wsPopoverOpen, setWsPopoverOpen] = useState(false);
  const [createWsModalOpen, setCreateWsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsSlug, setNewWsSlug] = useState('');
  const [creatingWs, setCreatingWs] = useState(false);

  const currentWorkspace = workspaces.find(w => w.slug === currentSlug) || workspaces[0];

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setCreatingWs(true);

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWsName, slug: newWsSlug })
      });
      const data = await res.json();
      if (res.ok && data.workspace) {
        setCreateWsModalOpen(false);
        setNewWsName('');
        setNewWsSlug('');
        router.push(`/${data.workspace.slug}`);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingWs(false);
    }
  }

  return (
    <>
      <aside className="sidebar">
        {/* Workspace Switcher */}
        <div className="ws-switcher">
          <button
            onClick={() => setWsPopoverOpen(!wsPopoverOpen)}
            className="ws-switcher-trigger"
          >
            <div className="ws-avatar">
              <Activity style={{ width: '15px', height: '15px' }} />
            </div>
            <div className="ws-meta">
              <span className="ws-name">{currentWorkspace?.name || 'Workspace'}</span>
              <span className="ws-tier">{currentWorkspace?.tier || 'Pro Plan'}</span>
            </div>
            <ChevronsUpDown className="ws-chevrons" style={{ width: '14px', height: '14px' }} />
          </button>

          {/* Popover Dropdown */}
          {wsPopoverOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setWsPopoverOpen(false)}
              />
              <div className="ws-popover">
                <div className="ws-section-label">Your Workspaces</div>
                {workspaces.map(ws => {
                  const isActive = ws.slug === currentSlug;
                  return (
                    <Link
                      key={ws.id}
                      href={`/${ws.slug}`}
                      onClick={() => setWsPopoverOpen(false)}
                      className={`ws-item ${isActive ? 'active' : ''}`}
                    >
                      <div className="ws-item-badge">
                        {ws.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {ws.name}
                      </span>
                      {isActive && <Check style={{ width: '14px', height: '14px', color: '#38bdf8' }} />}
                    </Link>
                  );
                })}

                <div className="ws-divider" />

                <button
                  onClick={() => {
                    setWsPopoverOpen(false);
                    setCreateWsModalOpen(true);
                  }}
                  className="ws-create-trigger"
                >
                  <Plus style={{ width: '14px', height: '14px' }} />
                  <span>Create Workspace</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation Section: Telemetry */}
        <div className="nav-section">
          <div className="nav-section-title">Telemetry Platform</div>
          <ul className="nav-list">
            <li>
              <Link
                href={`/${currentSlug}`}
                className={`nav-item ${pathname === `/${currentSlug}` ? 'active' : ''}`}
              >
                <Activity />
                <span>Overview</span>
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentSlug}/stream`}
                className={`nav-item ${pathname === `/${currentSlug}/stream` ? 'active' : ''}`}
              >
                <Radio />
                <span>Live Stream</span>
                <span className="nav-badge live">LIVE</span>
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentSlug}/apps`}
                className={`nav-item ${pathname.startsWith(`/${currentSlug}/apps`) ? 'active' : ''}`}
              >
                <AppWindow />
                <span>Connected Apps</span>
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentSlug}/docs/connect`}
                className={`nav-item ${pathname.startsWith(`/${currentSlug}/docs/connect`) ? 'active' : ''}`}
              >
                <FileCode style={{ color: '#38bdf8' }} />
                <span style={{ color: '#38bdf8', fontWeight: 500 }}>Connect Your App</span>
                <span className="nav-badge" style={{ color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)' }}>DOCS</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Navigation Section: Analytics */}
        <div className="nav-section">
          <div className="nav-section-title">Analytics</div>
          <ul className="nav-list">
            <li>
              <Link
                href={`/${currentSlug}/analytics`}
                className={`nav-item ${pathname === `/${currentSlug}/analytics` ? 'active' : ''}`}
              >
                <BarChart2 />
                <span>Overview</span>
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentSlug}/analytics/users`}
                className={`nav-item ${pathname.startsWith(`/${currentSlug}/analytics/users`) ? 'active' : ''}`}
              >
                <Users />
                <span>Users</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Navigation Section: Observability */}
        <div className="nav-section">
          <div className="nav-section-title">Observability</div>
          <ul className="nav-list">
            <li>
              <Link href={`/${currentSlug}#errors`} className="nav-item">
                <AlertTriangle style={{ color: '#f43f5e' }} />
                <span>Error Tracking</span>
                <span className="nav-badge" style={{ color: '#f43f5e' }}>14</span>
              </Link>
            </li>
            <li>
              <Link href={`/${currentSlug}#nodes`} className="nav-item">
                <Server />
                <span>ClickHouse Nodes</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="cluster-status-pill">
            <div className="status-indicator">
              <span className="status-dot" />
              <span>ClickHouse Cluster</span>
            </div>
            <span className="mono" style={{ fontSize: '10px', color: '#10b981' }}>8/8 UP</span>
          </div>

          <div className="user-profile-row">
            <div className="user-avatar">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name-text">{user.name}</span>
              <span className="user-email-text">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}
            >
              <LogOut style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </aside>

      {/* CREATE WORKSPACE MODAL */}
      {createWsModalOpen && (
        <div className="dialog-overlay">
          <div className="dialog-content">
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em' }}>Create Workspace</h2>
              <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                Workspaces isolate telemetry data, projects, API keys, and dedicated ClickHouse partitions.
              </p>
            </div>

            <form onSubmit={handleCreateWorkspace}>
              <div className="form-group">
                <label className="form-label-text">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => {
                    setNewWsName(e.target.value);
                    setNewWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  placeholder="Acme Production"
                  className="form-text-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label-text">Slug Identifier</label>
                <input
                  type="text"
                  required
                  value={newWsSlug}
                  onChange={(e) => setNewWsSlug(e.target.value)}
                  placeholder="acme-production"
                  className="form-text-input mono"
                />
              </div>

              <div className="form-group">
                <label className="form-label-text">Storage Tier</label>
                <select className="form-text-input">
                  <option>Dedicated ClickHouse Shard (Default)</option>
                  <option>Multi-Tenant Partition (Free)</option>
                  <option>Enterprise Replicated Cluster</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setCreateWsModalOpen(false)}
                  className="btn-dialog-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWs}
                  className="btn-dialog-submit"
                >
                  {creatingWs ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
