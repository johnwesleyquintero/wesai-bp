import React from 'react';
import { ApiKeyManager } from './ApiKeyManager.tsx';
import { ApiKeyStatus } from './ApiKeyStatus.tsx';
import { ApiKeySource } from '../types.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
  onRemoveKey: () => void;
  isKeySet: boolean;
  currentKeySource: ApiKeySource;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSaveKey,
  onRemoveKey,
  isKeySet,
  currentKeySource,
}) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4" 
        onClick={onClose} 
        aria-modal="true" 
        role="dialog"
    >
      <div 
        className="relative w-full max-w-2xl bg-gray-50 dark:bg-gray-800 shadow-2xl rounded-lg p-6 space-y-6" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200" id="settings-modal-title">
                    Settings
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your API key and application preferences.</p>
            </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            aria-label="Close settings modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              API Key Configuration
            </h3>
            <ApiKeyManager
                onSaveKey={onSaveKey}
                onRemoveKey={onRemoveKey}
                isKeySet={isKeySet}
            />
            <div className="mt-6">
                 <ApiKeyStatus apiKeyIsSet={isKeySet} apiKeySource={currentKeySource} />
            </div>
        </div>

      </div>
    </div>
  );
};
