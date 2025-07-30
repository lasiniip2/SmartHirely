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
  const url = `https://topjobs.lk/search?keywords=${encodeURIComponent(keyword)}&location=`;

  try {
    console.log(`Scraping for keyword: "${keyword}"`);
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const $ = cheerio.load(data);

    const results = [];

    // Try different selectors
    const jobSelectors = [
      '.job-title a',
      '.vacancy-title',
      'a[href*="vacancy"]',
      '.job-link',
      'h3 a'
    ];

    for (const selector of jobSelectors) {
      $(selector).each((i, el) => {
        const title = $(el).text().trim();
        const link = $(el).attr('href');
        
        if (title && link) {
          const fullLink = link.startsWith('http') ? link : 'https://topjobs.lk' + link;
          results.push({ title, link: fullLink });
        }
      });

      if (results.length > 0) {
        console.log(`Found ${results.length} jobs using selector: ${selector}`);
        break;
      }
    }

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
          Analyze the following resume and recommend the **top 5 most suitable job roles**.
          If the resume seems to belong to a student or someone seeking training, include internships or entry-level roles.
          Respond with only the 5 roles in a bullet-point list (no explanations).
          Resume content:\n\n${text}`,
        },
      ],
    });

    const analysis = aiResponse.choices[0].message.content;

    // Extract roles (bullet-point list)
    const roles = analysis.match(/- (.+)/g)?.map(r => r.replace('- ', '').trim()) || [];

    //scrape jobs from all roles and distribute evenly (3 jobs per role = 15 total)
    let allJobs = [];
    const jobsPerRole = Math.floor(15 / roles.length); // 3 jobs per role if 5 roles
    const extraJobs = 15 % roles.length; // handle remainder

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const scraped = await scrapeTopJobs(role);
      
      // Take 3 jobs per role, plus 1 extra for first few roles if needed
      const jobsToTake = jobsPerRole + (i < extraJobs ? 1 : 0);
      const selectedJobs = scraped.slice(0, jobsToTake);
      
      for (const job of selectedJobs) {
        allJobs.push({ role, ...job });
      }
      
      console.log(`Added ${selectedJobs.length} jobs for role: ${role}`);
    }

    res.status(200).json({
      message: 'File uploaded and analyzed successfully',
      jobRoles: roles,   // 5 roles
      jobVacancies: allJobs, // exactly 15 vacancies (3 per role)
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
