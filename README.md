# Campus Bites - 校园美食地图

一个为大学生量身定制的美食探索平台，包含完整的前后端实现，使用 Supabase 作为数据库。

## 项目结构

```
CampusBites/
├── src/                          # 前端代码
│   ├── components/               # React 组件
│   │   ├── Navigation.tsx        # 导航组件
│   │   └── ApiTest.tsx           # API 测试组件
│   ├── lib/
│   │   ├── api.ts                # 后端 API 服务
│   │   ├── database.types.ts     # 数据库类型定义
│   │   └── supabase.ts           # Supabase 客户端
│   ├── pages/                    # 页面组件
│   │   ├── HomePage.tsx          # 首页
│   │   ├── ExplorePage.tsx       # 地图探索
│   │   ├── RestaurantDetailPage.tsx  # 餐厅详情
│   │   ├── RankingsPage.tsx      # 推荐榜单
│   │   ├── AIAssistantPage.tsx   # AI 助手
│   │   └── FavoritesPage.tsx     # 我的收藏
│   ├── App.tsx                   # 主应用组件
│   └── main.tsx                  # 应用入口
├── server/                       # 后端代码
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.ts          # 配置文件
│   │   │   └── supabase.ts       # Supabase 配置
│   │   ├── controllers/
│   │   │   ├── restaurantController.ts  # 餐厅控制器
│   │   │   └── favoriteController.ts    # 收藏控制器
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts   # 错误处理
│   │   │   └── validateRequest.ts # 请求验证
│   │   ├── routes/
│   │   │   ├── index.ts          # 路由入口
│   │   │   ├── restaurantRoutes.ts  # 餐厅路由
│   │   │   └── favoriteRoutes.ts    # 收藏路由
│   │   ├── types/
│   │   │   └── database.ts       # 数据库类型
│   │   ├── utils/
│   │   │   └── response.ts       # 响应工具
│   │   └── index.ts              # 服务器入口
│   ├── package.json
│   └── tsconfig.json
├── supabase/
│   └── migrations/
│       └── 20260313124050_create_campus_food_map_tables.sql  # 数据库迁移
├── .env                          # 环境变量
└── package.json
```

## 功能特性

### 前端功能
- 🏠 **首页** - 今日推荐、热门榜单、随机推荐
- 🗺️ **地图探索** - 餐厅列表、多维度筛选（学校、菜系、距离、价格）
- 🍽️ **餐厅详情** - 餐厅信息、菜单、评价、收藏
- 🏆 **推荐榜单** - 学生最爱榜、性价比榜、深夜食堂榜、新店榜
- 🤖 **AI 助手** - 根据预算、距离、场景智能推荐
- 💝 **我的收藏** - 收藏管理、统计信息

### 后端 API
- RESTful API 设计
- 完整的餐厅 CRUD 操作
- 筛选、排序、分页支持
- 评价系统
- 收藏功能
- AI 推荐算法
- 请求验证和错误处理

### 数据库 (Supabase)
- **restaurants** - 餐厅信息表
- **reviews** - 评价表
- **menu_items** - 菜单表
- **favorites** - 收藏表

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 后端 API URL
VITE_API_URL=http://localhost:3001/api

# AI API 配置 (可选)
VITE_AI_API_KEY=your_ai_api_key
VITE_AI_API_URL=your_ai_api_url
VITE_AI_MODEL=GLM-4-Flash
```

创建 `server/.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# CORS 配置
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### 3. 启动数据库

在 Supabase 中执行迁移文件：
`supabase/migrations/20260313124050_create_campus_food_map_tables.sql`

### 4. 启动服务

```bash
# 启动后端服务器 (端口 3001)
cd server
npm run dev

# 在另一个终端启动前端 (端口 5173)
npm run dev
```

### 5. 访问应用

- 前端: http://localhost:5173
- 后端 API: http://localhost:3001/api
- API 健康检查: http://localhost:3001/api/health

## API 文档

### 餐厅 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/restaurants` | 获取餐厅列表（支持筛选） |
| GET | `/api/restaurants/:id` | 获取餐厅详情 |
| GET | `/api/restaurants/:id/reviews` | 获取餐厅评价 |
| GET | `/api/restaurants/:id/menu` | 获取餐厅菜单 |
| POST | `/api/restaurants/:id/reviews` | 添加评价 |
| GET | `/api/restaurants/recommendations/today` | 今日推荐 |
| GET | `/api/restaurants/hot` | 热门餐厅 |
| GET | `/api/restaurants/random` | 随机餐厅 |
| GET | `/api/restaurants/rankings` | 获取榜单 |
| POST | `/api/restaurants/ai-recommendations` | AI 推荐 |
| GET | `/api/restaurants/schools` | 学校列表 |
| GET | `/api/restaurants/cuisine-types` | 菜系列表 |

### 收藏 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/favorites` | 获取收藏列表 |
| GET | `/api/favorites/:id/check` | 检查是否已收藏 |
| POST | `/api/favorites` | 添加收藏 |
| POST | `/api/favorites/:id/toggle` | 切换收藏状态 |
| DELETE | `/api/favorites/:id` | 取消收藏 |

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (图标)

### 后端
- Node.js
- Express
- TypeScript
- Supabase Client
- Express Validator

### 数据库
- PostgreSQL (Supabase)
- Row Level Security (RLS)

## 开发说明

### 前端开发

前端代码位于 `src/` 目录，使用 Vite 作为构建工具。

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run lint     # 运行 ESLint
npm run typecheck # 类型检查
```

### 后端开发

后端代码位于 `server/src/` 目录，使用 Express 框架。

```bash
cd server
npm run dev      # 启动开发服务器（热重载）
npm run build    # 编译 TypeScript
npm start        # 运行编译后的代码
```

### 数据库迁移

数据库迁移文件位于 `supabase/migrations/`，包含完整的表结构和 RLS 策略。

## 前后端通信

前端通过 `src/lib/api.ts` 中的 API 服务与后端通信：

```typescript
import { restaurantApi, favoriteApi } from './lib/api';

// 获取餐厅列表
const { data, error } = await restaurantApi.getAll({
  school: '北京大学',
  cuisine_type: '中餐',
  limit: 10
});

// 添加收藏
const { data, error } = await favoriteApi.addFavorite(restaurantId, userSession);
```

## 许可证

MIT
