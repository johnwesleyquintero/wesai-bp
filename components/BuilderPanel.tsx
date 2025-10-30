
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateWebAppWithGeminiStream, editCodeWithGeminiStream } from '../services/geminiService.ts';
import { CodeEditor } from './CodeEditor.tsx';
import { LivePreview } from './LivePreview.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { Theme, CopilotMessage } from '../types.ts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BuilderEmptyState } from './BuilderEmptyState.tsx';


interface BuilderPanelProps {
    isApiKeyConfigured: boolean;
    theme: Theme;
    showToast: (message: string) => void;
}

const TEMPLATES = [
  { name: "Product Card", prompt: "A responsive product card for an e-commerce site. It should show an image, product title, price, star rating, and an 'Add to Cart' button." },
  { name: "Contact Form", prompt: "A contact form with fields for name, email, and message, and a submit button. Include basic validation feedback for required fields." },
  { name: "Landing Page Hero", prompt: "A hero section for a SaaS landing page. Include a catchy headline, a short paragraph, a primary call-to-action button, and a secondary button." },
  { name: "Pricing Table", prompt: "A three-tier pricing table with columns for Basic, Pro, and Enterprise plans. Each column should list features and have a 'Sign Up' button." }
];


export const BuilderPanel: React.FC<BuilderPanelProps> = ({ isApiKeyConfigured, theme, showToast }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [generatedCode, setGeneratedCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>('');

    // Resizable panel state
    const [dividerPosition, setDividerPosition] = useState<number>(() => {
        const savedPosition = localStorage.getItem('builderDividerPosition');
        return savedPosition ? parseInt(savedPosition, 10) : window.innerWidth / 2;
    });
    const isDragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);


    // Copilot State
    const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([]);
    const [copilotInput, setCopilotInput] = useState<string>('');
    const copilotMessagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        copilotMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [copilotMessages]);

    const handleGenerate = useCallback(async (promptToBuild: string) => {
        if (!promptToBuild.trim()) {
            setError("Please enter a prompt to describe the application you want to build.");
            return;
        }
        if (!isApiKeyConfigured) {
            setError("API Key is not configured. Please set your API key to generate code.");
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Building initial component...');
        setError(null);
        setGeneratedCode('');
        setCopilotMessages([]); // Reset copilot chat on new generation

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
        
        const userMessage: CopilotMessage = { id: `user-${Date.now()}`, role: 'user', content: copilotInput };
        setCopilotMessages(prev => [...prev, userMessage]);
        const currentInput = copilotInput;
        setCopilotInput('');
        
        setIsLoading(true);
        setLoadingMessage('Copilot is editing the code...');
        setError(null);
        
        const modelMessageId = `model-${Date.now()}`;
        setCopilotMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '...' }]);

        try {
            const stream = await editCodeWithGeminiStream(generatedCode, currentInput);
            let fullCode = '';
            let firstChunk = true;
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    if (firstChunk) {
                        // The model might start with a newline, trim it for the first chunk.
                        fullCode += chunkText.trimStart();
                        firstChunk = false;
                    } else {
                        fullCode += chunkText;
                    }
                    setGeneratedCode(fullCode);
                }
            }
            setCopilotMessages(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, content: `I have updated the code based on your request: "${currentInput}"` } : msg
            ));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during chat.";
            setError(errorMessage);
            setCopilotMessages(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, content: `**Error:** ${errorMessage}` } : msg
            ));
        } finally {
            setIsLoading(false);
        }
    }, [copilotInput, generatedCode]);
    
    const handleTemplateClick = (templatePrompt: string) => {
        setPrompt(templatePrompt);
        handleGenerate(templatePrompt);
    };

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
        const minWidth = 300; // Minimum width for each panel
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


    return (
        <div className="flex flex-col flex-grow space-y-4 h-full">
            <div className="space-y-4">
                <div className="relative">
                    <textarea
                        id="promptInput"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        rows={2}
                        className="w-full p-3 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base"
                        placeholder="Describe the application you want to build..."
                    />
                    {prompt && !isLoading && (
                        <button onClick={() => setPrompt('')} title="Clear prompt" aria-label="Clear prompt" className="absolute top-1/2 right-3 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
                 <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 self-center">Templates:</span>
                        {TEMPLATES.map((template) => (
                            <button
                                key={template.name}
                                onClick={() => handleTemplateClick(template.prompt)}
                                disabled={isLoading}
                                className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-md disabled:opacity-50 transition-colors"
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>
                     <button
                        onClick={() => handleGenerate(prompt)}
                        disabled={isLoading || !isApiKeyConfigured || !prompt.trim()}
                        className="w-full sm:w-auto flex-grow sm:flex-grow-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading && loadingMessage.startsWith('Building') ? <LoadingSpinner /> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>}
                        {isLoading && loadingMessage.startsWith('Building') ? 'Building...' : 'Build It'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-100 dark:bg-red-700/30 border border-red-400 text-red-700 dark:text-red-200 rounded-md text-sm" role="alert">
                    <strong className="font-semibold">Error:</strong> {error}
                </div>
            )}
            
            {generatedCode ? (
              <div ref={containerRef} className="flex flex-row flex-grow min-h-0">
                  {/* Left Pane: Code + Copilot */}
                  <div style={{ width: `${dividerPosition}px` }} className="flex flex-col space-y-4 min-h-0 pr-2">
                      <div className="flex flex-col flex-1 min-h-0">
                          <div className="flex justify-between items-center mb-2">
                              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Code</h2>
                              <div>
                                  <button onClick={handleCopy} disabled={!generatedCode || isLoading} className="text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-1 px-3 rounded-md disabled:opacity-50">Copy</button>
                                  <button onClick={handleDownload} disabled={!generatedCode || isLoading} className="ml-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-1 px-3 rounded-md disabled:opacity-50">Download .tsx</button>
                              </div>
                          </div>
                          <div className="flex-grow h-full border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                             <CodeEditor code={generatedCode} onCodeChange={setGeneratedCode} theme={theme} />
                          </div>
                      </div>
                      <div className="flex flex-col flex-1 min-h-0 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800">
                           <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 p-3 border-b border-gray-200 dark:border-gray-700">WesAI Copilot</h2>
                           <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                              {copilotMessages.map((msg) => (
                                 <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-lg p-3 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100'}`}>
                                       <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || ''}</ReactMarkdown></div>
                                   </div>
                                 </div>
                              ))}
                               <div ref={copilotMessagesEndRef} />
                           </div>
                           <form onSubmit={(e) => { e.preventDefault(); handleCopilotSubmit(); }} className="p-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2">
                                  <input type="text" value={copilotInput} onChange={(e) => setCopilotInput(e.target.value)} placeholder={generatedCode ? "e.g., 'Change the button color to red'" : "Generate a component first to enable the copilot"} disabled={isLoading || !generatedCode} className="w-full p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                  <button type="submit" disabled={isLoading || !copilotInput.trim()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md disabled:opacity-60 flex items-center">
                                      {isLoading && loadingMessage.startsWith('Copilot') ? <LoadingSpinner /> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>}
                                  </button>
                              </div>
                           </form>
                      </div>
                  </div>
                   {/* Divider */}
                  <div
                    onMouseDown={onMouseDown}
                    className="w-2 cursor-col-resize flex items-center justify-center group"
                  >
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-500 transition-colors duration-200"></div>
                  </div>
                   {/* Right Pane: Preview */}
                   <div className="flex flex-col space-y-2 flex-grow min-h-0 pl-2">
                      <div className="flex justify-between items-center">
                          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Live Preview</h2>
                          {isLoading && (
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                  <LoadingSpinner />
                                  <span className="ml-2">{loadingMessage}</span>
                              </div>
                          )}
                      </div>
                      <div className="flex-grow h-full border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                          <LivePreview code={generatedCode} />
                      </div>
                  </div>
              </div>
            ) : (
                // FIX: Pass all required props to BuilderEmptyState and remove the invalid 'templates' prop.
                <BuilderEmptyState 
                    onTemplateClick={handleTemplateClick}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    handleGenerate={handleGenerate}
                    isLoading={isLoading}
                    isApiKeyConfigured={isApiKeyConfigured}
                />
            )}
        </div>
    );
};
