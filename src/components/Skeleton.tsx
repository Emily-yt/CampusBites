export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
      <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200" />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function RankingsCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <Skeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="w-5 h-5" />
    </div>
  );
}

export function ExploreListCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-amber-100 overflow-hidden">
      <div className="flex">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200" />
        <div className="flex-1 p-3 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-10" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-32" />
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 p-6 mb-6">
          <div className="flex items-start gap-6">
            <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
          <div className="bg-white rounded-xl border border-amber-100 p-4">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-7 w-16" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center p-4 rounded-xl">
                <Skeleton className="w-16 h-16 rounded-full mb-3" />
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 p-6 mb-6">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RestaurantDetailSkeleton() {
  return (
    <div className="animate-in fade-in duration-200">
      {/* 餐厅头部骨架 */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <Skeleton className="w-16 h-16 rounded-full" />
        </div>
      </div>

      <div className="p-5">
        {/* 餐厅名称和类型 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>

        {/* 描述 */}
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />

        {/* 核心信息卡片 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Skeleton className="h-3 w-8 mx-auto mb-2" />
            <Skeleton className="h-5 w-12 mx-auto" />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Skeleton className="h-3 w-8 mx-auto mb-2" />
            <Skeleton className="h-5 w-12 mx-auto" />
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Skeleton className="h-3 w-8 mx-auto mb-2" />
            <Skeleton className="h-5 w-16 mx-auto" />
          </div>
        </div>

        {/* 联系信息 */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* 标签页 */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {/* 标签头部 */}
          <div className="flex border-b border-gray-100">
            <div className="flex-1 py-2.5 bg-gray-50">
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
            <div className="flex-1 py-2.5">
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl">
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Pagination({ currentPage, totalPages, onPageChange, loading }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    
    if (currentPage <= 3) {
      return [...pages.slice(0, 5), '...', totalPages];
    }
    
    if (currentPage >= totalPages - 2) {
      return [1, '...', ...pages.slice(-5)];
    }
    
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || loading}
        className="px-3 py-2 rounded-lg border border-amber-200 text-gray-600 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        上一页
      </button>
      
      {getVisiblePages().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === currentPage || page === '...' || loading}
          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
            page === currentPage
              ? 'bg-amber-500 text-white'
              : page === '...'
              ? 'text-gray-400 cursor-default'
              : 'border border-amber-200 text-gray-600 hover:bg-amber-50'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || loading}
        className="px-3 py-2 rounded-lg border border-amber-200 text-gray-600 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        下一页
      </button>
    </div>
  );
}

export function AIAssistantPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden flex relative h-[720px]">
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
            <div className="h-14 border-b border-gray-200 px-3 py-3 flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <div className="flex items-center gap-1">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
            </div>
            <div className="flex-1 py-2 px-2">
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-gray-100">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-2 border-t border-gray-200 bg-gray-100">
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="h-14 border-b border-amber-100 flex items-center justify-center">
              <Skeleton className="h-5 w-24" />
            </div>

            <div className="flex-1 px-8 py-4 space-y-4 overflow-y-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 ${i % 2 === 0 ? 'bg-amber-100' : 'bg-gradient-to-br from-gray-200 to-gray-300'}`} />
                  <div className={`max-w-[80%] ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl ${i % 2 === 0 ? 'bg-amber-100 rounded-br-md' : 'bg-gray-100 rounded-bl-md'}`}>
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-8 pb-3">
              <Skeleton className="h-3 w-20 mb-2" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))}
              </div>
            </div>

            <div className="border-t border-amber-100 px-8 py-4">
              <div className="flex gap-2">
                <Skeleton className="flex-1 h-12 rounded-xl" />
                <Skeleton className="w-12 h-12 rounded-xl" />
              </div>
              <Skeleton className="h-3 w-64 mx-auto mt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
