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
  Users,
  CreditCard,
  Sun
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  function getUserInitials(name: string) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function formatTier(tier?: string) {
    if (!tier) return 'Hobby';
    if (tier === 'Dedicated ClickHouse' || tier.toLowerCase().includes('clickhouse')) return 'Hobby';
    if (tier.toLowerCase().includes('enterprise')) return 'Enterprise';
    if (tier.toLowerCase().includes('pro')) return 'Pro';
    return tier;
  }

  return (
    <>
      <aside className="sidebar">
        {/* Workspace Switcher */}
        <div className="ws-switcher">
          <button
            onClick={() => setWsPopoverOpen(!wsPopoverOpen)}
            className="ws-switcher-trigger"
            aria-label="Switch workspace"
          >
            <div className="ws-avatar" />
            <span className="ws-name">{currentWorkspace?.name || 'Workspace'}</span>
            <div className="ws-right">
              <span className="ws-badge">{formatTier(currentWorkspace?.tier)}</span>
              <ChevronsUpDown className="ws-chevrons" style={{ width: '13px', height: '13px' }} />
            </div>
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
                      <div className="ws-item-badge" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {ws.name}
                      </span>
                      <span className="ws-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>{formatTier(ws.tier)}</span>
                      {isActive && <Check style={{ width: '13px', height: '13px', color: '#38bdf8', marginLeft: '2px' }} />}
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
          {userMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="user-menu-popover">
                <div className="user-menu-header">
                  <div className="user-menu-header-info">
                    <span className="user-menu-signed-label">Signed in as</span>
                    <span className="user-menu-email-text">{user.email}</span>
                  </div>
                  <button
                    type="button"
                    className="user-menu-icon-btn"
                    title="Theme"
                  >
                    <Sun style={{ width: '13px', height: '13px' }} />
                  </button>
                </div>

                <div className="user-menu-divider" />

                <Link
                  href={`/${currentSlug}/settings`}
                  onClick={() => setUserMenuOpen(false)}
                  className="user-menu-item"
                >
                  <CreditCard style={{ width: '14px', height: '14px' }} />
                  <span>Billing & Profile</span>
                </Link>

                <div className="user-menu-divider" />

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="user-menu-item user-menu-logout"
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`user-profile-trigger ${userMenuOpen ? 'active' : ''}`}
            aria-label="User menu"
          >
            <div className="user-avatar-gradient">
              {getUserInitials(user.name)}
            </div>
            <span className="user-profile-name">{user.name}</span>
          </button>
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
