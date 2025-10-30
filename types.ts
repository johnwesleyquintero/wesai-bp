
export type Theme = 'light' | 'dark';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

// Fix: Add ApiKeySource type
export type ApiKeySource = 'ui' | 'env' | 'none';

// Fix: Add ActiveTab type
export type ActiveTab = 'builder' | 'chat' | 'codeTools' | 'image' | 'documentation';

// Fix: Add CodeTool type
export type CodeTool = 'review' | 'refactor' | 'preview' | 'generate' | 'content';

// Fix: Add ChatMessage type
export interface ChatMessage extends CopilotMessage {
  componentCode?: string | null;
  showPreview?: boolean;
}

// Fix: Add AspectRatio type
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
