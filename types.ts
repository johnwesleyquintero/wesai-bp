export type ApiKeySource = 'ui' | 'env' | 'none';
export type Theme = 'light' | 'dark';

// Add 'builder' to the ActiveTab type
export type ActiveTab = 'builder' | 'review' | 'refactor' | 'preview' | 'generate' | 'content' | 'image' | 'chat' | 'documentation';

// Fix: Add and export the ChatMessage interface, which was missing.
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  componentCode?: string | null;
  showPreview?: boolean;
}
