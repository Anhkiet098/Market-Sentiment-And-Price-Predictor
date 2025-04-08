//WatchList.js
import { Menu, Transition } from '@headlessui/react';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import api from '../../services/api';
import { getStockQuote, getWatchlistName } from '../../services/stock.service';

const WatchList = ({ watchlist, onUpdateWatchlist }) => {
  const [newSymbol, setNewSymbol] = useState('');
  const [stockData, setStockData] = useState({});
  const [watchlistData, setWatchlistData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(watchlist[0] || '');
  const [chartData, setChartData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1d');
  const [compareMode, setCompareMode] = useState(false);
  const [comparedSymbols, setComparedSymbols] = useState([]);
  const [hoveredPrice] = useState(null);

  const periodOptions = [
    { label: '1N', value: '1d' },
    { label: '5N', value: '5d' },
    { label: '1T', value: '1mo' },
    { label: '6T', value: '6mo' },
    { label: 'YTD', value: 'ytd' },
    { label: '1N', value: '1y' },
    { label: '5N', value: '5y' },
  ];

  const addSymbol = async () => {
    if (!newSymbol) return;
    const updatedList = [...watchlist, newSymbol.toUpperCase()];
    await onUpdateWatchlist(updatedList);
    setNewSymbol('');
  };

  const removeSymbol = async (symbol) => {
    const updatedList = watchlist.filter(s => s !== symbol);
    await onUpdateWatchlist(updatedList);
  };

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const watchlistWithNames = await getWatchlistName();
      setWatchlistData(watchlistWithNames);
      
      const stockInfo = {};
      for (const item of watchlistWithNames) {
        try {
          const response = await getStockQuote(item.symbol);
          stockInfo[item.symbol] = response;
        } catch (error) {
          console.error(`Error fetching data for ${item.symbol}:`, error);
        }
      }
      setStockData(stockInfo);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const fetchChartData = async (symbol, period) => {
    try {
      const response = await api.get(`/market-info/${symbol}?period=${period}`);
      setChartData(response.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchMultipleChartData = async (symbols, period) => {
    try {
      const promises = symbols.map(symbol => 
        api.get(`/market-info/${symbol}?period=${period}`)
      );
      const responses = await Promise.all(promises);
      const newStockData = {};
      responses.forEach((response, index) => {
        newStockData[symbols[index]] = response.data;
      });
      setStockData(prevData => ({
        ...prevData,
        ...newStockData
      }));
    } catch (error) {
      console.error('Error fetching multiple chart data:', error);
    }
  };

  useEffect(() => {
    if (compareMode && comparedSymbols.length > 0) {
      fetchMultipleChartData(comparedSymbols, selectedPeriod);
    } else if (selectedSymbol) {
      fetchChartData(selectedSymbol, selectedPeriod);
    }
  }, [selectedSymbol, selectedPeriod, compareMode, comparedSymbols]);

  const handleSymbolClick = (symbol) => {
    setSelectedSymbol(symbol);
    setCompareMode(false);
    setComparedSymbols([]);
  };

  const handleAddToCompare = async (symbol) => {
    if (!compareMode) {
      setCompareMode(true);
      setComparedSymbols([selectedSymbol, symbol]);
    } else {
      if (!comparedSymbols.includes(symbol)) {
        setComparedSymbols([...comparedSymbols, symbol]);
      }
    }
  };

  const removeFromCompare = (symbolToRemove) => {
    const newSymbols = comparedSymbols.filter(sym => sym !== symbolToRemove);
    if (newSymbols.length <= 1) {
      setCompareMode(false);
      setComparedSymbols([]);
      setSelectedSymbol(newSymbols[0] || '');
    } else {
      setComparedSymbols(newSymbols);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    if (compareMode) {
      fetchMultipleChartData(comparedSymbols, period);
    } else {
      fetchChartData(selectedSymbol, period);
    }
  };

  const SparklineChart = ({ data, isPositive }) => {
    if (!data || data.length === 0) return null;

    const changes = data.map((price, index) => {
      if (index === 0) return 0;
      return ((price - data[0]) / data[0]) * 100;
    });

    const chartData = {
      labels: new Array(changes.length).fill(''),
      datasets: [{
        data: changes,
        borderColor: isPositive ? '#22c55e' : '#ef4444',
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        tension: 0.3
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    };

    return (
      <div className="w-[100px] h-[30px] flex items-center">
        <Line data={chartData} options={options} />
      </div>
    );
  };

  useEffect(() => {
    const fetchWatchlistData = async () => {
      try {
        const watchlistWithNames = await getWatchlistName();
        setWatchlistData(watchlistWithNames);
        
        const stockInfo = {};
        for (const item of watchlistWithNames) {
          try {
            const response = await getStockQuote(item.symbol);
            stockInfo[item.symbol] = response;
          } catch (error) {
            console.error(`Error fetching data for ${item.symbol}:`, error);
          }
        }
        setStockData(stockInfo);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      }
    };

    fetchWatchlistData();
  }, []);

  // Thêm hàm để tính phần trăm thay đổi
  const calculatePercentageChanges = (priceHistory) => {
    if (!priceHistory || priceHistory.length === 0) return [];
    const initialPrice = priceHistory[0];
    return priceHistory.map(price => ((price - initialPrice) / initialPrice) * 100);
  };

  const formatTimeLabel = (timestamp, period) => {
    const date = new Date(timestamp);
    switch(period) {
      case '1d':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '5d':
        return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
      case '1mo':
        return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
      case '6mo':
      case 'ytd':
        return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
      case '1y':
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      case '5y':
        return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  };

  const getTicksLimit = (period) => {
    switch(period) {
      case '1d': return 6;  // Hiển thị 6 mốc thời gian trong ngày
      case '5d': return 5;  // Hiển thị 5 ngày
      case '1mo': return 8; // Hiển thị 8 mốc trong tháng
      case '6mo': return 6; // Hiển thị 6 tháng
      case 'ytd': return 6; // Hiển thị 6 mốc từ đầu năm
      case '1y': return 12; // Hiển thị 12 tháng
      case '5y': return 5;  // Hiển thị 5 năm
      default: return 6;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Watchlist</h2>
        <button
          onClick={refreshData}
          className={`p-2 rounded-full hover:bg-gray-100 ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
          title="Refresh data"
        >
          <ArrowPathIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex gap-6 min-h-0 flex-1">
          <div className="w-1/4 flex flex-col min-h-0">
            <div className="flex gap-2 mb-4 flex-shrink-0">
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Add symbol"
                className="flex-1 px-3 py-1.5 border rounded text-sm"
              />
              <button
                onClick={addSymbol}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm"
              >
                Add
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <div className="space-y-1.5">
                {watchlist.map((symbol) => (
                  <div key={symbol} className="flex items-center">
                    <div 
                      className={`flex-1 cursor-pointer p-2 rounded transition-all text-sm
                        ${selectedSymbol === symbol ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'}
                      `}
                      onClick={() => handleSymbolClick(symbol)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{symbol}</span>
                        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleAddToCompare(symbol)}
                            className="p-1 hover:bg-gray-200 rounded-full"
                            title="Thêm vào so sánh"
                          >
                            <PlusIcon className="h-4 w-4 text-blue-600" />
                          </button>
                          <Menu as="div" className="relative">
                            <Menu.Button className="text-gray-600 hover:bg-gray-200 rounded-full p-1">
                              ...
                            </Menu.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => removeSymbol(symbol)}
                                      className={`${
                                        active ? 'bg-gray-100' : ''
                                      } block w-full text-left px-4 py-2 text-sm text-red-600`}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </Menu.Item>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {compareMode && (
              <div className="mt-4 py-2 border-t flex-shrink-0">
                <div className="text-base font-semibold mb-3">Compare with</div>
                <div className="flex flex-wrap gap-2">
                  {comparedSymbols.map((symbol, index) => (
                    <div 
                      key={symbol}
                      className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5"
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: ['#4BC0C0', '#FF6384', '#36A2EB'][index % 3] 
                        }}
                      />
                      <span className="text-sm">{symbol}</span>
                      <button
                        onClick={() => removeFromCompare(symbol)}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {chartData && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-shrink-0 mb-4">
                <div className="text-lg text-gray-600">
                  {chartData.name}
                </div>
                
                <div>
                  <div className="text-2xl font-semibold">
                    ${hoveredPrice || chartData.price || '0.00'}
                  </div>
                  <div className={`text-base ${
                    (chartData.change_percent || 0) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {chartData.change_percent >= 0 ? '+' : ''}{chartData.change_percent || 0}%
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5 mt-2">
                  {periodOptions.map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => handlePeriodChange(value)}
                      className={`px-2.5 py-1 rounded text-sm ${
                        selectedPeriod === value 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-h-0 relative pb-6">
                <div className="absolute inset-0">
                  <Line
                    data={{
                      labels: chartData.timestamps.map(ts => formatTimeLabel(ts, selectedPeriod)),
                      datasets: compareMode ? 
                        comparedSymbols.map((symbol, index) => ({
                          label: symbol,
                          data: calculatePercentageChanges(stockData[symbol]?.price_history || []),
                          borderColor: ['#4BC0C0', '#FF6384', '#36A2EB'][index % 3],
                          fill: false,
                          tension: 0.3
                        })) : 
                        [{
                          label: selectedSymbol,
                          data: chartData.price_history || [],
                          borderColor: '#22c55e',
                          borderWidth: 1.5,
                          fill: {
                            target: 'origin',
                            above: 'rgba(34, 197, 94, 0.1)',
                          },
                          tension: 0.3
                        }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        tooltip: {
                          enabled: true,
                          callbacks: {
                            label: (context) => {
                              if (compareMode) {
                                return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
                              }
                              return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
                            },
                            title: (tooltipItems) => {
                              return formatTimeLabel(chartData.timestamps[tooltipItems[0].dataIndex], selectedPeriod);
                            }
                          }
                        }
                      },
                      scales: {
                        x: { 
                          display: true,
                          grid: { 
                            display: false,
                            drawOnChartArea: false
                          },
                          ticks: {
                            maxTicksLimit: getTicksLimit(selectedPeriod),
                            font: {
                              size: 11
                            },
                            padding: 8,
                            callback: function(index) {
                              return formatTimeLabel(chartData.timestamps[index], selectedPeriod);
                            }
                          },
                          border: {
                            display: false
                          }
                        },
                        y: { 
                          display: true,
                          position: 'right',
                          grid: { 
                            color: '#f0f0f0',
                            drawBorder: false
                          },
                          ticks: {
                            callback: function(value) {
                              if (compareMode) {
                                return value.toFixed(1) + '%';
                              }
                              return '$' + value.toFixed(2);
                            },
                            font: {
                              size: 11
                            },
                            padding: 8
                          },
                          border: {
                            display: false
                          }
                        }
                      },
                      layout: {
                        padding: {
                          bottom: 20
                        }
                      },
                      elements: {
                        point: {
                          radius: 0,
                          hoverRadius: 0
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 border-t pt-4 flex-shrink-0 max-h-[300px] overflow-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Symbol</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Change</th>
                  <th className="px-4 py-2 text-right">Change %</th>
                  <th className="px-4 py-2 text-right">Volume</th>
                  <th className="px-4 py-2 text-right">Avg Vol (3M)</th>
                  <th className="px-4 py-2 text-right">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {watchlistData.map(({symbol, name}) => (
                  <tr key={symbol} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <span className="text-blue-600 font-medium">{symbol}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-between space-x-4">
                        <span className="min-w-[150px]">{name}</span>
                        {stockData[symbol]?.price_history && (
                          <SparklineChart 
                            data={stockData[symbol].price_history}
                            isPositive={stockData[symbol].change >= 0}
                          />
                        )}
                      </div>
                    </td>
                    {stockData[symbol] ? (
                      <>
                        <td className="px-4 py-2 text-right">
                          ${parseFloat(stockData[symbol].price).toFixed(2)}
                        </td>
                        <td className={`px-4 py-2 text-right ${stockData[symbol].change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stockData[symbol].change > 0 ? '+' : ''}{stockData[symbol].change}
                        </td>
                        <td className={`px-4 py-2 text-right ${stockData[symbol].change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stockData[symbol].change_percent > 0 ? '+' : ''}{stockData[symbol].change_percent}%
                        </td>
                        <td className="px-4 py-2 text-right">
                          {parseInt(stockData[symbol].volume).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {parseInt(stockData[symbol].avg_volume_3m).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {stockData[symbol].market_cap}
                        </td>
                      </>
                    ) : (
                      <td colSpan="6" className="px-4 py-2 text-center">Loading...</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchList;

