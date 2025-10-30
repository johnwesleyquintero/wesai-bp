import React, { useState, useCallback, useEffect } from 'react';
import { Chat } from "@google/genai";
import { Header } from './components/Header.tsx';
import { 
  initializeGeminiClient, 
  clearGeminiClient,
  reviewCodeWithGemini,
  refactorCodeWithGeminiStream,
  getReactComponentPreview,
  generateCodeWithGemini,
  generateContentWithGemini,
  generateImageWithImagen,
  startChatSession,
  sendMessageToChatStream,
} from './services/geminiService.ts';

// Import NEW/MODIFIED Components
import { Sidebar } from './components/Sidebar.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';

// Import Panel Components
import { BuilderPanel } from './components/BuilderPanel.tsx';
import { CodeInteractionPanel } from './components/CodeInteractionPanel.tsx';
import { ImageGenerationPanel } from './components/ImageGenerationPanel.tsx';
import { ChatInterfacePanel } from './components/ChatInterfacePanel.tsx';
import { DocumentationViewerPanel } from './components/DocumentationViewerPanel.tsx';

// Import shared types
import { ApiKeySource, Theme, ActiveTab, ChatMessage, CodeTool } from './types.ts';

const App: React.FC = () => {
  // --- Global State ---
  const [activeApiKey, setActiveApiKey] = useState<string | null>(null);
  const [apiKeySource, setApiKeySource] = useState<ApiKeySource>('none');
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) return storedTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


  // --- Tab Navigation State ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('builder');

  // --- Tool-Specific State ---
  const [activeCodeTool, setActiveCodeTool] = useState<CodeTool>('review');
  const [interactionCode, setInteractionCode] = useState('');
  const [interactionFeedback, setInteractionFeedback] = useState('');

  const [imagePrompt, setImagePrompt] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);

  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSessionActive, setIsChatSessionActive] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);


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
  
  useEffect(() => {
    const initChat = async () => {
      if (activeApiKey && activeTab === 'chat') {
        setError(null);
        setIsLoading(true);
        try {
          const systemInstruction = `You are WesAI, an expert AI assistant for software development.
          - When asked to create a component, provide the complete, self-contained React/TypeScript code in a single TSX block.
          - The component should be named 'PreviewComponent' and exported as default.
          - Do not add any explanations outside the code block.`;
          const session = await startChatSession(systemInstruction);
          setChatSession(session);
          setIsChatSessionActive(true);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
          setError(`Failed to start chat session: ${errorMessage}`);
          setIsChatSessionActive(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsChatSessionActive(false);
        setChatSession(null);
      }
    };
    initChat();
  }, [activeApiKey, activeTab]);


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
      setError(null);
      setIsSettingsModalOpen(false); // Close modal on save
    }
  }, []);

  const handleRemoveApiKey = useCallback(() => {
    localStorage.removeItem('geminiApiKey');
    setInteractionCode('');
    setInteractionFeedback('');
    setImagePrompt('');
    setImageData(null);
    setChatMessages([]);
    setChatInput('');
    setError(null);
    initializeActiveApiKey(); 
  }, [initializeActiveApiKey]);
  
  const handleTabChange = (tab: ActiveTab) => {
    setError(null);
    setInteractionFeedback('');
    setActiveTab(tab);
  };

  const isApiKeyConfigured = !!activeApiKey;

  // --- Code Interaction Panel Handler ---
  const handleCodeInteractionSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setInteractionFeedback('');
    try {
      let result = '';
      if (activeCodeTool === 'review') {
        result = await reviewCodeWithGemini(interactionCode);
      } else if (activeCodeTool === 'refactor') {
          const stream = refactorCodeWithGeminiStream(interactionCode);
          let fullResponse = '';
          for await (const chunk of stream) {
              if (chunk.type === 'chunk' && chunk.data) {
                  fullResponse += chunk.data;
                  setInteractionFeedback(fullResponse); 
              } else if (chunk.type === 'error' && chunk.message) {
                  throw new Error(chunk.message);
              }
          }
          result = fullResponse; // Final assignment
      } else if (activeCodeTool === 'preview') {
        result = await getReactComponentPreview(interactionCode);
      } else if (activeCodeTool === 'generate') {
        result = await generateCodeWithGemini(interactionCode);
      } else if (activeCodeTool === 'content') {
        result = await generateContentWithGemini(interactionCode);
      }
      setInteractionFeedback(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Error during ${activeCodeTool} operation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeCodeTool, interactionCode]);

  // --- Image Generation Panel Handler ---
  const handleImageGenerationSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setImageData(null);
    try {
      const base64Image = await generateImageWithImagen(imagePrompt);
      setImageData(base64Image);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Error during image generation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [imagePrompt]);

  // --- Chat Panel Handler ---
  const handleChatSubmit = useCallback(async () => {
    if (!chatInput.trim() || !chatSession || isLoading) return;

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);
    setError(null);

    try {
      const stream = await sendMessageToChatStream(chatSession, userMessage.content);
      let fullResponse = '';
      const modelMessageId = `model-${Date.now()}`;
      
      // Add a placeholder for the model's response
      setChatMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '...' }]);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullResponse += chunkText;
          setChatMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, content: fullResponse } : msg
          ));
        }
      }
      
      // Final update to process for potential code block
       setChatMessages(prev => prev.map(msg => {
            if (msg.id === modelMessageId) {
                const codeRegex = /```(?:tsx|typescript|jsx|javascript)\s*\n([\s\S]+?)\n```/;
                const codeMatch = fullResponse.match(codeRegex);
                const componentCode = codeMatch ? codeMatch[1].trim() : null;
                return { ...msg, content: fullResponse, componentCode, showPreview: false };
            }
            return msg;
        }));


    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during chat.";
      setError(errorMessage);
       setChatMessages(prev => [...prev, { id: `error-${Date.now()}`, role: 'model', content: `**Error:** ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [chatInput, chatSession, isLoading]);
  
  const handleTogglePreview = (messageId: string) => {
    setChatMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, showPreview: !msg.showPreview } : msg
    ));
  };

  const handleCopyChatMessage = (content: string, messageId: string) => {
      navigator.clipboard.writeText(content).then(() => {
          setCopiedMessageId(messageId);
          setTimeout(() => setCopiedMessageId(null), 2000);
      }).catch(err => {
          setError("Failed to copy message to clipboard.");
          console.error('Failed to copy message:', err);
      });
  };

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
                    {activeTab === 'codeTools' && (
                        <CodeInteractionPanel
                            activeTool={activeCodeTool}
                            onToolChange={setActiveCodeTool}
                            code={interactionCode}
                            onCodeChange={(e) => setInteractionCode(e.target.value)}
                            onClearInput={() => setInteractionCode('')}
                            onSubmit={handleCodeInteractionSubmit}
                            isLoading={isLoading}
                            isApiKeyConfigured={isApiKeyConfigured}
                            feedback={interactionFeedback}
                            onClearFeedback={() => setInteractionFeedback('')}
                            error={error}
                            setError={setError}
                        />
                    )}
                    {activeTab === 'image' && (
                        <ImageGenerationPanel
                            prompt={imagePrompt}
                            onPromptChange={(e) => setImagePrompt(e.target.value)}
                            onClearPrompt={() => setImagePrompt('')}
                            onSubmit={handleImageGenerationSubmit}
                            onClearImage={() => { setImageData(null); setImagePrompt(''); setError(null); }}
                            isLoading={isLoading}
                            isApiKeyConfigured={isApiKeyConfigured}
                            imageData={imageData}
                            error={error}
                            setError={setError}
                        />
                    )}
                    {activeTab === 'chat' && (
                        <ChatInterfacePanel
                            chatMessages={chatMessages}
                            chatInput={chatInput}
                            onChatInputChange={setChatInput}
                            onClearChatInput={() => setChatInput('')}
                            onChatSubmit={handleChatSubmit}
                            isLoading={isLoading}
                            isApiKeyConfigured={isApiKeyConfigured}
                            isChatSessionActive={isChatSessionActive}
                            onCopyChatMessage={handleCopyChatMessage}
                            onTogglePreview={handleTogglePreview}
                            copiedMessageId={copiedMessageId}
                            error={error}
                        />
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