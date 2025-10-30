import React, { useState } from 'react';

interface ApiKeyManagerProps {
  onSaveKey: (key: string) => void;
  onRemoveKey: () => void;
  isKeySet: boolean;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onSaveKey, onRemoveKey, isKeySet }) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showSavedMessage, setShowSavedMessage] = useState<boolean>(false);

  const handleSave = () => {
    if (apiKeyInput.trim()) {
      onSaveKey(apiKeyInput);
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 3000);
    }
  };

  const handleRemove = () => {
    const confirmationMessage = "Are you sure you want to remove the API key? This will clear the currently saved key and any generated content (reviews, refactors, images, chat history) from this session. The application will then attempt to use an environment variable key if available. If no key is active, features will be disabled.";
    if (window.confirm(confirmationMessage)) {
      onRemoveKey();
      setApiKeyInput('');
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="space-y-2">
        <label htmlFor="apiKeyInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Enter your Gemini API Key:
        </label>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="password"
            id="apiKeyInput"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={isKeySet ? "Enter new key to override" : "Your Gemini API Key"}
            className="flex-grow p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 font-mono text-sm"
          />
          <button
            onClick={handleSave}
            disabled={!apiKeyInput.trim()}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Save Key
          </button>
          {isKeySet && (
            <button
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 ease-in-out whitespace-nowrap"
            >
              Remove Key
            </button>
          )}
        </div>
      </div>

      {showSavedMessage && (
        <p className="text-sm text-green-500 dark:text-green-400">API Key saved successfully!</p>
      )}

      {!isKeySet && (
         <p className="text-sm text-yellow-600 dark:text-yellow-400">
           No API key is currently active. Please enter and save your key to use the application.
         </p>
      )}
    </div>
  );
};
