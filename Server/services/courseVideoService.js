// Course Video Management Service
// This service handles storing Bunny video metadata in Supabase courses table

import { supabase } from '../utils/supabaseClient.js';

// Bunny Stream service functions (inline for now since bunnyStreamService doesn't exist yet)
const bunnyService = {
  getStreamUrl: (videoId) => `https://vz-71b67f06-1c7.b-cdn.net/${videoId}/playlist.m3u8`,
  getThumbnailUrl: (videoId) => `https://vz-71b67f06-1c7.b-cdn.net/${videoId}/thumbnail.jpg`,
  getVideoDetails: async (videoId) => {
    // This would normally call Bunny API - simplified for now
    return {
      title: 'Video Title',
      length: 0,
      status: 4, // Ready
      encodeProgress: 100,
      availableResolutions: ['720p', '1080p'],
      storageSize: 0
    };
  },
  checkVideoStatus: async (videoId) => {
    return {
      status: 'ready',
      progress: 100,
      duration: 0,
      size: 0
    };
  },
  deleteVideo: async (videoId) => {
    // This would delete from Bunny - simplified for now
    return true;
  }
};

class CourseVideoService {
  
  /**
   * Associate a Bunny video with a course in Supabase
   * @param {string} courseId - The course ID in Supabase
   * @param {string} videoId - The Bunny video ID
   * @param {object} videoMetadata - Additional video metadata from Bunny
   */
  async linkVideoToCourse(courseId, videoId, videoMetadata = {}) {
    try {
      // Get video details from Bunny
      const bunnyVideoDetails = await bunnyService.getVideoDetails(videoId);
      
      // Prepare video data for Supabase
      const videoData = {
        video_id: videoId,
        course_video: bunnyService.getStreamUrl(videoId), // HLS stream URL
        video_thumbnail: bunnyService.getThumbnailUrl(videoId),
        video_title: bunnyVideoDetails.title || videoMetadata.title,
        video_duration: bunnyVideoDetails.length || 0,
        video_status: bunnyVideoDetails.status || 0,
        updated_at: new Date().toISOString()
      };

      // Update the course with video information
      const { data, error } = await supabase
        .from('courses')
        .update(videoData)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Video linked to course successfully',
        data: {
          courseId,
          videoId,
          streamUrl: videoData.course_video,
          thumbnail: videoData.video_thumbnail,
          course: data
        }
      };
    } catch (error) {
      console.error('Error linking video to course:', error);
      throw new Error(`Failed to link video to course: ${error.message}`);
    }
  }

  /**
   * Remove video association from a course
   * @param {string} courseId - The course ID in Supabase
   */
  async unlinkVideoFromCourse(courseId) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update({
          video_id: null,
          course_video: null,
          video_thumbnail: null,
          video_title: null,
          video_duration: null,
          video_status: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Video unlinked from course successfully',
        data
      };
    } catch (error) {
      console.error('Error unlinking video from course:', error);
      throw new Error(`Failed to unlink video from course: ${error.message}`);
    }
  }

  /**
   * Get course with video information
   * @param {string} courseId - The course ID in Supabase
   */
  async getCourseWithVideo(courseId) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;

      // If course has a video, get additional Bunny details
      if (data.video_id) {
        try {
          const bunnyDetails = await bunnyService.getVideoDetails(data.video_id);
          data.video_details = {
            bunnyStatus: bunnyDetails.status,
            encodingProgress: bunnyDetails.encodeProgress,
            availableResolutions: bunnyDetails.availableResolutions,
            storageSize: bunnyDetails.storageSize
          };
        } catch (videoError) {
          console.warn('Could not fetch Bunny video details:', videoError.message);
          data.video_details = null;
        }
      }

      return data;
    } catch (error) {
      console.error('Error getting course with video:', error);
      throw new Error(`Failed to get course: ${error.message}`);
    }
  }

  /**
   * Upload video to Bunny and link to course in one operation
   * @param {Buffer} videoBuffer - The video file buffer
   * @param {string} title - Video title
   * @param {string} courseId - Course ID to link the video to
   */
  async uploadAndLinkVideo(videoBuffer, title, courseId) {
    try {
      // Upload to Bunny first
      const bunnyResult = await bunnyService.uploadVideo(videoBuffer, title);
      
      // Link to course in Supabase
      const linkResult = await this.linkVideoToCourse(courseId, bunnyResult.videoId, {
        title: title
      });

      return {
        success: true,
        message: 'Video uploaded and linked successfully',
        data: {
          ...bunnyResult,
          courseLink: linkResult.data
        }
      };
    } catch (error) {
      console.error('Error uploading and linking video:', error);
      throw new Error(`Failed to upload and link video: ${error.message}`);
    }
  }

  /**
   * Delete video from Bunny and remove from course
   * @param {string} courseId - Course ID
   * @param {string} videoId - Bunny video ID
   */
  async deleteVideoAndUnlink(courseId, videoId) {
    try {
      // Remove from Bunny first
      await bunnyService.deleteVideo(videoId);
      
      // Unlink from course
      const unlinkResult = await this.unlinkVideoFromCourse(courseId);

      return {
        success: true,
        message: 'Video deleted and unlinked successfully',
        data: unlinkResult.data
      };
    } catch (error) {
      console.error('Error deleting video and unlinking:', error);
      throw new Error(`Failed to delete and unlink video: ${error.message}`);
    }
  }

  /**
   * Get all courses with their video information
   */
  async getAllCoursesWithVideos() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enhance with video status for courses that have videos
      const enhancedCourses = await Promise.all(
        data.map(async (course) => {
          if (course.video_id) {
            try {
              const videoStatus = await bunnyService.checkVideoStatus(course.video_id);
              course.video_processing_status = videoStatus;
            } catch (error) {
              course.video_processing_status = { status: 'error', error: error.message };
            }
          }
          return course;
        })
      );

      return enhancedCourses;
    } catch (error) {
      console.error('Error getting courses with videos:', error);
      throw new Error(`Failed to get courses: ${error.message}`);
    }
  }

  /**
   * Sync video status from Bunny to Supabase for a specific course
   * @param {string} courseId - Course ID
   */
  async syncVideoStatus(courseId) {
    try {
      const course = await this.getCourseWithVideo(courseId);
      
      if (!course.video_id) {
        return { success: false, message: 'Course has no associated video' };
      }

      const videoStatus = await bunnyService.checkVideoStatus(course.video_id);
      
      // Update course with latest video status
      const { data, error } = await supabase
        .from('courses')
        .update({
          video_status: videoStatus.status === 'ready' ? 4 : (videoStatus.status === 'processing' ? 2 : 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Video status synced successfully',
        data: { ...data, video_processing_status: videoStatus }
      };
    } catch (error) {
      console.error('Error syncing video status:', error);
      throw new Error(`Failed to sync video status: ${error.message}`);
    }
  }
}

export default new CourseVideoService();