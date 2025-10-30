import React, { useState, useEffect } from 'react';
import { ApiKeyManager } from './ApiKeyManager.tsx';
import { ApiKeyStatus } from './ApiKeyStatus.tsx';
import { ApiKeySource } from '../types.ts';

interface ApiKeySectionProps {
  onSaveKey: (key: string) => void;
  onRemoveKey: () => void;
  isKeySet: boolean;
  currentKeySource: ApiKeySource;
}

export const ApiKeySection: React.FC<ApiKeySectionProps> = ({
  onSaveKey,
  onRemoveKey,
  isKeySet,
  currentKeySource,
}) => {
  // This section is now collapsible to de-clutter the UI once a key is set.
  const [isExpanded, setIsExpanded] = useState(!isKeySet);

  useEffect(() => {
    // Automatically collapse if a key becomes set, and expand if it's removed.
    setIsExpanded(!isKeySet);
  }, [isKeySet]);

  return (
    <div className="my-6 bg-gray-50 dark:bg-gray-800 shadow-xl rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          API Key Configuration
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          aria-expanded={isExpanded}
          aria-controls="api-key-manager-section"
        >
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          )}
          <span className="sr-only">{isExpanded ? 'Collapse API Key Settings' : 'Expand API Key Settings'}</span>
        </button>
      </div>

      {isExpanded && (
        <div id="api-key-manager-section">
          <ApiKeyManager
            onSaveKey={onSaveKey}
            onRemoveKey={onRemoveKey}
            isKeySet={isKeySet}
          />
        </div>
      )}

      <div className="pt-2">
        <ApiKeyStatus apiKeyIsSet={isKeySet} apiKeySource={currentKeySource} />
      </div>
    </div>
  );
};
