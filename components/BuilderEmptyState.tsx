
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface BuilderEmptyStateProps {
  onTemplateClick: (prompt: string) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  handleGenerate: (prompt: string) => void;
  isLoading: boolean;
  isApiKeyConfigured: boolean;
}

const TEMPLATES = [
  { name: "Product Card", prompt: "A responsive product card for an e-commerce site. It should show an image, product title, price, star rating, and an 'Add to Cart' button." },
  { name: "Contact Form", prompt: "A contact form with fields for name, email, and message, and a submit button. Include basic validation feedback for required fields." },
  { name: "Pricing Table", prompt: "A three-tier pricing table with columns for Basic, Pro, and Enterprise plans. Each column should list features and have a 'Sign Up' button." }
];

export const BuilderEmptyState: React.FC<BuilderEmptyStateProps> = ({ 
    onTemplateClick,
    prompt,
    setPrompt,
    handleGenerate,
    isLoading,
    isApiKeyConfigured
 }) => {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 py-2">
            From Prompt to Component
        </h1>
        <p className="mt-2 mb-8 text-gray-600 dark:text-gray-400">
            Describe the UI you want to build, and WesAI will generate the React code for you.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(prompt); }} className="space-y-4">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="w-full p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base resize-none"
                placeholder="e.g., A simple personal portfolio page with a hero section, an 'About Me' paragraph, and a list of projects."
            />
             <button
                type="submit"
                disabled={isLoading || !isApiKeyConfigured || !prompt.trim()}
                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed text-lg"
            >
                {isLoading ? <LoadingSpinner /> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>}
                {isLoading ? 'Building...' : 'Build It'}
            </button>
        </form>

        <div className="mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Or start with a template:</p>
            <div className="flex flex-wrap gap-3 justify-center mt-3">
            {TEMPLATES.map((template) => (
                <button
                key={template.name}
                onClick={() => onTemplateClick(template.prompt)}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-all disabled:opacity-50"
                >
                {template.name}
                </button>
            ))}
            </div>
        </div>

      </div>
    </div>
  );
};
