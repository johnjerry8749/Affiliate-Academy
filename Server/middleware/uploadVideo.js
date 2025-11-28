import multer from 'multer';
import path from 'path';

// Configure multer for video uploads
const storage = multer.memoryStorage(); // Store in memory for direct upload to Bunny

// File filter to accept only video files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska'
  ];

  const allowedExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed (mp4, webm, ogg, mov, avi, mkv)'), false);
  }
};

// Configure multer
export const uploadVideo = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
}).single('video'); // 'video' is the field name

// Middleware wrapper with error handling
export const uploadMiddleware = (req, res, next) => {
  uploadVideo(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          message: 'File size too large. Maximum size is 500MB' 
        });
      }
      return res.status(400).json({ 
        message: `Upload error: ${err.message}` 
      });
    } else if (err) {
      return res.status(400).json({ 
        message: err.message 
      });
    }
    next();
  });
};
