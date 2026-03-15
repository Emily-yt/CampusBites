-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    avatar TEXT,
    school VARCHAR(100),
    bio TEXT,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 启用 RLS (行级安全)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许任何人插入（注册）
CREATE POLICY "Allow public insert" ON users
    FOR INSERT WITH CHECK (true);

-- 创建策略：允许任何人查看（登录验证）
CREATE POLICY "Allow public select" ON users
    FOR SELECT USING (true);

-- 创建策略：只允许用户自己更新自己的信息
CREATE POLICY "Allow users to update own data" ON users
    FOR UPDATE USING (auth.uid() = id);
