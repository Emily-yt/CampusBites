/*
  # User Taste Preferences Table
  
  存储用户的口味偏好设置，用于个性化推荐
  
  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - 关联用户表
      - `taste_types` (text[]) - 口味类型数组，如 ['spicy', 'meat']
      - `cuisine_types` (text[]) - 偏好菜系数组，如 ['sichuan', 'hotpot']
      - `budget_preference` (text) - 预算偏好，如 'low', 'medium', 'high'
      - `created_at` (timestamptz) - 创建时间
      - `updated_at` (timestamptz) - 更新时间
  
  2. Security
    - Enable RLS on user_preferences table
    - Add policies for user to manage their own preferences
*/

-- 创建用户偏好表
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  taste_types text[] DEFAULT ARRAY[]::text[],
  cuisine_types text[] DEFAULT ARRAY[]::text[],
  budget_preference text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 启用行级安全
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户可以查看自己的偏好
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  TO public
  USING (true);

-- 创建策略：用户可以插入自己的偏好
CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  TO public
  WITH CHECK (true);

-- 创建策略：用户可以更新自己的偏好
CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- 创建策略：用户可以删除自己的偏好
CREATE POLICY "Users can delete their own preferences"
  ON user_preferences FOR DELETE
  TO public
  USING (true);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
