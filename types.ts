export type ApiKeySource = 'ui' | 'env' | 'none';
export type Theme = 'light' | 'dark';

export type ActiveTab = 'builder' | 'documentation' | 'chat' | 'codeTools' | 'image';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export type CodeTool = 'review' | 'refactor' | 'preview' | 'generate' | 'content';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  componentCode?: string;
  showPreview?: boolean;
}