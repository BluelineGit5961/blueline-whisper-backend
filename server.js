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
    console.log("🎤 Received audio file:", req.file);

    if (!req.file) {
      console.error("❌ No file uploaded!");
      return res.status(400).json({ error: "No file uploaded." });
    }

    const audioPath = req.file.path;
    console.log("📂 Audio path:", audioPath);

    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      response_format: "json"
    });

    console.log("✅ Transcript result:", transcript);

    // Cleanup
    fs.unlinkSync(audioPath);

    res.json({ transcript: transcript.text });
  } catch (error) {
    console.error("🔥 Whisper API error:", error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path); // Cleanup file even if error
    }
    res.status(500).json({ error: "Transcription failed", details: error.message });
  }
});


app.listen(port, () => {
  console.log(`✅ Whisper backend live on http://localhost:${port}`);
});
