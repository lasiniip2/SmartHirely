const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('SmartHirely backend is running!');
});

// File upload route will go here

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
