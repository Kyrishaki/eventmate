-- =========================================================================
-- EVENTMATE: ENABLE CLOUD REALTIME SYNC FOR WEB & MOBILE
-- Chạy đoạn SQL này trong: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. Tạo bảng lưu trữ trạng thái đồng bộ toàn diện cho Workspace
CREATE TABLE IF NOT EXISTS public.app_sync_state (
  workspace_id TEXT PRIMARY KEY,
  catalog_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  orders_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_by TEXT
);

-- 2. Cấu hình quyền truy cập (RLS) cho phép các thiết bị POS / Web đọc & ghi với Anon Key
ALTER TABLE public.app_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read sync_state" ON public.app_sync_state;
CREATE POLICY "Allow anon read sync_state"
  ON public.app_sync_state FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow anon insert sync_state" ON public.app_sync_state;
CREATE POLICY "Allow anon insert sync_state"
  ON public.app_sync_state FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update sync_state" ON public.app_sync_state;
CREATE POLICY "Allow anon update sync_state"
  ON public.app_sync_state FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Mở khóa RLS cho các bảng cơ sở dữ liệu EventMate để các máy khách kết nối thông suốt
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booths DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- 4. Kích hoạt Supabase Realtime cho bảng app_sync_state để nhận thông báo thay đổi tức thì
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'app_sync_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_sync_state;
  END IF;
END $$;
