const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    
    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: imageUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  res.status(400).json({ error: error.message });
});

// Get all uploaded images
app.get('/images', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const images = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext);
      })
      .map(file => ({
        filename: file,
        url: `http://localhost:${PORT}/uploads/${file}`,
        path: path.join(uploadsDir, file)
      }));
    
    res.json(images);
  } catch (error) {
    console.error('Error reading images:', error);
    res.status(500).json({ error: 'Failed to read images' });
  }
});

// Simple HTML page to test uploads
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Image Upload Server</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .upload-form { border: 2px dashed #ccc; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .image-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
        .image-item { border: 1px solid #ddd; padding: 10px; border-radius: 8px; }
        .image-item img { width: 100%; height: 150px; object-fit: cover; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <h1>Image Upload Server</h1>
      
      <div class="upload-form">
        <h2>Upload Image</h2>
        <form id="uploadForm">
          <input type="file" id="imageInput" accept="image/*" required>
          <button type="submit">Upload</button>
        </form>
        <div id="uploadResult"></div>
      </div>

      <h2>Uploaded Images</h2>
      <button onclick="loadImages()">Refresh Images</button>
      <div id="imageList" class="image-list"></div>

      <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData();
          const fileInput = document.getElementById('imageInput');
          formData.append('image', fileInput.files[0]);
          
          try {
            const response = await fetch('/upload', {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
              document.getElementById('uploadResult').innerHTML = 
                '<p style="color: green;">Upload successful! <a href="' + result.url + '" target="_blank">View Image</a></p>';
              loadImages();
            } else {
              document.getElementById('uploadResult').innerHTML = 
                '<p style="color: red;">Upload failed: ' + result.error + '</p>';
            }
          } catch (error) {
            document.getElementById('uploadResult').innerHTML = 
              '<p style="color: red;">Upload failed: ' + error.message + '</p>';
          }
        });

        async function loadImages() {
          try {
            const response = await fetch('/images');
            const images = await response.json();
            
            const imageList = document.getElementById('imageList');
            imageList.innerHTML = '';
            
            images.forEach(image => {
              const div = document.createElement('div');
              div.className = 'image-item';
              div.innerHTML = \`
                <img src="\${image.url}" alt="\${image.filename}">
                <p><strong>\${image.filename}</strong></p>
                <a href="\${image.url}" target="_blank">View Full Size</a>
              \`;
              imageList.appendChild(div);
            });
          } catch (error) {
            console.error('Error loading images:', error);
          }
        }

        // Load images on page load
        loadImages();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Upload endpoint: http://localhost:${PORT}/upload`);
  console.log(`Images endpoint: http://localhost:${PORT}/images`);
}); 