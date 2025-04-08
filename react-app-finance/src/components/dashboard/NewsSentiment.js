import React, { useState } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import api from '../../services/api';

const NewsSentiment = ({ data }) => {
  const [selectedTickers, setSelectedTickers] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [pieData, setPieData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllArticles, setShowAllArticles] = useState(false);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Selected Tickers:', selectedTickers);
      console.log('Selected Topics:', selectedTopics);

      const params = new URLSearchParams();
      if (selectedTickers.length > 0) {
        params.append('tickers', selectedTickers.join(','));
      }
      if (selectedTopics.length > 0) {
        params.append('topics', selectedTopics.join(','));
      }

      const response = await api.get(`/news-sentiment_dashboard?${params.toString()}`);
      console.log('API Response:', response.data);

      if (response.data) {
        setPieData(response.data.pie_chart_data);
        
        // Lọc và sắp xếp dữ liệu để chỉ lấy 10 mã có nhiều bài viết nhất
        const sortedBarData = response.data.bar_chart_data.labels
          .map((label, index) => ({
            label,
            data: response.data.bar_chart_data.datasets.map(dataset => dataset.data[index])
          }))
          .sort((a, b) => b.data.reduce((sum, val) => sum + val, 0) - a.data.reduce((sum, val) => sum + val, 0))
          .slice(0, 10);

        const filteredBarData = {
          labels: sortedBarData.map(item => item.label),
          datasets: response.data.bar_chart_data.datasets.map(dataset => ({
            ...dataset,
            data: sortedBarData.map(item => item.data[response.data.bar_chart_data.datasets.indexOf(dataset)])
          }))
        };

        setBarData(filteredBarData);
        setArticles(response.data.articles);
      }
    } catch (error) {
      console.error('Error in handleAnalyze:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Tạo rows cho articles với giới hạn số lượng hiển thị
  const displayedArticles = showAllArticles ? articles : articles.slice(0, 12);
  const rows = [];
  for (let i = 0; i < displayedArticles.length; i += 3) {
    rows.push(displayedArticles.slice(i, i + 3));
  }

  return (
    <div className="border rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6">News Sentiment Analysis</h2>
      
      <div className="flex items-center mb-6 space-x-4">
        <input
          type="text"
          placeholder="Enter tickers (optional)"
          value={selectedTickers}
          onChange={(e) => setSelectedTickers(e.target.value.split(',').map(t => t.trim()).filter(t => t))}
          className="border rounded-lg p-2 w-64"
        />
        <select
          value={selectedTopics}
          onChange={(e) => setSelectedTopics(Array.from(e.target.selectedOptions, option => option.value))}
          className="border rounded-lg p-2 w-64"
        >
          <option value="">Select topics...</option>
          <option value="blockchain">Blockchain</option>
          <option value="earnings">Earnings</option>
          <option value="ipo">IPO</option>
          <option value="mergers_and_acquisitions">Mergers & Acquisitions</option>
          <option value="financial_markets">Financial Markets</option>
          <option value="economy_fiscal">Economy - Fiscal Policy</option>
          <option value="economy_monetary">Economy - Monetary Policy</option>
          <option value="economy_macro">Economy - Macro/Overall</option>
          <option value="energy_transportation">Energy & Transportation</option>
          <option value="finance">Finance</option>
          <option value="life_sciences">Life Sciences</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="real_estate">Real Estate & Construction</option>
          <option value="retail_wholesale">Retail & Wholesale</option>
          <option value="technology">Technology</option>
        </select>
        <button 
          onClick={handleAnalyze} 
          className={`bg-blue-500 text-white p-2 rounded-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4">
          Error: {error}
        </div>
      )}
      
      {loading && (
        <div className="text-center my-4">
          Loading...
        </div>
      )}
      
      {(pieData || barData) && (
        <div className="flex mb-8 space-x-4">
          {barData && (
            <div className="w-2/3" style={{ height: '400px' }}>
              <h3 className="text-xl font-semibold mb-4">Ticker-wise Sentiment Analysis</h3>
              <Bar 
                data={barData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  },
                  scales: {
                    x: {
                      stacked: true,
                      beginAtZero: true
                    },
                    y: {
                      stacked: true
                    }
                  }
                }}
              />
            </div>
          )}
          
          {pieData && (
            <div className="w-1/3" style={{ height: '400px' }}>
              <h3 className="text-xl font-semibold mb-4">Overall Sentiment Distribution</h3>
              <div className="h-full flex flex-col">
                <div className="flex-grow" style={{ minHeight: '300px' }}>
                  <Pie 
                    data={pieData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            usePointStyle: true,
                            padding: 10,
                            font: {
                              size: 11
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {articles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Related News</h3>
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
                        src={article.banner_image || 'https://via.placeholder.com/400x225'}
                        alt={article.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x225';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">{article.source}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          article.overall_sentiment_label === 'Bullish' ? 'bg-green-100 text-green-800' :
                          article.overall_sentiment_label === 'Bearish' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {article.overall_sentiment_label}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                        {article.title}
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
          
          {articles.length > 12 && !showAllArticles && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAllArticles(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Xem thêm tin tức
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsSentiment;



