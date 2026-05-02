import { Link, useNavigate } from 'react-router-dom';
import { AccountAPI, NotificationAPI, SystemSettingAPI, getUserRole } from '../api';
import { useEffect, useState } from 'react';
import { fixImageUrl } from '../pages/Home';

export function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('auth_token');
  const role = getUserRole();
  const isAdmin = role === 'Admin';
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    // Some roles might not have access to SystemSettingAPI, so we catch errors gracefully.
    SystemSettingAPI.get()
      .then(res => {
        if (res.data?.success) setSettings(res.data.data);
      })
      .catch(() => {});
      
    if (token) {
      NotificationAPI.getUnreadCount()
        .then(res => setUnreadCount(res.data?.data || 0))
        .catch(() => {});
    }
  }, [token]);

  const handleLogout = async () => {
    try {
      await AccountAPI.logout();
    } catch (e) {
      console.log('Logout API error', e);
    }
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  };

  return (
    <header>
      <div className="logo-section">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {settings?.logoUrl && (
             <img src={fixImageUrl(settings.logoUrl)} alt="Logo" style={{ height: '40px', borderRadius: '8px' }} />
          )}
          <div>
            <h1>{settings?.siteName || 'Lumina'}</h1>
            <p>Exclusive Art Auctions</p>
          </div>
        </Link>
      </div>
      <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
        {token ? (
          <>
            <Link to="/watchlist" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Watchlist</Link>
            <Link to="/profile" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Profile</Link>
            {isAdmin && (
              <Link to="/admin" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Admin</Link>
            )}
            <Link to="/notifications" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
              Notifications
              {unreadCount > 0 && <span style={{ marginLeft: '4px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '0.75rem' }}>{unreadCount}</span>}
            </Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <button onClick={() => navigate('/auth')}>Sign In / Register</button>
        )}
      </div>
    </header>
  );
}
