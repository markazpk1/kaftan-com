-- ===== ANALYTICS TABLES =====

-- Page views table to track all page visits
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions table to track user sessions
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  page_views INTEGER NOT NULL DEFAULT 1,
  duration_seconds INTEGER,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT
);

-- Traffic sources table
CREATE TABLE public.traffic_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.sessions(session_id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'direct', 'organic', 'social', 'referral', 'email', 'paid'
  medium TEXT, -- 'organic', 'cpc', 'referral', 'email', 'social'
  campaign TEXT,
  content TEXT,
  term TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_sources ENABLE ROW LEVEL SECURITY;

-- Policies for page_views
CREATE POLICY "Admins can view all page views" ON public.page_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);
CREATE POLICY "Users can insert page views" ON public.page_views FOR INSERT WITH CHECK (true);

-- Policies for sessions
CREATE POLICY "Admins can view all sessions" ON public.sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);
CREATE POLICY "Users can insert sessions" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE USING (
  user_id = auth.uid() OR user_id IS NULL
);

-- Policies for traffic_sources
CREATE POLICY "Admins can view all traffic sources" ON public.traffic_sources FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);
CREATE POLICY "Users can insert traffic sources" ON public.traffic_sources FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX idx_page_views_page_path ON public.page_views(page_path);
CREATE INDEX idx_sessions_started_at ON public.sessions(started_at);
CREATE INDEX idx_sessions_session_id ON public.sessions(session_id);
CREATE INDEX idx_traffic_sources_session_id ON public.traffic_sources(session_id);
CREATE INDEX idx_traffic_sources_source ON public.traffic_sources(source);

-- Function to get daily visitors and page views for the last 7 days
CREATE OR REPLACE FUNCTION public.get_daily_analytics(days INTEGER DEFAULT 7)
RETURNS TABLE(
  day TEXT,
  visitors BIGINT,
  page_views BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(d.date, 'Mon') as day,
    COALESCE(DISTINCT_COUNT.session_count, 0) as visitors,
    COALESCE(PAGE_VIEW_COUNT.view_count, 0) as page_views
  FROM (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '1 day' * (days - 1),
      CURRENT_DATE,
      INTERVAL '1 day'
    )::date as date
  ) d
  LEFT JOIN (
    SELECT 
      DATE(started_at) as date,
      COUNT(DISTINCT session_id) as session_count
    FROM public.sessions
    WHERE started_at >= CURRENT_DATE - INTERVAL '1 day' * (days - 1)
    GROUP BY DATE(started_at)
  ) DISTINCT_COUNT ON d.date = DISTINCT_COUNT.date
  LEFT JOIN (
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as view_count
    FROM public.page_views
    WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * (days - 1)
    GROUP BY DATE(created_at)
  ) PAGE_VIEW_COUNT ON d.date = PAGE_VIEW_COUNT.date
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get traffic sources analytics
CREATE OR REPLACE FUNCTION public.get_traffic_sources()
RETURNS TABLE(
  source TEXT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ts.source, 'Direct') as source,
    ROUND(COUNT(*)::NUMERIC * 100.0 / (SELECT COUNT(*) FROM public.traffic_sources), 1) as percentage
  FROM public.traffic_sources ts
  GROUP BY ts.source
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top pages
CREATE OR REPLACE FUNCTION public.get_top_pages(page_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  page TEXT,
  views BIGINT,
  bounce_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH page_stats AS (
    SELECT 
      page_path,
      COUNT(*) as view_count,
      COUNT(DISTINCT session_id) as unique_sessions
    FROM public.page_views
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY page_path
  ),
  bounce_data AS (
    SELECT 
      pv.page_path,
      COUNT(*) as single_page_sessions
    FROM public.page_views pv
    JOIN public.sessions s ON pv.session_id = s.session_id
    WHERE pv.created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND s.page_views = 1
    GROUP BY pv.page_path
  )
  SELECT 
    ps.page_path as page,
    ps.view_count as views,
    CASE 
      WHEN ps.view_count > 0 THEN 
        ROUND((bd.single_page_sessions::NUMERIC / ps.unique_sessions) * 100, 0)
      ELSE 0 
    END as bounce_rate
  FROM page_stats ps
  LEFT JOIN bounce_data bd ON ps.page_path = bd.page_path
  ORDER BY ps.view_count DESC
  LIMIT page_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
