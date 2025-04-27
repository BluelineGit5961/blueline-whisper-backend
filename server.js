require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const textToSpeech = require("@google-cloud/text-to-speech");

const app = express();
const port = process.env.PORT || 3000;

// ===== CORS Configuration =====
app.use(cors({ origin: "*" }));
app.options("*", cors());

// ===== Body Parsers =====
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ===== Ensure uploads directory exists =====
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ===== Multer setup for audio uploads =====
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// ===== OpenAI Whisper client =====
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ===== Google Cloud Text-to-Speech client =====
const ttsClient = new textToSpeech.TextToSpeechClient();

// ===== Preflight for specific routes =====
app.options("/whisper", cors());
app.options("/tts", cors());

// ===== Whisper transcription endpoint =====
app.post("/whisper", upload.single("file"), async (req, res) => {
  try {
    console.log("📄 Received file:", req.file.path);
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
      fileName: req.file.originalname
    });
    fs.unlinkSync(req.file.path);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({ transcript: transcript.text });
  } catch (error) {
    console.error("🛑 Whisper error:", error);
    res.status(500).json({ error: error.message || "Transcription failed" });
  }
});

// ===== Text-to-Speech endpoint =====
app.post("/tts", async (req, res) => {
  try {
    const { text, languageCode, voiceName } = req.body;
    if (!text || !languageCode || !voiceName) {
      return res.status(400).json({ error: "Missing text, languageCode or voiceName" });
    }
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: 'MP3' }
    });
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.set("Content-Type", "audio/mpeg");
    res.send(response.audioContent);
  } catch (error) {
    console.error("🛑 TTS error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===== Health check =====
app.get("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send("✅ Backend is alive and ready");
});

// ===== Start server =====
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
