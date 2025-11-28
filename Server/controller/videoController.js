import bunnyStreamService from '../services/bunnyStreamService.js';
import { supabase } from '../utils/supabaseClient.js';

/**
 * Upload a video to Bunny Stream and save metadata to database
 */
export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const { title, courseId } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Video title is required' });
    }

    // Upload video to Bunny Stream
    const videoData = await bunnyStreamService.uploadVideo(
      req.file.buffer,
      title
    );

    // If courseId is provided, update the course with video information
    if (courseId) {
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          video_id: videoData.videoId,
          video_url: videoData.streamUrl,
          video_thumbnail: videoData.thumbnail,
          video_duration: videoData.duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (updateError) {
        console.error('Error updating course with video:', updateError);
        // Note: Video is already uploaded to Bunny, so we still return success
      }
    }

    res.status(201).json({
      message: 'Video uploaded successfully',
      data: videoData
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ 
      message: 'Failed to upload video',
      error: error.message 
    });
  }
};

/**
 * Delete a video from Bunny Stream and update database
 */
export const deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { courseId } = req.query;

    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required' });
    }

    // Delete video from Bunny Stream
    await bunnyStreamService.deleteVideo(videoId);

    // If courseId is provided, remove video information from course
    if (courseId) {
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          video_id: null,
          video_url: null,
          video_thumbnail: null,
          video_duration: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (updateError) {
        console.error('Error removing video from course:', updateError);
      }
    }

    res.json({ 
      message: 'Video deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ 
      message: 'Failed to delete video',
      error: error.message 
    });
  }
};

/**
 * Get video details and streaming URL
 */
export const getVideoStream = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required' });
    }

    // Get video details from Bunny
    const videoDetails = await bunnyStreamService.getVideoDetails(videoId);

    const streamData = {
      videoId,
      title: videoDetails.title,
      streamUrl: bunnyStreamService.getStreamUrl(videoId),
      thumbnail: bunnyStreamService.getThumbnailUrl(videoId),
      duration: videoDetails.length,
      status: videoDetails.status,
      availableResolutions: videoDetails.availableResolutions
    };

    res.json(streamData);
  } catch (error) {
    console.error('Error getting video stream:', error);
    res.status(500).json({ 
      message: 'Failed to get video stream',
      error: error.message 
    });
  }
};

/**
 * List all videos
 */
export const listVideos = async (req, res) => {
  try {
    const { page = 1, itemsPerPage = 100 } = req.query;

    const videos = await bunnyStreamService.listVideos(
      parseInt(page),
      parseInt(itemsPerPage)
    );

    res.json(videos);
  } catch (error) {
    console.error('Error listing videos:', error);
    res.status(500).json({ 
      message: 'Failed to list videos',
      error: error.message 
    });
  }
};

/**
 * Update video metadata
 */
export const updateVideoMetadata = async (req, res) => {
  try {
    const { videoId } = req.params;
    const metadata = req.body;

    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required' });
    }

    const updatedVideo = await bunnyStreamService.updateVideoMetadata(
      videoId,
      metadata
    );

    res.json({
      message: 'Video metadata updated successfully',
      data: updatedVideo
    });
  } catch (error) {
    console.error('Error updating video metadata:', error);
    res.status(500).json({ 
      message: 'Failed to update video metadata',
      error: error.message 
    });
  }
};
