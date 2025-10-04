<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View My app in AI Studio: https://advanced-documentation-browser.netlify.app/

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Features

This AI-powered documentation and content studio includes:

- **Knowledge Base Chat**: 
  - Chat with AI about your documentation, code, or any uploaded text file.
  - Add, remove, and manage multiple documentation URL groups ("Knowledge Bases").
  - Upload `.txt` files or paste text to provide local context for the AI.
  - Switch between different knowledge base groups and rename or delete them.
  - Get smart, actionable question suggestions based on your current context.
  - Customizable system prompt for AI responses (e.g., "Be concise", "Explain like I'm 5").
  - Toggle web search and "model thinking" for more relevant or creative answers.

- **Image Studio**:
  - Generate new images from text prompts using Gemini's image model.
  - Upload and edit images (PNG, JPG, WEBP) with AI-powered transformations.
  - Download generated or edited images.

- **Book Publisher**:
  - Instantly generate a complete book (title, chapters, and content) on any topic.
  - Download the generated book as a styled HTML file.
  - Table of contents navigation for easy reading.

- **User Authentication**:
  - Secure login with Gemini API key and email (stored locally, never shared).
  - Session persistence using local storage.

- **Modern UI/UX**:
  - Responsive, dark-themed interface with intuitive navigation.
  - Sidebar for knowledge base and context management.
  - Animated loading states and error handling.
  - Built with React, TypeScript, and Tailwind CSS for performance and maintainability.

---
