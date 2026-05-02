import { useEffect, useState } from 'react';
import { WatchListAPI } from '../api';
import { Link } from 'react-router-dom';
import { fixImageUrl } from './Home';

export function WatchList() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    WatchListAPI.getAll()
      .then(res => {
        if (res.data?.success) {
          // The API might return an array of watchlist objects
          setItems(res.data.data);
        } else {
          setError(res.data?.message || 'Failed to load watchlist');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;
  if (error) return <div className="error-state">{error}</div>;
  if (items.length === 0) return <div className="empty-state">Your watchlist is empty.</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>My Watchlist</h2>
      <div className="art-grid">
        {items.map((item: any) => {
          // Fallback depending on whether API returns full artwork details inside watchlist object or just flattened
          const art = item.artWork || item; 
          return (
            <div className="art-card" key={art.id}>
              <div className="art-image-container">
                <img src={fixImageUrl(art.mainImage)} alt={art.title} className="art-image" />
              </div>
              <div className="art-info">
                <h3 className="art-title">{art.title}</h3>
                <Link to={`/artwork/${art.id}`}>
                  <button className="bid-btn" style={{ width: '100%', marginTop: '1rem' }}>View Auction</button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
