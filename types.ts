export type ApiKeySource = 'ui' | 'env' | 'none';
export type Theme = 'light' | 'dark';

// FIX: Expand ActiveTab to include new tab types used in TabNavigation.tsx.
export type ActiveTab = 'builder' | 'documentation' | 'chat' | 'codeTools' | 'image';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

// FIX: Add missing CodeTool type definition for CodeInteractionPanel.tsx.
export type CodeTool = 'review' | 'refactor' | 'preview' | 'generate' | 'content';

// FIX: Add missing ChatMessage interface definition for ChatInterfacePanel.tsx.
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  componentCode?: string;
  showPreview?: boolean;
}
