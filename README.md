# Image Upload Server

A simple Node.js server that allows you to upload images and view them through a web interface.

## Features

- Upload images via API endpoint
- View uploaded images through web interface
- Automatic unique filename generation
- File type validation (images only)
- File size limit (10MB)
- CORS enabled for cross-origin requests
- Simple web UI for testing

## Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## API Endpoints

### Upload Image
- **POST** `/upload`
- **Content-Type**: `multipart/form-data`
- **Field name**: `image`
- **Response**: JSON with upload details including image URL

Example using curl:
```bash
curl -X POST -F "image=@/path/to/your/image.jpg" http://localhost:3001/upload
```

### Get All Images
- **GET** `/images`
- **Response**: JSON array of all uploaded images

### View Image
- **GET** `/uploads/{filename}`
- **Response**: The actual image file

## Web Interface

Visit `http://localhost:3001` to access the web interface where you can:
- Upload images using a file picker
- View all uploaded images in a grid
- Click on images to view them full size

## File Storage

Images are stored in the `uploads/` directory (created automatically) with unique filenames to prevent conflicts.

## Configuration

You can modify the following in `server.js`:
- Port number (default: 3001)
- File size limit (default: 10MB)
- Allowed file types (currently all image types)
- Upload directory location 