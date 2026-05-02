import { useState } from 'react';
import { AccountAPI } from '../api';
import { useNavigate } from 'react-router-dom';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await AccountAPI.login({ userName: email, password });
        if (res.data?.data?.accessToken || res.data?.accessToken) {
          const token = res.data?.data?.accessToken || res.data?.accessToken;
          localStorage.setItem('auth_token', token);
          navigate('/');
        } else {
          setError(res.data?.message || 'Login failed');
        }
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        await AccountAPI.register({ 
          fullName, 
          email, 
          phoneNumber, 
          password, 
          confirmPassword, 
          address, 
          role: 0 
        });
        
        // Auto switch to login
        setIsLogin(true);
        setError('Registration successful. Please log in.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'rgba(25, 33, 48, 0.6)', borderRadius: '16px', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#38bdf8' }}>{isLogin ? 'Sign In' : 'Create Account'}</h2>
      
      {error && <div style={{ padding: '1rem', background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!isLogin && (
          <>
            <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required className="auth-input" />
            <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="auth-input" />
            <input type="text" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} required className="auth-input" />
          </>
        )}
        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="auth-input" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="auth-input" />
        
        {!isLogin && (
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="auth-input" />
        )}
        
        <button type="submit" disabled={loading} className="bid-btn" style={{ marginTop: '1rem' }}>
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
        </button>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button 
          onClick={() => { setIsLogin(!isLogin); setError(''); }} 
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
}
