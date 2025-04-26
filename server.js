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

    const fileStream = fs.createReadStream(req.file.path);

    const response = await openai.audio.transcriptions.create({
      file: {
        name: req.file.originalname,   // recording.webm
        type: req.file.mimetype,        // audio/webm
        stream: fileStream
      },
      model: "whisper-1"
    });

    fs.unlinkSync(req.file.path);  // Cleanup temp file
    res.json({ transcript: response.text });
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
