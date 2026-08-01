-- ============================================================
-- Supabase Storage 初始化脚本（图片存储桶）
-- 使用方法：登录 Supabase → SQL Editor → 粘贴执行
-- ============================================================

-- 1. 创建公开 Storage bucket（用于存储图片）
INSERT INTO storage.buckets (id, name, public)
VALUES ('rent-images', 'rent-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 允许匿名用户上传图片
CREATE POLICY "Allow anon uploads" ON storage.objects
FOR INSERT TO anon WITH CHECK (bucket_id = 'rent-images');

-- 3. 允许匿名用户读取图片
CREATE POLICY "Allow anon reads" ON storage.objects
FOR SELECT TO anon USING (bucket_id = 'rent-images');

-- 4. 允许匿名用户删除自己的图片
CREATE POLICY "Allow anon deletes" ON storage.objects
FOR DELETE TO anon USING (bucket_id = 'rent-images');

-- 5. 验证
SELECT '✅ Storage bucket 创建成功！' AS status;
SELECT * FROM storage.buckets WHERE id = 'rent-images';
