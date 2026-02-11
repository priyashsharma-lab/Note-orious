📘 Note-orious — AI-Powered Study Engine

Note-orious is a full-stack web application that transforms PDF study materials into interactive quizzes and flashcards using AI. It helps students move from passive reading to active recall in seconds.

Whether you are revising DBMS, Operating Systems, Maths, or Java, Note-orious automates the most boring part of studying: making questions and flashcards.

✨ Key Features

- 📄 Automated PDF Parsing
Extracts text from uploaded PDFs using pdfjs-dist.

- 🧠 AI-Powered Study Material Generation
Uses the mistralai/mistral-7b-instruct model via OpenRouter to generate:

- MCQ or Descriptive quizzes

- Custom number of questions

- Flashcards (term + definition)

- 🔁 Show / Hide Answers Toggle
Answers are hidden by default and revealed only when the user clicks.

- 🃏 Interactive Flashcards
Click-to-flip cards for active recall practice.

- 🧹 Safe JSON Cleaning Layer-
Backend cleans AI output (LaTeX, backslashes, markdown fences) before parsing to avoid crashes.

- 🎨 Clean and Modern UI
Simple, responsive interface with real-time status updates (Generating… / Done!).

🏗️ Technical Architecture
Frontend (frontend/index.html)

- Uses HTML, CSS, and Vanilla JavaScript

- Uses Fetch API with async/await to talk to backend

- Dynamically renders:

  - Quiz questions

  - Answer toggles

  - Flashcards as flip cards

Backend (backend/index.js)

- Built with Node.js + Express

- Uses Multer for handling PDF uploads

- Uses pdfjs-dist to extract text from PDFs

- Uses OpenRouter API to communicate with the AI model

- Converts PDF buffers to Uint8Array for low-level PDF processing

- Cleans and safely parses AI JSON output before sending to frontend


📁 Project Structure

note-orious/
  ├── backend/
  │   ├── index.js
  │   ├── package.json
  │   └── node_modules/
  └── frontend/
      ├── index.html
      └── logo.png

✅ Requirements

Make sure you have the following installed:

Node.js (v18 or higher recommended)
Download: https://nodejs.org

npm (comes with Node.js)

An OpenRouter API Key
Get it from: https://openrouter.ai

🔑 API Key Setup (IMPORTANT)

Open this file:

backend/index.js


Find this line:

const OPENROUTER_API_KEY = "PASTE_YOUR_OPENROUTER_API_KEY_HERE";


Replace it with your own API key.

⚠️ Do NOT commit your real API key to a public repository.

🚀 Installation & Run Guide
1️⃣ Install Backend Dependencies

Open a terminal:

cd backend
npm install

2️⃣ Start the Backend Server
npm start


You should see:

Backend running on http://localhost:5000

3️⃣ Start the Frontend

Open a new terminal:

cd frontend
npx serve .


(or)

npx http-server .


Then open the URL shown in the terminal (usually):

http://localhost:3000

❗ Important Note

Do NOT open index.html by double-clicking it.
Always use a local server (npx serve or npx http-server) so the browser can call the backend correctly.

▶️ How to Use the App

Start the backend server

Start the frontend server

Open the website in your browser

Upload a PDF file

Select:

Quiz type (MCQ or Descriptive)

Number of questions

Click Generate

Click Show Answer to reveal answers

Click flashcards to flip them

🧠 Behind the Logic

Text Slicing:
Only the first ~4000 characters of PDF text are sent to the AI to stay within token limits.

Schema Enforcement:
The AI is strictly prompted to return JSON only. The backend extracts the JSON using { ... } boundaries.

Error Handling:
Both frontend and backend use try/catch blocks to show clear errors if:

PDF parsing fails

AI API fails

JSON parsing fails

🔐 Security & Best Practices

API Key Security:
Currently, the key is hardcoded for simplicity. For production, move it to environment variables (.env).

Uploads Folder Cleanup:
The /uploads folder should be cleaned periodically to avoid storage buildup.

🌍 Deployment (Free Options)

You can deploy this project for free using:

Frontend: Vercel or Netlify

Backend: Render or Railway

🏷️ Project Name

Note-orious

Study smarter, not harder 📚
