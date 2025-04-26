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
    console.log("🛜 Received audio upload:", req.file);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      filename: req.file.originalname,   // important
      model: "whisper-1",
      response_format: "json",
      language: "en",
    });

    console.log("✅ Transcription successful:", transcription.text);

    // Cleanup
    fs.unlinkSync(req.file.path);

    res.json({ transcript: transcription.text });
  } catch (error) {
    console.error("❌ Whisper API error:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }

    // 🛡 Always return *proper JSON* to frontend even if failure
    res.status(500).json({ error: "Transcription failed", details: error.message });
  }
});



app.listen(port, () => {
  console.log(`✅ Whisper backend live on http://localhost:${port}`);
});
