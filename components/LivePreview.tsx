import React, { useMemo } from 'react';

interface LivePreviewProps {
  code: string;
}

const createPreviewHtml = (code: string): string => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style> 
      body { 
        margin: 0; 
        background-color: #fff;
      }
      /* Basic dark mode support for preview iframe */
      @media (prefers-color-scheme: dark) {
        body {
          background-color: #111827; /* gray-900 */
        }
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel" data-type="module">
      try {
        ${code} // The raw TSX code from Gemini
        
        // Ensure React and ReactDOM are available
        const React = window.React;
        const ReactDOM = window.ReactDOM;

        const container = document.getElementById('root');
        if(container) {
          const root = ReactDOM.createRoot(container);
          // The prompt ensures the component is named PreviewComponent and is the default export
          root.render(<PreviewComponent />);
        } else {
          console.error("Preview error: root element not found.")
        }

      } catch (e) {
        const container = document.getElementById('root');
        if (container) {
          container.innerHTML = \`<div style="color: red; padding: 1rem; font-family: monospace; background-color: #fee2e2;"><strong>Render Error:</strong><br/><pre>\${e.message}</pre></div>\`;
        }
        console.error('Preview Error:', e);
      }
    </script>
  </body>
  </html>
`;

export const LivePreview: React.FC<LivePreviewProps> = ({ code }) => {
    // useMemo helps prevent re-calculating the srcDoc on every render unless the code changes.
    const previewHtml = useMemo(() => createPreviewHtml(code), [code]);

    if (!code) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.776 48.776 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    <p className="font-semibold">Live Preview</p>
                    <p className="text-sm">Your generated application will appear here.</p>
                </div>
            </div>
        )
    }

    return (
        <iframe
            srcDoc={previewHtml}
            title="Live Preview"
            sandbox="allow-scripts"
            className="w-full h-full border-0 bg-white rounded-lg shadow-inner"
        />
    );
};
