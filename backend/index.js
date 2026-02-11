import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import fetch from "node-fetch";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const app = express();

// Setup multer for file uploads
const upload = multer({
  dest: "uploads/"
});

// Use middlewares
app.use(cors());
app.use(express.json());

// This is just to silence pdf.js font warnings
pdfjsLib.GlobalWorkerOptions.standardFontDataUrl =
  "https://unpkg.com/pdfjs-dist@5.4.624/standard_fonts/";

// 🔑 PUT YOUR OPENROUTER API KEY HERE
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;


// Model name
const MODEL = "mistralai/mistral-7b-instruct";

// Main API route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read quiz type and number of questions from form data
    let quizType = req.body.quizType;
    if (!quizType) {
      quizType = "descriptive";
    }

    let numQuestionsRaw = req.body.numQuestions;
    if (!numQuestionsRaw) {
      numQuestionsRaw = "10";
    }

    const numQuestions = parseInt(numQuestionsRaw, 10);

    // Read PDF file from disk
    const fileBuffer = fs.readFileSync(req.file.path);

    // Convert Buffer to Uint8Array (pdfjs needs this)
    const data = new Uint8Array(fileBuffer);

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: data });
    const pdfDoc = await loadingTask.promise;

    let extractedText = "";

    // Loop through all pages and extract text
    for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
      const page = await pdfDoc.getPage(pageNumber);
      const content = await page.getTextContent();

      const items = content.items;
      const strings = items.map(function (item) {
        return item.str;
      });

      extractedText = extractedText + strings.join(" ") + "\n";
    }

    // Limit text size to avoid token limits
    extractedText = extractedText.slice(0, 4000);

    // Build the prompt
    let quizInstruction = "";

    if (quizType === "mcq") {
      quizInstruction =
        numQuestions +
        " MULTIPLE CHOICE questions. Each must have 4 options and the correct answer.";
    } else {
      quizInstruction =
        numQuestions + " DESCRIPTIVE questions with answers.";
    }

    const prompt = `
You are a study assistant.

From the following text, generate:
1) ${quizInstruction}
2) 10 flashcards (term + definition).

Return ONLY valid JSON.

If quiz type is "mcq", use this format:
{
  "quiz": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "A"
    }
  ],
  "flashcards": [
    { "front": "...", "back": "..." }
  ]
}

If quiz type is "descriptive", use this format:
{
  "quiz": [
    { "question": "...", "answer": "..." }
  ],
  "flashcards": [
    { "front": "...", "back": "..." }
  ]
}

IMPORTANT:
- Do NOT use LaTeX.
- Use plain text for math (e.g., 10^-3).
- Do NOT use markdown.
- Do NOT use backticks.
- Return ONLY JSON.

TEXT:
${extractedText}
`;

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENROUTER_API_KEY,
        "Accept": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Notes-to-Quiz"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are a helpful study assistant."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });

    const dataJson = await response.json();
    console.log("OpenRouter raw response:", dataJson);

    if (!dataJson.choices || !dataJson.choices[0]) {
      return res.status(500).json({ error: "AI response invalid" });
    }

    // Read AI text safely
    let aiText = "";
    const msg = dataJson.choices[0].message.content;

    if (typeof msg === "string") {
      aiText = msg;
    } else if (Array.isArray(msg)) {
      let combined = "";
      for (let i = 0; i < msg.length; i++) {
        if (msg[i].text) {
          combined = combined + msg[i].text;
        }
      }
      aiText = combined;
    } else {
      aiText = JSON.stringify(msg);
    }

    console.log("AI TEXT:", aiText);

    // Extract JSON part
    const jsonStart = aiText.indexOf("{");
    const jsonEnd = aiText.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(500).json({ error: "Could not find JSON in AI response" });
    }

    let jsonString = aiText.slice(jsonStart, jsonEnd + 1);

    // Clean bad escapes just in case
    jsonString = jsonString.replace(/```json/g, "");
    jsonString = jsonString.replace(/```/g, "");
    jsonString = jsonString.replace(/\\\(/g, "(");
    jsonString = jsonString.replace(/\\\)/g, ")");
    jsonString = jsonString.replace(/\\\^/g, "^");
    jsonString = jsonString.replace(/\\_/g, "_");
    jsonString = jsonString.replace(/\\{/g, "{");
    jsonString = jsonString.replace(/\\}/g, "}");
    jsonString = jsonString.replace(/\\\\/g, "\\");

    console.log("CLEAN JSON STRING:", jsonString);

    const parsed = JSON.parse(jsonString);

    res.json(parsed);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: "Failed to process PDF or AI request" });
  }
});

// Start server
app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
