import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArtWorkAPI, CategoryAPI } from '../api';

const API_BASE_URL = 'http://artauction.runasp.net';

export const fixImageUrl = (url: string) => {
  if (!url) return '';
  if (url.includes('localhost')) {
    const path = url.split('/').slice(3).join('/');
    return `${API_BASE_URL}/${path}`;
  }
  return url;
};

export const getStatusText = (status: number) => {
  switch (status) {
    case 1: return { text: 'Pending', class: 'status-pending' };
    case 2: return { text: 'Active Auction', class: 'status-active' };
    case 3: return { text: 'Ended', class: 'status-ended' };
    default: return { text: 'Unknown', class: 'status-pending' };
  }
};

export function Home() {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    CategoryAPI.getDropdown()
      .then(res => {
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else if (res.data?.data) {
          setCategories(res.data.data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: any = { Page: 1, PageSize: 20 };
    if (selectedCategory) params.CategoryId = selectedCategory;

    ArtWorkAPI.getAll(params)
      .then((res) => {
        if (res.data?.success && res.data?.data?.items) {
          setArtworks(res.data.data.items);
        } else {
          setError(res.data?.message || 'Error fetching data');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  return (
    <main>
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '1rem 0', marginBottom: '1rem' }}>
          <button 
            onClick={() => setSelectedCategory(null)}
            style={{ 
              padding: '0.5rem 1.5rem', 
              borderRadius: '20px', 
              border: 'none', 
              cursor: 'pointer',
              background: selectedCategory === null ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              whiteSpace: 'nowrap'
            }}
          >
            All Categories
          </button>
          {categories.map((cat: any) => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{ 
                padding: '0.5rem 1.5rem', 
                borderRadius: '20px', 
                border: 'none', 
                cursor: 'pointer',
                background: selectedCategory === cat.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                whiteSpace: 'nowrap'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Curating the gallery...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && artworks.length === 0 && (
        <div className="empty-state">
          <p>No artworks are currently up for auction.</p>
        </div>
      )}

      {!loading && artworks.length > 0 && (
        <div className="art-grid">
          {artworks.map((art) => {
            const status = getStatusText(art.auctionStatus);
            return (
              <div className="art-card" key={art.id}>
                <div className="art-image-container">
                  <img 
                    src={fixImageUrl(art.mainImage)} 
                    alt={art.title} 
                    className="art-image" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className={`status-badge ${status.class}`}>
                    {status.text}
                  </div>
                </div>
                
                <div className="art-info">
                  <h3 className="art-title">{art.title}</h3>
                  <p className="art-artist">by {art.artistName}</p>
                  
                  <p className="art-desc">
                    Category: {art.categoryName}<br />
                    Ends: {new Date(art.endTime).toLocaleDateString()}
                  </p>
                  
                  <div className="art-footer">
                    <div className="price-box">
                      <p>Current Bid</p>
                      <span>${art.currentPrice?.toFixed(2) || art.buyNowPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                    <Link to={`/artwork/${art.id}`}>
                      <button className="bid-btn">View Details</button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
