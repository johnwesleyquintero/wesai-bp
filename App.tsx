import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
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

// Import Components
import { ApiKeySection } from './components/ApiKeySection.tsx';
import { TabNavigation } from './components/TabNavigation.tsx';
import { BuilderPanel } from './components/BuilderPanel.tsx';
import { CodeInteractionPanel } from './components/CodeInteractionPanel.tsx';
import { ImageGenerationPanel } from './components/ImageGenerationPanel.tsx';
import { ChatInterfacePanel } from './components/ChatInterfacePanel.tsx';
import { DocumentationViewerPanel } from './components/DocumentationViewerPanel.tsx';

// Import shared types
import { ApiKeySource, Theme, ActiveTab, ChatMessage } from './types.ts';


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

  // --- Tab Navigation State ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('builder');

  // --- Tool-Specific State ---
  // Code Interaction Panel State (Review, Refactor, Preview, Generate, Content)
  const [interactionCode, setInteractionCode] = useState('');
  const [interactionFeedback, setInteractionFeedback] = useState('');

  // Image Generation Panel State
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);

  // Chat Panel State
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
    }
  }, []); 

  useEffect(() => {
    initializeActiveApiKey();
  }, [initializeActiveApiKey]);
  
  // Effect to initialize or reset chat session when API key changes
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

  const handleSaveApiKey = useCallback((key: string) => {
    if (key.trim()) {
      localStorage.setItem('geminiApiKey', key);
      setActiveApiKey(key);
      initializeGeminiClient(key);
      setApiKeySource('ui');
      setError(null); 
    }
  }, []);

  const handleRemoveApiKey = useCallback(() => {
    localStorage.removeItem('geminiApiKey');
    // Clear all tool-specific content
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
    setError(null); // Clear errors when switching tabs
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
      if (activeTab === 'review') {
        result = await reviewCodeWithGemini(interactionCode);
      } else if (activeTab === 'refactor') {
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
      } else if (activeTab === 'preview') {
        result = await getReactComponentPreview(interactionCode);
      } else if (activeTab === 'generate') {
        result = await generateCodeWithGemini(interactionCode);
      } else if (activeTab === 'content') {
        result = await generateContentWithGemini(interactionCode);
      }
      setInteractionFeedback(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Error during ${activeTab} operation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, interactionCode]);

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
    <div className="min-h-screen flex flex-col items-center p-4 pt-0 sm:p-6 bg-gray-100 dark:bg-gray-800">
      <div className="w-full max-w-7xl flex flex-col h-screen">
        <Header title="WesAI Builder Platform" theme={theme} toggleTheme={toggleTheme} />
        
        <ApiKeySection 
            onSaveKey={handleSaveApiKey}
            onRemoveKey={handleRemoveApiKey}
            isKeySet={isApiKeyConfigured}
            currentKeySource={apiKeySource}
        />

        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        <main className="flex-grow flex flex-col overflow-y-auto space-y-6">
          {activeTab === 'builder' && (
            <BuilderPanel isApiKeyConfigured={isApiKeyConfigured} theme={theme}/>
          )}
          {(activeTab === 'review' || activeTab === 'refactor' || activeTab === 'preview' || activeTab === 'generate' || activeTab === 'content') && (
              <CodeInteractionPanel 
                activeTab={activeTab}
                code={interactionCode}
                onCodeChange={(e) => setInteractionCode(e.target.value)}
                onClearInput={() => setInteractionCode('')}
                onSubmit={handleCodeInteractionSubmit}
                isLoading={isLoading}
                isApiKeyConfigured={isApiKeyConfigured}
                feedback={interactionFeedback}
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
        
        <footer className="text-center mt-auto py-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              WesAI Builder Platform - From Prompt to Live App. Powered by Google Gemini.
            </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
