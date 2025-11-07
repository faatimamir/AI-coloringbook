
# 🎨 AI Creative Studio ✨

> A magical web application that transforms your ideas into personalized coloring books, vibrant stickers, and enchanting storybooks using the power of Google's Gemini AI.

Welcome to the AI Creative Studio, a one-stop workshop for sparking children's creativity. This application provides a simple, intuitive interface for parents and kids to co-create unique, high-quality printable materials in just a few clicks.

---

## 🌟 Features

The studio is divided into three main creative modes, each packed with features to make your creations special.

### 📚 Coloring Book Generator
- **Custom Themes:** Generate pages based on any theme you can imagine, from "Space Dinosaurs" to "Underwater Unicorns."
- **Personalization:** Add a child's name and select their age level (Preschool, Kids, Big Kids) to tailor the complexity of the pages.
- **AI-Powered Character:** Optionally upload a photo of your child, and the AI will create a coloring book character inspired by them!
- **Variety of Activities:** The generated book includes not just coloring pages, but also fun activities like mazes, connect-the-dots, and name tracing.
- **Customizable Cover:** Design a unique cover by choosing a template, font style, title color, and adding a personal dedication.
- **Print-Ready PDF:** Download the entire multi-page coloring book as a single, high-quality PDF, perfectly formatted for letter-sized paper.

### 🎉 Sticker Maker
- **Theme-Based Creation:** Simply enter a theme like "Happy Avocados" or "Superhero Pets" to get a sheet of unique stickers.
- **AI-Generated Variety:** The AI first brainstorms a list of distinct sticker ideas based on your theme and then generates an image for each one.
- **Personal Touch:** Optionally include a photo to have the AI create stickers featuring a character that looks like your child.
- **Multiple Download Options:**
  - **PDF Sticker Sheet:** Get a ready-to-print PDF with all stickers arranged on a single page.
  - **ZIP Archive:** Download individual, high-resolution PNG files for each sticker.

### 📖 Story Teller
- **Classic Tales, Reimagined:** Choose from a library of beloved fairy tales like Cinderella, Snow White, or The Three Little Pigs.
- **Personalized Characters:** Replace the original character names with names of your choice to make your child the star of the story.
- **Two Unique Modes:**
  - **Classic Mode (Fast):** The AI writes a personalized story and pairs it with beautiful, pre-generated illustrations for a classic storybook feel.
  - **Personalized AI Mode:** The AI writes the story *and* generates brand new, unique illustrations for every page based on the story's text, creating a truly one-of-a-kind book.
- **Downloadable Storybook:** Receive your personalized tale as a beautifully formatted PDF, complete with a custom cover and illustrations woven into the text.

### 🤖 AI Assistant
- A friendly, built-in chatbot is available to answer questions, suggest creative ideas, or just have a fun chat.

---

## 🛠️ How It Works: The Technology Stack

This application is built entirely on the frontend, leveraging powerful browser-based technologies and the Google Gemini API.

- **Frontend Framework:** **React** with **TypeScript** for a modern, type-safe, and component-based architecture.
- **Styling:** **Tailwind CSS** for rapid, utility-first UI development.
- **AI Engine:** **Google Gemini API** (`@google/genai`) is the core of the studio.
  - **Text Generation:** `gemini-2.5-flash` is used for all text-based tasks, including writing stories, generating sticker ideas, and powering the AI chatbot.
  - **Image Generation:** A robust, cascading system ensures high-quality images:
    - `imagen-4.0-generate-001` is the primary model for generating high-quality, artistic illustrations and coloring pages.
    - `gemini-2.5-flash-image` serves as a reliable fallback and is used for all image-to-image tasks (e.g., creating a character from a photo).
- **Client-Side File Generation:**
  - **jsPDF:** Used to dynamically create and format PDF files for coloring books, sticker sheets, and storybooks directly in the browser.
  - **JSZip:** Used to create `.zip` archives of individual sticker images for easy downloading.

---

## 🚀 Getting Started

This is a client-side application and can be run by simply opening the `index.html` file in a web browser.

### Prerequisites

You must have a Google Gemini API key. This application is configured to access the key from an environment variable.

### Running the Application

1. **Set up your API Key:**
   - Ensure a `API_KEY` environment variable containing your Google Gemini API key is available in the execution environment where the application is served. The application will not function without it.

2. **Open the App:**
   - Open the `index.html` file in your preferred web browser. For the best experience, it's recommended to serve the files using a simple local server, but opening the file directly will also work.

---

## 📂 Project Structure

The codebase is organized into logical directories to maintain clarity and scalability.

```
.
├── components/         # Reusable React components (Form, ImageGrid, Chatbot, etc.)
├── services/           # Modules for interacting with external APIs and services
│   ├── geminiService.ts  # Handles all communication with the Google Gemini API
│   └── pdfService.ts     # Manages client-side PDF and ZIP file generation
├── types.ts            # TypeScript type definitions for the application
├── App.tsx             # Main application component and state management
├── index.tsx           # Entry point for the React application
└── index.html          # The main HTML file
```
