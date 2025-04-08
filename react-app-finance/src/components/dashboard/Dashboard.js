// src/components/dashboard/Dashboard.js
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import IPOCalendar from './IPOCalendar';
import MarketIndices from './MarketIndices'; 
import MarketMovers from './MarketMovers';
import MarketNews from './MarketNews';

const Dashboard = () => {
  const [marketMoversData, setMarketMoversData] = useState(null);
  const [marketNewsData, setMarketNewsData] = useState(null);
  const [ipoData, setIpoData] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moversResponse, newsResponse, ipoResponse] = await Promise.all([
          api.get('/market-movers'),
          api.get('/market-news?page=1'),
          api.get('/ipo-calendar')
        ]);

        setMarketMoversData(moversResponse.data);
        setMarketNewsData(newsResponse.data.news);
        setIpoData(ipoResponse.data);
        setTotalPages(newsResponse.data.total_pages);
        setTotalItems(newsResponse.data.total_items);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);
  return (
    <div className="container mx-auto px-4 py-8">
      <MarketIndices /> {/* Thêm component s&P500*/}
      <div className="mt-6">
        <MarketMovers data={marketMoversData} />
      </div>
      <div className="mt-8">
        <IPOCalendar ipoData={ipoData} />
      </div>
      {/* <div className="mt-8">
        <NewsSentiment />
      </div> */}
      <div className="mt-8">
        <MarketNews 
          initialNews={marketNewsData} 
          totalPages={totalPages}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
};

export default Dashboard;
