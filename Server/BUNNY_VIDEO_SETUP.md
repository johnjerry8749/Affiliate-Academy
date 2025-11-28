# Bunny CDN Video Upload & Streaming - Usage Guide

## Backend Setup Complete ✅

The following components have been successfully implemented:

### Files Created:
1. **Config**: `Server/config/bunny.config.js`
2. **Service**: `Server/services/bunnyStreamService.js`
3. **Middleware**: `Server/middleware/uploadVideo.js`
4. **Controller**: `Server/controller/videoController.js`
5. **Routes**: `Server/routes/videoRoutes.js`

### Environment Variables Added:
```env
BUNNY_API_KEY=a0a90f0a-fe5a-461b-8fef-281297b01981
BUNNY_STREAM_LIBRARY_ID=551393
BUNNY_STREAM_API_KEY=364d38cb-ebdf-4397-ae4b9d977f44-ac94-4a91
BUNNY_STREAM_CDN_HOSTNAME=vz-71b67f06-1c7.b-cdn.net
```

## API Endpoints

### 1. Upload Video (Admin Only)
```
POST /api/video/upload
Headers: Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Body (form-data):
- video: [video file]
- title: "Video Title"
- courseId: (optional) "course-id-to-link"
```

**Example using cURL:**
```bash
curl -X POST http://localhost:5000/api/video/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "video=@/path/to/video.mp4" \
  -F "title=My Course Video" \
  -F "courseId=123"
```

**Example using JavaScript (Frontend):**
```javascript
const uploadVideo = async (videoFile, title, courseId) => {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('title', title);
  if (courseId) formData.append('courseId', courseId);

  const response = await fetch('http://localhost:5000/api/video/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: formData
  });

  return await response.json();
};
```

### 2. Delete Video (Admin Only)
```
DELETE /api/video/:videoId?courseId=<course-id>
Headers: Authorization: Bearer <admin-token>
```

**Example:**
```bash
curl -X DELETE "http://localhost:5000/api/video/abc123?courseId=456" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Get Video Stream (Public)
```
GET /api/video/:videoId/stream
```

**Example:**
```bash
curl http://localhost:5000/api/video/abc123/stream
```

**Response:**
```json
{
  "videoId": "abc123",
  "title": "My Course Video",
  "streamUrl": "https://vz-71b67f06-1c7.b-cdn.net/abc123/playlist.m3u8",
  "thumbnail": "https://vz-71b67f06-1c7.b-cdn.net/abc123/thumbnail.jpg",
  "duration": 120,
  "status": 4,
  "availableResolutions": ["240p", "360p", "720p", "1080p"]
}
```

### 4. List All Videos (Admin Only)
```
GET /api/video/list?page=1&itemsPerPage=100
Headers: Authorization: Bearer <admin-token>
```

### 5. Update Video Metadata (Admin Only)
```
PUT /api/video/:videoId/metadata
Headers: Authorization: Bearer <admin-token>
Content-Type: application/json

Body:
{
  "title": "Updated Title"
}
```

## Frontend Integration Example

### Video Upload Component (React)
```jsx
import React, { useState } from 'react';

const VideoUpload = ({ courseId }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    if (courseId) formData.append('courseId', courseId);

    try {
      const response = await fetch('/api/video/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('Upload successful:', data);
      alert('Video uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input
        type="text"
        placeholder="Video Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files[0])}
        required
      />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Video'}
      </button>
    </form>
  );
};

export default VideoUpload;
```

### Video Player Component (React)
```jsx
import React, { useEffect, useState } from 'react';

const VideoPlayer = ({ videoId }) => {
  const [videoData, setVideoData] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      const response = await fetch(`/api/video/${videoId}/stream`);
      const data = await response.json();
      setVideoData(data);
    };
    fetchVideo();
  }, [videoId]);

  if (!videoData) return <div>Loading...</div>;

  return (
    <div>
      <video
        controls
        poster={videoData.thumbnail}
        style={{ width: '100%', maxWidth: '800px' }}
      >
        <source src={videoData.streamUrl} type="application/x-mpegURL" />
        Your browser does not support HLS video playback.
      </video>
      <h3>{videoData.title}</h3>
      <p>Duration: {Math.floor(videoData.duration / 60)}:{videoData.duration % 60}</p>
    </div>
  );
};

export default VideoPlayer;
```

## Course Controller Integration

The video functionality automatically integrates with your existing course system. When you upload a video with a `courseId`, it will update the course record with:
- `video_id`: Bunny video ID
- `video_url`: Streaming URL
- `video_thumbnail`: Thumbnail URL
- `video_duration`: Video duration in seconds

## Supported Video Formats
- MP4
- WebM
- OGG
- MOV
- AVI
- MKV

## File Size Limit
- Maximum: 500MB per video

## Notes
- Videos are transcoded automatically by Bunny Stream
- Multiple resolutions are generated (240p, 360p, 720p, 1080p)
- HLS streaming format for adaptive bitrate
- Thumbnails are automatically generated
- Status codes: 1=Uploading, 2=Processing, 3=Encoding, 4=Ready, 5=Failed

## Testing
Server is running and video routes are working:
```bash
curl http://localhost:5000/api/video/test
# Response: {"message":"Video routes are working!"}
```

## Next Steps
1. Add video upload UI to admin panel
2. Add video player to course detail pages
3. Implement progress tracking for uploads
4. Add video management (edit/delete) interface
