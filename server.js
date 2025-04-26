require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require('path');
const { OpenAI } = require("openai");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for audio file uploads
const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Whisper endpoint
app.post("/whisper", upload.single("file"), async (req, res) => {
  try {
    console.log("📄 File received by backend:", req.file);

    const filePath = path.resolve(req.file.path);

    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "json",
      fileName: "recording.webm"  // 👈 Force filename hint for OpenAI
    });

    fs.unlinkSync(filePath);

    res.json({ transcript: transcript.text });
  } catch (error) {
    console.error("Whisper API error:", error);
    res.status(500).json({ error: "Transcription failed" });
  }
});

// Health check (for Render etc.)
app.get("/", (req, res) => {
  res.send("✅ Whisper backend is alive");
});

app.listen(port, () => {
  console.log(`✅ Whisper backend running on http://localhost:${port}`);
});
