# Beta Token Request System Documentation

## Overview

This document describes the Beta Token Request System implemented in ImageLingo, which allows users to request beta tokens and enables admin approval through a dedicated dashboard.

## Architecture

### Database Schema

**Table: `beta_requests`**
- `id` (uuid): Primary key
- `user_id` (uuid): Foreign key to auth.users
- `email` (text): User's email address
- `status` (enum): 'pending', 'approved', or 'rejected'
- `credits_granted` (integer): Number of credits granted upon approval
- `created_at` (timestamptz): Request creation timestamp
- `updated_at` (timestamptz): Last update timestamp
- `approved_at` (timestamptz): Approval timestamp (nullable)
- `approved_by` (text): Admin email who approved (nullable)

**Constraints:**
- One request per user (enforced by unique constraint on `user_id`)
- Row Level Security (RLS) enabled - users can only view their own requests

### API Endpoints

#### User Endpoints

**POST `/api/beta/request`**
- **Purpose**: Submit a beta token request
- **Authentication**: Required (any authenticated user)
- **Security**: 
  - Validates user is authenticated
  - Prevents duplicate requests (one per user)
  - Sanitizes input
- **Response**:
  - 201: Request created successfully
  - 400: Duplicate request or invalid input
  - 401: Unauthorized
  - 500: Server error

**GET `/api/beta/request`**
- **Purpose**: Check current user's beta request status
- **Authentication**: Required
- **Response**:
  - 200: Request status returned (or no request found)
  - 401: Unauthorized
  - 500: Server error

#### Admin Endpoints

**GET `/api/admin/beta-requests`**
- **Purpose**: List all beta token requests
- **Authentication**: Required (admin only - lihaoz0214@gmail.com)
- **Security**: 
  - Email whitelist enforced
  - Uses admin client to bypass RLS
  - Never exposed to non-admin users
- **Response**:
  - 200: Array of all requests with user info
  - 401: Unauthorized
  - 403: Forbidden (non-admin)
  - 500: Server error

**POST `/api/admin/beta-approve`**
- **Purpose**: Approve a beta token request and grant credits
- **Authentication**: Required (admin only)
- **Request Body**:
  ```json
  {
    "requestId": "uuid",
    "creditsToGrant": 100
  }
  ```
- **Security**:
  - Email whitelist enforced
  - Input validation and sanitization
  - Logs all approval actions
- **Actions**:
  1. Updates request status to 'approved'
  2. Records approval timestamp and admin email
  3. Adds credits to user's subscription
- **Response**:
  - 200: Request approved successfully
  - 400: Invalid input or already approved
  - 401: Unauthorized
  - 403: Forbidden (non-admin)
  - 404: Request not found
  - 500: Server error

### Frontend Components

#### BillingPanel Component
**Location**: `/components/BillingPanel.tsx`

**Enhancements**:
- Added "Beta Token Program" section in "Add Tokens" tab
- Shows "Request Beta Tokens" button if user hasn't requested
- Displays status badge if request is pending or approved
- Auto-fetches request status when panel opens
- Prevents multiple requests from same user

**States**:
- `none`: No request submitted - shows request button
- `pending`: Request submitted, waiting for approval
- `approved`: Request approved, credits granted
- `loading`: Fetching status

#### Admin Dashboard
**Location**: `/app/admin/beta-requests/page.tsx`

**Features**:
- Lists all beta requests in a sortable table
- Shows summary statistics (total, pending, approved)
- One-click approval with confirmation
- Real-time status updates
- Responsive design matching app theme

**Access Control**:
- Client-side: Redirects non-admin users to home
- Server-side: API endpoints validate admin email
- Not indexed by search engines (robots.txt)
- No public links to dashboard

### Security Implementation

#### Admin Middleware
**Location**: `/lib/admin-middleware.ts`

**Functions**:
- `authenticateAdmin()`: Checks if current user is admin
- `requireAdmin()`: Middleware for admin-only routes
- `isAdminEmail()`: Helper to check if email is admin

**Admin Whitelist**:
- Only `lihaoz0214@gmail.com` has admin access
- Hardcoded in middleware (never exposed to client)
- Enforced on every admin API call

#### Security Measures

