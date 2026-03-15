import { useEffect, useState } from 'react';
import { Star, MapPin, Search, ChevronDown, ChevronLeft, AlertCircle } from 'lucide-react';
import { AMapComponent } from '../components/AMapComponent';
import { ExploreListCardSkeleton, Pagination } from '../components/Skeleton';
import { restaurantApi } from '../lib/api';
import type { Restaurant } from '../lib/database.types';

interface ExplorePageProps {
  onNavigateToRestaurant: (id: string) => void;
}

export function ExplorePage({ onNavigateToRestaurant }: ExplorePageProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0, pageSize: 10 });
  
  // 错误提示
  const [priceError, setPriceError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);

  // 筛选条件
  const [filters, setFilters] = useState({
    cuisine_types: [] as string[],
    schools: [] as string[],
    min_price: 10,
    max_price: undefined as number | undefined,
    min_rating: 0,
    max_rating: 5,
  });

  // 筛选选项
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [schools, setSchools] = useState<string[]>([]);

  // 菜系类型分组映射 - 更全面的分组
  const cuisineGroupMap: { [key: string]: string[] } = {
    '中餐': ['中餐', '北京菜', '江浙菜', '湖北菜', '江西菜', '淮扬菜', '川菜', '粤菜', '湘菜', '鲁菜', '苏菜', '浙菜', '闽菜', '徽菜', '东北菜', '西北菜', '云南菜', '贵州菜', '新疆菜', '西藏菜', '陕西菜', '内蒙菜', '融合菜', '创意菜', '清真菜', '面馆', '北京小吃', '小吃快餐', '素菜馆', '自助餐', '海鲜'],
    '火锅烧烤': ['火锅', '烧烤', '烤肉', '串串香', '麻辣烫', '冒菜'],
    '日料韩餐': ['日料', '韩餐', '日本料理', '韩国料理', '寿司', '刺身'],
    '西餐': ['西餐', '法国菜', '意大利菜', '墨西哥菜', '中东菜', '俄国菜', '意面', '牛排', '汉堡'],
    '快餐': ['快餐', '汉堡', '炸鸡', '薯条', '便当', '西式快餐', '披萨'],
    '甜品饮品': ['甜品', '奶茶', '咖啡', '咖啡厅', '果汁', '冰淇淋'],
  };

  // 获取合并后的菜系类型列表 - 直接返回固定的分组
  const getMergedCuisineTypes = () => {
    return Object.keys(cuisineGroupMap);
  };

  // 折叠/展开状态
  const [expandedSections, setExpandedSections] = useState({
    cuisine: true,
    school: true,
  });

  useEffect(() => {
    loadRestaurants();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allRestaurants, searchQuery, filters]);

  // 验证价格范围
  const validatePriceRange = (min: number, max: number | undefined) => {
    if (min < 10) {
      setPriceError('最低人均不能低于10元');
      return false;
    }
    if (max !== undefined && max < min) {
      setPriceError('最高人均不能低于最低人均');
      return false;
    }
    setPriceError(null);
    return true;
  };

  // 验证评分范围
  const validateRatingRange = (min: number, max: number) => {
    if (min < 0 || max > 5) {
      setRatingError('评分范围必须在0-5之间');
      return false;
    }
    if (max < min) {
      setRatingError('最高评分不能低于最低评分');
      return false;
    }
    setRatingError(null);
    return true;
  };

  // 加载餐厅数据 - 支持筛选条件
  async function loadRestaurants() {
    try {
      setLoading(true);
      
      // 构建API参数
      const params: any = {
        page: currentPage,
        page_size: 10,
      };

      // 只有在没有前端筛选时才使用后端分页API
      if (filters.cuisine_types.length === 0 && 
          filters.schools.length === 0 && 
          filters.min_price <= 10 && 
          filters.max_price === undefined &&
          filters.min_rating <= 0 && 
          filters.max_rating >= 5) {
        const { data } = await restaurantApi.getAll(params);
        
        if (data?.data) {
          const restaurantsWithCoords = data.data.map((r, index) => ({
            ...r,
            longitude: 116.397428 + (Math.random() - 0.5) * 0.1,
            latitude: 39.90923 + (Math.random() - 0.5) * 0.1,
          }));
          setRestaurants(restaurantsWithCoords);
          setFilteredRestaurants(restaurantsWithCoords);
          setPagination(data.pagination);
        }
      }

      // 始终加载所有餐厅用于前端筛选
      const { data: allData } = await restaurantApi.getAll({ page: 1, page_size: 1000 });
      if (allData?.data) {
        const allWithCoords = allData.data.map((r) => ({
          ...r,
          longitude: 116.397428 + (Math.random() - 0.5) * 0.1,
          latitude: 39.90923 + (Math.random() - 0.5) * 0.1,
        }));
        setAllRestaurants(allWithCoords);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFilterOptions() {
    try {
      const { data: cuisineData } = await restaurantApi.getCuisineTypes();
      if (cuisineData) {
        setCuisineTypes(cuisineData);
      }

      const { data: schoolData } = await restaurantApi.getSchools();
      if (schoolData) {
        setSchools(schoolData);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }

  function applyFilters() {
    let result = [...allRestaurants];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.cuisine_type.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
      );
    }

    if (filters.cuisine_types.length > 0) {
      result = result.filter(r => {
        return filters.cuisine_types.some(selectedType => {
          if (cuisineGroupMap[selectedType]) {
            return cuisineGroupMap[selectedType].includes(r.cuisine_type);
          }
          return r.cuisine_type === selectedType;
        });
      });
    }

    if (filters.schools.length > 0) {
      result = result.filter(r => filters.schools.includes(r.school));
    }

    if (filters.min_price > 10) {
      result = result.filter(r => r.avg_price >= filters.min_price);
    }

    if (filters.max_price !== undefined) {
      result = result.filter(r => r.avg_price <= filters.max_price);
    }

    if (filters.min_rating > 0) {
      result = result.filter(r => r.rating >= filters.min_rating);
    }

    if (filters.max_rating < 5) {
      result = result.filter(r => r.rating <= filters.max_rating);
    }

    setFilteredRestaurants(result);
  }

  // 计算筛选后的分页
  const filteredTotalPages = Math.ceil(filteredRestaurants.length / pagination.pageSize);
  const currentFilteredRestaurants = filteredRestaurants.slice(
    (currentPage - 1) * pagination.pageSize,
    currentPage * pagination.pageSize
  );

  function handlePageChange(page: number) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleCuisine(type: string) {
    setFilters(prev => ({
      ...prev,
      cuisine_types: prev.cuisine_types.includes(type)
        ? prev.cuisine_types.filter(t => t !== type)
        : [...prev.cuisine_types, type]
    }));
    setCurrentPage(1);
  }

  function toggleSchool(school: string) {
    setFilters(prev => ({
      ...prev,
      schools: prev.schools.includes(school)
        ? prev.schools.filter(s => s !== school)
        : [...prev.schools, school]
    }));
    setCurrentPage(1);
  }

  function handlePriceChange(min: number, max: number | undefined) {
    if (validatePriceRange(min, max)) {
      setFilters(prev => ({ ...prev, min_price: min, max_price: max }));
      setCurrentPage(1);
    }
  }

  function handleRatingChange(min: number, max: number) {
    if (validateRatingRange(min, max)) {
      setFilters(prev => ({ ...prev, min_rating: min, max_rating: max }));
      setCurrentPage(1);
    }
  }

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }

  function handleSelectRestaurant(id: string) {
    setSelectedRestaurantId(id);
    onNavigateToRestaurant(id);
  }

  function getCuisineEmoji(cuisineType: string) {
    const map: { [key: string]: string } = {
      '中餐': '🍜', '北京菜': '🍜', '江浙菜': '🍜', '湖北菜': '🍜', '江西菜': '🍜',
      '淮扬菜': '🍜', '川菜': '🍜', '粤菜': '🍜', '湘菜': '🍜', '鲁菜': '🍜',
      '苏菜': '🍜', '浙菜': '🍜', '闽菜': '🍜', '徽菜': '🍜', '东北菜': '🍜',
      '西北菜': '🍜', '云南菜': '🍜', '贵州菜': '🍜', '新疆菜': '🍜', '西藏菜': '🍜',
      '陕西菜': '🍜', '内蒙菜': '🍜', '融合菜': '🍜', '创意菜': '🍜', '清真菜': '🍜',
      '面馆': '🍜', '北京小吃': '🍜', '小吃快餐': '🍜', '素菜馆': '🍜', '自助餐': '🍜',
      '海鲜': '🍜', '西餐': '🍽️', '法国菜': '🍽️', '意大利菜': '🍽️', '墨西哥菜': '🍽️', '中东菜': '🍽️',
      '俄国菜': '🍽️', '披萨': '🍕', '意面': '🍽️', '牛排': '🍽️',
      '汉堡': '🍽️', '日料': '🍱', '韩餐': '🍲', '日本料理': '🍱', '韩国料理': '🍲',
      '寿司': '🍱', '刺身': '🍱', '火锅': '🥘', '烧烤': '🍖', '烤肉': '🍖',
      '串串香': '🥘', '麻辣烫': '🥘', '冒菜': '🥘', '快餐': '🍔', '西式快餐': '🍔', '炸鸡': '🍔',
      '薯条': '🍔', '便当': '🍔', '甜品': '🍰', '奶茶': '🧋', '咖啡': '☕',
      '咖啡厅': '☕', '果汁': '🧋', '冰淇淋': '🍰',
    };
    return map[cuisineType] || '🍜';
  }

  function getBusinessStatus(hours?: string): { status: 'open' | 'closing' | 'closed'; text: string; color: string } {
    if (!hours) {
      return { status: 'open', text: '营业中', color: 'text-emerald-600 bg-emerald-50' };
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    // 支持多段营业时间，如 "11:00-14:00,17:00-21:00"
    const timeRanges = hours.split(/[,，]/).map(s => s.trim()).filter(Boolean);

    for (const range of timeRanges) {
      const match = range.match(/(\d{1,2}):?(\d{2})?\s*[-~至]\s*(\d{1,2}):?(\d{2})?/);
      if (!match) continue;

      const startHour = parseInt(match[1]);
      const startMinute = parseInt(match[2] || '0');
      const endHour = parseInt(match[3]);
      const endMinute = parseInt(match[4] || '0');

      const startTime = startHour * 60 + startMinute;
      let endTime = endHour * 60 + endMinute;

      // 处理跨天情况
      if (endTime <= startTime) {
        endTime += 24 * 60;
      }

      const adjustedCurrentTime = currentTime < startTime && endTime > 24 * 60 ? currentTime + 24 * 60 : currentTime;
      const oneHourBeforeClose = endTime - 60;

      if (adjustedCurrentTime >= startTime && adjustedCurrentTime < oneHourBeforeClose) {
        return { status: 'open', text: '营业中', color: 'text-emerald-600 bg-emerald-50' };
      } else if (adjustedCurrentTime >= oneHourBeforeClose && adjustedCurrentTime < endTime) {
        return { status: 'closing', text: '即将打烊', color: 'text-amber-600 bg-amber-50' };
      }
    }

    // 所有时间段都不匹配，则已打烊
    return { status: 'closed', text: '已打烊', color: 'text-gray-500 bg-gray-100' };
  }

  // 判断是否有筛选条件
  const hasFilters = searchQuery || 
    filters.cuisine_types.length > 0 || 
    filters.schools.length > 0 || 
    filters.min_price > 10 || 
    filters.max_price !== undefined ||
    filters.min_rating > 0 || 
    filters.max_rating < 5;

  // 计算无筛选条件下的分页
  const allRestaurantsTotalPages = Math.ceil(allRestaurants.length / pagination.pageSize);
  const currentAllRestaurants = allRestaurants.slice(
    (currentPage - 1) * pagination.pageSize,
    currentPage * pagination.pageSize
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 页面标题 */}
          <div className="mb-6">
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded mt-1 animate-pulse"></div>
          </div>

          {/* 搜索框 */}
          <div className="mb-6">
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>

          {/* 主内容区域 */}
          <div className="flex gap-6 h-[calc(100vh-280px)] min-h-[500px]">
            {/* 左侧筛选面板 */}
            <div className="w-56 bg-gray-200 rounded-xl animate-pulse"></div>
            {/* 中间列表 */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <ExploreListCardSkeleton key={i} />
                ))}
              </div>
            </div>
            {/* 右侧地图 */}
            <div className="w-1/2 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">餐厅列表</h1>
          <p className="text-gray-600 text-sm mt-1">共找到 {hasFilters ? filteredRestaurants.length : pagination.totalItems} 家餐厅</p>
        </div>

        {/* 搜索框 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索餐厅名称、菜系..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-amber-200 focus:outline-none focus:border-amber-400 text-sm"
            />
          </div>
        </div>

        {/* 主内容区域：左侧筛选 + 中间列表 + 右侧地图 */}
        <div className="flex flex-col gap-6">
          <div className="flex gap-6 h-[calc(100vh-300px)] min-h-[500px]">
            {/* 左侧筛选面板 */}
            <div className="w-56 flex-shrink-0">
              <div className="bg-white rounded-xl border border-amber-200 sticky top-0 overflow-hidden">
                {/* 菜系类型 */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => toggleSection('cuisine')}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-800 hover:bg-amber-50 transition-colors"
                  >
                    <span>菜系类型</span>
                    {expandedSections.cuisine ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
                  </button>
                  {expandedSections.cuisine && (
                    <div className="px-4 pb-3 space-y-2">
                      {getMergedCuisineTypes().map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filters.cuisine_types.includes(type)}
                            onChange={() => toggleCuisine(type)}
                            className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-600 group-hover:text-gray-800">{type}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* 学校区域 */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => toggleSection('school')}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-800 hover:bg-amber-50 transition-colors"
                  >
                    <span>学校区域</span>
                    {expandedSections.school ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
                  </button>
                  {expandedSections.school && (
                    <div className="px-4 pb-3 space-y-2">
                      {schools.map((school) => (
                        <label key={school} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filters.schools.includes(school)}
                            onChange={() => toggleSchool(school)}
                            className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-600 group-hover:text-gray-800">{school}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* 人均消费 */}
                <div className="border-b border-gray-100 px-4 py-3">
                  <label className="text-sm font-semibold text-gray-800 mb-2 block">人均消费 (元)</label>
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      type="number"
                      min="10"
                      step="1"
                      value={filters.min_price}
                      onChange={(e) => handlePriceChange(Number(e.target.value) || 10, filters.max_price)}
                      className="w-full min-w-0 px-3 py-2 bg-amber-50 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="最低"
                      style={{ minWidth: 0 }}
                    />
                    <span className="text-gray-400 flex-shrink-0">-</span>
                    <input
                      type="number"
                      min="10"
                      step="1"
                      value={filters.max_price || ''}
                      onChange={(e) => handlePriceChange(filters.min_price, e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full min-w-0 px-3 py-2 bg-amber-50 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="最高"
                      style={{ minWidth: 0 }}
                    />
                  </div>
                  {priceError && (
                    <div className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={12} />
                      {priceError}
                    </div>
                  )}
                </div>

                {/* 评分范围 */}
                <div className="px-4 py-3">
                  <label className="text-sm font-semibold text-gray-800 mb-2 block">评分范围</label>
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={filters.min_rating}
                      onChange={(e) => handleRatingChange(Number(e.target.value) || 0, filters.max_rating)}
                      className="w-full min-w-0 px-3 py-2 bg-amber-50 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="最低"
                      style={{ minWidth: 0 }}
                    />
                    <span className="text-gray-400 flex-shrink-0">-</span>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={filters.max_rating}
                      onChange={(e) => handleRatingChange(filters.min_rating, Number(e.target.value) || 5)}
                      className="w-full min-w-0 px-3 py-2 bg-amber-50 rounded-lg border-0 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="最高"
                      style={{ minWidth: 0 }}
                    />
                  </div>
                  {ratingError && (
                    <div className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={12} />
                      {ratingError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 中间餐厅列表 */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-3">
                {(hasFilters ? currentFilteredRestaurants : currentAllRestaurants).map((restaurant) => (
                  <div
                    key={restaurant.id}
                    onClick={() => handleSelectRestaurant(restaurant.id)}
                    className={`bg-white rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                      selectedRestaurantId === restaurant.id
                        ? 'border-amber-500 ring-2 ring-amber-200'
                        : 'border-amber-100 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex">
                      <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-3xl flex-shrink-0">
                        {getCuisineEmoji(restaurant.cuisine_type)}
                      </div>
                      <div className="flex-1 p-3 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-800 text-sm truncate">{restaurant.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-amber-600">{restaurant.cuisine_type}</span>
                              {(() => {
                                const status = getBusinessStatus(restaurant.hours);
                                return (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                                    {status.text}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded flex-shrink-0">
                            <span className="opacity-75 align-middle mr-0.5">人均</span>¥{restaurant.avg_price}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-0.5">
                            <Star size={10} className="text-yellow-500" />
                            {restaurant.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧地图 - 始终显示所有餐厅或筛选后的所有餐厅 */}
            <div className="w-1/2 bg-white rounded-xl border border-amber-100 overflow-hidden flex-shrink-0">
              <AMapComponent
                restaurants={hasFilters ? filteredRestaurants : allRestaurants}
                onSelectRestaurant={handleSelectRestaurant}
                selectedRestaurantId={selectedRestaurantId}
              />
            </div>
          </div>

          {/* 分页组件 */}
          {(() => {
            const totalPages = hasFilters ? filteredTotalPages : allRestaurantsTotalPages;
            if (totalPages <= 1) return null;
            
            return (
              <div className="ml-56">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  loading={loading}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
