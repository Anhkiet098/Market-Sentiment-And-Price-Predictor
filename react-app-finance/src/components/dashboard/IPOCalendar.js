// IPOCalendar.js
import { format } from 'date-fns';
import React, { useState } from 'react';

const IPOCalendar = ({ ipoData }) => {
  const [selectedStatus, setSelectedStatus] = useState('all');

  if (!ipoData?.ipoCalendar) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">IPO Calendar</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const filteredIPOs = ipoData.ipoCalendar.filter(ipo => 
    selectedStatus === 'all' || ipo.status === selectedStatus
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">IPO Calendar</h2>
        <select
          className="px-4 py-2 border rounded-lg"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="expected">Expected</option>
          <option value="priced">Priced</option>
          <option value="withdrawn">Canceled</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trading
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Number of shares
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estimated price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredIPOs.map((ipo, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(ipo.date), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                  {ipo.symbol}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {ipo.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {ipo.exchange}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {new Intl.NumberFormat().format(ipo.numberOfShares)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {ipo.price}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${ipo.status === 'expected' ? 'bg-yellow-100 text-yellow-800' : 
                      ipo.status === 'priced' ? 'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {ipo.status === 'expected' ? 'Expected' :
                      ipo.status === 'priced' ? 'Priced' : 'Canceled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IPOCalendar;
