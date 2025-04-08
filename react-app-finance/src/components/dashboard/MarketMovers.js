import React, { useState } from 'react';

const MarketMovers = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) return <div>Loading...</div>;

  const renderTable = (items, title) => {
    const displayItems = isExpanded ? items : items.slice(0, 10);

    return (
      <div className="flex-1 px-2">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full bg-white text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2">Symbol</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2">Change %</th>
                <th className="px-2 py-2">Volume</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-2 py-2 font-medium">{item.ticker}</td>
                  <td className="px-2 py-2">${item.price}</td>
                  <td className={`px-2 py-2 ${
                    item.change_percentage.includes('-') 
                      ? 'text-red-500' 
                      : 'text-green-500'
                  }`}>
                    {item.change_percentage}
                  </td>
                  <td className="px-2 py-2">{Number(item.volume).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Market Movers</h2>
      <div className="relative">
        <div className="flex flex-row gap-4">
          {renderTable(data.top_gainers, "Top Gainers")}
          {renderTable(data.top_losers, "Top Losers")}
          {renderTable(data.most_active, "Most Active")}
        </div>
        
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent flex items-end justify-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="mb-2 px-4 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Xem thêm
            </button>
          </div>
        )}
        
        {isExpanded && (
          <div className="text-center mt-4">
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Thu gọn
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketMovers;