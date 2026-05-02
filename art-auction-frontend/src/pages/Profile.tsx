import { useEffect, useState } from 'react';
import { ProfileAPI, BidAPI } from '../api';

export function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ProfileAPI.getMyProfile().catch(() => null),
      BidAPI.getUserBids().catch(() => null)
    ]).then(([profRes, bidsRes]) => {
      if (profRes?.data?.success) setProfile(profRes.data.data);
      if (bidsRes?.data?.success) setBids(bidsRes.data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '300px', background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '16px' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>My Profile</h2>
        {profile ? (
          <div>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Name: {profile.firstName} {profile.lastName}</p>
            <p style={{ color: 'var(--text-secondary)' }}>Email: {profile.email}</p>
          </div>
        ) : (
          <p>Please log in to view profile details.</p>
        )}
      </div>

      <div style={{ flex: 2, minWidth: '300px' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>My Recent Bids</h2>
        {bids.length === 0 ? <p className="empty-state">You haven't placed any bids yet.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bids.map((bid, i) => (
              <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ color: 'var(--text-primary)' }}>Artwork ID: {bid.artWorkId}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date(bid.bidTime).toLocaleString()}</p>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>
                  ${bid.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
