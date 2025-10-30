import React, { useState, useEffect } from 'react';
import { CodeInput } from './CodeInput.tsx';
import { FeedbackDisplay } from './FeedbackDisplay.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { CodeTool } from '../types.ts';

interface CodeInteractionPanelProps {
  activeTool: CodeTool;
  onToolChange: (tool: CodeTool) => void;
  code: string;
  onCodeChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClearInput: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  isApiKeyConfigured: boolean;
  feedback: string;
  onClearFeedback: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const TOOLS: { id: CodeTool; label: string; description: string }[] = [
  { id: 'review', label: 'Review', description: 'Get a comprehensive AI-powered review of your code for bugs, performance, and best practices.' },
  { id: 'refactor', label: 'Refactor', description: 'Automatically refactor your code to improve readability, performance, and maintainability.' },
  { id: 'preview', label: 'Preview', description: 'Generate a textual description of what a React component does, its props, and its behavior.' },
  { id: 'generate', label: 'Generate', description: 'Create new code from a natural language description. Describe a function or component.' },
  { id: 'content', label: 'Content', description: 'Generate written content like documentation, blog posts, or marketing copy from a prompt.' },
];

const parseRefactorFeedback = (fullFeedback: string): { summary: string; code: string; rawFeedback?: string } => {
  const summaryMarker = "## Refactoring Summary:";
  const codeMarker = "## Refactored Code:";
  
  let summary = "";
  let code = "";

  const summaryStartIndex = fullFeedback.indexOf(summaryMarker);
  const codeStartIndex = fullFeedback.indexOf(codeMarker);

  if (summaryStartIndex !== -1 && codeStartIndex !== -1 && codeStartIndex > summaryStartIndex) {
    summary = fullFeedback.substring(summaryStartIndex + summaryMarker.length, codeStartIndex).trim();
    
    const codeBlockContentRegex = /```(?:typescript|tsx|javascript|js|jsx)\s*\n([\s\S]+?)\n```/;
    const remainingAfterCodeMarker = fullFeedback.substring(codeStartIndex + codeMarker.length);
    const codeMatch = remainingAfterCodeMarker.match(codeBlockContentRegex);

    if (codeMatch && codeMatch[1]) {
      code = codeMatch[1].trim();
    } else { 
      code = remainingAfterCodeMarker.trim();
    }
  } else if (summaryStartIndex !== -1) { 
     summary = fullFeedback.substring(summaryStartIndex + summaryMarker.length).trim();
     const codeBlockContentRegex = /```(?:typescript|tsx|javascript|js|jsx)\s*\n([\s\S]+?)\n```/;
     const codeMatch = fullFeedback.substring(summaryStartIndex).match(codeBlockContentRegex);
     if (codeMatch && codeMatch[1]) code = codeMatch[1].trim();

  } else if (codeStartIndex !== -1) { 
     const codeBlockContentRegex = /```(?:typescript|tsx|javascript|js|jsx)\s*\n([\s\S]+?)\n```/;
     const remainingAfterCodeMarker = fullFeedback.substring(codeStartIndex + codeMarker.length);
     const codeMatch = remainingAfterCodeMarker.match(codeBlockContentRegex);
     if (codeMatch && codeMatch[1]) {
       code = codeMatch[1].trim();
     } else {
       code = remainingAfterCodeMarker.trim();
     }
  }
  
  if (!summary && !code) {
    return { summary: '', code: '', rawFeedback: fullFeedback };
  }
  
  return { summary, code };
};


export const CodeInteractionPanel: React.FC<CodeInteractionPanelProps> = ({
  activeTool,
  onToolChange,
  code,
  onCodeChange,
  onClearInput,
  onSubmit,
  isLoading,
  isApiKeyConfigured,
  feedback,
  onClearFeedback,
  error,
  setError
}) => {
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // If feedback and error are cleared from parent (e.g., on main tab change), reset the view
    if (!feedback && !error) {
        setShowResults(false);
    }
  }, [feedback, error]);


  const toolInfo = TOOLS.find(t => t.id === activeTool) || TOOLS[0];

  const getActionVerb = (): string => {
    if (activeTool === 'review') return 'review';
    if (activeTool === 'refactor') return 'refactor';
    if (activeTool === 'preview') return 'get a preview for';
    if (activeTool === 'generate') return 'generate code based on';
    if (activeTool === 'content') return 'create';
    return 'process';
  }

  const getButtonText = (): string => {
    return toolInfo.label;
  }

  const getFeedbackTitle = (): string => {
    if (activeTool === 'review') return 'Review Feedback:';
    if (activeTool === 'refactor') return 'Refactoring Result:';
    if (activeTool === 'preview') return 'Component Preview:';
    if (activeTool === 'generate') return 'Generated Code:';
    if (activeTool === 'content') return 'Generated Content:';
    return 'Result:';
  }

  const getLoadingMessage = (): string => {
    return `Generating ${toolInfo.label.toLowerCase()}, please wait...`;
  }
  
  const getInputPlaceholder = (): string => {
    if (activeTool === 'generate') return "Describe the code you want to generate (e.g., 'a React component that fetches and displays a list of users')...";
    if (activeTool === 'content') return "Describe the content you want to create (e.g., 'a short blog post about AI ethics')...";
    return "Paste your code here...";
  }

  const getInputLabel = (): string => {
    if (activeTool === 'generate') return `Describe the code you want to generate:`;
    if (activeTool === 'content') return `Describe the content you want to create:`;
    return `Enter code to ${getActionVerb()}:`;
  }

  const handleSubmitClick = () => {
    if (!isApiKeyConfigured) {
        setError("Gemini API key is not configured. Please set it in the API Key Management section.");
        setShowResults(true);
        return;
    }
    if ((activeTool !== 'generate' && activeTool !== 'content') && !code.trim()) { 
      setError(`Please enter some code to ${getActionVerb()}.`);
      setShowResults(true);
      return;
    }
    if ((activeTool === 'generate' || activeTool === 'content') && !code.trim()) {
      setError(`Please enter a description to ${getActionVerb()}.`);
      setShowResults(true);
      return;
    }
    setError(null); 
    onSubmit();
    setShowResults(true);
  };
  
  const handleStartNew = () => {
    onClearInput();
    onClearFeedback();
    setError(null);
    setShowResults(false);
  };
  
  const handleToolChange = (toolId: CodeTool) => {
    if (isLoading) return;
    onToolChange(toolId);
    handleStartNew(); // Reset the panel state when switching tools
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mt-6 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800/30 rounded-lg shadow-inner border border-dashed border-gray-300 dark:border-gray-600 min-h-[300px]">
           <LoadingSpinner />
           <p className="mt-4 text-gray-600 dark:text-gray-300">{getLoadingMessage()}</p>
       </div>
      );
    }
    
    if (showResults) {
       return (
        <div className="space-y-4">
            { (feedback || error) &&
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{getFeedbackTitle()}</h2>
                {error && (
                  <div className="p-4 bg-red-100 dark:bg-red-700/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md shadow" role="alert">
                    <strong className="font-semibold">Error:</strong> {error}
                  </div>
                )}
                {feedback && !error && activeTool === 'refactor' && (() => {
                  const { summary, code: refactoredCodeContent, rawFeedback } = parseRefactorFeedback(feedback);
                  if (rawFeedback) return <FeedbackDisplay feedback={rawFeedback} />;
                  return (
                    <div>
                      {summary && (
                        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
                          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Refactoring Summary:</h3>
                          <FeedbackDisplay feedback={summary} />
                        </div>
                      )}
                      {refactoredCodeContent && (
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
                          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Refactored Code:</h3>
                          <FeedbackDisplay feedback={`\`\`\`typescript\n${refactoredCodeContent}\n\`\`\``} />
                        </div>
                      )}
                      {!summary && !refactoredCodeContent && !rawFeedback && feedback && <FeedbackDisplay feedback={feedback} />}
                    </div>
                  );
                })()}
                {feedback && !error && activeTool !== 'refactor' && <FeedbackDisplay feedback={feedback} />}
              </div>
            }
             <button
              onClick={handleStartNew}
              className="!mt-8 w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 ease-in-out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Clear & Start New
            </button>
        </div>
       )
    }

    return (
       <div className="space-y-4">
        <div className="relative">
          <label htmlFor="codeInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {getInputLabel()}
          </label>
          <CodeInput value={code} onChange={onCodeChange} disabled={!isApiKeyConfigured} placeholder={getInputPlaceholder()} />
          {code && <button onClick={onClearInput} title="Clear input" aria-label="Clear input field" className="absolute top-8 right-2 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>}
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Instructions:</p>
            <p>{toolInfo.description}</p>
        </div>
        <button onClick={handleSubmitClick} disabled={!isApiKeyConfigured || !code.trim()} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed">
            {getButtonText()}
        </button>
      </div>
    );
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner">
        {TOOLS.map(tool => (
            <button key={tool.id} onClick={() => handleToolChange(tool.id)} disabled={isLoading} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-150 ease-in-out disabled:cursor-not-allowed ${activeTool === tool.id ? 'bg-blue-600 text-white shadow' : 'bg-white hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'}`}>
                {tool.label}
            </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
};
