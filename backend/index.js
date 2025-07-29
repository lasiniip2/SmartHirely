const express = require('express'); //core framework for creating the HTTP server and routing
const cors = require('cors'); //allows cross-origin requests
const multer = require('multer'); //middleware to handle file uploads
const path = require('path'); //Node.js module to handle file and directory paths

const app = express();
const PORT = 5000;

// Enable CORS for requests from frontend (port 4200)
app.use(cors());

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // upload files into the 'uploads' folder
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
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Handle POST file upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Later, you can analyze the file here or send it to AI logic
  res.status(200).json({ message: 'File uploaded successfully', filename: req.file.filename });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
