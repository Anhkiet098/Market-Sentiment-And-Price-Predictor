import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">About Us</h3>
            <p className="text-gray-300">
              Providing real-time financial data and analysis tools for informed investment decisions.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</a>
              </li>
              <li>
                <a href="/profile" className="text-gray-300 hover:text-white">Profile</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-4">Contact</h3>
            <p className="text-gray-300">
              Email: support@financedashboard.com<br />
              Phone: (555) 123-4567
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-300">
            © {new Date().getFullYear()} Finance Dashboard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
