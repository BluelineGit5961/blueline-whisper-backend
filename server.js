require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const { OpenAI } = require("openai");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for handling uploads
const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Whisper transcription endpoint
app.post("/whisper", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("✅ Received file:", req.file.originalname);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
      response_format: "json"  // Optional, but cleaner
    });

    // Cleanup: delete the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ transcript: transcription.text });
  } catch (error) {
    console.error("❌ Whisper API error:", error);
    res.status(500).json({ error: error.message || "Transcription failed" });
  }
});

// Default root route (optional, to check server running)
app.get("/", (req, res) => {
  res.send("✅ Blueline Whisper Backend is running!");
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});
