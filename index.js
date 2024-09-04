const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Set up body parser and multer
app.use(bodyParser.json());
const upload = multer({ dest: 'uploads/' });

// Google API setup
const KEYFILEPATH = path.join(__dirname, './smsadarsh-filestorage-90476ac39afe.json');  //Path to the credentials JSON file
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Authenticate with Google
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

// Initialize Google Drive API client
const drive = google.drive({ version: 'v3', auth });

// Upload file route
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = path.join(__dirname, req.file.path);

    const response = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        mimeType: req.file.mimetype,
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(filePath),
      },
    });

    // Delete the file from the server after upload
    fs.unlinkSync(filePath);

    res.status(200).json({ fileId: response.data.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download file route
app.get('/download/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;

    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    response.data
      .on('end', () => {
        console.log('Download complete.');
      })
      .on('error', (err) => {
        console.error('Error downloading file.');
      })
      .pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
