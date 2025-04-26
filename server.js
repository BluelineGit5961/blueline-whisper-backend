require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
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
app.post("/whisper", upload.single("audio"), async (req, res) => {
  try {
    console.log("📄 File received by backend:", req.file);  // ← ADD THIS

    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
    });

    fs.unlinkSync(req.file.path);

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
