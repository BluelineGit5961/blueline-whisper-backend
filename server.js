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
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const audioPath = path.resolve(req.file.path);

    console.log(`🛜 Received audio file: ${audioPath}`);

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      response_format: "json"
    });

    console.log("✅ Whisper response:", response);

    // Cleanup: delete file after use
    fs.unlink(audioPath, err => {
      if (err) console.error("Error deleting uploaded file:", err);
    });

    res.json({ transcript: response.text });
  } catch (error) {
    console.error("❌ Whisper error:", error);
    res.status(500).json({ error: error.message || "Unknown Whisper error" });
  }
});

// Health check (for Render etc.)
app.get("/", (req, res) => {
  res.send("✅ Whisper backend is alive");
});

app.listen(port, () => {
  console.log(`✅ Whisper backend running on http://localhost:${port}`);
});
