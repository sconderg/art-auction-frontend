import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArtWorkAPI, BidAPI, WatchListAPI, AuctionAPI } from '../api';
import { fixImageUrl, getStatusText } from './Home';
import toast from 'react-hot-toast';

export function ArtWorkDetail() {
  const { id } = useParams<{ id: string }>();
  const [artWork, setArtWork] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      const artRes = await ArtWorkAPI.getById(id);
      if (artRes.data?.success) {
        setArtWork(artRes.data.data);
      }
      
      const bidRes = await BidAPI.getHistory(id);
      if (bidRes.data?.success) {
        setBids(bidRes.data.data);
      }

      if (localStorage.getItem('auth_token')) {
        try {
          const watchRes = await WatchListAPI.checkExists(id);
          setInWatchlist(watchRes.data?.data === true);
        } catch (e) {
          // ignore or handle silently
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const res = await BidAPI.placeBid({ 
        artWorkId: parseInt(id), 
        amount: parseFloat(bidAmount),
        rowVersion: artWork?.rowVersion 
      });
      if (res.data?.success) {
        toast.success('Bid placed successfully!');
        setBidAmount('');
        fetchDetails(); // Refresh
      } else {
        toast.error(res.data?.message || 'Failed to place bid');
      }
    } catch (err: any) {
      // Handled by global interceptor, but we can do custom logic if we want
    }
  };

  const handleBuyNow = async () => {
    if (!id) return;
    try {
      const res = await AuctionAPI.buyNow({ 
        artWorkId: parseInt(id),
        rowVersion: artWork?.rowVersion
      });
      if (res.data?.success) {
        toast.success('Artwork purchased successfully!');
        fetchDetails();
      } else {
        toast.error(res.data?.message || 'Purchase failed');
      }
    } catch (err: any) {
      // Error handled by interceptor
    }
  };

  const handleWatchlistToggle = async () => {
    if (!id) return;
    try {
      if (inWatchlist) {
        await WatchListAPI.remove(id);
        setInWatchlist(false);
        toast.success('Removed from watchlist');
      } else {
        await WatchListAPI.add(id);
        setInWatchlist(true);
        toast.success('Added to watchlist');
      }
    } catch (err: any) {
      // Error handled by interceptor
    }
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>;
  if (!artWork) return <div className="error-state">Artwork not found</div>;

  const status = getStatusText(artWork.auctionStatus);

  const mainImageObj = artWork.images?.find((img: any) => img.isMain) || artWork.images?.[0];
  const imageUrl = mainImageObj ? mainImageObj.name : artWork.mainImage;

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <div style={{ flex: '1', minWidth: '300px' }}>
        <img 
          src={fixImageUrl(imageUrl)} 
          alt={artWork.title} 
          style={{ width: '100%', borderRadius: '16px', border: '1px solid var(--border-color)' }} 
        />
      </div>
      <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>{artWork.title}</h1>
        <p style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }}>by {artWork.artistName}</p>
        <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>{artWork.description}</p>
        
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
          <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Status: <span className={status.class}>{status.text}</span></p>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.5rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Initial Price: <br/><span style={{ color: '#fff', fontSize: '1.2rem' }}>${artWork.initialPrice}</span></p>
            <p style={{ color: 'var(--text-secondary)' }}>Buy Now: <br/><span style={{ color: '#fff', fontSize: '1.2rem' }}>${artWork.buyNowPrice}</span></p>
            <p style={{ color: 'var(--text-secondary)' }}>Total Bids: <br/><span style={{ color: '#fff', fontSize: '1.2rem' }}>{artWork.totalBids || bids.length}</span></p>
          </div>
          <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Current Price: <span style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 'bold' }}>${artWork.currentPrice}</span></p>
          <p style={{ color: 'var(--text-secondary)' }}>Ends: {new Date(artWork.endTime).toLocaleString()}</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={handleWatchlistToggle} className="bid-btn" style={{ background: inWatchlist ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#fff', flex: 1 }}>
            {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
          {artWork.buyNowPrice > 0 && artWork.auctionStatus !== 2 && artWork.auctionStatus !== 3 && (
             <button onClick={handleBuyNow} className="bid-btn" style={{ background: '#10b981', color: '#fff', flex: 1 }}>
               Buy Now (${artWork.buyNowPrice})
             </button>
          )}
        </div>

        <form onSubmit={handleBid} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <input 
            type="number" 
            value={bidAmount} 
            onChange={e => setBidAmount(e.target.value)} 
            placeholder="Bid Amount" 
            required 
            className="auth-input" 
            style={{ flex: 1 }}
          />
          <button type="submit" className="bid-btn">Place Bid</button>
        </form>

        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Bid History</h3>
          {bids.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No bids yet.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {bids.map((bid, i) => (
                <li key={i} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{bid.buyerName || 'Anonymous'}</span>
                  <span style={{ color: '#34d399', fontWeight: 'bold' }}>${bid.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
