import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

let ai: GoogleGenAI | null = null;
const MODEL_NAME_PRO = 'gemini-2.5-pro';
const MODEL_NAME_FLASH = 'gemini-2.5-flash';
const MODEL_NAME_IMAGEN = 'imagen-4.0-generate-001';

export const initializeGeminiClient = (apiKey: string): void => {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    ai = null; 
    throw new Error("Failed to initialize Gemini client. Check API key format or SDK issue.");
  }
};

export const clearGeminiClient = (): void => {
  ai = null;
};

const getAiInstance = (): GoogleGenAI => {
  if (!ai) {
    const envApiKey = process.env.API_KEY;
    if (envApiKey && envApiKey.trim() !== '') {
        console.warn("Attempting to initialize Gemini client from environment variable as it was not previously initialized.");
        try {
            initializeGeminiClient(envApiKey);
        } catch (initError) {
            console.error("Failed to initialize Gemini client from env var during getAiInstance:", initError);
        }
    }
    
    if (!ai) {
      throw new Error("Gemini API client is not initialized. Please set your API key in the application settings. If using a development environment, ensure API_KEY is set in your environment.");
    }
  }
  return ai;
};

// --- Builder Panel Services ---

export const generateWebAppWithGeminiStream = async (prompt: string): Promise<AsyncIterable<GenerateContentResponse>> => {
  const currentAi = getAiInstance();
  const systemInstruction = `
You are an expert AI developer specializing in creating self-contained, production-ready React components using TypeScript and Tailwind CSS.
Your task is to generate a single TSX file based on the user's prompt.

Follow these rules STRICTLY:
1.  **Single File Output**: Your entire response MUST be the content of a single \`.tsx\` file. Do not include any explanations, comments, or text outside of the code block.
2.  **Component Naming**: The main component MUST be named 'PreviewComponent'.
3.  **Default Export**: You MUST export 'PreviewComponent' as the default export.
4.  **Self-Contained**: The component must be completely self-contained. It should not rely on any external files or local assets. All logic, styling, and structure must be within this single component.
5.  **Dependencies**:
    - Use React and TypeScript.
    - Use Tailwind CSS for all styling. Do not use custom CSS, inline style objects, or CSS-in-JS libraries unless absolutely necessary for dynamic styles.
    - Do NOT import any external libraries or packages other than 'react'. If icons are needed, use inline SVG elements.
6.  **Code Quality**:
    - The code must be clean, readable, and well-commented where necessary.
    - It must be responsive and accessible.
    - It should be free of errors and ready to be rendered in a browser environment with React and Tailwind CSS available.
7.  **No Explanations**: Do NOT start your response with "Here is the code..." or end with any summaries. Your response should be ONLY the code, starting with \`import React from 'react';\` and ending with the final \`}\` of the file.
`;

  try {
    const stream = await currentAi.models.generateContentStream({
      model: MODEL_NAME_PRO,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return stream;
  } catch (error) {
    console.error("Error in generateWebAppWithGeminiStream:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key not valid") || error.message.includes("invalid api key")) {
        throw new Error("Invalid or unauthorized Gemini API key.");
      }
      throw new Error(`Gemini API request for web app generation failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during web app generation stream.");
  }
};

export const editCodeWithGeminiStream = async (currentCode: string, editPrompt: string): Promise<AsyncIterable<GenerateContentResponse>> => {
  const currentAi = getAiInstance();
  const systemInstruction = `You are an expert AI developer copilot. Your task is to modify a provided React component based on the user's instructions. You MUST return only the full, updated, and complete source code for the component. Do NOT wrap the code in Markdown backticks or add any explanations, introductions, or summaries. Your output must be ONLY the raw TSX code.`;
  
  const fullPrompt = `Here is the current code of the React component:\n\`\`\`tsx\n${currentCode}\n\`\`\`\n\nNow, please apply the following change: "${editPrompt}"`;

  try {
    const stream = await currentAi.models.generateContentStream({
      model: MODEL_NAME_PRO,
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return stream;
  } catch (error) {
    console.error("Error in editCodeWithGeminiStream:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key not valid") || error.message.includes("invalid api key")) {
        throw new Error("Invalid or unauthorized Gemini API key.");
      }
      throw new Error(`Gemini API request for code editing failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during code editing stream.");
  }
};


// --- Chat Panel Services ---

export const initializeChat = (): Chat => {
  const currentAi = getAiInstance();
  return currentAi.chats.create({
    model: MODEL_NAME_FLASH,
    config: {
      systemInstruction: 'You are WesAI, an expert AI assistant for software development. Help users with their questions about coding, design, and creating web applications with React and TypeScript.',
    },
  });
};

export const sendChatMessageStream = async (chat: Chat, message: string): Promise<AsyncIterable<GenerateContentResponse>> => {
    try {
        const stream = await chat.sendMessageStream({ message });
        return stream;
    } catch (error) {
        console.error("Error sending chat message:", error);
        if (error instanceof Error) {
            throw new Error(`Chat API request failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during chat.");
    }
};

// --- Code Tools Services ---

export const performCodeToolActionStream = async (code: string, tool: 'review' | 'refactor' | 'preview' | 'generate' | 'content'): Promise<AsyncIterable<GenerateContentResponse>> => {
    const currentAi = getAiInstance();
    let systemInstruction = '';
    let userPrompt = code;

    switch (tool) {
        case 'review':
            systemInstruction = 'You are an expert code reviewer. Analyze the following code for bugs, performance issues, style inconsistencies, and adherence to best practices. Provide a detailed, constructive review in Markdown format.';
            userPrompt = `Please review the following code:\n\`\`\`tsx\n${code}\n\`\`\``;
            break;
        case 'refactor':
            systemInstruction = 'You are an expert at refactoring code. Improve the given code for readability, performance, and maintainability. Respond with a "## Refactoring Summary:" section explaining the changes, followed by a "## Refactored Code:" section with the complete, updated code in a Markdown code block.';
            userPrompt = `Please refactor the following code:\n\`\`\`tsx\n${code}\n\`\`\``;
            break;
        case 'preview':
            systemInstruction = 'You are an AI that describes React components. Analyze the provided component and describe its functionality, props, and expected behavior in clear, concise language (Markdown format).';
            userPrompt = `Describe this React component:\n\`\`\`tsx\n${code}\n\`\`\``;
            break;
        case 'generate':
            systemInstruction = 'You are an expert code generator. Create a high-quality code snippet based on the user\'s description. Return only the code in a Markdown code block.';
            break;
        case 'content':
             systemInstruction = 'You are a helpful content writing assistant. Generate text content based on the user\'s prompt. Format the response in Markdown.';
             break;
    }

    try {
        const stream = await currentAi.models.generateContentStream({
            model: MODEL_NAME_FLASH,
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction
            }
        });
        return stream;
    } catch (error) {
        console.error(`Error in performCodeToolActionStream for tool "${tool}":`, error);
        if (error instanceof Error) {
            throw new Error(`API request for code ${tool} failed: ${error.message}`);
        }
        throw new Error(`An unknown error occurred during code ${tool}.`);
    }
};

// --- Image Generation Services ---

export const generateImageWithImagen = async (prompt: string) => {
    const currentAi = getAiInstance();
    try {
        const response = await currentAi.models.generateImages({
            model: MODEL_NAME_IMAGEN,
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });
        return response;
    } catch (error) {
        console.error("Error in generateImageWithImagen:", error);
        if (error instanceof Error) {
            throw new Error(`Image generation failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during image generation.");
    }
};