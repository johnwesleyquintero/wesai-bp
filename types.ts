export type ApiKeySource = 'ui' | 'env' | 'none';
export type Theme = 'light' | 'dark';

// New type for the sub-navigation in the Code Tools panel
export type CodeTool = 'review' | 'refactor' | 'preview' | 'generate' | 'content';

// Updated ActiveTab type with 'codeTools'
export type ActiveTab = 'builder' | 'chat' | 'codeTools' | 'image' | 'documentation';

// Fix: Add and export the ChatMessage interface, which was missing.
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  componentCode?: string | null;
  showPreview?: boolean;
}
