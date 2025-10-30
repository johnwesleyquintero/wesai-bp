import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { 
  initializeGeminiClient, 
  clearGeminiClient,
} from './services/geminiService.ts';

// Import NEW/MODIFIED Components
import { Sidebar } from './components/Sidebar.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';

// Import Panel Components
import { BuilderPanel } from './components/BuilderPanel.tsx';
import { DocumentationViewerPanel } from './components/DocumentationViewerPanel.tsx';

// Import shared types
import { ApiKeySource, Theme, ActiveTab } from './types.ts';

const App: React.FC = () => {
  // --- Global State ---
  const [activeApiKey, setActiveApiKey] = useState<string | null>(null);
  const [apiKeySource, setApiKeySource] = useState<ApiKeySource>('none');
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) return storedTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


  // --- Tab Navigation State ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('builder');

  // --- Effects ---
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const initializeActiveApiKey = useCallback(() => {
    const storedKey = localStorage.getItem('geminiApiKey');
    const envApiKey = process.env.API_KEY;

    if (storedKey) {
      setActiveApiKey(storedKey);
      initializeGeminiClient(storedKey);
      setApiKeySource('ui');
    } else if (envApiKey && envApiKey.trim() !== '') {
      setActiveApiKey(envApiKey);
      initializeGeminiClient(envApiKey);
      setApiKeySource('env');
    } else {
      clearGeminiClient();
      setActiveApiKey(null);
      setApiKeySource('none');
      setIsSettingsModalOpen(true); // Open settings if no key is found
    }
  }, []); 

  useEffect(() => {
    initializeActiveApiKey();
  }, [initializeActiveApiKey]);
  
  // --- Handlers ---
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  const handleSaveApiKey = useCallback((key: string) => {
    if (key.trim()) {
      localStorage.setItem('geminiApiKey', key);
      setActiveApiKey(key);
      initializeGeminiClient(key);
      setApiKeySource('ui');
      setIsSettingsModalOpen(false); // Close modal on save
    }
  }, []);

  const handleRemoveApiKey = useCallback(() => {
    localStorage.removeItem('geminiApiKey');
    initializeActiveApiKey(); 
  }, [initializeActiveApiKey]);
  
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const isApiKeyConfigured = !!activeApiKey;

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <Header title="WesAI Builder Platform" />
        
        <div className="flex flex-1 min-h-0">
            <Sidebar 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                theme={theme}
                toggleTheme={toggleTheme}
                isCollapsed={isSidebarCollapsed}
                onToggle={toggleSidebar}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                    {activeTab === 'builder' && (
                        <BuilderPanel isApiKeyConfigured={isApiKeyConfigured} theme={theme}/>
                    )}
                    {activeTab === 'documentation' && <DocumentationViewerPanel />}
                </main>
                <footer className="text-center py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        WesAI Builder Platform - Powered by Google Gemini.
                    </p>
                </footer>
            </div>
        </div>

        <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            onSaveKey={handleSaveApiKey}
            onRemoveKey={handleRemoveApiKey}
            isKeySet={isApiKeyConfigured}
            currentKeySource={apiKeySource}
        />
    </div>
  );
};

export default App;
