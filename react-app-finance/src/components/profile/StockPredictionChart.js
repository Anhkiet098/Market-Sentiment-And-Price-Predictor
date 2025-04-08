import { Alert, Card, CardContent, CardHeader, Typography } from '@mui/material';
import AlertTitle from '@mui/material/AlertTitle';
import { AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getStockPredictionGRU, getWatchlist } from '../../services/stock.service';

const StockPredictionChart = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const data = await getWatchlist();
      setWatchlist(data);
    } catch (err) {
      setError('Failed to fetch watchlist. Please try again later.');
    }
  };

  const handlePrediction = async () => {
    if (!selectedStock) {
      setError('Vui lòng chọn một mã cổ phi���u');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getStockPredictionGRU(selectedStock);

      // Thêm xử lý làm tròn số cho giá
      const historicalData = data.historical_dates.map((date, index) => ({
        date,
        price: Number(data.historical_prices[index].toFixed(2)),
        prediction: null
      }));

      const predictionData = data.dates.map((date, index) => ({
        date,
        price: null,
        prediction: Number(data.predicted_prices[index].toFixed(2))
      }));

      setPredictionData({
        symbol: data.symbol,
        chartData: [...historicalData, ...predictionData]
      });
    } catch (err) {
      setError('Không thể lấy dữ liệu dự đoán. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <Typography variant="h5">Stock Price Prediction</Typography>
      </CardHeader>
      <CardContent>
        <h2 className="text-xl font-bold mb-4">7-Day Price Prediction Using GRU</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="w-48 px-3 py-2 border rounded"
            >
              <option value="">Select a stock</option>
              {watchlist.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
            <button
              onClick={handlePrediction}
              disabled={loading || !selectedStock}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              {loading ? 'Predicting...' : 'PREDICT NEXT 7 DAYS'}
            </button>
          </div>

          {error && (
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              <AlertCircle className="h-4 w-4" />
              {error}
            </Alert>
          )}

          {predictionData && (
            <div className="mt-4 flex gap-6">
              <div className="w-[80%]">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart 
                    data={predictionData.chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded shadow">
                              <p className="font-bold">{label}</p>
                              {payload.map((entry, index) => (
                                <p key={index} style={{ color: entry.color }}>
                                  {entry.name === 'prediction'
                                    ? `Dự đoán: $${entry.value}`
                                    : `Thực tế: $${entry.value}`}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      height={36}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#8884d8"
                      name="Historical Price"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="prediction"
                      stroke="#82ca9d"
                      name="Predicted Price"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[20%] space-y-2">
                <h3 className="font-bold mb-3">Prediction Results:</h3>
                {predictionData.chartData
                  .filter(data => data.prediction !== null)
                  .map((data, index) => (
                    <div key={index} className="flex justify-between bg-gray-50 p-2 rounded">
                      <span>{data.date}</span>
                      <span className="font-medium">${data.prediction}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StockPredictionChart;

