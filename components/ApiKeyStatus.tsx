import React from 'react';

interface ApiKeyStatusProps {
  apiKeyIsSet: boolean;
  apiKeySource: 'ui' | 'env' | 'none';
}

export const ApiKeyStatus: React.FC<ApiKeyStatusProps> = ({ apiKeyIsSet, apiKeySource }) => {
  let statusMessage = '';
  let baseBgColor = 'bg-yellow-100 dark:bg-yellow-700/30';
  let baseBorderColor = 'border-yellow-400 dark:border-yellow-600';
  let baseTextColor = 'text-yellow-700 dark:text-yellow-200';
  let subTextColor = 'text-yellow-600 dark:text-yellow-300';
  let securityNoteColor = 'text-orange-600 dark:text-orange-300';


  if (apiKeyIsSet) {
    baseBgColor = 'bg-green-100 dark:bg-green-700/30';
    baseBorderColor = 'border-green-400 dark:border-green-600';
    baseTextColor = 'text-green-700 dark:text-green-200';
    subTextColor = 'text-green-600 dark:text-green-300';
    if (apiKeySource === 'ui') {
      statusMessage = 'API Key Status: Configured (from browser storage) and ready.';
    } else if (apiKeySource === 'env') {
      statusMessage = 'API Key Status: Configured (from environment variables) and ready.';
    }
  } else {
    statusMessage = 'API Key Status: Not Detected.';
  }

  return (
    <div className={`${baseBgColor} border ${baseBorderColor} ${baseTextColor} px-4 py-3 rounded-md text-sm`} role={apiKeyIsSet ? "status" : "alert"}>
      <strong className="font-semibold block mb-2">{statusMessage}</strong>
      <div className="space-y-1 text-xs">
          {!apiKeyIsSet && (
            <p className={`${subTextColor}`}>
              Please enter your Gemini API key above to enable application features.
            </p>
          )}
          {apiKeyIsSet && apiKeySource === 'env' && (
            <p className={`${subTextColor}`}>
              You can override this by setting a key in the UI.
            </p>
          )}
          <p className={`${securityNoteColor} mt-2`}>
            <strong className="font-medium">Security Note:</strong> Storing API keys in browser local storage is convenient for client-side tools but can be a security risk. For production applications, API keys should be managed on a secure backend server.
          </p>
      </div>
    </div>
  );
};
