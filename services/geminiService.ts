import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";

let ai: GoogleGenAI | null = null;
const MODEL_NAME_TEXT = 'gemini-2.5-pro';
const MODEL_NAME_IMAGE = 'imagen-3.0-generate-002';


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

interface RefactorStreamingPart {
  type: 'chunk' | 'error' | 'finish_reason';
  data?: string; 
  message?: string; 
  reason?: string; 
  safetyRatings?: any;
}


const getAiInstance = (): GoogleGenAI => {
  if (!ai) {
    // Safely access API_KEY from process.env
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

async function withApiErrorHandling<T>(apiCall: () => Promise<T>, context: string): Promise<T> {
  try {
    const result = await apiCall();
    // For generateContent responses, check for empty text
    if (result && typeof (result as any).text === 'string' && !(result as any).text.trim()) {
        throw new Error(`Received an empty response from the API for ${context}.`);
    }
    // For generateImages responses
    if (context === 'image generation' && result && Array.isArray((result as any).generatedImages) && (result as any).generatedImages.length === 0) {
        throw new Error("No image data received from the API or image generation failed.");
    }
    return result;
  } catch (error) {
    console.error(`Error calling Gemini API for ${context}:`, error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid") || error.message.includes("invalid api key") || error.message.includes("API key is not valid")) {
             throw new Error("Invalid or unauthorized Gemini API key. Please check your key and permissions.");
        }
         throw new Error(`Gemini API request for ${context} failed: ${error.message}`);
    }
    throw new Error(`An unknown error occurred while communicating with the Gemini API for ${context}.`);
  }
}

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
      model: MODEL_NAME_TEXT,
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


export const reviewCodeWithGemini = async (code: string): Promise<string> => {
  const currentAi = getAiInstance();
  const prompt = `
You are an expert AI code reviewer with a strong understanding of TypeScript and React.
Please provide a detailed review of the following code.
Focus on:
- Potential bugs and logical errors.
- Clarity, readability, and maintainability.
- Performance optimizations and potential bottlenecks (especially React-specific ones like re-renders, memoization, and hook usage).
- Adherence to best practices and language-specific conventions (particularly for TypeScript and React, including component structure, state management, and prop typing).
- Security vulnerabilities.

Format your feedback clearly and concisely using Markdown. Use bullet points or numbered lists for specific suggestions.
If suggesting code changes, try to show small, illustrative snippets.
If the code appears to be TypeScript or React, pay special attention to common patterns, best practices, and potential issues specific to those technologies.
Do not repeat the provided code in your review unless it's part of a specific suggestion.

The code to review is:
\`\`\`typescript
${code}
\`\`\`
`;

  const response = await withApiErrorHandling(() => currentAi.models.generateContent({
      model: MODEL_NAME_TEXT,
      contents: prompt,
    }), "review");
    
  return response.text;
};

export async function* refactorCodeWithGeminiStream(code: string): AsyncIterable<RefactorStreamingPart> {
  const currentAi = getAiInstance();
  const prompt = `
You are an expert AI code refactoring assistant, particularly skilled in TypeScript and React.
Given the following TypeScript/React code, please refactor it to improve its quality, readability, performance, and maintainability, adhering to modern TypeScript and React best practices.

Your response MUST be structured as follows:

1.  Start with a concise summary of the key improvements and changes you made. This summary MUST be in Markdown format and begin with the heading:
    ## Refactoring Summary:
    [Your summary content here]

2.  After the summary, provide the complete refactored source code. This code MUST be enclosed in a single TypeScript Markdown code block, and it should be preceded by the heading:
    ## Refactored Code:
    \`\`\`typescript
    // Your refactored code here
    \`\`\`

Please ensure there is no other text, explanation, or formatting outside this specified structure. For example, do not add any text after the final code block's closing backticks.

The code to refactor is:
\`\`\`typescript
${code}
\`\`\`
`;

  try {
    const stream = await currentAi.models.generateContentStream({
      model: MODEL_NAME_TEXT,
      contents: prompt,
    });

    for await (const chunk of stream) {
      const chunkText = chunk.text;
      const finishReason = chunk.candidates?.[0]?.finishReason;
      const safetyRatings = chunk.candidates?.[0]?.safetyRatings;

      if (chunkText) {
        yield { type: 'chunk', data: chunkText };
      }

      if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
        yield { type: 'finish_reason', reason: finishReason, safetyRatings };
        return; 
      }
    }
  } catch (error) {
    console.error("Error in refactorCodeWithGeminiStream:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred during refactoring stream.";
    if (message.includes("API key not valid") || message.includes("invalid api key")) {
      yield { type: 'error', message: "Invalid or unauthorized Gemini API key." };
    } else {
      yield { type: 'error', message: `Gemini API request for refactor stream failed: ${message}` };
    }
  }
}


export const getReactComponentPreview = async (code: string): Promise<string> => {
  const currentAi = getAiInstance();
  const prompt = `
You are an expert AI assistant specializing in analyzing React and TypeScript components.
Given the following React/TypeScript component code, provide a textual description of what the component likely does, its visual structure, its expected props, any internal state, and its basic behavior and interactivity.

Focus on:
- **Purpose:** What is the main goal or function of this component?
- **Visual Structure:** Describe what it would roughly look like on a page (e.g., "a form with two input fields and a submit button," "a card displaying user information").
- **Props:** List its primary props, their likely types (if discernible), and their purpose.
- **State:** Describe any internal state variables it manages and how they affect the component.
- **Interactivity:** Explain how a user might interact with this component and what happens as a result (e.g., "Clicking the 'Add to Cart' button likely dispatches an action or calls a prop function.").

Format your response as clear, concise Markdown. Use headings and bullet points for readability.

The component code is:
\`\`\`typescript
${code}
\`\`\`
`;

    const response = await withApiErrorHandling(() => currentAi.models.generateContent({
        model: MODEL_NAME_TEXT,
        contents: prompt,
    }), "component preview");
    
    return response.text;
};


export const generateCodeWithGemini = async (description: string): Promise<string> => {
  const currentAi = getAiInstance();
  const prompt = `
You are an expert AI code generation assistant.
Please generate code based on the following description.
Focus on creating clean, efficient, and correct code.
If the description implies TypeScript or React, please use appropriate syntax and best practices.
Provide *only* the generated code, preferably within a single Markdown code block.
If a brief explanation is absolutely necessary before the code, keep it very short. Do not add explanations after the code block.

Description:
"${description}"

Generated Code:
`;

  const response = await withApiErrorHandling(() => currentAi.models.generateContent({
      model: MODEL_NAME_TEXT,
      contents: prompt,
  }), "code generation");
  
  return response.text;
};

export const generateContentWithGemini = async (description: string): Promise<string> => {
  const currentAi = getAiInstance();
  const prompt = `
You are an expert AI content creation assistant.
Please generate content based on the following description.
Focus on creating clear, engaging, and well-structured text suitable for the described purpose (e.g., blog post, social media update, documentation section, email copy, creative writing, etc.).
Adapt your tone and style to the user's request.
Provide *only* the generated content. Do not add explanations, introductions, or sign-offs unless they are part of the requested content itself.

Description:
"${description}"

Generated Content:
`;

  const response = await withApiErrorHandling(() => currentAi.models.generateContent({
      model: MODEL_NAME_TEXT,
      contents: prompt,
  }), "content generation");
  
  return response.text;
};


export const generateImageWithImagen = async (prompt: string): Promise<string> => {
  const currentAi = getAiInstance();

  const response = await withApiErrorHandling(() => currentAi.models.generateImages({
      model: MODEL_NAME_IMAGE,
      prompt: prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
  }), "image generation");

  if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      return response.generatedImages[0].image.imageBytes;
  } else {
      throw new Error("No image data received from the API or image generation failed.");
  }
};


// --- Chat Functions ---

export const startChatSession = async (systemInstruction: string): Promise<Chat> => {
  const currentAi = getAiInstance();
  return withApiErrorHandling(() => {
    const chatSession: Chat = currentAi.chats.create({
      model: MODEL_NAME_TEXT,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return Promise.resolve(chatSession);
  }, "starting chat session");
};

export const sendMessageToChatStream = async (chat: Chat, message: string): Promise<AsyncIterable<GenerateContentResponse>> => {
  try {
    const stream = await chat.sendMessageStream({ message });
    return stream;
  } catch (error) {
    console.error("Error sending message to chat stream:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key not valid") || error.message.includes("invalid api key") || error.message.includes("API key is not valid")) {
        throw new Error("Invalid or unauthorized Gemini API key. Please check your key and permissions.");
      }
      throw new Error(`Failed to send message via stream: ${error.message}`);
    }
    throw new Error("An unknown error occurred while sending message to chat stream.");
  }
};