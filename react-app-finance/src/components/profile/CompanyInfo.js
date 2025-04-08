// src/components/profile/CompanyInfo.js
import React, { useEffect, useState } from 'react';
import { getCompanyInfo, getWatchlistName } from '../../services/stock.service';

const CompanyInfo = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [selectedSymbol, setSelectedSymbol] = useState('');
    const [companyInfo, setCompanyInfo] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        const fetchWatchlist = async () => {
        try {
            const data = await getWatchlistName();
            setWatchlist(data);
        } catch (error) {
            console.error('Error fetching watchlist:', error);
        }
        };
        fetchWatchlist();
    }, []);

    useEffect(() => {
        const fetchCompanyInfo = async () => {
        if (selectedSymbol) {
            try {
            const data = await getCompanyInfo(selectedSymbol);
            setCompanyInfo(data);
            } catch (error) {
            console.error('Error fetching company info:', error);
            }
        }
        };
        fetchCompanyInfo();
    }, [selectedSymbol]);

    const formatFinancialValue = (value) => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 2
        }).format(value);
        }
        return value;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).getFullYear().toString();
    };

    const getFinancialMetrics = () => {
        if (!companyInfo?.financials) return [];
        
        const metrics = [
        { 
            name: 'Revenue',
            keys: ['Total Revenue', 'Operating Revenue']
        },
        {
            name: 'Gross Profit',
            keys: ['Gross Profit']
        },
        {
            name: 'Operating Income',
            keys: ['Operating Income']
        },
        {
            name: 'Net Income',
            keys: ['Net Income']
        },
        {
            name: 'R&D Expenses',
            keys: ['Research And Development']
        },
        {
            name: 'Operating Expenses',
            keys: ['Operating Expense']
        },
        {
            name: 'EPS (Basic)',
            keys: ['Basic EPS'],
            format: (value) => value ? `$${value}` : 'N/A'
        },
        {
            name: 'EPS (Diluted)',
            keys: ['Diluted EPS'],
            format: (value) => value ? `$${value}` : 'N/A'
        }
        ];

        const years = Object.keys(companyInfo.financials).sort().reverse();
        return years.map(year => {
        const yearData = companyInfo.financials[year];
        return {
            year: formatDate(year),
            metrics: metrics.map(metric => ({
            name: metric.name,
            value: metric.format ? 
                metric.format(yearData[metric.keys[0]]) : 
                formatFinancialValue(yearData[metric.keys.find(key => yearData[key] !== null)])
            }))
        };
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Company Information</h2>
            <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
            <option value="">Select a company</option>
            {watchlist.map((item) => (
                <option key={item.symbol} value={item.symbol}>
                {item.name} ({item.symbol})
                </option>
            ))}
            </select>
        </div>

        {companyInfo && (
            <div className="space-y-6">
            <h3 className="text-xl font-bold">{companyInfo.name}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="text-sm text-gray-500">Sector</p>
                <p className="font-medium">{companyInfo.sector}</p>
                </div>
                
                <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="text-sm text-gray-500">Industry</p>
                <p className="font-medium">{companyInfo.industry}</p>
                </div>
                
                <div className="p-3 bg-white rounded-md shadow-sm">
                <p className="text-sm text-gray-500">Website</p>
                <a 
                    href={companyInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                >
                    {companyInfo.website}
                </a>
                </div>
            </div>

            <div className="border-b border-gray-200">
                <div className="flex space-x-4">
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`py-2 px-4 border-b-2 font-medium ${
                    activeTab === 'summary'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Business Summary
                </button>
                <button
                    onClick={() => setActiveTab('financials')}
                    className={`py-2 px-4 border-b-2 font-medium ${
                    activeTab === 'financials'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Financial Report
                </button>
                </div>
            </div>

            <div className="mt-4">
                {activeTab === 'summary' && (
                <p className="text-gray-700 leading-relaxed">
                    {companyInfo.longBusinessSummary}
                </p>
                )}

                {activeTab === 'financials' && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Metrics
                        </th>
                        {getFinancialMetrics().map(yearData => (
                            <th key={yearData.year} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            FY {yearData.year}
                            </th>
                        ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {getFinancialMetrics()[0]?.metrics.map((metric, idx) => (
                        <tr key={metric.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {metric.name}
                            </td>
                            {getFinancialMetrics().map(yearData => (
                            <td key={yearData.year} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {yearData.metrics[idx].value}
                            </td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                )}
            </div>
            </div>
        )}
        </div>
    );
};

export default CompanyInfo;


