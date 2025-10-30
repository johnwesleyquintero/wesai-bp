# WesAI Builder Platform

**From Prompt to Live App. Instantly.**

The WesAI Builder Platform is a strategic, client-side web application designed to accelerate development by transforming natural language prompts into live, editable, and production-ready React applications. It leverages the Google Gemini API to generate high-quality, self-contained React/TypeScript components styled with Tailwind CSS, providing an interactive code editor and a real-time, sandboxed preview.

This platform embodies the "Build the System" philosophy, acting as a sovereign dev co-pilot to rapidly prototype and build digital systems.

## 🧭 Vision & Roadmap

The goal is to create a secure, brand-aligned platform where users can input prompts like *"Build a responsive product landing page for SecuLife GPS tracker with a hero section, features grid, and CTA"* and receive:
1.  A **live, interactive preview** of the application.
2.  The complete, editable **React/TSX source code**.
3.  (Future) **One-click deployment** to Vercel.

This build represents the completion of **Phase 1: Foundation & MVP**.

## ✅ Key Features (Phase 1)

*   **Prompt-to-Code Engine:** A core generation service powered by Google Gemini (`gemini-2.5-pro`) that translates natural language descriptions into complete React components.
*   **Live Sandboxed Preview:** A secure `iframe` that renders the generated code in real-time, isolating it from the main application DOM for safety and stability.
*   **Interactive Code Editor:** A full-featured code editor using CodeMirror that allows for immediate editing and tweaking of the AI-generated code. Any edits are instantly reflected in the live preview.
*   **Client-Side Architecture:** Runs entirely in the browser, using a client-side API key for simplicity and rapid development. No backend required for core functionality.
*   **API Key Management:** Securely save and remove your Gemini API key using browser local storage.
*   **Light/Dark Mode:** A sleek, modern UI with a theme toggle for user comfort.

## 🛠️ Technology Stack

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **AI:** Google Gemini API (`gemini-2.5-pro`)
*   **Code Editor:** CodeMirror 6
*   **Build Tool:** Vite
*   **Modules:** Loaded via ES Modules & `esm.sh`

## 🚀 Getting Started

### Prerequisites

*   A modern web browser (Chrome, Firefox, Edge, Safari).
*   A **Google Gemini API Key**. You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running the Application

1.  **Environment Setup (Recommended for Dev):**
    *   Create a file named `.env` in the project root.
    *   Add your Gemini API key: `VITE_GEMINI_API_KEY=YOUR_API_KEY`
2.  **Install & Run:**
    ```bash
    npm install
    npm run dev
    ```
3.  **API Key Configuration:**
    *   The application will first try to use the `VITE_GEMINI_API_KEY` from your `.env` file.
    *   You can override this by entering a key directly in the "Manage Gemini API Key" section in the UI. This key will be saved to your browser's local storage and will take precedence.

## How to Use

1.  **Set your API Key** if it's not already configured.
2.  **Write a Prompt:** In the input field, describe the application or component you want to build. Be as descriptive as possible. For example:
    *   "Create a contact form with fields for name, email, and message, and a submit button."
    *   "Build a product card for an e-commerce site. It should show an image, product title, price, and an 'Add to Cart' button."
    *   "A simple personal portfolio page with a hero section, an 'About Me' paragraph, and a list of projects."
3.  **Generate:** Click the "Generate" button. The AI will start building your component. You'll see the code appear in the editor and the live preview update in real-time.
4.  **Edit & Iterate:** Once the generation is complete, you can directly edit the code in the editor. The live preview will instantly reflect your changes, allowing for rapid iteration and refinement.
5.  **Copy/Download:** Use the provided buttons to copy the final code to your clipboard or download it as a `.tsx` file.

## Future Phases

*   **Phase 2 (Intelligence & Polish):** Context-aware editing (e.g., "make the button blue"), image-to-UI generation, and project saving/versioning.
*   **Phase 3 (Deployment & Monetization):** One-click deployment to Vercel, usage analytics, and a potential freemium model.

---

Happy Building with WesAI!