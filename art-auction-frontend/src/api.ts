import axios from 'axios';

const API_BASE_URL = 'https://artauction.runasp.net';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUserRole = (): string | null => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
  } catch {
    return null;
  }
};

import toast from 'react-hot-toast';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('auth_token');
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
      } else if (error.response.status === 403) {
        // Silently handle 403 or log it to prevent spamming normal users
        console.warn('Access Forbidden to this resource.');
      } else {
        const message = error.response.data?.message || 'An error occurred';
        toast.error(message);
      }
    } else {
      toast.error('Network error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

// === Account ===
export const AccountAPI = {
  register: (data: any) => api.post('/api/Account/register', data),
  login: (data: any) => api.post('/api/Account/login', data),
  logout: () => api.post('/api/Account/logout', {}),
  getRoles: () => api.get('/api/Account/roles'),
};

// === ArtWork ===
export const ArtWorkAPI = {
  getAll: (params?: any) => api.get('/api/ArtWork', { params }),
  getById: (id: number | string) => api.get(`/api/ArtWork/${id}`),
  getPending: () => api.get('/api/ArtWork/pending'),
  create: (data: FormData) => api.post('/api/ArtWork', data),
  approve: (id: number | string) => api.post(`/api/ArtWork/${id}/approve`),
  reject: (id: number | string) => api.post(`/api/ArtWork/${id}/reject`),
};

// === Auction ===
export const AuctionAPI = {
  start: (id: number | string) => api.post(`/api/Auction/${id}/start`),
  close: (id: number | string) => api.post(`/api/Auction/${id}/close`),
  buyNow: (data: any) => api.post('/api/Auction/buy-now', data),
  getStats: () => api.get('/api/Auction/stats'),
};

// === Bidding ===
export const BidAPI = {
  placeBid: (data: any) => api.post('/api/Bid', data),
  getHistory: (artWorkId: number | string) => api.get(`/api/Bid/history/${artWorkId}`),
  getHighest: (artWorkId: number | string) => api.get(`/api/Bid/highest/${artWorkId}`),
  getUserBids: () => api.get('/api/Bid/buyer-bids'),
};

// === WatchList ===
export const WatchListAPI = {
  add: (artWorkId: number | string) => api.post(`/api/WatchList/${artWorkId}`),
  remove: (artWorkId: number | string) => api.delete(`/api/WatchList/${artWorkId}`),
  getAll: () => api.get('/api/WatchList'),
  checkExists: (artWorkId: number | string) => api.get(`/api/WatchList/${artWorkId}/exists`),
};

// === Category ===
export const CategoryAPI = {
  getAll: () => api.get('/api/Category'),
  getDropdown: () => api.get('/api/Category/dropdown'),
};

// === Tags ===
export const TagAPI = {
  getAll: () => api.get('/api/Tag'),
  getDropdown: () => api.get('/api/Tag/dropdown'),
};

// === Profile / Users ===
export const ProfileAPI = {
  getMyProfile: () => api.get('/my-profile'),
  getArtists: () => api.get('/artists'),
  getBuyers: () => api.get('/buyers'),
};

// === Notification ===
export const NotificationAPI = {
  getAll: () => api.get('/api/Notification'),
  getUnread: () => api.get('/api/Notification/unread'),
  getUnreadCount: () => api.get('/api/Notification/unread-count'),
  getById: (id: number) => api.get(`/api/Notification/${id}`),
  delete: (id: number) => api.delete(`/api/Notification/${id}`),
  markAsRead: (id: number) => api.put(`/api/Notification/${id}/read`),
  markAllAsRead: () => api.put('/api/Notification/read-all'),
  clearAll: () => api.delete('/api/Notification/clear'),
};

// === ArtistReview ===
export const ArtistReviewAPI = {
  getByArtist: (artistId: string) => api.get(`/api/ArtistReview/artist/${artistId}`),
  getByBuyer: (buyerId: string) => api.get(`/api/ArtistReview/buyer/${buyerId}`),
  create: (artistId: string, data: any) => api.post(`/api/ArtistReview/${artistId}`, data),
  update: (artistId: string, buyerId: string, data: any) => api.put(`/api/ArtistReview/${artistId}/${buyerId}`, data),
  delete: (artistId: string, buyerId: string) => api.delete(`/api/ArtistReview/${artistId}/${buyerId}`),
  getSummary: (artistId: string) => api.get(`/api/ArtistReview/summary/${artistId}`),
};

// === AuctionResult ===
export const AuctionResultAPI = {
  getAll: (searchTerm?: string) => api.get('/api/AuctionResult', { params: { searchTerm } }),
  getById: (id: number) => api.get(`/api/AuctionResult/${id}`),
  getByArtWork: (artWorkId: number) => api.get(`/api/AuctionResult/artwork/${artWorkId}`),
  getWinner: (artWorkId: number) => api.get(`/api/AuctionResult/winner/${artWorkId}`),
};

// === SystemSetting ===
export const SystemSettingAPI = {
  get: () => api.get('/api/SystemSetting'),
  update: (data: FormData) => api.put('/api/SystemSetting', data),
};
