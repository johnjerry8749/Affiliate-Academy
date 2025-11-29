// Bunny CDN API Service
class BunnyService {
  constructor() {
    this.apiKey = 'a0a90f0a-fe5a-461b-8fef-281297b01981';
    this.streamLibraryId = '551393';
    this.streamApiKey = '364d38cb-ebdf-4397-ae4b9d977f44-ac94-4a91';
    this.cdnHostname = 'vz-71b67f06-1c7.b-cdn.net';
    this.baseUrl = 'https://api.bunny.net';
    this.streamBaseUrl = 'https://video.bunnycdn.com';
  }

  // Get all videos from Bunny Stream Library
  async getVideos(page = 1, itemsPerPage = 100) {
    try {
      const response = await fetch(
        `${this.streamBaseUrl}/library/${this.streamLibraryId}/videos?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=date`,
        {
          method: 'GET',
          headers: {
            'AccessKey': this.streamApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching videos from Bunny:', error);
      throw error;
    }
  }

  // Get video details by ID
  async getVideoById(videoId) {
    try {
      const response = await fetch(
        `${this.streamBaseUrl}/library/${this.streamLibraryId}/videos/${videoId}`,
        {
          method: 'GET',
          headers: {
            'AccessKey': this.streamApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching video details from Bunny:', error);
      throw error;
    }
  }

  // Upload video to Bunny Stream
  async uploadVideo(file, title) {
    try {
      // Step 1: Create video entry
      const createResponse = await fetch(
        `${this.streamBaseUrl}/library/${this.streamLibraryId}/videos`,
        {
          method: 'POST',
          headers: {
            'AccessKey': this.streamApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title })
        }
      );

      if (!createResponse.ok) {
        throw new Error(`Failed to create video entry: ${createResponse.status}`);
      }

      const videoData = await createResponse.json();
      const videoId = videoData.guid;

      // Step 2: Upload video file
      const uploadResponse = await fetch(
        `${this.streamBaseUrl}/library/${this.streamLibraryId}/videos/${videoId}`,
        {
          method: 'PUT',
          headers: {
            'AccessKey': this.streamApiKey
          },
          body: file
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload video: ${uploadResponse.status}`);
      }

      return {
        videoId,
        title,
        streamUrl: this.getStreamUrl(videoId),
        thumbnail: this.getThumbnailUrl(videoId),
        status: 'uploading'
      };
    } catch (error) {
      console.error('Error uploading video to Bunny:', error);
      throw error;
    }
  }

  // Delete video from Bunny Stream
  async deleteVideo(videoId) {
    try {
      const response = await fetch(
        `${this.streamBaseUrl}/library/${this.streamLibraryId}/videos/${videoId}`,
        {
          method: 'DELETE',
          headers: {
            'AccessKey': this.streamApiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete video: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting video from Bunny:', error);
      throw error;
    }
  }

  // Get stream URL for video playback
  getStreamUrl(videoId) {
    return `https://${this.cdnHostname}/${videoId}/playlist.m3u8`;
  }

  // Get thumbnail URL
  getThumbnailUrl(videoId) {
    return `https://${this.cdnHostname}/${videoId}/thumbnail.jpg`;
  }

  // Get video embed URL
  getEmbedUrl(videoId) {
    return `https://iframe.mediadelivery.net/embed/${this.streamLibraryId}/${videoId}`;
  }

  // Check video processing status
  async checkVideoStatus(videoId) {
    try {
      const video = await this.getVideoById(videoId);
      
      // Status: 0 = Created, 1 = Uploaded, 2 = Processing, 3 = Transcoding, 4 = Finished, 5 = Error
      const statusMap = {
        0: 'created',
        1: 'uploaded', 
        2: 'processing',
        3: 'transcoding',
        4: 'ready',
        5: 'error'
      };

      return {
        status: statusMap[video.status] || 'unknown',
        progress: video.encodeProgress || 0,
        duration: video.length || 0,
        size: video.storageSize || 0
      };
    } catch (error) {
      console.error('Error checking video status:', error);
      throw error;
    }
  }
}

export default new BunnyService();