1. **Authentication & Authorization**
   - All endpoints require authentication
   - Admin endpoints require specific email match
   - Row Level Security (RLS) on database

2. **Input Validation**
   - Request IDs validated as UUIDs
   - Credit amounts validated (1-10000)
   - Email sanitization through Supabase Auth

3. **Privacy Protection**
   - User data only visible to request owner and admin
   - Admin dashboard not indexed by search engines
   - No public API to list users or requests

4. **Audit Trail**
   - All approvals logged with admin email
   - Timestamps recorded for all actions
   - Server-side logging for admin actions

## Deployment Instructions

### Database Migration

1. Run the migration to create the `beta_requests` table:
   ```bash
   supabase db push
   ```
   Or apply migration file: `supabase/migrations/20251227000000_beta_requests.sql`

2. Verify table and RLS policies are created:
   ```sql
   SELECT * FROM beta_requests;
   ```

### Environment Setup

Required environment variables (should already be configured):
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for admin operations)

### Deployment Checklist

- [x] Database migration applied
- [x] Environment variables configured
- [x] robots.txt updated to block /admin/ routes
- [x] Admin email configured in middleware
- [x] Tests passing
- [ ] Verify admin can access dashboard at `/admin/beta-requests`
- [ ] Verify regular users cannot access admin endpoints
- [ ] Verify users can request tokens only once
- [ ] Verify approval grants credits correctly

## Usage Guide

### For Users

1. **Request Beta Tokens**:
   - Click on token balance in header
   - Navigate to "Add Tokens" tab
   - Click "Request Beta Tokens" button
   - Wait for admin approval

2. **Check Status**:
   - Open billing panel
   - View status in Beta Token Program section
   - Status shown: Pending ⏳, Approved ✓

### For Admin

1. **Access Dashboard**:
   - Navigate to `/admin/beta-requests`
   - Must be logged in as lihaoz0214@gmail.com
   - Dashboard shows all requests

2. **Approve Request**:
   - Click "Approve" button on pending request
   - Confirm approval (default: 100 credits)
   - Credits automatically added to user account
   - User can immediately use the credits

3. **Monitor Requests**:
   - View summary stats at top
   - Sort and filter requests
   - Check approval history
   - Verify credit assignments

## Testing

### Automated Tests

Run tests:
```bash
npm test
```

Test files:
- `__tests__/api/beta-request.test.ts`: API endpoint tests
- `__tests__/lib/admin-middleware.test.ts`: Admin authentication tests

All tests passing: ✅ 16/16

### Manual Testing Scenarios

1. **User Request Flow**:
   - [ ] User can request beta tokens
   - [ ] Duplicate request is prevented
   - [ ] Status updates correctly in UI

2. **Admin Approval Flow**:
   - [ ] Admin can view all requests
   - [ ] Admin can approve requests
   - [ ] Credits are granted correctly
   - [ ] Status updates in database

3. **Security Tests**:
   - [ ] Non-admin cannot access admin endpoints
   - [ ] Users cannot view other users' requests
   - [ ] Input validation prevents malicious data
   - [ ] RLS policies enforced

## Troubleshooting

### Common Issues

**Issue**: Admin dashboard redirects to home
- **Solution**: Verify you're logged in as lihaoz0214@gmail.com

**Issue**: "Request Beta Tokens" button doesn't work
- **Solution**: Check browser console for errors, verify API endpoints are accessible

**Issue**: Credits not granted after approval
- **Solution**: Check server logs, verify subscription exists for user

**Issue**: Duplicate request error
- **Solution**: User has already requested, check request status via GET endpoint

## Future Enhancements

Potential improvements:
- Add email notifications for approval
- Support custom credit amounts per request
- Add rejection functionality with reason
- Implement request expiration
- Add analytics dashboard for admin
- Support multiple admin users
- Add bulk approval functionality

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify environment variables are set
- Ensure database migration was applied
- Review RLS policies in Supabase dashboard

## Changelog

### 2024-12-27 - Initial Implementation
- Created beta_requests table with RLS policies
- Implemented user request API endpoints
- Implemented admin dashboard and approval API
- Added admin authentication middleware
- Updated BillingPanel component
- Added comprehensive tests
- Updated robots.txt for admin route protection
