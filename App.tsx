
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  initializeGeminiClient, 
  clearGeminiClient,
  generateWebAppWithGeminiStream,
  editCodeWithGeminiStream
} from './services/geminiService.ts';

// Import Components
import { Header } from './components/Header.tsx';
import { Toast } from './components/Toast.tsx';
import { LoadingScreen } from './components/LoadingScreen.tsx';
import { BuilderEmptyState } from './components/BuilderEmptyState.tsx';
import { CodeEditor } from './components/CodeEditor.tsx';
import { LivePreview } from './components/LivePreview.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';

// Import shared types
import { Theme, CopilotMessage } from './types.ts';


const App: React.FC = () => {
  // --- Global State ---
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeApiKey, setActiveApiKey] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) return storedTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Builder State ---
  const [prompt, setPrompt] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [copilotInput, setCopilotInput] = useState<string>('');

  // --- Resizable Panel State ---
  const [dividerPosition, setDividerPosition] = useState<number>(() => {
      const savedPosition = localStorage.getItem('builderDividerPosition');
      return savedPosition ? parseInt(savedPosition, 10) : window.innerWidth / 2;
  });
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);


  // --- Derived State ---
  const isApiKeyConfigured = !!activeApiKey;

  // --- Effects ---

  // App Initialization Effect
  useEffect(() => {
    setTimeout(() => { setIsInitializing(false); }, 500);
  }, []);

  // Theme Management Effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // API Key Initialization Effect
  const initializeActiveApiKey = useCallback(() => {
    const storedKey = localStorage.getItem('geminiApiKey');
    const envApiKey = process.env.API_KEY;

    if (storedKey) {
      setActiveApiKey(storedKey);
      initializeGeminiClient(storedKey);
    } else if (envApiKey && envApiKey.trim() !== '') {
      setActiveApiKey(envApiKey);
      initializeGeminiClient(envApiKey);
    } else {
      clearGeminiClient();
      setActiveApiKey(null);
      setError("Gemini API key not found. Please set it as an environment variable (VITE_GEMINI_API_KEY) or in localStorage ('geminiApiKey') to use this application.");
    }
  }, []); 

  useEffect(() => {
    initializeActiveApiKey();
  }, [initializeActiveApiKey]);
  
  // --- Handlers ---
  const showToast = (message: string) => {
    setToastMessage(message);
  };
  
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  // --- Builder Handlers ---
  const handleGenerate = useCallback(async (promptToBuild: string) => {
      if (!promptToBuild.trim()) {
          setError("Please enter a prompt to describe the application you want to build.");
          return;
      }
      if (!isApiKeyConfigured) {
          setError("API Key is not configured. Cannot generate code.");
          return;
      }

      setIsLoading(true);
      setLoadingMessage('Building initial component...');
      setError(null);
      setGeneratedCode('');

      try {
          const stream = await generateWebAppWithGeminiStream(promptToBuild);
          let fullCode = '';
          for await (const chunk of stream) {
              const chunkText = chunk.text;
              if (chunkText) {
                  fullCode += chunkText;
                  setGeneratedCode(fullCode);
              }
          }
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
          setError(`Error during generation: ${errorMessage}`);
          console.error("Generation error:", err);
      } finally {
          setIsLoading(false);
      }
  }, [isApiKeyConfigured]);

  const handleCopilotSubmit = useCallback(async () => {
      if (!copilotInput.trim() || !generatedCode) return;
      
      const currentInput = copilotInput;
      setCopilotInput('');
      
      setIsLoading(true);
      setLoadingMessage('Copilot is editing the code...');
      setError(null);

      try {
          const stream = await editCodeWithGeminiStream(generatedCode, currentInput);
          let fullCode = '';
          let firstChunk = true;
          for await (const chunk of stream) {
              const chunkText = chunk.text;
              if (chunkText) {
                  if (firstChunk) {
                      fullCode += chunkText.trimStart();
                      firstChunk = false;
                  } else {
                      fullCode += chunkText;
                  }
                  setGeneratedCode(fullCode);
              }
          }
          showToast(`Applied edit: "${currentInput}"`);
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during edit.";
          setError(errorMessage);
      } finally {
          setIsLoading(false);
      }
  }, [copilotInput, generatedCode]);

  const handleDownload = useCallback(() => {
      if (!generatedCode) return;
      const blob = new Blob([generatedCode], { type: 'text/jsx;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'PreviewComponent.tsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  }, [generatedCode]);

  const handleCopy = useCallback(() => {
      if (!generatedCode) return;
      navigator.clipboard.writeText(generatedCode)
          .then(() => showToast("Code copied to clipboard!"))
          .catch(err => {
              console.error('Failed to copy code: ', err);
              setError("Failed to copy code to clipboard.");
      });
  }, [generatedCode, showToast]);

  const handleNew = useCallback(() => {
    setGeneratedCode('');
    setPrompt('');
    setCopilotInput('');
    setError(null);
  }, []);

  // --- Resizable Panel Logic ---
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      isDragging.current = true;
      e.preventDefault();
  };

  const onMouseUp = useCallback(() => {
      isDragging.current = false;
      localStorage.setItem('builderDividerPosition', dividerPosition.toString());
  }, [dividerPosition]);

  const onMouseMove = useCallback((e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const minWidth = 250; // Minimum width for each panel
      const maxWidth = containerRect.width - minWidth;

      if (newWidth > minWidth && newWidth < maxWidth) {
          setDividerPosition(newWidth);
      }
  }, []);

  useEffect(() => {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);

      return () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
      };
  }, [onMouseMove, onMouseUp]);

  // --- Render Logic ---
  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
        <Header 
          isCodeGenerated={!!generatedCode}
          onNew={handleNew}
          onCopy={handleCopy}
          onDownload={handleDownload}
          copilotInput={copilotInput}
          onCopilotInputChange={setCopilotInput}
          onCopilotSubmit={handleCopilotSubmit}
          isLoading={isLoading}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        
        <main className="flex-1 flex flex-col min-h-0 relative">
           {error && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl p-4 z-20">
                    <div className="p-3 bg-red-100 dark:bg-red-900/80 backdrop-blur-sm border border-red-400 text-red-700 dark:text-red-200 rounded-md text-sm shadow-lg" role="alert">
                        <strong className="font-semibold">Error:</strong> {error}
                    </div>
                </div>
            )}
            
            {!generatedCode ? (
              <BuilderEmptyState 
                onTemplateClick={(p) => { setPrompt(p); handleGenerate(p); }}
                prompt={prompt}
                setPrompt={setPrompt}
                handleGenerate={handleGenerate}
                isLoading={isLoading}
                isApiKeyConfigured={isApiKeyConfigured}
              />
            ) : (
              <div ref={containerRef} className="flex flex-row flex-grow min-h-0 p-2 sm:p-4 gap-4">
                  {/* Left Pane: Code Editor */}
                  <div style={{ width: `${dividerPosition}px` }} className="flex flex-col min-h-0">
                      <div className="flex-grow h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                         <CodeEditor code={generatedCode} onCodeChange={setGeneratedCode} theme={theme} />
                      </div>
                  </div>
                   {/* Divider */}
                  <div
                    onMouseDown={onMouseDown}
                    className="w-2 cursor-col-resize flex items-center justify-center group flex-shrink-0"
                  >
                    <div className="w-0.5 h-1/2 bg-gray-300 dark:bg-gray-700 group-hover:bg-blue-500 rounded-full transition-colors duration-200"></div>
                  </div>
                   {/* Right Pane: Preview */}
                   <div className="flex flex-col space-y-2 flex-grow min-h-0">
                      <div className="flex-grow h-full relative">
                           {isLoading && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg">
                                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-white/80 dark:bg-black/80 p-3 rounded-lg shadow-md">
                                      <LoadingSpinner />
                                      <span className="ml-2">{loadingMessage}</span>
                                  </div>
                              </div>
                          )}
                          <LivePreview code={generatedCode} />
                      </div>
                  </div>
              </div>
            )}
        </main>
        
        <footer className="text-center py-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} John Wesley Quintero. All Rights Reserved. Powered by Google Gemini.
            </p>
        </footer>

        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};

export default App;
