import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const MarketNews = ({ initialNews, totalPages, totalItems }) => {
  const [news, setNews] = useState(initialNews || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialNews) {
      setNews(initialNews);
    }
  }, [initialNews]);

  const loadMoreNews = async () => {
    if (loading || currentPage >= totalPages) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/market-news?page=${currentPage + 1}`);
      setNews([...news, ...response.data.news]);
      setCurrentPage(currentPage + 1);
    } catch (error) {
      console.error('Error loading more news:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!initialNews) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Market News</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const rows = [];
  for (let i = 0; i < news.length; i += 3) {
    rows.push(news.slice(i, i + 3));
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Market News</h2>
      <div className="space-y-6">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {row.map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={article.image || 'https://via.placeholder.com/400x225'}
                    alt={article.headline}
                    className="w-full h-48 object-cover rounded-t-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x225';
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{article.source}</span>
                    <span className="text-sm text-gray-500">{article.datetime}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    {article.headline}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {article.summary}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ))}
      </div>
      
      {currentPage < totalPages && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMoreNews}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'See more news'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MarketNews;