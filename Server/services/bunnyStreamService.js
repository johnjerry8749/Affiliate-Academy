import axios from 'axios';
import FormData from 'form-data';
import { bunnyConfig } from '../config/bunny.config.js';
import fs from 'fs';

class BunnyStreamService {
  constructor() {
    this.libraryId = bunnyConfig.streamLibraryId;
    this.apiKey = bunnyConfig.streamApiKey;
    this.baseUrl = `${bunnyConfig.streamApiUrl}/${this.libraryId}`;
    this.cdnHostname = bunnyConfig.streamCdnHostname;
  }

  /**
   * Upload a video to Bunny Stream
   * @param {Buffer|Stream} videoFile - The video file buffer or stream
   * @param {string} title - Video title
   * @returns {Promise<Object>} - Video details including videoId
   */
  async uploadVideo(videoFile, title) {
    try {
      // Step 1: Create a video object
      const createResponse = await axios.post(
        `${this.baseUrl}/videos`,
        { title },
        {
          headers: {
            'AccessKey': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const videoId = createResponse.data.guid;

      // Step 2: Upload the video file
      const uploadUrl = `${this.baseUrl}/videos/${videoId}`;
      
      await axios.put(uploadUrl, videoFile, {
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/octet-stream'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      // Step 3: Get video details
      const videoDetails = await this.getVideoDetails(videoId);

      return {
        videoId,
        title: videoDetails.title,
        thumbnail: `https://${this.cdnHostname}/${videoId}/thumbnail.jpg`,
        streamUrl: `https://${this.cdnHostname}/${videoId}/playlist.m3u8`,
        status: videoDetails.status,
        duration: videoDetails.length
      };
    } catch (error) {
      console.error('Error uploading video to Bunny:', error.response?.data || error.message);
      throw new Error('Failed to upload video to Bunny Stream');
    }
  }

  /**
   * Get video details from Bunny Stream
   * @param {string} videoId - The Bunny video ID
   * @returns {Promise<Object>} - Video details
   */
  async getVideoDetails(videoId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/videos/${videoId}`,
        {
          headers: {
            'AccessKey': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching video details:', error.response?.data || error.message);
      throw new Error('Failed to fetch video details');
    }
  }

  /**
   * Delete a video from Bunny Stream
   * @param {string} videoId - The Bunny video ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteVideo(videoId) {
    try {
      await axios.delete(
        `${this.baseUrl}/videos/${videoId}`,
        {
          headers: {
            'AccessKey': this.apiKey
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error deleting video from Bunny:', error.response?.data || error.message);
      throw new Error('Failed to delete video from Bunny Stream');
    }
  }

  /**
   * Get streaming URL for a video
   * @param {string} videoId - The Bunny video ID
   * @returns {string} - HLS streaming URL
   */
  getStreamUrl(videoId) {
    return `https://${this.cdnHostname}/${videoId}/playlist.m3u8`;
  }

  /**
   * Get thumbnail URL for a video
   * @param {string} videoId - The Bunny video ID
   * @returns {string} - Thumbnail URL
   */
  getThumbnailUrl(videoId) {
    return `https://${this.cdnHostname}/${videoId}/thumbnail.jpg`;
  }

  /**
   * List all videos in the library
   * @param {number} page - Page number
   * @param {number} itemsPerPage - Items per page
   * @returns {Promise<Object>} - List of videos
   */
  async listVideos(page = 1, itemsPerPage = 100) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/videos`,
        {
          headers: {
            'AccessKey': this.apiKey
          },
          params: {
            page,
            itemsPerPage
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error listing videos:', error.response?.data || error.message);
      throw new Error('Failed to list videos');
    }
  }

  /**
   * Update video metadata
   * @param {string} videoId - The Bunny video ID
   * @param {Object} metadata - Metadata to update (title, etc.)
   * @returns {Promise<Object>} - Updated video details
   */
  async updateVideoMetadata(videoId, metadata) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/videos/${videoId}`,
        metadata,
        {
          headers: {
            'AccessKey': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating video metadata:', error.response?.data || error.message);
      throw new Error('Failed to update video metadata');
    }
  }
}

export default new BunnyStreamService();
