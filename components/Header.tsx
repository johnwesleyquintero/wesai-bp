import React from 'react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="text-center relative py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 py-1">
        {title}
      </h1>
    </header>
  );
};
