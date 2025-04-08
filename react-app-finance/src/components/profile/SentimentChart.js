// SentimentChart.js
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { getNewsArticles, getNewsSentiment, getWatchlistName } from '../../services/stock.service';
import './SentimentChart.css';

const SentimentChart = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [selectedSymbol, setSelectedSymbol] = useState('');
    const [daysAgo, setDaysAgo] = useState(30);
    const [sentimentData, setSentimentData] = useState(null);
    const [articles, setArticles] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                const response = await getWatchlistName();
                setWatchlist(response);
                if (response.length > 0) {
                    setSelectedSymbol(response[0].symbol);
                }
            } catch (error) {
                setError("Không thể lấy danh sách theo dõi");
            }
        };

        fetchWatchlist();
    }, []);

    const handleSymbolChange = (event) => {
        setSelectedSymbol(event.target.value);
        setSentimentData(null);
        setArticles([]);
        setCurrentPage(1);
    };

    const handleDaysChange = (event) => {
        setDaysAgo(parseInt(event.target.value));
        setSentimentData(null);
        setArticles([]);
        setCurrentPage(1);
    };

    const handleAnalyzeClick = async () => {
        if (!selectedSymbol) return;

        setAnalyzing(true);
        setError(null);
        setSentimentData(null);
        setArticles([]);
        
        try {
            const sentimentResponse = await getNewsSentiment(selectedSymbol, daysAgo);
            console.log("Sentiment Response:", sentimentResponse);

            if (!sentimentResponse) {
                throw new Error("Không nhận được dữ liệu từ server");
            }

            setSentimentData(sentimentResponse);
            setError(null);

            const articlesResponse = await getNewsArticles(selectedSymbol, daysAgo, 1);
            console.log("Articles Response:", articlesResponse);

            if (articlesResponse && articlesResponse.articles) {
                setArticles(articlesResponse.articles);
                setTotalPages(articlesResponse.total_pages);
                setCurrentPage(1);
            } else {
                console.warn("Không có tin tức nào được tìm thấy");
            }

        } catch (error) {
            console.error("Error in handleAnalyzeClick:", error);
            setError(error.message || "Không thể lấy dữ liệu phân tích cảm xúc. Vui lòng thử lại.");
            setSentimentData(null);
        } finally {
            setAnalyzing(false);
        }
    };

    const loadMoreArticles = async () => {
        if (loading || currentPage >= totalPages) return;
        
        setLoading(true);
        try {
            const nextPage = currentPage + 1;
            const response = await getNewsArticles(selectedSymbol, daysAgo, nextPage);
            
            if (response && response.articles) {
                setArticles(prevArticles => [...prevArticles, ...response.articles]);
                setCurrentPage(nextPage);
            }
        } catch (error) {
            console.error("Error loading more articles:", error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = sentimentData ? {
        labels: sentimentData.dates,
        datasets: [
            {
                label: 'News-Positive',
                data: sentimentData.positive_counts,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            },
            {
                label: 'News-Negative',
                data: sentimentData.negative_counts,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.1
            }
        ]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `News sentiment analysis for ${selectedSymbol}`
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Number of news'
                }
            }
        }
    };

    return (
        <div className="sentiment-analysis-container">
            <div className="content-wrapper">
                <h2 className="text-xl font-bold mb-4">News Sentiment Analysis For Company</h2>
                <div className="controls-section">
                    <div className="flex flex-wrap gap-4 items-center">
                        <select 
                            value={selectedSymbol} 
                            onChange={handleSymbolChange}
                            className="p-2 border rounded"
                        >
                            <option value="">Select stock</option>
                            {watchlist.map(item => (
                                <option key={item.symbol} value={item.symbol}>
                                    {item.symbol} - {item.name}
                                </option>
                            ))}
                        </select>
                        
                        <input 
                            type="number" 
                            value={daysAgo} 
                            onChange={handleDaysChange}
                            min="1" 
                            max="365"
                            className="p-2 border rounded w-32"
                            placeholder="Số ngày" 
                        />

                        <button 
                            onClick={handleAnalyzeClick} 
                            disabled={analyzing || !selectedSymbol}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {analyzing ? "Analyzing..." : "Analysis"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="error-message bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                        {error}
                    </div>
                )}

                {analyzing && (
                    <div className="flex justify-center items-center p-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-3">Analyzing..</span>
                    </div>
                )}

                {sentimentData && !analyzing && (
                    <div className="content-wrapper">
                        <div className="chart-section">
                            <div className="chart-container">
                                <Line 
                                    data={chartData} 
                                    options={{
                                        ...chartOptions,
                                        maintainAspectRatio: false,
                                        responsive: true
                                    }} 
                                />
                            </div>
                        </div>

                        <div className="news-section">
                            <h3 className="text-xl font-semibold">Recent news</h3>
                            {articles
                                .filter(article => 
                                    article.urlToImage && 
                                    article.urlToImage !== 'null' && 
                                    article.urlToImage !== '[Null]' && 
                                    !article.urlToImage.includes('removal')
                                ).length === 0 ? (
                                <div className="text-center text-gray-500 py-4">
                                    Không có tin tức nào cho khoảng thời gian này
                                </div>
                            ) : (
                                <div className="news-grid">
                                    {articles
                                     .filter(article => 
                                        article.urlToImage && 
                                        article.urlToImage !== 'null' && 
                                        article.urlToImage !== '[Null]' && 
                                        !article.urlToImage.includes('removal')
                                    )                                  
                                    .map((article, index) => (
                                        <a
                                            key={index}
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="news-card"
                                        >
                                            <div className="p-4">
                                                {article.urlToImage && (
                                                    <img
                                                        src={article.urlToImage}
                                                        alt={article.title}
                                                        className="w-full h-48 object-cover rounded mb-4"
                                                    />
                                                )}
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-500">{article.source}</span>
                                                    <span className="text-sm text-gray-500">{article.date}</span>
                                                </div>
                                                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                                                    {article.title}
                                                </h3>
                                                <span className={`inline-block px-2 py-1 rounded text-sm ${
                                                    article.sentiment === 'Positive' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {article.sentiment}
                                                </span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
                            {/* Nút "Xem thêm" */}
                            {currentPage < totalPages && 
                            articles.filter(article => 
                                article.urlToImage && 
                                article.urlToImage !== 'null' && 
                                article.urlToImage !== '[Null]' && 
                                !article.urlToImage.includes('removal')
                            ).length > 0 && (
                                <div className="text-center mt-6">
                                    <button
                                        onClick={loadMoreArticles}
                                        disabled={loading}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {loading ? 'Loading...' : 'See more news'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SentimentChart;




