import { useEffect, useState } from 'react';
import { NotificationAPI } from '../api';

export function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await NotificationAPI.getAll();
      if (res.data?.success) {
        setNotifications(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await NotificationAPI.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await NotificationAPI.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (e) {
      console.error('Failed to delete notification', e);
    }
  };

  const handleClearAll = async () => {
    try {
      await NotificationAPI.clearAll();
      setNotifications([]);
    } catch (e) {
      console.error('Failed to clear notifications', e);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading notifications...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>Notifications</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleMarkAllAsRead} className="bid-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            Mark All as Read
          </button>
          <button onClick={handleClearAll} className="bid-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
            Clear All
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(25, 33, 48, 0.6)', borderRadius: '16px', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>You have no notifications at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((notif: any) => (
            <div 
              key={notif.id} 
              style={{ 
                padding: '1.5rem', 
                background: notif.isRead ? 'rgba(25, 33, 48, 0.6)' : 'rgba(56, 189, 248, 0.05)', 
                borderRadius: '16px', 
                backdropFilter: 'blur(20px)', 
                border: notif.isRead ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <p style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{notif.message || notif.content}</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {new Date(notif.createdAt || notif.date).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!notif.isRead && (
                  <button 
                    onClick={() => handleMarkAsRead(notif.id)}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    Mark as Read
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(notif.id)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
