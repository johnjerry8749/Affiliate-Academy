import { supabase } from '../utils/supabaseClient.js';
import courseVideoService from '../services/courseVideoService.js';

// Get all courses
export const getAllCourses = async (req, res) => {
  try {
    console.log('=== FETCH COURSES REQUEST ===');
    
    // Use the course video service to get courses with video information
    const coursesWithVideos = await courseVideoService.getAllCoursesWithVideos();
    
    console.log(`Fetched ${coursesWithVideos.length} courses with video data`);
    res.json(coursesWithVideos || []);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ 
      message: 'Failed to fetch courses',
      error: error.message 
    });
  }
};

// Create a new course
export const createCourse = async (req, res) => {
  try {
    console.log('=== CREATE COURSE REQUEST ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User from token:', req.admin);
    
    // Validate required fields
    const { title, description, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, description, and category are required',
        receivedFields: Object.keys(req.body)
      });
    }
    
    const courseData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Processed course data for insert:', courseData);

    // Test supabase connection first
    console.log('Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('Supabase connection test failed:', testError);
      return res.status(500).json({ 
        message: 'Database connection failed',
        error: testError.message
      });
    }
    
    console.log('Supabase connection successful, inserting course...');
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single();

    if (error) {
      console.error('=== SUPABASE INSERT ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error code:', error.code);
      
      return res.status(400).json({ 
        message: 'Database insert failed',
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }

    console.log('Course created successfully:', data);
    res.status(201).json({ message: 'Course created successfully', data });
  } catch (error) {
    console.error('=== CATCH ERROR ===');
    console.error('Error creating course:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while creating course',
      error: error.message,
      stack: error.stack
    });
  }
};

// Update a course
export const updateCourse = async (req, res) => {
  const { id } = req.params;

  try {
    console.log('=== UPDATE COURSE REQUEST ===');
    console.log('Course ID:', id);
    console.log('Update data:', req.body);
    
    if (!id) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    const courseData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    console.log('Processed update data:', courseData);

    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('=== SUPABASE UPDATE ERROR ===');
      console.error('Error:', error);
      return res.status(400).json({ 
        message: 'Database update failed',
        error: error.message,
        details: error.details,
        hint: error.hint
      });
    }

    if (!data) {
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('Course updated successfully:', data);
    res.json({ message: 'Course updated successfully', data });
  } catch (error) {
    console.error('=== UPDATE CATCH ERROR ===');
    console.error('Error updating course:', error);
    res.status(500).json({ 
      message: 'Server error while updating course',
      error: error.message 
    });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    console.log('=== DELETE COURSE REQUEST ===');
    console.log('Course ID:', id);

    // First check if course has a video and delete it from Bunny
    const course = await courseVideoService.getCourseWithVideo(id);
    if (course.video_id) {
      console.log('Deleting associated video from Bunny:', course.video_id);
      try {
        await courseVideoService.deleteVideoAndUnlink(id, course.video_id);
      } catch (videoError) {
        console.warn('Could not delete video from Bunny:', videoError.message);
        // Continue with course deletion even if video deletion fails
      }
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log('Course deleted successfully');
    res.json({ message: 'Course and associated video deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ 
      message: 'Failed to delete course',
      error: error.message 
    });
  }
};

// Link existing Bunny video to course
export const linkVideoToCourse = async (req, res) => {
  const { courseId } = req.params;
  const { videoId, title } = req.body;

  try {
    console.log('=== LINK VIDEO TO COURSE ===');
    console.log('Course ID:', courseId);
    console.log('Video ID:', videoId);

    const result = await courseVideoService.linkVideoToCourse(courseId, videoId, { title });
    
    res.json(result);
  } catch (error) {
    console.error('Error linking video to course:', error);
    res.status(500).json({ 
      message: 'Failed to link video to course',
      error: error.message 
    });
  }
};

// Unlink video from course
export const unlinkVideoFromCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    console.log('=== UNLINK VIDEO FROM COURSE ===');
    console.log('Course ID:', courseId);

    const result = await courseVideoService.unlinkVideoFromCourse(courseId);
    
    res.json(result);
  } catch (error) {
    console.error('Error unlinking video from course:', error);
    res.status(500).json({ 
      message: 'Failed to unlink video from course',
      error: error.message 
    });
  }
};

// Get course with detailed video information
export const getCourseWithVideo = async (req, res) => {
  const { id } = req.params;

  try {
    console.log('=== GET COURSE WITH VIDEO ===');
    console.log('Course ID:', id);

    const course = await courseVideoService.getCourseWithVideo(id);
    
    res.json(course);
  } catch (error) {
    console.error('Error getting course with video:', error);
    res.status(500).json({ 
      message: 'Failed to get course with video',
      error: error.message 
    });
  }
};

// Sync video status from Bunny
export const syncVideoStatus = async (req, res) => {
  const { courseId } = req.params;

  try {
    console.log('=== SYNC VIDEO STATUS ===');
    console.log('Course ID:', courseId);

    const result = await courseVideoService.syncVideoStatus(courseId);
    
    res.json(result);
  } catch (error) {
    console.error('Error syncing video status:', error);
    res.status(500).json({ 
      message: 'Failed to sync video status',
      error: error.message 
    });
  }
};
