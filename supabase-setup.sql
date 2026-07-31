-- ============================================================
-- 房租管理工作台 — Supabase 数据表初始化脚本
-- 使用方法：登录 Supabase → SQL Editor → 粘贴执行
-- ============================================================

-- 1. 创建数据表（单行存储所有数据）
CREATE TABLE IF NOT EXISTS rent_data (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row_only CHECK (id = 1)
);

-- 2. 插入初始空行
INSERT INTO rent_data (id, data)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. 关闭行级安全（简化使用，个人项目足够）
ALTER TABLE rent_data DISABLE ROW LEVEL SECURITY;

-- 4. 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_rent_data_updated ON rent_data;
CREATE TRIGGER tr_rent_data_updated
  BEFORE UPDATE ON rent_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5. 验证
SELECT '✅ 数据表创建成功！' AS status;
SELECT id, updated_at, jsonb_array_length(data->'buildings') AS building_count
FROM rent_data;
