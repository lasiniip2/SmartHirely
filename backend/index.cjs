const express = require('express'); 
const cors = require('cors'); 
const multer = require('multer'); 
const path = require('path'); 
const fs = require('fs'); 
const pdfParse = require('pdf-parse'); 
const mammoth = require('mammoth'); 
const OpenAI = require('openai');
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 5000;

app.use(cors());

// openai configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set up storage engine for multer
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

// Scrape top jobs from topjobs.lk based on a keyword
async function scrapeTopJobs(keyword) {
  const url = `https://topjobs.lk/applicant/vacancybyfunctionalarea.jsp?FA=Information+Technology`;

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const results = [];

    $('a[href^="/employer/"]').each((i, el) => {
      const title = $(el).text().trim();
      const link = 'https://topjobs.lk' + $(el).attr('href');
      if (title.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({ title, link });
      }
    });

    return results.slice(0, 5); 
  } catch (err) {
    console.error('Scraping failed:', err.message);
    return [];
  }
}

// Handle POST file upload
app.post('/api/upload', upload.single('file'), async(req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const text = await extractText(filePath, req.file.mimetype);

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant that provides job recommendations based on Sri Lankan IT industry standards.',
        },
        {
          role: 'user',
          content: `You are an expert career advisor in the Sri Lankan IT industry. 
          Analyze the following resume and recommend the **top 4 most suitable job roles**.
          If the resume seems to belong to a student or someone seeking training, include internships or entry-level roles.
          Respond with only the 4 roles in a bullet-point list (no explanations).
          Resume content:\n\n${text}`,
        },
      ],
    });

    const analysis = aiResponse.choices[0].message.content;

    // Extract roles (bullet-point list)
    const roles = analysis.match(/- (.+)/g)?.map(r => r.replace('- ', '').trim()) || [];

    //scrape up to 3 jobs per role, stopping once we collect 10 in total
    let allJobs = [];
    for (const role of roles) {
      if (allJobs.length >= 10) break;

      const scraped = await scrapeTopJobs(role);

      for (const job of scraped) {
        if (allJobs.length >= 10) break;
        allJobs.push({ role, ...job });
      }
    }

    res.status(200).json({
      message: 'File uploaded and analyzed successfully',
      jobRoles: roles,   // 4 roles
      jobVacancies: allJobs, // up to 10 real vacancies
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
