import axios from 'axios';

const API_BASE_URL = 'http://artauction.runasp.net';

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
  getPending: (params?: any) => api.get('/api/ArtWork/pending', { params }),
  getRejected: (params?: any) => api.get('/api/ArtWork/rejected', { params }),
  getDeleted: (params?: any) => api.get('/api/ArtWork/deleted', { params }),
  create: (data: FormData) => api.post('/api/ArtWork', data),
  update: (id: number, data: any) => api.put(`/api/ArtWork/${id}`, data),
  delete: (id: number) => api.delete(`/api/ArtWork/${id}`),
  restore: (id: number) => api.post(`/api/ArtWork/${id}/restore`),
  approve: (id: number | string) => api.post(`/api/ArtWork/${id}/approve`),
  reject: (id: number | string) => api.post(`/api/ArtWork/${id}/reject`),
  getAdminDetail: (id: number) => api.get(`/api/ArtWork/${id}/admin`),
  getForUpdate: (id: number) => api.get(`/api/ArtWork/${id}/update`),
  getStats: (artistId?: string) => api.get('/api/ArtWork/stats', { params: { artistId } }),
  isTitleAvailable: (title: string) => api.get('/api/ArtWork/is-title-available', { params: { title } }),
  getAuctionStatuses: () => api.get('/api/ArtWork/auction-status'),
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
  getAll: (params?: any) => api.get('/api/Category', { params }),
  getDropdown: () => api.get('/api/Category/dropdown'),
  create: (data: FormData) => api.post('/api/Category', data),
  update: (id: number, data: FormData) => api.put(`/api/Category/${id}`, data),
  delete: (id: number) => api.delete(`/api/Category/${id}`),
  restore: (id: number) => api.put(`/api/Category/${id}/restore`),
  getAdminDetail: (id: number, ignoreQueryFilter = false) => api.get(`/api/Category/${id}/admin`, { params: { ignoreQueryFilter } }),
  getForUpdate: (id: number) => api.get(`/api/Category/${id}/update`),
  getStats: () => api.get('/api/Category/stats'),
  getArtworksCount: () => api.get('/api/Category/artworks-count'),
  checkName: (name: string) => api.get('/api/Category/check-name', { params: { name } }),
};

// === Tags ===
export const TagAPI = {
  getAll: (searchTerm?: string) => api.get('/api/Tag', { params: { searchTerm } }),
  getDropdown: () => api.get('/api/Tag/dropdown'),
  create: (data: { name: string }) => api.post('/api/Tag', data),
  update: (id: number, data: { name: string }) => api.put(`/api/Tag/${id}`, data),
  delete: (id: number) => api.delete(`/api/Tag/${id}`),
  restore: (id: number) => api.put(`/api/Tag/${id}/restore`),
  getAdminDetail: (id: number, ignoreQueryFilter = false) => api.get(`/api/Tag/${id}/admin`, { params: { ignoreQueryFilter } }),
  getForUpdate: (id: number) => api.get(`/api/Tag/${id}/update`),
  getDeleted: () => api.get('/api/Tag/deleted'),
  checkName: (name: string) => api.get('/api/Tag/check-name', { params: { name } }),
  getUsageCount: (id: number) => api.get(`/api/Tag/${id}/usage-count`),
  getUsage: () => api.get('/api/Tag/usage'),
};

// === Profile / Users ===
export const ProfileAPI = {
  getMyProfile: () => api.get('/my-profile'),
  getArtists: (params?: any) => api.get('/artists', { params }),
  getBuyers: (term?: string) => api.get('/buyers', { params: { term } }),
  getAdmins: () => api.get('/admins'),
  getDeleted: (term?: string) => api.get('/deleted', { params: { term } }),
  approveArtist: (artistId: string) => api.put(`/${artistId}/approve`),
  rejectArtist: (artistId: string) => api.put(`/${artistId}/reject`),
  updateProfile: (data: any) => api.put('/update-profile', data),
  updateProfileImage: (data: FormData) => api.put('/update-profile-image', data),
  deleteProfile: () => api.delete('/delete-profile'),
  adminUpdateUser: (userId: string, data: any) => api.put(`/${userId}`, data),
  adminDeleteUser: (userId: string) => api.delete(`/${userId}`),
  restoreUser: (userId: string) => api.put(`/${userId}/restore`),
  blockUser: (userId: string) => api.put(`/${userId}/block`),
  unblockUser: (userId: string) => api.put(`/${userId}/unblock`),
  getArtistStatuses: () => api.get('/artist-status'),
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

// === Role ===
export const RoleAPI = {
  getAll: () => api.get('/api/Role'),
  create: (roleName: string) => api.post(`/api/Role/${encodeURIComponent(roleName)}`),
  delete: (roleName: string) => api.delete(`/api/Role/${encodeURIComponent(roleName)}`),
  update: (oldName: string, newName: string) => api.put(`/api/Role/update-role/${encodeURIComponent(oldName)}/${encodeURIComponent(newName)}`),
  assignRole: (userId: string, roleName: string) => api.post(`/api/Role/assign-role/${userId}/${encodeURIComponent(roleName)}`),
  unassignRole: (userId: string, roleName: string) => api.delete(`/api/Role/unassign-role/${userId}/${encodeURIComponent(roleName)}`),
  assignRoles: (userId: string, roles: string[]) => api.post(`/api/Role/assign-roles/${userId}`, roles),
  unassignRoles: (userId: string, roles: string[]) => api.post(`/api/Role/unassign-roles/${userId}`, roles),
  removeAllRoles: (userId: string) => api.delete(`/api/Role/remove-all-roles/${userId}`),
  getUserRoles: (userId: string) => api.get(`/api/Role/user-roles/${userId}`),
  userHasRole: (userId: string, roleName: string) => api.get(`/api/Role/user-has-role/${userId}/${encodeURIComponent(roleName)}`),
};

// === Permissions ===
export const PermissionsAPI = {
  getAll: () => api.get('/api/Permissions'),
  getByRole: (roleId: string) => api.get(`/api/Permissions/role/${roleId}`),
  check: (roleName: string, permissionName: string) => api.get('/api/Permissions/check', { params: { roleName, permissionName } }),
  assign: (roleId: string, permission: string) => api.post('/api/Permissions/assign', null, { params: { roleId, permission } }),
  remove: (roleId: string, permission: string) => api.delete('/api/Permissions/remove', { params: { roleId, permission } }),
  assignBulk: (data: { roleId: string; permissions: string[] }) => api.post('/api/Permissions/assign-bulk', data),
  removeBulk: (data: { roleId: string; permissions: string[] }) => api.post('/api/Permissions/remove-bulk', data),
  reset: (roleId: string) => api.delete(`/api/Permissions/reset/${roleId}`),
};
