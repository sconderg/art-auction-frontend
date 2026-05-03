# Admin Features — Full API Integration

## Goal

Expand the frontend to use all API endpoints from the OpenAPI spec, focusing on admin-facing features: Role management, Permissions management, User management, Category/Tag CRUD, Artwork moderation, and System Settings.

## Scope

### In Scope
- All `/api/Role/*` endpoints
- All `/api/Permissions/*` endpoints
- User management endpoints (`/artists`, `/buyers`, `/admins`, `/deleted`, approve/reject/block/unblock/restore/delete)
- Category CRUD (`/api/Category` — create, update, delete, restore, admin detail, stats, artworks-count, check-name)
- Tag CRUD (`/api/Tag` — create, update, delete, restore, admin detail, deleted, check-name, usage-count, usage)
- Artwork moderation (`/api/ArtWork` — rejected, deleted, restore, admin detail, stats, auction-status enum)
- System Settings update (`/api/SystemSetting` — PUT with logo upload)

### Out of Scope (future work)
- Password flows (forgot-password, reset-password, change-password)
- Email confirmation (confirm-email, resend-confirmation)
- Token refresh
- Profile editing for regular users
- Artist review UI
- Auction results dashboard
- Auction management (start, extend, close, current-price, is-active, is-ended)
- Bid validation and count endpoints
- WatchList watchers/count endpoints

## Architecture

### API Layer (`src/api.ts`)

Add new API objects and expand existing ones:

**New: `RoleAPI`**
- `getAll()` → GET `/api/Role`
- `create(roleName)` → POST `/api/Role/{roleName}`
- `delete(roleName)` → DELETE `/api/Role/{roleName}`
- `update(oldName, newName)` → PUT `/api/Role/update-role/{oldName}/{newName}`
- `assignRole(userId, roleName)` → POST `/api/Role/assign-role/{userId}/{roleName}`
- `unassignRole(userId, roleName)` → DELETE `/api/Role/unassign-role/{userId}/{roleName}`
- `assignRoles(userId, roles[])` → POST `/api/Role/assign-roles/{userId}` body: string[]
- `unassignRoles(userId, roles[])` → POST `/api/Role/unassign-roles/{userId}` body: string[]
- `removeAllRoles(userId)` → DELETE `/api/Role/remove-all-roles/{userId}`
- `getUserRoles(userId)` → GET `/api/Role/user-roles/{userId}`
- `userHasRole(userId, roleName)` → GET `/api/Role/user-has-role/{userId}/{roleName}`

**New: `PermissionsAPI`**
- `getAll()` → GET `/api/Permissions`
- `getByRole(roleId)` → GET `/api/Permissions/role/{roleId}`
- `check(roleName, permissionName)` → GET `/api/Permissions/check?roleName=&permissionName=`
- `assign(roleId, permission)` → POST `/api/Permissions/assign?roleId=&permission=`
- `remove(roleId, permission)` → DELETE `/api/Permissions/remove?roleId=&permission=`
- `assignBulk(data)` → POST `/api/Permissions/assign-bulk` body: `{ roleId, permissions[] }`
- `removeBulk(data)` → POST `/api/Permissions/remove-bulk` body: `{ roleId, permissions[] }`
- `reset(roleId)` → DELETE `/api/Permissions/reset/{roleId}`

**Expand: `CategoryAPI`**
- `create(data: FormData)` → POST `/api/Category` (multipart: Name, ImageFile, Description)
- `update(id, data: FormData)` → PUT `/api/Category/{id}` (multipart)
- `delete(id)` → DELETE `/api/Category/{id}`
- `restore(id)` → PUT `/api/Category/{id}/restore`
- `getAdminDetail(id, ignoreQueryFilter?)` → GET `/api/Category/{id}/admin`
- `getForUpdate(id)` → GET `/api/Category/{id}/update`
- `getStats()` → GET `/api/Category/stats`
- `getArtworksCount()` → GET `/api/Category/artworks-count`
- `checkName(name)` → GET `/api/Category/check-name?name=`

**Expand: `TagAPI`**
- `create(data)` → POST `/api/Tag` body: `{ name }`
- `update(id, data)` → PUT `/api/Tag/{id}` body: `{ name }`
- `delete(id)` → DELETE `/api/Tag/{id}`
- `restore(id)` → PUT `/api/Tag/{id}/restore`
- `getAdminDetail(id, ignoreQueryFilter?)` → GET `/api/Tag/{id}/admin`
- `getForUpdate(id)` → GET `/api/Tag/{id}/update`
- `getDeleted()` → GET `/api/Tag/deleted`
- `checkName(name)` → GET `/api/Tag/check-name?name=`
- `getUsageCount(id)` → GET `/api/Tag/{id}/usage-count`
- `getUsage()` → GET `/api/Tag/usage`

