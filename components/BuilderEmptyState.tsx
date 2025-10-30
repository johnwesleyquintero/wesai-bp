import React from 'react';

interface BuilderEmptyStateProps {
  onTemplateClick: (prompt: string) => void;
  templates: { name: string; prompt: string }[];
}

export const BuilderEmptyState: React.FC<BuilderEmptyStateProps> = ({ onTemplateClick, templates }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8">
      <div className="text-center text-gray-600 dark:text-gray-400 max-w-lg">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Welcome to the WesAI Builder</h2>
        <p className="mt-2 mb-6">Describe the component you want to build in the prompt above, or get started with one of our templates.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          {templates.map((template) => (
            <button
              key={template.name}
              onClick={() => onTemplateClick(template.prompt)}
              className="px-4 py-2 text-sm bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow-md border border-gray-200 dark:border-gray-600 transition-all transform hover:scale-105"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};