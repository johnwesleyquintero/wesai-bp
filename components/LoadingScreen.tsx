
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner.tsx';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* FIX: Replaced Header component with a simplified static header to resolve prop type errors. */}
      <header className="flex items-center justify-between py-2 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8">
              <polygon points="50,10 90,90 10,90" fill="currentColor" className="text-purple-500"/>
          </svg>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 sm:block">
              WesAI Builder Platform
          </h1>
        </div>
      </header>
      <div className="flex-grow flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center">
            <LoadingSpinner />
            <span className="text-gray-500 dark:text-gray-400">Initializing...</span>
        </div>
      </div>
      <footer className="w-full text-center py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} John Wesley Quintero. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};
