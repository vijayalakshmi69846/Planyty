import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] text-center p-6">
      <h1 className="text-9xl font-extrabold text-gray-800">404</h1>
      <h2 className="text-4xl font-bold text-gray-800 mt-4 mb-6">Page Not Found</h2>
      <p className="text-xl text-gray-600 mb-8 max-w-md">
        Oops! The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button className="flex items-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg">
          <Home className="w-5 h-5 mr-2" />
          Go to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;