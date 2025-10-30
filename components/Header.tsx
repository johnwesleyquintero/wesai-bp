
import React from 'react';
import { Theme } from '../types.ts';
import { ThemeToggleButton } from './ThemeToggleButton.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface HeaderProps {
  isCodeGenerated: boolean;
  onNew: () => void;
  onCopy: () => void;
  onDownload: () => void;
  copilotInput: string;
  onCopilotInputChange: (value: string) => void;
  onCopilotSubmit: () => void;
  isLoading: boolean;
  theme: Theme;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    isCodeGenerated,
    onNew,
    onCopy,
    onDownload,
    copilotInput,
    onCopilotInputChange,
    onCopilotSubmit,
    isLoading,
    theme,
    toggleTheme
}) => {
  const handleCopilotFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (copilotInput.trim()) {
        onCopilotSubmit();
    }
  };

  return (
    <header className="flex items-center justify-between py-2 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm flex-shrink-0">
      <div className="flex items-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8">
            <polygon points="50,10 90,90 10,90" fill="currentColor" className="text-purple-500"/>
        </svg>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 hidden sm:block">
            WesAI Builder
        </h1>
      </div>

      {isCodeGenerated && (
        <form onSubmit={handleCopilotFormSubmit} className="flex-grow flex justify-center items-center px-4">
             <div className="relative w-full max-w-xl">
                 <input 
                    type="text"
                    value={copilotInput}
                    onChange={(e) => onCopilotInputChange(e.target.value)}
                    placeholder="Describe a change... (e.g., 'make all the buttons blue')"
                    disabled={isLoading}
                    className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm rounded-full py-2 pl-4 pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                 />
                 <button type="submit" disabled={isLoading || !copilotInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-blue-500 disabled:opacity-50">
                    {isLoading ? <LoadingSpinner /> : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                    )}
                 </button>
             </div>
        </form>
      )}

      <div className="flex items-center space-x-2">
        {isCodeGenerated && (
            <>
                <button onClick={onNew} disabled={isLoading} className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-md disabled:opacity-50 transition-colors">
                    New
                </button>
                <button onClick={onCopy} disabled={isLoading} className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-md disabled:opacity-50 transition-colors">
                    Copy
                </button>
                <button onClick={onDownload} disabled={isLoading} className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-md disabled:opacity-50 transition-colors">
                    Download
                </button>
            </>
        )}
         <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
};
