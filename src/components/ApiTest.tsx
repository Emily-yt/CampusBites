import { useEffect, useState } from 'react';
import { restaurantApi, favoriteApi, healthCheck } from '../lib/api';
import type { Restaurant } from '../lib/database.types';

export function ApiTest() {
  const [health, setHealth] = useState<string>('Checking...');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    testApi();
  }, []);

  async function testApi() {
    try {
      setLoading(true);
      setError('');

      // 测试健康检查
      const healthResult = await healthCheck();
      if (healthResult.error) {
        setHealth('❌ ' + healthResult.error);
      } else {
        setHealth('✅ Backend is running');
      }

      // 测试获取餐厅列表
      const restaurantsResult = await restaurantApi.getAll({ limit: 5 });
      if (restaurantsResult.error) {
        setError(restaurantsResult.error);
      } else {
        setRestaurants(restaurantsResult.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API 连接测试</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">后端状态</h2>
        <p className="text-lg">{health}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">错误</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">餐厅数据 (来自后端 API)</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : restaurants.length > 0 ? (
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg">{restaurant.name}</h3>
                <p className="text-gray-600 text-sm">{restaurant.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-orange-600">⭐ {restaurant.rating.toFixed(1)}</span>
                  <span className="text-gray-500">💰 ¥{restaurant.avg_price}</span>
                  <span className="text-gray-500">📍 {restaurant.school}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">暂无餐厅数据</p>
        )}
      </div>

      <button
        onClick={testApi}
        className="mt-6 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-all font-medium"
      >
        刷新测试
      </button>
    </div>
  );
}
