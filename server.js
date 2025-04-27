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

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== Multer setup for audio uploads =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// ===== OpenAI Whisper client =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===== Google Cloud Text-to-Speech client =====
const ttsClient = new textToSpeech.TextToSpeechClient();

// ===== Whisper transcription endpoint =====
app.post("/whisper", upload.single("file"), async (req, res) => {
  try {
    console.log("📄 Received file:", req.file.path);
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
      fileName: req.file.originalname
    });
    // Clean up upload
    fs.unlinkSync(req.file.path);
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
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (error) {
    console.error("🛑 TTS error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===== Health check =====
app.get("/", (req, res) => {
  res.send("✅ Whisper & TTS backend is alive");
});

// ===== Start server =====
app.listen(port, () => {
  console.log(`✅ Backend running on http://localhost:${port}`);
});
