# Admin Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the frontend to integrate all admin-facing API endpoints — Role/Permissions management, User management, Category/Tag CRUD, Artwork moderation, and System Settings.

**Architecture:** Two files change: `src/api.ts` gets new API objects (RoleAPI, PermissionsAPI) and expanded existing ones; `src/pages/AdminDashboard.tsx` is rewritten from a single pending-artworks view into an 8-tab admin panel. Each tab is a self-contained section rendered by local state.

**Tech Stack:** React 19, Axios, react-hot-toast, react-router-dom, inline styles matching existing glass-morphism theme. No new dependencies.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/api.ts` | Modify | Add RoleAPI, PermissionsAPI. Expand CategoryAPI, TagAPI, ArtWorkAPI, ProfileAPI |
| `src/pages/AdminDashboard.tsx` | Rewrite | 8-tab admin panel with all admin sections |

---

## Task 1: Add RoleAPI and PermissionsAPI to api.ts

**Files:**
- Modify: `src/api.ts` (after line 149, before the closing of the file)

- [ ] **Step 1: Add RoleAPI object**

Add after the `SystemSettingAPI` block at the end of `src/api.ts`:

```typescript
// === Role ===
export const RoleAPI = {
  getAll: () => api.get('/api/Role'),
  create: (roleName: string) => api.post(`/api/Role/${encodeURIComponent(roleName)}`),
  delete: (roleName: string) => api.delete(`/api/Role/${encodeURIComponent(roleName)}`),
  update: (oldName: string, newName: string) => api.put(`/api/Role/update-role/${encodeURIComponent(oldName)}/${encodeURIComponent(newName)}`),
  assignRole: (userId: string, roleName: string) => api.post(`/api/Role/assign-role/${userId}/${encodeURIComponent(roleName)}`),
  unassignRole: (userId: string, roleName: string) => api.delete(`/api/Role/unassign-role/${userId}/${encodeURIComponent(roleName)}`),
  assignRoles: (userId: string, roles: string[]) => api.post(`/api/Role/assign-roles/${userId}`, roles),
  unassignRoles: (userId: string, roles: string[]) => api.post(`/api/Role/unassign-roles/${userId}`, roles),
  removeAllRoles: (userId: string) => api.delete(`/api/Role/remove-all-roles/${userId}`),
  getUserRoles: (userId: string) => api.get(`/api/Role/user-roles/${userId}`),
  userHasRole: (userId: string, roleName: string) => api.get(`/api/Role/user-has-role/${userId}/${encodeURIComponent(roleName)}`),
};
```

- [ ] **Step 2: Add PermissionsAPI object**

Add after the `RoleAPI` block:

```typescript
// === Permissions ===
export const PermissionsAPI = {
  getAll: () => api.get('/api/Permissions'),
  getByRole: (roleId: string) => api.get(`/api/Permissions/role/${roleId}`),
  check: (roleName: string, permissionName: string) => api.get('/api/Permissions/check', { params: { roleName, permissionName } }),
  assign: (roleId: string, permission: string) => api.post('/api/Permissions/assign', null, { params: { roleId, permission } }),
  remove: (roleId: string, permission: string) => api.delete('/api/Permissions/remove', { params: { roleId, permission } }),
  assignBulk: (data: { roleId: string; permissions: string[] }) => api.post('/api/Permissions/assign-bulk', data),
  removeBulk: (data: { roleId: string; permissions: string[] }) => api.post('/api/Permissions/remove-bulk', data),
  reset: (roleId: string) => api.delete(`/api/Permissions/reset/${roleId}`),
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx tsc --noEmit`
Expected: No new errors from the additions.

- [ ] **Step 4: Commit**

```bash
git add src/api.ts
git commit -m "feat: add RoleAPI and PermissionsAPI to api layer"
```

---

## Task 2: Expand existing API objects in api.ts

**Files:**
- Modify: `src/api.ts` (CategoryAPI at lines 97-100, TagAPI at lines 103-106, ArtWorkAPI at lines 63-70, ProfileAPI at lines 109-113)

- [ ] **Step 1: Expand CategoryAPI**

Replace the existing `CategoryAPI` block (lines 97-100) with:

```typescript
// === Category ===
export const CategoryAPI = {
  getAll: (params?: any) => api.get('/api/Category', { params }),
  getDropdown: () => api.get('/api/Category/dropdown'),
  create: (data: FormData) => api.post('/api/Category', data),
  update: (id: number, data: FormData) => api.put(`/api/Category/${id}`, data),
  delete: (id: number) => api.delete(`/api/Category/${id}`),
  restore: (id: number) => api.put(`/api/Category/${id}/restore`),
  getAdminDetail: (id: number, ignoreQueryFilter = false) => api.get(`/api/Category/${id}/admin`, { params: { ignoreQueryFilter } }),
  getForUpdate: (id: number) => api.get(`/api/Category/${id}/update`),
  getStats: () => api.get('/api/Category/stats'),
  getArtworksCount: () => api.get('/api/Category/artworks-count'),
  checkName: (name: string) => api.get('/api/Category/check-name', { params: { name } }),
};
```

- [ ] **Step 2: Expand TagAPI**

Replace the existing `TagAPI` block (lines 103-106) with:

```typescript
// === Tags ===
export const TagAPI = {
  getAll: (searchTerm?: string) => api.get('/api/Tag', { params: { searchTerm } }),
  getDropdown: () => api.get('/api/Tag/dropdown'),
  create: (data: { name: string }) => api.post('/api/Tag', data),
  update: (id: number, data: { name: string }) => api.put(`/api/Tag/${id}`, data),
  delete: (id: number) => api.delete(`/api/Tag/${id}`),
  restore: (id: number) => api.put(`/api/Tag/${id}/restore`),
  getAdminDetail: (id: number, ignoreQueryFilter = false) => api.get(`/api/Tag/${id}/admin`, { params: { ignoreQueryFilter } }),
  getForUpdate: (id: number) => api.get(`/api/Tag/${id}/update`),
  getDeleted: () => api.get('/api/Tag/deleted'),
  checkName: (name: string) => api.get('/api/Tag/check-name', { params: { name } }),
  getUsageCount: (id: number) => api.get(`/api/Tag/${id}/usage-count`),
  getUsage: () => api.get('/api/Tag/usage'),
};
```

- [ ] **Step 3: Expand ArtWorkAPI**

Replace the existing `ArtWorkAPI` block (lines 63-70) with:

```typescript
// === ArtWork ===
export const ArtWorkAPI = {
  getAll: (params?: any) => api.get('/api/ArtWork', { params }),
  getById: (id: number | string) => api.get(`/api/ArtWork/${id}`),
  getPending: (params?: any) => api.get('/api/ArtWork/pending', { params }),
  getRejected: (params?: any) => api.get('/api/ArtWork/rejected', { params }),
  getDeleted: (params?: any) => api.get('/api/ArtWork/deleted', { params }),
  create: (data: FormData) => api.post('/api/ArtWork', data),
  update: (id: number, data: any) => api.put(`/api/ArtWork/${id}`, data),
  delete: (id: number) => api.delete(`/api/ArtWork/${id}`),
  restore: (id: number) => api.post(`/api/ArtWork/${id}/restore`),
  approve: (id: number | string) => api.post(`/api/ArtWork/${id}/approve`),
  reject: (id: number | string) => api.post(`/api/ArtWork/${id}/reject`),
  getAdminDetail: (id: number) => api.get(`/api/ArtWork/${id}/admin`),
  getForUpdate: (id: number) => api.get(`/api/ArtWork/${id}/update`),
  getStats: (artistId?: string) => api.get('/api/ArtWork/stats', { params: { artistId } }),
  isTitleAvailable: (title: string) => api.get('/api/ArtWork/is-title-available', { params: { title } }),
  getAuctionStatuses: () => api.get('/api/ArtWork/auction-status'),
};
```

- [ ] **Step 4: Expand ProfileAPI**

Replace the existing `ProfileAPI` block (lines 109-113) with:

```typescript
// === Profile / Users ===
export const ProfileAPI = {
  getMyProfile: () => api.get('/my-profile'),
  getArtists: (params?: any) => api.get('/artists', { params }),
  getBuyers: (term?: string) => api.get('/buyers', { params: { term } }),
  getAdmins: () => api.get('/admins'),
  getDeleted: (term?: string) => api.get('/deleted', { params: { term } }),
  approveArtist: (artistId: string) => api.put(`/${artistId}/approve`),
  rejectArtist: (artistId: string) => api.put(`/${artistId}/reject`),
  updateProfile: (data: any) => api.put('/update-profile', data),
  updateProfileImage: (data: FormData) => api.put('/update-profile-image', data),
  deleteProfile: () => api.delete('/delete-profile'),
  adminUpdateUser: (userId: string, data: any) => api.put(`/${userId}`, data),
  adminDeleteUser: (userId: string) => api.delete(`/${userId}`),
  restoreUser: (userId: string) => api.put(`/${userId}/restore`),
  blockUser: (userId: string) => api.put(`/${userId}/block`),
  unblockUser: (userId: string) => api.put(`/${userId}/unblock`),
  getArtistStatuses: () => api.get('/artist-status'),
};
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 6: Commit**

```bash
git add src/api.ts
git commit -m "feat: expand CategoryAPI, TagAPI, ArtWorkAPI, ProfileAPI with all endpoints"
```

---

## Task 3: Rewrite AdminDashboard — Tab shell + Pending Artworks tab

**Files:**
- Modify: `src/pages/AdminDashboard.tsx` (full rewrite)

This task replaces the entire file with the tabbed layout shell and re-implements the existing Pending Artworks tab. Subsequent tasks add the remaining tabs.

- [ ] **Step 1: Rewrite AdminDashboard.tsx with tab shell and Pending Artworks**

Replace the entire contents of `src/pages/AdminDashboard.tsx` with:

```tsx
import { useEffect, useState } from 'react';
import { ArtWorkAPI, ProfileAPI, RoleAPI, PermissionsAPI, CategoryAPI, TagAPI, SystemSettingAPI } from '../api';
import toast from 'react-hot-toast';
import { fixImageUrl } from './Home';

const TABS = [
  'Pending Artworks',
  'Rejected/Deleted',
  'Users',
  'Roles',
  'Permissions',
  'Categories',
  'Tags',
  'Settings',
] as const;

type Tab = typeof TABS[number];

const panelStyle: React.CSSProperties = {
  background: 'rgba(25, 33, 48, 0.6)',
  borderRadius: '16px',
  padding: '2rem',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem 1rem',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  color: '#94a3b8',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

const smallBtnStyle: React.CSSProperties = {
  padding: '0.35rem 0.75rem',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: 600,
  fontFamily: 'inherit',
};

// ─── Pending Artworks ───

function PendingArtworksTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await ArtWorkAPI.getPending();
      const data = res.data?.data?.items || res.data?.items || [];
      setItems(data);
    } catch { /* interceptor handles */ } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const approve = async (id: number) => {
    try { await ArtWorkAPI.approve(id); toast.success('Artwork approved'); fetch(); } catch {}
  };
  const reject = async (id: number) => {
    try { await ArtWorkAPI.reject(id); toast.success('Artwork rejected'); fetch(); } catch {}
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div style={panelStyle}>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>Pending Artworks</h3>
      {items.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No pending artworks.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {items.map(art => (
            <div key={art.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
              <img src={fixImageUrl(art.mainImage || art.images?.[0]?.name)} alt={art.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{art.title}</h4>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>by {art.artistName}</p>
                <p style={{ margin: '0 0 1rem 0', color: '#10b981', fontWeight: 'bold' }}>${art.initialPrice}</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => approve(art.id)} className="bid-btn" style={{ flex: 1, background: '#10b981', padding: '0.5rem' }}>Approve</button>
                  <button onClick={() => reject(art.id)} className="bid-btn" style={{ flex: 1, background: '#ef4444', padding: '0.5rem' }}>Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Placeholder tabs (implemented in subsequent tasks) ───

function RejectedDeletedTab() { return <div style={panelStyle}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>; }
function UsersTab() { return <div style={panelStyle}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>; }
function RolesTab() { return <div style={panelStyle}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>; }
function PermissionsTab() { return <div style={panelStyle}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>; }
function CategoriesTab() { return <div style={panelStyle}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>; }
function TagsTab() { return <div style={panelStyle}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>; }
function SettingsTab() { return <div style={panelStyle}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>; }

// ─── Main Dashboard ───

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('Pending Artworks');

  const renderTab = () => {
    switch (activeTab) {
      case 'Pending Artworks': return <PendingArtworksTab />;
      case 'Rejected/Deleted': return <RejectedDeletedTab />;
      case 'Users': return <UsersTab />;
      case 'Roles': return <RolesTab />;
      case 'Permissions': return <PermissionsTab />;
      case 'Categories': return <CategoriesTab />;
      case 'Tags': return <TagsTab />;
      case 'Settings': return <SettingsTab />;
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Admin Dashboard</h2>
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: activeTab === tab ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminDashboard.tsx
git commit -m "feat: rewrite AdminDashboard with tab shell and pending artworks"
```

---

## Task 4: Implement Rejected/Deleted Artworks tab

**Files:**
- Modify: `src/pages/AdminDashboard.tsx` (replace `RejectedDeletedTab` placeholder)

- [ ] **Step 1: Replace the RejectedDeletedTab placeholder**

Replace the `RejectedDeletedTab` function with:

```tsx
function RejectedDeletedTab() {
  const [rejected, setRejected] = useState<any[]>([]);
  const [deleted, setDeleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'rejected' | 'deleted'>('rejected');

  const fetch = async () => {
    try {
      setLoading(true);
      const [rejRes, delRes] = await Promise.all([
        ArtWorkAPI.getRejected(),
        ArtWorkAPI.getDeleted(),
      ]);
      setRejected(rejRes.data?.data?.items || rejRes.data?.items || []);
      setDeleted(delRes.data?.data?.items || delRes.data?.items || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const restore = async (id: number) => {
    try { await ArtWorkAPI.restore(id); toast.success('Artwork restored'); fetch(); } catch {}
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  const items = subTab === 'rejected' ? rejected : deleted;

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setSubTab('rejected')} style={{ ...smallBtnStyle, background: subTab === 'rejected' ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#fff' }}>
          Rejected ({rejected.length})
        </button>
        <button onClick={() => setSubTab('deleted')} style={{ ...smallBtnStyle, background: subTab === 'deleted' ? '#f59e0b' : 'rgba(255,255,255,0.1)', color: '#fff' }}>
          Deleted ({deleted.length})
        </button>
      </div>
      {items.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No {subTab} artworks.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {items.map(art => (
            <div key={art.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
              <img src={fixImageUrl(art.mainImage || art.images?.[0]?.name)} alt={art.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{art.title}</h4>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>by {art.artistName}</p>
                <button onClick={() => restore(art.id)} className="bid-btn" style={{ width: '100%', background: '#10b981', padding: '0.5rem' }}>Restore</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminDashboard.tsx
git commit -m "feat: add rejected/deleted artworks tab to admin dashboard"
```

---

## Task 5: Implement Users tab

**Files:**
- Modify: `src/pages/AdminDashboard.tsx` (replace `UsersTab` placeholder)

- [ ] **Step 1: Replace the UsersTab placeholder**

Replace the `UsersTab` function with:

```tsx
function UsersTab() {
  const [artists, setArtists] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'artists' | 'buyers' | 'admins' | 'deleted'>('artists');
  const [artistStatusFilter, setArtistStatusFilter] = useState<string>('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [artRes, buyRes, admRes, delRes] = await Promise.all([
        ProfileAPI.getArtists(artistStatusFilter ? { Status: Number(artistStatusFilter) } : undefined),
        ProfileAPI.getBuyers(),
        ProfileAPI.getAdmins(),
        ProfileAPI.getDeleted(),
      ]);
      setArtists(artRes.data?.data || artRes.data || []);
      setBuyers(buyRes.data?.data || buyRes.data || []);
      setAdmins(admRes.data?.data || admRes.data || []);
      setDeletedUsers(delRes.data?.data || delRes.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [artistStatusFilter]);

  const approveArtist = async (id: string) => {
    try { await ProfileAPI.approveArtist(id); toast.success('Artist approved'); fetchAll(); } catch {}
  };
  const rejectArtist = async (id: string) => {
    try { await ProfileAPI.rejectArtist(id); toast.success('Artist rejected'); fetchAll(); } catch {}
  };
  const blockUser = async (id: string) => {
    try { await ProfileAPI.blockUser(id); toast.success('User blocked'); fetchAll(); } catch {}
  };
  const unblockUser = async (id: string) => {
    try { await ProfileAPI.unblockUser(id); toast.success('User unblocked'); fetchAll(); } catch {}
  };
  const deleteUser = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    try { await ProfileAPI.adminDeleteUser(id); toast.success('User deleted'); fetchAll(); } catch {}
  };
  const restoreUser = async (id: string) => {
    try { await ProfileAPI.restoreUser(id); toast.success('User restored'); fetchAll(); } catch {}
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(['artists', 'buyers', 'admins', 'deleted'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{ ...smallBtnStyle, background: subTab === t ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', color: '#fff', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {subTab === 'artists' && (
        <div style={{ marginBottom: '1rem' }}>
          <select
            value={artistStatusFilter}
            onChange={e => setArtistStatusFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit' }}
          >
            <option value="">All Statuses</option>
            <option value="0">Pending</option>
            <option value="1">Approved</option>
            <option value="2">Rejected</option>
          </select>
        </div>
      )}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subTab === 'artists' && artists.map((u: any) => (
            <tr key={u.id}>
              <td style={tdStyle}>{u.fullName || u.userName}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button onClick={() => approveArtist(u.id)} style={{ ...smallBtnStyle, background: '#10b981', color: '#fff' }}>Approve</button>
                  <button onClick={() => rejectArtist(u.id)} style={{ ...smallBtnStyle, background: '#ef4444', color: '#fff' }}>Reject</button>
                  <button onClick={() => blockUser(u.id)} style={{ ...smallBtnStyle, background: '#f59e0b', color: '#fff' }}>Block</button>
                  <button onClick={() => unblockUser(u.id)} style={{ ...smallBtnStyle, background: '#6366f1', color: '#fff' }}>Unblock</button>
                  <button onClick={() => deleteUser(u.id)} style={{ ...smallBtnStyle, background: '#dc2626', color: '#fff' }}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {subTab === 'buyers' && buyers.map((u: any) => (
            <tr key={u.id}>
              <td style={tdStyle}>{u.fullName || u.userName}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button onClick={() => blockUser(u.id)} style={{ ...smallBtnStyle, background: '#f59e0b', color: '#fff' }}>Block</button>
                  <button onClick={() => unblockUser(u.id)} style={{ ...smallBtnStyle, background: '#6366f1', color: '#fff' }}>Unblock</button>
                  <button onClick={() => deleteUser(u.id)} style={{ ...smallBtnStyle, background: '#dc2626', color: '#fff' }}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {subTab === 'admins' && admins.map((u: any) => (
            <tr key={u.id}>
              <td style={tdStyle}>{u.fullName || u.userName}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Admin</span></td>
            </tr>
          ))}
          {subTab === 'deleted' && deletedUsers.map((u: any) => (
            <tr key={u.id}>
              <td style={tdStyle}>{u.fullName || u.userName}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>
                <button onClick={() => restoreUser(u.id)} style={{ ...smallBtnStyle, background: '#10b981', color: '#fff' }}>Restore</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {((subTab === 'artists' && artists.length === 0) ||
        (subTab === 'buyers' && buyers.length === 0) ||
        (subTab === 'admins' && admins.length === 0) ||
        (subTab === 'deleted' && deletedUsers.length === 0)) && (
        <p style={{ color: 'var(--text-secondary)', padding: '1rem', textAlign: 'center' }}>No {subTab} found.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminDashboard.tsx
git commit -m "feat: add users management tab to admin dashboard"
```

---

## Task 6: Implement Roles tab

**Files:**
- Modify: `src/pages/AdminDashboard.tsx` (replace `RolesTab` placeholder)

- [ ] **Step 1: Replace the RolesTab placeholder**

Replace the `RolesTab` function with:

```tsx
function RolesTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [permLoading, setPermLoading] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await RoleAPI.getAll();
      setRoles(res.data?.data || res.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchRoles(); }, []);

  const createRole = async () => {
    if (!newRoleName.trim()) return;
    try { await RoleAPI.create(newRoleName.trim()); toast.success('Role created'); setNewRoleName(''); fetchRoles(); } catch {}
  };

  const deleteRole = async (name: string) => {
    if (!window.confirm(`Delete role "${name}"?`)) return;
    try { await RoleAPI.delete(name); toast.success('Role deleted'); if (selectedRole?.name === name) setSelectedRole(null); fetchRoles(); } catch {}
  };

  const renameRole = async (oldName: string) => {
    if (!editName.trim() || editName.trim() === oldName) { setEditingRole(null); return; }
    try { await RoleAPI.update(oldName, editName.trim()); toast.success('Role renamed'); setEditingRole(null); fetchRoles(); } catch {}
  };

  const selectRole = async (role: any) => {
    setSelectedRole(role);
    setPermLoading(true);
    try {
      const [allRes, roleRes] = await Promise.all([
        PermissionsAPI.getAll(),
        PermissionsAPI.getByRole(role.id),
      ]);
      setAllPermissions(allRes.data?.data || allRes.data || []);
      setRolePermissions(roleRes.data?.data || roleRes.data || []);
    } catch {} finally { setPermLoading(false); }
  };

  const togglePermission = async (perm: string) => {
    if (!selectedRole) return;
    const has = rolePermissions.includes(perm);
    try {
      if (has) {
        await PermissionsAPI.remove(selectedRole.id, perm);
        setRolePermissions(prev => prev.filter(p => p !== perm));
      } else {
        await PermissionsAPI.assign(selectedRole.id, perm);
        setRolePermissions(prev => [...prev, perm]);
      }
      toast.success(has ? 'Permission removed' : 'Permission assigned');
    } catch {}
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div style={panelStyle}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Roles</h3>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          value={newRoleName}
          onChange={e => setNewRoleName(e.target.value.replace(/[^A-Za-z]/g, ''))}
          placeholder="New role name (letters only)"
          className="auth-input"
          style={{ flex: 1, padding: '0.6rem 1rem' }}
          onKeyDown={e => e.key === 'Enter' && createRole()}
        />
        <button onClick={createRole} className="bid-btn" style={{ padding: '0.6rem 1.5rem' }}>Create</button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Role Name</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role: any) => (
            <tr key={role.id} style={{ background: selectedRole?.id === role.id ? 'rgba(56,189,248,0.1)' : 'transparent' }}>
              <td style={tdStyle}>
                {editingRole === role.id ? (
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value.replace(/[^A-Za-z]/g, ''))}
                    onBlur={() => renameRole(role.name)}
                    onKeyDown={e => e.key === 'Enter' && renameRole(role.name)}
                    className="auth-input"
                    style={{ padding: '0.4rem 0.6rem', width: '200px' }}
                    autoFocus
                  />
                ) : (
                  <span style={{ cursor: 'pointer' }} onClick={() => selectRole(role)}>{role.name}</span>
                )}
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={() => { setEditingRole(role.id); setEditName(role.name); }} style={{ ...smallBtnStyle, background: '#3b82f6', color: '#fff' }}>Rename</button>
                  <button onClick={() => deleteRole(role.name)} style={{ ...smallBtnStyle, background: '#dc2626', color: '#fff' }}>Delete</button>
                  <button onClick={() => selectRole(role)} style={{ ...smallBtnStyle, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Permissions</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {roles.length === 0 && <p style={{ color: 'var(--text-secondary)', padding: '1rem', textAlign: 'center' }}>No roles found.</p>}

      {selectedRole && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Permissions for: {selectedRole.name}</h4>
          {permLoading ? <div className="spinner" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
              {allPermissions.map(perm => (
                <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem', cursor: 'pointer', borderRadius: '6px', background: rolePermissions.includes(perm) ? 'rgba(16,185,129,0.1)' : 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={rolePermissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                    style={{ accentColor: '#10b981' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>{perm}</span>
                </label>
              ))}
            </div>
          )}
          {!permLoading && allPermissions.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No permissions available.</p>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminDashboard.tsx
git commit -m "feat: add roles management tab with inline permissions editor"
```

---

## Task 7: Implement Permissions tab

**Files:**
- Modify: `src/pages/AdminDashboard.tsx` (replace `PermissionsTab` placeholder)

- [ ] **Step 1: Replace the PermissionsTab placeholder**

Replace the `PermissionsTab` function with:

```tsx
function PermissionsTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rolesRes, permsRes] = await Promise.all([RoleAPI.getAll(), PermissionsAPI.getAll()]);
        setRoles(rolesRes.data?.data || rolesRes.data || []);
        setAllPermissions(permsRes.data?.data || permsRes.data || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const loadRolePermissions = async (roleId: string) => {
    setSelectedRoleId(roleId);
    if (!roleId) { setRolePermissions([]); setOriginalPermissions([]); return; }
    try {
      const res = await PermissionsAPI.getByRole(roleId);
      const perms = res.data?.data || res.data || [];
      setRolePermissions(perms);
      setOriginalPermissions(perms);
    } catch {}
  };

  const togglePerm = (perm: string) => {
    setRolePermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  const save = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const toAdd = rolePermissions.filter(p => !originalPermissions.includes(p));
      const toRemove = originalPermissions.filter(p => !rolePermissions.includes(p));
      if (toAdd.length > 0) await PermissionsAPI.assignBulk({ roleId: selectedRoleId, permissions: toAdd });
      if (toRemove.length > 0) await PermissionsAPI.removeBulk({ roleId: selectedRoleId, permissions: toRemove });
      setOriginalPermissions([...rolePermissions]);
      toast.success('Permissions saved');
    } catch {} finally { setSaving(false); }
  };

  const reset = async () => {
    if (!selectedRoleId || !window.confirm('Reset all permissions for this role?')) return;
    try {
      await PermissionsAPI.reset(selectedRoleId);
      toast.success('Permissions reset');
      loadRolePermissions(selectedRoleId);
    } catch {}
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  const hasChanges = JSON.stringify([...rolePermissions].sort()) !== JSON.stringify([...originalPermissions].sort());

  return (
    <div style={panelStyle}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Permissions Manager</h3>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select
          value={selectedRoleId}
          onChange={e => loadRolePermissions(e.target.value)}
          style={{ padding: '0.6rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'inherit', minWidth: '200px' }}
        >
          <option value="">Select a role...</option>
          {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {selectedRoleId && (
          <>
            <button onClick={save} disabled={!hasChanges || saving} className="bid-btn" style={{ padding: '0.6rem 1.5rem', opacity: hasChanges ? 1 : 0.5 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={reset} style={{ ...smallBtnStyle, background: '#dc2626', color: '#fff' }}>Reset All</button>
          </>
        )}
      </div>

      {selectedRoleId && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
          {allPermissions.map(perm => (
            <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', borderRadius: '6px', background: rolePermissions.includes(perm) ? 'rgba(16,185,129,0.1)' : 'transparent', transition: 'background 0.15s' }}>
              <input type="checkbox" checked={rolePermissions.includes(perm)} onChange={() => togglePerm(perm)} style={{ accentColor: '#10b981' }} />
              <span style={{ fontSize: '0.9rem' }}>{perm}</span>
            </label>
          ))}
        </div>
      )}
      {selectedRoleId && allPermissions.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No permissions available.</p>}
      {!selectedRoleId && <p style={{ color: 'var(--text-secondary)' }}>Select a role to manage its permissions.</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminDashboard.tsx
git commit -m "feat: add permissions management tab with bulk assign/remove"
```

---

## Task 8: Implement Categories tab

**Files:**
- Modify: `src/pages/AdminDashboard.tsx` (replace `CategoriesTab` placeholder)

- [ ] **Step 1: Replace the CategoriesTab placeholder**

Replace the `CategoriesTab` function with:

```tsx
function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [nameError, setNameError] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await CategoryAPI.getAll({ IsDeleted: false });
      const active = res.data?.data || res.data || [];
      const delRes = await CategoryAPI.getAll({ IsDeleted: true });
      const deleted = delRes.data?.data || delRes.data || [];
      setCategories([...active, ...deleted.map((c: any) => ({ ...c, _isDeleted: true }))]);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const checkName = async (name: string) => {
    if (!name.trim()) return;
    try {
      const res = await CategoryAPI.checkName(name);
      if (res.data?.data === false || res.data === false) setNameError('Name already taken');
      else setNameError('');
    } catch { setNameError(''); }
  };

  const submitForm = async () => {
    if (!formName.trim() || formName.length < 3) { toast.error('Name must be at least 3 characters'); return; }
    const fd = new FormData();
    fd.append('Name', formName);
    if (formDesc) fd.append('Description', formDesc);
    if (formImage) fd.append('ImageFile', formImage);
    try {
      if (editingId) {
        await CategoryAPI.update(editingId, fd);
        toast.success('Category updated');
      } else {
        await CategoryAPI.create(fd);
        toast.success('Category created');
      }
      resetForm();
      fetchCategories();
    } catch {}
  };

  const resetForm = () => { setShowForm(false); setEditingId(null); setFormName(''); setFormDesc(''); setFormImage(null); setNameError(''); };

  const startEdit = async (id: number) => {
    try {
      const res = await CategoryAPI.getForUpdate(id);
      const cat = res.data?.data || res.data;
      setFormName(cat.name || '');
      setFormDesc(cat.description || '');
      setEditingId(id);
      setShowForm(true);
    } catch {}
  };

  const deleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    try { await CategoryAPI.delete(id); toast.success('Category deleted'); fetchCategories(); } catch {}
  };

  const restoreCategory = async (id: number) => {
    try { await CategoryAPI.restore(id); toast.success('Category restored'); fetchCategories(); } catch {}
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--accent-color)' }}>Categories</h3>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="bid-btn" style={{ padding: '0.5rem 1.2rem' }}>
          {showForm ? 'Cancel' : 'New Category'}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <input value={formName} onChange={e => { setFormName(e.target.value); setNameError(''); }} onBlur={() => checkName(formName)} placeholder="Category name (min 3 chars)" className="auth-input" style={{ width: '100%', padding: '0.6rem 1rem' }} />
              {nameError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.3rem' }}>{nameError}</p>}
            </div>
            <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Description (optional)" className="auth-input" style={{ width: '100%', padding: '0.6rem 1rem' }} />
            <input type="file" accept="image/*" onChange={e => setFormImage(e.target.files?.[0] || null)} style={{ color: 'var(--text-secondary)' }} />
            <button onClick={submitForm} className="bid-btn" style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem' }}>
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat: any) => (
            <tr key={cat.id}>
              <td style={tdStyle}>{cat.name}</td>
              <td style={tdStyle}><span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{cat.description || '—'}</span></td>
              <td style={tdStyle}>
                <span style={{ color: cat._isDeleted || cat.isDeleted ? '#ef4444' : '#10b981', fontSize: '0.85rem' }}>
                  {cat._isDeleted || cat.isDeleted ? 'Deleted' : 'Active'}
                </span>
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {!(cat._isDeleted || cat.isDeleted) ? (
                    <>
                      <button onClick={() => startEdit(cat.id)} style={{ ...smallBtnStyle, background: '#3b82f6', color: '#fff' }}>Edit</button>
                      <button onClick={() => deleteCategory(cat.id)} style={{ ...smallBtnStyle, background: '#dc2626', color: '#fff' }}>Delete</button>
                    </>
                  ) : (
                    <button onClick={() => restoreCategory(cat.id)} style={{ ...smallBtnStyle, background: '#10b981', color: '#fff' }}>Restore</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {categories.length === 0 && <p style={{ color: 'var(--text-secondary)', padding: '1rem', textAlign: 'center' }}>No categories found.</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminDashboard.tsx
git commit -m "feat: add categories CRUD tab to admin dashboard"
```

---

## Task 9: Implement Tags tab

**Files:**
- Modify: `src/pages/AdminDashboard.tsx` (replace `TagsTab` placeholder)

- [ ] **Step 1: Replace the TagsTab placeholder**

Replace the `TagsTab` function with:

```tsx
function TagsTab() {
  const [tags, setTags] = useState<any[]>([]);
  const [deletedTags, setDeletedTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [nameError, setNameError] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const [res, delRes, usageRes] = await Promise.all([
        TagAPI.getAll(),
        TagAPI.getDeleted(),
        TagAPI.getUsage(),
      ]);
      const usage = usageRes.data?.data || usageRes.data || [];
      const usageMap = new Map(usage.map((u: any) => [u.tagId || u.id, u.count || u.artworkCount || 0]));
      setTags((res.data?.data || res.data || []).map((t: any) => ({ ...t, usageCount: usageMap.get(t.id) || 0 })));
      setDeletedTags(delRes.data?.data || delRes.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchTags(); }, []);

  const checkName = async (name: string) => {
    if (!name.trim()) return;
    try {
      const res = await TagAPI.checkName(name);
      if (res.data?.data === false || res.data === false) setNameError('Name already taken');
      else setNameError('');
    } catch { setNameError(''); }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    try { await TagAPI.create({ name: newTagName.trim() }); toast.success('Tag created'); setNewTagName(''); fetchTags(); } catch {}
  };

  const saveEdit = async (id: number) => {
    if (!editName.trim()) { setEditingId(null); return; }
    try { await TagAPI.update(id, { name: editName.trim() }); toast.success('Tag updated'); setEditingId(null); fetchTags(); } catch {}
  };

  const deleteTag = async (id: number) => {
    if (!window.confirm('Delete this tag?')) return;
    try { await TagAPI.delete(id); toast.success('Tag deleted'); fetchTags(); } catch {}
  };

  const restoreTag = async (id: number) => {
    try { await TagAPI.restore(id); toast.success('Tag restored'); fetchTags(); } catch {}
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div style={panelStyle}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Tags</h3>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          value={newTagName}
          onChange={e => { setNewTagName(e.target.value); setNameError(''); }}
          onBlur={() => checkName(newTagName)}
          placeholder="New tag name"
          className="auth-input"
          style={{ flex: 1, padding: '0.6rem 1rem' }}
          onKeyDown={e => e.key === 'Enter' && createTag()}
        />
        <button onClick={createTag} className="bid-btn" style={{ padding: '0.6rem 1.5rem' }}>Create</button>
      </div>
      {nameError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem' }}>{nameError}</p>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={() => setShowDeleted(false)} style={{ ...smallBtnStyle, background: !showDeleted ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', color: '#fff' }}>
          Active ({tags.length})
        </button>
        <button onClick={() => setShowDeleted(true)} style={{ ...smallBtnStyle, background: showDeleted ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#fff' }}>
          Deleted ({deletedTags.length})
        </button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            {!showDeleted && <th style={thStyle}>Usage</th>}
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!showDeleted && tags.map((tag: any) => (
            <tr key={tag.id}>
              <td style={tdStyle}>
                {editingId === tag.id ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)} onBlur={() => saveEdit(tag.id)} onKeyDown={e => e.key === 'Enter' && saveEdit(tag.id)} className="auth-input" style={{ padding: '0.4rem 0.6rem', width: '200px' }} autoFocus />
                ) : tag.name}
              </td>
              <td style={tdStyle}><span style={{ color: 'var(--text-secondary)' }}>{tag.usageCount}</span></td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={() => { setEditingId(tag.id); setEditName(tag.name); }} style={{ ...smallBtnStyle, background: '#3b82f6', color: '#fff' }}>Edit</button>
                  <button onClick={() => deleteTag(tag.id)} style={{ ...smallBtnStyle, background: '#dc2626', color: '#fff' }}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {showDeleted && deletedTags.map((tag: any) => (
            <tr key={tag.id}>
              <td style={tdStyle}>{tag.name}</td>
              <td style={tdStyle}>
                <button onClick={() => restoreTag(tag.id)} style={{ ...smallBtnStyle, background: '#10b981', color: '#fff' }}>Restore</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {((!showDeleted && tags.length === 0) || (showDeleted && deletedTags.length === 0)) && (
        <p style={{ color: 'var(--text-secondary)', padding: '1rem', textAlign: 'center' }}>No {showDeleted ? 'deleted ' : ''}tags found.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminDashboard.tsx
git commit -m "feat: add tags CRUD tab to admin dashboard"
```

---

## Task 10: Implement System Settings tab

**Files:**
- Modify: `src/pages/AdminDashboard.tsx` (replace `SettingsTab` placeholder)

- [ ] **Step 1: Replace the SettingsTab placeholder**

Replace the `SettingsTab` function with:

```tsx
function SettingsTab() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await SystemSettingAPI.get();
        const data = res.data?.data || res.data || {};
        setSettings(data);
        if (data.logoUrl) setLogoPreview(fixImageUrl(data.logoUrl));
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (logoFile) fd.append('Logo', logoFile);
      if (settings.siteName) fd.append('SiteName', settings.siteName);
      if (settings.logoUrl) fd.append('LogoUrl', settings.logoUrl);
      if (settings.email) fd.append('Email', settings.email);
      if (settings.phone) fd.append('Phone', settings.phone);
      if (settings.facebookUrl) fd.append('FacebookUrl', settings.facebookUrl);
      if (settings.twitterUrl) fd.append('TwitterUrl', settings.twitterUrl);
      if (settings.instagramUrl) fd.append('InstagramUrl', settings.instagramUrl);
      if (settings.youTubeUrl) fd.append('YouTubeUrl', settings.youTubeUrl);
      await SystemSettingAPI.update(fd);
      toast.success('Settings saved');
    } catch {} finally { setSaving(false); }
  };

  const update = (key: string, value: string) => setSettings((prev: any) => ({ ...prev, [key]: value }));

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  const fields: { key: string; label: string; type?: string }[] = [
    { key: 'siteName', label: 'Site Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'facebookUrl', label: 'Facebook URL' },
    { key: 'twitterUrl', label: 'Twitter URL' },
    { key: 'instagramUrl', label: 'Instagram URL' },
    { key: 'youTubeUrl', label: 'YouTube URL' },
  ];

  return (
    <div style={panelStyle}>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>System Settings</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Logo</label>
          {logoPreview && <img src={logoPreview} alt="Logo preview" style={{ height: '60px', borderRadius: '8px', marginBottom: '0.5rem', display: 'block' }} />}
          <input type="file" accept="image/*" onChange={handleLogoChange} style={{ color: 'var(--text-secondary)' }} />
        </div>

        {fields.map(f => (
          <div key={f.key}>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{f.label}</label>
            <input
              value={settings[f.key] || ''}
              onChange={e => update(f.key, e.target.value)}
              className="auth-input"
              style={{ width: '100%', padding: '0.6rem 1rem' }}
            />
          </div>
        ))}

        <button onClick={save} disabled={saving} className="bid-btn" style={{ alignSelf: 'flex-start', padding: '0.6rem 2rem', marginTop: '0.5rem' }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminDashboard.tsx
git commit -m "feat: add system settings tab to admin dashboard"
```

---

## Task 11: Remove unused imports and final cleanup

**Files:**
- Modify: `src/pages/AdminDashboard.tsx` (clean up imports)

- [ ] **Step 1: Verify all imports are used**

The top of `AdminDashboard.tsx` imports `ArtWorkAPI, ProfileAPI, RoleAPI, PermissionsAPI, CategoryAPI, TagAPI, SystemSettingAPI`. After all tabs are implemented, every import should be used. Verify with:

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx tsc --noEmit`

If there are unused import warnings, remove them.

- [ ] **Step 2: Run the dev server and verify the admin page loads**

Run: `cd /Users/sconder/workstation/personal/project-universty/art-auction-frontend && npx vite --host 0.0.0.0 &`

Navigate to the `/admin` route. Verify:
- Tab bar renders with all 8 tabs
- Clicking each tab switches the content
- Pending Artworks tab shows the existing functionality
- No console errors on tab switches

- [ ] **Step 3: Final commit**

```bash
git add src/api.ts src/pages/AdminDashboard.tsx
git commit -m "feat: complete admin dashboard with all management tabs"
```
