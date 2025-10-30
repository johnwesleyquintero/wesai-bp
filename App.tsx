
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { 
  initializeGeminiClient, 
  clearGeminiClient,
  performCodeToolActionStream,
  sendChatMessageStream,
  initializeChat,
  generateImageWithImagen,
} from './services/geminiService.ts';

// Import NEW/MODIFIED Components
import { Sidebar } from './components/Sidebar.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { Toast } from './components/Toast.tsx';

// Import Panel Components
import { BuilderPanel } from './components/BuilderPanel.tsx';
import { DocumentationViewerPanel } from './components/DocumentationViewerPanel.tsx';
import { ChatInterfacePanel } from './components/ChatInterfacePanel.tsx';
import { CodeInteractionPanel } from './components/CodeInteractionPanel.tsx';
import { ImageGenerationPanel } from './components/ImageGenerationPanel.tsx';

// Import shared types
import { ApiKeySource, Theme, ActiveTab, ChatMessage, CodeTool } from './types.ts';
import { Chat } from '@google/genai';


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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Tab Navigation State ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('builder');

  // --- Panel-specific State ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat Panel State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Code Tools Panel State
  const [activeCodeTool, setActiveCodeTool] = useState<CodeTool>('review');
  const [codeToolInput, setCodeToolInput] = useState('');
  const [codeToolFeedback, setCodeToolFeedback] = useState('');

  // Image Panel State
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(null);

  // Fix: Hoist `isApiKeyConfigured` to be available for useEffect hooks.
  const isApiKeyConfigured = !!activeApiKey;


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

  // Initialize chat session when chat tab is active and API key is set
  useEffect(() => {
    if (activeTab === 'chat' && isApiKeyConfigured && !chatSession) {
      try {
        const newChat = initializeChat();
        setChatSession(newChat);
      } catch (e) {
        setError("Could not initialize chat session. Check your API key.");
        console.error(e);
      }
    }
  }, [activeTab, isApiKeyConfigured, chatSession]);
  
  // --- Handlers ---
  const showToast = (message: string) => {
    setToastMessage(message);
  };
  
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
    setError(null); // Clear errors when switching tabs
    setActiveTab(tab);
  };

  // --- Panel Logic Handlers ---

  // Chat Panel Handlers
  const handleChatSubmit = useCallback(async () => {
    if (!chatInput.trim() || !chatSession) return;
    
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsLoading(true);
    setError(null);
    
    const modelMessageId = `model-${Date.now()}`;
    setChatMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '' }]);

    try {
        const stream = await sendChatMessageStream(chatSession, currentInput);
        let fullResponse = '';
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullResponse += chunkText;
                setChatMessages(prev => prev.map(msg => 
                    msg.id === modelMessageId ? { ...msg, content: fullResponse } : msg
                ));
            }
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        setChatMessages(prev => prev.filter(msg => msg.id !== modelMessageId));
    } finally {
        setIsLoading(false);
    }
  }, [chatInput, chatSession]);

  const handleCopyChatMessage = useCallback((content: string, messageId: string) => {
    navigator.clipboard.writeText(content).then(() => {
        setCopiedMessageId(messageId);
        showToast("Copied to clipboard!");
        setTimeout(() => setCopiedMessageId(null), 2000);
    }).catch(err => console.error('Failed to copy chat message: ', err));
  }, []);

  // Code Tools Handlers
  const handleCodeToolSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCodeToolFeedback('');
    try {
      const stream = await performCodeToolActionStream(codeToolInput, activeCodeTool);
      let fullFeedback = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if(chunkText) {
          fullFeedback += chunkText;
          setCodeToolFeedback(fullFeedback);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [codeToolInput, activeCodeTool]);

  // Image Generation Handlers
  const handleImageSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImageData(null);
    try {
      const response = await generateImageWithImagen(imagePrompt);
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      setGeneratedImageData(base64ImageBytes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [imagePrompt]);

  const renderActivePanel = () => {
    switch (activeTab) {
        case 'builder':
            return <BuilderPanel isApiKeyConfigured={isApiKeyConfigured} theme={theme} showToast={showToast} />;
        case 'chat':
            return <ChatInterfacePanel 
                      chatMessages={chatMessages}
                      chatInput={chatInput}
                      onChatInputChange={setChatInput}
                      onClearChatInput={() => setChatInput('')}
                      onChatSubmit={handleChatSubmit}
                      isLoading={isLoading}
                      isApiKeyConfigured={isApiKeyConfigured}
                      isChatSessionActive={!!chatSession}
                      onCopyChatMessage={handleCopyChatMessage}
                      onTogglePreview={(messageId) => { /* Logic for preview toggle */ }}
                      copiedMessageId={copiedMessageId}
                      error={error}
                    />;
        case 'codeTools':
            return <CodeInteractionPanel 
                      activeTool={activeCodeTool}
                      onToolChange={setActiveCodeTool}
                      code={codeToolInput}
                      onCodeChange={(e) => setCodeToolInput(e.target.value)}
                      onClearInput={() => setCodeToolInput('')}
                      onSubmit={handleCodeToolSubmit}
                      isLoading={isLoading}
                      isApiKeyConfigured={isApiKeyConfigured}
                      feedback={codeToolFeedback}
                      onClearFeedback={() => setCodeToolFeedback('')}
                      error={error}
                      setError={setError}
                    />;
        case 'image':
            return <ImageGenerationPanel
                      prompt={imagePrompt}
                      onPromptChange={(e) => setImagePrompt(e.target.value)}
                      onClearPrompt={() => setImagePrompt('')}
                      onSubmit={handleImageSubmit}
                      onClearImage={() => setGeneratedImageData(null)}
                      isLoading={isLoading}
                      isApiKeyConfigured={isApiKeyConfigured}
                      imageData={generatedImageData}
                      error={error}
                      setError={setError}
                    />;
        case 'documentation':
            return <DocumentationViewerPanel />;
        default:
            return <BuilderPanel isApiKeyConfigured={isApiKeyConfigured} theme={theme} showToast={showToast}/>;
    }
  }


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
                    {renderActivePanel()}
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

        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default App;
