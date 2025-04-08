//src/components/profile/UserProfile.js
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import CompanyInfo from './CompanyInfo';
import SentimentChart from './SentimentChart';
import StockPredictionChart from './StockPredictionChart';
import WatchList from './WatchList';

const UserProfile = () => {
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await api.get('/watchlist');
        setWatchlist(response.data);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      }
    };

    fetchWatchlist();
  }, []);

  const updateWatchlist = async (symbols) => {
    try {
      await api.put('/watchlist', { symbols });
      setWatchlist(symbols);
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      <div className="grid gap-8 flex-grow">
        <div className="min-h-[800px]">
          <WatchList 
            watchlist={watchlist} 
            onUpdateWatchlist={updateWatchlist} 
          />
        </div>
        <CompanyInfo />
        <StockPredictionChart />
        <SentimentChart />
      </div>
    </div>
  );
};

export default UserProfile;

