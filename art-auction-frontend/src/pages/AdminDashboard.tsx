import { useEffect, useState } from 'react';
import { ArtWorkAPI } from '../api';
import toast from 'react-hot-toast';
import { fixImageUrl } from './Home';

export function AdminDashboard() {
  const [pendingArtworks, setPendingArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await ArtWorkAPI.getPending();
      if (res.data?.success) {
        setPendingArtworks(res.data.data.items || []);
      } else if (res.data?.items) {
        setPendingArtworks(res.data.items);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await ArtWorkAPI.approve(id);
      toast.success('Artwork approved');
      fetchPending();
    } catch (err) { }
  };

  const handleReject = async (id: number) => {
    try {
      await ArtWorkAPI.reject(id);
      toast.success('Artwork rejected');
      fetchPending();
    } catch (err) { }
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 2rem' }}>
      <h2 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>Admin Dashboard</h2>
      
      <div style={{ background: 'rgba(25, 33, 48, 0.6)', borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>Pending Artworks</h3>
        
        {pendingArtworks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No pending artworks at the moment.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {pendingArtworks.map(art => (
              <div key={art.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                <img 
                  src={fixImageUrl(art.mainImage || art.images?.[0]?.name)} 
                  alt={art.title} 
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
                <div style={{ padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{art.title}</h4>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>by {art.artistName}</p>
                  <p style={{ margin: '0 0 1rem 0', color: '#10b981', fontWeight: 'bold' }}>Initial Price: ${art.initialPrice}</p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleApprove(art.id)}
                      className="bid-btn"
                      style={{ flex: 1, background: '#10b981', padding: '0.5rem' }}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(art.id)}
                      className="bid-btn"
                      style={{ flex: 1, background: '#ef4444', padding: '0.5rem' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
