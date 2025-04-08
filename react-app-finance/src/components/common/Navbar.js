// src/components/common/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../services/auth.service';
import logo from '../../asset/Gemini_Generated_Image_mmjtfummjtfummjt.jpeg';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img 
                src={logo} 
                alt="Finance Dashboard Logo" 
                className="h-16 w-16 object-contain"
              />
              <span className="font-medium text-gray-700 hover:text-gray-900">
                Finance Dashboard
              </span>
            </Link>
          </div>
          <div className="flex items-center">
            <Link
              to="/dashboard"
              className="px-3 py-2 text-gray-700 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              to="/profile"
              className="px-3 py-2 text-gray-700 hover:text-gray-900"
            >
              Profile
            </Link>
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="ml-4 px-3 py-2 text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="ml-4 px-3 py-2 text-gray-700 hover:text-gray-900"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
