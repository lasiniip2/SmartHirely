const express = require('express'); //core framework for creating the HTTP server and routing
const cors = require('cors'); //allows cross-origin requests
const multer = require('multer'); //middleware to handle file uploads
const path = require('path'); //Node.js module to handle file and directory paths
const fs = require('fs'); //Node.js module for reading, writing, and checking files.
const pdfParse = require('pdf-parse'); //to read PDF files
const mammoth = require('mammoth'); //to read DOCX files
const OpenAI = require('openai');
require('dotenv').config();

const app = express();//Creates your backend app instance
const PORT = 5000;

app.use(cors());//Allows cross-origin requests from your Angular frontend

// openai configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set up storage engine for multer
const storage = multer.diskStorage({
  // upload files into the 'uploads' folder
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  //Gives each uploaded file a unique name
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Ensure uploads folder exists, if not creates it
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Helper to extract text
async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  return 'This resume is in an unsupported format. Please upload a PDF or DOCX file.';
}

// Handle POST file upload
app.post('/api/upload', upload.single('file'), async(req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // analyze the file here or send it to AI logic
  try {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const text = await extractText(filePath, req.file.mimetype);

    // Send extracted text to OpenAI for analysis
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that extracts key skills and matches suitable job roles for Sri Lanka IT industry.',
        },
        {
          role: 'user',
          content: `Analyze this resume and suggest 3 ideal job roles: \n\n${text}`,
        },
      ],
    });
    const analysis = aiResponse.choices[0].message.content;

    res.status(200).json({
      message: 'File uploaded and analyzed successfully',
      analysis,
    });

  } catch (err) {
    console.error('Error analyzing file:', err);
    res.status(500).json({ message: 'Failed to analyze file', error: err.message });
  }
  
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
