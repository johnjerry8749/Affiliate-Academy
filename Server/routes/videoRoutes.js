import express from 'express';
import { 
  uploadVideo, 
  deleteVideo, 
  getVideoStream, 
  listVideos,
  updateVideoMetadata 
} from '../controller/videoController.js';
import { uploadMiddleware } from '../middleware/uploadVideo.js';
import { verifyAdminToken } from '../middleware/verifyAdminToken.js';

const router = express.Router();

/**
 * @route   POST /api/video/upload
 * @desc    Upload a video to Bunny Stream
 * @access  Admin only
 */
router.post('/upload', verifyAdminToken, uploadMiddleware, uploadVideo);

/**
 * @route   DELETE /api/video/:videoId
 * @desc    Delete a video from Bunny Stream
 * @access  Admin only
 */
router.delete('/:videoId', verifyAdminToken, deleteVideo);

/**
 * @route   GET /api/video/:videoId/stream
 * @desc    Get video streaming details
 * @access  Public
 */
router.get('/:videoId/stream', getVideoStream);

/**
 * @route   GET /api/video/list
 * @desc    List all videos
 * @access  Admin only
 */
router.get('/list', verifyAdminToken, listVideos);

/**
 * @route   PUT /api/video/:videoId/metadata
 * @desc    Update video metadata
 * @access  Admin only
 */
router.put('/:videoId/metadata', verifyAdminToken, updateVideoMetadata);

/**
 * @route   GET /api/video/test
 * @desc    Test route to verify video routes are working
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.json({ message: 'Video routes are working!' });
});

export default router;
