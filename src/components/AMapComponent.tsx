import { useEffect, useRef, useState } from 'react';
import type { Restaurant } from '../lib/database.types';

interface AMapComponentProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (id: string) => void;
  selectedRestaurantId?: string | null;
}

const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || '';
const AMAP_SECURITY_CONFIG = import.meta.env.VITE_AMAP_SECURITY_CONFIG || '';

function getCuisineEmoji(cuisineType: string): string {
  const map: { [key: string]: string } = {
    '中餐': '🍜', '北京菜': '🍜', '江浙菜': '🍜', '湖北菜': '🍜', '江西菜': '🍜',
    '淮扬菜': '🍜', '川菜': '🍜', '粤菜': '🍜', '湘菜': '🍜', '鲁菜': '🍜',
    '苏菜': '🍜', '浙菜': '🍜', '闽菜': '🍜', '徽菜': '🍜', '东北菜': '🍜',
    '西北菜': '🍜', '云南菜': '🍜', '贵州菜': '🍜', '新疆菜': '🍜', '西藏菜': '🍜',
    '陕西菜': '🍜', '内蒙菜': '🍜', '融合菜': '🍜', '创意菜': '🍜', '清真菜': '🍜',
    '面馆': '🍜', '北京小吃': '🍜', '小吃快餐': '🍜', '素菜馆': '🍜', '自助餐': '🍜',
    '海鲜': '🍜', '西餐': '🍽️', '法国菜': '🍽️', '意大利菜': '🍽️', '墨西哥菜': '🍽️',
    '中东菜': '🍽️', '俄国菜': '🍽️', '披萨': '🍕', '意面': '🍽️', '牛排': '🍽️',
    '汉堡': '🍽️', '日料': '🍱', '韩餐': '🍲', '日本料理': '🍱', '韩国料理': '🍲',
    '寿司': '🍱', '刺身': '🍱', '火锅': '🥘', '烧烤': '🍖', '烤肉': '🍖',
    '串串香': '🥘', '麻辣烫': '🥘', '冒菜': '🥘', '快餐': '🍔', '西式快餐': '🍔', '炸鸡': '🍔',
    '薯条': '🍔', '便当': '🍔', '甜品': '🍰', '奶茶': '🧋', '咖啡': '☕',
    '咖啡厅': '☕', '果汁': '🧋', '冰淇淋': '🍰',
  };
  return map[cuisineType] || '🍜';
}

export function AMapComponent({ restaurants, onSelectRestaurant, selectedRestaurantId }: AMapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!AMAP_KEY || AMAP_KEY === '你的高德地图Key') {
      setError('请配置高德地图 Key');
      return;
    }

    if ((window as any).AMap) {
      setIsLoaded(true);
      return;
    }

    if (AMAP_SECURITY_CONFIG && AMAP_SECURITY_CONFIG !== '你的安全密钥') {
      (window as any)._AMapSecurityConfig = {
        securityJsCode: AMAP_SECURITY_CONFIG,
      };
    }

    const existingScript = document.getElementById('amap-script');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'amap-script';
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`;
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    script.onerror = () => {
      setError('地图加载失败，请检查 Key 配置');
    };
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !(window as any).AMap) return;

    const AMap = (window as any).AMap;

    try {
      mapRef.current = new AMap.Map(mapContainerRef.current, {
        zoom: 13,
        center: [116.397428, 39.90923],
        viewMode: '2D',
      });
    } catch (err) {
      console.error('地图初始化失败:', err);
      setError('地图初始化失败');
      return;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [isLoaded]);

  useEffect(() => {
    if (!mapRef.current || !(window as any).AMap) return;

    const AMap = (window as any).AMap;

    markersRef.current.forEach(marker => {
      if (marker) marker.setMap(null);
    });
    markersRef.current = [];

    if (restaurants.length === 0) return;

    const validRestaurants = restaurants.filter(r => 
      r.longitude && r.latitude && 
      !isNaN(r.longitude) && !isNaN(r.latitude)
    );

    if (validRestaurants.length === 0) return;

    validRestaurants.forEach((restaurant) => {
      try {
        const position = [Number(restaurant.longitude), Number(restaurant.latitude)];
        const emoji = getCuisineEmoji(restaurant.cuisine_type);
        
        const markerContent = `
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
            border: 2px solid #d97706;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
          ">
            ${emoji}
          </div>
        `;
        
        const marker = new AMap.Marker({
          position,
          content: markerContent,
          offset: new AMap.Pixel(-16, -16),
          title: restaurant.name,
        });

        marker.on('click', () => {
          onSelectRestaurant(restaurant.id);
        });

        marker.setMap(mapRef.current);
        markersRef.current.push(marker);
      } catch (err) {
        console.error('创建标记失败:', err);
      }
    });

    try {
      if (validRestaurants.length > 0) {
        const firstPos = [Number(validRestaurants[0].longitude), Number(validRestaurants[0].latitude)];
        mapRef.current.setCenter(firstPos);
      }
    } catch (err) {
      console.error('设置视野失败:', err);
    }
  }, [restaurants, onSelectRestaurant]);

  useEffect(() => {
    if (!selectedRestaurantId || !mapRef.current) return;
  }, [selectedRestaurantId]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-amber-50 rounded-xl">
        <div className="text-center">
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-xs text-gray-400">请在 .env 文件中配置 VITE_AMAP_KEY</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-amber-50 rounded-xl">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">地图加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full rounded-xl" />
      <div className="absolute bottom-4 left-4 bg-white rounded-lg px-3 py-2 text-xs text-gray-600 shadow-md">
        共 {restaurants.filter(r => r.longitude && r.latitude).length} 家餐厅在地图上显示
      </div>
    </div>
  );
}
