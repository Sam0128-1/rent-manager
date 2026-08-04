-- ============================================================
-- Supabase 完整初始化脚本（房租管理系统）
-- 使用方法：
--   1. 登录 Supabase Dashboard
--   2. 左侧菜单点击 SQL Editor → New query
--   3. 粘贴本文件全部内容 → 点击 Run 执行
-- 执行完成后即可在 APP 中配置 Project URL + Anon Key
-- ============================================================

-- ============================================================
-- 第一部分：数据库表（rent_data）
-- ============================================================

-- 1. 创建 rent_data 表（存储完整 state JSON）
CREATE TABLE IF NOT EXISTS public.rent_data (
    id          INTEGER PRIMARY KEY,
    data        JSONB NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 启用行级安全（RLS）
ALTER TABLE public.rent_data ENABLE ROW LEVEL SECURITY;

-- 3. 允许匿名用户读取（用于从云端恢复数据）
DROP POLICY IF EXISTS "Allow anon select rent_data" ON public.rent_data;
CREATE POLICY "Allow anon select rent_data"
    ON public.rent_data FOR SELECT
    TO anon
    USING (true);

-- 4. 允许匿名用户插入/更新（用于上传数据到云端）
DROP POLICY IF EXISTS "Allow anon upsert rent_data" ON public.rent_data;
CREATE POLICY "Allow anon upsert rent_data"
    ON public.rent_data FOR INSERT
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update rent_data" ON public.rent_data;
CREATE POLICY "Allow anon update rent_data"
    ON public.rent_data FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- 5. 允许匿名用户删除（用于清空数据）
DROP POLICY IF EXISTS "Allow anon delete rent_data" ON public.rent_data;
CREATE POLICY "Allow anon delete rent_data"
    ON public.rent_data FOR DELETE
    TO anon
    USING (true);

-- ============================================================
-- 第二部分：Storage 存储桶（rent-images，用于租客照片）
-- ============================================================

-- 6. 创建公开 Storage bucket（用于存储图片）
INSERT INTO storage.buckets (id, name, public)
VALUES ('rent-images', 'rent-images', true)
ON CONFLICT (id) DO NOTHING;

-- 7. 允许匿名用户上传图片
DROP POLICY IF EXISTS "Allow anon uploads rent-images" ON storage.objects;
CREATE POLICY "Allow anon uploads rent-images"
    ON storage.objects FOR INSERT
    TO anon
    WITH CHECK (bucket_id = 'rent-images');

-- 8. 允许匿名用户读取图片
DROP POLICY IF EXISTS "Allow anon reads rent-images" ON storage.objects;
CREATE POLICY "Allow anon reads rent-images"
    ON storage.objects FOR SELECT
    TO anon
    USING (bucket_id = 'rent-images');

-- 9. 允许匿名用户更新图片
DROP POLICY IF EXISTS "Allow anon updates rent-images" ON storage.objects;
CREATE POLICY "Allow anon updates rent-images"
    ON storage.objects FOR UPDATE
    TO anon
    USING (bucket_id = 'rent-images')
    WITH CHECK (bucket_id = 'rent-images');

-- 10. 允许匿名用户删除图片
DROP POLICY IF EXISTS "Allow anon deletes rent-images" ON storage.objects;
CREATE POLICY "Allow anon deletes rent-images"
    ON storage.objects FOR DELETE
    TO anon
    USING (bucket_id = 'rent-images');

-- ============================================================
-- 第三部分：验证
-- ============================================================

-- 验证表结构
SELECT 'rent_data 表结构' AS section, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'rent_data'
ORDER BY ordinal_position;

-- 验证存储桶
SELECT 'storage buckets' AS section, id, name, public
FROM storage.buckets
WHERE id = 'rent-images';

-- 验证 RLS 策略
SELECT 'RLS policies' AS section, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'rent_data'
   OR (schemaname = 'storage' AND tablename = 'objects');

-- ============================================================
-- 执行结果提示
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '✅ 初始化完成！';
    RAISE NOTICE '   - rent_data 表已创建';
    RAISE NOTICE '   - RLS 策略已启用（允许匿名读写）';
    RAISE NOTICE '   - rent-images 存储桶已创建';
    RAISE NOTICE '   - 图片存储策略已启用';
    RAISE NOTICE '';
    RAISE NOTICE '👉 接下来在 APP 中配置 Project URL 和 Anon Public Key';
END;
$$;
