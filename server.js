require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for in-memory storage (🔥 no writing to disk)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Whisper endpoint
app.post("/whisper", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const transcript = await openai.audio.transcriptions.create({
      file: new Blob([req.file.buffer]), // 🔥 use in-memory file directly
      filename: "recording.webm",         // 🔥 important to provide filename!
      model: "whisper-1",
      response_format: "json"
    });

    res.json({ transcript: transcript.text });
  } catch (error) {
    console.error("Whisper API error:", error);
    res.status(500).json({ error: "Transcription failed" });
  }
});

app.listen(port, () => {
  console.log(`✅ Whisper backend live on http://localhost:${port}`);
});
