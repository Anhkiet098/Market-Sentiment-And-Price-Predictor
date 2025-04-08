import { ArrowDown, ArrowUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getMarketIndices } from '../../services/stock.service';

const MarketIndices = () => {
    const [indices, setIndices] = useState({});

    useEffect(() => {
        const fetchData = async () => {
        try {
            const data = await getMarketIndices();
            setIndices(data);
        } catch (error) {
            console.error('Error fetching market indices:', error);
        }
        };

        fetchData();
        
        // Refresh data every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
        }).format(num);
    };

    return (
        <div className="flex flex-wrap gap-2">
        {Object.entries(indices).map(([name, data]) => {
            const isPositive = data.change >= 0;
            const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
            
            return (
            <div 
                key={name}
                className="flex-1 min-w-[200px] px-3 py-2 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors shadow-md"
            >
                <div className="flex items-center gap-1 mb-1">
                {isPositive ? (
                    <ArrowUp className={`w-4 h-4 ${colorClass}`} />
                ) : (
                    <ArrowDown className={`w-4 h-4 ${colorClass}`} />
                )}
                <span className="text-sm text-gray-600 font-medium truncate">
                    {name}
                </span>
                </div>
                
                <div className="flex items-baseline gap-2">
                <span className="text-base font-medium">
                    {formatNumber(data.price)}
                </span>
                <div className={`flex items-center gap-1 ${colorClass} text-sm`}>
                    <span>{formatNumber(data.change)}</span>
                    <span>({formatNumber(data.change_percent)}%)</span>
                </div>
                </div>
            </div>
            );
        })}
        </div>
    );
};

export default MarketIndices;
