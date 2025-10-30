
import React from 'react';
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
  return (
    <div className="my-6">
      <ApiKeyManager
        onSaveKey={onSaveKey}
        onRemoveKey={onRemoveKey}
        isKeySet={isKeySet}
        currentKeySource={currentKeySource}
      />
      <div className="mt-2">
        <ApiKeyStatus apiKeyIsSet={isKeySet} apiKeySource={currentKeySource} />
      </div>
    </div>
  );
};
