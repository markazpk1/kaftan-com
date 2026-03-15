# Analytics Setup Instructions

## Overview
The admin analytics dashboard now supports real data tracking instead of mock data. To enable real analytics, you need to run the database migration to create the necessary tables.

## Database Tables Created
- `page_views` - Tracks all page visits
- `sessions` - Tracks user sessions 
- `traffic_sources` - Tracks where traffic comes from

## Setup Steps

### 1. Run the Migration
Go to your Supabase dashboard and run the SQL migration:

1. Open: https://app.supabase.com/project/nhwoqzokmujucwxbdtjk/sql
2. Copy the contents of `supabase/migrations/20260314000006_create_analytics_tables.sql`
3. Paste and execute the SQL

### 2. What the Migration Does
- Creates analytics tables with proper RLS policies
- Adds indexes for performance
- Creates helper functions for getting analytics data:
  - `get_daily_analytics(days)` - Returns visitor/page view data
  - `get_traffic_sources()` - Returns traffic source percentages  
  - `get_top_pages(limit)` - Returns most visited pages

### 3. How It Works
- The dashboard first tries to fetch real data using the RPC functions
- If the tables don't exist (migration not run), it falls back to mock data
- You'll see a console message when using mock data

### 4. Tracking Data (Future Enhancement)
To actually track page views, you'll need to add tracking code to your app that inserts into:
- `page_views` table for each page visit
- `sessions` table for session tracking
- `traffic_sources` table for referral tracking

## Current Status
✅ Analytics component updated to use real data
✅ Migration file created
✅ Fallback to mock data if tables don't exist
⏳ Waiting for migration to be run manually

## Testing
After running the migration, the analytics dashboard will automatically start using real data. You can test by:
1. Visiting the admin analytics page
2. Checking browser console for any error messages
3. Verifying the charts display real data instead of mock data
