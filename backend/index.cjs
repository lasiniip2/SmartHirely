const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Setup storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Ensure 'uploads' folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Extract text from resume
async function extractText(filePath) {
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

  return 'Unsupported file format. Please upload a PDF or DOCX file.';
}

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const text = await extractText(filePath);

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert career advisor in Sri Lanka. Based on a given resume, return 10 suitable job roles that are relevant to the Sri Lankan job market. Each job role should include:
            1. Job Title
            2. Description (2–3 sentences)
            3. Typical Career Path
            4. Key Skills Required
            5. Common Tools/Platforms Used
            6. Estimated Monthly Salary in LKR
            7. Relevant Companies (List 5-8 actual Sri Lankan companies that typically hire for this role)
            8. Popular Job Portals (just names, like "TopJobs", "ExpressJobs", "LinkedIn", etc.)
            
            Output the result as a JSON array of job role objects with the following structure:
            {
              "jobTitle": "string",
              "description": "string",
              "careerPath": "string",
              "keySkills": ["skill1", "skill2"],
              "tools": ["tool1", "tool2"],
              "salaryRange": "string",
              "relevantCompanies": ["company1", "company2", "company3"]
              "jobPortals": ["portal1", "portal2"],
            }`,
        },
        {
          role: 'user',
          content: `Resume Text:\n\n${text}`,
        },
      ],
      temperature: 0.7,
    });

    const jobRolesRaw = aiResponse.choices[0].message.content;

    let jobRoles;
    try {
      jobRoles = JSON.parse(jobRolesRaw); 
    } catch (error) {
      console.error('Failed to parse AI response:', error.message);
      return res.status(500).json({ message: 'AI returned an invalid format.' });
    }

    res.status(200).json({
      message: 'Resume analyzed successfully',
      jobRoles, 
    });


  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Failed to analyze resume', error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SmartHirely running on http://localhost:${PORT}`);
});
