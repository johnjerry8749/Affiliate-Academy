import React, { useState, useEffect } from 'react';
import AdminSidebar from '../adminLayout/AdminSidebar';
import Smallfooter from '../../Users/UserLayout/smallfooter';
import { supabase } from '../../../../supabase';
import { uploadcourse, fetchCourses as fetchCoursesAPI, updateCourse, deleteCourse } from '../../../api/adminApi';

/**
 * Video uploads are handled through Supabase Storage directly.
 * Ensure you have a 'videos' bucket created in Supabase Storage.
 */

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    commission: '',
    features: '',
    status: 'active',
    course_video: ''
  });

  // Live Alert Function
  const showLiveAlert = (message, type = 'success') => {
    const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
    if (!alertPlaceholder) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    alertPlaceholder.append(wrapper);

    setTimeout(() => {
      wrapper.remove();
    }, 5000);
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchCourses();
    
    const checkSidebarState = () => {
      const sidebar = document.querySelector('.admin-sidebar');
      if (sidebar) {
        setIsSidebarCollapsed(sidebar.classList.contains('collapsed'));
      }
    };

    checkSidebarState();

    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) {
      const observer = new MutationObserver(checkSidebarState);
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
      
      return () => observer.disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showLiveAlert('Authentication required. Please login again.', 'danger');
        return;
      }

      const data = await fetchCoursesAPI(token);
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      showLiveAlert('Failed to fetch courses', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      showLiveAlert('Please upload a valid video file (MP4, WebM, OGG, or MOV)', 'danger');
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      showLiveAlert('Video file size must be less than 500MB', 'danger');
      return;
    }

    try {
      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `course-videos/${fileName}`;

      // Upload to Supabase Storage (kept for video storage only)
      const { error } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // Update form data with video URL
      setFormData(prev => ({
        ...prev,
        course_video: publicUrl
      }));

      showLiveAlert('Video uploaded successfully!', 'success');
    } catch (error) {
      console.error('Error uploading video:', error);
      showLiveAlert('Failed to upload video: ' + error.message, 'danger');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Get admin token from localStorage
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showLiveAlert('Authentication required. Please login again.', 'danger');
        return;
      }

      // Convert features from string to array if needed
      const featuresArray = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const courseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        commission: formData.commission ? parseFloat(formData.commission) : 0,
        price: formData.price ? parseFloat(formData.price) : 0,
        features: featuresArray,
        status: formData.status,
        image_url: formData.image_url,
        course_url: formData.course_url,
        course_video: formData.course_video,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Use axios API to upload course
      await uploadcourse(courseData, token);

      showLiveAlert('Course added successfully!', 'success');
      setFormData({
        title: '',
        description: '',
        category: '',
        commission: '',
        price: '',
        features: '',
        status: 'active',
        course_video: ''
      });
      setShowAddForm(false);
      fetchCourses();
    } catch (error) {
      console.error('Error adding course:', error);
      showLiveAlert('Failed to add course: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      category: course.category || '',
      commission: course.commission || '',
      features: Array.isArray(course.features) ? course.features.join('\n') : '',
      status: course.status || 'active',
      course_video: course.course_video || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const token = localStorage.getItem('adminToken');
      if (!token) {
        showLiveAlert('Authentication required. Please login again.', 'danger');
        return;
      }

      const featuresArray = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const courseData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        commission: formData.commission ? parseFloat(formData.commission) : 0,
        features: featuresArray,
        status: formData.status,
        image_url: formData.image_url,
        course_url: formData.course_url,
        course_video: formData.course_video,
        updated_at: new Date().toISOString()
      };

      await updateCourse(selectedCourse.id, courseData, token);

      showLiveAlert('Course updated successfully!', 'success');
      setShowEditModal(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      showLiveAlert('Failed to update course: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        showLiveAlert('Authentication required. Please login again.', 'danger');
        return;
      }

      await deleteCourse(courseId, token);
      showLiveAlert('Course deleted successfully!', 'success');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      showLiveAlert('Failed to delete course: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout d-flex">
      <AdminSidebar />
      
      {/* Live Alert Placeholder */}
      <div 
        id="liveAlertPlaceholder" 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          minWidth: '300px'
        }}
      ></div>
      
      <div 
        className="admin-content admin-responsive-content flex-grow-1 d-flex flex-column" 
        style={{ 
          backgroundColor: 'white', 
          minHeight: '100vh',
          marginLeft: windowWidth > 991 ? (isSidebarCollapsed ? '70px' : '280px') : '0',
          transition: 'margin-left 0.3s ease',
          width: windowWidth > 991 ? (isSidebarCollapsed ? 'calc(100% - 70px)' : 'calc(100% - 280px)') : '100%'
        }}
      >
        <div className="flex-grow-1 px-3 px-md-4" style={{ paddingTop: '80px' }}>
          {/* Header */}
          <div className="mb-4 pt-3">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <div>
                <h1 className="h4 mb-1 text-dark fw-bold">Course Management</h1>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>Add and manage courses</p>
              </div>
              <button 
                className="btn btn-primary mt-3 mt-md-0"
                onClick={() => {
                  if (!showAddForm) {
                    // Reset form data when opening add form
                    setFormData({
                      title: '',
                      description: '',
                      category: '',
                      commission: '',
                      price: '',
                      features: '',
                      status: 'active',
                      course_video: ''
                    });
                  }
                  setShowAddForm(!showAddForm);
                }}
              >
                <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
                {showAddForm ? 'Cancel' : 'Add New Course'}
              </button>
            </div>
          </div>

          {/* Add Course Form */}
          {showAddForm && (
            <div className="card shadow-sm mb-4" style={{ position: 'relative', zIndex: 1, backgroundColor: '#fff' }}>
              <div className="card-body p-3 p-md-4">
                <h5 className="card-title mb-4" style={{ color: '#000' }}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Add New Course
                </h5>
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    {/* Title */}
                    <div className="col-md-6">
                      <label className="form-label" style={{ color: '#000' }}>Course Title</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter course title"
                        style={{ backgroundColor: '#fff', color: '#000' }}
                      />
                    </div>

                    {/* Category */}
                    <div className="col-md-6">
                      <label className="form-label" style={{ color: '#000' }}>Category</label>
                      <input
                        type="text"
                        className="form-control"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        placeholder="e.g., Programming, Marketing, Design"
                        style={{ backgroundColor: '#fff', color: '#000' }}
                      />
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label" style={{ color: '#000' }}>Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Enter course description"
                        style={{ backgroundColor: '#fff', color: '#000' }}
                      ></textarea>
                    </div>

                    {/* Commission */}
                    <div className="col-md-6">
                      <label className="form-label" style={{ color: '#000' }}>Commission (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="commission"
                        value={formData.commission}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0.00"
                        style={{ backgroundColor: '#fff', color: '#000' }}
                      />
                      <small className="text-muted">Percentage earned from referral deposits</small>
                    </div>

                    {/* Status */}
                    <div className="col-md-6">
                      <label className="form-label" style={{ color: '#000' }}>Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        style={{ backgroundColor: '#fff', color: '#000' }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>

                    {/* Video Upload */}
                    <div className="col-12">
                      <label className="form-label" style={{ color: '#000' }}>Course Video <span className="text-danger">*</span></label>
                      <input
                        type="file"
                        className="form-control"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime"
                        onChange={handleVideoUpload}
                        disabled={uploading}
                        style={{ backgroundColor: '#fff', color: '#000' }}
                      />
                      <small className="text-muted d-block mt-1">
                        Upload video file (MP4, WebM, OGG, MOV - Max 500MB). This video will be displayed when users access the course.
                      </small>
                      {uploading && (
                        <div className="mt-2">
                          <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                            <span className="visually-hidden">Uploading...</span>
                          </div>
                          <small className="text-primary">Uploading video...</small>
                        </div>
                      )}
                      {formData.course_video && !uploading && (
                        <div className="mt-2">
                          <small className="text-success">
                            <i className="bi bi-check-circle-fill me-1"></i>
                            Video uploaded successfully
                          </small>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="col-12">
                      <label className="form-label" style={{ color: '#000' }}>Features (One per line)</label>
                      <textarea
                        className="form-control"
                        name="features"
                        value={formData.features}
                        onChange={handleInputChange}
                        rows="5"
                        placeholder="Enter each feature on a new line&#10;Feature 1&#10;Feature 2&#10;Feature 3"
                        style={{ backgroundColor: '#fff', color: '#000' }}
                      ></textarea>
                      <small className="text-muted">Enter each feature on a new line</small>
                    </div>

                    {/* Submit Button */}
                    <div className="col-12">
                      <hr />
                      <div className="d-flex gap-2 justify-content-end">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => setShowAddForm(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Adding...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-lg me-2"></i>
                              Add Course
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Courses List */}
          <div className="card shadow-sm" style={{ backgroundColor: '#fff' }}>
            <div className="card-body p-0" style={{ backgroundColor: '#fff' }}>
              {loading && !showAddForm ? (
                <div className="text-center py-5" style={{ backgroundColor: '#fff' }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3 text-muted">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-5" style={{ backgroundColor: '#fff' }}>
                  <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <p className="mt-3 text-muted">No courses found. Add your first course!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th className="border-0 py-3 ps-4">Course</th>
                        <th className="border-0 py-3 d-none d-md-table-cell">Category</th>
                        <th className="border-0 py-3 d-none d-lg-table-cell">Commission</th>
                        <th className="border-0 py-3">Status</th>
                        <th className="border-0 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course.id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              {course.image_url ? (
                                <img 
                                  src={course.image_url} 
                                  alt={course.title}
                                  className="me-3"
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '8px',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : (
                                <div 
                                  className="me-3"
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '8px',
                                    backgroundColor: '#e9ecef',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <i className="bi bi-book" style={{ fontSize: '1.5rem', color: '#6c757d' }}></i>
                                </div>
                              )}
                              <div>
                                <div className="fw-medium">{course.title}</div>
                                <small className="text-muted d-block" style={{ 
                                  maxWidth: '300px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {course.description}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <span className="badge bg-info text-dark">{course.category}</span>
                          </td>
                          <td className="text-success d-none d-lg-table-cell">{course.commission}%</td>
                          <td>
                            <span className={`badge ${
                              course.status === 'active' ? 'bg-success' : 
                              course.status === 'inactive' ? 'bg-danger' : 
                              'bg-secondary'
                            }`}>
                              {course.status}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-sm btn-outline-primary" 
                                title="Edit"
                                onClick={() => handleEditCourse(course)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                title="Delete"
                                onClick={() => handleDeleteCourse(course.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="mt-auto w-100">
          <Smallfooter />
        </div>
      </div>

      {/* Edit Course Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '600px',
          height: '100vh',
          backgroundColor: 'white',
          boxShadow: '-2px 0 1px rgba(0,0,0,0.1)',
          zIndex: 9999,
          overflowY: 'auto',
          transform: showEditModal ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out'
        }}>
          <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>
                Edit Course
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCourse(null);
                }}
              ></button>
            </div>
            <hr />

            <form onSubmit={handleUpdateCourse}>
              <div className="row g-3">
                {/* Title */}
                <div className="col-12">
                  <label className="form-label">Course Title</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter course title"
                  />
                </div>

                {/* Category */}
                <div className="col-12">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Programming, Marketing, Design"
                  />
                </div>

                {/* Description */}
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Enter course description"
                  ></textarea>
                </div>

                {/* Commission */}
                <div className="col-12">
                  <label className="form-label">Commission (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="commission"
                    value={formData.commission}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <small className="text-muted">Percentage earned from referral deposits</small>
                </div>

                {/* Status */}
                <div className="col-12">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                {/* Video Upload */}
                <div className="col-12">
                  <label className="form-label">Course Video</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                  />
                  <small className="text-muted d-block mt-1">
                    Upload new video file (MP4, WebM, OGG, MOV - Max 500MB) or keep existing video.
                  </small>
                  {uploading && (
                    <div className="mt-2">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                        <span className="visually-hidden">Uploading...</span>
                      </div>
                      <small className="text-primary">Uploading video...</small>
                    </div>
                  )}
                  {formData.course_video && !uploading && (
                    <div className="mt-2">
                      <small className="text-success">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Video available
                      </small>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="col-12">
                  <label className="form-label">Features (One per line)</label>
                  <textarea
                    className="form-control"
                    name="features"
                    value={formData.features}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="Enter each feature on a new line"
                  ></textarea>
                  <small className="text-muted">Enter each feature on a new line</small>
                </div>

                {/* Submit Button */}
                <div className="col-12">
                  <hr />
                  <div className="d-flex gap-2 justify-content-end">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedCourse(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Update Course
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;