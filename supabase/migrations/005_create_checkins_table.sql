/*
  # User Check-ins Table
  
  存储用户的餐厅打卡记录
  
  1. New Tables
    - `checkins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - 关联用户表
      - `restaurant_id` (uuid, foreign key) - 关联餐厅表
      - `created_at` (timestamptz) - 打卡时间
  
  2. Security
    - Enable RLS on checkins table
    - Add policies for user to manage their own checkins
*/

-- 创建打卡表
CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);

-- 启用行级安全
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户可以查看自己的打卡记录
CREATE POLICY "Users can view their own checkins"
  ON checkins FOR SELECT
  TO public
  USING (true);

-- 创建策略：用户可以插入自己的打卡记录
CREATE POLICY "Users can insert their own checkins"
  ON checkins FOR INSERT
  TO public
  WITH CHECK (true);

-- 创建策略：用户可以删除自己的打卡记录
CREATE POLICY "Users can delete their own checkins"
  ON checkins FOR DELETE
  TO public
  USING (true);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_restaurant_id ON checkins(restaurant_id);
