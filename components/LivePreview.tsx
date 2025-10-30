
import React, { useMemo } from 'react';

interface LivePreviewProps {
  code: string;
}

const createPreviewHtml = (code: string): string => {
  // Escape backticks, backslashes, and template literal placeholders in the code
  const escapedCode = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

  return `
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
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      .dark body {
          background-color: #111827; /* gray-900 */
          color: #f3f4f6; /* gray-100 */
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      // Sync theme from parent
      try {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
      } catch (e) {
        // Ignore localStorage errors in sandbox
      }

      const showError = (error) => {
        const container = document.getElementById('root');
        if (container) {
          container.innerHTML = \`<div style="color: #ef4444; padding: 1rem; font-family: monospace; background-color: #fef2f2; border: 1px solid #fecaca;"><strong>Preview Error:</strong><br/><pre style="white-space: pre-wrap;">\${error.message}</pre></div>\`;
        }
        console.error('Preview Error:', error);
      };

      try {
        // Use the escaped code string
        const rawCode = \`${escapedCode}\`;

        if (typeof window.Babel === 'undefined') {
          throw new Error("Babel is not loaded. Cannot transpile code.");
        }

        // Transpile TSX to CommonJS JavaScript
        const transformed = window.Babel.transform(rawCode, {
          presets: [
            ['env', { modules: 'commonjs', targets: "defaults" }], 
            ['react', { runtime: 'classic' }],
            ['typescript', { allExtensions: true, isTSX: true }]
          ],
          sourceType: 'module'
        });

        const transformedCode = transformed.code;
        if (!transformedCode) {
          throw new Error("Babel transpilation returned empty code.");
        }

        // Create a function to execute the transpiled code in a module-like scope
        const componentFactory = new Function('React', 'require', 'exports', 'module', transformedCode);
        
        const R = window.React; 
        const mockRequire = (name) => {
          if (name === 'react') return R;
          console.warn('Preview component tried to require: "' + name + '". This is not supported in the preview sandbox.');
          return {}; 
        };
        const exportsObj = {}; 
        const moduleObj = { exports: exportsObj };

        // Execute the factory to populate module.exports
        componentFactory(R, mockRequire, exportsObj, moduleObj);
        
        // The main component should be the default export
        const PreviewComponent = moduleObj.exports.default || moduleObj.exports;

        if (!PreviewComponent || (typeof PreviewComponent !== 'function' && typeof PreviewComponent !== 'object')) {
            throw new Error("Could not find a valid component to render. Make sure your code has a default export.");
        }

        const container = document.getElementById('root');
        if (container) {
          const root = window.ReactDOM.createRoot(container);
          // Use React.createElement to render the component we captured
          root.render(R.createElement(PreviewComponent));
        } else {
          throw new Error("Root element not found in preview iframe.");
        }
      } catch (e) {
        showError(e);
      }
    </script>
  </body>
  </html>
`;
};

export const LivePreview: React.FC<LivePreviewProps> = ({ code }) => {
    // useMemo helps prevent re-calculating the srcDoc on every render unless the code changes.
    const previewHtml = useMemo(() => createPreviewHtml(code), [code]);

    if (!code) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.776 48.776 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    <p className="font-semibold mt-2">Live Preview</p>
                    <p className="text-sm">Your generated component will appear here.</p>
                </div>
            </div>
        )
    }

    return (
        <iframe
            srcDoc={previewHtml}
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin" // allow-same-origin for localStorage theme sync
            className="w-full h-full border-0 bg-white rounded-lg shadow-inner"
        />
    );
};
