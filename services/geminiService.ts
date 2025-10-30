
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

let ai: GoogleGenAI | null = null;
const MODEL_NAME_PRO = 'gemini-2.5-pro';

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
    - Use Tailwind CSS for all styling. Do not use custom CSS, inline style objects, or CSS-in-JS libraries unless absolutely necessary for dynamic styles that cannot be achieved with Tailwind.
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
