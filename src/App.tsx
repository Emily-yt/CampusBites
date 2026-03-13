import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { RestaurantDetailPage } from './pages/RestaurantDetailPage';
import { RankingsPage } from './pages/RankingsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { FavoritesPage } from './pages/FavoritesPage';

type Page = 'home' | 'explore' | 'rankings' | 'ai-assistant' | 'favorites' | 'restaurant-detail';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  function handleNavigateToRestaurant(id: string) {
    setSelectedRestaurantId(id);
    setCurrentPage('restaurant-detail');
  }

  function handleBackFromRestaurant() {
    setCurrentPage('home');
    setSelectedRestaurantId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage !== 'restaurant-detail' && (
        <Navigation currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as Page)} />
      )}

      {currentPage === 'home' && (
        <HomePage onNavigateToRestaurant={handleNavigateToRestaurant} />
      )}

      {currentPage === 'explore' && (
        <ExplorePage onNavigateToRestaurant={handleNavigateToRestaurant} />
      )}

      {currentPage === 'rankings' && (
        <RankingsPage onNavigateToRestaurant={handleNavigateToRestaurant} />
      )}

      {currentPage === 'ai-assistant' && (
        <AIAssistantPage onNavigateToRestaurant={handleNavigateToRestaurant} />
      )}

      {currentPage === 'favorites' && (
        <FavoritesPage onNavigateToRestaurant={handleNavigateToRestaurant} />
      )}

      {currentPage === 'restaurant-detail' && selectedRestaurantId && (
        <RestaurantDetailPage
          restaurantId={selectedRestaurantId}
          onBack={handleBackFromRestaurant}
        />
      )}
    </div>
  );
}

export default App;
