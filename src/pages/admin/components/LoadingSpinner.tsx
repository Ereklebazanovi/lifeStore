import React from 'react';
import { Shield, Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
      <div className="text-center">
        {/* Animated Shield */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping"></div>
          <div className="relative bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-full shadow-lg">
            <Shield className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Loading Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900">Admin Panel იტვირთება</h2>
          </div>

          <p className="text-gray-600 mb-6">
            გთხოვთ დაელოდოთ, სისტემა ამუშავებს თქვენს მონაცემებს...
          </p>

          {/* Loading Animation */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">Authentication ვერიფიკაცია...</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-sm text-gray-500">Admin უფლებების შემოწმება...</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span className="text-sm text-gray-500">Dashboard-ის მომზადება...</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-gray-400 text-sm mt-6">
          LifeStore Admin Dashboard
        </p>
      </div>

    </div>
  );
};

export default LoadingSpinner;