**Expand: `ArtWorkAPI`**
- `getRejected(params?)` → GET `/api/ArtWork/rejected`
- `getDeleted(params?)` → GET `/api/ArtWork/deleted`
- `restore(id)` → POST `/api/ArtWork/{id}/restore`
- `update(id, data)` → PUT `/api/ArtWork/{id}`
- `delete(id)` → DELETE `/api/ArtWork/{id}`
- `getAdminDetail(id)` → GET `/api/ArtWork/{id}/admin`
- `getStats(artistId?)` → GET `/api/ArtWork/stats`
- `isTitleAvailable(title)` → GET `/api/ArtWork/is-title-available?title=`
- `getAuctionStatuses()` → GET `/api/ArtWork/auction-status`

**Expand: `ProfileAPI`** (rename to `UserAPI` for clarity)
- `getAdmins()` → GET `/admins`
- `getDeleted(term?)` → GET `/deleted`
- `approveArtist(artistId)` → PUT `/{artistId}/approve`
- `rejectArtist(artistId)` → PUT `/{artistId}/reject`
- `updateProfile(data)` → PUT `/update-profile`
- `updateProfileImage(data: FormData)` → PUT `/update-profile-image`
- `deleteProfile()` → DELETE `/delete-profile`
- `adminUpdateUser(userId, data)` → PUT `/{userId}`
- `adminDeleteUser(userId)` → DELETE `/{userId}`
- `restoreUser(userId)` → PUT `/{userId}/restore`
- `blockUser(userId)` → PUT `/{userId}/block`
- `unblockUser(userId)` → PUT `/{userId}/unblock`
- `getArtistStatuses()` → GET `/artist-status`

### Admin Dashboard UI (`src/pages/AdminDashboard.tsx`)

Expand the existing single-page dashboard with a horizontal tab bar. Each tab renders a section inline (no routing changes).

**Tabs:**

1. **Pending Artworks** — existing functionality, unchanged
2. **Artworks (Rejected/Deleted)** — two sub-lists. Each artwork card shows title, artist, image, status. Actions: Restore button
3. **Users** — four sub-sections toggled by buttons: Artists (with status filter dropdown: All/Pending/Approved/Rejected), Buyers, Admins, Deleted Users. Each user row shows name, email, roles. Actions per user type:
   - Artists: Approve, Reject, Block/Unblock, Delete, Edit Roles
   - Buyers: Block/Unblock, Delete, Edit Roles
   - Admins: listed read-only
   - Deleted: Restore
4. **Roles** — table of all roles. Actions: Create (input + button), Rename (inline edit), Delete (with confirm). Clicking a role opens an inline permissions editor (checkbox grid)
5. **Permissions** — dropdown to select a role, then a checkbox list of all available permissions. Save button calls `assignBulk`/`removeBulk` to sync. Reset button calls `reset(roleId)`
6. **Categories** — table with Name, Image, Description, Status (active/deleted), Artwork Count. Actions: Create (modal/inline form with image upload), Edit, Delete, Restore. Name uniqueness check on blur
7. **Tags** — table with Name, Status, Usage Count. Actions: Create, Edit, Delete, Restore. Name uniqueness check on blur
8. **System Settings** — form with fields: Site Name, Logo (file upload + preview), Email, Phone, Facebook URL, Twitter URL, Instagram URL, YouTube URL. Load current values on mount, save via PUT multipart

### Component Structure

Keep everything in `AdminDashboard.tsx` with helper components extracted as needed. The tab state is a simple `useState<string>` toggling which section renders.

Each section follows the same pattern:
1. `useEffect` fetches data when tab becomes active
2. State holds the list/form data
3. Actions call API, show toast, refresh data

### Patterns & Conventions

- Inline styles matching existing glass-morphism theme (`rgba(25, 33, 48, 0.6)`, `backdrop-filter: blur(20px)`, `border: 1px solid rgba(255,255,255,0.08)`)
- `react-hot-toast` for success/error feedback
- `window.confirm()` for destructive actions
- `any` types (matching existing codebase style)
- Reuse existing CSS classes: `bid-btn`, `auth-input`, `spinner`, `loading-state`
- No new dependencies needed

### Error Handling

- API errors handled by existing axios interceptor (401 → logout, 403 → console warn, others → toast)
- Optimistic UI not used — always wait for API response, then refresh
- Loading spinners per-section using existing `.spinner` class

## File Changes

| File | Change |
|------|--------|
| `src/api.ts` | Add RoleAPI, PermissionsAPI. Expand CategoryAPI, TagAPI, ArtWorkAPI, ProfileAPI, SystemSettingAPI |
| `src/pages/AdminDashboard.tsx` | Rewrite with tabbed layout containing all 8 sections |
