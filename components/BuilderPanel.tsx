import React, { useState, useCallback } from 'react';
import { generateWebAppWithGeminiStream } from '../services/geminiService.ts';
import { CodeEditor } from './CodeEditor.tsx';
import { LivePreview } from './LivePreview.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { Theme } from '../types.ts';

interface BuilderPanelProps {
    isApiKeyConfigured: boolean;
    theme: Theme;
}

const TEMPLATES = [
  { name: "Product Card", prompt: "A responsive product card for an e-commerce site. It should show an image, product title, price, star rating, and an 'Add to Cart' button." },
  { name: "Contact Form", prompt: "A contact form with fields for name, email, and message, and a submit button. Include basic validation feedback for required fields." },
  { name: "Landing Page Hero", prompt: "A hero section for a SaaS landing page. Include a catchy headline, a short paragraph, a primary call-to-action button, and a secondary button." },
  { name: "Pricing Table", prompt: "A three-tier pricing table with columns for Basic, Pro, and Enterprise plans. Each column should list features and have a 'Sign Up' button." }
];


export const BuilderPanel: React.FC<BuilderPanelProps> = ({ isApiKeyConfigured, theme }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [generatedCode, setGeneratedCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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
        navigator.clipboard.writeText(generatedCode).then(() => {
            // Optional: show a temporary "Copied!" message
        }).catch(err => {
            console.error('Failed to copy code: ', err);
            setError("Failed to copy code to clipboard.");
        });
    }, [generatedCode]);

    return (
        <div className="flex flex-col flex-grow space-y-6 h-full">
            <div className="space-y-4">
                <div>
                    <label htmlFor="promptInput" className="block text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                        Describe the application you want to build:
                    </label>
                    <textarea
                        id="promptInput"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        rows={3}
                        className="w-full p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-base transition-colors duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
                        placeholder="e.g., 'A responsive product landing page for a smart watch with a hero section, features grid, and a contact form.'"
                    />
                </div>
                 <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Or start with a template:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {TEMPLATES.map((template) => (
                            <button
                                key={template.name}
                                onClick={() => handleTemplateClick(template.prompt)}
                                disabled={isLoading}
                                className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={() => handleGenerate(prompt)}
                disabled={isLoading || !isApiKeyConfigured || !prompt.trim()}
                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed text-lg"
            >
                {isLoading && <LoadingSpinner />}
                {isLoading ? 'Building...' : 'Build It'}
            </button>

            {error && (
                <div className="p-4 bg-red-100 dark:bg-red-700/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md shadow" role="alert">
                    <strong className="font-semibold">Error:</strong> {error}
                </div>
            )}
            
            <div className="flex flex-col lg:flex-row flex-grow gap-6 min-h-0">
                <div className="flex flex-col space-y-2 flex-1 min-h-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Code</h2>
                        <div>
                             <button onClick={handleCopy} disabled={!generatedCode} className="text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-1 px-3 rounded-md disabled:opacity-50 transition-colors">Copy</button>
                             <button onClick={handleDownload} disabled={!generatedCode} className="ml-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-1 px-3 rounded-md disabled:opacity-50 transition-colors">Download .tsx</button>
                        </div>
                    </div>
                    <div className="flex-grow h-full border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                        {!generatedCode && !isLoading ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                                <div className="text-center text-gray-500 dark:text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                                    </svg>
                                    <p className="font-semibold">Code Editor</p>
                                    <p className="text-sm">Generated code will appear here.</p>
                                </div>
                            </div>
                        ) : (
                           <CodeEditor code={generatedCode} onCodeChange={setGeneratedCode} theme={theme} />
                        )}
                    </div>
                </div>
                 <div className="flex flex-col space-y-2 flex-1 min-h-0">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Live Preview</h2>
                    <div className="flex-grow h-full border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                        <LivePreview code={generatedCode} />
                    </div>
                </div>
            </div>
        </div>
    );
};