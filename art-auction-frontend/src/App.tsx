import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { getUserRole } from './api';

import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { ArtWorkDetail } from './pages/ArtWorkDetail';
import { WatchList } from './pages/WatchList';
import { Profile } from './pages/Profile';
import { Notifications } from './pages/Notifications';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/artwork/:id" element={<ArtWorkDetail />} />
          <Route path="/watchlist" element={<WatchList />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin" element={getUserRole() === 'Admin' ? <AdminDashboard /> : <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>Access Forbidden</div>} />
        </Routes>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
      </div>
    </Router>
  );
}
