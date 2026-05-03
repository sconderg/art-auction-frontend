import { useEffect, useState } from 'react';
import { ArtWorkAPI, ProfileAPI, RoleAPI, PermissionsAPI, CategoryAPI, TagAPI, SystemSettingAPI } from '../api';
import toast from 'react-hot-toast';
import { fixImageUrl } from './Home';

const toArray = (res: any): any[] => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (d?.data) {
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.data?.items)) return d.data.items;
  }
  if (Array.isArray(d?.items)) return d.items;
  return [];
};

/* ───────── shared constants ───────── */
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

type Tab = (typeof TABS)[number];

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
/* ───────── Tab 1: Pending Artworks ───────── */
function PendingArtworksTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      setLoading(true);
      const res = await ArtWorkAPI.getPending();
      setItems(toArray(res));
    } catch { /* handled by interceptor */ } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const act = async (fn: () => Promise<any>, msg: string) => {
    try { await fn(); toast.success(msg); fetch(); } catch { /* interceptor */ }
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div style={panelStyle}>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>Pending Artworks</h3>
      {items.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No pending artworks at the moment.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {items.map(art => (
            <div key={art.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
              <img src={fixImageUrl(art.mainImage || art.images?.[0]?.name)} alt={art.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{art.title}</h4>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>by {art.artistName}</p>
                <p style={{ margin: '0 0 1rem 0', color: '#10b981', fontWeight: 'bold' }}>Initial Price: ${art.initialPrice}</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="bid-btn" style={{ flex: 1, background: '#10b981', padding: '0.5rem' }} onClick={() => act(() => ArtWorkAPI.approve(art.id), 'Artwork approved')}>Approve</button>
                  <button className="bid-btn" style={{ flex: 1, background: '#ef4444', padding: '0.5rem' }} onClick={() => act(() => ArtWorkAPI.reject(art.id), 'Artwork rejected')}>Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── Tab 2: Rejected / Deleted ───────── */
function RejectedDeletedTab() {
  const [rejected, setRejected] = useState<any[]>([]);
  const [deleted, setDeleted] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<'rejected' | 'deleted'>('rejected');
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [rejRes, delRes] = await Promise.all([ArtWorkAPI.getRejected(), ArtWorkAPI.getDeleted()]);
      setRejected(toArray(rejRes));
      setDeleted(toArray(delRes));
    } catch { /* interceptor */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const restore = async (id: number) => {
    try { await ArtWorkAPI.restore(id); toast.success('Artwork restored'); fetchAll(); } catch { /* interceptor */ }
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  const list = subTab === 'rejected' ? rejected : deleted;

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button className="bid-btn" style={{ background: subTab === 'rejected' ? '#ef4444' : 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem' }} onClick={() => setSubTab('rejected')}>Rejected ({rejected.length})</button>
        <button className="bid-btn" style={{ background: subTab === 'deleted' ? '#ef4444' : 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem' }} onClick={() => setSubTab('deleted')}>Deleted ({deleted.length})</button>
      </div>
      {list.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No {subTab} artworks.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {list.map(art => (
            <div key={art.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
              <img src={fixImageUrl(art.mainImage || art.images?.[0]?.name)} alt={art.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{art.title}</h4>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>by {art.artistName}</p>
                <p style={{ margin: '0 0 1rem 0', color: '#10b981', fontWeight: 'bold' }}>${art.initialPrice}</p>
                <button className="bid-btn" style={{ width: '100%', background: '#3b82f6', padding: '0.5rem' }} onClick={() => restore(art.id)}>Restore</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── Tab 3: Users ───────── */
function UsersTab() {
  const [artists, setArtists] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<'artists' | 'buyers' | 'admins' | 'deleted'>('artists');
  const [artistStatusFilter, setArtistStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (artistStatusFilter !== '') params.Status = Number(artistStatusFilter);
      const [aRes, bRes, adRes, dRes] = await Promise.all([
        ProfileAPI.getArtists(params),
        ProfileAPI.getBuyers(),
        ProfileAPI.getAdmins(),
        ProfileAPI.getDeleted(),
      ]);
      setArtists(toArray(aRes));
      setBuyers(toArray(bRes));
      setAdmins(toArray(adRes));
      setDeletedUsers(toArray(dRes));
    } catch { /* interceptor */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [artistStatusFilter]);

  const act = async (fn: () => Promise<any>, msg: string) => {
    try { await fn(); toast.success(msg); fetchAll(); } catch { /* interceptor */ }
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  const subBtns: { key: typeof subTab; label: string; count: number }[] = [
    { key: 'artists', label: 'Artists', count: artists.length },
    { key: 'buyers', label: 'Buyers', count: buyers.length },
    { key: 'admins', label: 'Admins', count: admins.length },
    { key: 'deleted', label: 'Deleted', count: deletedUsers.length },
  ];

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {subBtns.map(b => (
          <button key={b.key} className="bid-btn" style={{ background: subTab === b.key ? '#6366f1' : 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem' }} onClick={() => setSubTab(b.key)}>{b.label} ({b.count})</button>
        ))}
      </div>

      {subTab === 'artists' && (
        <div style={{ marginBottom: '1rem' }}>
          <select className="auth-input" style={{ maxWidth: '200px' }} value={artistStatusFilter} onChange={e => setArtistStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="0">Pending</option>
            <option value="1">Approved</option>
            <option value="2">Rejected</option>
          </select>
        </div>
      )}

      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>Name</th><th style={thStyle}>Email</th><th style={thStyle}>Actions</th></tr></thead>
        <tbody>
          {subTab === 'artists' && artists.map(u => (
            <tr key={u.id}>
              <td style={tdStyle}>{u.fullName || u.userName}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button style={{ ...smallBtnStyle, background: '#10b981', color: '#fff' }} onClick={() => act(() => ProfileAPI.approveArtist(u.id), 'Artist approved')}>Approve</button>
                  <button style={{ ...smallBtnStyle, background: '#ef4444', color: '#fff' }} onClick={() => act(() => ProfileAPI.rejectArtist(u.id), 'Artist rejected')}>Reject</button>
                  <button style={{ ...smallBtnStyle, background: '#f59e0b', color: '#000' }} onClick={() => act(() => ProfileAPI.blockUser(u.id), 'User blocked')}>Block</button>
                  <button style={{ ...smallBtnStyle, background: '#3b82f6', color: '#fff' }} onClick={() => act(() => ProfileAPI.unblockUser(u.id), 'User unblocked')}>Unblock</button>
                  <button style={{ ...smallBtnStyle, background: '#dc2626', color: '#fff' }} onClick={() => { if (window.confirm('Delete this user?')) act(() => ProfileAPI.adminDeleteUser(u.id), 'User deleted'); }}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {subTab === 'buyers' && buyers.map(u => (
            <tr key={u.id}>
              <td style={tdStyle}>{u.fullName || u.userName}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button style={{ ...smallBtnStyle, background: '#f59e0b', color: '#000' }} onClick={() => act(() => ProfileAPI.blockUser(u.id), 'User blocked')}>Block</button>
                  <button style={{ ...smallBtnStyle, background: '#3b82f6', color: '#fff' }} onClick={() => act(() => ProfileAPI.unblockUser(u.id), 'User unblocked')}>Unblock</button>
                  <button style={{ ...smallBtnStyle, background: '#dc2626', color: '#fff' }} onClick={() => { if (window.confirm('Delete this user?')) act(() => ProfileAPI.adminDeleteUser(u.id), 'User deleted'); }}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {subTab === 'admins' && admins.map(u => (
            <tr key={u.id}>
              <td style={tdStyle}>{u.fullName || u.userName}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}><span style={{ color: '#6366f1', fontWeight: 600 }}>Admin</span></td>
            </tr>
          ))}
          {subTab === 'deleted' && deletedUsers.map(u => (
            <tr key={u.id}>
              <td style={tdStyle}>{u.fullName || u.userName}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>
                <button style={{ ...smallBtnStyle, background: '#3b82f6', color: '#fff' }} onClick={() => act(() => ProfileAPI.restoreUser(u.id), 'User restored')}>Restore</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────── Tab 4: Roles ───────── */
function RolesTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [permLoading, setPermLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await RoleAPI.getAll();
      const raw = toArray(res);
      setRoles(raw.map((r: any) => typeof r === 'string' ? { id: r, name: r } : r));
    } catch { /* interceptor */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchRoles(); }, []);

  const createRole = async () => {
    const name = newRoleName.trim();
    if (!name) return;
    try { await RoleAPI.create(name); toast.success('Role created'); setNewRoleName(''); fetchRoles(); } catch { /* interceptor */ }
  };

  const renameRole = async (oldName: string) => {
    const name = editName.trim();
    if (!name || name === oldName) { setEditingRole(null); return; }
    try { await RoleAPI.update(oldName, name); toast.success('Role renamed'); setEditingRole(null); fetchRoles(); } catch { /* interceptor */ }
  };

  const deleteRole = async (name: string) => {
    if (!window.confirm(`Delete role "${name}"?`)) return;
    try { await RoleAPI.delete(name); toast.success('Role deleted'); if (selectedRole?.name === name) setSelectedRole(null); fetchRoles(); } catch { /* interceptor */ }
  };

  const loadPermissions = async (role: any) => {
    setSelectedRole(role);
    setPermLoading(true);
    try {
      const allRes = await PermissionsAPI.getAll();
      const allPerms = toArray(allRes);
      const uniquePerms = [...new Set(allPerms.map((p: any) => p.permissionName || p.name || p))].filter(Boolean);
      setAllPermissions(uniquePerms);
      const roleUuid = allPerms.find((p: any) => p.roleName === role.name)?.roleId;
      if (roleUuid) {
        setSelectedRole({ ...role, id: roleUuid });
        const rpRes = await PermissionsAPI.getByRole(roleUuid);
        const rp = toArray(rpRes);
        setRolePermissions(rp.map((p: any) => p.permissionName || p.name || p));
      } else {
        setRolePermissions([]);
      }
    } catch { /* interceptor */ } finally { setPermLoading(false); }
  };

  const togglePerm = async (perm: string) => {
    if (!selectedRole) return;
    const has = rolePermissions.includes(perm);
    setRolePermissions(prev => has ? prev.filter(p => p !== perm) : [...prev, perm]);
    try {
      if (has) await PermissionsAPI.remove(selectedRole.id, perm);
      else await PermissionsAPI.assign(selectedRole.id, perm);
    } catch { setRolePermissions(prev => has ? [...prev, perm] : prev.filter(p => p !== perm)); }
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input className="auth-input" placeholder="New role name" value={newRoleName} onChange={e => setNewRoleName(e.target.value.replace(/[^a-zA-Z]/g, ''))} style={{ flex: 1 }} />
        <button className="bid-btn" style={{ background: '#10b981', padding: '0.5rem 1.2rem' }} onClick={createRole}>Create</button>
      </div>

      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>Role Name</th><th style={thStyle}>Actions</th></tr></thead>
        <tbody>
          {roles.map((r: any) => (
            <tr key={r.id || r.name}>
              <td style={tdStyle}>
                {editingRole === r.name ? (
                  <input className="auth-input" value={editName} onChange={e => setEditName(e.target.value.replace(/[^a-zA-Z]/g, ''))} onBlur={() => renameRole(r.name)} onKeyDown={e => e.key === 'Enter' && renameRole(r.name)} autoFocus style={{ width: '100%' }} />
                ) : r.name}
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button style={{ ...smallBtnStyle, background: '#3b82f6', color: '#fff' }} onClick={() => { setEditingRole(r.name); setEditName(r.name); }}>Rename</button>
                  <button style={{ ...smallBtnStyle, background: '#6366f1', color: '#fff' }} onClick={() => loadPermissions(r)}>Permissions</button>
                  <button style={{ ...smallBtnStyle, background: '#dc2626', color: '#fff' }} onClick={() => deleteRole(r.name)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedRole && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
          <h4 style={{ marginBottom: '1rem', color: '#6366f1' }}>Permissions for {selectedRole.name}</h4>
          {permLoading ? <div className="loading-state"><div className="spinner" /></div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
              {allPermissions.map((name: string) => (
                <label key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={rolePermissions.includes(name)} onChange={() => togglePerm(name)} />
                  {name}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── Tab 5: Permissions ───────── */
function PermissionsTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const pRes = await PermissionsAPI.getAll();
        const allPerms = toArray(pRes);
        const roleMap = new Map<string, string>();
        const permNames = new Set<string>();
        allPerms.forEach((p: any) => {
          if (p.roleName && p.roleId) roleMap.set(p.roleName, p.roleId);
          if (p.permissionName) permNames.add(p.permissionName);
        });
        const rRes = await RoleAPI.getAll();
        const rawRoles = toArray(rRes);
        setRoles(rawRoles.map((r: any) => {
          const name = typeof r === 'string' ? r : r.name;
          return { id: roleMap.get(name) || name, name };
        }));
        setAllPermissions([...permNames]);
      } catch { /* interceptor */ } finally { setLoading(false); }
    })();
  }, []);

  const loadRolePerms = async (roleId: string) => {
    setSelectedRoleId(roleId);
    if (!roleId) { setRolePermissions([]); setOriginalPermissions([]); return; }
    try {
      const res = await PermissionsAPI.getByRole(roleId);
      const rp = toArray(res).map((p: any) => p.permissionName || p.name || p);
      setRolePermissions(rp);
      setOriginalPermissions(rp);
    } catch { /* interceptor */ }
  };

  const toggle = (perm: string) => {
    setRolePermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  const hasChanges = () => {
    const a = [...rolePermissions].sort();
    const b = [...originalPermissions].sort();
    return JSON.stringify(a) !== JSON.stringify(b);
  };

  const save = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const toAdd = rolePermissions.filter(p => !originalPermissions.includes(p));
      const toRemove = originalPermissions.filter(p => !rolePermissions.includes(p));
      if (toAdd.length) await PermissionsAPI.assignBulk({ roleId: selectedRoleId, permissions: toAdd });
      if (toRemove.length) await PermissionsAPI.removeBulk({ roleId: selectedRoleId, permissions: toRemove });
      toast.success('Permissions saved');
      setOriginalPermissions([...rolePermissions]);
    } catch { /* interceptor */ } finally { setSaving(false); }
  };

  const reset = async () => {
    if (!selectedRoleId || !window.confirm('Reset all permissions for this role?')) return;
    try {
      await PermissionsAPI.reset(selectedRoleId);
      toast.success('Permissions reset');
      loadRolePerms(selectedRoleId);
    } catch { /* interceptor */ }
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: '1.5rem' }}>
        <select className="auth-input" style={{ maxWidth: '300px' }} value={selectedRoleId} onChange={e => loadRolePerms(e.target.value)}>
          <option value="">Select a role...</option>
          {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {selectedRoleId && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {allPermissions.map((name: string) => (
              <label key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={rolePermissions.includes(name)} onChange={() => toggle(name)} />
                {name}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="bid-btn" style={{ background: '#10b981', padding: '0.5rem 1.5rem' }} disabled={!hasChanges() || saving} onClick={save}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="bid-btn" style={{ background: '#dc2626', padding: '0.5rem 1.5rem' }} onClick={reset}>Reset</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ───────── Tab 6: Categories ───────── */
function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [activeRes, deletedRes] = await Promise.all([
        CategoryAPI.getAll({ IsDeleted: false }),
        CategoryAPI.getAll({ IsDeleted: true }),
      ]);
      const active = toArray(activeRes).map((c: any) => ({ ...c, _isDeleted: false }));
      const deleted = toArray(deletedRes).map((c: any) => ({ ...c, _isDeleted: true }));
      setCategories([...active, ...deleted]);
    } catch { /* interceptor */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const checkName = async () => {
    if (formName.length < 3) return;
    try {
      const res = await CategoryAPI.checkName(formName);
      if (res.data?.data === false || res.data === false) setNameError('Category name already exists');
      else setNameError('');
    } catch { /* interceptor */ }
  };

  const submit = async () => {
    if (formName.length < 3) { setNameError('Name must be at least 3 characters'); return; }
    if (nameError) return;
    const fd = new FormData();
    fd.append('Name', formName);
    fd.append('Description', formDesc);
    if (formImage) fd.append('ImageFile', formImage);
    try {
      if (editingId) await CategoryAPI.update(editingId, fd);
      else await CategoryAPI.create(fd);
      toast.success(editingId ? 'Category updated' : 'Category created');
      resetForm();
      fetchAll();
    } catch { /* interceptor */ }
  };

  const startEdit = async (id: number) => {
    try {
      const res = await CategoryAPI.getAdminDetail(id);
      const c = res.data?.data || res.data;
      setEditingId(id);
      setFormName(c.name || '');
      setFormDesc(c.description || '');
      setFormImage(null);
      setNameError('');
      setShowForm(true);
    } catch { /* interceptor */ }
  };

  const resetForm = () => { setShowForm(false); setEditingId(null); setFormName(''); setFormDesc(''); setFormImage(null); setNameError(''); };

  const deleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    try { await CategoryAPI.delete(id); toast.success('Category deleted'); fetchAll(); } catch { /* interceptor */ }
  };

  const restoreCategory = async (id: number) => {
    try { await CategoryAPI.restore(id); toast.success('Category restored'); fetchAll(); } catch { /* interceptor */ }
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--accent-color)', margin: 0 }}>Categories</h3>
        <button className="bid-btn" style={{ background: showForm ? '#ef4444' : '#10b981', padding: '0.5rem 1rem' }} onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>{showForm ? 'Cancel' : 'New Category'}</button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input className="auth-input" placeholder="Category name (min 3 chars)" value={formName} onChange={e => { setFormName(e.target.value); setNameError(''); }} onBlur={checkName} />
          {nameError && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>{nameError}</span>}
          <input className="auth-input" placeholder="Description" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
          <input type="file" accept="image/*" onChange={e => setFormImage(e.target.files?.[0] || null)} style={{ color: 'var(--text-secondary)' }} />
          <button className="bid-btn" style={{ background: '#10b981', padding: '0.5rem', alignSelf: 'flex-start' }} onClick={submit}>{editingId ? 'Update' : 'Create'}</button>
        </div>
      )}

      <table style={tableStyle}>
        <thead><tr><th style={thStyle}>Name</th><th style={thStyle}>Description</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr></thead>
        <tbody>
          {categories.map(c => (
            <tr key={c.id}>
              <td style={tdStyle}>{c.name}</td>
              <td style={tdStyle}>{c.description}</td>
              <td style={tdStyle}><span style={{ color: c._isDeleted ? '#ef4444' : '#10b981', fontWeight: 600 }}>{c._isDeleted ? 'Deleted' : 'Active'}</span></td>
              <td style={tdStyle}>
                {c._isDeleted ? (
                  <button style={{ ...smallBtnStyle, background: '#3b82f6', color: '#fff' }} onClick={() => restoreCategory(c.id)}>Restore</button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button style={{ ...smallBtnStyle, background: '#3b82f6', color: '#fff' }} onClick={() => startEdit(c.id)}>Edit</button>
                    <button style={{ ...smallBtnStyle, background: '#dc2626', color: '#fff' }} onClick={() => deleteCategory(c.id)}>Delete</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───────── Tab 7: Tags ───────── */
function TagsTab() {
  const [tags, setTags] = useState<any[]>([]);
  const [deletedTags, setDeletedTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [nameError, setNameError] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [tRes, dRes, uRes] = await Promise.all([TagAPI.getAll(), TagAPI.getDeleted(), TagAPI.getUsage()]);
      const allTags = toArray(tRes);
      const del = toArray(dRes);
      const usage = toArray(uRes);
      const usageMap: Record<number, number> = {};
      (Array.isArray(usage) ? usage : []).forEach((u: any) => { usageMap[u.tagId || u.id] = u.count || u.usageCount || 0; });
      setTags(allTags.map((t: any) => ({ ...t, usageCount: usageMap[t.id] || 0 })));
      setDeletedTags(del);
    } catch { /* interceptor */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const checkName = async (name: string) => {
    if (!name.trim()) return;
    try {
      const res = await TagAPI.checkName(name);
      if (res.data?.data === false || res.data === false) setNameError('Tag name already exists');
      else setNameError('');
    } catch { /* interceptor */ }
  };

  const createTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    if (nameError) return;
    try { await TagAPI.create({ name }); toast.success('Tag created'); setNewTagName(''); fetchAll(); } catch { /* interceptor */ }
  };

  const saveEdit = async (id: number) => {
    const name = editName.trim();
    if (!name) { setEditingId(null); return; }
    try { await TagAPI.update(id, { name }); toast.success('Tag updated'); setEditingId(null); fetchAll(); } catch { /* interceptor */ }
  };

  const deleteTag = async (id: number) => {
    if (!window.confirm('Delete this tag?')) return;
    try { await TagAPI.delete(id); toast.success('Tag deleted'); fetchAll(); } catch { /* interceptor */ }
  };

  const restoreTag = async (id: number) => {
    try { await TagAPI.restore(id); toast.success('Tag restored'); fetchAll(); } catch { /* interceptor */ }
  };

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input className="auth-input" placeholder="New tag name" value={newTagName} onChange={e => { setNewTagName(e.target.value); setNameError(''); }} onBlur={() => checkName(newTagName)} style={{ flex: 1 }} />
        <button className="bid-btn" style={{ background: '#10b981', padding: '0.5rem 1.2rem' }} onClick={createTag}>Create</button>
      </div>
      {nameError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '-1rem', marginBottom: '1rem' }}>{nameError}</p>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className="bid-btn" style={{ background: !showDeleted ? '#6366f1' : 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem' }} onClick={() => setShowDeleted(false)}>Active ({tags.length})</button>
        <button className="bid-btn" style={{ background: showDeleted ? '#ef4444' : 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem' }} onClick={() => setShowDeleted(true)}>Deleted ({deletedTags.length})</button>
      </div>

      {!showDeleted ? (
        <table style={tableStyle}>
          <thead><tr><th style={thStyle}>Name</th><th style={thStyle}>Usage</th><th style={thStyle}>Actions</th></tr></thead>
          <tbody>
            {tags.map(t => (
              <tr key={t.id}>
                <td style={tdStyle}>
                  {editingId === t.id ? (
                    <input className="auth-input" value={editName} onChange={e => setEditName(e.target.value)} onBlur={() => saveEdit(t.id)} onKeyDown={e => e.key === 'Enter' && saveEdit(t.id)} autoFocus style={{ width: '100%' }} />
                  ) : t.name}
                </td>
                <td style={tdStyle}>{t.usageCount}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button style={{ ...smallBtnStyle, background: '#3b82f6', color: '#fff' }} onClick={() => { setEditingId(t.id); setEditName(t.name); }}>Edit</button>
                    <button style={{ ...smallBtnStyle, background: '#dc2626', color: '#fff' }} onClick={() => deleteTag(t.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table style={tableStyle}>
          <thead><tr><th style={thStyle}>Name</th><th style={thStyle}>Actions</th></tr></thead>
          <tbody>
            {deletedTags.map(t => (
              <tr key={t.id}>
                <td style={tdStyle}>{t.name}</td>
                <td style={tdStyle}>
                  <button style={{ ...smallBtnStyle, background: '#3b82f6', color: '#fff' }} onClick={() => restoreTag(t.id)}>Restore</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ───────── Tab 8: Settings ───────── */
function SettingsTab() {
  const [settings, setSettings] = useState<any>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await SystemSettingAPI.get();
        const data = res.data?.data || (typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : {});
        setSettings(data);
        if (data.logoUrl) setLogoPreview(fixImageUrl(data.logoUrl));
      } catch { /* interceptor */ } finally { setLoading(false); }
    })();
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) setLogoPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (settings.siteName) fd.append('SiteName', settings.siteName);
      if (!logoFile && settings.logoUrl) fd.append('LogoUrl', settings.logoUrl);
      if (settings.email) fd.append('Email', settings.email);
      if (settings.phone) fd.append('Phone', settings.phone);
      if (settings.facebookUrl) fd.append('FacebookUrl', settings.facebookUrl);
      if (settings.twitterUrl) fd.append('TwitterUrl', settings.twitterUrl);
      if (settings.instagramUrl) fd.append('InstagramUrl', settings.instagramUrl);
      if (settings.youTubeUrl) fd.append('YouTubeUrl', settings.youTubeUrl);
      if (logoFile) fd.append('Logo', logoFile);
      await SystemSettingAPI.update(fd);
      toast.success('Settings saved');
    } catch { /* interceptor */ } finally { setSaving(false); }
  };

  const field = (label: string, key: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input className="auth-input" value={settings[key] || ''} onChange={e => setSettings((s: any) => ({ ...s, [key]: e.target.value }))} />
    </div>
  );

  if (loading) return <div className="loading-state"><div className="spinner" /></div>;

  return (
    <div style={panelStyle}>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>System Settings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logo</label>
          {logoPreview && <img src={logoPreview} alt="Logo" style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }} />}
          <input type="file" accept="image/*" onChange={handleFile} style={{ color: 'var(--text-secondary)' }} />
        </div>
        {field('Site Name', 'siteName')}
        {field('Email', 'email')}
        {field('Phone', 'phone')}
        {field('Facebook URL', 'facebookUrl')}
        {field('Twitter URL', 'twitterUrl')}
        {field('Instagram URL', 'instagramUrl')}
        {field('YouTube URL', 'youTubeUrl')}
        <button className="bid-btn" style={{ background: '#10b981', padding: '0.6rem', alignSelf: 'flex-start', marginTop: '0.5rem' }} disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save Settings'}</button>
      </div>
    </div>
  );
}

/* ───────── Main AdminDashboard ───────── */
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